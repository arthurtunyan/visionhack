/**
 * Unit tests for the OpenRouter request shape and error mapping.
 *
 * `global.fetch` is stubbed, so these make NO network call and need NO key —
 * they run in CI alongside the scoring-rule tests. They exist because the live
 * smoke test is the only other thing that exercises this file, and that needs
 * both a key and reachable egress.
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

/** Minimal OpenRouter-shaped success envelope. */
function completion(content, extra = {}) {
  return {
    choices: [{ message: { content, ...(extra.message ?? {}) }, finish_reason: extra.finishReason ?? "stop" }],
  };
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

test("pass 1 sends the image as a data URL, before the text part", async () => {
  const { captured, result } = await withFetch(
    () => jsonResponse(completion(JSON.stringify(VALID_EXTRACTION))),
    () => extractRawLines("QUJD", "image/png"),
  );

  assert.equal(captured.url, constants.OPENROUTER_API_URL);
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers.Authorization, "Bearer sk-or-test-not-a-real-key");

  const [system, user] = captured.body.messages;
  assert.equal(system.role, "system");
  assert.equal(user.role, "user");
  // Image part first, text part second.
  assert.equal(user.content[0].type, "image_url");
  assert.equal(user.content[0].image_url.url, "data:image/png;base64,QUJD");
  assert.equal(user.content[1].type, "text");

  assert.equal(captured.body.model, constants.MODEL);
  assert.equal(captured.body.temperature, constants.EXTRACT_TEMPERATURE);
  assert.deepEqual(result, VALID_EXTRACTION);
});

test("both passes request a strict json_schema and pin routing to capable providers", async () => {
  for (const [name, run] of [
    ["extraction", () => extractRawLines("QUJD", "image/png")],
    ["classification", () => classifyLines(VALID_EXTRACTION)],
  ]) {
    const body = name === "extraction" ? VALID_EXTRACTION : { items: [] };
    const { captured } = await withFetch(
      () => jsonResponse(completion(JSON.stringify(body))),
      run,
    );
    const rf = captured.body.response_format;
    assert.equal(rf.type, "json_schema", name);
    assert.equal(rf.json_schema.strict, true, name);
    assert.equal(typeof rf.json_schema.name, "string", name);
    // Strict mode rejects the dialect key, and needs every key required.
    assert.equal(rf.json_schema.schema.$schema, undefined, name);
    assert.equal(rf.json_schema.schema.additionalProperties, false, name);
    assert.ok(Array.isArray(rf.json_schema.schema.required), name);
    // Without this OpenRouter may route to a provider that ignores the schema.
    assert.equal(captured.body.provider.require_parameters, true, name);
  }
});

test("classification short-circuits with no lines, making no request", async () => {
  let called = false;
  const real = global.fetch;
  global.fetch = async () => {
    called = true;
    return jsonResponse(completion("{}"));
  };
  try {
    assert.deepEqual(await classifyLines({ lines: [] }), { items: [] });
    assert.equal(called, false);
  } finally {
    global.fetch = real;
  }
});

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
    const { result: err } = await withFetch(
      () => jsonResponse({ error: { code: status, message: "upstream said no" } }, status),
      () => caught(() => extractRawLines("QUJD", "image/png")),
    );
    assert.ok(err instanceof ScanPipelineError, `${status}`);
    assert.equal(err.code, code, `${status}`);
    assert.equal(err.status, mapped, `${status}`);
  }
});

test("402 names credits, not a redeploy", async () => {
  const { result: err } = await withFetch(
    () => jsonResponse({ error: { message: "Insufficient credits" } }, 402),
    () => caught(() => extractRawLines("QUJD", "image/png")),
  );
  assert.match(err.message, /credit/i);
});

test("'no endpoints' on a 400 reads as upstream_error, not a bad request", async () => {
  const { result: err } = await withFetch(
    () => jsonResponse({ error: { message: "No endpoints found matching your data policy" } }, 400),
    () => caught(() => extractRawLines("QUJD", "image/png")),
  );
  assert.equal(err.code, "upstream_error");
  assert.match(err.message, new RegExp(constants.MODEL));
});

test("a transport failure is upstream_unreachable", async () => {
  const { result: err } = await withFetch(
    () => {
      throw new TypeError("fetch failed");
    },
    () => caught(() => extractRawLines("QUJD", "image/png")),
  );
  assert.equal(err.code, "upstream_unreachable");
  assert.equal(err.status, 504);
});

test("a refusal is model_refused", async () => {
  for (const extra of [
    { message: { refusal: "I can't help with that." } },
    { finishReason: "content_filter" },
  ]) {
    const { result: err } = await withFetch(
      () => jsonResponse(completion(extra.finishReason ? "" : null, extra)),
      () => caught(() => extractRawLines("QUJD", "image/png")),
    );
    assert.equal(err.code, "model_refused");
    assert.equal(err.status, 422);
  }
});

test("output that is not valid JSON, empty, or off-schema is unparseable_model_output", async () => {
  const bodies = [
    "Sure! Here are the lines.",                       // prose
    "",                                                // empty
    JSON.stringify({ lines: "not an array" }),         // wrong type
    JSON.stringify({ lines: [{ lineText: "x" }] }),    // missing required keys
  ];
  for (const content of bodies) {
    const { result: err } = await withFetch(
      () => jsonResponse(completion(content)),
      () => caught(() => extractRawLines("QUJD", "image/png")),
    );
    assert.equal(err.code, "unparseable_model_output", JSON.stringify(content));
    assert.equal(err.status, 502);
  }
});

test("a truncated response says so instead of blaming the schema", async () => {
  const { result: err } = await withFetch(
    () => jsonResponse(completion('{"lines": [', { finishReason: "length" })),
    () => caught(() => extractRawLines("QUJD", "image/png")),
  );
  assert.equal(err.code, "unparseable_model_output");
  assert.match(err.message, /limit/i);
});

test("a markdown-fenced payload is tolerated", async () => {
  const { result } = await withFetch(
    () => jsonResponse(completion("```json\n" + JSON.stringify(VALID_EXTRACTION) + "\n```")),
    () => extractRawLines("QUJD", "image/png"),
  );
  assert.deepEqual(result, VALID_EXTRACTION);
});

test("an upstream error echoing a key never reaches the message", async () => {
  const { result: err } = await withFetch(
    () => jsonResponse({ error: { message: "bad key sk-or-v1-abc123DEF supplied" } }, 500),
    () => caught(() => extractRawLines("QUJD", "image/png")),
  );
  assert.doesNotMatch(err.message, /sk-or-/);
  assert.match(err.message, /redacted/);
});
