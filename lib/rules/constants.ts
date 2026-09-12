/**
 * Tunable rules and constants for the /api/scan pipeline.
 *
 * EVERYTHING the team may want to correct lives here — there are deliberately
 * no magic numbers in the route handler or the pipeline.
 *
 * The "specifics doc" defining the real unit-count math and perishable rules
 * was not available when this was written. The values below are defaults
 * chosen to be safe rather than clever; see the PR description for the full
 * list of assumptions. Correcting them should not require touching any other
 * file.
 */

/** The only categories the scorecard (Role C) understands. */
export const CATEGORIES = ["dairy", "grains", "protein", "produce"] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Items at or above this confidence are counted. Everything below is returned
 * in `excluded` so the UI can show "couldn't read these", but is NOT counted.
 *
 * Deliberately high: undercounting is safer than overcounting.
 */
export const MIN_COUNTED_CONFIDENCE = 0.75;

/**
 * Default perishability by category, applied when the item is not shelf-stable.
 * ASSUMPTION: grains are the only inherently non-perishable category.
 */
export const PERISHABLE_BY_CATEGORY: Record<Category, boolean> = {
  dairy: true,
  produce: true,
  protein: true,
  grains: false,
};

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

/** Perishable flag, derived from category plus a shelf-stable override. */
export function computePerishable(category: Category, shelfStable: boolean): boolean {
  return PERISHABLE_BY_CATEGORY[category] && !shelfStable;
}

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

/** Model + token settings. Exact model string — no date suffix. */
export const MODEL = "claude-opus-5";
export const MAX_TOKENS = 16_000;

/** Multipart field name / JSON key that Role A posts the image under. */
export const IMAGE_FIELD_NAME = "image";
