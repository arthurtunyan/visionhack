# visionhack

Photograph an invoice or shelf, get a stocking scorecard.

Three-way split:

| Role | Owns |
|---|---|
| A | Frontend + client-side image downscaling |
| B | `POST /api/scan` — the vision pipeline (this PR) |
| C | Rule engine that turns classified items into a pass/fail scorecard |

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

`ANTHROPIC_API_KEY` is **server-side only**. Never prefix it with
`NEXT_PUBLIC_` and never import it into a client component.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run smoke      # smoke test (run `npm run build` first)
```

`npm run smoke` checks the undercounting rules and the request guards without
needing a key. The live vision call only runs when `ANTHROPIC_API_KEY` is set:

```bash
npm run build && ANTHROPIC_API_KEY=sk-ant-... npm run smoke
```

## API

`POST /api/scan` is documented in [docs/api-scan.md](docs/api-scan.md).

Stack is Next.js App Router + TypeScript, deployed on Vercel.
