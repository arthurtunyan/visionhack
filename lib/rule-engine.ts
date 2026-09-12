/**
 * Rule engine (Role C): scores the counted items from POST /api/scan against
 * the configured Criterion A stocking thresholds and builds the ScanResult
 * scorecard, fix list included.
 *
 * Pure and synchronous, so it is unit-tested with no API key (`npm test`).
 *
 * Per-item rules (accessory foods, minimum units per variety, rounding) come
 * from lib/rules/constants.ts rather than being re-implemented here, so the
 * scorecard can never disagree with the `varietyCounts` the route returns next
 * to it. When unsure, undercount.
 *
 * Labels and fix text come from lib/scorecard-copy.ts, in English or Spanish.
 */
import type { CategoryStatus, ScanResult } from "./mock-data";
import {
  CATEGORIES,
  MIN_STOCKING_UNITS_PER_VARIETY,
  floorVarietyCount,
  isAccessoryFood,
  varietyQualifies,
  type Category,
} from "./rules/constants";
import { SCORECARD_COPY, SUGGESTIONS, type Locale, type Suggestion } from "./scorecard-copy";
import type { ScanItem } from "./types";

type CountedItem = CategoryStatus["items"][number];
type Fix = ScanResult["fixes"][number];

// ---------------------------------------------------------------------------
// Scorecard minimums
// ---------------------------------------------------------------------------
/**
 * Varieties and perishables decide pass/fail. The unit minimums already follow
 * from them (7 varieties × 3 units = 21, 4 categories × 21 = 84) and are
 * checked anyway so that stays true if any one number changes.
 *
 * Regulatory sources and the limits of this invoice-based estimate are
 * documented in docs/regulatory-basis.md.
 */
export const REQUIRED_VARIETIES_PER_CATEGORY = 7;
export const REQUIRED_UNITS_PER_CATEGORY = 21;
export const REQUIRED_TOTAL_UNITS = 84;
export const REQUIRED_PERISHABLE_CATEGORIES = 3;

const MAX_FIXES_PER_CATEGORY = 2;

/**
 * `scanDate` is the calendar date here, not on the server. Vercel runs in UTC,
 * so an evening scan in Los Angeles would otherwise show tomorrow's date.
 */
export const SCAN_DATE_TIME_ZONE = "America/Los_Angeles";

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
/**
 * Same normalization as countQualifyingVarieties in lib/rules/partition.ts.
 * The tests assert the two agree, so change both or neither.
 */
function varietyKey(variety: string): string {
  return variety.trim().toLowerCase();
}

/**
 * Whole stocking units an item contributes. partitionClassifiedItems already
 * applies these rules; they are re-checked because seed data and future
 * callers may not go through it.
 */
function countableUnits(item: ScanItem): number {
  // RULE 1 — accessory foods count for nothing.
  if (item.accessory || isAccessoryFood(item.variety, item.description)) return 0;
  // RULE 4 — round down, never up.
  return floorVarietyCount(item.stockingUnits);
}

function sumUnits(items: CountedItem[]): number {
  return items.reduce((sum, item) => sum + item.units, 0);
}

/** A variety the store already buys, but below the minimum stocking units. */
type NearMiss = CountedItem;

interface CategoryScore {
  status: CategoryStatus;
  nearMisses: NearMiss[];
}

function scoreCategory(category: Category, items: CountedItem[], locale: Locale): CategoryScore {
  const byVariety = new Map<string, CountedItem[]>();
  for (const item of items) {
    const key = varietyKey(item.variety);
    const group = byVariety.get(key);
    if (group) group.push(item);
    else byVariety.set(key, [item]);
  }

  const counted: CountedItem[] = [];
  const nearMisses: NearMiss[] = [];
  let varietiesFound = 0;
  for (const group of byVariety.values()) {
    const units = sumUnits(group);
    // RULE 2 — a variety below the minimum does not count at all, and neither do its units.
    if (varietyQualifies(units)) {
      varietiesFound++;
      counted.push(...group);
    } else {
      const representative = group.find((item) => item.perishable) ?? group[0];
      nearMisses.push({ ...representative, units });
    }
  }

  return {
    status: {
      category,
      label: SCORECARD_COPY[locale].categoryLabels[category],
      varietiesFound,
      unitsFound: sumUnits(counted),
      hasPerishable: counted.some((item) => item.perishable),
      items: counted,
    },
    nearMisses,
  };
}

/**
 * Builds the scorecard from `ScanSuccess.items`. Never pass `excluded` lines:
 * they were dropped precisely because they must not count.
 *
 * `now` is injectable for tests. `locale` only changes labels and fix text;
 * the numbers, items and fix order are the same in every language.
 */
