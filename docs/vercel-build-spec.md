# Ledger — full site build spec (Next.js on Vercel)

Everything needed to build the Ledger site inside this repo and ship it on
Vercel. Replaces the Framer plan entirely.

---

## 0. What already exists — read before writing anything

```
app/api/scan/route.ts     POST /api/scan — the vision pipeline. DO NOT BREAK.
app/layout.tsx            root layout
app/page.tsx              placeholder. Its comment says the UI lives on Framer.
                          That is now false. Replace the file and the comment.
lib/types.ts              ScanResponse, ScanItem, ExcludedItem, VarietyCountsByCategory
lib/rules/constants.ts    the four scoring rules, thresholds, categories
lib/rules/partition.ts    the undercounting filter
lib/rule-engine.ts        scorecard logic
lib/mock-data.ts          sample data — use this for the demo pages
lib/scorecard-copy.ts     scorecard wording
lib/vision/*              two-pass extract + classify
brand/logo/*.svg          logos. Copy to public/ and reference from there.
brand/site/sections/*.png visual reference for each section. Do NOT ship these.
```

**Two things that follow from moving off Framer:**

1. **CORS is now unnecessary for the site.** The frontend and `/api/scan` are the
   same origin. Leave the CORS headers in place (a phone client or Framer page
   may still call it) but the site itself needs no preflight.
2. **Import the real types.** `lib/types.ts` already exports everything the UI
   needs. Never redeclare a `ScanItem` shape in a component.

---

## 1. Stack

- Next.js App Router, TypeScript, React Server Components where possible
- **CSS Modules or plain CSS** — do not add Tailwind, the tokens below are small
- **Framer Motion** (`motion/react`) for animation. It is the one dependency to add.
- No UI kit. No component library. The design is specific.
- Fonts: **Archivo** via `next/font/google`, weights 400/500/600/700

---

## 2. Tokens

Define once in `app/globals.css` as CSS custom properties.

```css
:root {
  --ink:#000000;  --coal:#0B0D12;  --paper:#FFFFFF;
  --blue:#1B4DFF; --blue-lift:#5B82FF;
  --tint:#F4F6FB; --wash:#F6F7F9;
  --line:#E6E6E6; --line-dark:#1C202B;
  --mute:#6B6B6B; --mute-dark:#9AA3B2;
  --bad:#B3261E;  --warn:#8A5300;
  --r-card:16px;  --r-btn:11px;  --r-pill:999px;
  --gutter:72px;  --section-y:70px;  --maxw:1600px;
}
```

**Rules:** two colours plus state. Red and amber only ever mark a status, never
decoration. On `--coal`, blue is `--blue-lift`; `--blue` goes muddy on near-black.

### Type — Archivo

| Role | Size | Weight | Tracking | Line height |
|---|---|---|---|---|
| Display XL | 88px | 700 | −0.045em | 1.04 |
| Display | 52px | 700 | −0.04em | 1.1 |
| Heading | 23px | 600 | −0.02em | 1.25 |
| Body L | 21px | 500 | — | 1.55 |
| Body | 17px | 500 | — | 1.65 |
| Small | 15px | 500 | — | 1.5 |
| Eyebrow | 13px | 700 | +0.09em, uppercase | 1 |

Body copy caps at **62 characters**. Nothing below 15px carries a sentence.

---

## 3. Shared components

Build these first; every page uses them.

```
components/
  Nav.tsx            sticky, transparent → white + hairline after 80px scroll
  Footer.tsx         stacked lockup + 3 link columns + non-affiliation line
  Button.tsx         variant: primary (blue) | secondary (coal) | ghost (bordered)
  Pill.tsx           tone: ok | warn | bad | neutral. Dot + label.
  Badge.tsx          programme badge. Typographic tile, NEVER an agency logo.
  Section.tsx        ground: paper | tint | coal. Handles padding + max width.
  Reveal.tsx         scroll-triggered entrance wrapper (see §6)
  CategoryBar.tsx    name + "n of 3" pill + segment bar. Red when short.
  AppWindow.tsx      browser chrome frame: dots, URL bar, shadow
  StatRing.tsx       SVG donut with % in the middle
  DataTable.tsx      header with 2px bottom border, hairline rows
```

**Badge is load-bearing.** It renders an abbreviation (SNAP, WIC, EPA…) in
Archivo 700 on a tile. It must never render an image. Any page using it must
also render the non-affiliation line:

> Program names identify what Ledger tracks. Ledger is not affiliated with,
> endorsed by, or acting on behalf of any agency or program.

Put that string in one constant and import it. Do not retype it per page.

---

## 4. Routes

