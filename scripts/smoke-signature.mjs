/** Excludes model confidence and timing while retaining every scoring decision. */
export function decisionSignature(body) {
  if (!body?.ok) return null;
  return JSON.stringify({
    items: body.items?.map((item) => ({
      description: item.description,
      category: item.category,
      variety: typeof item.variety === "string" ? item.variety.trim().toLowerCase() : "",
      quantity: item.quantity,
      packCount: item.packCount,
      stockingUnits: item.stockingUnits,
      accessory: item.accessory,
      storage: item.storage,
      perishable: item.perishable,
    })),
    excluded: body.excluded?.map((item) => ({
      description: item.description,
      category: item.category,
    })),
    varietyCounts: body.varietyCounts,
    scorecard: {
      overallStatus: body.scorecard?.overallStatus,
      totalUnits: body.scorecard?.totalUnits,
      perishableCategoriesMet: body.scorecard?.perishableCategoriesMet,
      categories: body.scorecard?.categories?.map((category) => ({
        category: category.category,
        varietiesFound: category.varietiesFound,
        unitsFound: category.unitsFound,
        hasPerishable: category.hasPerishable,
      })),
    },
  });
}
