/* Ledger — static site behaviour.
   Scroll reveals, count-ups, and the scan demo.

   This is the GitHub Pages fallback. There is no backend here, by design: the
   demo calls the live API when it is up and replays a saved scan when it is
   not, so the page still works with no network, no key and no server.

   Numbers, category labels, claim wording and the Spanish copy mirror
   lib/rule-engine.ts, lib/rules/constants.ts and lib/scorecard-copy.ts on
   main. Change them there first. */

// ---------------------------------------------------------------- thresholds
// lib/rule-engine.ts. USDA Criterion A stocking standards, 4 November 2026.
export const RULES = {
  varietiesPerCategory: 7,
  unitsPerVariety: 3,
  unitsPerCategory: 21,
  totalUnits: 84,
  perishableCategories: 3,
  categoryCount: 4,
  maxFixesPerCategory: 2,
};

export const CATEGORIES = ['dairy', 'grains', 'protein', 'produce'];

// Where the real API lives when it is up. Same shape as POST /api/scan.
const API = window.LEDGER_API || 'https://visionhack.vercel.app/api/scan';
const API_TIMEOUT_MS = 55000;   // matches the route's shared request deadline

// ------------------------------------------------------------------- copy
// lib/scorecard-copy.ts. Item names and varieties are not translated: they come
// off the invoice and read the same either way.
export const COPY = {
  en: {
    lang: 'en',
    categoryLabels: { dairy: 'Dairy', grains: 'Grains', protein: 'Protein',
                      produce: 'Fruits and Vegetables' },
    pass: 'Estimated to meet the SNAP stocking standard',
    fail: 'May not meet the stocking standard yet',
    disclosure: 'Readiness estimate only. Ledger checks items it can read in ' +
      'this image against the Criterion A stocking thresholds. It is not an ' +
      'official USDA eligibility determination.',
    catsAt: (n) => `Categories at ${n} varieties`,
    totalUnits: 'Total stocking units',
    perishables: 'Categories with a perishable',
    counted: 'Counted line items',
    notCounted: 'Read but not counted',
    notCountedLead: 'Ledger never guesses a number it cannot read. These lines ' +
      'are shown so you can confirm them, and they are left out of every total above.',
    fixes: 'What to stock next',
    fixesLead: 'Ranked by what closes the biggest gap first.',
    line: 'Line', variety: 'Variety', category: 'Category', units: 'Units',
    pack: 'Pack', why: 'Why it was not counted', item: 'Item', reason: 'Why it helps',
    scanAnother: 'Scan another invoice',
    reading: 'Reading the invoice…',
    readingSub: 'Two passes: transcribe, then classify. Usually 20–35 seconds.',
    varietyGain: (cat, reached, required) =>
      `brings ${cat} to ${reached} of ${required} varieties`,
    perishableGain: (cat, required, count) =>
      `gives ${cat} a perishable item, needed in ${required} of ${count} categories`,
    newItemReason: (pitch, minUnits, gain) => `${pitch} Stocking ${minUnits} ${gain}.`,
    savedScan: 'Showing a saved scan — the live API was unreachable.',
    refused: 'The scan could not be completed.',
  },
  es: {
    lang: 'es',
    categoryLabels: { dairy: 'Lácteos', grains: 'Granos', protein: 'Proteínas',
                      produce: 'Frutas y verduras' },
    pass: 'Se estima que cumple con el estándar de surtido de SNAP',
    fail: 'Puede que todavía no cumpla con el estándar de surtido',
    disclosure: 'Solo es una estimación de preparación. Ledger compara los ' +
      'productos que puede leer en esta imagen con los umbrales del Criterio A. ' +
      'No es una determinación oficial de elegibilidad del USDA.',
    catsAt: (n) => `Categorías con ${n} variedades`,
    totalUnits: 'Unidades de surtido en total',
    perishables: 'Categorías con un perecedero',
    counted: 'Renglones contados',
    notCounted: 'Leídos pero no contados',
    notCountedLead: 'Ledger nunca inventa un número que no puede leer. Estos ' +
      'renglones se muestran para que usted los confirme y quedan fuera de ' +
      'todos los totales de arriba.',
    fixes: 'Qué surtir enseguida',
    fixesLead: 'Ordenado por lo que cierra la brecha más grande primero.',
    line: 'Renglón', variety: 'Variedad', category: 'Categoría', units: 'Unidades',
    pack: 'Empaque', why: 'Por qué no se contó', item: 'Producto',
    reason: 'Por qué ayuda',
    scanAnother: 'Escanear otra factura',
    reading: 'Leyendo la factura…',
    readingSub: 'Dos pasadas: transcribir y luego clasificar. Normalmente de 20 a 35 segundos.',
    varietyGain: (cat, reached, required) =>
      `lleva ${cat} a ${reached} de ${required} variedades`,
    perishableGain: (cat, required, count) =>
      `le da a ${cat} un producto perecedero, necesario en ${required} de ${count} categorías`,
    newItemReason: (pitch, minUnits, gain) => `${pitch} Surtir ${minUnits} ${gain}.`,
    savedScan: 'Mostrando un escaneo guardado — la API en vivo no respondió.',
    refused: 'No se pudo completar el escaneo.',
  },
};

