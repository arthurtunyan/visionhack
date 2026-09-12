import type { ReactNode } from "react";
import { Section } from "./Section";
import { Reveal } from "./Reveal";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, intro, children }: PageHeaderProps) {
  return (
    <Section ground="paper">
      <div className={styles.head}>
        <Reveal>
          <p className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className={`display-xl ${styles.title}`}>{title}</h1>
        </Reveal>
        {intro ? (
          <Reveal delay={0.1}>
            <p className={`body-l ${styles.intro}`}>{intro}</p>
          </Reveal>
        ) : null}
        {children ? (
          <Reveal delay={0.15}>
            <div className={styles.extra}>{children}</div>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
