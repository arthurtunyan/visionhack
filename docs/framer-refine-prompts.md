# Refining what Framer's agent built

Four prompts. Use **1** after each section, **2** when something specific is off,
**3** once everything is built, and **4** when you want me to review it.

---

## 1. The audit pass

Run this after the agent finishes a section. It asks it to grade its own work
against the spec, which catches more than "make it better" ever does.

```
Before we move on, audit what you just built against the spec, honestly.

Go through these and tell me PASS or FAIL for each, with the actual value you
used where it's a number:

1. Is every element a real layer? Any placed images of the section? (Should be
   none — only the logo SVGs and product screenshots get placed.)
2. Body text size and line height. Anything under 15px?
3. Line length of the longest paragraph, in characters. Over 70?
4. Count the bordered boxes. Could any be a hairline rule and whitespace instead?
5. Every hex code you used. Any outside: #000000, #0B0D12, #1B4DFF, #5B82FF,
   #FFFFFF, #F4F6FB, #F6F7F9, #E6E6E6, #1C202B, #6B6B6B, #9AA3B2, #B3261E,
   #8A5300?
6. On a dark ground, did any blue come out as #1B4DFF instead of #5B82FF?
7. Is the copy word-for-word from the spec, or did you rewrite any of it?
8. Does the section ground match what the spec says (white / tint / coal)?

List every FAIL with what you'd change. Don't fix anything yet — show me first.
```

---

## 2. Targeted fixes

Paste the one that matches what's wrong.

**Everything looks like boxes**

```
This is too boxy. Remove the borders and use 1px hairline rules (#E6E6E6) with
more whitespace between blocks instead. Keep borders only where two or more
things are genuinely being compared side by side. Increase vertical space
between groups rather than drawing a line around each one.
```

**It's hard to read**

```
Readability pass. Body text to 17px at 1.65 line height, secondary text no
smaller than 15px. Cap paragraph width at about 62 characters — add a max width
rather than letting text run the full column. Increase the size gap between
headings and body so the hierarchy is obvious at a glance.
```

**It feels flat / everything blends**

```
Every section is reading the same, so nothing stands out. Vary the shape: no two
consecutive sections should use the same layout. Alternate the grounds between
white, #F4F6FB and #0B0D12 per the spec. Where a section is a grid of equal
cards, make one item wider or taller than the others instead.
```

**The type is weak**

```
The type isn't doing enough work. Display headings to 52-76px with -0.04em
tracking and 1.1 line height. Keep the weight at 700 for display and 600 for
section headings, nothing in between. Body stays 500. Don't use more than three
weights on a page.
```

**The product screenshot looks like a graphic, not software**

```
The app mockup needs to read as real software. Give it a browser or window
frame, a subtle shadow, and let it bleed off the right edge of the viewport
rather than sitting centred with margin on both sides. Scale it up so detail is
visible.
```

**The animation is too much**

```
Dial the motion back. Every entrance: 240-420ms, ease-out, no more than 24px of
travel, stagger 40-70ms. Play once when the section enters at about 25% visible
and never replay on scroll-up. Remove any animation that loops continuously
except the Ledger mark. Add a prefers-reduced-motion variant that disables all
of it.
```

**It swapped in real agency logos**

```
Remove those immediately and put back the typographic badges from the spec —
the abbreviation set in Archivo 700 on a rounded tile. Do not use real agency
logos or seals anywhere on this site. Also confirm the non-affiliation line
appears on every section that shows the badges.
```

---

## 3. Final polish

Once all twelve sections exist:

```
Full-site pass now that everything's built.

Consistency:
- Same section padding everywhere (70px vertical, 72px gutters)
- Same button styles throughout — one primary, one secondary, no variants
- Same radius family: 16px cards, 11px buttons, 999px pills
- Check every ground alternates correctly against the spec

Motion, in one pass so the timing matches:
- Apply the per-section motion from the spec
- Verify nothing replays on scroll-up
- Add the reduced-motion variant

Responsive:
- Build tablet and mobile breakpoints
- Display type scales down, body text does NOT go below 16px on mobile
- The hero's app window can crop on mobile, but the headline must never wrap
  awkwardly mid-phrase
- Multi-column sections stack in reading order

Then tell me anything you had to change or compromise, and why.
```

---

## 4. So I can review it

Framer's site is not reachable from my environment, so I can't open it. This
prompt makes the agent describe the build precisely enough that I can review it
from the description. Paste the answer back to me.

```
Write me a structured report of what you've built. Be precise and don't
summarise — I'm sending this to someone for review.

For each section, in page order:
- Section name, ground colour, total height
- Every text layer: its content, font size, weight, colour
- Every non-text element: type, size, colour, radius
- The layout method (stack/grid, direction, gap, alignment)
- What animates, with duration, easing, delay and stagger

Then, for the whole site:
- Every colour used, as hex, with where each appears
- Every font size used, with where each appears
- Anything you placed as an image rather than building natively, and why
- Anything in the spec you didn't implement, and why
- Anything you added that wasn't in the spec
```

Send me that and I'll tell you exactly what to fix.
