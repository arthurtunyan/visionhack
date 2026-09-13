/**
 * UI chrome strings for the dashboard, in the same two locales the API returns
 * its scorecard in. Scorecard content itself (labels, fixes) comes from the
 * API's `scorecard` / `scorecardEs`; this file only covers the surrounding UI.
 */
import type { Locale } from "./scorecard-copy";
import {
  REQUIRED_UNITS_PER_CATEGORY,
  REQUIRED_VARIETIES_PER_CATEGORY,
} from "./rule-engine";

export type { Locale };

export interface UiCopy {
  tagline: string;
  uploadTitle: string;
  uploadHint: string;
  dropHere: string;
  chooseFile: string;
  storeNameLabel: string;
  storeNamePlaceholder: string;
  scan: string;
  scanning: string;
  rescan: string;
  tryError: string;
  loadSample: string;
  clear: string;
  verdictPass: string;
  verdictFail: string;
  totalUnits: string;
  perishableMet: string;
  varieties: string;
  units: string;
  perishableYes: string;
  perishableNo: string;
  fixesTitle: string;
  fixesEmpty: string;
  whyItHelps: string;
  scannedOn: string;
  categoriesPassing: string;
  requiredNote: string;
  sampleBadge: string;
  perishableShort: string;
}

export const UI_COPY: Record<Locale, UiCopy> = {
  en: {
    tagline: "Photograph a wholesale order record. Know in seconds if a store is actually stocked.",
    uploadTitle: "Scan a wholesale order record",
    uploadHint: "JPG, PNG, or WebP up to 8 MB. A clear photo of the printed order record works best.",
    dropHere: "Drop the order record photo here",
    chooseFile: "Choose photo",
    storeNameLabel: "Store name",
    storeNamePlaceholder: "e.g. Rivera's Corner Market",
    scan: "Run scan",
    scanning: "Reading order record",
    rescan: "Scan another",
    tryError: "Something went wrong",
    loadSample: "View a sample scorecard",
    clear: "Clear",
    verdictPass: "Well stocked",
    verdictFail: "Understocked",
    totalUnits: "Total stocking units",
    perishableMet: "Categories with a perishable",
    varieties: "varieties",
    units: "units",
    perishableYes: "Perishable stocked",
    perishableNo: "No perishable",
    fixesTitle: "How to pass",
    fixesEmpty: "Nothing to fix. Every category clears its minimums.",
    whyItHelps: "Why it helps",
    scannedOn: "Scanned",
    categoriesPassing: "categories clear",
    requiredNote: "Target: 7 varieties and 21 units per category.",
    sampleBadge: "Sample",
    perishableShort: "perishable",
  },
  es: {
    tagline: "Fotografíe un registro de pedido mayorista. Sepa en segundos si una tienda está bien surtida.",
    uploadTitle: "Escanear un registro de pedido mayorista",
    uploadHint: "JPG, PNG o WebP hasta 8 MB. Una foto clara del registro de pedido impreso funciona mejor.",
    dropHere: "Suelte aquí la foto del registro de pedido",
    chooseFile: "Elegir foto",
    storeNameLabel: "Nombre de la tienda",
    storeNamePlaceholder: "ej. Rivera's Corner Market",
    scan: "Escanear",
    scanning: "Leyendo el registro de pedido",
    rescan: "Escanear otro",
    tryError: "Algo salió mal",
    loadSample: "Ver un ejemplo",
    clear: "Borrar",
    verdictPass: "Bien surtida",
    verdictFail: "Poco surtida",
    totalUnits: "Unidades de surtido totales",
    perishableMet: "Categorías con un perecedero",
    varieties: "variedades",
    units: "unidades",
    perishableYes: "Perecedero surtido",
    perishableNo: "Sin perecedero",
    fixesTitle: "Cómo aprobar",
    fixesEmpty: "No hay nada que corregir. Cada categoría cumple sus mínimos.",
    whyItHelps: "Por qué ayuda",
    scannedOn: "Escaneado",
    categoriesPassing: "categorías cumplen",
    requiredNote: "Meta: 7 variedades y 21 unidades por categoría.",
    sampleBadge: "Ejemplo",
    perishableShort: "perecedero",
  },
};

/**
 * Category-level pass targets, re-exported from the rule engine rather than
 * retyped. Mirroring these by hand is how the marketing page ended up
 * advertising a 3-variety rule while the scanner scored against 7.
 */
export const REQUIRED_VARIETIES = REQUIRED_VARIETIES_PER_CATEGORY;
export const REQUIRED_UNITS = REQUIRED_UNITS_PER_CATEGORY;
