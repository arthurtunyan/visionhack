/**
 * Unit tests for the four scoring rules and the exclusion paths.
 *
 * These make NO API call and need NO key, so they run in CI and catch a
 * silent regression if someone edits the prompt and assumes the prompt is
 * what enforces the rules. It is not — lib/rules/ is.
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

const rules = require(resolve(root, ".smoke-build/rules/constants.js"));
const { partitionClassifiedItems, countQualifyingVarieties } = require(
  resolve(root, ".smoke-build/rules/partition.js"),
);

/** A fully valid, countable line unless overridden. */
function line(over = {}) {
  return {
    sourceLineText: "WHL MLK HOMOGENIZED",
    category: "dairy",
    variety: "whole milk",
    packCount: 6,
    quantity: 4,
    storage: "refrigerated",
    accessory: false,
    confidence: 0.95,
    excludeReason: null,
    ...over,
  };
}

// ---------------------------------------------------------------------------
test("RULE 1 — butter and all jerky contribute zero", async (t) => {
  await t.test("butter is detected even when the model forgets the flag", () => {
    const { items } = partitionClassifiedItems([
      line({ sourceLineText: "SWEET CREAM BUTTER", variety: "butter", accessory: false }),
    ]);
    assert.equal(items.length, 1, "accessory stays visible");
    assert.equal(items[0].accessory, true);
    assert.equal(items[0].stockingUnits, 0);
  });

  await t.test("all jerky is accessory", () => {
    for (const v of ["beef jerky", "turkey jerky", "salmon jerky"]) {
      const { items } = partitionClassifiedItems([
        line({ sourceLineText: v.toUpperCase(), category: "protein", variety: v, accessory: false }),
      ]);
      assert.equal(items[0].accessory, true, `${v} should be accessory`);
      assert.equal(items[0].stockingUnits, 0, `${v} should contribute 0 units`);
    }
  });

  await t.test("accessory contributes 0 toward variety counts", () => {
    // 24 units of butter would otherwise easily qualify.
    const { varietyCounts } = partitionClassifiedItems([
      line({ variety: "butter", sourceLineText: "BUTTER SALTED", packCount: 24, quantity: 1 }),
    ]);
    assert.equal(varietyCounts.dairy, 0);
  });

  await t.test("a non-accessory line is untouched by the rule", () => {
    const { items } = partitionClassifiedItems([line()]);
    assert.equal(items[0].accessory, false);
    assert.equal(items[0].stockingUnits, 24);
  });
});

// ---------------------------------------------------------------------------
test("RULE 2 — a variety needs at least 3 stocking units", async (t) => {
  await t.test("2 units does NOT count", () => {
    const { varietyCounts } = partitionClassifiedItems([
      line({ packCount: 2, quantity: 1 }), // 2 units
    ]);
    assert.equal(varietyCounts.dairy, 0);
  });

  await t.test("3 units DOES count", () => {
    const { varietyCounts } = partitionClassifiedItems([
      line({ packCount: 3, quantity: 1 }), // 3 units
    ]);
    assert.equal(varietyCounts.dairy, 1);
  });

  await t.test("units total across lines of the same variety", () => {
    const { varietyCounts } = partitionClassifiedItems([
      line({ packCount: 1, quantity: 2 }), // 2 units
      line({ packCount: 1, quantity: 1 }), // +1 = 3
    ]);
    assert.equal(varietyCounts.dairy, 1);
  });

  await t.test("distinct varieties are counted separately", () => {
    const { varietyCounts } = partitionClassifiedItems([
      line({ variety: "whole milk", packCount: 3, quantity: 1 }),
      line({ variety: "skim milk", packCount: 3, quantity: 1 }),
      line({ variety: "oat milk", packCount: 2, quantity: 1 }), // short — drops
    ]);
    assert.equal(varietyCounts.dairy, 2);
  });

  await t.test("the threshold constant is 3", () => {
    assert.equal(rules.MIN_STOCKING_UNITS_PER_VARIETY, 3);
    assert.equal(rules.varietyQualifies(2), false);
    assert.equal(rules.varietyQualifies(3), true);
  });
});

