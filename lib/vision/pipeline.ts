/**
 * Two-pass vision pipeline, served through OpenRouter's chat completions API.
 *
 * Pass 1 "extract"  — transcribe printed lines verbatim. Near-deterministic,
 *                     so it runs at a low temperature.
 * Pass 2 "classify" — categorize, name the variety, size the pack, flag
 *                     perishability. This is where the judgment is, so it runs
 *                     at the model's default temperature.
 *
 * Splitting them keeps transcription errors from being laundered into
 * confident-looking classifications.
 *
 * Both passes ask for structured output (`response_format: json_schema`) built
 * from the Zod schemas in ./schemas, and both re-validate what comes back with
 * the same schema. A provider that ignores the schema, truncates, or wraps the
 * JSON in prose fails here rather than downstream.
 *
 * Plain `fetch` on purpose: OpenRouter speaks the OpenAI wire format, and a
 * vendor SDK would buy nothing for two request shapes.
 */
import * as z from "zod/v4";

import {
  API_KEY_ENV_VAR,
  EXTRACT_TEMPERATURE,
  MAX_TOKENS,
  MISSING_KEY_MESSAGE,
  MODEL,
  MODEL_REQUEST_TIMEOUT_MS,
  OPENROUTER_API_URL,
  OUT_OF_CREDITS_MESSAGE,
  type AllowedMediaType,
} from "../rules/constants";
import type { ScanErrorCode } from "../types";
import {
  ClassificationSchema,
  RawExtractionSchema,
  type Classification,
  type RawExtraction,
} from "./schemas";
import { CLASSIFY_SYSTEM_PROMPT, EXTRACT_SYSTEM_PROMPT } from "./prompts";

/** Error carrying the HTTP-facing code, so the route does no guesswork. */
export class ScanPipelineError extends Error {
  constructor(
    readonly code: ScanErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ScanPipelineError";
  }
}

/**
 * Belt and braces: nothing that looks like an OpenRouter key may reach a
 * response body or a log line, even if an upstream error echoes our request.
 */
function redact(text: string): string {
  return text.replace(/sk-or-[A-Za-z0-9_-]+/g, "[redacted]");
}

/**
 * Read per-request rather than at module scope so that importing this file
 * (e.g. during `next build`) never throws on a missing key.
 */
function requireApiKey(): string {
  const apiKey = process.env[API_KEY_ENV_VAR];
  if (!apiKey) {
    // Loud and actionable: this is the most likely first failure after a
    // deploy. Never include the key itself in any message.
    throw new ScanPipelineError("server_misconfigured", MISSING_KEY_MESSAGE, 500);
  }
  return apiKey;
}

/**
 * OpenRouter JSON-schema output is OpenAI-flavoured strict mode: every property
 * required, no extra properties. Zod v4's `toJSONSchema` already emits both, so
 * the only fixup needed is dropping the `$schema` dialect key, which strict
 * validators reject as an unknown keyword.
 */
function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface PassOptions<T> {
  stage: string;
  systemPrompt: string;
  userContent: string | ContentPart[];
  schemaName: string;
  schema: z.ZodType<T>;
  temperature?: number;
}

/**
 * Maps an OpenRouter HTTP status onto our error codes. The codes themselves are
 * frozen — Role A builds against them — so new upstream failure modes have to
 * land on an existing one.
 */
function httpError(status: number, detail: string, stage: string): ScanPipelineError {
  if (status === 401 || status === 403) {
    return new ScanPipelineError(
      "server_misconfigured",
      `${API_KEY_ENV_VAR} was missing or rejected during ${stage}. Fix the value in the Vercel project settings, then REDEPLOY — environment variable changes do not apply to existing deployments.`,
      500,
    );
  }
  if (status === 402) {
    return new ScanPipelineError("server_misconfigured", OUT_OF_CREDITS_MESSAGE, 500);
  }
  if (status === 429) {
    return new ScanPipelineError("rate_limited", `Rate limited during ${stage}.`, 429);
  }
  if (status === 408 || status === 504) {
    return new ScanPipelineError(
      "upstream_unreachable",
      `OpenRouter timed out during ${stage}.`,
      504,
    );
  }
  // 404, and the 400s OpenRouter uses for "no endpoints for this model", both
  // mean the model id is wrong or no provider can serve it under our routing
  // constraints (see `require_parameters` below).
  if (status === 404 || /not found|no endpoints|no allowed providers/i.test(detail)) {
    return new ScanPipelineError(
      "upstream_error",
      `No OpenRouter provider available for "${MODEL}" during ${stage}${detail ? `: ${detail}` : "."}`,
      502,
    );
  }
  return new ScanPipelineError(
    "upstream_error",
    `OpenRouter error ${status} during ${stage}${detail ? `: ${detail}` : "."}`,
    502,
  );
}