// A short slice of lib/scorecard-copy.ts SUGGESTIONS: shelf-stable options come
// first, so a perishable is only ever suggested when the category needs one.
const SUGGESTIONS = {
  dairy: [
    { variety: 'evaporated milk', perishable: false,
      en: ['Carnation Evaporated Milk, 12 oz can', 'Shelf-stable, no fridge space needed.'],
      es: ['Leche evaporada Carnation, lata de 12 oz', 'Se conserva sin refrigeración y no ocupa espacio en el refrigerador.'] },
    { variety: 'cottage cheese', perishable: true,
      en: ['Daisy Cottage Cheese, 16 oz', 'A low-cost refrigerated staple.'],
      es: ['Queso cottage Daisy, 16 oz', 'Un básico refrigerado de bajo costo.'] },
  ],
  grains: [
    { variety: 'corn tortillas', perishable: false,
      en: ['Mission Corn Tortillas, 30 ct', 'A daily staple that sells fast.'],
      es: ['Tortillas de maíz Mission, 30 piezas', 'Un básico de todos los días que se vende rápido.'] },
    { variety: 'white bread', perishable: true,
      en: ['Bimbo Soft White Bread, 20 oz', 'Fresh bread is perishable and sells every day.'],
      es: ['Pan blanco Bimbo, 20 oz', 'El pan fresco es perecedero y se vende todos los días.'] },
  ],
  protein: [
    { variety: 'canned salmon', perishable: false,
      en: ['Bumble Bee Pink Salmon, 14.75 oz can', 'Shelf-stable, no fridge space needed.'],
      es: ['Salmón rosado Bumble Bee, lata de 14.75 oz', 'Se conserva sin refrigeración y no ocupa espacio en el refrigerador.'] },
    { variety: 'chicken', perishable: true,
      en: ['Fresh Chicken Drumsticks, family pack', 'A low-cost fresh meat families buy often.'],
      es: ['Piernas de pollo frescas, paquete familiar', 'Carne fresca de bajo costo que las familias compran seguido.'] },
  ],
  produce: [
    { variety: 'green beans', perishable: false,
      en: ['Del Monte Cut Green Beans, 14.5 oz can', 'Canned vegetables count and keep for months.'],
      es: ['Ejotes cortados Del Monte, lata de 14.5 oz', 'Las verduras enlatadas cuentan y duran meses.'] },
    { variety: 'bananas', perishable: true,
      en: ['Bananas, per lb', 'The cheapest fresh fruit and a daily seller.'],
      es: ['Plátanos, por libra', 'La fruta fresca más barata y se vende todos los días.'] },
  ],
};

// --------------------------------------------------------------- scroll reveal
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = Number(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('in'), delay);
      io.unobserve(el);                 // once, never on scroll-up
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

// ------------------------------------------------------------------ count up
function countUp(el, to, ms = 600) {
  if (reduce) { el.textContent = String(to); return; }
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(to * eased));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window)) {
    els.forEach((e) => (e.textContent = e.dataset.count));
    return;
  }
  // The markup carries the final number so it reads correctly with no JS.
  // Only once the observer is wired do we rewind it to zero and animate.
  els.forEach((e) => (e.textContent = '0'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target, Number(entry.target.dataset.count));
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  els.forEach((e) => io.observe(e));
}

