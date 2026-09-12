/**
 * Unit tests for the OpenRouter forced-tool-call request shape and error mapping.
 *
 * `global.fetch` is stubbed, so these make NO network call and need NO key —
 * they run in CI alongside the scoring-rule tests. They exist because the live
 * smoke test is the only other thing that exercises this file, and that needs
 * both a key and reachable egress.
 *
 * The contract under test: each pass declares exactly ONE function, forces it
 * with tool_choice, and accepts only a single correctly-named, schema-valid
 * tool call. Prose in message.content is never an answer.
 *
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const constants = require(resolve(root, ".smoke-build/rules/constants.js"));
const { extractRawLines, classifyLines, ScanPipelineError } = require(
  resolve(root, ".smoke-build/vision/pipeline.js"),
);

const VALID_EXTRACTION = {
  lines: [{ lineText: "WHL MLK", packSize: "6/1 GAL", quantity: "2", legible: true }],
};
const EXTRACT_ARGS = JSON.stringify(VALID_EXTRACTION);
const EXTRACT_TOOL = constants.EXTRACT_TOOL_NAME;
const CLASSIFY_TOOL = constants.CLASSIFY_TOOL_NAME;

/** OpenRouter-shaped envelope carrying one forced tool call. */
function toolCompletion(name, args, extra = {}) {
  return {
    choices: [
      {
        message: {
          // Reasoning models emit prose next to the call. It must be ignored.
          content: "Let me think about this invoice...",
          tool_calls: [
            { id: "call_1", type: "function", function: { name, arguments: args } },
          ],
          ...(extra.message ?? {}),
        },
        finish_reason: extra.finishReason ?? "tool_calls",
      },
    ],
  };
}

/** An envelope whose message is whatever the test needs. */
function rawCompletion(message, extra = {}) {
  return { choices: [{ message, finish_reason: extra.finishReason ?? "stop" }] };
}

/**
 * Swap in a fetch stub for one call, capturing the request. Always restores,
 * so a failing assertion cannot leak the stub into the next test.
 */
