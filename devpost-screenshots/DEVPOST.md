# Elevator pitch (200 char limit)

**Use this one — 184 characters, fits the 200 limit:**

> Photograph a wholesale order record. Ledger scores your shelf against the SNAP stocking rule landing Nov 4, and keeps the other seven licences your store runs on from quietly expiring.

Backups, if you want a different angle:

- *(150)* A corner store answers to eighteen programmes on eighteen calendars. Ledger puts them on one, and reads your stocking off a photo of the order record.
- *(132)* The USDA rule that closes corner stores lands November 4. Ledger tells you where you stand from a photograph, in English or Spanish.

---

# Project Story

## Inspired by

A corner store is regulated like a supermarket and staffed like a household. The same person
who runs the register also renews the tobacco licence, books the scale inspection, keeps the
food-handler cards current, and answers to the county health inspector. Eight separate
obligations, eight renewal dates, eight agencies — and no one whose job it is to watch them.

Then the USDA moved the floor. Beginning **November 4, 2026**, SNAP-authorized retailers
face updated staple-food stocking standards: at least **7 varieties** in each of four staple
categories, **3 stocking units** per variety, **84 units** across the four, and a perishable
in **3 of the 4**. Miss it and the store is withdrawn from SNAP — and a withdrawn store
cannot reapply for six months.

Six months without EBT is not a fine. For most of these stores it is the end.

What struck us is that nobody gets a warning letter. Stocking drifts. One slow week on
produce and you are under, and you find out when the inspector does. The information needed
to know where you stand already exists — it is sitting in a shoebox of paper wholesale order
records behind the counter. Nothing reads it.

So we built the thing that reads it.

## What it does

Ledger is two halves that lean on each other.

**Scan.** Photograph a printed wholesale order record. A vision pipeline transcribes the
line items, classifies each into a staple category, works out how many sellable units are in
a pack, and flags perishability. A rule engine scores that against the November 4 standard
and returns a pass/fail scorecard — per-category variety and unit counts, which categories
clear, and a ranked fix list saying *buy these three things and you pass*, with the reason
each one helps.

**Track.** Every other licence the store runs on — SNAP, WIC, county health permit, food
handler cards, tobacco retail licence, ABC beer and wine, scale registration, business tax —
entered once, then held on one calendar with what actually happens when each lapses. Not
"expired," but *"sales must stop the day it lapses; late renewal carries a penalty fee."*

The whole thing runs in English and Spanish, because a meaningful share of the owners this
is for do not run their store in English.

## How we built it

Next.js App Router + TypeScript on Vercel, with the scan living behind a single
`POST /api/scan` route handler.

**The vision pipeline is two passes, deliberately.** Pass 1 transcribes the printed lines
verbatim. Pass 2 categorizes, names the variety, sizes the pack, and flags perishability.
They are split because a single pass launders transcription errors into confident-looking
classifications — if the model misreads "Queso fresco 3" it will happily produce a
well-formed dairy item with a unit count, and nothing downstream can tell that it was
invented. Separating the passes means a bad read stays a bad read.

Both passes run at temperature $0$ with reasoning disabled. This is transcription and
bookkeeping, not prose.

**Getting structure out of the model was the hard part.** The model we run accepts images
and supports tools, but it does *not* support `response_format` — asking for structured
output is rejected before inference even starts. And its only live provider rejects every
explicit `tool_choice` value. So each pass declares exactly one function, generated from a
Zod schema, and omits `tool_choice` entirely. The answer is read from
`tool_calls[0].function.arguments` and re-validated against that same schema.

`message.content` is ignored on purpose. A reasoning model emits prose alongside its tool
call, and treating that prose as data means trusting the one part of the response that
nothing constrains. The only accepted answer is a single, correctly-named, schema-valid tool
call. Everything else fails closed.

**The rule engine is separate from the model and has no opinions.** Given classified items,
it partitions by category and applies the four rules. Let $V_c$ be varieties found in
category $c$ and $U_c$ the units. A store passes when

$$V_c \ge 7 \;\wedge\; U_c \ge 21 \quad \forall c \in C, \qquad \sum_{c \in C} U_c \ge 84, \qquad \left|\{c : P_c\}\right| \ge 3$$

where $P_c$ marks a category stocking at least one perishable variety and $|C| = 4$. The
thresholds are exported constants, imported by the marketing copy rather than retyped —
after we caught the landing page advertising a 3-variety rule while the scanner scored
against 7.

**Undercounting is a design choice.** Items below $0.75$ classification confidence are not
counted at all; they come back in an `excluded` list with a reason. A blurry photo gives you
a *shorter* count, never a wrong one. A case becomes the number of sellable units inside it,
so a 24-pack is 24 — and anything priced by weight has no unit count to read, so it is held
back for a human to confirm.

Some rules are enforced twice, in the pass-2 prompt *and* in code, because the model drifts.
Butter other than peanut butter, and all jerky, are accessory foods and count for nothing.
Peanut butter is a countable protein, and it is checked first so the general butter pattern
cannot erase it.

## Challenges

**The model fought the schema.** No `response_format`, and a provider that rejects every
`tool_choice`. What looks like two lines of config in the finished code is most of a day of
narrowing down which of three plausible failure modes was actually firing.

**Deciding what we are allowed to claim.** Ledger names SNAP, WIC, EPA, OSHA. It is
affiliated with none of them and no authorization decision is ever ours. That constraint is
written into the codebase as a single non-affiliation string that every page imports — it
cannot be retyped, softened, or dropped from one page. We keep a `regulatory-basis.md` that
records, with primary sources and a verification date, exactly which claims the USDA
documents support and where the product has to stop short.

**Copy drifting from code.** The marketing page and the scanner disagreed about the rule.
Twice. The fix was to make the thresholds importable and delete the hand-typed copies, so
the two physically cannot diverge.

**A `.gitignore` line ate a page.** The nav linked to `/coverage` and it 404d in production
for days. The route file existed locally. But `.gitignore` had `coverage/` — which git
matches at *any* depth — so `app/coverage/` was silently dropped from every `git add`. An
earlier commit message even claims to add the page; its diff touches one unrelated file.
Anchoring the pattern to `/coverage/` fixed it. Git's silence when it ignores a file you
explicitly staged is a genuinely dangerous default.

## What we learned

- **Split the passes.** A model that transcribes and interprets in one step will fabricate
  confidently and give you no way to tell.
- **Fail closed, and say what you held back.** A short count with an honest "couldn't read
  these" builds more trust than a complete-looking count that is quietly wrong. Store owners
  can work with "I couldn't read four lines." Nobody can work with silent invention.
- **Constants are a trust boundary.** If a number appears in both the product and the
  marketing, make one import the other.
- **Enforce the rules twice.** Prompt *and* code. The prompt sets the intent; the code holds
  the line when the model drifts.

## What's next

Multi-store rollups for owners running several locations, renewal reminders that actually
leave the building, and widening the scan beyond staple foods to the permit documents
themselves — a photographed licence should be able to fill in its own expiry date.
