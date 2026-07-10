# SP4 — UX grammar and repository hygiene

**Branch:** `feature/sp4-grammar-hygiene`
**Source of truth:** `docs/superpowers/specs/2026-07-09-blueprint-light-unification-design.md`

## Scope guardrails

- Add the reverse funnel bridge from occupation pages to
  `https://clearroadlabs.com/sample-audit` with the approved label
  “See what the full audit looks like →”.
- Preserve the existing audit CTA destination, analytics taxonomy, form/API
  behavior, database schema/data, and Next.js version.
- Fence production-writing live QA behind `RUN_LIVE_QA=1`; never execute it
  with the opt-in enabled during this phase.
- Delete only the stale generated `drizzle/schema.ts` snapshot. Because
  `drizzle/relations.ts` imports that snapshot, repoint its import to the
  canonical `lib/db/schema.ts` before deletion. No migration or database
  command is allowed.
- Remove the named root QA image/markdown artifacts. Generated visual-review
  output remains under ignored `output/` and `tmp/` directories.
- Archive the local neon branch at its current tip with
  `archive/neon-orbital-builder`, then delete the local branch. Push the tag
  only after Damon's final gate. Do not delete `origin/pm-gap-sweep` without
  separate confirmation.

## Tasks

1. Add the sample-audit secondary CTA beside the occupation hero audit CTA.
   Extend the occupation Playwright spec with a read-only assertion for its
   accessible label and exact destination.
2. Add a top-level conditional skip to `tests/e2e/live-qa.spec.ts` and update
   its run comment to show the required environment variable.
3. Repoint `drizzle/relations.ts` to the active schema, delete
   `drizzle/schema.ts`, and prove all TypeScript consumers still resolve.
4. Remove tracked and untracked root QA screenshots plus
   `home-snapshot.md`, using explicit paths only.
5. Create the local archive tag and delete the superseded local neon branch.
6. Run `git diff --check`, `npm run type-check`, `npm test`, `npm run build`,
   the live-QA spec with opt-in absent (four skipped), and the four approved
   local Playwright specs. Acceptance for the established local suite remains
   no new failures versus its 12-pass/3-failure baseline.
7. Capture the changed occupation hero at 1440px and 390px, inspect both,
   and stop for Damon's explicit approval before merging, pushing `main`, or
   pushing the archive tag.

## Acceptance evidence

- The occupation page exposes both funnel choices with the approved CTA
  grammar and correct CRL URLs.
- Default live QA reports skipped tests and performs no production writes.
- No source file imports `drizzle/schema.ts`; type-check/build pass after its
  deletion.
- No QA screenshots or `home-snapshot.md` remain at the repository root.
- `archive/neon-orbital-builder` resolves to the former neon branch tip and
  the local branch no longer exists.
- Desktop/mobile screenshots show no clipping or CTA hierarchy regression.

