import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { FAQ } from "@/lib/site-content";
import styles from "./sections.module.css";

export function Faq({ heading = "Questions we get asked." }: { heading?: string }) {
  return (
    <Section ground="paper">
      <div className={styles.sectionHead}>
        <Reveal>
          <h2 className="display">{heading}</h2>
        </Reveal>
      </div>

      <div className={styles.faqList}>
        {FAQ.map((item, i) => (
          <Reveal as="div" key={item.q} delay={i * 0.04}>
            <div className={styles.faqRow}>
              <h3 className={styles.faqQ}>{item.q}</h3>
              <p className={`body ${styles.faqA}`}>{item.a}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
