# Ledger — Framer build spec

**For Framer's agent.** Build these sections **natively** in Framer: real text
layers, real shapes, real components.

> **Do not place the PNGs in `brand/site/sections/` as flat images.** They are
> pixel references only. A flat image cannot stagger, reveal on scroll, or
> respond to hover — if you place them, the animations below are impossible.
> Use them to check your work, not as the work.
>
> The **SVGs in `brand/logo/` are different** — place those directly. They are
> vector, and the `-animated` ones carry their own looping CSS.

---

## 1. Tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| Ink | `#000000` | Body text, headings on light |
| Coal | `#0B0D12` | Dark section grounds. Not pure black — pure black reads as a hole |
| Blue | `#1B4DFF` | Accent **on light only**: primary button, mark brackets, one metric |
| Blue lifted | `#5B82FF` | Accent **on dark only**. `#1B4DFF` on coal goes muddy |
| Paper | `#FFFFFF` | Default ground |
| Tint | `#F4F6FB` | Alternating section ground |
| Wash | `#F6F7F9` | Inset panels inside a card |
| Line | `#E6E6E6` | Hairline rules |
| Line dark | `#1C202B` | Hairlines on coal |
| Mute | `#6B6B6B` | Secondary text on light |
| Mute dark | `#9AA3B2` | Secondary text on coal |
| Bad | `#B3261E` | Failing state only |
| Warn | `#8A5300` | At-risk state only |

**Two colours, plus state.** Black and blue on white. Red and amber appear only
on a status, never as decoration. Do not introduce a third brand colour.

### Type — Archivo (Google Fonts, weights 400/500/600/700)

| Role | Size | Weight | Tracking | Line height |
|---|---|---|---|---|
| Display | 52–76px | 700 | −0.04em | 1.08–1.12 |
| Section heading | 20–26px | 600 | −0.02em | 1.25 |
| Body large | 20px | 500 | 0 | 1.6 |
| Body | 17px | 500 | 0 | 1.65 |
| Small | 15–16px | 500 | 0 | 1.5 |
| Eyebrow | 12px | 700 | +0.1em, uppercase | 1 |

Cap body text at **62 characters** per line. Nothing below 15px carries a
sentence — that was the main readability problem in the first pass.

### Spacing & shape

- Page gutter **72px**. Section padding **70px** top and bottom.
- Content max width **1600px**.
- Radii: cards **16px**, buttons **11px**, pills **999px**, badges **26%** of size.
- Hairline **1px**. Use a rule plus whitespace instead of a border wherever you can.

---

## 2. Motion

### Principles

- **One idea per section.** Something arrives, or something fills. Never both.
- **Scroll-triggered, once.** Play on enter at ~25% visible. Do not replay on
  scroll-up; re-animating on every pass is the thing that makes a site feel cheap.
- **Fast and short.** 240–420ms, ease-out. Nothing above 500ms.
- **Stagger 40–70ms.** Enough to read as a sequence, not a queue.
- **Distance is small.** 16–24px of travel. Big slides look like a template.
- **Respect `prefers-reduced-motion`** — set every one of these to no transform
  and no opacity change under that query. Framer has a toggle for this; use it.

### Per section

| Section | Motion |
|---|---|
| Nav | No entrance. Background goes from transparent to `#FFFFFF` with the bottom hairline appearing after 80px of scroll |
| Hero | Eyebrow, headline, body, buttons fade up 24px, stagger 60ms. App window enters from the right, x +40 → 0, opacity 0 → 1, scale 0.98 → 1, 420ms, starting 120ms after the headline |
| Coverage strip | Badges fade up 16px, stagger 40ms, left to right |
| Industries | Rows fade up 20px, stagger 60ms. Hairline above each row scales x 0 → 1 from the left, 300ms |
| How it works | Each row fades up on its own scroll trigger. Inside step 2, the category bars animate width 0 → full, stagger 80ms — that is the one place a longer 500ms feels right |
| Built to undercount | Table rows stagger 50ms. **The "4" counts 0 → 4** over 600ms as it enters |
| Coverage (dark) | Three columns stagger 80ms apart; rows inside each stagger 30ms |
| Social proof | Quote fades up. **The "0" counts up** — it lands harder than it reads statically |
| Pricing | Cards fade up, stagger 60ms. **Hover:** y −4px, shadow deepens, 180ms |
| FAQ | Rows fade in, stagger 40ms. If you make them expandable, animate height, not opacity |
| CTA | Fade up. Button hover: scale 1.02, 140ms |
| Footer | No entrance |

