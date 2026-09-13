"use client";

import { useState } from "react";
import { Section } from "@/components/Section";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { PROGRAM_STRIP, NON_AFFILIATION } from "@/lib/site-content";
import styles from "./sections.module.css";

/** Ticking a badge is the cheapest way to show a visitor their own stack. */
export function ProgramStrip() {
  const [held, setHeld] = useState<string[]>(["SNAP", "EBT", "CHP"]);

  const toggle = (abbr: string) =>
    setHeld((prev) =>
      prev.includes(abbr) ? prev.filter((a) => a !== abbr) : [...prev, abbr],
    );

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
            {held.length === 0
              ? "Pick one and we will show you what it costs to let it lapse."
              : `${held.length} selected. That is ${held.length} renewal date${
                  held.length === 1 ? "" : "s"
                } to remember, ${held.length} set${
                  held.length === 1 ? "" : "s"
                } of conditions and ${held.length} inspector${
                  held.length === 1 ? "" : "s"
                } to keep happy.`}
          </p>
          <Button href="/demo">Put these on one calendar</Button>
        </div>
      </Reveal>

      <p className={styles.nonAff}>{NON_AFFILIATION}</p>
    </Section>
  );
}