export function buildScanResult(
  items: ScanItem[],
  storeName: string,
  now: Date = new Date(),
  locale: Locale = "en",
): ScanResult {
  const byCategory = new Map<Category, CountedItem[]>(CATEGORIES.map((c) => [c, []]));
  for (const item of items) {
    const bucket = byCategory.get(item.category);
    const units = countableUnits(item);
    // A blank variety can't be told apart from other lines, so it never counts.
    if (!bucket || units === 0 || !varietyKey(item.variety)) continue;
    bucket.push({
      name: item.description,
      variety: item.variety.trim(),
      units,
      perishable: item.perishable,
    });
  }

  const scores = CATEGORIES.map((category) =>
    scoreCategory(category, byCategory.get(category) ?? [], locale),
  );
  const categories = scores.map((score) => score.status);
  const totalUnits = categories.reduce((sum, c) => sum + c.unitsFound, 0);
  const perishableCategoriesMet = categories.filter((c) => c.hasPerishable).length;

  const passes =
    categories.every(
      (c) =>
        c.varietiesFound >= REQUIRED_VARIETIES_PER_CATEGORY &&
        c.unitsFound >= REQUIRED_UNITS_PER_CATEGORY,
    ) &&
    totalUnits >= REQUIRED_TOTAL_UNITS &&
    perishableCategoriesMet >= REQUIRED_PERISHABLE_CATEGORIES;

  return {
    storeName,
    scanDate: formatDate(now),
    overallStatus: passes ? "pass" : "fail",
    totalUnits,
    perishableCategoriesMet,
    categories,
    fixes: scores.flatMap((score) => categoryFixes(score, perishableCategoriesMet, locale)),
  };
}

/** YYYY-MM-DD in SCAN_DATE_TIME_ZONE. Built from parts so no locale's date format can leak in. */
function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCAN_DATE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// ---------------------------------------------------------------------------
// Fix list
// ---------------------------------------------------------------------------
/**
 * Looser than varietyKey, and used only to avoid suggesting something the
 * store already carries: "canned salmon" vs "salmon", "tomatoes" vs "tomato".
 */
function looseVarietyKey(variety: string): string {
  return varietyKey(variety)
    .replace(/^(canned|fresh|frozen|dried)\s+/, "")
    .replace(/(?<=o)es$|s$/, "");
}

type Pick = { kind: "top-up"; nearMiss: NearMiss } | { kind: "new"; suggestion: Suggestion };

function categoryFixes(
  { status, nearMisses }: CategoryScore,
  perishableCategoriesMet: number,
  locale: Locale,
): Fix[] {
  const { category } = status;
  const copy = SCORECARD_COPY[locale];
  const varietiesShort = REQUIRED_VARIETIES_PER_CATEGORY - status.varietiesFound;
  const perishableShort =
    !status.hasPerishable && perishableCategoriesMet < REQUIRED_PERISHABLE_CATEGORIES;
  // A category with enough varieties still gets one fix when it's the reason the
  // store misses the perishable rule. Otherwise a failing store could see no fixes.
  const fixCount =
    varietiesShort > 0 ? Math.min(varietiesShort, MAX_FIXES_PER_CATEGORY) : perishableShort ? 1 : 0;
  if (fixCount === 0) return [];

  const needsPerishable = !status.hasPerishable;
  const carried = new Set(
    [...status.items, ...nearMisses].map((item) => looseVarietyKey(item.variety)),
  );

  // Near-misses first: the store already buys them, so the fix is just stocking more.
  const picks: Pick[] = [
    ...nearMisses
      .filter((nearMiss) => !needsPerishable || nearMiss.perishable)
      .sort((a, b) => b.units - a.units)
      .map((nearMiss): Pick => ({ kind: "top-up", nearMiss })),
    ...SUGGESTIONS[category]
      .filter((s) => (!needsPerishable || s.perishable) && !carried.has(looseVarietyKey(s.variety)))
      .map((suggestion): Pick => ({ kind: "new", suggestion })),
  ];

  return picks.slice(0, fixCount).map((pick, i) => {
    let gain =
      varietiesShort > 0
        ? copy.varietyGain(category, status.varietiesFound + i + 1, REQUIRED_VARIETIES_PER_CATEGORY)
        : copy.perishableGain(category, REQUIRED_PERISHABLE_CATEGORIES, CATEGORIES.length);
    if (varietiesShort > 0 && perishableShort && i === 0) {
      gain += copy.addsMissingPerishable(category);
    }

    if (pick.kind === "top-up") {
      const { name, variety, units } = pick.nearMiss;
      const more = MIN_STOCKING_UNITS_PER_VARIETY - units;
      return {
        category,
        itemSuggestion: copy.topUpSuggestion(name, more),
        whyItHelps: copy.topUpReason(units, variety.toLowerCase(), more, MIN_STOCKING_UNITS_PER_VARIETY, gain),
      };
    }
    const text = pick.suggestion[locale];
    return {
      category,
      itemSuggestion: text.itemSuggestion,
      whyItHelps: copy.newItemReason(text.pitch, MIN_STOCKING_UNITS_PER_VARIETY, gain),
    };
  });
}
