"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AppWindow } from "@/components/AppWindow";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { CategoryBar } from "@/components/CategoryBar";
import { downscaleImage } from "@/lib/downscale";
import { sampleScorecard } from "@/lib/sample-data";
import {
  UI_COPY,
  REQUIRED_VARIETIES,
  REQUIRED_UNITS,
  type Locale,
} from "@/lib/ui-copy";
import type { ScanResult } from "@/lib/mock-data";
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
  /** Open on the upload pane rather than a pre-filled sample scorecard. */
  startEmpty?: boolean;
}

export function DemoScanner({ onResult, startEmpty = false }: DemoScannerProps = {}) {
  const [locale, setLocale] = useState<Locale>("en");
  // The marketing demo opens on a filled scorecard so the page is never empty.
  // Embedded in the dashboard it opens empty, because the reader just asked to
  // scan something and a pre-filled result would read as their own.
  const [status, setStatus] = useState<Status>(startEmpty ? "idle" : "done");
  // Both languages come back on a single scan, so keep both and pick at render
  // time. Storing only the active one is why switching language used to do
  // nothing after a real scan.
  const [scan, setScan] = useState<{ en: ScanResult; es: ScanResult } | null>(() =>
    startEmpty ? null : { en: sampleScorecard("en"), es: sampleScorecard("es") },
  );
  const [isSample, setIsSample] = useState(!startEmpty);
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
        body.append("image", prepared, "order-record.jpg");
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
  const es = locale === "es";
  const pass = result.overallStatus === "pass";
  const short = result.categories.filter(
    (c) => c.varietiesFound < REQUIRED_VARIETIES || c.unitsFound < REQUIRED_UNITS,
  );
  const passing = result.categories.length - short.length;
  const dateFmt = new Intl.DateTimeFormat(es ? "es" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(result.scanDate));

  /** One sentence a store owner can act on without reading the rest. */
  const reading = pass
    ? es
      ? "Las cuatro categorías cumplen el mínimo. No hay nada que corregir esta semana."
      : "All four categories clear the minimum. Nothing to fix this week."
    : short
        .map((c) => {
          const v = REQUIRED_VARIETIES - c.varietiesFound;
          const u = REQUIRED_UNITS - c.unitsFound;
          const parts = [
            v > 0 ? `${v} ${es ? "variedades" : `variet${v === 1 ? "y" : "ies"}`}` : null,
            u > 0 ? `${u} ${es ? "unidades" : "units"}` : null,
          ].filter(Boolean);
          return es
            ? `A ${c.label} le faltan ${parts.join(" y ")}.`
            : `${c.label} is ${parts.join(" and ")} short.`;
        })
        .join(" ") +
      (es
        ? ` Las otras ${passing} categorías cumplen.`
        : ` The other ${passing} categories clear.`);

  const stats = [
    {
      value: `${passing}/${result.categories.length}`,
      label: es ? "categorías que cumplen" : "categories clearing",
    },
    { value: String(result.totalUnits), label: es ? "unidades contadas" : "units counted" },
    {
      value: `${result.perishableCategoriesMet}/4`,
      label: es ? "con un perecedero" : "with a perishable",
    },
  ];

  return (
    <div className={styles.scorecard}>
      <header className={styles.scHeader}>
        <div className={styles.scMetaTop}>
          <span className="eyebrow mute">{result.storeName}</span>
          {isSample ? <span className={styles.sampleBadge}>{t.sampleBadge}</span> : null}
        </div>
        <h2 className={styles.verdict} data-pass={pass}>
          {pass ? t.verdictPass : t.verdictFail}
        </h2>
        <p className={styles.reading}>{reading}</p>
        <p className={`small mute ${styles.scDate}`}>
          {t.scannedOn} {dateFmt}
        </p>
      </header>

      <div className={styles.statRow}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCell}>
            <span className={`${styles.statValue} tnum`}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.ruleNote}>
        <span className={styles.ruleNoteLabel}>{es ? "La regla" : "The rule"}</span>
        <span>
          {es
            ? "Cada categoría necesita 7 variedades y 21 unidades. Tres de las cuatro deben incluir un perecedero."
            : "Every category needs 7 varieties and 21 units. Three of the four must include a perishable item."}
        </span>
      </div>

      <div className={styles.catGrid}>
        {result.categories.map((cat, i) => {
          const clears =
            cat.varietiesFound >= REQUIRED_VARIETIES &&
            cat.unitsFound >= REQUIRED_UNITS;
          return (
            <div key={cat.category} className={styles.catCard} data-clears={clears}>
              <div className={styles.catTop}>
                <span className={styles.catLabel}>{cat.label}</span>
                <Pill tone={clears ? "ok" : "bad"}>
                  {clears
                    ? es
                      ? "Cumple"
                      : "Clears"
                    : es
                      ? "Por debajo"
                      : "Short"}
                </Pill>
              </div>
              <CategoryBar
                name={`${cat.varietiesFound} ${t.varieties}`}
                count={cat.varietiesFound}
                target={REQUIRED_VARIETIES}
                index={i}
              />
              <div className={styles.catNums}>
                <span>
                  <strong className="tnum">{cat.varietiesFound}</strong>/
                  {REQUIRED_VARIETIES} {t.varieties}
                </span>
                <span>
                  <strong className="tnum">{cat.unitsFound}</strong>/{REQUIRED_UNITS}{" "}
                  {t.units}
                </span>
                <span>{cat.hasPerishable ? t.perishableYes : t.perishableNo}</span>
              </div>
              <ul className={styles.itemList}>
                {cat.items.map((item) => (
                  <li key={item.name} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.variety}</span>
                    <span className={`${styles.itemUnits} tnum`}>{item.units}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className={styles.fixes}>
        <h3 className={styles.blockTitle}>{t.fixesTitle}</h3>
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
