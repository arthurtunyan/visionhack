# Framer copy handoff — current demo

**For:** Michael / Role A

**Site:** https://dark-role-914680.framer.app/

**Status:** Copy-paste replacement for the current product

**Regulatory basis:** [docs/regulatory-basis.md](regulatory-basis.md)

Use this copy for the demo site. It describes what `/api/scan` does today:
one image in, one stateless stocking-readiness scorecard out. Do not present
license management, saved dashboards, reminders, audio, or official eligibility
decisions as live features.

## Hero

**Eyebrow**

> SNAP STOCKING READINESS

**Headline**

> Check your SNAP stocking readiness from an invoice.

**Body**

> Upload an invoice or shelf photo. Ledger estimates how the items it can read
> compare with the four Criterion A stocking categories, then shows what to
> stock next.

**Primary button**

> Scan an invoice

**Secondary button**

> See how it works

## How it works

### 1 — Photograph an invoice

> Upload an invoice or shelf photo and, if you want, add the store name. No
> account or store code is required.

### 2 — Review a four-category estimate

> Ledger groups readable items into dairy, grains, protein, and fruits and
> vegetables, then compares their varieties and stocking units with the
> Criterion A thresholds.

### 3 — See what to stock next

> If the submitted image looks short, Ledger suggests a focused list of items
> that could improve the stocking estimate.

## Six feature cards

Replace the six license cards with these current capabilities, in this order.

### Invoice scan

> Read food lines from one invoice or shelf image.

### Four-category estimate

> See dairy, grains, protein, and fruits and vegetables together.

### Stocking-unit check

> Compare readable varieties and units with the 7 × 4 × 3 thresholds.

### Perishable coverage

> See how many categories include a variety classified as perishable.

### What to stock next

> Get a short, practical list for the categories that appear short.

### English and Spanish

> Switch scorecard labels and recommendations without scanning again.

## Result states

**Positive result**

> Estimated to meet the SNAP stocking standard

**Needs-attention result**

> May not meet the stocking standard yet

**Fix-list heading**

> What to stock next

**Required disclosure — keep visible beside every result**

> Readiness estimate only. Ledger checks items it can read in this image against
> the Criterion A stocking thresholds. It is not an official USDA eligibility
> determination.

Use the matching Spanish strings in
[docs/spanish-strings.md](spanish-strings.md). Do not reduce the disclosure to a
tooltip or hide it behind a link.

## Regulatory section

**Heading**

> The updated Criterion A stocking standard

**Body**

> Beginning November 4, 2026, the updated standard requires 7 varieties in each
> of 4 staple-food categories, at least 3 stocking units of each variety, at
> least 84 units total, and a perishable variety in 3 of the 4 categories.

**Consequence note**

> If USDA determines that a store does not meet the new requirements, USDA says
> it will deny the application or withdraw the authorized store. The store may
> reapply six months after the denial or withdrawal. Ledger does not make that
> determination.

Link “updated standard” to:
https://www.fna.usda.gov/snap/retailer/stocking-standards-rule

## FAQ replacements

### What does Ledger check?

> Ledger estimates Criterion A stocking readiness from the food items it can
> read in one invoice or shelf image. It compares four categories, varieties,
> stocking units, and perishable coverage.

### Is the result an official SNAP decision?

> No. Ledger provides a readiness estimate, not legal advice or an official
> USDA eligibility determination. USDA decides retailer eligibility.

### Does one invoice prove that my store qualifies?

> No. One image may not show everything a store continuously offers, and Ledger
> does not assess Criterion B sales, specialty-store treatment, or every other
> eligibility requirement.

### What changes on November 4, 2026?

> USDA says the updated stocking standard begins then for SNAP-authorized
> retailers other than specialty food stores. See the linked USDA rule for the
> complete requirements.

### Does Ledger track licenses and renewals?

> Not in the current demo. Today's product focuses on invoice-based SNAP
> stocking readiness. License tracking is a roadmap concept.

### Does Ledger save my store or scan history?

> No. The current scan is stateless and does not provide accounts, saved stores,
> renewal reminders, or scan history.

## Demo framing

Say this when moving from the product demo to the broader vision:

> Today, Ledger turns an invoice image into a SNAP stocking-readiness estimate
> and a short list of what to stock next. Longer term, the same workspace could
> bring license and renewal tasks together. Those management features are the
> roadmap, not part of today's scan.

Do not say the current result is an inspection result, a certification, or a
guarantee that the store will keep SNAP authorization. Do not promise that the
result is read aloud unless Role A has separately built and tested audio.

## Pre-publish release gate

- [ ] The published Framer site—not only the editor preview—successfully posts
  a real image to the deployed `/api/scan` URL and renders `scorecard` or
  `scorecardEs` end-to-end.
- [ ] Loading, safe error copy, image-size handling, and the language toggle are
  tested on the published origin.
- [ ] The unsupported license/dashboard screenshots listed in the legacy image
  handoff are absent from the current-product flow.
- [ ] The result disclosure is visible in English and Spanish.
- [ ] The team accepts that `/api/scan` has no authentication or rate limiting.
  Keep the deployment URL narrowly shared for the hackathon, monitor
  provider usage, and add access controls before any broad public launch.
- [ ] Michael/A has completed any Vercel environment and deployment work; this
  documentation PR does not change Vercel state.
