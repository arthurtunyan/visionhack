"use client";

import { motion, useReducedMotion } from "motion/react";
import styles from "./CategoryBar.module.css";

interface CategoryBarProps {
  name: string;
  count: number;
  target?: number;
  /** Stagger index for the fill animation. */
  index?: number;
}

const EASE = [0.22, 0.68, 0.28, 1] as const;

export function CategoryBar({ name, count, target = 3, index = 0 }: CategoryBarProps) {
  const reduce = useReducedMotion();
  const short = count < target;
  const segments = Math.max(target, count);
  const filledRatio = Math.min(count, target) / target;

  return (
    <div className={styles.row}>
      <div className={styles.head}>
        <span className={styles.name}>{name}</span>
        <span className={styles.count} data-short={short}>
          <span className={styles.dot} aria-hidden="true" />
          {count} of {target}
        </span>
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${name}: ${count} of ${target}`}
      >
        <motion.div
          className={styles.fill}
          data-short={short}
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={reduce ? undefined : { scaleX: filledRatio }}
          style={{ scaleX: reduce ? filledRatio : undefined, transformOrigin: "left" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE, delay: index * 0.08 }}
        />
        <div className={styles.ticks} aria-hidden="true">
          {Array.from({ length: segments - 1 }).map((_, i) => (
            <span key={i} style={{ left: `${((i + 1) / segments) * 100}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
