/**
 * Unit tests for the scorecard's display helpers in lib/ui-copy.ts: the scan
 * date, the one-sentence reading, and held-back line reasons.
 *
 * These run in a Los Angeles timezone on purpose. A calendar date read as
 * midnight UTC only slips back a day west of UTC, and CI runs in UTC, so the
 * date bug would pass there unnoticed.
 *
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

process.env.TZ = "America/Los_Angeles";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const { formatScanDate, heldBackReason, scorecardReading } = require(
  resolve(root, ".smoke-build/ui-copy.js"),
);
const { partitionClassifiedItems } = require(
  resolve(root, ".smoke-build/rules/partition.js"),
);

const LABELS = {
  dairy: "Dairy",
  grains: "Grains",
  protein: "Protein",
  produce: "Fruits and Vegetables",
};

/** A scorecard from [varietiesFound, unitsFound] per category. */
function scorecard(counts, over = {}) {
  return {
    storeName: "",
    scanDate: "2026-09-12",
    overallStatus: "fail",
    totalUnits: 0,
    perishableCategoriesMet: 0,
    fixes: [],
    categories: Object.entries(counts).map(([category, [varietiesFound, unitsFound]]) => ({
      category,
      label: LABELS[category],
      varietiesFound,
      unitsFound,
      hasPerishable: false,
      items: [],
    })),
    ...over,
  };
}

test("the scan date is the calendar day the API sent, in any timezone", () => {
  try {
    for (const tz of ["America/Los_Angeles", "UTC", "Pacific/Kiritimati"]) {
      process.env.TZ = tz;
      assert.equal(formatScanDate("2026-09-12", "en"), "Sep 12, 2026", tz);
      assert.match(formatScanDate("2026-09-12", "es"), /^12 .*2026$/, tz);
    }
  } finally {
    process.env.TZ = "America/Los_Angeles";
  }
});

test("the reading for the sample produce order record", () => {
  const result = scorecard({ dairy: [0, 0], grains: [0, 0], protein: [0, 0], produce: [3, 400] });
  assert.equal(
    scorecardReading(result, "en"),
    "Dairy is 7 varieties and 21 units short. Grains is 7 varieties and 21 units short. " +
      "Protein is 7 varieties and 21 units short. Fruits and Vegetables is 4 varieties short.",
  );
  assert.doesNotMatch(scorecardReading(result, "es"), /otras? \d* ?categor/);
});

test("the reading counts the categories that clear, in the right number", () => {
  const oneClears = scorecard({ dairy: [7, 21], grains: [0, 0], protein: [0, 0], produce: [3, 400] });
  assert.match(scorecardReading(oneClears, "en"), / The other category clears\.$/);
  assert.match(scorecardReading(oneClears, "es"), / La otra categoría cumple\.$/);

  const threeClear = scorecard({ dairy: [4, 14], grains: [7, 21], protein: [7, 24], produce: [7, 25] });
  assert.equal(
    scorecardReading(threeClear, "en"),
    "Dairy is 3 varieties and 7 units short. The other 3 categories clear.",
  );
  assert.match(scorecardReading(threeClear, "es"), / Las otras 3 categorías cumplen\.$/);
});

test("the reading names the perishable rule when every category clears but the store fails", () => {
  const result = scorecard(
    { dairy: [7, 21], grains: [7, 21], protein: [7, 21], produce: [7, 21] },
    { perishableCategoriesMet: 2 },
  );
  assert.equal(
    scorecardReading(result, "en"),
    "All four categories clear, but only 2 of 4 include a perishable item.",
  );
  assert.equal(
    scorecardReading({ ...result, overallStatus: "pass" }, "en"),
    "All four categories clear the minimum. Nothing to fix this week.",
  );
});

test("every reason the scan route writes has Spanish", () => {
  const line = (over) => ({
    sourceLineText: "WHL MLK",
    category: "dairy",
    variety: "whole milk",
    packCount: 6,
    quantity: 4,
    storage: "refrigerated",
    accessory: false,
    confidence: 0.95,
    excludeReason: null,
    ...over,
  });
  const { excluded } = partitionClassifiedItems([
    line({ packCount: null }),
    line({ quantity: null }),
    line({ quantity: null, packCount: null }),
    line({ confidence: 0.5 }),
    line({ excludeReason: "The transcribed line was not fully legible." }),
  ]);

  assert.equal(excluded.length, 5);
  for (const { reason } of excluded) {
    assert.equal(heldBackReason(reason, "en"), reason);
    assert.notEqual(heldBackReason(reason, "es"), "No se contó.", reason);
  }
  assert.equal(heldBackReason("Low confidence (0.50).", "es"), "Lectura poco confiable (0.50).");
});

test("a reason the model wrote itself falls back to a generic Spanish label", () => {
  assert.equal(heldBackReason("Not a food item.", "es"), "No se contó.");
  assert.equal(heldBackReason("Not a food item.", "en"), "Not a food item.");
});
