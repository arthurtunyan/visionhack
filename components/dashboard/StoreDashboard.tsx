"use client";

/**
 * The unified screen: one readiness figure over every obligation, with the
 * invoice scan feeding straight into it.
 *
 * The scan is not a separate toy here. A scorecard that comes back short moves
 * SNAP to "action needed" and the ring drops, which is the whole point of
 * putting stocking and paperwork on one page.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { CategoryBar } from "@/components/CategoryBar";
import { DataTable } from "@/components/DataTable";
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

export function StoreDashboard() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

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
        <div className={styles.ringCard}>
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
        </div>

        <div className={styles.stockCard}>
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
              <Pill tone="neutral">No invoice yet</Pill>
            )}
          </div>

          {evidence ? (
            <>
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
                  This invoice is older than the {SNAP_RULE.recentOrderWindowDays} day window,
                  so it no longer counts as evidence of what is on the shelf. Scan a recent
                  delivery.
                </p>
              ) : null}
            </>
          ) : (
            <p className="small mute">
              Photograph a delivery invoice and the result lands here. Orders from the last{" "}
              {SNAP_RULE.recentOrderWindowDays} days count toward stock, which is what makes an
              invoice evidence.
            </p>
          )}

          <div className={styles.stockActions}>
            <Button variant={evidence ? "secondary" : "primary"} onClick={() => setScanning((v) => !v)}>
              {scanning ? "Close scanner" : evidence ? "Scan another invoice" : "Scan an invoice"}
            </Button>
          </div>
        </div>
      </div>

      {scanning ? (
        <div className={styles.scanner}>
          <DemoScanner onResult={onScan} />
        </div>
      ) : null}

      <section className={styles.listSection}>
        <h2 className="heading">Everything this store answers to</h2>
        <p className="small mute">Worst first. The scan moves SNAP on its own.</p>
        <DataTable
          columns={[
            { key: "name", header: "Obligation" },
            { key: "agency", header: "Agency" },
            { key: "due", header: "Next date" },
            { key: "checklist", header: "Checklist", numeric: true },
            { key: "status", header: "Status" },
          ]}
          rows={statuses.map((s) => {
            const o = OBLIGATION_BY_KEY[s.key];
            return {
              name: (
                <>
                  <strong>{o.name}</strong>
                  <span className={styles.sub}>{o.penalty}</span>
                </>
              ),
              agency: <span className="small mute">{o.agency}</span>,
              due: s.date ? (
                <>
                  {formatDate(s.date)}
                  {s.days !== null ? <span className={styles.sub}>{relativeDays(s.days)}</span> : null}
                </>
              ) : (
                <span className="small mute">—</span>
              ),
              checklist: `${s.checked}/${s.total}`,
              status: <Pill tone={TONE[s.status]}>{STATUS_LABEL[s.status]}</Pill>,
            };
          })}
        />
      </section>
    </div>
  );
}
