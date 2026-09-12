"use client";

/**
 * Loads the store on the client and keeps it in sync with storage.
 *
 * Nothing reads storage during render. The first paint is always the `loading`
 * state, which keeps the server-rendered HTML and the first client render
 * identical and avoids a hydration mismatch.
 *
 * `?demo=1` seeds the sample store and drops the query string, so every link
 * from the marketing site lands on a populated dashboard with no setup screen.
 */
import { useCallback, useEffect, useState } from "react";
import { clearStore, loadStore, sampleStore, saveStore, type Store } from "@/lib/store";

export interface UseStore {
  store: Store | null;
  /** False until the first client-side read has happened. */
  loading: boolean;
  /** Replace the store and persist it. */
  update: (next: Store) => void;
  /** Load the sample store, as the "Load a sample store" button does. */
  loadSample: () => void;
  /** Forget everything in this browser and fall back to the setup prompt. */
  reset: () => void;
}

export function useStore(): UseStore {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      const sample = sampleStore();
      saveStore(sample);
      setStore(sample);
      setLoading(false);
      return;
    }
    setStore(loadStore());
    setLoading(false);
  }, []);

  const update = useCallback((next: Store) => {
    saveStore(next);
    setStore(next);
  }, []);

  const loadSample = useCallback(() => {
    const sample = sampleStore();
    saveStore(sample);
    setStore(sample);
  }, []);

  const reset = useCallback(() => {
    clearStore();
    setStore(null);
  }, []);

  return { store, loading, update, loadSample, reset };
}
