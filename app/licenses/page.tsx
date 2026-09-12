"use client";

/**
 * Every obligation in one table: who asks for it, how often, and what happens
 * if it lapses. The dashboard triages; this page is the reference.
 */
import Link from "next/link";
import { OBLIGATION_BY_KEY } from "@/lib/compliance";
import { bySeverity, evaluateAll, formatDate, relativeDays } from "@/lib/store";
import { Card, Meter, Page, PageHead, Pill } from "@/components/Shell";
import { LoadingPage, NoStorePage } from "@/components/Gate";
import { useStore } from "@/components/useStore";

export default function Licenses() {
  const { store, loading, loadSample } = useStore();

  if (loading) return <LoadingPage />;
  if (!store) return <NoStorePage onLoadSample={loadSample} />;

  const statuses = evaluateAll(store).sort(bySeverity);

  return (
    <Page>
      <PageHead title="Licences and permits">
        Everything {store.name || "this store"} answers to, worst first. Open one to
        edit its dates, work its checklist and keep notes.
      </PageHead>

      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Obligation</th>
              <th>Agency</th>
              <th>Cadence</th>
              <th>Next date</th>
              <th>Checklist</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => {
              const o = OBLIGATION_BY_KEY[s.key];
              return (
                <tr key={s.key}>
                  <td>
                    <Link href={`/c/${s.key}`} style={{ fontWeight: 500 }}>
                      {o.name}
                    </Link>
                    <div className="row-sub">{o.penalty}</div>
                  </td>
                  <td>{o.agency}</td>
                  <td>{o.cadence}</td>
                  <td className="num">
                    {s.date ? (
                      <>
                        {formatDate(s.date)}
                        {s.days !== null ? (
                          <div className="row-sub">{relativeDays(s.days)}</div>
                        ) : null}
                      </>
                    ) : (
                      <span className="card-note">—</span>
                    )}
                  </td>
                  <td style={{ minWidth: 92 }}>
                    <div className="row-sub num">
                      {s.checked} of {s.total}
                    </div>
                    <Meter value={s.checked} max={s.total} />
                  </td>
                  <td>
                    <Pill status={s.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