### The logo animation

`brand/logo/ledger-mark-animated.svg` (and `-inverse` for dark) already loops on
a 3s cycle: brackets close inward, then the rows grow left to right — scan, then
count. Place the SVG as-is; do not rebuild it.

Use it as the **loading state while a scan is running**. That is what it is for.

One gotcha: its CSS is namespaced under `.ledger-anim` on the root `<svg>`. If
you paste the markup inline rather than placing the file, keep that class or the
animation stops — and never strip the namespace, because the bare class names
(`.row`, `.bl`, `.br`) will collide with Framer's own styles and collapse
unrelated layers on the page.

---

## 3. Sections

Page order. Grounds alternate on purpose — twelve white sections in a row is
what made the first version read flat.

### 01 Nav — white, 104px

Lockup left (`brand/logo/ledger-lockup.svg`, 26px tall). Centre links: Industries,
How it works, Coverage, Pricing. Right: "Sign in" text, then "Start free" button
(blue, 11px radius).

### 02 Hero — white → tint gradient (165°), 820px

Left column 720px wide:
- Eyebrow, 15px, mute: `Grocery · auto parts · liquor · pharmacy · hardware`
- Display 76px: **Every permit your store has to hold, in one place.**
- Body large: `Ledger tracks the licences, filings and stocking rules a small retailer is judged on, and tells you which one is about to fail.`
- Buttons: `Start free` (blue), `See a sample scan →` (text only)
- Small, mute: `No integration. Works from a phone photo.`

Right: the app window, **bleeding off the right edge** (negative right margin
~220px). Do not centre it — the bleed is what makes it read as software rather
than a graphic.

### 03 Coverage strip — white, 290px, hairline bottom

Heading, 17px, mute: `Eighteen programmes tracked across federal, state and local authorities`

Ten badges in a row, evenly spaced. Each is a 58px tile, radius 15px, ground
`#F4F6FB`, abbreviation centred in 700 weight, with a 13px mute caption beneath:

`SNAP` Food benefits · `WIC` Vendor status · `EBT` Benefit payments ·
`EPA` Waste & refrigerant · `OSHA` Workplace safety · `ABC` Alcohol licence ·
`DOT` Hazmat shipping · `CHP` Health permit · `W&M` Scales · `TRL` Tobacco

Then, 13px mute, and this line is **not optional**:

> Program names identify what Ledger tracks. Ledger is not affiliated with,
> endorsed by, or acting on behalf of any agency or program.

**These are typographic badges, never agency seals.** Do not substitute real
logos — a federal seal on a commercial page implies an endorsement that does not
exist, and those seals carry their own restrictions. Any surface showing the
badges carries the line above.

### 04 Industries — white, 700px

Display 52px left: **Not just grocery.** Body right, max 520px: `Any small
retailer carries a stack of permits that expire on different dates and answer to
different inspectors. Ledger holds the whole stack.`

Five rows, hairline between each. Each row: name (23px, 600) in a 300px column,
description (17px mute) flexible, then small 38px badges right-aligned.

| Name | Description | Badges |
|---|---|---|
| Grocery & convenience | SNAP and WIC stocking, health permit, tobacco, scales | SNAP WIC EBT CHP TRL W&M |
| Auto parts & service | Used oil and hazardous waste, refrigerant handling, repair registration | EPA OSHA DOT BAR BTC FIRE |
| Liquor & tobacco | State licence conditions, federal permits, age-verification posting | ABC TTB TRL BTC FIRE |
| Pharmacy & health | Board of pharmacy, controlled substances, cold chain | BOP FDA CHP OSHA |
| Hardware & garden | Pesticide sales, hazardous storage, fire load, scales | EPA OSHA FIRE W&M BTC |