async function withFetch(impl, run) {
  const captured = {};
  const real = global.fetch;
  global.fetch = async (url, init) => {
    captured.url = url;
    captured.init = init;
    captured.body = JSON.parse(init.body);
    return impl(captured);
  };
  process.env.OPENROUTER_API_KEY = "sk-or-test-not-a-real-key";
  try {
    return { captured, result: await run() };
  } finally {
    global.fetch = real;
    delete process.env.OPENROUTER_API_KEY;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Run `fn` and return the ScanPipelineError it threw. */
async function caught(fn) {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("expected the pipeline to throw");
}

/** Drive one pass with a canned upstream response. */
function runExtract(impl) {
  return withFetch(impl, () => extractRawLines("QUJD", "image/png"));
}
function failExtract(impl) {
  return withFetch(impl, () => caught(() => extractRawLines("QUJD", "image/png")));
}

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------
test("pass 1 sends the image as a data URL, before the text part", async () => {
  const { captured, result } = await runExtract(() =>
    jsonResponse(toolCompletion(EXTRACT_TOOL, EXTRACT_ARGS)),
  );

  assert.equal(captured.url, constants.OPENROUTER_API_URL);
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers.Authorization, "Bearer sk-or-test-not-a-real-key");

  const [system, user] = captured.body.messages;
  assert.equal(system.role, "system");
  assert.equal(user.role, "user");
  assert.equal(user.content[0].type, "image_url");
  assert.equal(user.content[0].image_url.url, "data:image/png;base64,QUJD");
  assert.equal(user.content[1].type, "text");

  assert.deepEqual(result, VALID_EXTRACTION);
});

test("both passes use the exact Nemotron model id at temperature 0", async () => {
  assert.equal(constants.MODEL, "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");

  for (const [tool, args, run] of [
    [EXTRACT_TOOL, EXTRACT_ARGS, () => extractRawLines("QUJD", "image/png")],
    [CLASSIFY_TOOL, JSON.stringify({ items: [] }), () => classifyLines(VALID_EXTRACTION)],
  ]) {
    const { captured } = await withFetch(
      () => jsonResponse(toolCompletion(tool, args)),
      run,
    );
    assert.equal(captured.body.model, constants.MODEL, tool);
    assert.equal(captured.body.temperature, 0, tool);
  }
});

test("neither pass sends response_format — Nemotron would reject it", async () => {
  for (const [tool, args, run] of [
    [EXTRACT_TOOL, EXTRACT_ARGS, () => extractRawLines("QUJD", "image/png")],
    [CLASSIFY_TOOL, JSON.stringify({ items: [] }), () => classifyLines(VALID_EXTRACTION)],
  ]) {
    const { captured } = await withFetch(
      () => jsonResponse(toolCompletion(tool, args)),
      run,
    );
    assert.equal(captured.body.response_format, undefined, tool);
    assert.equal("response_format" in captured.body, false, tool);
  }
});

test("each pass declares one function from its Zod schema and forces it", async () => {
  for (const [tool, args, run] of [
    [EXTRACT_TOOL, EXTRACT_ARGS, () => extractRawLines("QUJD", "image/png")],
    [CLASSIFY_TOOL, JSON.stringify({ items: [] }), () => classifyLines(VALID_EXTRACTION)],
  ]) {
    const { captured } = await withFetch(
      () => jsonResponse(toolCompletion(tool, args)),
      run,
    );

    // Exactly one tool, so there is nothing to choose between.
    assert.equal(captured.body.tools.length, 1, tool);
    const fn = captured.body.tools[0].function;
    assert.equal(captured.body.tools[0].type, "function", tool);
    assert.equal(fn.name, tool);
    assert.equal(typeof fn.description, "string", tool);

    // Schema generated from Zod, with the dialect key stripped.
    assert.equal(fn.parameters.$schema, undefined, tool);
    assert.equal(fn.parameters.type, "object", tool);
    assert.equal(fn.parameters.additionalProperties, false, tool);
    assert.ok(Array.isArray(fn.parameters.required), tool);

    // Forced, not "auto" or "required".
    assert.deepEqual(captured.body.tool_choice, {
      type: "function",
      function: { name: tool },
    });

    // Must still route only to providers that honour tools/tool_choice.
    assert.equal(captured.body.provider.require_parameters, true, tool);
  }
});

test("the extraction tool schema matches the Zod schema's own shape", async () => {
  const { captured } = await runExtract(() =>
    jsonResponse(toolCompletion(EXTRACT_TOOL, EXTRACT_ARGS)),
  );
  const params = captured.body.tools[0].function.parameters;
  assert.deepEqual(params.required, ["lines"]);
  const line = params.properties.lines.items;
  assert.deepEqual(line.required.sort(), ["legible", "lineText", "packSize", "quantity"]);
  assert.equal(line.additionalProperties, false);
});

test("classification short-circuits with no lines, making no request", async () => {
  let called = false;
  const real = global.fetch;
  global.fetch = async () => {
    called = true;
    return jsonResponse(toolCompletion(CLASSIFY_TOOL, "{}"));
  };
  try {
    assert.deepEqual(await classifyLines({ lines: [] }), { items: [] });
    assert.equal(called, false);
  } finally {
    global.fetch = real;
  }
});

// ---------------------------------------------------------------------------
// Reading the tool call
// ---------------------------------------------------------------------------
test("valid arguments are parsed and Zod-validated", async () => {
  const { result } = await runExtract(() =>
    jsonResponse(toolCompletion(EXTRACT_TOOL, EXTRACT_ARGS)),
  );
  assert.deepEqual(result, VALID_EXTRACTION);
});

test("an object-valued arguments field is accepted, still schema-checked", async () => {
  const { result } = await runExtract(() =>
    jsonResponse(toolCompletion(EXTRACT_TOOL, VALID_EXTRACTION)),
  );
  assert.deepEqual(result, VALID_EXTRACTION);
});

test("prose in message.content is never treated as the answer", async () => {
  // Content carries a perfectly valid payload; there is no tool call. Fail closed.
  const { result: err } = await failExtract(() =>
    jsonResponse(rawCompletion({ content: EXTRACT_ARGS })),
  );
  assert.equal(err.code, "unparseable_model_output");
  assert.equal(err.status, 502);
});

test("missing, duplicate, wrong-name, malformed and off-schema calls all fail closed", async () => {
  const cases = [
    ["no tool_calls key", rawCompletion({ content: "thinking..." })],
    ["empty tool_calls", rawCompletion({ content: "", tool_calls: [] })],
    [
      "duplicate calls",
      rawCompletion({
        tool_calls: [
          { function: { name: EXTRACT_TOOL, arguments: EXTRACT_ARGS } },
          { function: { name: EXTRACT_TOOL, arguments: EXTRACT_ARGS } },
        ],
      }),
    ],
    ["wrong function name", toolCompletion("submit_something_else", EXTRACT_ARGS)],
    ["arguments not valid JSON", toolCompletion(EXTRACT_TOOL, "{lines: [")],
    ["arguments missing", rawCompletion({ tool_calls: [{ function: { name: EXTRACT_TOOL } }] })],
    ["wrong type in schema", toolCompletion(EXTRACT_TOOL, JSON.stringify({ lines: "nope" }))],
    [
      "missing required keys",
      toolCompletion(EXTRACT_TOOL, JSON.stringify({ lines: [{ lineText: "x" }] })),
    ],
  ];
  for (const [name, body] of cases) {
    const { result: err } = await failExtract(() => jsonResponse(body));
    assert.ok(err instanceof ScanPipelineError, name);
    assert.equal(err.code, "unparseable_model_output", name);
    assert.equal(err.status, 502, name);
  }
});

test("a truncated tool call says so instead of blaming the schema", async () => {
  const { result: err } = await failExtract(() =>
    jsonResponse(toolCompletion(EXTRACT_TOOL, '{"lines": [', { finishReason: "length" })),
  );
  assert.equal(err.code, "unparseable_model_output");
  assert.match(err.message, /limit/i);
});

// ---------------------------------------------------------------------------
// Errors — unchanged behaviour
// ---------------------------------------------------------------------------
test("a missing key fails as server_misconfigured before any request", async () => {
  const real = global.fetch;
  const previous = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  global.fetch = async () => {
    throw new Error("must not be called");
  };
  try {
    const err = await caught(() => extractRawLines("QUJD", "image/png"));
    assert.ok(err instanceof ScanPipelineError);
    assert.equal(err.code, "server_misconfigured");
    assert.equal(err.status, 500);
    assert.match(err.message, /redeploy/i);
  } finally {
    global.fetch = real;
    if (previous !== undefined) process.env.OPENROUTER_API_KEY = previous;
  }
});

test("HTTP statuses map onto the frozen error codes", async () => {
  const cases = [
    [401, "server_misconfigured", 500],
    [403, "server_misconfigured", 500],
    [402, "server_misconfigured", 500],
    [429, "rate_limited", 429],
    [404, "upstream_error", 502],
    [408, "upstream_unreachable", 504],
    [500, "upstream_error", 502],
    [503, "upstream_error", 502],
  ];
  for (const [status, code, mapped] of cases) {
    const { result: err } = await failExtract(() =>
      jsonResponse({ error: { code: status, message: "upstream said no" } }, status),
    );
    assert.ok(err instanceof ScanPipelineError, `${status}`);
    assert.equal(err.code, code, `${status}`);
    assert.equal(err.status, mapped, `${status}`);
  }
});

test("402 names credits, not a redeploy", async () => {
  const { result: err } = await failExtract(() =>
    jsonResponse({ error: { message: "Insufficient credits" } }, 402),
  );
  assert.match(err.message, /credit/i);
});

test("'no endpoints' on a 400 reads as upstream_error, not a bad request", async () => {
  // This is what a provider that cannot honour tool_choice looks like.
  const { result: err } = await failExtract(() =>
    jsonResponse({ error: { message: "No endpoints found that support tool use" } }, 400),
  );
  assert.equal(err.code, "upstream_error");
  assert.match(err.message, new RegExp(constants.MODEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("a transport failure is upstream_unreachable", async () => {
  const { result: err } = await failExtract(() => {
    throw new TypeError("fetch failed");
  });
  assert.equal(err.code, "upstream_unreachable");
  assert.equal(err.status, 504);
});

test("a refusal is model_refused", async () => {
  for (const body of [
    rawCompletion({ refusal: "I can't help with that." }),
    rawCompletion({ content: "" }, { finishReason: "content_filter" }),
  ]) {
    const { result: err } = await failExtract(() => jsonResponse(body));
    assert.equal(err.code, "model_refused");
    assert.equal(err.status, 422);
  }
});

test("an upstream error echoing a key never reaches the message", async () => {
  const { result: err } = await failExtract(() =>
    jsonResponse({ error: { message: "bad key sk-or-v1-abc123DEF supplied" } }, 500),
  );
  assert.doesNotMatch(err.message, /sk-or-/);
  assert.match(err.message, /redacted/);
});
