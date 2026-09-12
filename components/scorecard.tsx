"use client";

import type { ScanResult } from "@/lib/mock-data";
import { REQUIRED_UNITS, REQUIRED_VARIETIES, type UiCopy } from "@/lib/ui-copy";

interface ScorecardProps {
  result: ScanResult;
  copy: UiCopy;
  isSample: boolean;
}

export function Scorecard({ result, copy, isSample }: ScorecardProps) {
  const pass = result.overallStatus === "pass";
  const categoriesClearing = result.categories.filter(
    (c) => c.varietiesFound >= REQUIRED_VARIETIES && c.unitsFound >= REQUIRED_UNITS,
  ).length;

  return (
    <section className="flex flex-col gap-px bg-hairline" aria-label="scorecard">
      {/* Verdict */}
      <header className="bg-paper">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {result.storeName || "—"}
            </h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {copy.scannedOn} {result.scanDate}
              {isSample ? ` · ${copy.sampleBadge}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-stretch gap-4">
          {/* Left bracket */}
          <span aria-hidden className="w-3 border-y-2 border-l-2 border-blue" />
          <div className="flex flex-1 flex-col justify-center py-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {categoriesClearing}/4 {copy.categoriesPassing}
            </span>
            <span className={`text-4xl font-semibold tracking-tight ${pass ? "text-blue" : "text-ink"}`}>
              {pass ? copy.verdictPass : copy.verdictFail}
            </span>
          </div>
          <span aria-hidden className="w-3 border-y-2 border-r-2 border-blue" />
        </div>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3">
        <Stat label={copy.totalUnits} value={result.totalUnits} />
        <Stat label={copy.perishableMet} value={`${result.perishableCategoriesMet}/4`} />
        <Stat label={copy.categoriesPassing} value={`${categoriesClearing}/4`} className="col-span-2 sm:col-span-1" />
      </div>

      {/* Categories */}
      <div className="grid gap-px bg-hairline sm:grid-cols-2">
        {result.categories.map((c) => (
          <CategoryCard key={c.category} category={c} copy={copy} />
        ))}
      </div>

      {/* Fixes */}
      <FixList result={result} copy={copy} />
    </section>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`bg-paper px-5 py-4 ${className}`}>
      <p className="font-mono text-[11px] uppercase leading-tight tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="tnum mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function CategoryCard({
  category,
  copy,
}: {
  category: ScanResult["categories"][number];
  copy: UiCopy;
}) {
  const varietyOk = category.varietiesFound >= REQUIRED_VARIETIES;
  const unitsOk = category.unitsFound >= REQUIRED_UNITS;
  const pass = varietyOk && unitsOk;

  return (
    <article className="flex flex-col gap-4 bg-paper p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-ink">{category.label}</h3>
        <span
          className={`font-mono text-[11px] uppercase tracking-widest ${
            pass ? "text-blue" : "text-ink"
          }`}
        >
          {pass ? "PASS" : "SHORT"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <Meter
          label={copy.varieties}
          value={category.varietiesFound}
          target={REQUIRED_VARIETIES}
          ok={varietyOk}
        />
        <Meter
          label={copy.units}
          value={category.unitsFound}
          target={REQUIRED_UNITS}
          ok={unitsOk}
        />
      </div>

      <p className="font-mono text-[11px] uppercase tracking-widest">
        <span className={category.hasPerishable ? "text-blue" : "text-muted-foreground line-through"}>
          {category.hasPerishable ? copy.perishableYes : copy.perishableNo}
        </span>
      </p>

      <ul className="flex flex-col gap-1 border-t border-hairline pt-3">
        {category.items.map((item) => (
          <li key={item.name} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink">{item.name}</span>
            <span className="tnum shrink-0 font-mono text-xs text-muted-foreground">×{item.units}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Meter({
  label,
  value,
  target,
  ok,
}: {
  label: string;
  value: number;
  target: number;
  ok: boolean;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="tnum font-mono text-xs text-ink">
          {value}/{target}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted">
        <div
          className={`h-full ${ok ? "bg-blue" : "bg-ink"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FixList({ result, copy }: { result: ScanResult; copy: UiCopy }) {
  return (
    <div className="bg-paper p-5">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-ink">{copy.fixesTitle}</h3>
      {result.fixes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.fixesEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-px bg-hairline">
          {result.fixes.map((fix, i) => (
            <li key={`${fix.category}-${i}`} className="flex gap-4 bg-paper py-4">
              <span className="tnum shrink-0 font-mono text-sm text-blue">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <p className="font-medium text-ink">{fix.itemSuggestion}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink">
                    {copy.whyItHelps}:{" "}
                  </span>
                  {fix.whyItHelps}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
