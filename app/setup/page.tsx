"use client";

/**
 * Store setup. Name, address, and the renewal dates that drive every status,
 * in one pass so a new store is not clicking through eight pages to get going.
 */
import { useRouter } from "next/navigation";
import { OBLIGATIONS, statusField } from "@/lib/compliance";
import {
  emptyStore,
  stateFor,
  withObligation,
  type Store,
} from "@/lib/store";
import { Card, Page, PageHead } from "@/components/Shell";
import { LoadingPage } from "@/components/Gate";
import { useStore } from "@/components/useStore";

export default function Setup() {
  const { store, loading, update, loadSample, reset } = useStore();
  const router = useRouter();

  if (loading) return <LoadingPage />;

  const current: Store = store ?? emptyStore();

  return (
    <Page>
      <PageHead title="Store setup">
        Enter the store once and the dashboard tracks it. Everything is kept in this
        browser, so there is no account to make and nothing to upload.
      </PageHead>

      <Card title="The store">
        <div className="field">
          <label htmlFor="store-name">Store name</label>
          <input
            id="store-name"
            type="text"
            placeholder="Rivera's Corner Market"
            value={current.name}
            onChange={(e) => update({ ...current, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="store-address">Address</label>
          <input
            id="store-address"
            type="text"
            placeholder="4218 S Central Ave, Los Angeles, CA 90011"
            value={current.address}
            onChange={(e) => update({ ...current, address: e.target.value })}
          />
        </div>
      </Card>

      <Card title="Renewal dates">
        <p className="card-note">
          Fill in what you know. A blank date shows as not set rather than on track, so
          nothing is assumed to be fine.
        </p>
        <div style={{ marginTop: 12 }}>
          {OBLIGATIONS.map((o) => {
            const field = statusField(o);
            if (!field) return null;
            const state = stateFor(current, o.key);
            return (
              <div className="field" key={o.key}>
                <label htmlFor={`setup-${o.key}`}>
                  {o.name} — {field.label}
                </label>
                <input
                  id={`setup-${o.key}`}
                  type="date"
                  value={state.values[field.key] ?? ""}
                  onChange={(e) =>
                    update(
                      withObligation(current, o.key, {
                        values: { ...state.values, [field.key]: e.target.value },
                      }),
                    )
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => router.push("/")}>
            Go to the dashboard
          </button>
        </div>
      </Card>

      <Card title="Sample store">
        <p className="card-note">
          Loads Rivera&apos;s Corner Market with a lapsed city tobacco permit, an ABC renewal
          landing this month and an expired food handler card. This replaces whatever is in
          this browser now.
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              loadSample();
              router.push("/");
            }}
          >
            Load a sample store
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              reset();
            }}
          >
            Clear this browser
          </button>
        </div>
      </Card>
    </Page>
  );
}
