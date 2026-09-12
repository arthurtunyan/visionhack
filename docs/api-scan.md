# `POST /api/scan` — contract

Owned by Role B. Takes a photographed invoice/shelf image, returns clean
classified line items with the scoring rules already applied, plus a
qualifying-variety count per category.

**It does not build the pass/fail scorecard** — that is Role C's rule engine.
See [The C boundary](#the-c-boundary) below; the final shape needs one
conversation with C.

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

const res = await fetch("https://<app>.vercel.app/api/scan", {
  method: "POST",
  body: form, // do NOT set Content-Type — the browser adds the boundary
});

const data: ScanResponse = await res.json();
if (data.ok) {
  data.items;         // counted line items
  data.excluded;      // show as "couldn't read these"
  data.varietyCounts; // { dairy, grains, protein, produce }
} else {
  data.error.message; // safe to display
}
```

**JSON (handy for curl/tests)** — base64 under the `image` key:

```json
{ "image": "<base64, data: URL prefix tolerated>", "mediaType": "image/jpeg" }
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

This route returns classified items plus `varietyCounts`. It deliberately stops
short of a pass/fail verdict — that is C's rule engine.

**Open question for C:** the specifics doc says the route "returns the
ScanResult JSON", but the role split gives the ScanResult scorecard to C. Rather
than guess and rebuild half of C's engine, this returns the inputs a scorecard
needs. One conversation with C should settle whether they consume
`varietyCounts` directly or want a different shape.

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
| 429 | `rate_limited` | Anthropic rate limit |
| 500 | `server_misconfigured` | `ANTHROPIC_API_KEY` missing or rejected — the message names the fix (set it in Vercel settings, then redeploy) |
| 502 | `upstream_error` / `unparseable_model_output` | API error, or output failed schema validation |
| 504 | `upstream_unreachable` | Could not reach the API |

## How it works

Two passes, deliberately not one:

1. **extract** (low effort) — transcribe printed lines verbatim. No
   interpretation. Invoices are printed text, so this is near-deterministic.
2. **classify** (default effort) — categorize, name the variety, size the
   pack, flag perishability, score confidence.

Splitting them stops transcription errors from being laundered into
confident-looking classifications.

Tunables (the four scoring rules, confidence threshold, pack math, size cap,
CORS origins, model) all live in
[`lib/rules/constants.ts`](../lib/rules/constants.ts). There are no magic
numbers in the handler.

## CORS

The allowed-origin list is in `lib/rules/constants.ts` and currently falls back
to `*` for the hackathon. **Tighten it** once the Framer site has its final
domain — drop the fallback and keep the explicit list.
