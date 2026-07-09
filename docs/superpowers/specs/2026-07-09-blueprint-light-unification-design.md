# Blueprint Light — Timeback × Clear Road Labs Unification Design

**Date:** 2026-07-09
**Status:** Approved by Damon (brainstorm 2026-07-09)
**Repos:** this repo (Timeback, `/Users/damonbodine/ai-jobs-map`, timeback.clearroadlabs.com) is where all
implementation happens; clearroadlabs.com (`/Users/damonbodine/ClearRoadLabs`) is the reference
system and receives only the shared brand-contract doc.

## Why

Timeback and clearroadlabs.com are one funnel (Timeback is the free diagnostic
front door feeding the CRL audit; CRL's sample audit bridges to Timeback's
occupation pages) but two disjoint identities: CRL is dark "Blueprint"
(Geist/Geist Mono, cyan #6fd4ec on ink #0a1420, hairlines, sharp corners);
Timeback is a warm-cream editorial light theme ("Recovery Ink": Newsreader
serif + Manrope, blue-500 accent, 10px radii). Same owner, same journey —
they should read as one company and operate the same way.

**Decisions (Damon, 2026-07-09):**
1. **Brand model: Blueprint Light** — one design system, two surfaces. CRL is
   ice-on-ink; Timeback becomes ink-on-ice. Not a new palette: the same
   families, inverted. Full dark reskin and "continuity only" both rejected.
2. **Scope: unify + hygiene + light polish.** Copy/layout polish only where
   the reskin already touches a money page. No product rethink until GA4 data.
3. **Neon/type-city branch: archive.** Tag `archive/neon-orbital-builder`,
   delete the branch, keep its spec docs. Blueprint Light supersedes it.
4. **Architecture: Approach A** — mirrored tokens + a brand-contract doc in
   both repos; NO shared npm package, NO monorepo.
5. **Execution: Claude (this session's model) plans and reviews; Sonnet
   subagents write the code.** Damon gates each sub-project's production
   deploy on screenshots.

## The Blueprint Light token system

| Token | CRL (dark, reference) | Timeback (Blueprint Light) |
|---|---|---|
| `--background` | ink `#0a1420` | cool paper `#f2f6f9` |
| `--card` | panel `#1c2c3e` | `#ffffff` |
| `--muted` / tint | — | ice `#e3ecf4` (CRL's foreground, reused as a surface tint) |
| `--foreground` | ice `#e3ecf4` | ink `#0a1420` (identical hex to CRL's background) |
| Accent — fills/buttons/meters | cyan `#6fd4ec` | cyan `#6fd4ec` unchanged; CRL's `bg-cyan` + ink-text button ports as-is |
| Accent — text/links on light | — | deep cyan `#0f7fa8` (AA on light; raw cyan fails contrast as text) |
| Hairline/border | ice @ 14% | ink @ 14% (`rgba(10,20,32,0.14)`) |
| Destructive / success | `#e88a8a` / — | darkened AA-safe equivalents for light surfaces |
| Radius | 0 (sharp) | **0** — shadcn `--radius: 0rem`. Exception rule: if a primitive (dialog/toast) reads badly at screenshot review, 2px is permitted and recorded in the contract |
| Display/body font | Geist | **Geist** (Newsreader retired) |
| Mono | Geist Mono | **Geist Mono** — eyebrows, stats, annotations, tabular-nums wherever data renders |
| Motifs | bg-grid, hairline rules, mono uppercase eyebrows (11px/0.18em) | same, ink-tinted on light |
| "Terminal" panels | — | become literal CRL-dark islands: ink bg, ice text, cyan accents — the agent-console demo is a window of the mothership theme |
| Chart/data colors | — | `DATA_SERIES`: one 6-value cyan/slate-family categorical ramp in `lib/brand.ts`; ALL charts (TimeDonut, occupation-builder, role-builder module accents) consume it — replaces 33 scattered hex literals |

**One source, four surfaces:** web tokens live in native Tailwind v4 `@theme`
in `app/globals.css`; `lib/brand.ts` exports the same palette as TS constants
for the three surfaces that cannot read CSS (PDF templates via
`@react-pdf/renderer`, inline-HTML email templates in API routes, and
`app/opengraph-image.tsx`). A **lockstep unit test parses `globals.css` and
asserts the TS values match** — palette drift fails CI.

**Dark mode machinery is deleted** (feature flag, `.dark` block, theme toggle,
`next-themes` dependency): one theme, on purpose. The `.dark` block's values
are superseded by the terminal-panel tokens.

**Brand contract:** a single markdown (`docs/brand-contract.md` in this repo,
copied to the CRL repo) recording tokens, type roles, CTA grammar
(primary = cyan fill + ink mono-uppercase label; secondary = hairline
outline), voice rules (confident/production, numbers over adjectives, no `$`
pricing on CRL surfaces), and the radius-exception log. It is the canonical
cross-repo reference; sync is by convention (solo owner, two repos).

## Sub-projects (each gets its own implementation plan, in order)

### SP1 — Token foundation (small; invisible except fonts)
- Rewrite `app/globals.css` to native Tailwind v4 `@theme` with Blueprint
  Light tokens; **remove the `@config "../tailwind.config.js"` shim** and the
  v3 config file (the "don't remove this line" landmine dies with it —
  utilities the config provided must be re-expressed in `@theme`).
- Create `lib/brand.ts` (palette + `DATA_SERIES` + semantic aliases as TS
  constants) and the CSS↔TS lockstep test (vitest).
- Load Geist + Geist Mono via `next/font/google` in `app/layout.tsx`; map
  `--font-heading`/`--font-body` vars so existing `font-heading`/`font-body`
  classes keep working; retire Newsreader/Manrope.
- Fix the `font-display` ghost class in `app/demo/page.tsx` and
  `app/demo/[slug]/page.tsx` (class doesn't exist in the config; headings
  silently fall back — map or replace with `font-heading`).
- Delete dark-mode machinery: `DARK_MODE_ENABLED` in `lib/features.ts`,
  `.dark` CSS block, theme toggle in Header, `next-themes` provider + dep.
- Write `docs/brand-contract.md`; copy to the CRL repo.
- After SP1 the site renders nearly identically **except typography** — the
  foundation moves, not the look.

### SP2 — Apply Blueprint Light (the big one; every user-facing surface)
- Header + Footer to CRL grammar: mono uppercase nav, cyan/ink CTA button,
  hairlines, ice-tint hover states. (Neon branch has diverging edits to these
  files; it is archived in SP4 and never merged — no conflict path.)
- Pages, in review order: `/` → `/occupation/[slug]` → `/build-a-team` →
  `/browse` + `/category/[category]` → `/demo`, `/demo/[slug]`, `/demo/try` →
  `/products`, `/about`, `/principles`, `/contact` → legal pages.
- Charts: TimeDonut (11 hexes), occupation-builder (11), role-builder (11)
  onto `DATA_SERIES`; AgentLoopDiagram (5) + DemoTimeline (2) onto brand
  constants; terminal panels onto literal CRL ink/cyan/ice.
- Radius 0 across shadcn primitives (exception rule above).
- bg-grid + eyebrow motifs applied where CRL uses them (section labels,
  stat lines — mono, tracking, tabular-nums).
- Light copy polish ONLY where a touched money page reads off-voice.
- **Gate:** per-page before/after screenshots (1440 + 390) to the scratchpad;
  Damon reviews before the SP2 deploy.

### SP3 — Non-CSS surfaces (medium; mechanical)
- `lib/pdf/styles.ts` (17 hexes) + `lib/pdf/team-deck.tsx` (9) import from
  `lib/brand.ts` (via a small `lib/pdf/brand-styles.ts` adapter if needed —
  `@react-pdf` StyleSheet only needs the hex strings).
- Email templates: the 22 inline hexes across `app/api/contact`,
  `app/api/inquiries`, `app/api/one-pager`, `app/api/build-a-team/inquiry`,
  `app/api/build-a-team/pdf`, `app/api/demo/lead` routes → brand constants
  (extract a tiny shared email-shell helper if the routes repeat layout HTML).
- `app/opengraph-image.tsx` (7 hexes) re-mirrored from `lib/brand.ts` values
  with a comment pointing at the lockstep source.
- **Gate:** render one blueprint PDF + one team deck to the scratchpad; write
  each email template's HTML to files; Damon eyeballs (no test coverage
  exists for these surfaces).

### SP4 — UX grammar + hygiene (small; high leverage)
- CTA language parity with CRL: "Start with an audit →" (already matches),
  plus the **reverse bridge** — Timeback's occupation page links CRL's
  `/sample-audit` ("See what the full audit looks like →"), completing the
  bidirectional loop (CRL's sample audit already links Timeback's occupation
  map).
- `tests/e2e/live-qa.spec.ts` fenced: skip unless `RUN_LIVE_QA=1` env var is
  set (it submits REAL forms to production — must never run in a default
  `npx playwright test`).
- Schema dedup: delete the stale `drizzle/schema.ts` snapshot (a TypeScript
  file only — `lib/db/schema.ts` is the active one; NO database migration).
- Root clutter: remove the ~24 untracked/tracked QA screenshots at repo root.
- Archive the neon branch: `git tag archive/neon-orbital-builder
  feat/neon-orbital-builder && git branch -D feat/neon-orbital-builder`
  (+ delete `origin/pm-gap-sweep`'s local tracking if present; spec docs stay).

## Execution model & verification

- One implementation plan per sub-project (complete code in every step, the
  established pattern). **Sonnet subagents execute tasks** in this repo;
  the planner reviews diffs and test output between tasks; Opus escalation
  only if a task fails twice.
- Per task: vitest + the four LOCAL Playwright specs (`build-a-team`,
  `contact-form`, `funnel-realness`, `occupation-inline-builder`) —
  `live-qa.spec.ts` excluded until SP4 fences it.
- Lockstep test guards palette drift from SP1 onward.
- Untouched by design: GA4 event taxonomy, `lib/site.ts` AGENCY constants
  (all 31 clearroadlabs.com call sites), form/lead machinery, Neon DB and
  its data, Next.js version (stays 15.x — upgrade is explicitly out of
  scope).
- Each sub-project ends: full suite green → screenshots → **Damon's explicit
  go** → merge + push (production deploy) → next sub-project.
- Ops notes for executors: never `git add -A` in this repo (untracked
  screenshots + `.env.local`/`.env.production.local` at root); Playwright
  here runs on port 3070 with its own webServer config.

## Non-goals

Next 15→16 upgrade, dark mode, monorepo/shared package, product-behavior
changes to builders/demos/PDF content, DB schema/data changes, new pages,
merging any neon-branch code.

## Risks

- **Font swap reflows everything** (serif→Geist changes metrics sitewide) —
  the screenshot gates exist chiefly for this.
- **Radius 0 on shadcn primitives** may read severe — exception rule (2px)
  with contract logging.
- **Hue shift kills the warm identity irreversibly-in-spirit** — accepted;
  per-sub-project deploys instead of a big bang.
- **Email/PDF have zero test coverage** — mitigated by the SP3 render gate.
