"use client";

/**
 * What every screen shows before the store exists: a blank frame while the
 * client reads storage, then a prompt to set up or load the sample.
 */
import Link from "next/link";
import { Card, Page, PageHead } from "./Shell";

export function LoadingPage() {
  return (
    <Page>
      <div className="empty">Loading…</div>
    </Page>
  );
}

export function NoStorePage({ onLoadSample }: { onLoadSample: () => void }) {
  return (
    <Page>
      <PageHead title="No store set up yet">
        Add your store to start tracking licences and deadlines, or load a sample
        store to look around first.
      </PageHead>
      <Card>
        <p className="card-note">
          Everything stays in this browser. There is no account and no database.
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={onLoadSample}>
            Load a sample store
          </button>
          <Link className="btn btn-secondary" href="/setup">
            Set up my store
          </Link>
        </div>
      </Card>
    </Page>
  );
}
