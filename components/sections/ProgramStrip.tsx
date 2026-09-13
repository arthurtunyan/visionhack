"use client";

import { useState } from "react";
import { Section } from "@/components/Section";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { PROGRAM_STRIP, NON_AFFILIATION } from "@/lib/site-content";
import { downloadIcs, eventsFor, readableDate } from "@/lib/calendar";
import styles from "./sections.module.css";

/** Ticking a badge is the cheapest way to show a visitor their own stack. */
export function ProgramStrip() {
  const [held, setHeld] = useState<string[]>(["SNAP", "EBT", "CHP"]);
  const [saved, setSaved] = useState(false);

  const toggle = (abbr: string) => {
    setSaved(false);
    setHeld((prev) =>
      prev.includes(abbr) ? prev.filter((a) => a !== abbr) : [...prev, abbr],
    );
  };

  const next = eventsFor(held)[0];

  return (
    <Section ground="paper">
      <Reveal>
        <p className={styles.stripHeading}>
          Tick the ones your store holds. Ledger tracks eighteen programmes across
          federal, state and local authorities.
        </p>
      </Reveal>
      <Reveal delay={0.05}>
        <div className={styles.stripBadges}>
          {PROGRAM_STRIP.map((p) => (
            <button
              key={p.abbr}
              type="button"
              className={styles.stripToggle}
              data-held={held.includes(p.abbr)}
              aria-pressed={held.includes(p.abbr)}
              onClick={() => toggle(p.abbr)}
            >
              <Badge abbr={p.abbr} caption={p.label} showAbbr />
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className={styles.stripTally}>
          <p className={styles.stripTallyText}>
            {held.length === 0 ? (
              "Pick one and we will show you when it next comes due."
            ) : (
              <>
                {held.length} selected. Next up is{" "}
                <strong>{next?.abbr}</strong> on{" "}
                <strong>{next ? readableDate(next.date) : ""}</strong>.
              </>
            )}
          </p>
          <Button
            onClick={() => {
              if (held.length === 0) return;
              downloadIcs(held);
              setSaved(true);
            }}
            disabled={held.length === 0}
          >
            {saved ? "Calendar saved" : "Put these on one calendar"}
          </Button>
        </div>
      </Reveal>

      <p className={styles.stripFilehint}>
        {saved
          ? "Downloaded as an .ics file. Open it and every date lands in your calendar with reminders at 30 and 7 days."
          : "Downloads an .ics file for your own calendar. No account needed."}
      </p>

      <p className={styles.nonAff}>{NON_AFFILIATION}</p>
    </Section>
  );
}
