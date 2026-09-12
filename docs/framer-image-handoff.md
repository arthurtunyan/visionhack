# Ledger site — image placement handoff

**For: Michael**
**Site:** https://dark-role-914680.framer.app/
**Files:** `brand/site/` in this repo — all 13 are committed.

Every image is **already cropped to its slot's aspect ratio**. Don't re-crop
anything — if a slot looks wrong after dropping, the fix is the layer's fit
setting, not the file.

> **These are designed mockups, not screenshots of a running app.** The repo
> ships an API only — there is no live UI to capture — so the dashboard and step
> images are built from the Ledger brand system to show what the product does.
> They're honest about the product's behaviour, but don't describe them to anyone
> as captures of real software.
>
> Regenerate any of them with:
> ```bash
> python3 brand/tools/build-site-images.py        # all
> python3 brand/tools/build-site-images.py 01 05  # just these
> ```
> The PNGs are derived — edit the templates in that script, never the images.

---

## How to place one image

1. Open the site in Framer.
2. In the **Layers** panel (left), find the layer named in bold in the tables below.
   Use the panel's search box — the names are exact.
3. Select that layer.
4. In the **Properties** panel (right), find **Fill**.
5. Drag the file onto the Fill swatch, or click the swatch → **Image** → upload.
6. Set fit to **Fill** (cover). Since each file already matches the slot's aspect
   ratio, Fill will not crop anything.
7. Repeat. **Publish** when all 12 are done.

