import Link from "next/link";
import { Section } from "@/components/Section";
import { Badge } from "@/components/Badge";
import { Reveal } from "@/components/Reveal";
import { COVERAGE, NON_AFFILIATION } from "@/lib/site-content";
import styles from "./sections.module.css";

interface CoverageProps {
  /** coal on the landing page, paper as a standalone page. */
  ground?: "coal" | "paper";
  intro?: string;
}

export function Coverage({ ground = "coal", intro }: CoverageProps) {
  const dark = ground === "coal";
  return (
    <Section ground={ground} id="coverage">
      <Reveal>
        <h2 className={`display ${styles.covHead}`}>
          Eighteen programmes, three levels of government.
        </h2>
      </Reveal>
      <Reveal delay={0.05}>
        <p className={`body-l ${styles.covIntro}`} style={{ color: dark ? "var(--mute-dark)" : "var(--mute)" }}>
          {intro ??
            "Every one of them renews on its own schedule and answers to its own inspector. Ledger keeps them on one calendar."}
        </p>
      </Reveal>

      <div className={styles.covCols}>
        {COVERAGE.map((col, ci) => (
          <Reveal as="div" key={col.level} delay={ci * 0.05}>
            <div>
              <div
                className={`eyebrow ${styles.covEyebrow}`}
                style={{ color: dark ? "var(--blue-lift)" : "var(--blue)" }}
              >
                {col.level}
              </div>
              <div>
                {col.programs.map((p) => (
                  <Link
                    key={p.abbr + p.label}
                    href="/dashboard"
                    aria-label={`${p.abbr}: ${p.label}. Open the dashboard.`}
                    className={styles.covRow}
                    data-dark={dark}
                    style={{
                      borderBottom: `1px solid ${dark ? "var(--line-dark)" : "var(--line)"}`,
                    }}
                  >
                    <Badge abbr={p.abbr} size={40} tone={dark ? "dark" : "light"} />
                    <span className={styles.covRowText}>
                      <span className={styles.covAbbr}>{p.abbr}</span>
                      <span
                        className={styles.covDesc}
                        style={{ color: dark ? "var(--mute-dark)" : "var(--mute)" }}
                      >
                        {p.label}
                      </span>
                    </span>
                    <span className={styles.covGo} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <p
        className={styles.nonAff}
        style={{
          textAlign: "left",
          marginTop: 40,
          paddingTop: 28,
          borderTop: `1px solid ${dark ? "var(--line-dark)" : "var(--line)"}`,
          color: dark ? "var(--mute-dark)" : "var(--mute)",
          maxWidth: "none",
        }}
      >
        {NON_AFFILIATION}
      </p>
    </Section>
  );
}
