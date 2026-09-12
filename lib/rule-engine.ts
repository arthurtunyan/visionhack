/**
 * Rule engine (Role C): scores the counted items from POST /api/scan against
 * the USDA stocking rule and builds the ScanResult scorecard, fix list included.
 *
 * Pure and synchronous, so it is unit-tested with no API key (`npm test`).
 *
 * Per-item rules (accessory foods, minimum units per variety, rounding) come
 * from lib/rules/constants.ts rather than being re-implemented here, so the
 * scorecard can never disagree with the `varietyCounts` the route returns next
 * to it. When unsure, undercount.
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
 */
export const REQUIRED_VARIETIES_PER_CATEGORY = 7;
export const REQUIRED_UNITS_PER_CATEGORY = 21;
export const REQUIRED_TOTAL_UNITS = 84;
export const REQUIRED_PERISHABLE_CATEGORIES = 3;

const MAX_FIXES_PER_CATEGORY = 2;

export const CATEGORY_LABELS: Record<Category, string> = {
  dairy: "Dairy",
  grains: "Grains",
  protein: "Protein",
  produce: "Fruits and Vegetables",
};

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

function scoreCategory(category: Category, items: CountedItem[]): CategoryScore {
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
      label: CATEGORY_LABELS[category],
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
 * `now` is injectable for tests. The date is formatted in the server's local
 * time zone, which is UTC on Vercel.
 */
export function buildScanResult(
  items: ScanItem[],
  storeName: string,
  now: Date = new Date(),
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

  const scores = CATEGORIES.map((category) => scoreCategory(category, byCategory.get(category) ?? []));
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
    fixes: scores.flatMap((score) => categoryFixes(score, perishableCategoriesMet)),
  };
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ---------------------------------------------------------------------------
// Fix list
// ---------------------------------------------------------------------------
interface Suggestion {
  itemSuggestion: string;
  variety: string;
  perishable: boolean;
  pitch: string;
}

/**
 * Common, low-cost staples a corner store can add. Shelf-stable options come
 * first so perishables are only suggested when the category needs one.
 */
const SUGGESTIONS: Record<Category, Suggestion[]> = {
  dairy: [
    { itemSuggestion: "Carnation Evaporated Milk, 12 oz can (stock 3)", variety: "evaporated milk", perishable: false, pitch: "Shelf-stable, no fridge space needed." },
    { itemSuggestion: "Nido Fortificada Dry Milk, 12.6 oz (stock 3)", variety: "powdered milk", perishable: false, pitch: "Shelf-stable and a steady seller with families." },
    { itemSuggestion: "Daisy Cottage Cheese, 16 oz (stock 3)", variety: "cottage cheese", perishable: true, pitch: "A low-cost refrigerated staple." },
    { itemSuggestion: "Kraft Singles American Cheese, 12 ct (stock 3)", variety: "american cheese", perishable: true, pitch: "Sliced cheese sells alongside bread and lunch meat." },
    { itemSuggestion: "Galbani Mozzarella String Cheese, 12 ct (stock 3)", variety: "mozzarella cheese", perishable: true, pitch: "A grab-and-go refrigerated snack." },
  ],
  grains: [
    { itemSuggestion: "Mission Corn Tortillas, 30 ct (stock 3)", variety: "corn tortillas", perishable: false, pitch: "A daily staple that sells fast." },
    { itemSuggestion: "Maseca Instant Corn Masa Flour, 4.4 lb (stock 3)", variety: "corn masa flour", perishable: false, pitch: "Shelf-stable and a staple for home cooks." },
    { itemSuggestion: "Premium Original Saltine Crackers, 16 oz (stock 3)", variety: "saltine crackers", perishable: false, pitch: "Shelf-stable and cheap." },
    { itemSuggestion: "Bimbo Soft White Bread, 20 oz (stock 3)", variety: "white bread", perishable: true, pitch: "Fresh bread is perishable and sells every day." },
    { itemSuggestion: "Fresh Bolillo Rolls, 6 ct (stock 3)", variety: "bolillo rolls", perishable: true, pitch: "Fresh bakery rolls are perishable and sell daily." },
  ],
  protein: [
    { itemSuggestion: "Bumble Bee Pink Salmon, 14.75 oz can (stock 3)", variety: "canned salmon", perishable: false, pitch: "Shelf-stable, no fridge space needed." },
    { itemSuggestion: "Libby's Vienna Sausage, 4.6 oz can (stock 3)", variety: "vienna sausage", perishable: false, pitch: "Cheap, shelf-stable and a quick seller." },
    { itemSuggestion: "Fresh Chicken Drumsticks, family pack (stock 3)", variety: "chicken", perishable: true, pitch: "A low-cost fresh meat families buy often." },
    { itemSuggestion: "Cacique Pork Chorizo, 9 oz (stock 3)", variety: "chorizo", perishable: true, pitch: "A refrigerated staple for breakfast and tacos." },
    { itemSuggestion: "Jennie-O Ground Turkey, 1 lb (stock 3)", variety: "ground turkey", perishable: true, pitch: "Refrigerated and priced close to ground beef." },
  ],
  produce: [
    { itemSuggestion: "Del Monte Cut Green Beans, 14.5 oz can (stock 3)", variety: "green beans", perishable: false, pitch: "Canned vegetables count and keep for months." },
    { itemSuggestion: "Dole Pineapple Chunks, 20 oz can (stock 3)", variety: "pineapple", perishable: false, pitch: "Canned fruit counts and keeps for months." },
    { itemSuggestion: "Bananas, per lb (stock 3)", variety: "bananas", perishable: true, pitch: "The cheapest fresh fruit and a daily seller." },
    { itemSuggestion: "Fresh Limes, per lb (stock 3)", variety: "limes", perishable: true, pitch: "Cheap, fresh and they sell with almost everything." },
    { itemSuggestion: "Carrots, 2 lb bag (stock 3)", variety: "carrots", perishable: true, pitch: "Fresh, cheap and they keep for weeks in the cooler." },
  ],
};

/**
 * Looser than varietyKey, and used only to avoid suggesting something the
 * store already carries: "canned salmon" vs "salmon", "tomatoes" vs "tomato".
 */
function looseVarietyKey(variety: string): string {
  return varietyKey(variety)
    .replace(/^(canned|fresh|frozen|dried)\s+/, "")
    .replace(/(?<=o)es$|s$/, "");
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

type Pick = { kind: "top-up"; nearMiss: NearMiss } | { kind: "new"; suggestion: Suggestion };

function categoryFixes({ status, nearMisses }: CategoryScore, perishableCategoriesMet: number): Fix[] {
  const { category } = status;
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
        ? `brings ${category} to ${status.varietiesFound + i + 1} of ${REQUIRED_VARIETIES_PER_CATEGORY} varieties`
        : `gives ${category} a perishable item, needed in ${REQUIRED_PERISHABLE_CATEGORIES} of ${CATEGORIES.length} categories`;
    if (varietiesShort > 0 && perishableShort && i === 0) {
      gain += ` and adds the perishable item ${category} is missing`;
    }

    if (pick.kind === "top-up") {
      const { name, variety, units } = pick.nearMiss;
      const more = MIN_STOCKING_UNITS_PER_VARIETY - units;
      return {
        category,
        itemSuggestion: `${name} (stock ${more} more)`,
        whyItHelps: `You already stock ${plural(units, "unit")} of ${variety.toLowerCase()}; ${more} more meets the ${MIN_STOCKING_UNITS_PER_VARIETY}-unit minimum and ${gain}.`,
      };
    }
    return {
      category,
      itemSuggestion: pick.suggestion.itemSuggestion,
      whyItHelps: `${pick.suggestion.pitch} Stocking ${MIN_STOCKING_UNITS_PER_VARIETY} ${gain}.`,
    };
  });
}
