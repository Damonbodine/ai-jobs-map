# SP3 — Blueprint Light non-CSS surfaces

**Goal:** Move PDF templates, transactional email HTML, and the Open Graph image onto the canonical Blueprint Light constants in `lib/brand.ts`, then render representative artifacts for visual approval before deployment.

**Branch:** `feature/sp3-brand-surfaces`

## Constraints

- Styling only: do not change request validation, database writes, analytics, recipients, subjects, attachments, plain-text email bodies, or error handling.
- All palette values must originate in `lib/brand.ts`; no new hardcoded hex values in scoped production files.
- Radius remains zero. PDF and email cards use square hairline geometry.
- PDFs continue using react-pdf's built-in Helvetica fallback until Geist font files are vendored locally; update only the stale Newsreader/Manrope comments.
- Generated review artifacts live under ignored `output/` and `tmp/pdfs/` paths.

## Task 1 — PDF brand adapter and templates

**Files:** `lib/pdf/styles.ts`, `lib/pdf/blueprint.tsx`, `lib/pdf/department.tsx`, `lib/pdf/team-deck.tsx`, `lib/pdf/team-deck-data.ts`

- Derive `PDF_COLORS` from `BRAND` and `PDF_MODULE_ACCENTS` from `DATA_SERIES` using the locked module-slot assignment.
- Add derived success/accent/terminal alpha recipes in the adapter; do not hardcode palette literals in templates.
- Replace the nine team-deck color literals, use terminal ink/ice/cyan on dark pages, and translate roadmap phases to semantic success/accent/secondary recipes.
- Remove PDF border radii and stale Newsreader/Manrope comments.
- Keep data text in foreground; module series colors remain non-text identity marks.

## Task 2 — Shared email styles and six route sweeps

**Files:** create `lib/email/brand.ts`; modify `app/api/contact/route.ts`, `app/api/inquiries/route.ts`, `app/api/one-pager/route.ts`, `app/api/build-a-team/inquiry/route.ts`, `app/api/build-a-team/pdf/route.ts`, `app/api/demo/lead/route.ts`

- Export stable inline style strings derived from `BRAND`: shell, panel, card, muted metadata, and link.
- Replace every inline palette hex and rounded panel declaration with the shared styles.
- Preserve all dynamic escaped values and every non-HTML behavior verbatim.

## Task 3 — Open Graph + contract test

**Files:** `app/opengraph-image.tsx`; create `tests/unit/brand-surfaces.test.ts`

- Import `BRAND` in the OG renderer and replace all seven hardcoded color uses; make the monogram square with cyan fill and ink text.
- Assert exact PDF module-slot assignments, email styles derived from `BRAND`, and zero hardcoded six-digit hex values across scoped production files.

## Task 4 — Repeatable artifact gate

**Files:** create `scripts/render-sp3-artifacts.ts`; modify `.gitignore`

- Render a representative two-page occupation blueprint and multi-page team deck into `output/pdf/`.
- Write one representative HTML preview per email route into `output/email/` using the same shared styles.
- Render the live Next.js Open Graph endpoint into `output/og/timeback-opengraph.png`.
- Run `npm run type-check && npm test && npm run build`.
- Render PDFs to PNG with Poppler under `tmp/pdfs/` and inspect every page for clipping, overlap, unreadable glyphs, hierarchy, and contrast.
- Present PDF, email, and OG artifacts for Damon's explicit approval; do not merge or push before approval.
