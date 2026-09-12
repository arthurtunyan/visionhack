"use client";

/**
 * Shared chrome: sidebar, page frame, and the small pieces every screen uses.
 *
 * Colour discipline lives here as much as in the stylesheet. The wordmark is
 * black and lowercase with blue brackets, rows are black on white, and status
 * colour appears on a Pill and nowhere else.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { STATUS_LABEL, type Status } from "@/lib/store";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/licenses", label: "Licences" },
  { href: "/scan", label: "Scan an invoice" },
  { href: "/setup", label: "Store setup" },
];

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="bracket">[</span>ledger<span className="bracket">]</span>
    </span>
  );
}

/**
 * Keeps ?demo=1 on internal links so a visitor who arrived from the marketing
 * site stays in the sample store even if storage is blocked.
 *
 * Read from window rather than useSearchParams, which would force every page
 * that renders the sidebar into a Suspense boundary at build time.
 */
function useDemoSuffix(): string {
  const [suffix, setSuffix] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSuffix(params.get("demo") === "1" ? "?demo=1" : "");
  }, []);
  return suffix;
}

function Sidebar() {
  const pathname = usePathname();
  const demo = useDemoSuffix();
  return (
    <nav className="sidebar">
      <Link href={`/${demo}`} aria-label="ledger home">
        <Wordmark />
        <span className="tagline">Compliance for small stores</span>
      </Link>
      <div className="nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={`${item.href}${demo}`}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="sidebar-foot">
        Dates and documents stay in this browser. Nothing is uploaded except an
        invoice you choose to scan.
      </div>
    </nav>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      {children ? <p>{children}</p> : null}
    </header>
  );
}

export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card">
      {title ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2>{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pill({ status, children }: { status: Status; children?: ReactNode }) {
  return <span className={`pill pill-${status}`}>{children ?? STATUS_LABEL[status]}</span>;
}

/**
 * Readiness ring. The arc is black: the number is the message, and colour is
 * reserved for the per-obligation pills so the page has one accent at a time.
 */
export function Donut({
  ratio,
  size = 132,
  caption,
}: {
  ratio: number;
  size?: number;
  caption?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg
        className="donut-figure"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={caption ?? `${Math.round(clamped * 100)} percent ready`}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#ededed" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--ink)" strokeWidth={stroke} strokeLinecap="butt"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="donut-centre">
        <span className="donut-value num">{Math.round(clamped * 100)}%</span>
        <span className="donut-unit">ready</span>
      </div>
    </div>
  );
}

export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="meter" role="img" aria-label={`${value} of ${max}`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
