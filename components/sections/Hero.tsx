"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { AppWindow } from "@/components/AppWindow";
import { Button } from "@/components/Button";
import { DashboardMock } from "./DashboardMock";
import styles from "./sections.module.css";

const EASE = [0.22, 0.68, 0.28, 1] as const;
const TRUST = [
  "Eight licenses, one dashboard",
  "Set up in ten minutes",
  "English and Spanish",
];

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.36, ease: EASE, delay },
        };

  return (
    <section className={styles.hero} data-ground="paper">
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className={styles.heroInner}>
        <motion.span className={styles.heroPill} {...rise(0)}>
          <span>licence tracking for small stores</span>
        </motion.span>

        <motion.h1 className={`display-xl ${styles.heroTitle}`} {...rise(0.05)}>
          Keep every license
          <br />
          your store runs on.
        </motion.h1>

        <motion.p className={`body-l ${styles.heroBody}`} {...rise(0.1)}>
          Enter your licences once. Ledger tracks every renewal date and checks
          your shelves against the SNAP stocking rule.
        </motion.p>

        <motion.div className={styles.heroButtons} {...rise(0.15)}>
          <Button href="/demo" size="lg">
            Open the demo
          </Button>
          <Button href="/demo" variant="secondary" size="lg">
            See the rule
          </Button>
        </motion.div>

        <motion.div className={styles.heroTrust} {...rise(0.2)}>
          {TRUST.map((t) => (
            <span key={t} className={styles.heroTrustItem}>
              {t}
            </span>
          ))}
        </motion.div>

        <motion.div
          className={styles.heroWindow}
          initial={reduce ? false : { opacity: 0, x: 40, scale: 0.98 }}
          animate={reduce ? undefined : { opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: EASE, delay: 0.28 }}
        >
          {/* The hero scorecard is the most-clicked thing on the page. It
              opens the real dashboard rather than sitting there as a picture. */}
          <Link
            href="/dashboard"
            className={styles.heroWindowLink}
            aria-label="Open the dashboard"
          >
            <AppWindow>
              <DashboardMock />
            </AppWindow>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
