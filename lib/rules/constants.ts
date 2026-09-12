/**
 * Tunable rules and constants for the /api/scan pipeline.
 *
 * EVERYTHING the team may want to correct lives here — there are deliberately
 * no magic numbers in the route handler or the pipeline.
 *
 * The four scoring rules from the specifics doc are each quoted verbatim above
 * the constant or predicate that implements them, so a reader can check the
 * code against the rule without leaving this file.
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
 * RULE (verbatim): "Butter and ALL jerky are ACCESSORY FOODS: they count for
 * NOTHING. Zero. Still classify and return them so they're visible, but they
 * contribute 0 stocking units and 0 toward any variety count."
 *
 * Enforced in code as well as in the pass-2 prompt, because the model drifts.
 *
 * ASSUMPTION: "butter" is matched as a bare word, which also catches nut
 * butters (peanut, almond). That is the undercounting direction — an accessory
 * contributes zero, so over-matching can only lower a score, never inflate it.
 * Narrow this if the team decides peanut butter should count as protein.
 */
export const ACCESSORY_FOOD_PATTERNS: readonly RegExp[] = [
  /\bbutters?\b/i,
  /\bjerky\b/i,
];

export function isAccessoryFood(...text: (string | null | undefined)[]): boolean {
  const haystack = text.filter(Boolean).join(" ");
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
 * RULE (verbatim): "PERISHABLE means refrigerated or fresh."
 *
 * Note this replaces the earlier category-based guess. It is a literal reading:
 * ASSUMPTION: frozen is NOT perishable, because frozen is neither refrigerated
 * nor fresh. Flagged for the team — if frozen should count as perishable, add
 * it to this set and nothing else changes.
 */
export const PERISHABLE_STORAGE_STATES: readonly StorageState[] = ["refrigerated", "fresh"];

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

/** Image types the Claude vision API accepts. */
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
 * TODO(hackathon): tighten this. The wildcard fallback below makes the route
 * callable from anywhere, which is fine for a demo and wrong for production.
 * Once the Framer site has its final domain, drop the fallback and keep only
 * the explicit list.
 */
export const ALLOWED_ORIGINS: readonly string[] = [
  "https://framer.app",
  "https://framer.website",
  "http://localhost:3000",
];

export function resolveAllowedOrigin(requestOrigin: string | null): string {
  if (requestOrigin) {
    const allowed = ALLOWED_ORIGINS.some(
      (o) => requestOrigin === o || requestOrigin.endsWith(`.${o.replace(/^https?:\/\//, "")}`),
    );
    if (allowed) return requestOrigin;
  }
  // Permissive fallback for the hackathon — see TODO above.
  return "*";
}

export function corsHeaders(requestOrigin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(requestOrigin),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
/** Model + token settings. Exact model string — no date suffix. */
export const MODEL = "claude-opus-5";
export const MAX_TOKENS = 16_000;

/** Multipart field name / JSON key that Role A posts the image under. */
export const IMAGE_FIELD_NAME = "image";

/** Optional field / JSON key for the store name shown on the scorecard. */
export const STORE_NAME_FIELD_NAME = "storeName";
export const MAX_STORE_NAME_LENGTH = 100;

/** Env var carrying the Anthropic key. Server-side only, never NEXT_PUBLIC_*. */
export const API_KEY_ENV_VAR = "ANTHROPIC_API_KEY";

/** Shown verbatim when the key is missing — it must tell the deployer what to fix. */
export const MISSING_KEY_MESSAGE =
  `${API_KEY_ENV_VAR} is not configured on the server. ` +
  `Set it in the Vercel project settings, then REDEPLOY — ` +
  `environment variable changes do not apply to existing deployments.`;