// ---------------------------------------------------------------------------
test("RULE 3 — perishable means refrigerated or fresh", async (t) => {
  await t.test("refrigerated and fresh are perishable", () => {
    assert.equal(rules.computePerishable("refrigerated"), true);
    assert.equal(rules.computePerishable("fresh"), true);
  });

  await t.test("shelf-stable and frozen are not", () => {
    assert.equal(rules.computePerishable("shelf_stable"), false);
    // ASSUMPTION, flagged for the team: "refrigerated or fresh" read literally
    // excludes frozen.
    assert.equal(rules.computePerishable("frozen"), false);
  });

  await t.test("the flag follows storage, not category", () => {
    const { items } = partitionClassifiedItems([
      line({ category: "produce", storage: "shelf_stable" }),
    ]);
    assert.equal(items[0].perishable, false);
  });
});

// ---------------------------------------------------------------------------
test("RULE 4 — variety counts round down, never up", async (t) => {
  await t.test("2.9 floors to 2", () => {
    assert.equal(rules.floorVarietyCount(2.9), 2);
  });

  await t.test("2.5 floors to 2 rather than rounding half up", () => {
    assert.equal(rules.floorVarietyCount(2.5), 2);
  });

  await t.test("whole numbers and zero are unchanged", () => {
    assert.equal(rules.floorVarietyCount(3), 3);
    assert.equal(rules.floorVarietyCount(0), 0);
  });

  await t.test("negatives clamp to 0", () => {
    assert.equal(rules.floorVarietyCount(-1), 0);
  });
});

// ---------------------------------------------------------------------------
test("exclusion paths — undercounting is safer than overcounting", async (t) => {
  await t.test("below-threshold confidence is excluded", () => {
    const { items, excluded } = partitionClassifiedItems([line({ confidence: 0.5 })]);
    assert.equal(items.length, 0);
    assert.equal(excluded.length, 1);
    assert.match(excluded[0].reason, /low confidence/i);
  });

  await t.test("exactly at the threshold is counted", () => {
    const { items } = partitionClassifiedItems([
      line({ confidence: rules.MIN_COUNTED_CONFIDENCE }),
    ]);
    assert.equal(items.length, 1);
  });

  await t.test("the model's own exclusion is honored", () => {
    const { items, excluded } = partitionClassifiedItems([
      line({ excludeReason: "Not a food category." }),
    ]);
    assert.equal(items.length, 0);
    assert.equal(excluded[0].reason, "Not a food category.");
  });

  await t.test("weight-only pack size is excluded, not guessed", () => {
    const { items, excluded } = partitionClassifiedItems([
      line({ category: "produce", variety: "roma tomato", packCount: null }),
    ]);
    assert.equal(items.length, 0);
    assert.match(excluded[0].reason, /pack size or quantity/i);
  });

  await t.test("fractional, zero and negative quantities are excluded", () => {
    for (const over of [{ quantity: 2.5, packCount: 3 }, { quantity: 0 }, { quantity: -4 }]) {
      const { items } = partitionClassifiedItems([line(over)]);
      assert.equal(items.length, 0, `${JSON.stringify(over)} should not count`);
    }
  });

  await t.test("out-of-range confidence is clamped", () => {
    const { items } = partitionClassifiedItems([line({ confidence: 1.7 })]);
    assert.equal(items[0].confidence, 1);
  });

  await t.test("an excluded line never reaches the variety count", () => {
    const { varietyCounts } = partitionClassifiedItems([
      line({ packCount: 10, quantity: 10, confidence: 0.1 }), // 100 units, unreadable
    ]);
    assert.equal(varietyCounts.dairy, 0);
  });
});

// ---------------------------------------------------------------------------
test("variety rollup covers every category", () => {
  const counts = countQualifyingVarieties([]);
  assert.deepEqual(counts, { dairy: 0, grains: 0, protein: 0, produce: 0 });
});