/** Pull the human-readable part out of an error body without ever throwing. */
async function errorDetail(response: Response): Promise<string> {
  try {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { error?: { message?: unknown } };
      const message = parsed?.error?.message;
      if (typeof message === "string" && message.length > 0) return redact(message);
    } catch {
      // Not JSON — fall through to the raw text.
    }
    return redact(text.slice(0, 500));
  } catch {
    return "";
  }
}

/** Providers occasionally wrap strict JSON in a markdown fence. Tolerate it. */
function stripCodeFence(text: string): string {
  const fenced = text.trim().match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/i);
  return fenced ? fenced[1] : text;
}

/** `message.content` is a string on most providers, content parts on a few. */
function readContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : "",
      )
      .join("");
  }
  return "";
}

/**
 * One structured-output round trip: build the request, map transport and HTTP
 * failures, then validate the model's JSON against the Zod schema before
 * anything downstream sees it.
 */
async function runPass<T>({
  stage,
  systemPrompt,
  userContent,
  schemaName,
  schema,
  temperature,
}: PassOptions<T>): Promise<T> {
  const apiKey = requireApiKey();

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, strict: true, schema: toStrictJsonSchema(schema) },
    },
    // Without this, OpenRouter may route to a provider that silently ignores
    // response_format and hands back prose.
    provider: { require_parameters: true },
  };
  if (temperature !== undefined) body.temperature = temperature;

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(MODEL_REQUEST_TIMEOUT_MS),
    });
  } catch {
    // DNS, TLS, connection reset, or our own abort timeout.
    throw new ScanPipelineError(
      "upstream_unreachable",
      `Could not reach OpenRouter during ${stage}.`,
      504,
    );
  }

  if (!response.ok) {
    throw httpError(response.status, await errorDetail(response), stage);
  }

  let payload: {
    choices?: {
      message?: { content?: unknown; refusal?: unknown };
      finish_reason?: string | null;
    }[];
  };
  try {
    payload = await response.json();
  } catch {
    throw new ScanPipelineError(
      "upstream_error",
      `OpenRouter returned a non-JSON response during ${stage}.`,
      502,
    );
  }

  const choice = payload.choices?.[0];
  if (!choice) {
    throw new ScanPipelineError(
      "upstream_error",
      `OpenRouter returned no choices during ${stage}.`,
      502,
    );
  }

  const refusal = choice.message?.refusal;
  if (
    (typeof refusal === "string" && refusal.trim().length > 0) ||
    choice.finish_reason === "content_filter"
  ) {
    throw new ScanPipelineError(
      "model_refused",
      `The model declined to process this image during ${stage}.`,
      422,
    );
  }

  const content = readContent(choice.message?.content).trim();
  if (content.length === 0) {
    throw new ScanPipelineError(
      "unparseable_model_output",
      choice.finish_reason === "length"
        ? `The model hit the ${MAX_TOKENS}-token output limit during ${stage} and returned nothing usable.`
        : `The model returned empty content during ${stage}.`,
      502,
    );
  }

  // Never trust the model's JSON: parse it, then hold it to the schema.
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    throw new ScanPipelineError(
      "unparseable_model_output",
      choice.finish_reason === "length"
        ? `The model hit the ${MAX_TOKENS}-token output limit during ${stage}, truncating its JSON.`
        : `The model returned output that was not valid JSON during ${stage}.`,
      502,
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ScanPipelineError(
      "unparseable_model_output",
      `The model returned output that did not match the expected schema during ${stage}.`,
      502,
    );
  }
  return result.data;
}

/** Pass 1: transcribe printed lines from the image. */
export async function extractRawLines(
  imageBase64: string,
  mediaType: AllowedMediaType,
): Promise<RawExtraction> {
  return runPass({
    stage: "extraction",
    systemPrompt: EXTRACT_SYSTEM_PROMPT,
    userContent: [
      // The image part comes BEFORE the text part.
      { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
      { type: "text", text: "Transcribe every printed product line in this image." },
    ],
    schemaName: "raw_extraction",
    schema: RawExtractionSchema,
    // Transcription needs accuracy, not creativity.
    temperature: EXTRACT_TEMPERATURE,
  });
}

/** Pass 2: classify the transcribed lines. */
export async function classifyLines(raw: RawExtraction): Promise<Classification> {
  if (raw.lines.length === 0) return { items: [] };

  return runPass({
    stage: "classification",
    systemPrompt: CLASSIFY_SYSTEM_PROMPT,
    userContent: `Classify these transcribed invoice lines:\n\n${JSON.stringify(
      raw.lines,
      null,
      2,
    )}`,
    schemaName: "classification",
    schema: ClassificationSchema,
    // Default temperature — this is where the judgment lives.
  });
}