```
/                          landing
/industries/[slug]         grocery-convenience | auto-parts | liquor-tobacco
                           | pharmacy-health | hardware-garden
/coverage                  all 18 programmes
/pricing                   plans
/faq                       questions
/privacy  /terms           legal
/demo                      live scan demo — the hackathon money shot
/demo/result               scan result view
```

Everything is statically rendered except `/demo`.

---

## 5. Pages

### `/` — landing

Twelve sections, grounds alternating. Do not run three `paper` sections together.

| # | Section | Ground |
|---|---|---|
| 1 | Nav | paper |
| 2 | Hero | paper + grid |
| 3 | Programme strip | paper |
| 4 | Industries | paper |
| 5 | How it works | tint |
| 6 | Built to undercount | paper |
| 7 | Coverage | **coal** |
| 8 | Social proof | tint |
| 9 | Pricing | paper |
| 10 | FAQ | paper |
| 11 | CTA | **coal** |
| 12 | Footer | paper |

#### 2 · Hero — centred, 1240px tall, `overflow:hidden`

Layers, back to front:
- **Grid**: two repeating-linear-gradients, `--line` 1px, 88px cells, opacity .55,
  masked `linear-gradient(to bottom,#000 0%,#000 32%,transparent 72%)`
- **Glow**: radial ellipse, centred ~660px down, 1500×620,
  `rgba(27,77,255,.13)` → transparent
- Content, centred, gaps 92 → 34 → 26 → 36 → 30 → 54:

1. Pill: white, 1px `--line`, radius 999, padding 11/22, shadow
   `0 6px 18px rgba(16,20,32,.05)`. Mark 19px + eyebrow
   `18 PROGRAMMES · FEDERAL, STATE AND LOCAL`
2. Display XL, max-width 1280:
   **Every permit your store holds. / One place. One calendar.**
3. Body L, `--mute`, max-width 760:
   `Ledger tracks the licences, filings and stocking rules a small retailer is judged on, and tells you which one is about to fail.`
4. Buttons: `Start Free` (primary) · `See a Sample Scan` (secondary → `/demo`)
5. Trust row, 16px `--mute`, gaps 42:
   `No integration` · `Works from a phone photo` · `First store free`
6. `<AppWindow>` 1240 wide containing the dashboard, positioned to **crop at the
   bottom edge of the section**. The crop is the point — do not fully contain it.

#### 3 · Programme strip

Heading 17px `--mute`: `Eighteen programmes tracked across federal, state and local authorities`.
Ten badges, 58px tiles, `--tint` ground, radius 15, each with a 13px caption:

SNAP Food benefits · WIC Vendor status · EBT Benefit payments · EPA Waste & refrigerant ·
OSHA Workplace safety · ABC Alcohol licence · DOT Hazmat shipping · CHP Health permit ·
W&M Scales · TRL Tobacco

Then the non-affiliation line. Bottom hairline.

#### 4 · Industries — a list, not cards

Display `Not just grocery.` left; body right, max 520:
`Any small retailer carries a stack of permits that expire on different dates and answer to different inspectors. Ledger holds the whole stack.`

Five rows, hairline between, each linking to `/industries/[slug]`:

| Name | Description | Badges |
|---|---|---|
| Grocery & convenience | SNAP and WIC stocking, health permit, tobacco, scales | SNAP WIC EBT CHP TRL W&M |
| Auto parts & service | Used oil and hazardous waste, refrigerant handling, repair registration | EPA OSHA DOT BAR BTC FIRE |
| Liquor & tobacco | State licence conditions, federal permits, age-verification posting | ABC TTB TRL BTC FIRE |
| Pharmacy & health | Board of pharmacy, controlled substances, cold chain | BOP FDA CHP OSHA |
| Hardware & garden | Pesticide sales, hazardous storage, fire load, scales | EPA OSHA FIRE W&M BTC |

#### 5 · How it works — tint

Display `Set it up once. It runs itself.` Three numbered rows, hairline between,
**alternating sides** (1 text-left, 2 text-right, 3 text-left).

1. **Add your permits** — `Tell Ledger what you hold. It works out which rules apply to your kind of store and when each one comes due.` Visual: permit rows with SNAP / CHP / W&M badges.
2. **See where you stand** — `Every requirement against its threshold, re-checked after each scan. No digging through renewal letters.` Visual: four `<CategoryBar>` — Dairy 4/3, Grains 3/3, Protein 3/3, **Produce 1/3 red**.
3. **Fix what blocks you** — `Ranked by what closes you down first, not by date. The top item is always the one that matters today.` Visual: three checklist rows — Add 2 produce varieties (blocks review, red) · Renew health permit (overdue, red) · WIC price list (9 days, amber).

#### 6 · Built to undercount

