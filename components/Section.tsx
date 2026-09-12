import type { ReactNode } from "react";
import styles from "./Section.module.css";

type Ground = "paper" | "tint" | "coal";

interface SectionProps {
  ground?: Ground;
  id?: string;
  className?: string;
  /** Remove the max-width container to run edge-to-edge (e.g. hero grid). */
  bleed?: boolean;
  children: ReactNode;
}

export function Section({
  ground = "paper",
  id,
  className,
  bleed = false,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      data-ground={ground}
      className={[styles.section, className].filter(Boolean).join(" ")}
    >
      {bleed ? children : <div className={styles.inner}>{children}</div>}
    </section>
  );
}
