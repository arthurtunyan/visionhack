# VisionHack

Photograph an invoice or shelf, get a stocking scorecard.

This repository is connected to [GitHub](https://github.com/arthurtunyan/visionhack).

## Team split

| Role | Owns |
|---|---|
| A | Frontend + client-side image downscaling |
| B | `POST /api/scan` — the vision pipeline |
| C | Rule engine that turns classified items into a pass/fail scorecard |

## Project status

The backend vision pipeline (Role B) and the rule engine (Role C) are
implemented. The frontend is not.

**Stack:** Next.js (App Router) + TypeScript, deployed on Vercel. This repo is
**API-only** — the interface lives on Framer and calls `/api/scan`
cross-origin. The root page is a placeholder so Vercel has something to serve;
please don't grow it into a UI.

> Note: `CLAUDE.md` asks that no framework be assumed until the repository
> establishes one. This stack was chosen because the `/api/scan` brief
> specifies Vercel route handlers, a `nodejs` runtime, `maxDuration`, and a
> server-side API key — all of which presuppose it. The footprint is kept
> minimal so the frontend and rule engine are not boxed in. Raise it on the
> PR if you'd rather go a different way.

## Getting started

1. Clone the repository:

   ```bash
   git clone git@github.com:arthurtunyan/visionhack.git
   cd visionhack
   ```

2. Install dependencies and configure the environment:

   ```bash
   npm install
   cp .env.example .env.local   # then fill in OPENROUTER_API_KEY
   npm run dev
   ```

`OPENROUTER_API_KEY` is **server-side only**. Never prefix it with
`NEXT_PUBLIC_` and never import it into a client component.

### Deploying

The env var name is exactly **`OPENROUTER_API_KEY`** (an `sk-or-...` key from
[openrouter.ai](https://openrouter.ai)). If a deployment still carries
`ANTHROPIC_API_KEY`, delete it — nothing reads it any more.

> Set it in the Vercel **project settings**, then **REDEPLOY**. Environment
> variable changes do not apply to existing deployments — without a redeploy
> the route keeps returning the "not configured" 500.

If the key is missing the route returns a 500 whose message says exactly that,
so the failure is self-explanatory rather than a generic crash. A 500 whose
message mentions credits means the OpenRouter account needs topping up — that
one does not need a redeploy.

**Deployed API URL:** _not yet deployed — fill this in after the first Vercel
deploy._ The Framer site at <https://dark-role-914680.framer.app> posts to
`<deployed-url>/api/scan`; that origin is on the CORS allowlist.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # scoring-rule and rule-engine tests — no server, no API key
npm run smoke      # end-to-end check (run `npm run build` first)
```

### Verifying it works

`npm test` covers the four scoring rules, the rule engine (scorecard and fix
list), the CORS allowlist, and the OpenRouter request shape and error mapping
(against a stubbed `fetch`). No key, no network, runs in CI.

`npm run smoke` boots the production build and checks the CORS preflight and
every request guard. **The live vision call only runs when the key is present**
— whoever holds it should run:

```bash
npm run build && OPENROUTER_API_KEY=... npm run smoke
```

Other forms:

```bash
npm run smoke -- ./path/to/invoice.jpg            # your own image
npm run smoke -- --url https://<app>.vercel.app   # hit the deployed route
```

Or straight curl against a deployment:

```bash
curl -sS -X POST https://<app>.vercel.app/api/scan \
  -F "image=@fixtures/sample-invoice.png" | jq
```

## API

`POST /api/scan` is documented in [docs/api-scan.md](docs/api-scan.md), including
the request shape and the response TypeScript type for wiring up the Framer
button. The response's `scorecard` is the pass/fail `ScanResult` built by the
rule engine in [lib/rule-engine.ts](lib/rule-engine.ts).

## Contributing

- Keep changes focused and easy to review.
- Document new setup steps and environment requirements.
- Add or update tests when behavior changes.
- Never commit secrets, credentials, or local environment files.
