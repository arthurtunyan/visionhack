import type { ReactNode } from "react";
import styles from "./Pill.module.css";

type Tone = "ok" | "warn" | "bad" | "neutral";

interface PillProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone = "neutral", children, className }: PillProps) {
  return (
    <span
      className={[styles.pill, className].filter(Boolean).join(" ")}
      data-tone={tone}
    >
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
