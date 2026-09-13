"use client";

/**
 * The unified screen: one readiness figure over every obligation, with the
 * order-record scan feeding straight into it.
 *
 * The scan is not a separate toy here. A scorecard that comes back short moves
 * SNAP to "action needed" and the ring drops, which is the whole point of
 * putting stocking and paperwork on one page.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { CategoryBar } from "@/components/CategoryBar";
import { Pill } from "@/components/Pill";
import { StatRing } from "@/components/StatRing";
import { DemoScanner } from "@/components/demo/DemoScanner";
import { OBLIGATION_BY_KEY, SNAP_RULE } from "@/lib/compliance";
import { REQUIRED_VARIETIES } from "@/lib/ui-copy";
import type { ScanResult } from "@/lib/mock-data";
import {
  STATUS_LABEL,
  bySeverity,
  evaluateAll,
  formatDate,
  loadStore,
  readiness,
  relativeDays,
  sampleStore,
  saveStore,
  scanEvidence,
  stateFor,
  withObligation,
  type ObligationStatus,
  type Status,
  type Store,
} from "@/lib/store";
import styles from "./StoreDashboard.module.css";

/** The four statuses the Pill knows, mapped from the six the engine reports. */
const TONE: Record<Status, "ok" | "warn" | "bad" | "neutral"> = {
  ok: "ok",
  soon: "warn",
  critical: "bad",
  expired: "bad",
  missing: "neutral",
  na: "neutral",
};

/** Framer's standard ease, shared with the rest of the site's motion. */
const EASE = [0.22, 0.68, 0.28, 1] as const;

