/**
 * Public response contract for POST /api/scan.
 *
 * Role A (frontend) and Role C (rule engine) should import from this file
 * rather than re-deriving shapes. Nothing here depends on the Anthropic SDK.
 *
 * THE C BOUNDARY: classified items and qualifying-variety counts come from
 * this route's pipeline. The pass/fail verdict comes from Role C's rule engine
 * (lib/rule-engine.ts), which the route runs over `items` and returns as
 * `scorecard`. Its ScanResult shape is defined in lib/mock-data.ts.
 */
import type { ScanResult } from "./mock-data";
import type { Category, StorageState } from "./rules/constants";

export type { Category, ScanResult, StorageState };

/** An item that survived filtering. Accessory foods appear here with 0 units. */
export interface ScanItem {
  /** Item description exactly as printed on the invoice. */
  description: string;
  category: Category;
  /** Specific variety, e.g. "whole milk", "roma tomato". */
  variety: string;
  /** Packs/cases on the line. Null when unknown (only possible for accessories). */
  quantity: number | null;
  /** Sellable units per pack. Null when unknown (only possible for accessories). */
  packCount: number | null;
  /** quantity × packCount, forced to 0 for accessory foods. */
  stockingUnits: number;
  /** Butter and all jerky. Counts for nothing, but stays visible. */
  accessory: boolean;
  storage: StorageState;
  /** Refrigerated or fresh. */
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

/**
 * Number of varieties per category that cleared the minimum-stocking-units
 * rule. Already floored.
 */
export type VarietyCountsByCategory = Record<Category, number>;

export interface ScanMeta {
  model: string;
  /** Raw printed lines pass 1 transcribed. */
  rawLineCount: number;
  countedCount: number;
  excludedCount: number;
  confidenceThreshold: number;
  minStockingUnitsPerVariety: number;
  timingMs: { extract: number; classify: number; total: number };
}

export interface ScanSuccess {
  ok: true;
  items: ScanItem[];        // counted (accessories included, at 0 units)
  excluded: ExcludedItem[]; // NOT counted — display only
  varietyCounts: VarietyCountsByCategory;
  /** Role C's pass/fail scorecard and fix list, built from `items`. */
  scorecard: ScanResult;
  meta: ScanMeta;
}

/**
 * Clearly-named alias for what this route returns, to keep it distinct from
 * Role C's ScanResult scorecard.
 */
export type ClassifiedScanResult = ScanSuccess;

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
