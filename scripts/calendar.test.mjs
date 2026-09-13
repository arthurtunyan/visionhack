/**
 * The .ics has to open in Google Calendar, Apple Calendar and Outlook without
 * complaint, so these cover the parts those parsers are strict about: CRLF
 * line endings, escaped text, one VEVENT per programme and a date that is
 * always in the future.
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
const cal = require(resolve(root, ".smoke-build/calendar.js"));

const FROM = new Date(2026, 8, 13); // 13 Sep 2026

test("every programme in the strip has a schedule", () => {
  for (const abbr of ["SNAP", "WIC", "EBT", "EPA", "OSHA", "ABC", "DOT", "CHP", "W&M", "TRL"]) {
    assert.ok(cal.SCHEDULES[abbr], `${abbr} has no schedule`);
  }
});

test("dates are always today or later, and roll to next year once passed", () => {
  const events = cal.eventsFor(Object.keys(cal.SCHEDULES), FROM);
  for (const ev of events) {
    assert.ok(ev.date >= "20260913", `${ev.abbr} is in the past: ${ev.date}`);
  }
  // CHP falls on 21 Sep, still ahead of 13 Sep, so it stays in 2026.
  assert.equal(events.find((e) => e.abbr === "CHP").date, "20260921");
  // W&M falls on 14 Jun, already gone, so it rolls to 2027.
  assert.equal(events.find((e) => e.abbr === "W&M").date, "20270614");
});

test("a two-year cycle lands on an even year", () => {
  const [fda] = cal.eventsFor(["FDA"], FROM);
  assert.equal(fda.date, "20261231");
  assert.equal(Number(fda.date.slice(0, 4)) % 2, 0);
});

test("events come back in date order", () => {
  const dates = cal.eventsFor(["TRL", "CHP", "SNAP"], FROM).map((e) => e.date);
  assert.deepEqual([...dates].sort(), dates);
});

test("unknown abbreviations are dropped rather than crashing", () => {
  assert.deepEqual(cal.eventsFor(["NOPE", "???"], FROM), []);
});

test("the calendar is well formed", () => {
  const ics = cal.buildIcs(["SNAP", "CHP"], FROM);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
  assert.equal(ics.match(/END:VEVENT/g).length, 2);
  // Every line is CRLF terminated, which Outlook insists on.
  assert.equal(ics.split("\r\n").length - 1, ics.split("\n").length - 1);
});

test("each event carries both reminders and a repeat", () => {
  const ics = cal.buildIcs(["CHP"], FROM);
  assert.ok(ics.includes("TRIGGER:-P30D"));
  assert.ok(ics.includes("TRIGGER:-P7D"));
  assert.ok(ics.includes("RRULE:FREQ=YEARLY;INTERVAL=1"));
  assert.equal(ics.match(/BEGIN:VALARM/g).length, 2);
});

test("commas and semicolons in the text are escaped", () => {
  const ics = cal.buildIcs(["SNAP"], FROM);
  const summary = ics.split("\r\n").find((l) => l.startsWith("SUMMARY:"));
  assert.ok(summary.includes("SNAP: SNAP retailer authorization"));
  // The note has commas in it; none may appear unescaped in the body.
  const body = ics.slice(ics.indexOf("DESCRIPTION:"));
  assert.ok(!/[^\\],/.test(body.split("\r\n")[0]));
});

test("no events means a valid but empty calendar", () => {
  const ics = cal.buildIcs([], FROM);
  assert.ok(!ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.includes("END:VCALENDAR"));
});

test("days until a date counts from today", () => {
  assert.equal(cal.daysUntil("20260921", FROM), 8);
  assert.equal(cal.daysUntil("20260913", FROM), 0);
});
