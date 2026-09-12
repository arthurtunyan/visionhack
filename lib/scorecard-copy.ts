/**
 * Every string the rule engine writes into a scorecard, in English and Spanish:
 * category labels, the fix-list suggestions, and the templates `whyItHelps` is
 * built from.
 *
 * Kept apart from lib/rule-engine.ts so the Spanish can be reviewed and edited
 * without touching scoring logic. Numbers are passed in, never hard-coded, so
 * the copy can't drift from the rule.
 *
 * Not translated: item names and varieties. They come from the invoice and the
 * classifier, so they read the same in both scorecards.
 */
import type { Category } from "./rules/constants";

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export interface ScorecardCopy {
  categoryLabels: Record<Category, string>;
  /** "brings dairy to 5 of 7 varieties" */
  varietyGain(category: Category, reached: number, required: number): string;
  /** "gives dairy a perishable item, needed in 3 of 4 categories" */
  perishableGain(category: Category, required: number, categoryCount: number): string;
  /** Appended to the first fix when the category is also missing a perishable. */
  addsMissingPerishable(category: Category): string;
  /** "Select Cucumber bushel (stock 1 more)" */
  topUpSuggestion(name: string, more: number): string;
  topUpReason(units: number, variety: string, more: number, minUnits: number, gain: string): string;
  newItemReason(pitch: string, minUnits: number, gain: string): string;
}

/** Spanish category names as they read mid-sentence, article included. */
const ES_CATEGORY_IN_SENTENCE: Record<Category, string> = {
  dairy: "los lácteos",
  grains: "los granos",
  protein: "las proteínas",
  produce: "las frutas y verduras",
};

export const SCORECARD_COPY: Record<Locale, ScorecardCopy> = {
  en: {
    categoryLabels: {
      dairy: "Dairy",
      grains: "Grains",
      protein: "Protein",
      produce: "Fruits and Vegetables",
    },
    varietyGain: (category, reached, required) =>
      `brings ${category} to ${reached} of ${required} varieties`,
    perishableGain: (category, required, categoryCount) =>
      `gives ${category} a perishable item, needed in ${required} of ${categoryCount} categories`,
    addsMissingPerishable: (category) => ` and adds the perishable item ${category} is missing`,
    topUpSuggestion: (name, more) => `${name} (stock ${more} more)`,
    topUpReason: (units, variety, more, minUnits, gain) =>
      `You already stock ${units} ${units === 1 ? "unit" : "units"} of ${variety}; ${more} more meets the ${minUnits}-unit minimum and ${gain}.`,
    newItemReason: (pitch, minUnits, gain) => `${pitch} Stocking ${minUnits} ${gain}.`,
  },
  es: {
    categoryLabels: {
      dairy: "Lácteos",
      grains: "Granos",
      protein: "Proteínas",
      produce: "Frutas y verduras",
    },
    varietyGain: (category, reached, required) =>
      `lleva ${ES_CATEGORY_IN_SENTENCE[category]} a ${reached} de ${required} variedades`,
    perishableGain: (category, required, categoryCount) =>
      `le da a ${ES_CATEGORY_IN_SENTENCE[category]} un producto perecedero, necesario en ${required} de ${categoryCount} categorías`,
    addsMissingPerishable: (category) =>
      ` y agrega el producto perecedero que les falta a ${ES_CATEGORY_IN_SENTENCE[category]}`,
    topUpSuggestion: (name, more) => `${name} (surta ${more} más)`,
    topUpReason: (units, variety, more, minUnits, gain) =>
      `Ya tiene ${units} ${units === 1 ? "unidad" : "unidades"} de ${variety}; con ${more} más cumple el mínimo de ${minUnits} unidades y ${gain}.`,
    newItemReason: (pitch, minUnits, gain) => `${pitch} Surtir ${minUnits} ${gain}.`,
  },
};

type SuggestionText = { itemSuggestion: string; pitch: string };

export type Suggestion = {
  /** Compared loosely with what the store carries, so nothing is suggested twice. */
  variety: string;
  perishable: boolean;
} & Record<Locale, SuggestionText>;

