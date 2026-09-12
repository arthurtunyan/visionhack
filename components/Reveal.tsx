"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

interface RevealProps {
  children: ReactNode;
  /** Seconds. Stagger siblings with i * 0.05. */
  delay?: number;
  /** Travel distance in px. Spec: 16–24. */
  y?: number;
  as?: "div" | "li" | "span";
  className?: string;
}

const EASE = [0.22, 0.68, 0.28, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 20,
  as = "div",
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.36, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}
