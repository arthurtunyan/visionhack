import Link from "next/link";
import { Section } from "@/components/Section";
import { Badge } from "@/components/Badge";
import { Reveal } from "@/components/Reveal";
import { INDUSTRIES } from "@/lib/site-content";
import styles from "./sections.module.css";

export function Industries() {
  return (
    <Section ground="paper">
      <div className={styles.sectionHead}>
        <Reveal>
          <h2 className="display">Not just grocery.</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="body">
            Any small retailer carries a stack of permits that expire on different
            dates and answer to different inspectors. Ledger holds the whole stack.
          </p>
        </Reveal>
      </div>

      <div className={styles.indList}>
        {INDUSTRIES.map((ind, i) => (
          <Reveal as="div" key={ind.slug} delay={i * 0.05}>
            <Link href={`/industries/${ind.slug}`} className={styles.indRow}>
              <span className={styles.indName}>{ind.name}</span>
              <span className={styles.indDesc}>{ind.description}</span>
              <span className={styles.indBadges}>
                {ind.badges.map((b) => (
                  <Badge key={b} abbr={b} size={44} />
                ))}
              </span>
              <span className={styles.indArrow} aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
