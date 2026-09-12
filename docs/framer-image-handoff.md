# Ledger site — legacy image placement handoff

> [!WARNING]
> **Do not execute this handoff for the current demo.** Images 1–8, 10 and 11
> depict license management, saved dashboards and other capabilities the API
> does not provide. They are retained only as roadmap references. Use
> [the current Framer copy handoff](framer-copy-handoff.md) instead.

**For: Michael**
**Site:** https://dark-role-914680.framer.app/
**Source of files:** Adrian (rendered from the live app)

**Status:** Superseded for the current product. If these concepts are used in a
future pitch, label them visibly as **Roadmap** and keep them outside the live
demo flow.

For the current site's social image and favicon, use
`brand/social/og-image-1200x630.png` and `brand/icons/favicon.ico` (or
`brand/logo/favicon.svg`). The instructions below are an archive, not a
publish checklist.

---

## Archived placement instructions — roadmap reference only

Do not follow these steps on the current-product page. They are preserved so a
future, clearly labeled roadmap section can trace the original asset slots.

1. Open the site in Framer.
2. In the **Layers** panel (left), find the layer named in bold in the tables below.
   Use the panel's search box — the names are exact.
3. Select that layer.
4. In the **Properties** panel (right), find **Fill**.
5. Drag the file onto the Fill swatch, or click the swatch → **Image** → upload.
6. Set fit to **Fill** (cover). Since each file already matches the slot's aspect
   ratio, Fill will not crop anything.
7. For a future roadmap section only, repeat and preview the result. Do not
   publish until every concept is visibly labeled **Roadmap**.

The last two (#9, #12) are **not layers** — they live in Site Settings. See the
bottom section.

---

## 1. Hero — roadmap only

| # | File | Layer to select | Size | Aspect |
|---|---|---|---|---|
| 1 | `01-hero-dashboard.png` | **HeroSection → Image** (the 760px-tall one) | 1400×992 | 1.41 |

The big image under the headline. If there's more than one Image inside
HeroSection, it's the 760px-tall one.

## 2. How it works — roadmap only

| # | File | Layer to select | Size | Aspect |
|---|---|---|---|---|
| 2 | `02-step1-setup.png` | **First Work → Image** | 900×907 | 0.99 |
| 3 | `03-step2-dashboard.png` | **Second Work → Image** | 900×907 | 0.99 |
| 4 | `04-step3-requirements.png` | **Third Work → Image** | 900×907 | 0.99 |

The legacy captions are "Enter your licenses", "See where you stand", and "Fix
it before inspection". None describes the current stateless invoice scan, so do
not use these images in the live workflow. The replacement steps are in
[framer-copy-handoff.md](framer-copy-handoff.md).

## 3. Why Ledger — roadmap only

Cards are in document order: first through sixth. **Note #10 comes before #11**
in card order (the numbering in the original list isn't sequential).

These six cards describe unsupported license domains. Do not publish them as
current capabilities; the replacement six-card set is in
[framer-copy-handoff.md](framer-copy-handoff.md).

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

## 4. Site Settings — use the merged brand assets instead

| # | File | Where | Size |
|---|---|---|---|
| 9 | `09-og-image.png` | Site Settings → General → **Social image** | 1200×630 |
| 12 | `12-favicon-512.png` | Site Settings → General → **Favicon** | 512×512 |

Do not upload #9 or #12 without inspecting them. Prefer the merged brand assets
named at the top of this document so the social card does not imply a saved
dashboard and the favicon stays consistent with the brand kit.

---

## Archived checklist — do not execute for the current demo

- [ ] Confirm this entire image set is being used only in a visibly labeled
  roadmap section; otherwise stop and use the current copy handoff.

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
- [ ] Future-only: publish after every unsupported concept is labeled Roadmap
- [ ] Hard-refresh the live URL and check every slot
- [ ] Check the favicon in a browser tab (it caches aggressively — try a private window)
- [ ] Paste the live URL into Slack/iMessage to confirm the social card renders

---

## Why #9 and #12 were already in conflict

These are genuine conflicts with the brand kit already merged to `main`, not
nitpicks. Worth a 30-second decision rather than silently overwriting.

**#12 favicon.** The spec for this file describes *"a black rounded square with a
white 'l'"*. That is **not** the Ledger mark. The merged brand kit's favicon is
the bracket mark — blue brackets `#1B4DFF` closing on rows — at
`brand/logo/favicon.svg` and `brand/icons/favicon.ico`, with a two-row cut
specifically so it survives 16px.

For the current site, use `brand/icons/favicon.ico` or
`brand/logo/favicon.svg`. Keep `12-favicon-512.png` only as a legacy asset; it
would make the site's favicon disagree with the brand kit.

**#9 social image.** The brand kit already ships
`brand/social/og-image-1200x630.png` — same purpose, same dimensions. Use the
brand-kit image for the current site. Keep `09-og-image.png` on hold until its
product screenshot has been checked against the current capability boundary.

---

## If you're pointing Claude at this

The brand kit is self-describing: start from `brand/README.md` and
`brand/brand.json`. They map every logo/icon/social file to its use and carry the
rules (two colours — black `#000000` and blue `#1B4DFF`; blue is for the brackets
only; never introduce a third colour).

Placing these 12 images is manual work in the Framer editor — there's no API for
it, so it can't be scripted.
