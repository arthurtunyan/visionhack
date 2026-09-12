"use client";

import { motion, useReducedMotion } from "motion/react";
import styles from "./StatRing.module.css";

interface StatRingProps {
  percent: number;
  size?: number;
  label?: string;
  tone?: "blue" | "bad";
}

export function StatRing({ percent, size = 160, label, tone = "blue" }: StatRingProps) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const color = tone === "bad" ? "var(--bad)" : "var(--blue)";

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--tint)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={reduce ? false : { strokeDashoffset: c }}
          whileInView={reduce ? undefined : { strokeDashoffset: offset }}
          style={{ strokeDashoffset: reduce ? offset : undefined }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.22, 0.68, 0.28, 1] }}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.value}>{Math.round(clamped)}%</span>
        {label ? <span className={styles.label}>{label}</span> : null}
      </div>
    </div>
  );
}
