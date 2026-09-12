"use client";

/**
 * One obligation: its fields, its checklist, its notes, and the extra tool it
 * needs. SNAP gets the staple-stocking calculator; food handler cards get the
 * staff roster, because they expire per employee rather than per store.
 */
import Link from "next/link";
import {
  SNAP_RULE,
  STAPLE_CATEGORIES,
  getObligation,
  type ObligationKey,
} from "@/lib/compliance";
import {
  FOOD_HANDLER_VALID_YEARS,
  evaluate,
  formatDate,
  relativeDays,
  stateFor,
  statusFromDays,
  daysUntil,
  withObligation,
  type Employee,
  type Store,
} from "@/lib/store";
import { Card, Meter, Page, PageHead, Pill } from "@/components/Shell";
import { LoadingPage, NoStorePage } from "@/components/Gate";
import { useStore } from "@/components/useStore";

/** Stocking figures live alongside the obligation's other values. */
const stockKey = (cat: string, part: "varieties" | "units" | "perishable") =>
  `stock.${cat}.${part}`;

function toCount(raw: string | undefined): number {
  const n = Number.parseInt((raw ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function StockingCalculator({
  store,
  update,
}: {
  store: Store;
  update: (next: Store) => void;
}) {
  const values = stateFor(store, "snap").values;

  const set = (key: string, value: string) =>
    update(withObligation(store, "snap", { values: { ...values, [key]: value } }));

  const rows = STAPLE_CATEGORIES.map((cat) => {
    const varieties = toCount(values[stockKey(cat.key, "varieties")]);
    const units = toCount(values[stockKey(cat.key, "units")]);
    const perishable = values[stockKey(cat.key, "perishable")] === "yes";
    return { cat, varieties, units, perishable };
  });

  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  const categoriesMet = rows.filter((r) => r.varieties >= SNAP_RULE.varietiesPerCategory).length;
  const perishableMet = rows.filter((r) => r.perishable).length;
  const passes =
    categoriesMet === SNAP_RULE.categoryCount &&
    totalUnits >= SNAP_RULE.totalUnits &&
    perishableMet >= SNAP_RULE.perishableCategoriesRequired;

  return (
    <Card title="Staple stocking calculator">
      <p className="card-note">
        Count only varieties carrying {SNAP_RULE.unitsPerVariety} or more stocking units.
        Anything below that does not count at all. Butter and jerky are accessory foods and
        count for nothing.
      </p>

      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Category</th>
            <th style={{ width: 128 }}>Varieties</th>
            <th style={{ width: 128 }}>Stocking units</th>
            <th style={{ width: 118 }}>Perishable</th>
            <th style={{ width: 92 }}>Meets {SNAP_RULE.varietiesPerCategory}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cat.key}>
              <td style={{ fontWeight: 500 }}>{r.cat.label}</td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`${r.cat.label} varieties`}
                  value={values[stockKey(r.cat.key, "varieties")] ?? ""}
                  onChange={(e) => set(stockKey(r.cat.key, "varieties"), e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`${r.cat.label} stocking units`}
                  value={values[stockKey(r.cat.key, "units")] ?? ""}
                  onChange={(e) => set(stockKey(r.cat.key, "units"), e.target.value)}
                />
              </td>
              <td>
                <div className="check">
                  <input
                    id={`perishable-${r.cat.key}`}
                    type="checkbox"
                    checked={r.perishable}
                    onChange={(e) =>
                      set(stockKey(r.cat.key, "perishable"), e.target.checked ? "yes" : "")
                    }
                  />
                  <label htmlFor={`perishable-${r.cat.key}`}>Yes</label>
                </div>
              </td>
              <td>
                <Pill status={r.varieties >= SNAP_RULE.varietiesPerCategory ? "ok" : "critical"}>
                  {r.varieties >= SNAP_RULE.varietiesPerCategory ? "Met" : `${r.varieties}/${SNAP_RULE.varietiesPerCategory}`}
                </Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="stat-row" style={{ marginTop: 16 }}>
        <div>
          <div className="stat-label">Categories at {SNAP_RULE.varietiesPerCategory} varieties</div>
          <div className="stat-value num">
            {categoriesMet} / {SNAP_RULE.categoryCount}
          </div>
        </div>
        <div>
          <div className="stat-label">Total stocking units</div>
          <div className="stat-value num">
            {totalUnits} / {SNAP_RULE.totalUnits}
          </div>
        </div>
        <div>
          <div className="stat-label">Categories with a perishable</div>
          <div className="stat-value num">
            {perishableMet} / {SNAP_RULE.perishableCategoriesRequired}
          </div>
        </div>
        <div>
          <div className="stat-label">Verdict</div>
          <div style={{ marginTop: 4 }}>
            <Pill status={passes ? "ok" : "critical"}>{passes ? "Meets the standard" : "Short"}</Pill>
          </div>
        </div>
      </div>

      <p className="caveat">
        Orders received in the last {SNAP_RULE.recentOrderWindowDays} days count toward stock,
        which is why an invoice is evidence. <Link href="/scan">Scan one</Link> to fill this in
        from a delivery.
      </p>
    </Card>
  );
}

function StaffRoster({ store, update }: { store: Store; update: (next: Store) => void }) {
  const setEmployees = (employees: Employee[]) => update({ ...store, employees });

  const add = () =>
    setEmployees([
      ...store.employees,
      { id: `e${Date.now().toString(36)}`, name: "", cardExpires: "" },
    ]);

  const patch = (id: string, change: Partial<Employee>) =>
    setEmployees(store.employees.map((e) => (e.id === id ? { ...e, ...change } : e)));

  return (
    <Card
      title="Staff roster"
      action={
        <button type="button" className="btn btn-quiet" onClick={add}>
          Add an employee
        </button>
      }
    >
      <p className="card-note">
        A card is valid {FOOD_HANDLER_VALID_YEARS} years from issue. The soonest expiry drives this
        obligation&apos;s status, because that is the one an inspection finds first.
      </p>
      {store.employees.length === 0 ? (
        <div className="empty">No employees yet.</div>
      ) : (
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: 180 }}>Card expires</th>
              <th style={{ width: 130 }}>Status</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {store.employees.map((e) => {
              const days = daysUntil(e.cardExpires);
              return (
                <tr key={e.id}>
                  <td>
                    <input
                      type="text"
                      aria-label="Employee name"
                      placeholder="Name"
                      value={e.name}
                      onChange={(ev) => patch(e.id, { name: ev.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      aria-label="Card expiry"
                      value={e.cardExpires}
                      onChange={(ev) => patch(e.id, { cardExpires: ev.target.value })}
                    />
                  </td>
                  <td>
                    <Pill status={statusFromDays(days)} />
                    {days !== null ? <div className="row-sub">{relativeDays(days)}</div> : null}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      aria-label={`Remove ${e.name || "employee"}`}
                      onClick={() => setEmployees(store.employees.filter((x) => x.id !== e.id))}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default function Detail({ obligationKey }: { obligationKey: ObligationKey }) {
  const { store, loading, loadSample, update } = useStore();
  const obligation = getObligation(obligationKey);

  if (loading) return <LoadingPage />;
  if (!store) return <NoStorePage onLoadSample={loadSample} />;
  if (!obligation) {
    return (
      <Page>
        <PageHead title="Unknown obligation">
          <Link href="/licenses">Back to the list</Link>
        </PageHead>
      </Page>
    );
  }

  const state = stateFor(store, obligation.key);
  const status = evaluate(store, obligation);

  const setValue = (key: string, value: string) =>
    update(withObligation(store, obligation.key, { values: { ...state.values, [key]: value } }));

  const toggleRequirement = (index: number) => {
    const done = state.done.includes(index)
      ? state.done.filter((i) => i !== index)
      : [...state.done, index];
    update(withObligation(store, obligation.key, { done }));
  };

  return (
    <Page>
      <PageHead title={obligation.name}>
        {obligation.agency}. {obligation.cadence}.
      </PageHead>

      <Card>
        <div className="stat-row">
          <div>
            <div className="stat-label">Status</div>
            <div style={{ marginTop: 4 }}>
              <Pill status={status.status} />
            </div>
          </div>
          {status.date ? (
            <div>
              <div className="stat-label">Next date</div>
              <div className="stat-value num">{formatDate(status.date)}</div>
              {status.days !== null ? (
                <div className="card-note">{relativeDays(status.days)}</div>
              ) : null}
            </div>
          ) : null}
          <div>
            <div className="stat-label">Checklist</div>
            <div className="stat-value num">
              {status.checked} / {status.total}
            </div>
          </div>
        </div>
        <div className={`notice ${status.status === "expired" ? "notice-fail" : "notice-warn"}`} style={{ marginTop: 16 }}>
          <strong>If it lapses:</strong> {obligation.penalty}
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              update(
                withObligation(store, obligation.key, { notApplicable: !state.notApplicable }),
              )
            }
          >
            {state.notApplicable ? "This does apply to us" : "Mark not applicable"}
          </button>
        </div>
      </Card>

      {obligation.fields.length > 0 ? (
        <Card title="Details on file">
          {obligation.fields.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`f-${f.key}`}>{f.label}</label>
              <input
                id={`f-${f.key}`}
                type={f.type === "date" ? "date" : "text"}
                value={state.values[f.key] ?? ""}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
              {f.hint ? <div className="field-hint">{f.hint}</div> : null}
            </div>
          ))}
        </Card>
      ) : null}

      {obligation.key === "foodHandler" ? <StaffRoster store={store} update={update} /> : null}
      {obligation.key === "snap" ? <StockingCalculator store={store} update={update} /> : null}

      <Card title="Requirements">
        <Meter value={status.checked} max={status.total} />
        <div style={{ marginTop: 10 }}>
          {obligation.requirements.map((req, i) => (
            <div className="check" key={req}>
              <input
                id={`req-${obligation.key}-${i}`}
                type="checkbox"
                checked={state.done.includes(i)}
                onChange={() => toggleRequirement(i)}
              />
              <label htmlFor={`req-${obligation.key}-${i}`}>{req}</label>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Notes">
        <p className="card-note" style={{ marginTop: 0 }}>{obligation.notes}</p>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="own-note">Your notes</label>
          <textarea
            id="own-note"
            value={state.note ?? ""}
            placeholder="What you are waiting on, who you spoke to, where the paperwork is."
            onChange={(e) => update(withObligation(store, obligation.key, { note: e.target.value }))}
          />
        </div>
      </Card>
    </Page>
  );
}
