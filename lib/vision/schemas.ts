/**
 * Zod schemas for the two vision passes. These are handed to
 * `zodOutputFormat()` so the model is constrained to return valid JSON.
 *
 * Kept deliberately simple (objects / strings / numbers / booleans / enums /
 * nullable) — exotic Zod features do not survive translation to a JSON schema.
 * Fields are required-and-nullable rather than optional so a missing value is
 * an explicit `null` we can branch on instead of `undefined`.
 */
import * as z from "zod/v4";
import { CATEGORIES, STORAGE_STATES } from "../rules/constants";

/** Pass 1 — pure transcription. No interpretation, no categorization. */
export const RawLineSchema = z.object({
  /** The item description exactly as printed. Do not normalize or expand. */
  lineText: z.string(),
  /** Pack size exactly as printed, e.g. "24 x 12oz". Null if not printed. */
  packSize: z.string().nullable(),
  /** Quantity column exactly as printed. Null if not printed. */
  quantity: z.string().nullable(),
  /** False when the line is blurred, cut off, or otherwise not fully readable. */
  legible: z.boolean(),
});

export const RawExtractionSchema = z.object({
  lines: z.array(RawLineSchema),
});

export type RawExtraction = z.infer<typeof RawExtractionSchema>;

/** Pass 2 — classification and interpretation of the pass-1 lines. */
export const ClassifiedItemSchema = z.object({
  /** Must match the pass-1 lineText verbatim so we can trace it back. */
  sourceLineText: z.string(),
  category: z.enum(CATEGORIES),
  /** Specific variety, e.g. "whole milk", "brown rice". */
  variety: z.string(),
  /** Sellable units inside one pack/case. Null if not determinable. */
  packCount: z.number().nullable(),
  /** Number of packs/cases on this line. Null if not determinable. */
  quantity: z.number().nullable(),
  /** How the item is stored. Drives the perishable flag. */
  storage: z.enum(STORAGE_STATES),
  /** True for butter and any jerky — accessory foods that count for nothing. */
  accessory: z.boolean(),
  /** 0..1 confidence in this whole classification. */
  confidence: z.number(),
  /**
   * Non-null means "do not count this line". Set it whenever the item is
   * ambiguous rather than guessing.
   */
  excludeReason: z.string().nullable(),
});

export const ClassificationSchema = z.object({
  items: z.array(ClassifiedItemSchema),
});

export type Classification = z.infer<typeof ClassificationSchema>;
export type ClassifiedItem = z.infer<typeof ClassifiedItemSchema>;
