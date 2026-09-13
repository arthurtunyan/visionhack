"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { COVERAGE } from "@/lib/site-content";
import {
  SCHEDULES,
  daysUntil,
  downloadIcs,
  eventsFor,
  readableDate,
} from "@/lib/calendar";
import styles from "./CoverageExplorer.module.css";

const LEVELS = ["All", ...COVERAGE.map((c) => c.level)];

interface Row {
  abbr: string;
  label: string;
  level: string;
}

const ROWS: Row[] = COVERAGE.flatMap((col) =>
  col.programs.map((p) => ({ abbr: p.abbr, label: p.label, level: col.level })),
);

/** A typical grocery store's stack, so the page starts with something in it. */
const DEFAULT_HELD = ["SNAP", "WIC", "EBT", "CHP", "TRL", "W&M", "ABC", "BTC"];

function toneFor(days: number): "bad" | "warn" | "ok" {
  if (days <= 30) return "bad";
  if (days <= 90) return "warn";
  return "ok";
}

export function CoverageExplorer() {
  const [level, setLevel] = useState("All");
  const [query, setQuery] = useState("");
  const [held, setHeld] = useState<string[]>(DEFAULT_HELD);
  const [saved, setSaved] = useState(false);

  const toggle = (abbr: string) => {
    setSaved(false);
    setHeld((prev) =>
      prev.includes(abbr) ? prev.filter((a) => a !== abbr) : [...prev, abbr],
    );
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROWS.filter((r) => level === "All" || r.level === level).filter(
      (r) =>
        q === "" ||
        r.abbr.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q),
    );
  }, [level, query]);

  const schedule = useMemo(() => eventsFor(held), [held]);
  const soonest = schedule[0];

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <div className={styles.tabs} role="group" aria-label="Level of government">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              data-active={level === l}
              onClick={() => setLevel(l)}
            >
              {l}
              <span className={styles.tabCount}>
                {l === "All"
                  ? ROWS.length
                  : ROWS.filter((r) => r.level === l).length}
              </span>
            </button>
          ))}
        </div>

        <label className={styles.search}>
          <span className="sr-only">Search programmes</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.searchIcon}>
            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.2 13.2 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            placeholder="Search: tobacco, waste, scales…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {visible.length === 0 ? (
            <p className={styles.empty}>
              Nothing matches “{query}”. We track eighteen programmes; try
              “health”, “waste” or “alcohol”.
            </p>
          ) : (
            visible.map((row) => {
              const on = held.includes(row.abbr);
              const sched = SCHEDULES[row.abbr];
              const ev = eventsFor([row.abbr])[0];
              return (
                <button
                  key={row.abbr + row.level}
                  type="button"
                  className={styles.row}
                  data-on={on}
                  aria-pressed={on}
                  onClick={() => toggle(row.abbr)}
                >
                  <span className={styles.check} aria-hidden="true">
                    {on ? (
                      <svg viewBox="0 0 20 20">
                        <path
                          d="m5 10.2 3.2 3.2L15 6.6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <Badge abbr={row.abbr} size={42} />
                  <span className={styles.rowText}>
                    <span className={styles.rowAbbr}>
                      {row.abbr}
                      <span className={styles.rowLevel}>{row.level}</span>
                    </span>
                    <span className={styles.rowLabel}>{row.label}</span>
                    {sched ? (
                      <span className={styles.rowNote}>{sched.note}</span>
                    ) : null}
                  </span>
                  <span className={styles.rowDate}>
                    {ev ? (
                      <>
                        <span className={styles.rowDateValue}>
                          {readableDate(ev.date)}
                        </span>
                        <span className={styles.rowDateMeta}>
                          {ev.everyYears === 2 ? "every 2 years" : "yearly"}
                        </span>
                      </>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelInner}>
            <span className={styles.panelLabel}>Your stack</span>
            <span className={`${styles.panelCount} tnum`}>{held.length}</span>
            <span className={styles.panelCountLabel}>
              {held.length === 1 ? "programme selected" : "programmes selected"}
            </span>

            {soonest ? (
              <p className={styles.panelNext}>
                Next due: <strong>{soonest.abbr}</strong> on{" "}
                {readableDate(soonest.date)}, in {daysUntil(soonest.date)} days.
              </p>
            ) : (
              <p className={styles.panelNext}>
                Select the programmes your store holds to build the calendar.
              </p>
            )}

            <ol className={styles.schedule}>
              {schedule.slice(0, 6).map((ev) => {
                const days = daysUntil(ev.date);
                return (
                  <li key={ev.abbr}>
                    <Pill tone={toneFor(days)}>{days} days</Pill>
                    <span className={styles.schedAbbr}>{ev.abbr}</span>
                    <span className={styles.schedDate}>{readableDate(ev.date)}</span>
                  </li>
                );
              })}
            </ol>
            {schedule.length > 6 ? (
              <p className={styles.schedMore}>
                and {schedule.length - 6} more in the file
              </p>
            ) : null}

            <Button
              onClick={() => {
                if (held.length === 0) return;
                downloadIcs(held);
                setSaved(true);
              }}
              disabled={held.length === 0}
            >
              {saved ? "Calendar saved" : "Download this calendar"}
            </Button>
            <p className={styles.panelHint}>
              {saved
                ? "Open the .ics file and every date lands in your calendar, repeating, with reminders at 30 and 7 days."
                : "An .ics file for Google, Apple or Outlook. Reminders at 30 and 7 days, repeating each year."}
            </p>
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                setHeld([]);
                setSaved(false);
              }}
            >
              Clear selection
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
