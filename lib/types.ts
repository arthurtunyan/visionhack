/**
 * Public response contract for POST /api/scan.
 *
 * Role A (frontend) and Role C (rule engine) should import from this file
 * rather than re-deriving shapes. Nothing here depends on the Anthropic SDK.
 */
import type { Category } from "./rules/constants";

export type { Category };

/** An item confident enough to be counted toward the scorecard. */
export interface ScanItem {
  /** Item description exactly as printed on the invoice. */
  description: string;
  category: Category;
  /** Specific variety, e.g. "whole milk", "roma tomato". */
  variety: string;
  /** Number of packs/cases on the line. */
  quantity: number;
  /** Sellable units inside each pack. */
  packCount: number;
  /** quantity × packCount. */
  stockingUnits: number;
  perishable: boolean;
  /** 0..1 — already filtered to >= MIN_COUNTED_CONFIDENCE. */
  confidence: number;
}

/** A line we saw but deliberately did NOT count. Never feed these to scoring. */
export interface ExcludedItem {
  description: string;
  /** Human-readable reason, safe to show in the UI. */
  reason: string;
  confidence: number;
  /** Best guess, or null when we couldn't even categorize it. */
  category: Category | null;
}

export interface ScanMeta {
  model: string;
  /** Raw printed lines pass 1 transcribed. */
  rawLineCount: number;
  countedCount: number;
  excludedCount: number;
  confidenceThreshold: number;
  timingMs: { extract: number; classify: number; total: number };
}

export interface ScanSuccess {
  ok: true;
  items: ScanItem[];
  excluded: ExcludedItem[];
  meta: ScanMeta;
}

export type ScanErrorCode =
  | "no_image"
  | "unsupported_media_type"
  | "payload_too_large"
  | "bad_request"
  | "model_refused"
  | "unparseable_model_output"
  | "rate_limited"
  | "upstream_error"
  | "upstream_unreachable"
  | "server_misconfigured"
  | "internal_error";

export interface ScanError {
  ok: false;
  error: { code: ScanErrorCode; message: string };
}

export type ScanResponse = ScanSuccess | ScanError;
