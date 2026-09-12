# Ledger site — image placement handoff

**For: Michael**
**Site:** https://dark-role-914680.framer.app/
**Source of files:** Adrian (rendered from the live app)

Every image is **already cropped to its slot's aspect ratio**. Don't re-crop
anything — if a slot looks wrong after dropping, the fix is the layer's fit
setting, not the file.

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
| 12 | `12-favicon-512.png` | Site Settings → General → **Favicon** | 512×512 |

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

**#12 favicon.** The spec for this file describes *"a black rounded square with a
white 'l'"*. That is **not** the Ledger mark. The merged brand kit's favicon is
the bracket mark — blue brackets `#1B4DFF` closing on rows — at
`brand/logo/favicon.svg` and `brand/icons/favicon.ico`, with a two-row cut
specifically so it survives 16px.

Two different favicons will ship if nobody decides. Either:
- use `brand/icons/favicon.ico` / `brand/logo/favicon.svg` (keeps the site
  consistent with the brand kit), or
- use `12-favicon-512.png` and accept that the site's favicon and the brand kit
  disagree.

**#9 social image.** The brand kit already ships
`brand/social/og-image-1200x630.png` — same purpose, same dimensions. Pick one.
`09-og-image.png` is presumably the real product screenshot, which is usually the
better link preview; the brand-kit one is the logo card. Just don't assume the
other doesn't exist.

---

## If you're pointing Claude at this

The brand kit is self-describing: start from `brand/README.md` and
`brand/brand.json`. They map every logo/icon/social file to its use and carry the
rules (two colours — black `#000000` and blue `#1B4DFF`; blue is for the brackets
only; never introduce a third colour).

Placing these 12 images is manual work in the Framer editor — there's no API for
it, so it can't be scripted.