Left, 520px: Display `Built to undercount.` Body: `Telling a store it passes when
it doesn't is the expensive mistake. A case priced by weight has no unit count to
read, so Ledger lists it with the reason instead of inventing a number.` Then a
hairline, `4` at 56px, `lines held back on this invoice` (17px/600), and
`Four held back beats one wrong total.` in `--mute`.

Right: `<DataTable>`, header 12px uppercase `--mute` with a **2px `--ink` bottom
border**, four hairline rows:

| Line | Pack | Why it was not counted |
|---|---|---|
| ROMA TOMATOES | 25 LB CS | Priced by weight — no unit count |
| YELLOW ONIONS JUMBO | 50 LB SACK | Priced by weight — no unit count |
| SWEET CREAM BUTTER | 36 x 4 OZ | Accessory food — counts for nothing |
| PAPER TOWELS 2PLY | 30 ROLL | Not a staple category |

This is the differentiator. It should read like a document, not marketing.

#### 7 · Coverage — coal

Display white `Eighteen programmes, three levels of government.` Body
`--mute-dark`: `Each has its own renewal date, its own filing and its own
inspector. Ledger holds all of them against one calendar.`

Three columns, eyebrows in `--blue-lift`, rows = 40px dark badge + 15px white
abbrev over 13.5px `--mute-dark` description, hairlines `--line-dark`.

**Federal** SNAP retailer authorization · WIC vendor authorization · EBT benefit
acceptance · FDA food facility registration · EPA used oil, hazardous waste and
refrigerant handling · OSHA hazard communication and posting · DOT hazardous
materials shipping · TTB alcohol and tobacco permits

**State** ABC alcoholic beverage control · W&M weights and measures · BAR
automotive repair registration · TRL tobacco retail licence · RSP seller's permit
and resale · BOP board of pharmacy

**Local** CHP county health permit · FIRE fire marshal inspection · BTC business
tax certificate · CoO certificate of occupancy

Non-affiliation line above a `--line-dark` rule.

#### 8 · Social proof — tint

Quote 36px/600, −0.03em, 1.36:
> "We lost SNAP authorization once over two produce varieties nobody noticed were
> gone. It took four months to get back. Now I photograph the invoice at the back
> door and I know before the truck leaves."

48px circle `RM`, **Rosa Medina** / `Owner, Corner Market. Four stores in Los Angeles.`

Right of a vertical hairline: `0` at 76px, `line items counted that Ledger wasn't
certain about`, rule, `Average scan` / `20s`.

*Placeholder. Replace before any real launch.*

#### 9 · Pricing — the only section with borders

Three cards, radius 16. Middle: 2px `--blue` + "Most stores" pill.

| | Single store | Group | Chain |
|---|---|---|---|
| Price | **$29**/month | **$24**/store/month | **Talk to us** |
| For | One location, one owner. | Two to ten locations. | Eleven locations or more. |
| Features | Unlimited invoice scans · All 18 programmes tracked · Renewal reminders · 7 years of scan history | Everything in Single store · One view across every store · Per-store scorecards · Staff card tracking · CSV export | Everything in Group · Bulk onboarding · Priority support · Custom thresholds |

"Talk to us" renders at **30px, not 48px** — a text price at the numeric display
size wrecks the row. *Prices are placeholder.*

#### 10 · FAQ

Display `Questions we get asked.` Five rows, hairline above each, two columns:
question 20px/600 in a 340px column, answer 17px `--mute`.

1. **I don't sell food. Is this for me?** — Yes. Auto parts, liquor, pharmacy and hardware stores all carry permit stacks with different renewal dates and different inspectors. The invoice scan is the food-specific part; the permit tracking is not.
2. **Are you affiliated with SNAP or the EPA?** — No. Ledger tracks published programme requirements so you can see where you stand. It is not affiliated with, endorsed by, or acting for any agency, and no authorization decision is ever ours.
3. **What if the photo is blurry?** — Ledger transcribes only what it can actually read. Anything ambiguous is listed as held back with a reason, and never counted. A blurry photo gives you a shorter count, not a wrong one.
4. **Does a case count as one unit?** — No. A case becomes the number of sellable units inside it. A 24-pack is 24. If an item is priced by weight there is no unit count to read, so it is held back for you to confirm.
5. **Do I need to integrate my POS?** — No. Ledger works from a photograph of the paper invoice and the permit details you enter once. Nothing to install at the register.

Keep answer 2 verbatim.

#### 11 · CTA — coal
Inverse lockup, Display white `Find out which permit is about to fail.`, white
`Start Free` button, `First store free. No card.` in `--mute-dark`.

#### 12 · Footer
Stacked lockup + `Permit and stocking compliance for independent retailers.`
Columns — Product / Industries / Company. Non-affiliation line, `© 2026 Ledger`,
`Los Angeles, CA`.

