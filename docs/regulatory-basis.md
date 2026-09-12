# SNAP stocking regulatory basis

Last verified: **September 12, 2026**

This document explains which regulatory statements Ledger can support and where
the product must stop short. It is product-copy guidance, not legal advice.

## What the USDA sources support

The USDA Food and Nutrition Administration (FNA) says that, beginning
**November 4, 2026**, SNAP-authorized retailers other than specialty food stores
must comply with updated stocking standards. The published Criterion A stocking
figures are:

- at least **7 varieties** in each of 4 staple-food categories;
- at least **3 stocking units** for each variety;
- at least **84 stocking units** across the 4 categories; and
- at least 1 perishable variety in **3 of the 4** categories.

FNA also says that if it determines a store does not meet the new requirements,
an existing store will be withdrawn from SNAP or a new application will be
denied. The store may reapply six months after the date of that withdrawal or
denial.

Primary sources:

- [SNAP Stocking Standards Final Rule — requirements and retailer questions](https://www.fna.usda.gov/snap/retailer/stocking-standards-rule)
- [Final Rule: Updated Staple Food Stocking Standards — dates and rule summary](https://www.fna.usda.gov/snap/fr-050826)
- [Retailer Eligibility — Application of 6 Month Waiting Period](https://www.fna.usda.gov/snap/retailer-eligibility-application-6-month-waiting-period)

## What Ledger estimates

Ledger reads one submitted invoice or shelf image, classifies the food lines it
can read, and compares the counted lines with the numeric stocking thresholds.
The result is a **readiness estimate for the submitted image**, not an official
eligibility determination.

The current scan cannot establish:

- whether the submitted image represents everything continuously offered for
  sale at the store;
- whether USDA would classify every product or variety the same way;
- whether the store qualifies under Criterion B based on staple-food sales;
- whether specialty-store or need-for-access treatment applies;
- whether a store is authorized, denied, withdrawn, or eligible to reapply; or
- whether the store meets health, WIC, alcohol, tobacco, tax, scale, licensing,
  or permitting requirements.

The model's perishable and variety classifications are implementation proxies.
Only USDA can make the classifications and eligibility findings that control a
store's participation.

## Approved claim pattern

Use:

> Estimated to meet the SNAP stocking standard

or:

> May not meet the stocking standard yet

Always keep this disclosure next to the result:

> Readiness estimate only. Ledger checks items it can read in this image against
> the Criterion A stocking thresholds. It is not an official USDA eligibility
> determination.

Do not use unqualified claims such as “passes USDA,” “fails SNAP,” “inspection
ready,” or “will lose authorization.” When explaining consequences, identify
USDA as the decision-maker and make the consequence conditional on USDA's
official determination.
