"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AppWindow } from "@/components/AppWindow";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { CategoryBar } from "@/components/CategoryBar";
import { downscaleImage } from "@/lib/downscale";
import { sampleScorecard, SAMPLE_HELD_BACK } from "@/lib/sample-data";
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

export function DemoScanner() {
  const [locale, setLocale] = useState<Locale>("en");
  const [status, setStatus] = useState<Status>("done");
  const [result, setResult] = useState<ScanResult | null>(() =>
    sampleScorecard("en"),
  );
  const [isSample, setIsSample] = useState(true);
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
        setResult(locale === "es" ? data.scorecardEs : data.scorecard);
        setStatus("done");
      } catch {
        setErrorMsg(t.tryError);
        setStatus("error");
      }
    },
    [locale, storeName, t.tryError],
  );

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void runScan(file);
  };

  const loadSample = () => {
    setResult(sampleScorecard(locale));
    setIsSample(true);
    setStatus("done");
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setIsSample(false);
    setErrorMsg("");
  };

  const switchLocale = (next: Locale) => {
    setLocale(next);
    if (isSample) setResult(sampleScorecard(next));
  };

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
    {
      value: String(SAMPLE_HELD_BACK.length),
      label: es ? "líneas retenidas" : "lines held back",
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

      {isSample ? (
        <div className={styles.heldBack}>
          <h3 className={styles.blockTitle}>
            {es ? "Líneas que no contamos" : "Lines we did not count"}
          </h3>
          <p className={styles.blockIntro}>
            {es
              ? "Cada línea que el escaneo no pudo contar con certeza aparece aquí con el motivo. Ninguna se adivina."
              : "Every line the scan could not count with certainty is listed here with the reason. None of them are guessed at."}
          </p>
          <table className={styles.hbTable}>
            <thead>
              <tr>
                <th>{es ? "Línea" : "Line"}</th>
                <th>{es ? "Presentación" : "Pack"}</th>
                <th>{es ? "Motivo" : "Reason"}</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_HELD_BACK.map((row) => (
                <tr key={row.line}>
                  <td className={styles.hbLine}>{row.line}</td>
                  <td className={styles.hbPack}>{row.pack}</td>
                  <td className={styles.hbReason}>{es ? row.reasonEs : row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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
