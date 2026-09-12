"use client";

import { motion, useReducedMotion } from "motion/react";
import { AppWindow } from "@/components/AppWindow";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { DashboardMock } from "./DashboardMock";
import styles from "./sections.module.css";

const EASE = [0.22, 0.68, 0.28, 1] as const;
const TRUST = ["No integration", "Works from a phone photo", "First store free"];

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
          <Logo variant="mark" height={19} />
          <span className="eyebrow">18 programmes · federal, state and local</span>
        </motion.span>

        <motion.h1 className={`display-xl ${styles.heroTitle}`} {...rise(0.05)}>
          Every permit your store holds.
          <br />
          One place. One calendar.
        </motion.h1>

        <motion.p className={`body-l ${styles.heroBody}`} {...rise(0.1)}>
          Ledger tracks the licences, filings and stocking rules a small retailer
          is judged on, and tells you which one is about to fail.
        </motion.p>

        <motion.div className={styles.heroButtons} {...rise(0.15)}>
          <Button href="/demo" size="lg">
            Start Free
          </Button>
          <Button href="/demo" variant="secondary" size="lg">
            See a Sample Scan
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
          <AppWindow>
            <DashboardMock />
          </AppWindow>
        </motion.div>
      </div>
    </section>
  );
}