/**
 * Common, low-cost staples a corner store can add. Shelf-stable options come
 * first so perishables are only suggested when the category needs one.
 */
export const SUGGESTIONS: Record<Category, Suggestion[]> = {
  dairy: [
    {
      variety: "evaporated milk", perishable: false,
      en: { itemSuggestion: "Carnation Evaporated Milk, 12 oz can (stock 3)", pitch: "Shelf-stable, no fridge space needed." },
      es: { itemSuggestion: "Leche evaporada Carnation, lata de 12 oz (surta 3)", pitch: "Se conserva sin refrigeración y no ocupa espacio en el refrigerador." },
    },
    {
      variety: "powdered milk", perishable: false,
      en: { itemSuggestion: "Nido Fortificada Dry Milk, 12.6 oz (stock 3)", pitch: "Shelf-stable and a steady seller with families." },
      es: { itemSuggestion: "Leche en polvo Nido Fortificada, 12.6 oz (surta 3)", pitch: "Se conserva sin refrigeración y las familias la compran seguido." },
    },
    {
      variety: "cottage cheese", perishable: true,
      en: { itemSuggestion: "Daisy Cottage Cheese, 16 oz (stock 3)", pitch: "A low-cost refrigerated staple." },
      es: { itemSuggestion: "Queso cottage Daisy, 16 oz (surta 3)", pitch: "Un básico refrigerado de bajo costo." },
    },
    {
      variety: "american cheese", perishable: true,
      en: { itemSuggestion: "Kraft Singles American Cheese, 12 ct (stock 3)", pitch: "Sliced cheese sells alongside bread and lunch meat." },
      es: { itemSuggestion: "Queso americano Kraft Singles, 12 rebanadas (surta 3)", pitch: "El queso en rebanadas se vende junto con el pan y las carnes frías." },
    },
    {
      variety: "mozzarella cheese", perishable: true,
      en: { itemSuggestion: "Galbani Mozzarella String Cheese, 12 ct (stock 3)", pitch: "A grab-and-go refrigerated snack." },
      es: { itemSuggestion: "Queso mozzarella en tiras Galbani, 12 piezas (surta 3)", pitch: "Una botana refrigerada para llevar." },
    },
  ],
  grains: [
    {
      variety: "corn tortillas", perishable: false,
      en: { itemSuggestion: "Mission Corn Tortillas, 30 ct (stock 3)", pitch: "A daily staple that sells fast." },
      es: { itemSuggestion: "Tortillas de maíz Mission, 30 piezas (surta 3)", pitch: "Un básico de todos los días que se vende rápido." },
    },
    {
      variety: "corn masa flour", perishable: false,
      en: { itemSuggestion: "Maseca Instant Corn Masa Flour, 4.4 lb (stock 3)", pitch: "Shelf-stable and a staple for home cooks." },
      es: { itemSuggestion: "Harina de maíz instantánea Maseca, 4.4 lb (surta 3)", pitch: "Se conserva sin refrigeración y es básica para cocinar en casa." },
    },
    {
      variety: "saltine crackers", perishable: false,
      en: { itemSuggestion: "Premium Original Saltine Crackers, 16 oz (stock 3)", pitch: "Shelf-stable and cheap." },
      es: { itemSuggestion: "Galletas saladas Premium Original, 16 oz (surta 3)", pitch: "Se conservan sin refrigeración y son baratas." },
    },
    {
      variety: "white bread", perishable: true,
      en: { itemSuggestion: "Bimbo Soft White Bread, 20 oz (stock 3)", pitch: "Fresh bread is perishable and sells every day." },
      es: { itemSuggestion: "Pan blanco Bimbo, 20 oz (surta 3)", pitch: "El pan fresco es perecedero y se vende todos los días." },
    },
    {
      variety: "bolillo rolls", perishable: true,
      en: { itemSuggestion: "Fresh Bolillo Rolls, 6 ct (stock 3)", pitch: "Fresh bakery rolls are perishable and sell daily." },
      es: { itemSuggestion: "Bolillos frescos, 6 piezas (surta 3)", pitch: "El pan fresco de panadería es perecedero y se vende a diario." },
    },
  ],
  protein: [
    {
      variety: "canned salmon", perishable: false,
      en: { itemSuggestion: "Bumble Bee Pink Salmon, 14.75 oz can (stock 3)", pitch: "Shelf-stable, no fridge space needed." },
      es: { itemSuggestion: "Salmón rosado Bumble Bee, lata de 14.75 oz (surta 3)", pitch: "Se conserva sin refrigeración y no ocupa espacio en el refrigerador." },
    },
    {
      variety: "vienna sausage", perishable: false,
      en: { itemSuggestion: "Libby's Vienna Sausage, 4.6 oz can (stock 3)", pitch: "Cheap, shelf-stable and a quick seller." },
      es: { itemSuggestion: "Salchichas Vienna Libby's, lata de 4.6 oz (surta 3)", pitch: "Baratas, se conservan sin refrigeración y se venden rápido." },
    },
    {
      variety: "chicken", perishable: true,
      en: { itemSuggestion: "Fresh Chicken Drumsticks, family pack (stock 3)", pitch: "A low-cost fresh meat families buy often." },
      es: { itemSuggestion: "Piernas de pollo frescas, paquete familiar (surta 3)", pitch: "Carne fresca de bajo costo que las familias compran seguido." },
    },
    {
      variety: "chorizo", perishable: true,
      en: { itemSuggestion: "Cacique Pork Chorizo, 9 oz (stock 3)", pitch: "A refrigerated staple for breakfast and tacos." },
      es: { itemSuggestion: "Chorizo de puerco Cacique, 9 oz (surta 3)", pitch: "Un básico refrigerado para el desayuno y los tacos." },
    },
    {
      variety: "ground turkey", perishable: true,
      en: { itemSuggestion: "Jennie-O Ground Turkey, 1 lb (stock 3)", pitch: "Refrigerated and priced close to ground beef." },
      es: { itemSuggestion: "Pavo molido Jennie-O, 1 lb (surta 3)", pitch: "Refrigerado y con un precio parecido al de la carne molida de res." },
    },
  ],
  produce: [
    {
      variety: "green beans", perishable: false,
      en: { itemSuggestion: "Del Monte Cut Green Beans, 14.5 oz can (stock 3)", pitch: "Canned vegetables count and keep for months." },
      es: { itemSuggestion: "Ejotes cortados Del Monte, lata de 14.5 oz (surta 3)", pitch: "Las verduras enlatadas cuentan y duran meses." },
    },
    {
      variety: "pineapple", perishable: false,
      en: { itemSuggestion: "Dole Pineapple Chunks, 20 oz can (stock 3)", pitch: "Canned fruit counts and keeps for months." },
      es: { itemSuggestion: "Piña en trozos Dole, lata de 20 oz (surta 3)", pitch: "La fruta enlatada cuenta y dura meses." },
    },
    {
      variety: "bananas", perishable: true,
      en: { itemSuggestion: "Bananas, per lb (stock 3)", pitch: "The cheapest fresh fruit and a daily seller." },
      es: { itemSuggestion: "Plátanos, por libra (surta 3)", pitch: "La fruta fresca más barata y se vende todos los días." },
    },
    {
      variety: "limes", perishable: true,
      en: { itemSuggestion: "Fresh Limes, per lb (stock 3)", pitch: "Cheap, fresh and they sell with almost everything." },
      es: { itemSuggestion: "Limones frescos, por libra (surta 3)", pitch: "Baratos, frescos y se venden con casi todo." },
    },
    {
      variety: "carrots", perishable: true,
      en: { itemSuggestion: "Carrots, 2 lb bag (stock 3)", pitch: "Fresh, cheap and they keep for weeks in the cooler." },
      es: { itemSuggestion: "Zanahorias, bolsa de 2 lb (surta 3)", pitch: "Frescas, baratas y duran semanas en el refrigerador." },
    },
  ],
};
