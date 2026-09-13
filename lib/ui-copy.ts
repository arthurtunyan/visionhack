/**
 * UI chrome strings for the dashboard, in the same two locales the API returns
 * its scorecard in. Scorecard content itself (labels, fixes) comes from the
 * API's `scorecard` / `scorecardEs`; this file only covers the surrounding UI.
 */
import type { Locale } from "./scorecard-copy";

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
    tagline: "Photograph an invoice. Know in seconds if a store is actually stocked.",
    uploadTitle: "Scan an invoice",
    uploadHint: "JPG, PNG, or WebP up to 8 MB. A clear photo of the printed invoice works best.",
    dropHere: "Drop the invoice photo here",
    chooseFile: "Choose photo",
    storeNameLabel: "Store name",
    storeNamePlaceholder: "e.g. Rivera's Corner Market",
    scan: "Run scan",
    scanning: "Reading invoice",
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
    tagline: "Fotografíe una factura. Sepa en segundos si una tienda está bien surtida.",
    uploadTitle: "Escanear una factura",
    uploadHint: "JPG, PNG o WebP hasta 8 MB. Una foto clara de la factura impresa funciona mejor.",
    dropHere: "Suelte aquí la foto de la factura",
    chooseFile: "Elegir foto",
    storeNameLabel: "Nombre de la tienda",
    storeNamePlaceholder: "ej. Rivera's Corner Market",
    scan: "Escanear",
    scanning: "Leyendo la factura",
    rescan: "Escanear otra",
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

/** Category-level pass targets, mirrored from the rule engine for display. */
export const REQUIRED_VARIETIES = 7;
export const REQUIRED_UNITS = 21;
