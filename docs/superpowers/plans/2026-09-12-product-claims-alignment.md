# Product Claims Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unsupported and overly certain product claims with sourced, capability-accurate bilingual copy and an exact Framer handoff.

**Architecture:** Keep runtime behavior untouched. Put the regulatory interpretation in one durable document, point the rule-engine constants to it, make `docs/spanish-strings.md` the canonical bilingual UI table, and give the Framer owner a separate copy-paste implementation guide. Mark the prior image handoff as legacy so roadmap screenshots cannot be mistaken for current functionality.

**Tech Stack:** Markdown documentation, TypeScript source comments, Next.js repository checks

**Spec:** `docs/superpowers/specs/2026-09-12-product-claims-alignment-design.md`

## Global Constraints

- Do not change scoring constants, the `/api/scan` contract, model configuration, Vercel settings, or runtime behavior.
- Preserve the verified 7 × 4 × 3 = 84 stocking threshold, perishables in 3 of 4 categories, and November 4, 2026 implementation date.
- Describe Ledger output as a readiness estimate, never an official USDA determination.
- Attribute denial, withdrawal, and the six-month reapplication period to USDA decisions.
- Label unsupported license management, persistence, reminders, and dashboards as roadmap-only.
- Do not commit credentials, `.env.local`, generated assets, or the main checkout's unrelated local edits.

---

### Task 1: Establish the sourced regulatory and capability boundary

**Files:**
- Create: `docs/regulatory-basis.md`
- Modify: `docs/spanish-strings.md`
- Modify: `lib/rule-engine.ts`

**Interfaces:**
- Consumes: Current `ScanResult` thresholds and the official USDA sources listed in the spec.
- Produces: Canonical regulatory caveats and bilingual current-product labels for the Framer handoff.

- [x] **Step 1: Add the regulatory-basis document**

Document the verified thresholds and date, explain the six-month consequence in
the context of an official USDA denial or withdrawal, and enumerate what the
invoice scan cannot determine.

- [x] **Step 2: Correct the bilingual screen table**

Remove the unsupported Store code field. Replace categorical pass/fail and
inspection language with readiness-estimate language, add a disclaimer row, and
link the table to the regulatory basis.

- [x] **Step 3: Link the scorecard constants to their basis**

Add a documentation pointer above the existing threshold constants. Do not
change constant values or executable code.

- [x] **Step 4: Verify the current-copy document**

Run:

```bash
rg -n "Passes the USDA stocking rule|Not passing today|Fix it before inspection|Store code" docs/spanish-strings.md
```

Expected: no matches.

### Task 2: Give the Framer owner an honest, exact replacement

**Files:**
- Create: `docs/framer-copy-handoff.md`
- Modify: `docs/framer-image-handoff.md`

**Interfaces:**
- Consumes: The capability and regulatory boundary from Task 1.
- Produces: Copy-paste English site text, matching Spanish result labels, roadmap framing, and pre-publish risk checks for Michael/A.

- [x] **Step 1: Write the Framer copy handoff**

Provide exact replacement copy for the hero, three workflow steps, six feature
cards, result disclaimer, FAQ, and demo framing. Include the public API exposure
and unverified end-to-end path as explicit pre-publish risks.

- [x] **Step 2: Mark unsupported image concepts as legacy**

Put a prominent hold notice at the top of the prior image handoff. Mark the
license and dashboard images as roadmap-only, direct the owner to the new copy
handoff, and recommend the existing brand social image and favicon.

- [x] **Step 3: Verify exact handoff coverage**

Run:

```bash
rg -n "Invoice scan|Four-category estimate|Stocking-unit check|Perishable coverage|What to stock next|English and Spanish|Readiness estimate|rate limit|end-to-end" docs/framer-copy-handoff.md
```

Expected: matches for all current capabilities, disclaimer language, and both
pre-publish risks.

### Task 3: Verify and publish the branch

**Files:**
- Verify: all files changed by Tasks 1 and 2

**Interfaces:**
- Consumes: Completed documentation diff.
- Produces: A reviewed Git commit and GitHub pull request against `main`.

- [x] **Step 1: Run full repository checks**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: every command exits 0.

- [x] **Step 2: Review scope and secrets**

Run:

```bash
git diff --check
git status --short
git diff --stat
git diff
```

Expected: only the planned documentation files and the source-comment pointer
are changed; no secret or environment file appears.

- [x] **Step 3: Commit the verified change**

Run:

```bash
git add docs/framer-copy-handoff.md docs/framer-image-handoff.md docs/regulatory-basis.md docs/spanish-strings.md docs/superpowers/plans/2026-09-12-product-claims-alignment.md docs/superpowers/specs/2026-09-12-product-claims-alignment-design.md lib/rule-engine.ts
git commit -m "docs: align product claims with live capabilities"
```

- [x] **Step 4: Push and open a pull request**

Push `codex/align-product-claims` to `origin` and open a pull request against
`main` summarizing the capability corrections, citations, and verification.
