"use client";

import { motion, useReducedMotion } from "motion/react";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { PRICING } from "@/lib/site-content";
import styles from "./sections.module.css";

interface PricingProps {
  heading?: string;
}

export function Pricing({ heading = "Simple pricing." }: PricingProps) {
  const reduce = useReducedMotion();
  return (
    <Section ground="paper" id="pricing">
      <div className={styles.sectionHead}>
        <Reveal>
          <h2 className="display">{heading}</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="body">
            First store free. Prices shown are placeholder while we finish
            onboarding.
          </p>
        </Reveal>
      </div>

      <div className={styles.priceGrid}>
        {PRICING.map((plan, i) => (
          <Reveal as="div" key={plan.name} delay={i * 0.05}>
            <motion.div
              className={`${styles.card} ${plan.featured ? styles.cardFeatured : ""}`}
              whileHover={reduce ? undefined : { y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 0.68, 0.28, 1] }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardName}>{plan.name}</span>
                {plan.featured ? <span className={styles.mostPill}>Most stores</span> : null}
              </div>

              <div className={styles.cardPrice}>
                {plan.priceIsText ? (
                  <span className={styles.cardPriceText}>{plan.price}</span>
                ) : (
                  <span className={`${styles.cardPriceNum} tnum`}>{plan.price}</span>
                )}
                {plan.priceSuffix ? (
                  <span className={styles.cardPriceSuffix}>{plan.priceSuffix}</span>
                ) : null}
              </div>

              <p className={styles.cardFor}>{plan.for}</p>

              <div className={styles.cardFeatures}>
                {plan.features.map((f) => (
                  <span key={f} className={styles.feature}>
                    <span className={styles.featureTick} aria-hidden="true">
                      &#10003;
                    </span>
                    {f}
                  </span>
                ))}
              </div>

              <Button
                href="/demo"
                variant={plan.featured ? "primary" : "ghost"}
                className={styles.cardFeatures ? undefined : undefined}
              >
                {plan.priceIsText ? "Talk to us" : "Start Free"}
              </Button>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
