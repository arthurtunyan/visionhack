"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AppWindow } from "@/components/AppWindow";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { StatRing } from "@/components/StatRing";
import { CategoryBar } from "@/components/CategoryBar";
import { downscaleImage } from "@/lib/downscale";
import { sampleScorecard } from "@/lib/sample-data";
import { UI_COPY, REQUIRED_VARIETIES, type Locale } from "@/lib/ui-copy";
import type { ScanResult, Category } from "@/lib/mock-data";
import type { ScanResponse } from "@/lib/types";
import styles from "./DemoScanner.module.css";

type Status = "idle" | "scanning" | "done" | "error";

interface DemoScannerProps {
  /**
   * Called with the English scorecard whenever one is produced, including the
   * sample. The dashboard uses it to fold stocking into the readiness score;
   * the marketing demo leaves it unset and stays self-contained.
   */
  onResult?: (result: ScanResult) => void;
}

export function DemoScanner({ onResult }: DemoScannerProps = {}) {
  const [locale, setLocale] = useState<Locale>("en");
  const [status, setStatus] = useState<Status>("idle");
  // Both languages come back on a single scan, so keep both and pick at render
  // time. Storing only the active one is why switching language used to do
  // nothing after a real scan.
  const [scan, setScan] = useState<{ en: ScanResult; es: ScanResult } | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [storeName, setStoreName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const t = UI_COPY[locale];

  const runScan = useCallback(
    async (file: File) => {
      setStatus("scanning");
      setErrorMsg("");
      setIsSample(false);
      try {
        const prepared = await downscaleImage(file);
        const body = new FormData();
        body.append("image", prepared, "invoice.jpg");
        if (storeName.trim()) body.append("storeName", storeName.trim());

        const res = await fetch("/api/scan", { method: "POST", body });
        const data: ScanResponse = await res.json();
        if (!data.ok) {
          setErrorMsg(data.error.message);
          setStatus("error");
          return;
        }
        setScan({ en: data.scorecard, es: data.scorecardEs });
        setStatus("done");
        onResult?.(data.scorecard);
      } catch {
        setErrorMsg(t.tryError);
        setStatus("error");
      }
    },
    [storeName, t.tryError, onResult],
  );

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void runScan(file);
  };

  const loadSample = () => {
    const en = sampleScorecard("en");
    setScan({ en, es: sampleScorecard("es") });
    onResult?.(en);
    setIsSample(true);
    setStatus("done");
  };

  const reset = () => {
    setStatus("idle");
    setScan(null);
    setIsSample(false);
    setErrorMsg("");
  };

  // Purely a display switch: no refetch, and nothing to re-derive.
  const switchLocale = (next: Locale) => setLocale(next);

  const result = scan ? (locale === "es" ? scan.es : scan.en) : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.langToggle} role="group" aria-label="Language">
          {(["en", "es"] as const).map((l) => (
            <button
              key={l}
              type="button"
              data-active={locale === l}
              onClick={() => switchLocale(l)}
            >
              {l === "en" ? "English" : "Español"}
            </button>
          ))}
        </div>
        {status === "done" ? (
          <Button variant="ghost" onClick={reset}>
            {t.rescan}
          </Button>
        ) : null}
      </div>

      <AppWindow url="app.ledger.co/demo">
        <div className={styles.body}>
          <AnimatePresence mode="wait">
            {status !== "done" ? (
              <motion.div
                key="upload"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.uploadPane}
              >
                <div className={styles.uploadHead}>
                  <h2 className="heading">{t.uploadTitle}</h2>
                  <p className="small mute">{t.uploadHint}</p>
                </div>

                <label className={styles.storeField}>
                  <span className={styles.fieldLabel}>{t.storeNameLabel}</span>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder={t.storeNamePlaceholder}
                    className={styles.input}
                  />
                </label>

                <div
                  className={styles.dropzone}
                  data-drag={dragOver}
                  data-busy={status === "scanning"}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (status !== "scanning") onFile(e.dataTransfer.files);
                  }}
                >
                  {status === "scanning" ? (
                    <div className={styles.scanning}>
                      <span className={styles.spinner} aria-hidden="true" />
                      <span className="body">{t.scanning}&hellip;</span>
                    </div>
                  ) : (
                    <>
                      <p className={styles.dropText}>{t.dropHere}</p>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className={styles.hiddenInput}
                        onChange={(e) => onFile(e.target.files)}
                      />
                      <Button onClick={() => inputRef.current?.click()}>
                        {t.chooseFile}
                      </Button>
                    </>
                  )}
                </div>

                {errorMsg ? (
                  <p className={styles.error} role="alert">
                    {errorMsg}
                  </p>
                ) : null}

                <button type="button" className={styles.sampleLink} onClick={loadSample}>
                  {t.loadSample} &rarr;
                </button>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 0.68, 0.28, 1] }}
              >
                <Scorecard result={result} locale={locale} isSample={isSample} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </AppWindow>
    </div>
  );
}

