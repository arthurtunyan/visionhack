import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import styles from "./sections.module.css";

interface CtaBandProps {
  title?: string;
}

export function CtaBand({
  title = "Find out which permit is about to fail.",
}: CtaBandProps) {
  return (
    <Section ground="coal">
      <div className={styles.ctaInner}>
        <Reveal>
          <Logo inverse height={48} />
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className={`display ${styles.ctaTitle}`} style={{ color: "var(--paper)" }}>
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Button href="/demo" size="lg">
            Start Free
          </Button>
        </Reveal>
        <Reveal delay={0.15}>
          <p className={styles.ctaSub}>First store free. No card.</p>
        </Reveal>
      </div>
    </Section>
  );
}
