/**
 * Tunable rules and constants for the /api/scan pipeline.
 *
 * EVERYTHING the team may want to correct lives here — there are deliberately
 * no magic numbers in the route handler or the pipeline.
 *
 * The four scoring rules from the specifics doc are documented above the
 * constant or predicate that implements them, so a reader can check the code
 * against the rule without leaving this file.
 */

/** The only categories the scorecard (Role C) understands. */
export const CATEGORIES = ["dairy", "grains", "protein", "produce"] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * How an item is stored. Drives the perishable flag (see RULE 3).
 */
export const STORAGE_STATES = ["fresh", "refrigerated", "frozen", "shelf_stable"] as const;
export type StorageState = (typeof STORAGE_STATES)[number];

/**
 * Items at or above this confidence are counted. Everything below is returned
 * in `excluded` so the UI can show "couldn't read these", but is NOT counted.
 *
 * Deliberately high: undercounting is safer than overcounting.
 */
export const MIN_COUNTED_CONFIDENCE = 0.75;

// ---------------------------------------------------------------------------
// RULE 1 — accessory foods
// ---------------------------------------------------------------------------
/**
 * RULE: Butter other than peanut butter, and ALL jerky, are accessory foods:
 * they count for nothing. Peanut butter is a countable protein.
 *
 * Enforced in code as well as in the pass-2 prompt, because the model drifts.
 *
 * Peanut butter is checked first so the general butter pattern cannot erase
 * the explicit product decision that it counts as protein.
 */
const PEANUT_BUTTER_PATTERN = /\bpeanut\s+butters?\b/i;

export const ACCESSORY_FOOD_PATTERNS: readonly RegExp[] = [
  /\bbutters?\b/i,
  /\bjerky\b/i,
];

export function isPeanutButter(...text: (string | null | undefined)[]): boolean {
  return PEANUT_BUTTER_PATTERN.test(text.filter(Boolean).join(" "));
}

export function categoryForKnownFood(
  category: Category,
  ...text: (string | null | undefined)[]
): Category {
  return isPeanutButter(...text) ? "protein" : category;
}

export function isAccessoryFood(...text: (string | null | undefined)[]): boolean {
  const haystack = text.filter(Boolean).join(" ");
  if (PEANUT_BUTTER_PATTERN.test(haystack)) return false;
  return ACCESSORY_FOOD_PATTERNS.some((re) => re.test(haystack));
}

// ---------------------------------------------------------------------------
// RULE 2 — minimum stocking units per variety
// ---------------------------------------------------------------------------
/**
 * RULE (verbatim): "A variety needs at least 3 STOCKING UNITS to count at all.
 * Below 3, it does not count."
 */
export const MIN_STOCKING_UNITS_PER_VARIETY = 3;

export function varietyQualifies(totalStockingUnits: number): boolean {
  return totalStockingUnits >= MIN_STOCKING_UNITS_PER_VARIETY;
}

// ---------------------------------------------------------------------------
// RULE 3 — perishable
// ---------------------------------------------------------------------------
/**
 * RULE: Refrigerated, fresh, and frozen foods are perishable. Storage, rather
 * than category, is the source of truth.
 */
export const PERISHABLE_STORAGE_STATES: readonly StorageState[] = [
  "refrigerated",
  "fresh",
  "frozen",
];

export function computePerishable(storage: StorageState): boolean {
  return PERISHABLE_STORAGE_STATES.includes(storage);
}

// ---------------------------------------------------------------------------
// RULE 4 — rounding
// ---------------------------------------------------------------------------
/**
 * RULE (verbatim): "ROUND VARIETY COUNTS DOWN. Math.floor, never
 * round-half-up."
 */
export function floorVarietyCount(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

// ---------------------------------------------------------------------------
// Unit math
// ---------------------------------------------------------------------------
/**
 * Stocking units = number of packs/cases × units inside each pack.
 *
 * ASSUMPTION: one "stocking unit" is one sellable consumer unit (a single
 * yogurt cup, one loaf, one steak tray), NOT a case and NOT a weight.
 * If either factor is unknown the item is ambiguous and must not be counted.
 */
export function computeStockingUnits(
  quantity: number | null,
  packCount: number | null,
): number | null {
  if (quantity === null || packCount === null) return null;
  if (!Number.isFinite(quantity) || !Number.isFinite(packCount)) return null;
  if (quantity <= 0 || packCount <= 0) return null;
  const units = quantity * packCount;
  // Fractional stocking units mean we misread the pack size — don't guess.
  if (!Number.isInteger(units)) return null;
  return units;
}

// ---------------------------------------------------------------------------
// Transport / upload
// ---------------------------------------------------------------------------
/** Upload limits. Role A downscales client-side, so this is a backstop. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Image types the vision model accepts. */
export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

export function isAllowedMediaType(value: string): value is AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value);
}

