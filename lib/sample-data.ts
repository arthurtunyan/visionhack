/**
 * A bilingual sample scorecard so the dashboard is demonstrable without a live
 * scan. The English side reuses the agreed MOCK_RESULT fixture; the Spanish
 * side mirrors it with translated labels and fixes (item names and varieties
 * are intentionally left untranslated, matching the API contract).
 */
import { MOCK_RESULT, type ScanResult } from "./mock-data";
import type { Locale } from "./scorecard-copy";

const SAMPLE_ES: ScanResult = {
  ...MOCK_RESULT,
  categories: MOCK_RESULT.categories.map((c) => ({
    ...c,
    label: {
      dairy: "Lácteos",
      grains: "Granos",
      protein: "Proteínas",
      produce: "Frutas y verduras",
    }[c.category],
  })),
  fixes: [
    {
      category: "dairy",
      itemSuggestion: "Leche evaporada Carnation, lata de 12 oz (surta 3)",
      whyItHelps:
        "Se conserva sin refrigeración y cuesta menos de $2 la lata — agrega una 5.ª variedad de lácteos sin ocupar espacio en el refrigerador.",
    },
    {
      category: "dairy",
      itemSuggestion: "Queso americano Kraft Singles, 12 rebanadas (surta 3)",
      whyItHelps: "Una variedad de queso distinta al cheddar, así cuenta como 6.ª variedad de lácteos.",
    },
    {
      category: "dairy",
      itemSuggestion: "Queso cottage Daisy, 16 oz (surta 3)",
      whyItHelps: "Lleva los lácteos a 7 variedades y 23 unidades, cumpliendo ambos mínimos.",
    },
  ],
};

export function sampleScorecard(locale: Locale): ScanResult {
  return locale === "es" ? SAMPLE_ES : MOCK_RESULT;
}
