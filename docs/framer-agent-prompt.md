# Driving Framer's AI agent

Two things to give it: **the prompt below**, and **the files listed under it**.

Do it **one section at a time**. Pasting all twelve at once gets you a rushed
version of all twelve. Build the hero, get it right, then move on — the spec is
written so each section stands alone.

---

## The prompt

Paste this first, with `docs/framer-build-spec.md` attached:

```
You're building the marketing site for Ledger, a compliance tool for
independent retailers. I'm attaching a full build spec — tokens, every
section's layout, exact copy, and the motion for each one. Follow it closely;
the copy is final and the numbers in it are deliberate.

Build everything NATIVELY — real text layers, real shapes, real components.
Do not place images of the sections. I'm giving you PNG references so you can
check your work, but if you place them as images the animations become
impossible, and animation is the whole reason I'm building this in Framer.

Non-negotiables:
- Two colours: black #000000 and blue #1B4DFF on white. On dark grounds blue
  becomes #5B82FF — the darker blue goes muddy on near-black. No third colour.
- Type is Archivo (400/500/600/700). Body text never below 15px, line length
  capped around 62 characters. This site was previously unreadable because the
  body copy was too small.
- The SNAP / WIC / EPA / OSHA badges are TYPOGRAPHIC — letters on a tile. Never
  substitute real agency logos or seals. Wherever they appear, the
  non-affiliation line in the spec appears with them. This is a legal
  requirement, not a style choice.
- Section grounds alternate white, tint #F4F6FB, and coal #0B0D12. Do not make
  everything white — that's what I'm fixing.

Motion rules: scroll-triggered, play once on enter, 240–420ms ease-out,
stagger 40–70ms, travel no more than 16–24px. Honour prefers-reduced-motion.
The spec lists the specific motion per section.

Start with section 02, the hero. Show me that before moving on.
```

Then for each following section:

```
Now build section [N] from the spec. Same rules. Match the reference PNG for
layout, but build it natively.
```

---

## Files to attach

**Always attach:**

| File | Why |
|---|---|
| `docs/framer-build-spec.md` | The spec. Everything is in here |

**Attach per section** — the matching reference from `brand/site/sections/`:

`s01-nav.png` · `s02-hero.png` · `s03-coverage-strip.png` · `s04-industries.png` ·
`s05-how-it-works.png` · `s06-features.png` · `s07-coverage.png` ·
`s08-social-proof.png` · `s09-pricing.png` · `s10-faq.png` · `s11-cta.png` ·
`s12-footer.png`

**Upload as real assets** (these get placed, not rebuilt):

```
brand/logo/ledger-lockup.svg
brand/logo/ledger-lockup-inverse.svg
brand/logo/ledger-lockup-stacked.svg
brand/logo/ledger-mark.svg
brand/logo/ledger-mark-animated.svg
brand/logo/ledger-mark-animated-inverse.svg
brand/logo/favicon.svg
brand/icons/favicon.ico
brand/icons/apple-touch-icon-180.png
brand/social/og-image-1200x630.png
```

---

## Order to build in

1. **Set up tokens first.** Colour styles and text styles from section 1 of the
   spec, before any section. Framer will reuse them and you avoid re-typing hex
   codes twelve times.
2. **02 Hero** — the hardest and the one that sets the tone. The app window
   bleeding off the right edge is the detail that makes it read as software.
3. **01 Nav**, **12 Footer** — quick, and they frame everything else.
4. **07 Coverage (dark)** — the second-hardest, and it proves the dark ground works.
5. Everything else in page order.
6. **Motion last.** Get all twelve static and correct, then add the animation in
   one pass. Adding motion per section as you go makes the timing inconsistent.

---

## If the agent drifts

Common ones, with the correction:

| It does this | Say this |
|---|---|
| Places the reference PNG as an image | "Rebuild this natively as text and shapes. The PNG is reference only." |
| Wraps everything in bordered cards | "Use hairline rules and whitespace instead of borders. Cards only in pricing." |
| Shrinks body text to 13–14px | "Body text is 17px minimum, 1.6 line height." |
| Uses `#1B4DFF` on the dark sections | "On coal, blue is `#5B82FF`." |
| Swaps in real agency logos | "Badges stay typographic. Never use agency seals." |
| Makes every section white | "Grounds alternate — check the spec for which ground each section uses." |
| Animates on every scroll pass | "Play once on enter, don't replay on scroll-up." |