// ---------------------------------------------------------------------- nav
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 80);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ------------------------------------------------------------- category bars
export function catBar(label, have, need = RULES.varietiesPerCategory) {
  const pass = have >= need;
  const segs = Array.from({ length: Math.max(need, have) }, (_, i) => {
    const cls = i < have ? (pass ? 'on' : 'bad') : '';
    return `<div class="cat__seg ${cls}" style="transition-delay:${i * 60}ms"></div>`;
  }).join('');
  return `<div class="cat">
    <div class="cat__top"><span class="h" style="font-size:15px">${label}</span>
      <span class="pill ${pass ? 'pill--ok' : 'pill--bad'}"><span class="dot"></span>${have} of ${need}</span></div>
    <div class="cat__segs">${segs}</div></div>`;
}

// --------------------------------------------------------------- canned scan
/* The saved scan is fixtures/sample-invoice.png — the same image the "use the
   sample invoice" button uploads, so the replay and a live scan describe the
   same delivery. Valley Fresh VF-88213, 14 printed rows.

   Stocking units are quantity x pack count, and a pack count is only ever read
   from an explicit printed expression ("6/1 GAL", "24 x 5.3 OZ", "12 EA",
   "12 CT"). An unknown pack count is never defaulted to one. */
const SCANNED = [
  // description, category, variety, quantity, pack, units, perishable
  ['WHL MLK HOMOGENIZED',       'dairy',   'whole milk',    4,  6,  24, true],
  ['GREEK YOGURT PLAIN',        'dairy',   'greek yogurt',  2, 24,  48, true],
  ['CHDR CHEESE SHRED SHARP',   'dairy',   'cheddar',       6, 12,  72, true],
  ['BROWN RICE LONG GRAIN',     'grains',  'brown rice',    3,  8,  24, false],
  ['WHEAT BREAD SLICED 24OZ',   'grains',  'wheat bread',   5, 12,  60, true],
  ['ROLLED OATS OLD FASHIONED', 'grains',  'rolled oats',   2,  6,  12, false],
  ['CHKN THIGH BNLS SKNLS',     'protein', 'chicken thigh', 4,  4,  16, true],
  ['GRND BEEF 80/20',           'protein', 'ground beef',   3,  8,  24, true],
  ['BLACK BEANS CANNED',        'protein', 'black beans',   2, 24,  48, false],
  ['ROMAINE HEARTS',            'produce', 'romaine',       6, 12,  72, true],
];

/* The four rows that reach a total of nothing. The first two print a case
   weight rather than a count of units; the last two are not staple food. */
const HELD_BACK = [
  ['ROMA TOMATOES',       '25 LB CS',   'caseWeight', 25],
  ['YELLOW ONIONS JUMBO', '50 LB SACK', 'caseWeight', 50],
  ['PAPER TOWELS 2PLY',   '30 ROLL',    'notStaple'],
  ['BLEACH CLEANER CONC', '6 x 121 OZ', 'notFood'],
];

/* Why a line was held back is copy, not invoice data, so it translates. A live
   scan sends its own reason text, which is passed through as written. */
export const REASONS = {
  en: {
    caseWeight: (n) => `A case weight, not a count of ${n} units`,
    notStaple: () => 'Not one of the four staple categories',
    notFood: () => 'Not a food item',
    noPack: () => 'No pack count printed on the line',
  },
  es: {
    caseWeight: (n) => `Un peso por caja, no un conteo de ${n} unidades`,
    notStaple: () => 'No es una de las cuatro categorías básicas',
    notFood: () => 'No es un alimento',
    noPack: () => 'El renglón no imprime un conteo de empaque',
  },
};

/** Held-back rows for one locale: [description, pack, reason]. */
export function heldBack(rows, lang) {
  return rows.map(([desc, pack, key, arg]) => {
    const fn = REASONS[lang] && REASONS[lang][key];
    return [desc, pack, fn ? fn(arg) : key];   // live reasons pass through
  });
}

/** Rolls line items up into the per-category totals the scorecard reads. */
export function deriveCategories(items) {
  const by = {};
  CATEGORIES.forEach((c) => (by[c] = { varieties: new Set(), units: 0, perishable: false }));
  items.forEach(([, cat, variety, , , units, perishable]) => {
    const c = by[cat];
    if (!c) return;
    c.varieties.add(String(variety).trim().toLowerCase());
    c.units += units;
    if (perishable) c.perishable = true;
  });
  return CATEGORIES.map((key) => ({
    key,
    varieties: by[key].varieties.size,
    varietyNames: [...by[key].varieties],
    units: by[key].units,
    perishable: by[key].perishable,
  }));
}

