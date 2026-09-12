# ledger

The compliance layer for small stores.

A dashboard tracking every licence, permit and deadline a Los Angeles corner
store answers to, plus an invoice scanner that scores the shelves against the
USDA SNAP staple-stocking standard.

Built at Vision Hacks, South LA. Repository: <https://github.com/michae6345-crypto/visionhack>.

## What is deployed

Next.js App Router + TypeScript on Vercel. No database. Store data lives in the
visitor's browser via `localStorage`, with an in-memory fallback so it survives
inside a cross-origin iframe.

| Route | What it is |
|---|---|
| `/` | Dashboard: readiness ring, next deadlines, every obligation worst-first |
| `/licenses` | The full obligation table with agency, cadence and penalty |
| `/c/[key]` | One obligation: fields, checklist, notes. SNAP adds the stocking calculator, food handler cards add the staff roster |
| `/scan` | Photograph an invoice and score it. Posts to `/api/scan` |
| `/setup` | Store setup and "Load a sample store" |
| `/api/scan` | The vision pipeline. Image in, scorecard out |

Add `?demo=1` to any URL to load the sample store with no setup screen. Use it
for every link from the marketing site.

### The eight obligations

SNAP retailer authorization, WIC vendor status, LA County public health permit,
food handler cards, ABC beer and wine, tobacco retail licence, scale
registration, business tax registration.

Each carries an agency, a cadence, a penalty, its own fields, a requirements
checklist and notes. The status engine reports `ok`, `soon` (90 days),
`critical` (30 days), `expired`, `missing` or `na`.

## Getting started

```bash
git clone git@github.com:michae6345-crypto/visionhack.git
cd visionhack
npm install
cp .env.example .env.local   # then fill in OPENROUTER_API_KEY
npm run dev
```

## Environment variables

Set these in the Vercel project settings for all three environments, then
**redeploy**. Environment variable changes do not apply to existing deployments.

| Variable | What it does |
|---|---|
| `OPENROUTER_API_KEY` | Required before `/api/scan` can call a model. An `sk-or-...` key from [openrouter.ai](https://openrouter.ai) |
| `OPENROUTER_VISION_MODEL` | The image model. Has a default |

`OPENROUTER_API_KEY` is server-side only. Never prefix it with `NEXT_PUBLIC_`
and never import it into a client component. If a deployment still carries
`ANTHROPIC_API_KEY`, delete it; nothing reads it any more.

Without a key the dashboard still works in full and `/scan` shows a clearly
labelled sample scorecard rather than failing, so a demo cannot die on a missing
key.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # scoring rules, rule engine, CORS, OpenRouter request shape
npm run smoke      # end-to-end check (run `npm run build` first)
```

`npm test` needs no key and no network. The live vision call only runs under
`npm run smoke` when the key is present:

```bash
npm run build && OPENROUTER_API_KEY=... npm run smoke
npm run smoke -- ./path/to/invoice.jpg            # your own image
npm run smoke -- --url https://<app>.vercel.app   # hit the deployed route
```

## The SNAP staple-stocking standard

Published 8 May 2026, Federal Register 2026-09137, compliance date
4 November 2026. It asks for 7 varieties in each of the 4 staple categories,
3 stocking units per variety, 84 units in total, and a perishable variety in at
least 3 of the 4 categories. Butter and all jerky are accessory foods and count
for nothing, as do multi-ingredient items. Orders received in the last 21 days
count toward stock, which is why an invoice is evidence.

**Existing retailers are assessed at their regular reauthorization, roughly a
five-year cycle. They do not all face 4 November 2026.** Only new applicants
face that as a hard date. The dashboard says so wherever the date appears, and
anything claiming otherwise is wrong.

Thresholds are defined once in `lib/rule-engine.ts` and `lib/rules/constants.ts`.
`lib/compliance.ts` re-exports them so the calculator and the scanner cannot
drift apart. Do not retype the numbers anywhere else.

The scorecard is a preparation estimate, not an official USDA or FNS
determination.

## API

`POST /api/scan` is documented in [docs/api-scan.md](docs/api-scan.md). It takes
a multipart image and returns counted items, excluded items, variety counts,
`scorecard`, a Spanish `scorecardEs`, and timing metadata. Both scorecards come
back on one scan, so switching language never costs another request.

The scoring lives in [lib/rule-engine.ts](lib/rule-engine.ts) and the vision
passes in [lib/vision/](lib/vision). Neither should be duplicated in the UI:
render what the response returns.

`https://dark-role-914680.framer.app` is on the CORS allowlist so the Framer
marketing site can call the route cross-origin. The allowlist is an exact match
with no wildcards; see `ALLOWED_ORIGINS` in `lib/rules/constants.ts`.

## Layout

```
app/page.tsx           dashboard
app/licenses/          full obligation table
app/c/[key]/           one obligation, plus calculator or roster
app/scan/              photograph an invoice -> POST /api/scan
app/setup/             store setup and the sample store
app/api/scan/          the vision pipeline
components/Shell.tsx   sidebar, Page, PageHead, Card, Pill, Donut, Meter
components/useStore.ts loads and persists the store on the client
lib/compliance.ts      the 8 obligations and the SNAP constants
lib/store.ts           data model, persistence, status engine, sample store
lib/rule-engine.ts     scoring
lib/vision/            the vision pipeline
```

## Deploy isolation

Design assets land in the repo while deploys are running, so:

- `.vercelignore` keeps `brand/`, `docs/`, `fixtures/` and loose markdown out of
  the build bundle.
- `vercel.json` points `ignoreCommand` at `scripts/should-build.sh`, which skips
  the build when a push touched only those paths. It builds when it cannot tell.

## Design system

Black `#000000` and blue `#1B4DFF` on white. Blue is the logo brackets and the
"on track" state; it never fills a row and never colours the wordmark, which
stays lowercase. Status tints are muted: `#b02020` for failure, `#8a6a20` for a
warning. No saturated banners. Tokens live at the top of `app/globals.css`.

## Contributing

- Keep changes focused and easy to review.
- Document new setup steps and environment requirements.
- Add or update tests when behavior changes.
- Never commit secrets, credentials, or local environment files.