**A list, not cards.** Boxing these was what made the page feel generated.

### 05 How it works — tint, 1040px

Display 52px: **Set it up once. It runs itself.**

Three rows, hairline between, **alternating sides** — step 1 text left, step 2
text right, step 3 text left. Each: number in blue 700 (`01`, `02`, `03`), then
heading 26px, then body 17px.

1. **Add your permits** — `Tell Ledger what you hold. It works out which rules apply to your kind of store and when each one comes due.` Visual: three permit rows with SNAP / CHP / W&M badges.
2. **See where you stand** — `Every requirement against its threshold, re-checked after each scan. No digging through renewal letters.` Visual: the four category bars — Dairy 4 of 3, Grains 3 of 3, Protein 3 of 3, **Produce 1 of 3 in red**.
3. **Fix what blocks you** — `Ranked by what closes you down first, not by date. The top item is always the one that matters today.` Visual: three checklist rows — Add 2 produce varieties (blocks review, red), Renew health permit (overdue, red), WIC price list (9 days, amber).

### 06 Built to undercount — white, 640px

Left 520px: display 54px **Built to undercount.** Body: `Telling a store it
passes when it doesn't is the expensive mistake. A case priced by weight has no
unit count to read, so Ledger lists it with the reason instead of inventing a
number.` Then a hairline, then **4** at 56px, `lines held back on this invoice`
at 17px/600, and `Four held back beats one wrong total.` in mute.

Right: a real table. Header row in 12px uppercase mute with a **2px black bottom
border**, then four rows with hairlines:

| Line | Pack | Why it was not counted |
|---|---|---|
| ROMA TOMATOES | 25 LB CS | Priced by weight — no unit count |
| YELLOW ONIONS JUMBO | 50 LB SACK | Priced by weight — no unit count |
| SWEET CREAM BUTTER | 36 x 4 OZ | Accessory food — counts for nothing |
| PAPER TOWELS 2PLY | 30 ROLL | Not a staple category |

This is the differentiator. It is evidence, so it should look like a document,
not like marketing.

### 07 Coverage — **coal**, 920px

Display 52px white: **Eighteen programmes, three levels of government.** Body
right in mute-dark: `Each has its own renewal date, its own filing and its own
inspector. Ledger holds all of them against one calendar.`

Three columns — Federal, State, Local — with eyebrows in **lifted blue
`#5B82FF`**. Each row: a 40px dark badge, then abbreviation (15px white) over
description (13.5px mute-dark), hairline `#1C202B` between.

**Federal** — SNAP (retailer authorization) · WIC (vendor authorization) ·
EBT (benefit acceptance) · FDA (food facility registration) · EPA (used oil,
hazardous waste, refrigerant) · OSHA (hazard communication, posting) ·
DOT (hazardous materials shipping) · TTB (alcohol and tobacco permits)

