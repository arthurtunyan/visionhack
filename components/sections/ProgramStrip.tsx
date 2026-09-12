import { Section } from "@/components/Section";
import { Badge } from "@/components/Badge";
import { Reveal } from "@/components/Reveal";
import { PROGRAM_STRIP, NON_AFFILIATION } from "@/lib/site-content";
import styles from "./sections.module.css";

export function ProgramStrip() {
  return (
    <Section ground="paper">
      <Reveal>
        <p className={styles.stripHeading}>
          Eighteen programmes tracked across federal, state and local authorities.
        </p>
      </Reveal>
      <Reveal delay={0.05}>
        <div className={styles.stripBadges}>
          {PROGRAM_STRIP.map((p) => (
            <Badge key={p.abbr} abbr={p.abbr} caption={p.label} />
          ))}
        </div>
      </Reveal>
      <p className={styles.nonAff}>{NON_AFFILIATION}</p>
    </Section>
  );
}
