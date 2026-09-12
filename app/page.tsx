"use client";

/**
 * Dashboard: how ready the store is, what lands next, and the full obligation
 * list underneath.
 */
import Link from "next/link";
import { OBLIGATION_BY_KEY, SNAP_RULE } from "@/lib/compliance";
import {
  bySeverity,
  evaluateAll,
  formatDate,
  readiness,
  relativeDays,
  type ObligationStatus,
} from "@/lib/store";
import { Card, Donut, Page, PageHead, Pill } from "@/components/Shell";
import { LoadingPage, NoStorePage } from "@/components/Gate";
import { useStore } from "@/components/useStore";

function ObligationRow({ s }: { s: ObligationStatus }) {
  const o = OBLIGATION_BY_KEY[s.key];
  return (
    <Link className="row" href={`/c/${s.key}`}>
      <div className="row-main">
        <div className="row-name">{o.name}</div>
        <div className="row-sub">{o.agency}</div>
      </div>
      <div className="row-side">
        {s.date ? (
          <>
            <div className="num">{formatDate(s.date)}</div>
            {s.days !== null ? <div>{relativeDays(s.days)}</div> : null}
          </>
        ) : (
          <div>{s.status === "na" ? "Marked not applicable" : "No date on file"}</div>
        )}
      </div>
      <Pill status={s.status} />
    </Link>
  );
}

export default function Dashboard() {
  const { store, loading, loadSample } = useStore();

  if (loading) return <LoadingPage />;
  if (!store) return <NoStorePage onLoadSample={loadSample} />;

  const statuses = evaluateAll(store).sort(bySeverity);
  const score = readiness(statuses);
  const needsAttention = statuses.filter(
    (s) => s.status === "expired" || s.status === "critical" || s.status === "missing",
  );
  const upcoming = statuses
    .filter((s) => s.days !== null && s.days >= 0)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 4);

  return (
    <Page>
      <PageHead title={store.name || "Your store"}>
        {store.address || "Eight obligations tracked. Worst first."}
      </PageHead>

      <div className="grid grid-2">
        <Card>
          <div className="donut-wrap">
            <Donut ratio={score.ratio} />
            <div>
              <div className="stat-value num">
                {score.ok} of {score.applicable}
              </div>
              <div className="stat-label">obligations on track</div>
              {needsAttention.length > 0 ? (
                <div className="caveat">
                  {needsAttention.length} need
                  {needsAttention.length === 1 ? "s" : ""} attention now.
                </div>
              ) : (
                <div className="caveat">Nothing is overdue.</div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Next deadlines">
          {upcoming.length === 0 ? (
            <p className="card-note">No dates on file yet. Add them from any licence page.</p>
          ) : (
            <div className="rows">
              {upcoming.map((s) => (
                <ObligationRow key={s.key} s={s} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {needsAttention.length > 0 ? (
        <Card title="Needs attention">
          <div className="rows">
            {needsAttention.map((s) => (
              <ObligationRow key={s.key} s={s} />
            ))}
          </div>
        </Card>
      ) : null}

      <Card
        title="All obligations"
        action={
          <Link className="card-note" href="/licenses">
            Full list
          </Link>
        }
      >
        <div className="rows">
          {statuses.map((s) => (
            <ObligationRow key={s.key} s={s} />
          ))}
        </div>
      </Card>

      <Card title="SNAP staple stocking">
        <p className="card-note">
          The standard asks for {SNAP_RULE.varietiesPerCategory} varieties in each of the{" "}
          {SNAP_RULE.categoryCount} staple categories, {SNAP_RULE.unitsPerVariety} stocking units
          per variety, {SNAP_RULE.totalUnits} units in total, and a perishable variety in at least{" "}
          {SNAP_RULE.perishableCategoriesRequired} of the {SNAP_RULE.categoryCount}.
        </p>
        <div className="btn-row">
          <Link className="btn" href="/scan">
            Scan an invoice
          </Link>
          <Link className="btn btn-secondary" href="/c/snap">
            Open the stocking calculator
          </Link>
        </div>
        <p className="caveat">
          Existing retailers are measured at their regular reauthorization, roughly a
          five-year cycle. The 4 November 2026 compliance date is a hard deadline for new
          applicants only.
        </p>
      </Card>
    </Page>
  );
}