---

### `/industries/[slug]`

Static params from the five slugs. Each page:
- Hero: eyebrow `INDUSTRIES`, Display = industry name, body = its description
- Badge row of that industry's programmes
- "What you're judged on" — the programme list with full descriptions
- Reuse sections 5, 6, 9, 11 from the landing page
- Link back to `/industries`

### `/coverage`
Section 7 as a full page on `--paper` (not coal, since it is the whole page),
plus a short intro and a link to `/demo`.

### `/pricing`, `/faq`
Sections 9 and 10 as full pages with a Display heading and the CTA beneath.

### `/privacy`, `/terms`
Plain prose, `--maxw` 760, Body type. Include the non-affiliation line.

### `/demo` — the hackathon money shot

This is the one interactive page. Build it properly.

- Upload area: drop or choose a photo. Show the file name and size.
- On submit, POST `multipart/form-data` with field **`image`** to `/api/scan`.
  Same origin, so no CORS handling needed.
- **While in flight**, show `brand/logo/ledger-mark-animated.svg` as the loading
  state. That is what it was made for. Show elapsed seconds — a scan takes ~20s
  and silence for 20s feels broken.
- Import `ScanResponse` from `lib/types.ts`. Handle `ok: false` by showing
  `error.message`; it is written to be shown to a user.
- Provide a "Use the sample invoice" button that posts
  `fixtures/sample-invoice.png` so the demo works without a photo.

### `/demo/result`

- `<StatRing>` with the scorecard percentage
- `<CategoryBar>` per category with its `n of 3`
- Counted items table: description, category, variety, stocking units, perishable
- **A separate "Couldn't read these" table** for `excluded`, with each reason.
  Style it distinctly. It must never look like part of the count — that
  distinction is the product's entire safety argument.
- `varietyCounts` summary

---

## 6. Animation — Framer Motion

One `<Reveal>` component wrapping anything that animates.

```tsx
// entrance used everywhere
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.25 }}
transition={{ duration: 0.36, ease: [0.22, 0.68, 0.28, 1], delay }}
```

- **`once: true` is mandatory.** Replaying on scroll-up is what makes a site feel cheap.
- Stagger siblings 40–70ms via `delay={i * 0.05}`
- Travel 16–24px. No more.
- Duration 240–420ms.

Per section: hero staggers eyebrow → headline → body → buttons → trust, then the
window enters `x: 40 → 0, scale: .98 → 1` at 420ms. Category bars animate
`scaleX 0 → 1` from the left, 500ms, 80ms stagger. The `4` and the `0` count up
over 600ms. Pricing cards lift `y: -4` on hover, 180ms.

**Reduced motion** — honour it globally:

```tsx
const reduce = useReducedMotion();
// if reduce, render with no initial/animate offsets
```

---

## 7. Responsive

Breakpoints 1280 / 768 / 480.

- Display XL 88 → 56 → 40. Display 52 → 38 → 30.
- **Body never below 16px on mobile.**
- Multi-column sections stack in reading order.
- Hero: window may crop harder; headline must not break mid-phrase — set explicit
  `<br>` points per breakpoint.
- Badge strip wraps to rows; badges never shrink below 44px.
- Tables become stacked rows on mobile, not squeezed grids.
- Nav collapses to a menu button.

---

## 8. Vercel

- Project already deployed. Pushing to a branch gives a preview URL.
- `ANTHROPIC_API_KEY` (or the OpenRouter key, if PR #6 landed) must be set in
  project settings, then **redeploy** — env changes do not apply to existing
  deployments.
- `/api/scan` keeps `runtime = "nodejs"` and `maxDuration = 60`. Do not move it
  to edge.
- Add `metadata` in `app/layout.tsx`: title, description, `openGraph.images` →
  `/og-image-1200x630.png`, icons → `/favicon.ico`.
- Copy `brand/logo/*.svg`, `brand/icons/favicon.ico`,
  `brand/icons/apple-touch-icon-180.png`, `brand/social/og-image-1200x630.png`
  into `public/`.

---

## 9. Rules that do not bend

1. **Do not break `/api/scan`.** It is the product. Run `npm test` and
   `npm run build` before every push.
2. Two colours plus state. On coal, blue is `--blue-lift`.
3. Programme badges are typographic. No agency logos or seals, anywhere. The
   non-affiliation line travels with them.
4. Body text never below 15px (16px on mobile). Measure capped near 62 characters.
5. Borders are the exception. Hairlines and whitespace separate things. Cards only
   in pricing.
6. Never redeclare types the API already exports — import from `lib/types.ts`.
7. `excluded` items are never shown as counted. Ever.
8. Prices and the testimonial are placeholder.
