import { Section } from "@/components/Section";
import { Badge } from "@/components/Badge";
import { Pill } from "@/components/Pill";
import { Reveal } from "@/components/Reveal";
import { CategoryBar } from "@/components/CategoryBar";
import styles from "./sections.module.css";

function PermitVisual() {
  return (
    <div className={styles.howVisual}>
      {[
        { abbr: "SNAP", label: "SNAP retailer authorization", meta: "Renews Mar 2027" },
        { abbr: "CHP", label: "County health permit", meta: "9 days" },
        { abbr: "W&M", label: "Weights & measures", meta: "Renews Jun 2027" },
      ].map((row) => (
        <div key={row.abbr} className={styles.howPermitRow}>
          <Badge abbr={row.abbr} size={44} />
          <span style={{ flex: 1 }}>{row.label}</span>
          <span className="small mute">{row.meta}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreVisual() {
  return (
    <div className={styles.howVisual}>
      <CategoryBar name="Dairy" count={5} index={0} />
      <CategoryBar name="Grains" count={7} index={1} />
      <CategoryBar name="Protein" count={7} index={2} />
      <CategoryBar name="Produce" count={7} index={3} />
    </div>
  );
}

function FixVisual() {
  const rows = [
    { label: "Add 2 dairy varieties", tone: "bad" as const, meta: "Blocks review" },
    { label: "Renew health permit", tone: "bad" as const, meta: "Overdue" },
    { label: "WIC price list", tone: "warn" as const, meta: "9 days" },
  ];
  return (
    <div className={styles.howVisual}>
      {rows.map((r) => (
        <div key={r.label} className={styles.howCheckRow}>
          <span className={styles.howCheckLabel}>
            <Pill tone={r.tone}>{r.meta}</Pill>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Add your permits",
    body: "Tell Ledger what you hold. It works out which rules apply to your kind of store and when each one comes due.",
    visual: <PermitVisual />,
  },
  {
    n: "02",
    title: "See where you stand",
    body: "Every requirement against its threshold, re-checked after each scan. No digging through renewal letters.",
    visual: <ScoreVisual />,
  },
  {
    n: "03",
    title: "Fix what blocks you",
    body: "Ranked by what closes you down first, not by date. The top item is always the one that matters today.",
    visual: <FixVisual />,
  },
];

export function HowItWorks() {
  return (
    <Section ground="tint">
      <div className={styles.sectionHead}>
        <Reveal>
          <h2 className="display">Set it up once. It runs itself.</h2>
        </Reveal>
      </div>

      <div className={styles.howList}>
        {STEPS.map((step, i) => {
          const flip = i % 2 === 1;
          return (
            <Reveal as="div" key={step.n} delay={0.05}>
              <div className={styles.howRow} data-flip={flip}>
                <div className={styles.howText}>
                  <div className={styles.howNum}>{step.n}</div>
                  <h3>{step.title}</h3>
                  <p className="body">{step.body}</p>
                </div>
                <div>{step.visual}</div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
