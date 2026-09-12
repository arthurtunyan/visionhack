# Product Claims Alignment Design

## Goal

Align every repository-owned product claim with what the current API can
actually do, while preserving the verified SNAP stocking thresholds and giving
the Framer owner exact replacement copy.

## Scope

This is a documentation and UI-copy change only. It does not change the rule
engine, the `/api/scan` contract, model configuration, deployment settings, or
Vercel state.

## Product boundary

The live product accepts an invoice or shelf image plus an optional store name,
returns one stateless stocking scorecard, supplies food-stocking suggestions,
and provides English and Spanish scorecard text. It does not track licenses,
persist store data, provide accounts or reminders, or make an official SNAP
eligibility determination.

The Framer page should present those current capabilities as live. License
management, saved dashboards, renewal reminders, and other future concepts may
be described only when visibly labeled as roadmap material; they should not be
used in the current demo flow.

## Regulatory language

Keep the verified Criterion A stocking figures: seven varieties in each of four
staple-food categories, at least three stocking units per variety, at least 84
units total, and at least one perishable variety in three categories. Keep the
November 4, 2026 implementation date.

Status language must describe a readiness estimate, not a pass/fail ruling.
Consequences must be attributed to USDA and conditioned on an official USDA
determination. Copy must explain that this invoice-based scan does not assess
Criterion B, specialty-store treatment, continuous shelf availability, or
official food classifications.

Primary sources:

- USDA Food and Nutrition Administration, [SNAP Stocking Standards Final Rule](https://www.fna.usda.gov/snap/retailer/stocking-standards-rule)
- USDA Food and Nutrition Administration, [Final Rule: Updated Staple Food Stocking Standards](https://www.fna.usda.gov/snap/fr-050826)
- USDA Food and Nutrition Administration, [Application of 6 Month Waiting Period](https://www.fna.usda.gov/snap/retailer-eligibility-application-6-month-waiting-period)

## Deliverables

1. A durable regulatory-basis document beside the API documentation.
2. Corrected bilingual screen labels with a visible disclaimer.
3. A copy-paste Framer handoff for Michael/A covering hero, workflow, feature
   cards, FAQ, demo framing, and pre-publish risks.
4. A warning on the legacy image handoff so unsupported dashboard and license
   screenshots are not presented as current functionality.
5. A source pointer beside the scorecard thresholds in the rule engine, without
   changing any constants or runtime behavior.

## Verification

Run the repository test, lint, typecheck, and production-build commands. Search
the current-copy documents for the superseded claims and review the full Git
diff for unintended changes or secrets.