**State** — ABC (alcoholic beverage control) · W&M (weights and measures) ·
BAR (automotive repair registration) · TRL (tobacco retail licence) ·
RSP (seller's permit, resale) · BOP (board of pharmacy)

**Local** — CHP (county health permit) · FIRE (fire marshal inspection) ·
BTC (business tax certificate) · CoO (certificate of occupancy)

Non-affiliation line again at the bottom, above a `#1C202B` rule.

### 08 Social proof — tint, 560px

Quote at 36px/600, −0.03em, line-height 1.36:

> "We lost SNAP authorization once over two produce varieties nobody noticed were
> gone. It took four months to get back. Now I photograph the invoice at the back
> door and I know before the truck leaves."

Attribution: 48px circle with `RM`, then **Rosa Medina** (17px/600) over
`Owner, Corner Market. Four stores in Los Angeles.` (16px mute).

Right, behind a vertical hairline: **0** at 76px, then `line items counted that
Ledger wasn't certain about` (18px/600), a rule, then `Average scan` / **20s**.

*Placeholder — replace with a real customer before launch.*

### 09 Pricing — white, 830px

Display 52px: **Priced per store, not per scan.** Body right: `Scan as often as
you take deliveries. Cancel any time.`

Three cards — **the one place a border is right**, because three discrete things
are being compared. Middle card has a 2px blue border and a "Most stores" pill.

| | Single store | Group | Chain |
|---|---|---|---|
| Price | **$29** /month | **$24** /store/month | **Talk to us** |
| For | One location, one owner. | Two to ten locations. | Eleven locations or more. |
| Features | Unlimited invoice scans · All 18 programmes tracked · Renewal reminders · 7 years of scan history | Everything in Single store · One view across every store · Per-store scorecards · Staff card tracking · CSV export | Everything in Group · Bulk onboarding · Priority support · Custom thresholds |

Note "Talk to us" is set at **30px, not 48px** — a text price at the numeric
display size wrecks the row.

*Prices are placeholder.*

### 10 FAQ — white, 720px

Display 52px: **Questions we get asked.** Five rows, hairline above each, two
columns: question (20px/600) in a 340px column, answer (17px mute, 1.6) right.

1. **I don't sell food. Is this for me?** — Yes. Auto parts, liquor, pharmacy and hardware stores all carry permit stacks with different renewal dates and different inspectors. The invoice scan is the food-specific part; the permit tracking is not.
2. **Are you affiliated with SNAP or the EPA?** — No. Ledger tracks published programme requirements so you can see where you stand. It is not affiliated with, endorsed by, or acting for any agency, and no authorization decision is ever ours.
3. **What if the photo is blurry?** — Ledger transcribes only what it can actually read. Anything ambiguous is listed as held back with a reason, and never counted. A blurry photo gives you a shorter count, not a wrong one.
4. **Does a case count as one unit?** — No. A case becomes the number of sellable units inside it. A 24-pack is 24. If an item is priced by weight there is no unit count to read, so it is held back for you to confirm.
5. **Do I need to integrate my POS?** — No. Ledger works from a photograph of the paper invoice and the permit details you enter once. Nothing to install at the register.

Keep answer 2. A tool that tells stores whether they would pass a federal review
should not imply it speaks for the agency.

### 11 CTA — **coal**, 460px

Lockup inverse (`ledger-lockup-inverse.svg`, 30px). Display 52px white: **Find
out which permit is about to fail.** Right: white button `Start free`, and
`First store free. No card.` in mute-dark beneath.

### 12 Footer — white, 440px, hairline top

`ledger-lockup-stacked.svg` left with `Permit and stocking compliance for
independent retailers.` Then three link columns — Product, Industries, Company.
Non-affiliation line above the bottom rule, then `© 2026 Ledger` and
`Los Angeles, CA`.

---

## 4. Assets

**Place these directly** — vector, they scale and animate:

```
brand/logo/ledger-lockup.svg              nav, general use
brand/logo/ledger-lockup-inverse.svg      on coal
brand/logo/ledger-lockup-stacked.svg      footer
brand/logo/ledger-mark.svg                icon only
brand/logo/ledger-mark-animated.svg       loading / scanning state
brand/logo/ledger-mark-animated-inverse.svg   same, on coal
brand/logo/favicon.svg + brand/icons/favicon.ico
brand/icons/apple-touch-icon-180.png
brand/social/og-image-1200x630.png        Site Settings → Social image
```

**Reference only, do not place:** everything in `brand/site/sections/` — those
are pictures of the sections you are building. `brand/site/features/` holds
thirteen product screens; those you *can* place as images, since they are
screenshots of an app rather than page layout.

## 5. Rules that survive any redesign

1. Two colours: black and blue on white, or the inverse files on coal. No third colour.
2. Blue is for the brackets of the mark, the primary button, and one metric. Not every pill.
3. On dark, blue is `#5B82FF`. Never `#1B4DFF`.
4. Programme names are typographic. No agency seals, ever, and the non-affiliation line travels with them.
5. Body text never below 15px. Measure capped near 62 characters.
6. Prices and the testimonial are placeholder. Replace before launch.
