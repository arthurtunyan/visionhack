/**
 * Two-pass Claude vision pipeline.
 *
 * Pass 1 "extract"  — transcribe printed lines verbatim. Near-deterministic,
 *                     so it runs at low effort.
 * Pass 2 "classify" — categorize, name the variety, size the pack, flag
 *                     perishability. This is where the judgment is, so it runs
 *                     at the default effort.
 *
 * Splitting them keeps transcription errors from being laundered into
 * confident-looking classifications.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { MAX_TOKENS, MODEL, type AllowedMediaType } from "../rules/constants";
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
 * Built per-request rather than at module scope so that importing this file
 * (e.g. during `next build`) never throws on a missing key.
 */
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ScanPipelineError(
      "server_misconfigured",
      "ANTHROPIC_API_KEY is not set on the server.",
      500,
    );
  }
  return new Anthropic({ apiKey });
}

/**
 * Maps SDK exceptions to our error codes.
 *
 * Order matters and is most-specific-first. In the TypeScript SDK every API
 * error — APIConnectionError included — extends APIError, so a bare
 * `instanceof APIError` branch placed first would swallow connection failures
 * and report them as upstream HTTP errors.
 */
function toScanError(err: unknown, stage: string): ScanPipelineError {
  if (err instanceof ScanPipelineError) return err;

  if (err instanceof Anthropic.NotFoundError) {
    return new ScanPipelineError(
      "upstream_error",
      `Model or endpoint not found during ${stage} (is "${MODEL}" available to this key?).`,
      502,
    );
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new ScanPipelineError(
      "server_misconfigured",
      `ANTHROPIC_API_KEY was rejected during ${stage}.`,
      500,
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new ScanPipelineError("rate_limited", `Rate limited during ${stage}.`, 429);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new ScanPipelineError(
      "upstream_unreachable",
      `Could not reach the Anthropic API during ${stage}.`,
      504,
    );
  }
  if (err instanceof Anthropic.APIError) {
    return new ScanPipelineError(
      "upstream_error",
      `Anthropic API error during ${stage}: ${err.message}`,
      502,
    );
  }
  return new ScanPipelineError(
    "internal_error",
    `Unexpected failure during ${stage}.`,
    500,
  );
}

/** Shared guards for a structured-output response. */
function unwrapParsed<T>(
  response: { stop_reason: string | null; parsed_output: T | null },
  stage: string,
): T {
  if (response.stop_reason === "refusal") {
    throw new ScanPipelineError(
      "model_refused",
      `The model declined to process this image during ${stage}.`,
      422,
    );
  }
  // parsed_output is null when the model output failed schema validation.
  // Never non-null assert this.
  if (response.parsed_output === null) {
    throw new ScanPipelineError(
      "unparseable_model_output",
      `The model returned output that did not match the expected schema during ${stage}.`,
      502,
    );
  }
  return response.parsed_output;
}

/** Pass 1: transcribe printed lines from the image. */
export async function extractRawLines(
  imageBase64: string,
  mediaType: AllowedMediaType,
): Promise<RawExtraction> {
  const client = getClient();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: EXTRACT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            // The image block must come BEFORE the text block.
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: "Transcribe every printed product line in this image.",
            },
          ],
        },
      ],
      output_config: {
        // Transcription needs accuracy, not depth.
        effort: "low",
        format: zodOutputFormat(RawExtractionSchema),
      },
    });
    return unwrapParsed(response, "extraction");
  } catch (err) {
    throw toScanError(err, "extraction");
  }
}

/** Pass 2: classify the transcribed lines. */
export async function classifyLines(raw: RawExtraction): Promise<Classification> {
  if (raw.lines.length === 0) return { items: [] };

  const client = getClient();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Classify these transcribed invoice lines:\n\n${JSON.stringify(
            raw.lines,
            null,
            2,
          )}`,
        },
      ],
      output_config: {
        // Default effort — this is where the judgment lives.
        format: zodOutputFormat(ClassificationSchema),
      },
    });
    return unwrapParsed(response, "classification");
  } catch (err) {
    throw toScanError(err, "classification");
  }
}
