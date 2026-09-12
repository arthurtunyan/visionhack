"use client";

import { useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { Scorecard } from "@/components/scorecard";
import { Uploader } from "@/components/uploader";
import type { ScanResult } from "@/lib/mock-data";
import { sampleScorecard } from "@/lib/sample-data";
import type { Locale } from "@/lib/scorecard-copy";
import { UI_COPY } from "@/lib/ui-copy";
import { downscaleImage } from "@/lib/downscale";

type Status = "idle" | "scanning" | "done" | "error";

/** Both language copies of a scorecard, so switching language never re-scans. */
interface Bilingual {
  en: ScanResult;
  es: ScanResult;
}

export function Dashboard() {
  const [locale, setLocale] = useState<Locale>("en");
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<Bilingual | null>(null);
  const [isSample, setIsSample] = useState(false);

  const copy = UI_COPY[locale];
  const shown = useMemo(() => (result ? result[locale] : null), [result, locale]);

  async function handleScan(file: File) {
    setStatus("scanning");
    setErrorMsg("");
    setIsSample(false);
    try {
      const image = await downscaleImage(file);
      const form = new FormData();
      form.append("image", image);
      if (storeName.trim()) form.append("storeName", storeName.trim());

      const res = await fetch("/api/scan", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error?.message ?? `Request failed (${res.status}).`);
        setStatus("error");
        return;
      }
      setResult({ en: data.scorecard, es: data.scorecardEs });
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error.");
      setStatus("error");
    }
  }

  function handleSample() {
    setResult({ en: sampleScorecard("en"), es: sampleScorecard("es") });
    setIsSample(true);
    setStatus("done");
    setErrorMsg("");
  }

  function reset() {
    setResult(null);
    setStatus("idle");
    setErrorMsg("");
    setIsSample(false);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex items-center justify-between gap-4 border-b border-hairline pb-6">
        <Logo className="h-7 w-auto" />
        <LanguageToggle locale={locale} onChange={setLocale} />
      </header>

      <main className="flex flex-1 flex-col pt-8">
        <p className="mb-8 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {copy.tagline}
        </p>

        {status !== "done" || !shown ? (
          <>
            <h1 className="mb-6 text-xl font-semibold tracking-tight text-ink">{copy.uploadTitle}</h1>
            <Uploader
              copy={copy}
              storeName={storeName}
              onStoreNameChange={setStoreName}
              onScan={handleScan}
              onLoadSample={handleSample}
              scanning={status === "scanning"}
            />
            {status === "error" && (
              <div
                role="alert"
                className="mt-6 border border-ink bg-muted px-4 py-3 text-sm text-ink"
              >
                <span className="font-mono text-[11px] uppercase tracking-widest">{copy.tryError}: </span>
                {errorMsg}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight text-ink">{copy.uploadTitle}</h1>
              <button
                type="button"
                onClick={reset}
                className="border border-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                {copy.rescan}
              </button>
            </div>
            <Scorecard result={shown} copy={copy} isSample={isSample} />
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-hairline pt-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {copy.requiredNote}
        </p>
      </footer>
    </div>
  );
}

function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  const options: Locale[] = ["en", "es"];
  return (
    <div className="flex border border-hairline" role="group" aria-label="Language">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={locale === opt}
          className={`px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
            locale === opt ? "bg-ink text-paper" : "bg-paper text-muted-foreground hover:text-ink"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