export const FALLBACK = {
  ok: true,
  store: 'Corner Market #17',
  invoice: 'Valley Fresh VF-88213',
  rawLineCount: 14,
  items: SCANNED,
  excluded: HELD_BACK,
  get categories() { return deriveCategories(SCANNED); },
};

// ------------------------------------------------------------------ scoring
/** lib/rule-engine.ts, in the browser. Pure, so the demo can never drift. */
export function score(data) {
  const cats = data.categories;
  const totalUnits = cats.reduce((a, c) => a + c.units, 0);
  const varietiesMet = cats.filter((c) => c.varieties >= RULES.varietiesPerCategory).length;
  const perishablesMet = cats.filter((c) => c.perishable).length;
  const pass = varietiesMet === RULES.categoryCount
    && totalUnits >= RULES.totalUnits
    && perishablesMet >= RULES.perishableCategories;
  return { cats, totalUnits, varietiesMet, perishablesMet, pass };
}

/** Fix list: at most two per short category, shelf-stable first. */
export function fixes(result, copy) {
  const out = [];
  result.cats.forEach((c) => {
    const short = RULES.varietiesPerCategory - c.varieties;
    if (short <= 0) return;
    const label = copy.categoryLabels[c.key];
    const have = new Set(c.varietyNames);
    const pool = SUGGESTIONS[c.key].filter((s) => !have.has(s.variety));
    // Only reach for a perishable when the category has none yet.
    const ranked = c.perishable ? pool.filter((s) => !s.perishable).concat(pool.filter((s) => s.perishable))
                                : pool.slice().sort((a, b) => Number(b.perishable) - Number(a.perishable));
    ranked.slice(0, RULES.maxFixesPerCategory).forEach((s, i) => {
      const reached = c.varieties + i + 1;
      const gain = (!c.perishable && s.perishable)
        ? copy.perishableGain(label, RULES.perishableCategories, RULES.categoryCount)
        : copy.varietyGain(label, reached, RULES.varietiesPerCategory);
      const [item, pitch] = s[copy.lang];
      out.push({ category: label, item: `${item} (${copy.lang === 'es' ? 'surta' : 'stock'} ${RULES.unitsPerVariety})`,
                 reason: copy.newItemReason(pitch, RULES.unitsPerVariety, gain), short });
    });
  });
  return out.sort((a, b) => b.short - a.short);
}

// --------------------------------------------------------------------- API
/** Normalises a live ScanResponse into the shape the demo renders. */
function fromApi(json) {
  if (!json || json.ok !== true || !Array.isArray(json.items)) return null;
  const items = json.items
    .filter((it) => !it.accessory)
    .map((it) => [it.description, String(it.category || '').toLowerCase(), it.variety,
                  it.quantity ?? null, it.packSize ?? null, it.stockingUnits || 0,
                  Boolean(it.perishable)]);
  return {
    ok: true,
    live: true,
    store: 'Scanned invoice',
    invoice: 'Live scan',
    rawLineCount: json.rawLineCount ?? (items.length + (json.excluded || []).length),
    items,
    excluded: (json.excluded || []).map((e) => [e.description, e.packSize || '—', e.reason]),
    categories: deriveCategories(items),
  };
}

/** Try the live API; fall back to the saved scan on any failure. */
export async function runScan(file, copy = COPY.en) {
  const form = new FormData();
  form.append('image', file);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(API, { method: 'POST', body: form, signal: ctrl.signal });
    clearTimeout(t);
    const json = await res.json();
    const norm = fromApi(json);
    if (norm) return norm;
    // The route answered but refused the image — surface its own message.
    return { ...FALLBACK, categories: FALLBACK.categories,
             note: json?.error?.message || copy.refused };
  } catch {
    clearTimeout(t);
    return { ...FALLBACK, categories: FALLBACK.categories, note: copy.savedScan };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNav(); initReveal(); initCounters();
  document.querySelectorAll('[data-catbar]').forEach((el) => {
    const [n, h] = el.dataset.catbar.split('|');
    el.innerHTML = catBar(n, Number(h));
  });
});
