# `POST /api/scan` — contract

Owned by Role B. Takes a photographed invoice/shelf image, returns clean
classified line items. **It does not score anything** — the pass/fail
scorecard is Role C's rule engine.

## Request

Two accepted shapes. Use whichever is convenient; they behave identically.

**Multipart (recommended from the browser)** — file field named `image`:

```ts
const form = new FormData();
form.append("image", file); // file.type must be image/jpeg|png|webp|gif
const res = await fetch("/api/scan", { method: "POST", body: form });
const data: ScanResponse = await res.json();
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
  items: ScanItem[];        // counted — feed these to the rule engine
  excluded: ExcludedItem[]; // NOT counted — show as "couldn't read these"
  meta: ScanMeta;
}

interface ScanItem {
  description: string;   // exactly as printed on the invoice
  category: "dairy" | "grains" | "protein" | "produce";
  variety: string;       // e.g. "whole milk", "roma tomato"
  quantity: number;      // packs/cases on the line
  packCount: number;     // sellable units per pack
  stockingUnits: number; // quantity × packCount
  perishable: boolean;
  confidence: number;    // 0..1, already filtered to >= 0.75
}

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
| 500 | `server_misconfigured` | `ANTHROPIC_API_KEY` missing or rejected |
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

Tunables (threshold, pack math, perishable defaults, size cap, model) all live
in [`lib/rules/constants.ts`](../lib/rules/constants.ts). There are no magic
numbers in the handler.
