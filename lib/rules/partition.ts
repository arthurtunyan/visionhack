/**
 * Splits classified items into the COUNTED set and the EXCLUDED set.
 *
 * This is the enforcement point for the product rule: undercounting is safer
 * than overcounting. The pass-2 prompt asks the model to self-exclude, but a
 * prompt is not a guarantee — every rule below is re-checked here in code, so
 * a confidently-wrong model response still cannot inflate the count.
 *
 * Role C consumes `items`. `excluded` exists only so Role A can show
 * "couldn't read these" — it must never be scored.
 */
import {
  MIN_COUNTED_CONFIDENCE,
  computePerishable,
  computeStockingUnits,
} from "./constants";
import type { ExcludedItem, ScanItem } from "../types";
import type { ClassifiedItem } from "../vision/schemas";

export interface Partitioned {
  items: ScanItem[];
  excluded: ExcludedItem[];
}

export function partitionClassifiedItems(classified: ClassifiedItem[]): Partitioned {
  const items: ScanItem[] = [];
  const excluded: ExcludedItem[] = [];

  for (const item of classified) {
    // Clamp: the schema constrains the type, not the range.
    const confidence = Math.min(1, Math.max(0, item.confidence));
    const stockingUnits = computeStockingUnits(item.quantity, item.packCount);

    // Any one of these is enough to drop the item from the counted set.
    const reason =
      (item.excludeReason && item.excludeReason.trim().length > 0
        ? item.excludeReason
        : null) ??
      (confidence < MIN_COUNTED_CONFIDENCE
        ? `Low confidence (${confidence.toFixed(2)}).`
        : null) ??
      (stockingUnits === null ? "Could not determine pack size or quantity." : null);

    if (reason !== null) {
      excluded.push({
        description: item.sourceLineText,
        reason,
        confidence,
        category: item.category,
      });
      continue;
    }

    // Unreachable unless stockingUnits is a number, but keep the compiler
    // honest rather than asserting non-null.
    if (stockingUnits === null || item.quantity === null || item.packCount === null) {
      excluded.push({
        description: item.sourceLineText,
        reason: "Could not determine pack size or quantity.",
        confidence,
        category: item.category,
      });
      continue;
    }

    items.push({
      description: item.sourceLineText,
      category: item.category,
      variety: item.variety,
      quantity: item.quantity,
      packCount: item.packCount,
      stockingUnits,
      perishable: computePerishable(item.category, item.shelfStable),
      confidence,
    });
  }

  return { items, excluded };
}
