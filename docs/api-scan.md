# `POST /api/scan` — contract

Owned by Role B. Takes a photographed invoice/shelf image, returns clean
classified line items with the scoring rules already applied, plus a
qualifying-variety count per category.

It also returns `scorecard`: Role C's pass/fail `ScanResult`, built from the
counted items. See [The C boundary](#the-c-boundary) below.

The route is CORS-enabled and handles the `OPTIONS` preflight, because the
frontend is hosted on Framer (a different origin).

## Request

Two accepted shapes. Use whichever is convenient; they behave identically.

**Multipart (recommended from the browser)** — file field named `image`.
This is the exact snippet for the Framer button; note the absolute URL, since
Framer is a different origin:

```ts
const form = new FormData();
form.append("image", file); // file.type must be image/jpeg|png|webp|gif
form.append("storeName", storeName); // optional, shown on the scorecard

const res = await fetch("https://<app>.vercel.app/api/scan", {
  method: "POST",
  body: form, // do NOT set Content-Type — the browser adds the boundary
});

const data: ScanResponse = await res.json();
if (data.ok) {
  data.items;         // counted line items
  data.excluded;      // show as "couldn't read these"
  data.varietyCounts; // { dairy, grains, protein, produce }
  data.scorecard;     // ScanResult: pass/fail, 4 category cards, fix list
} else {
  data.error.message; // safe to display
}
```

**JSON (handy for curl/tests)** — base64 under the `image` key:

```json
{ "image": "<base64, data: URL prefix tolerated>", "mediaType": "image/jpeg", "storeName": "optional" }
```

Limit: **8 MB**. Larger uploads get `413 payload_too_large`. Downscale
client-side before sending — that is Role A's job and it also makes the scan
faster.

## Response

Types live in [`lib/types.ts`](../lib/types.ts) — import them, don't retype them.

```ts
type ScanResponse = ScanSuccess | ScanError;

interface ScanSuccess {
  ok: true;
  items: ScanItem[];        // counted (accessories included, at 0 units)
  excluded: ExcludedItem[]; // NOT counted — show as "couldn't read these"
  varietyCounts: VarietyCountsByCategory; // qualifying varieties, floored
  scorecard: ScanResult;    // C's pass/fail scorecard, shape in lib/mock-data.ts
  meta: ScanMeta;
}

// Alias for the same thing, named to stay distinct from C's ScanResult.
type ClassifiedScanResult = ScanSuccess;

interface ScanItem {
  description: string;    // exactly as printed on the invoice
  category: "dairy" | "grains" | "protein" | "produce";
  variety: string;        // e.g. "whole milk", "roma tomato"
  quantity: number | null;
  packCount: number | null;
  stockingUnits: number;  // quantity × packCount, forced to 0 for accessories
  accessory: boolean;     // butter / jerky — counts for nothing
  storage: "fresh" | "refrigerated" | "frozen" | "shelf_stable";
  perishable: boolean;    // refrigerated or fresh
  confidence: number;     // 0..1, already filtered to >= 0.75
}

type VarietyCountsByCategory = Record<
  "dairy" | "grains" | "protein" | "produce",
  number
>;

interface ExcludedItem {
  description: string;
  reason: string;        // safe to show in the UI
  confidence: number;
  category: Category | null;
}

interface ScanError {
  ok: false;
  error: { code: ScanErrorCode; message: string };
}
```

### Scoring rules

All four are quoted verbatim in
[`lib/rules/constants.ts`](../lib/rules/constants.ts) next to the code that
implements them, and are unit-tested with no API key (`npm test`).

1. **Accessory foods.** Butter and all jerky count for nothing — 0 stocking
   units, 0 toward any variety count. They are still returned, so they stay
   visible in the UI.
2. **Minimum units.** A variety needs at least **3** stocking units to count.
3. **Perishable** means refrigerated or fresh.
4. **Variety counts round down.** `Math.floor`, never round-half-up.

Each is enforced in code as well as in the pass-2 prompt, because the model
drifts. Editing the prompt alone cannot change the numbers.

<a id="the-c-boundary"></a>
### The C boundary

The route runs C's rule engine ([`lib/rule-engine.ts`](../lib/rule-engine.ts))
over `items` and returns the result as `scorecard`, typed as `ScanResult` in
[`lib/mock-data.ts`](../lib/mock-data.ts). That is the shape the UI renders.

The engine reuses the rules in `lib/rules/constants.ts`, so each
`scorecard.categories[n].varietiesFound` equals `varietyCounts` for that
category, and a test asserts it. On top of that it applies the pass rule (7
varieties in every category, perishables in 3 of 4) and builds the fix list.
`storeName` is optional; without it the scorecard's `storeName` is empty.

### The rule that matters

**Undercounting is safer than overcounting.** An item is counted only if it
clears *every* check: the model did not flag it, confidence ≥ 0.75, and both
quantity and pack size resolved to a whole number of stocking units. Anything
else lands in `excluded`.

`excluded` is for display only. **Never score it** — doing so reintroduces
exactly the overcounting risk the filter exists to prevent.

### Error codes

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `bad_request` | Content-Type was neither multipart nor JSON, or body was malformed |
| 400 | `no_image` | No `image` field/key |
| 413 | `payload_too_large` | Over 8 MB |
| 415 | `unsupported_media_type` | Not jpeg/png/webp/gif |
| 422 | `model_refused` | The model declined the image |
| 429 | `rate_limited` | OpenRouter rate limit |
| 500 | `server_misconfigured` | `OPENROUTER_API_KEY` missing or rejected (401/403), or the OpenRouter account is out of credits (402) — the message names the fix |
| 502 | `upstream_error` / `unparseable_model_output` | OpenRouter error or no provider for the model, or output was not valid JSON / failed schema validation |
| 504 | `upstream_unreachable` | Could not reach OpenRouter, or it timed out |

## How it works

Two passes, deliberately not one:

1. **extract** (temperature 0) — transcribe printed lines verbatim. No
   interpretation. Invoices are printed text, so this is near-deterministic.
2. **classify** (default temperature) — categorize, name the variety, size the
   pack, flag perishability, score confidence.

Splitting them stops transcription errors from being laundered into
confident-looking classifications.

Both passes go to **OpenRouter**'s OpenAI-compatible
`POST https://openrouter.ai/api/v1/chat/completions` over plain `fetch` — no
vendor SDK. The model id lives in one constant (`MODEL`, currently
`qwen/qwen3-vl-32b-instruct`) so swapping it is a one-line change.

Pass 1 sends the image as an `image_url` content part holding a
`data:<mediaType>;base64,...` URL, placed before the text part.

Both passes request `response_format: { type: "json_schema", json_schema: {
name, strict: true, schema } }`, where `schema` is generated from the Zod
schemas in `lib/vision/schemas.ts` via `z.toJSONSchema`. `provider: {
require_parameters: true }` keeps OpenRouter from routing to a provider that
would silently ignore `response_format`.

The model's JSON is **not** trusted: it is parsed and then re-validated with the
same Zod schema. Anything that does not match is a `502
unparseable_model_output`, never a partially-filled scorecard.

Tunables (the four scoring rules, confidence threshold, pack math, size cap,
CORS origins, model) all live in
[`lib/rules/constants.ts`](../lib/rules/constants.ts). There are no magic
numbers in the handler.

## CORS

`ALLOWED_ORIGINS` in [`lib/rules/constants.ts`](../lib/rules/constants.ts) is an
**exact-match allowlist**:

| Origin | Why |
|---|---|
| `https://dark-role-914680.framer.app` | the published Framer site |
| `http://localhost:3000` | local development |

There is no wildcard and no suffix matching. An origin that is not on the list
gets **no `Access-Control-Allow-Origin` header at all**, so the browser blocks
the response; the header is never `*`. Every response — errors included —
carries `Vary: Origin`, so a cache cannot serve one origin's response to
another.

This replaced a rule that allowed any `*.framer.app` / `*.framer.website`
subdomain and fell back to `*` for everything else, i.e. anyone's Framer
project, and in practice any site at all.

**Known gap — the Framer editor.** Framer may serve the *canvas preview* from a
different origin than the published site. That origin is deliberately not on the
list because nobody has observed it first-hand, and guessing a shared Framer
domain would re-open the hole above. If `/api/scan` is CORS-blocked while
working inside the editor: open devtools → Network → the blocked request, copy
the exact `Origin` request header, and add that string to `ALLOWED_ORIGINS` (and
to `FRAMER_ORIGIN`'s siblings in `scripts/smoke-scan.mjs` if you want it
covered by the smoke test). The published site is unaffected either way.