/**
 * The frontend is hosted on Framer, i.e. a DIFFERENT ORIGIN, so the browser
 * sends a CORS preflight before every POST.
 *
 * Exact-match allowlist, no wildcards and no suffix matching: an origin that is
 * not listed here gets NO Access-Control-Allow-Origin header at all, so the
 * browser blocks the response. `*.framer.app` / `*.framer.website` used to be
 * allowed as suffixes and anything else fell through to `*`, which meant any
 * site on the internet could call this API.
 *
 * TODO(Role A): the Framer EDITOR preview may post from a different origin than
 * the published site (Framer serves the canvas preview from its own shared
 * domain). That origin is NOT listed here because it has not been observed
 * first-hand — guessing it would re-open the "anyone's Framer project" hole we
 * just closed. If /api/scan is CORS-blocked while working in the editor, read
 * the Origin request header off the blocked request in the network tab and add
 * that exact string to ALLOWED_ORIGINS. See docs/api-scan.md > CORS.
 */
export const FRAMER_SITE_ORIGIN = "https://dark-role-914680.framer.app";

export const ALLOWED_ORIGINS: readonly string[] = [
  FRAMER_SITE_ORIGIN,
  "http://localhost:3000",
];

/**
 * Returns the origin to echo back, or null when the caller is not allowed.
 * Null means the header is omitted entirely — never `*`.
 */
export function resolveAllowedOrigin(requestOrigin: string | null): string | null {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return null;
}

export function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    // Responses differ by Origin, so caches must not share them.
    Vary: "Origin",
  };
  const allowed = resolveAllowedOrigin(requestOrigin);
  if (allowed) headers["Access-Control-Allow-Origin"] = allowed;
  return headers;
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
/** OpenRouter's OpenAI-compatible chat completions endpoint. */
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * The vision model, as an OpenRouter model id. Both passes use it.
 *
 * Nemotron accepts image input and tools, but NOT `response_format`. Its sole
 * live provider currently rejects every explicit `tool_choice` value, so the
 * pipeline declares one function and fails closed unless the response calls it
 * exactly once with schema-valid arguments (see lib/vision/pipeline.ts).
 *
 * A replacement model must therefore support image input and usable tools.
 * Re-run the repeated live smoke test whenever this value changes.
 */
export const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
export const MAX_TOKENS = 16_000;

/**
 * Names of the single function each pass declares. They are part of the
 * request AND the response contract: a tool call under any other name is
 * rejected rather than parsed.
 */
export const EXTRACT_TOOL_NAME = "submit_extraction";
export const CLASSIFY_TOOL_NAME = "submit_classification";

/** Both passes run deterministic — this is extraction and bookkeeping, not prose. */
export const MODEL_TEMPERATURE = 0;

/**
 * Per-call backstop so a hung upstream fails as `upstream_unreachable` rather
 * than being cut off mid-response. The route's own maxDuration (60s, shared by
 * both passes) is the real ceiling.
 */
export const MODEL_REQUEST_TIMEOUT_MS = 55_000;

/** Multipart field name / JSON key that Role A posts the image under. */
export const IMAGE_FIELD_NAME = "image";

/** Optional field / JSON key for the store name shown on the scorecard. */
export const STORE_NAME_FIELD_NAME = "storeName";
export const MAX_STORE_NAME_LENGTH = 100;

/** Env var carrying the OpenRouter key. Server-side only, never NEXT_PUBLIC_*. */
export const API_KEY_ENV_VAR = "OPENROUTER_API_KEY";

/** Shown verbatim when the key is missing — it must tell the deployer what to fix. */
export const MISSING_KEY_MESSAGE =
  `${API_KEY_ENV_VAR} is not configured on the server. ` +
  `Set it in the Vercel project settings, then REDEPLOY — ` +
  `environment variable changes do not apply to existing deployments.`;

/** OpenRouter answers 402 when the account has run out of credits. */
export const OUT_OF_CREDITS_MESSAGE =
  "The OpenRouter account is out of credits. " +
  "Top it up at openrouter.ai, then retry — no redeploy is needed.";
