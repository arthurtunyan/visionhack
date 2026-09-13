import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import styles from "./sections.module.css";

export function SocialProof() {
  return (
    <Section ground="tint">
      <div className={styles.spGrid}>
        <Reveal>
          <div>
            <blockquote className={styles.spQuote}>
              &ldquo;We lost SNAP authorization once over two produce varieties
              nobody noticed were gone. It took four months to get back. Now I
              photograph the order record at the back door and I know before the truck
              leaves.&rdquo;
            </blockquote>
            <div className={styles.spPerson}>
              <span className={styles.spAvatar} aria-hidden="true">
                RM
              </span>
              <span>
                <span className={styles.spName}>Rosa Medina</span>
                <br />
                <span className={styles.spRole}>
                  Owner, Corner Market. Four stores in Los Angeles.
                </span>
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className={styles.spStat}>
            <div className={`${styles.spStatNum} tnum`}>
              <CountUp to={0} />
            </div>
            <p className={styles.spStatLabel}>
              line items counted that Ledger wasn&apos;t certain about
            </p>
            <div className={styles.spRule} />
            <p className={styles.spStatLabel}>
              Average scan <strong style={{ color: "var(--ink)" }}>20s</strong>
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
