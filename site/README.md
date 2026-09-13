# `site/` — the static fallback

A complete, self-contained copy of the Ledger site that runs on GitHub Pages
with **no build step, no server, no API key and no network**. It exists so the
demo survives the Vercel deployment being down, the Next.js build breaking, or
the OpenRouter key running out during a presentation.

Nothing in here imports from `app/`, `lib/` or `components/`. That is
deliberate: a fallback that shares a build with the thing it is backing up is
not a fallback.

## Pages

| Page | What it is |
|---|---|
| `index.html` | The full marketing site: hero, programme strip, industries, how it works, undercounting, coverage, pricing, FAQ. |
| `demo.html` | The scan demo: upload or drag an invoice photo, get a scorecard. English and Spanish. |

## How the demo works with no backend

`demo.html` POSTs the image to the live API first
(`https://visionhack.vercel.app/api/scan`, overridable with
`window.LEDGER_API`). If that call fails for any reason — deployment down, CORS
refused, key missing, request timed out, connection blocked — it replays a
**saved scan** of `fixtures/sample-invoice.png` and says so in an amber banner,
rather than showing an error.

The saved scan is not decorative. It is scored in the browser by the same rules
as `lib/rule-engine.ts`:

- 7 varieties in each of 4 staple categories
- 3 stocking units per variety, 21 per category, 84 in total
- at least one perishable variety in 3 of the 4 categories

For `fixtures/sample-invoice.png` (Valley Fresh VF-88213, 14 printed rows) that
gives 10 counted lines, 400 stocking units, 0 of 4 categories at 7 varieties and
4 categories with a perishable — so: **does not meet the standard yet**, short on
variety breadth rather than on volume.

Four rows are held back rather than guessed:

| Line | Pack read | Why |
|---|---|---|
| ROMA TOMATOES | `25 LB CS` | A case weight, not a count of 25 units |
| YELLOW ONIONS JUMBO | `50 LB SACK` | A case weight, not a count of 50 units |
| PAPER TOWELS 2PLY | `30 ROLL` | Not one of the four staple categories |
| BLEACH CLEANER CONC | `6 x 121 OZ` | Not a food item |

A pack count is only ever read from an explicit printed expression (`6/1 GAL`,
`24 x 5.3 OZ`, `12 EA`, `12 CT`). An unknown pack count is never rounded up to
one. Undercounting is the intended behaviour: telling a store it meets the
standard when it does not is the expensive mistake.

## Claim wording

Result wording follows `docs/regulatory-basis.md`: *"Estimated to meet the SNAP
stocking standard"* / *"May not meet the stocking standard yet"*, always next to
the readiness-estimate disclosure. Unqualified claims — "passes USDA", "fails
SNAP", "inspection ready" — are not used anywhere in here.

## It works with JavaScript off

Every section is in the HTML. The scroll-reveal animation is gated behind a
`js` class that an inline `<script>` in `<head>` sets, so a blocked module, a
parse error or an old browser costs you the animation, not the content.
Category bars are rendered at build time and re-rendered by the script. Count-up
numbers ship with their final value in the markup and are only rewound to zero
once the observer is wired.

## Editing

`index.html` and `demo.html` are **generated**. Edit the generator, not the HTML:

```bash
python3 brand/tools/build-static-site.py
python3 scripts/check-static-site.py
```

`site/assets/style.css` and `site/assets/app.js` are hand-written and are not
regenerated.

`scripts/check-static-site.py` runs in CI and fails if an asset is missing, a
page uses a root-relative path (GitHub Pages serves from a `/<repo>/` subpath),
content is hidden behind JavaScript, the thresholds in `app.js` drift from
`lib/rule-engine.ts`, or a saved-scan row's `quantity × pack` stops matching its
unit count.

## Deploying

`.github/workflows/pages.yml` publishes this directory on every push to `main`
that touches it, and verifies (without publishing) on every pull request. The
first deploy turns Pages on itself via `configure-pages`' `enablement` input, so
there is normally nothing to click. If your org blocks that, the job fails with
*"Get Pages site failed ... Not Found"* and somebody has to set **Settings →
Pages → Source: GitHub Actions** by hand.

The site then serves at `https://<owner>.github.io/visionhack/`.

`.nojekyll` is present so Jekyll does not drop `_`-prefixed paths.

### One thing to check before relying on the live path

The API's CORS allowlist must include the Pages origin
(`https://<owner>.github.io`) or the browser blocks the request and the demo
falls back to the saved scan. The saved scan is a correct-looking result either
way, so this failure is silent unless you look for the amber banner.
