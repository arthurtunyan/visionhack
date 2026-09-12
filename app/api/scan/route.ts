/**
 * POST /api/scan — photographed invoice/shelf image in, classified line items out.
 *
 * Role boundaries: this route returns clean, classified, structured items.
 * It deliberately does NOT score them — the pass/fail scorecard is Role C's
 * rule engine, which consumes `items` (and must ignore `excluded`).
 */
import { NextResponse } from "next/server";

import {
  IMAGE_FIELD_NAME,
  MAX_UPLOAD_BYTES,
  MIN_COUNTED_CONFIDENCE,
  MIN_STOCKING_UNITS_PER_VARIETY,
  MODEL,
  corsHeaders,
  isAllowedMediaType,
  type AllowedMediaType,
} from "@/lib/rules/constants";
import { partitionClassifiedItems } from "@/lib/rules/partition";
import type { ScanError, ScanResponse, ScanSuccess } from "@/lib/types";
import { ScanPipelineError, classifyLines, extractRawLines } from "@/lib/vision/pipeline";

// Vercel: the vision calls are far too slow for the edge runtime's limits, and
// without an explicit maxDuration the request can be cut off mid-call.
export const runtime = "nodejs";
export const maxDuration = 60;

function fail(
  code: ScanError["error"]["code"],
  message: string,
  status: number,
  origin: string | null,
) {
  return NextResponse.json<ScanResponse>(
    { ok: false, error: { code, message } },
    { status, headers: corsHeaders(origin) },
  );
}

/**
 * The frontend is on Framer — a different origin — so the browser sends a
 * preflight before every POST. Without this the demo fails in the browser
 * with no useful error.
 */
export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

interface DecodedImage {
  base64: string;
  mediaType: AllowedMediaType;
}

/**
 * Accepts either:
 *   multipart/form-data with an "image" file field   (what the browser sends)
 *   application/json  {"image": "<base64>", "mediaType": "image/jpeg"}
 */
async function readImage(req: Request): Promise<DecodedImage> {
  const contentType = req.headers.get("content-type") ?? "";

  // Cheap pre-check before buffering anything.
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    throw new ScanPipelineError(
      "payload_too_large",
      `Image exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit. Downscale it before uploading.`,
      413,
    );
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const field = form.get(IMAGE_FIELD_NAME);
    if (!field || typeof field === "string") {
      throw new ScanPipelineError(
        "no_image",
        `Expected a file in the "${IMAGE_FIELD_NAME}" field.`,
        400,
      );
    }
    const mediaType = field.type;
    if (!isAllowedMediaType(mediaType)) {
      throw new ScanPipelineError(
        "unsupported_media_type",
        `Unsupported image type "${mediaType || "unknown"}".`,
        415,
      );
    }
    const bytes = Buffer.from(await field.arrayBuffer());
    assertSize(bytes.byteLength);
    // Buffer#toString("base64") emits no newlines, which the API requires.
    return { base64: bytes.toString("base64"), mediaType };
  }

  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ScanPipelineError("bad_request", "Body was not valid JSON.", 400);
    }
    const record = (body ?? {}) as Record<string, unknown>;
    const rawImage = record[IMAGE_FIELD_NAME];
    const mediaType = record.mediaType;
    if (typeof rawImage !== "string" || rawImage.length === 0) {
      throw new ScanPipelineError(
        "no_image",
        `Expected a base64 string in the "${IMAGE_FIELD_NAME}" key.`,
        400,
      );
    }
    if (typeof mediaType !== "string" || !isAllowedMediaType(mediaType)) {
      throw new ScanPipelineError(
        "unsupported_media_type",
        `Expected "mediaType" to be one of the supported image types.`,
        415,
      );
    }
    // Tolerate a data: URL prefix and any incidental whitespace/newlines.
    const base64 = rawImage.replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
    assertSize(Buffer.byteLength(base64, "base64"));
    return { base64, mediaType };
  }

  throw new ScanPipelineError(
    "bad_request",
    "Content-Type must be multipart/form-data or application/json.",
    400,
  );
}

function assertSize(byteLength: number) {
  if (byteLength > MAX_UPLOAD_BYTES) {
    throw new ScanPipelineError(
      "payload_too_large",
      `Image exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit. Downscale it before uploading.`,
      413,
    );
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const origin = req.headers.get("origin");

  try {
    const { base64, mediaType } = await readImage(req);

    const extractStart = Date.now();
    const raw = await extractRawLines(base64, mediaType);
    const extractMs = Date.now() - extractStart;

    const classifyStart = Date.now();
    const classified = await classifyLines(raw);
    const classifyMs = Date.now() - classifyStart;

    const { items, excluded, varietyCounts } = partitionClassifiedItems(classified.items);

    const payload: ScanSuccess = {
      ok: true,
      items,
      excluded,
      varietyCounts,
      meta: {
        model: MODEL,
        rawLineCount: raw.lines.length,
        countedCount: items.length,
        excludedCount: excluded.length,
        confidenceThreshold: MIN_COUNTED_CONFIDENCE,
        minStockingUnitsPerVariety: MIN_STOCKING_UNITS_PER_VARIETY,
        timingMs: {
          extract: extractMs,
          classify: classifyMs,
          total: Date.now() - startedAt,
        },
      },
    };

    return NextResponse.json<ScanResponse>(payload, {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (err) {
    if (err instanceof ScanPipelineError) {
      return fail(err.code, err.message, err.status, origin);
    }
    console.error("[/api/scan] unexpected error", err);
    return fail("internal_error", "Unexpected server error.", 500, origin);
  }
}
