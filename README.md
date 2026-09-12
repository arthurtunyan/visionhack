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

The backend vision pipeline (Role B) is implemented. The frontend and the
rule engine are not.

**Stack:** Next.js (App Router) + TypeScript, deployed on Vercel.

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

## Contributing

- Keep changes focused and easy to review.
- Document new setup steps and environment requirements.
- Add or update tests when behavior changes.
- Never commit secrets, credentials, or local environment files.
