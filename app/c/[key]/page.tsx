/**
 * Route wrapper for one obligation. The eight keys are known at build time, so
 * they prerender; anything else is a 404 rather than an empty screen.
 */
import { notFound } from "next/navigation";
import { OBLIGATIONS, getObligation, type ObligationKey } from "@/lib/compliance";
import Detail from "./Detail";

export function generateStaticParams() {
  return OBLIGATIONS.map((o) => ({ key: o.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const obligation = getObligation(key);
  return { title: obligation ? `${obligation.name} — ledger` : "ledger" };
}

export default async function ObligationPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!getObligation(key)) notFound();
  return <Detail obligationKey={key as ObligationKey} />;
}