function Scorecard({
  result,
  locale,
  isSample,
}: {
  result: ScanResult;
  locale: Locale;
  isSample: boolean;
}) {
  const t = UI_COPY[locale];
  const pass = result.overallStatus === "pass";
  const passing = result.categories.filter(
    (c) => c.varietiesFound >= REQUIRED_VARIETIES,
  ).length;
  const percent = (passing / result.categories.length) * 100;
  const dateFmt = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(result.scanDate));

  return (
    <div className={styles.scorecard}>
      <header className={styles.scHeader}>
        <div>
          <div className={styles.scMetaTop}>
            <span className="eyebrow mute">{result.storeName}</span>
            {isSample ? <span className={styles.sampleBadge}>{t.sampleBadge}</span> : null}
          </div>
          <h2 className={styles.verdict} data-pass={pass}>
            {pass ? t.verdictPass : t.verdictFail}
          </h2>
          <p className="small mute">
            {t.scannedOn} {dateFmt} · {result.totalUnits} {t.units} ·{" "}
            {result.perishableCategoriesMet}/4 {t.perishableMet.toLowerCase()}
          </p>
        </div>
        <div className={styles.ringWrap}>
          <StatRing
            percent={percent}
            size={128}
            tone={pass ? "blue" : "bad"}
            label={t.categoriesPassing}
          />
        </div>
      </header>

      <p className={styles.requiredNote}>{t.requiredNote}</p>

      <div className={styles.catGrid}>
        {result.categories.map((cat, i) => {
          const clears = cat.varietiesFound >= REQUIRED_VARIETIES;
          return (
            <div key={cat.category} className={styles.catCard} data-clears={clears}>
              <div className={styles.catTop}>
                <span className={styles.catLabel}>{cat.label}</span>
                <Pill tone={cat.hasPerishable ? "ok" : "neutral"}>
                  {cat.hasPerishable ? t.perishableYes : t.perishableNo}
                </Pill>
              </div>
              <CategoryBar
                name={`${cat.varietiesFound} ${t.varieties}`}
                count={cat.varietiesFound}
                target={REQUIRED_VARIETIES}
                index={i}
              />
              <span className={`small mute ${styles.catUnits}`}>
                {cat.unitsFound} {t.units}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.fixes}>
        <h3 className={styles.fixesTitle}>{t.fixesTitle}</h3>
        {result.fixes.length === 0 ? (
          <p className="body mute">{t.fixesEmpty}</p>
        ) : (
          <ol className={styles.fixList}>
            {result.fixes.map((fix, i) => (
              <li key={i} className={styles.fixItem}>
                <span className={styles.fixIndex}>{i + 1}</span>
                <div>
                  <p className={styles.fixSuggestion}>{fix.itemSuggestion}</p>
                  <p className="small mute">
                    <span className={styles.whyLabel}>{t.whyItHelps}:</span>{" "}
                    {fix.whyItHelps}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
