/**
 * Unit tests for the status engine, the readiness score and the persistence
 * normaliser.
 *
 * No browser, no key, no network. The point is that a renewal date can only
 * become "on track" by actually being far enough away, and that a blank date
 * never reads as fine.
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

const store = require(resolve(root, ".smoke-build/store.js"));
const compliance = require(resolve(root, ".smoke-build/compliance.js"));

const {
  CRITICAL_DAYS,
  SOON_DAYS,
  bySeverity,
  daysUntil,
  evaluate,
  evaluateAll,
  normalize,
  readiness,
  sampleStore,
  statusFromDays,
  toISODate,
  withObligation,
} = store;

const { OBLIGATION_BY_KEY, SNAP_RULE, STAPLE_CATEGORIES } = compliance;

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function storeWith(key, values, extra = {}) {
  return {
    name: "Test",
    address: "",
    employees: [],
    obligations: { [key]: { values, done: [], ...extra } },
  };
}

// ---------------------------------------------------------------------------
test("statusFromDays: a missing date is never 'ok'", () => {
  assert.equal(statusFromDays(null), "missing");
});

test("statusFromDays: boundaries are inclusive on the worse side", () => {
  assert.equal(statusFromDays(-1), "expired");
  assert.equal(statusFromDays(0), "critical");
  assert.equal(statusFromDays(CRITICAL_DAYS), "critical");
  assert.equal(statusFromDays(CRITICAL_DAYS + 1), "soon");
  assert.equal(statusFromDays(SOON_DAYS), "soon");
  assert.equal(statusFromDays(SOON_DAYS + 1), "ok");
});

test("daysUntil counts calendar days and rejects junk", () => {
  assert.equal(daysUntil("2026-09-20", "2026-09-12"), 8);
  assert.equal(daysUntil("2026-09-12", "2026-09-12"), 0);
  assert.equal(daysUntil("2026-09-01", "2026-09-12"), -11);
  assert.equal(daysUntil("not-a-date", "2026-09-12"), null);
  assert.equal(daysUntil("", "2026-09-12"), null);
});

test("daysUntil crosses a month and a year boundary", () => {
  assert.equal(daysUntil("2027-01-01", "2026-12-31"), 1);
  assert.equal(daysUntil("2026-03-01", "2026-02-28"), 1); // 2026 is not a leap year
});

// ---------------------------------------------------------------------------
test("evaluate: a blank renewal date reads as missing, not ok", () => {
  const s = storeWith("abc", {});
  assert.equal(evaluate(s, OBLIGATION_BY_KEY.abc).status, "missing");
});

test("evaluate: a past renewal date is expired", () => {
  const s = storeWith("abc", { renewsOn: inDays(-3) });
  const result = evaluate(s, OBLIGATION_BY_KEY.abc);
  assert.equal(result.status, "expired");
  assert.equal(result.days, -3);
});

test("evaluate: not-applicable wins over whatever date is on file", () => {
  const s = storeWith("scale", { registrationDue: inDays(-400) }, { notApplicable: true });
  assert.equal(evaluate(s, OBLIGATION_BY_KEY.scale).status, "na");
});

test("evaluate: food handler status comes from the soonest card, not the roster order", () => {
  const s = {
    name: "Test",
    address: "",
    obligations: {},
    employees: [
      { id: "a", name: "Far", cardExpires: inDays(400) },
      { id: "b", name: "Soonest", cardExpires: inDays(-2) },
      { id: "c", name: "Middle", cardExpires: inDays(60) },
    ],
  };
  const result = evaluate(s, OBLIGATION_BY_KEY.foodHandler);
  assert.equal(result.status, "expired");
  assert.equal(result.days, -2);
});

test("evaluate: no employees means the obligation is unset, not passing", () => {
  const s = { name: "", address: "", obligations: {}, employees: [] };
  assert.equal(evaluate(s, OBLIGATION_BY_KEY.foodHandler).status, "missing");
});

test("evaluate: an unparseable date does not become ok", () => {
  const s = storeWith("abc", { renewsOn: "soon-ish" });
  assert.equal(evaluate(s, OBLIGATION_BY_KEY.abc).status, "missing");
});

// ---------------------------------------------------------------------------
test("readiness ignores not-applicable obligations rather than counting them as passes", () => {
  const statuses = [
    { key: "a", status: "ok", days: null, date: null, checked: 0, total: 0 },
    { key: "b", status: "expired", days: null, date: null, checked: 0, total: 0 },
    { key: "c", status: "na", days: null, date: null, checked: 0, total: 0 },
  ];
  const score = readiness(statuses);
  assert.equal(score.applicable, 2);
  assert.equal(score.ok, 1);
  assert.equal(score.ratio, 0.5);
});

test("readiness of an all-na store does not divide by zero", () => {
  const score = readiness([{ key: "a", status: "na", days: null, date: null, checked: 0, total: 0 }]);
  assert.equal(score.applicable, 0);
  assert.equal(score.ratio, 1);
});

test("bySeverity puts expired first and not-applicable last", () => {
  const order = [
    { key: "ok", status: "ok", days: 200 },
    { key: "na", status: "na", days: null },
    { key: "expired", status: "expired", days: -1 },
    { key: "critical", status: "critical", days: 5 },
    { key: "missing", status: "missing", days: null },
    { key: "soon", status: "soon", days: 60 },
  ]
    .sort(bySeverity)
    .map((s) => s.key);
  assert.deepEqual(order, ["expired", "missing", "critical", "soon", "ok", "na"]);
});

test("bySeverity breaks ties by the nearer date", () => {
  const order = [
    { key: "later", status: "critical", days: 20 },
    { key: "sooner", status: "critical", days: 2 },
  ]
    .sort(bySeverity)
    .map((s) => s.key);
  assert.deepEqual(order, ["sooner", "later"]);
});

// ---------------------------------------------------------------------------
test("normalize fills a blank and survives junk", () => {
  const empty = normalize(null);
  assert.equal(empty.name, "");
  assert.deepEqual(empty.employees, []);
  assert.deepEqual(normalize(undefined).obligations, {});
  assert.equal(normalize({ name: 42 }).name, "");
});

test("normalize drops obligation keys that are no longer real", () => {
  const result = normalize({
    name: "X",
    obligations: { abc: { values: { a: "1" }, done: [0] }, cigarettes: { values: {}, done: [] } },
  });
  assert.ok(result.obligations.abc);
  assert.equal(result.obligations.cigarettes, undefined);
});

test("normalize repairs a done list that is not an array", () => {
  const result = normalize({ obligations: { abc: { values: {}, done: "0,1" } } });
  assert.deepEqual(result.obligations.abc.done, []);
});

test("withObligation does not mutate the store it was handed", () => {
  const before = storeWith("abc", { renewsOn: "2026-10-01" });
  const after = withObligation(before, "abc", { note: "called them" });
  assert.equal(before.obligations.abc.note, undefined);
  assert.equal(after.obligations.abc.note, "called them");
  assert.equal(after.obligations.abc.values.renewsOn, "2026-10-01");
});

// ---------------------------------------------------------------------------
test("the sample store shows a mix so the demo is never all green", () => {
  const statuses = evaluateAll(sampleStore());
  const kinds = new Set(statuses.map((s) => s.status));
  assert.ok(kinds.has("expired"), "expected something already lapsed");
  assert.ok(kinds.has("ok"), "expected something on track");
  assert.ok(statuses.length === 8, "expected all eight obligations");
});

test("the sample store's readiness is a real fraction, not 0 or 1", () => {
  const score = readiness(evaluateAll(sampleStore()));
  assert.ok(score.ratio > 0 && score.ratio < 1, `ratio was ${score.ratio}`);
});

// ---------------------------------------------------------------------------
test("SNAP constants track the rule engine rather than being retyped", () => {
  const engine = require(resolve(root, ".smoke-build/rule-engine.js"));
  assert.equal(SNAP_RULE.varietiesPerCategory, engine.REQUIRED_VARIETIES_PER_CATEGORY);
  assert.equal(SNAP_RULE.totalUnits, engine.REQUIRED_TOTAL_UNITS);
  assert.equal(SNAP_RULE.perishableCategoriesRequired, engine.REQUIRED_PERISHABLE_CATEGORIES);
  assert.equal(SNAP_RULE.unitsPerCategory, engine.REQUIRED_UNITS_PER_CATEGORY);
});

test("the staple categories are the rule engine's categories", () => {
  const rules = require(resolve(root, ".smoke-build/rules/constants.js"));
  assert.deepEqual(
    STAPLE_CATEGORIES.map((c) => c.key),
    [...rules.CATEGORIES],
  );
  assert.equal(SNAP_RULE.unitsPerVariety, rules.MIN_STOCKING_UNITS_PER_VARIETY);
  assert.equal(SNAP_RULE.categoryCount, rules.CATEGORIES.length);
});

test("every obligation has at most one status-driving field", () => {
  for (const o of compliance.OBLIGATIONS) {
    const driving = o.fields.filter((f) => f.drivesStatus);
    assert.ok(driving.length <= 1, `${o.key} has ${driving.length} status fields`);
  }
});

// ---------------------------------------------------------------------------
// Display targets. These guard a regression that shipped: the marketing page
// rendered "4 of 3" varieties because CategoryBar defaulted to 3 while the
// scanner scored against 7.
test("the UI's required-variety target is the rule engine's, not a retyped 3", () => {
  const ui = require(resolve(root, ".smoke-build/ui-copy.js"));
  const engine = require(resolve(root, ".smoke-build/rule-engine.js"));
  assert.equal(ui.REQUIRED_VARIETIES, engine.REQUIRED_VARIETIES_PER_CATEGORY);
  assert.equal(ui.REQUIRED_UNITS, engine.REQUIRED_UNITS_PER_CATEGORY);
  assert.notEqual(ui.REQUIRED_VARIETIES, 3);
});

test("the sample scorecard differs by locale, so the language toggle has something to show", () => {
  const sample = require(resolve(root, ".smoke-build/sample-data.js"));
  const en = sample.sampleScorecard("en");
  const es = sample.sampleScorecard("es");
  assert.notDeepEqual(
    en.categories.map((c) => c.label),
    es.categories.map((c) => c.label),
  );
  // Switching language must not change any number.
  assert.equal(en.totalUnits, es.totalUnits);
  assert.equal(en.overallStatus, es.overallStatus);
  assert.deepEqual(
    en.categories.map((c) => c.varietiesFound),
    es.categories.map((c) => c.varietiesFound),
  );
});