export function StoreDashboard() {
  const reduce = useReducedMotion();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Read storage after mount so the server HTML and the first client render
  // agree. ?demo=1 seeds the sample store for links off the marketing site.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      const sample = sampleStore();
      saveStore(sample);
      setStore(sample);
    } else {
      setStore(loadStore());
    }
    setLoading(false);
  }, []);

  function update(next: Store) {
    saveStore(next);
    setStore(next);
  }

  function onScan(result: ScanResult) {
    const base = store ?? sampleStore();
    update({ ...base, lastScan: { at: new Date().toISOString(), result } });
    setScanning(false);
  }

  if (loading) {
    return <p className="small mute">Loading…</p>;
  }

  if (!store) {
    return (
      <div className={styles.empty}>
        <h2 className="heading">No store loaded yet</h2>
        <p className="small mute">
          Everything stays in this browser. There is no account and no database.
        </p>
        <div className={styles.emptyActions}>
          <Button onClick={() => update(sampleStore())}>Load a sample store</Button>
        </div>
      </div>
    );
  }

  const statuses = evaluateAll(store).sort(bySeverity);
  const score = readiness(statuses);
  const evidence = scanEvidence(store);
  const attention = statuses.filter(
    (s) => s.status === "expired" || s.status === "critical" || s.status === "missing",
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.topGrid}>
        <Reveal className={styles.ringCard} y={16}>
          <StatRing
            percent={Math.round(score.ratio * 100)}
            size={148}
            label="Ready"
            tone={attention.length > 0 ? "bad" : "blue"}
          />
          <div>
            <p className={styles.ringHead}>
              {score.ok} of {score.applicable} obligations on track
            </p>
            <p className="small mute">
              {attention.length > 0
                ? `${attention.length} need${attention.length === 1 ? "s" : ""} attention now.`
                : "Nothing is overdue."}
            </p>
          </div>
        </Reveal>

        <Reveal className={styles.stockCard} y={16} delay={0.06}>
          <div className={styles.stockHead}>
            <div>
              <span className="eyebrow mute">Staple stocking</span>
              <h2 className="heading">{store.name || "Your store"}</h2>
            </div>
            {evidence ? (
              <Pill tone={evidence.result.overallStatus === "pass" ? "ok" : "bad"}>
                {evidence.result.overallStatus === "pass" ? "Meets the standard" : "Short"}
              </Pill>
            ) : (
              <Pill tone="neutral">No order record yet</Pill>
            )}
          </div>

          {evidence ? (
            <motion.div
              // Keyed on the scan, so a fresh result animates in rather than
              // mutating the numbers under the reader.
              key={store.lastScan?.at ?? "none"}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: EASE }}
              className={styles.stockBody}
            >
              <div className={styles.bars}>
                {evidence.result.categories.map((c, i) => (
                  <CategoryBar
                    key={c.category}
                    name={c.label}
                    count={c.varietiesFound}
                    target={REQUIRED_VARIETIES}
                    index={i}
                  />
                ))}
              </div>
              <p className="small mute">
                {evidence.result.totalUnits} of {SNAP_RULE.totalUnits} units ·{" "}
                {evidence.result.perishableCategoriesMet} of{" "}
                {SNAP_RULE.perishableCategoriesRequired} categories with a perishable ·
                scanned {evidence.ageDays === 0 ? "today" : relativeDays(-evidence.ageDays)}
              </p>
              {!evidence.fresh ? (
                <p className={styles.stale}>
                  This order record is older than the {SNAP_RULE.recentOrderWindowDays} day window,
                  so it no longer counts as evidence of what is on the shelf. Scan a recent
                  delivery.
                </p>
              ) : null}
            </motion.div>
          ) : (
            <p className="small mute">
              Photograph a wholesale order record and the result lands here. Orders from the last{" "}
              {SNAP_RULE.recentOrderWindowDays} days count toward stock, which is what makes an
              order record evidence.
            </p>
          )}

          <div className={styles.stockActions}>
            <Button variant={evidence ? "secondary" : "primary"} onClick={() => setScanning((v) => !v)}>
              {scanning ? "Close scanner" : evidence ? "Scan another order record" : "Scan an order record"}
            </Button>
          </div>
        </Reveal>
      </div>

      <AnimatePresence initial={false}>
        {scanning ? (
          <motion.div
            key="scanner"
            className={styles.scanner}
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={reduce ? undefined : { opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <DemoScanner onResult={onScan} startEmpty />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Reveal as="div" className={styles.listSection} y={16} delay={0.12}>
        <h2 className="heading">Everything this store answers to</h2>
        <p className="small mute">
          Worst first. Open any row to edit its date, work its checklist or keep a note.
          The scan moves SNAP on its own.
        </p>
        <div className={styles.rows}>
          {statuses.map((s) => (
            <ObligationRow
              key={s.key}
              status={s}
              store={store}
              update={update}
              open={openKey === s.key}
              onToggle={() => setOpenKey(openKey === s.key ? null : s.key)}
              reduce={!!reduce}
            />
          ))}
        </div>
      </Reveal>
    </div>
  );
}


/**
 * One obligation, closed to a summary line and open to everything the store can
 * change about it. Kept in this file because it only ever appears here and
 * needs the same update function the dashboard already owns.
 */
function ObligationRow({
  status,
  store,
  update,
  open,
  onToggle,
  reduce,
}: {
  status: ObligationStatus;
  store: Store;
  update: (next: Store) => void;
  open: boolean;
  onToggle: () => void;
  reduce: boolean;
}) {
  const o = OBLIGATION_BY_KEY[status.key];
  const state = stateFor(store, status.key);
  const panelId = `panel-${status.key}`;

  const setValue = (key: string, value: string) =>
    update(withObligation(store, status.key, { values: { ...state.values, [key]: value } }));

  const toggleRequirement = (index: number) => {
    const done = state.done.includes(index)
      ? state.done.filter((i) => i !== index)
      : [...state.done, index];
    update(withObligation(store, status.key, { done }));
  };

  return (
    <div className={styles.row} data-open={open}>
      <button
        type="button"
        className={styles.rowHead}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.rowCaret} aria-hidden="true" />
        <span className={styles.rowMain}>
          <span className={styles.rowName}>{o.name}</span>
          <span className={styles.sub}>{o.agency}</span>
        </span>
        <span className={styles.rowDue}>
          {status.date ? (
            <>
              {formatDate(status.date)}
              {status.days !== null ? (
                <span className={styles.sub}>{relativeDays(status.days)}</span>
              ) : null}
            </>
          ) : (
            <span className="small mute">No date yet</span>
          )}
        </span>
        <span className={`${styles.rowCheck} tnum`}>
          {status.checked}/{status.total}
        </span>
        <Pill tone={TONE[status.status]}>{STATUS_LABEL[status.status]}</Pill>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? undefined : { height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.panel}>
              <div className={styles.panelGrid}>
                <div>
                  <h3 className={styles.panelHead}>Details</h3>
                  {o.fields.length === 0 ? (
                    <p className="small mute">
                      Tracked per employee rather than as one store-wide date.
                    </p>
                  ) : (
                    o.fields.map((f) => (
                      <label key={f.key} className={styles.field}>
                        <span className={styles.fieldLabel}>{f.label}</span>
                        <input
                          type={f.type === "date" ? "date" : "text"}
                          value={state.values[f.key] ?? ""}
                          onChange={(e) => setValue(f.key, e.target.value)}
                        />
                        {f.hint ? <span className={styles.sub}>{f.hint}</span> : null}
                      </label>
                    ))
                  )}
                  <p className={styles.penalty}>
                    <strong>If it lapses:</strong> {o.penalty}
                  </p>
                </div>

                <div>
                  <h3 className={styles.panelHead}>
                    Requirements <span className="tnum">{status.checked}/{status.total}</span>
                  </h3>
                  {o.requirements.map((req, i) => (
                    <label key={req} className={styles.check}>
                      <input
                        type="checkbox"
                        checked={state.done.includes(i)}
                        onChange={() => toggleRequirement(i)}
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Your notes</span>
                <textarea
                  value={state.note ?? ""}
                  placeholder="What you are waiting on, who you spoke to, where the paperwork is."
                  onChange={(e) =>
                    update(withObligation(store, status.key, { note: e.target.value }))
                  }
                />
              </label>

              <div className={styles.panelFoot}>
                <p className="small mute">{o.notes}</p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    update(
                      withObligation(store, status.key, {
                        notApplicable: !state.notApplicable,
                      }),
                    )
                  }
                >
                  {state.notApplicable ? "This does apply to us" : "Mark not applicable"}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