The last two (#9, #12) are **not layers** — they live in Site Settings. See the
bottom section.

---

## 1. Hero

| # | File | Layer to select | Size | Aspect |
|---|---|---|---|---|
| 1 | `01-hero-dashboard.png` | **HeroSection → Image** (the 760px-tall one) | 1400×992 | 1.41 |

The big image under the headline. If there's more than one Image inside
HeroSection, it's the 760px-tall one.

## 2. How it works — the three steps

| # | File | Layer to select | Size | Aspect |
|---|---|---|---|---|
| 2 | `02-step1-setup.png` | **First Work → Image** | 900×907 | 0.99 |
| 3 | `03-step2-dashboard.png` | **Second Work → Image** | 900×907 | 0.99 |
| 4 | `04-step3-requirements.png` | **Third Work → Image** | 900×907 | 0.99 |

Step 1 is "Enter your licenses", step 2 "See where you stand", step 3 "Fix it
before inspection". These three are near-square and all the same size — easy to
mix up, so place them in order and check the captions as you go.

## 3. Why Ledger — the six cards

Cards are in document order: first through sixth. **Note #10 comes before #11**
in card order (the numbering in the original list isn't sequential).

| # | File | Card | Layer to select | Aspect |
|---|---|---|---|---|
| 5 | `05-card-snap.png` | SNAP Authorization | **First card → Image** (the wide one) | 1.94 |
| 6 | `06-card-wic.png` | WIC Vendor Status | **Second card → Image** | 1.28 |
| 7 | `07-card-health.png` | County Health Permit | **Third card → Image** | 1.28 |
| 8 | `08-card-foodhandler.png` | Food Handler Cards | **Fourth card → Image** | 1.77 |
| 10 | `10-card-tobacco.png` | Tobacco and ABC | **Fifth card → Image** | 1.83 |
| 11 | `11-card-scales.png` | Scales and Business Tax | **Sixth card → Image** | 1.28 |

The aspect ratios differ per card (1.94 / 1.28 / 1.28 / 1.77 / 1.83 / 1.28), so
these are **not** interchangeable. If one looks stretched, you've got the wrong
file in the slot.

## 4. Site Settings — not layers

| # | File | Where | Size |
|---|---|---|---|
| 9 | `09-og-image.png` | Site Settings → General → **Social image** | 1200×630 |
| 12 | `12-favicon-512.png` *or* `12-favicon-512-mark.png` | Site Settings → General → **Favicon** | 512×512 |

**Two favicons ship — pick one.** See the note below; the short version is that
`-mark` is the one that's legible in a browser tab.

For these: **Site Settings** (gear icon) → **General**, then the Social image and
Favicon fields. They do not appear in the Layers panel.

---

## Checklist

- [ ] 1 — hero
- [ ] 2 — step 1
- [ ] 3 — step 2
- [ ] 4 — step 3
- [ ] 5 — SNAP card
- [ ] 6 — WIC card
- [ ] 7 — County Health card
- [ ] 8 — Food Handler card
- [ ] 10 — Tobacco / ABC card
- [ ] 11 — Scales / Business Tax card
- [ ] 9 — social image (Site Settings)
- [ ] 12 — favicon (Site Settings)
- [ ] Publish
- [ ] Hard-refresh the live URL and check every slot
- [ ] Check the favicon in a browser tab (it caches aggressively — try a private window)
- [ ] Paste the live URL into Slack/iMessage to confirm the social card renders

---

## Two things to settle before doing #9 and #12

These are genuine conflicts with the brand kit already merged to `main`, not
nitpicks. Worth a 30-second decision rather than silently overwriting.

**#12 favicon — recommend the `-mark` version.** The spec asked for *"a black
rounded square with a white 'l'"*. Both were built, and both were checked at
actual favicon size:

- `12-favicon-512.png` (as specified) — Archivo's lowercase *l* is an
  undecorated stem, so at 16px it renders as a plain vertical bar,
  indistinguishable from a text cursor. It carries no brand information.
- `12-favicon-512-mark.png` — the Ledger bracket mark using the brand kit's
  **two-row small cut**, which exists precisely because three rows mush together
  below 32px. Legible at 32px, still a distinct shape at 16px, and consistent
  with `brand/logo/favicon.svg` and `brand/icons/favicon.ico`.

Either works mechanically. The `-mark` one is the one people will actually
recognise in a tab.

**#9 social image.** The brand kit already ships
`brand/social/og-image-1200x630.png` — same purpose, same dimensions. Pick one.
`09-og-image.png` is presumably the real product screenshot, which is usually the
better link preview; the brand-kit one is the logo card. Just don't assume the
other doesn't exist.

---

## Beyond the 12 slots

`brand/site/features/` and `brand/site/sections/` hold mocks of every feature and
every part of the page, for when the site grows past its current slots. They all
show **the same store on the same day** — Corner Market #17, passing dairy,
grains and protein but short on produce because two produce lines were priced by
weight and Ledger refused to guess a unit count. Mixing in a mock from a
different scenario will contradict the others, so keep the story straight.

**Features** (1200x800, mobile 640x1000)

| File | Shows |
|---|---|
| `f01-scan-capture.png` | Upload / photograph an invoice |
| `f02-scan-result.png` | Counted line items with category and units |
| `f03-not-counted.png` | Held-back lines and why — the safety argument |
| `f04-staple-categories.png` | Four categories against the 3-variety rule |
| `f05-scorecard.png` | Pass / fail per category |
| `f06-fix-list.png` | Ranked list of what blocks you |
| `f07-alerts.png` | Alert feed |
| `f08-scan-history.png` | Audit trail of past scans |
| `f09-staff-cards.png` | Food handler card tracking |
| `f10-multi-store.png` | Group view across locations |
| `f11-mobile-scan.png` | Phone result screen |
| `f12-licenses.png` | All tracked licences |

**Page sections** (1600 wide)

| File | Section |
|---|---|
| `s01-nav.png` | Header / nav |
| `s02-hero.png` | Hero |
| `s03-how-it-works.png` | Three steps |
| `s04-features.png` | Why Ledger — six features |
| `s05-social-proof.png` | Quote + stats |
| `s06-pricing.png` | Three plans |
| `s07-faq.png` | Five questions |
| `s08-cta.png` | Closing CTA (black band) |
| `s09-footer.png` | Footer |

Rebuild any of them:

```bash
python3 brand/tools/build-mocks.py              # everything
python3 brand/tools/build-mocks.py features     # or: sections
python3 brand/tools/build-mocks.py f03 s06      # individual ids
```

Copy in these sections is written to be defensible: the FAQ and footer both say
Ledger is not official USDA guidance and that authorization decisions rest with
the agency. Keep that if you reword anything.

## If you're pointing Claude at this

The brand kit is self-describing: start from `brand/README.md` and
`brand/brand.json`. They map every logo/icon/social file to its use and carry the
rules (two colours — black `#000000` and blue `#1B4DFF`; blue is for the brackets
only; never introduce a third colour).

Placing these 12 images is manual work in the Framer editor — there's no API for
it, so it can't be scripted.
