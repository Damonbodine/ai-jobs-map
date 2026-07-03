# PDF Redesign — Design Spec
**Date:** 2026-04-14  
**Status:** Approved

## Overview

Replace the current single-page `BlueprintPdf` component with two distinct, data-rich PDF renderers:

1. **Team Blueprint Deck** — 7-page presentation sent after a team inquiry submission  
2. **One-Pager v2** — 2-page upgrade to the individual occupation download

Both are generated server-side via `@react-pdf/renderer`, use the existing Helvetica font (no CDN dependency), and follow the Recovery Ink color palette.

---

## Data Available (confirmed from prod DB)

**Occupations table:** `title`, `slug`, `major_category`, `hourly_wage`, `annual_wage`, `employment`

**`job_micro_tasks` table (8,052 AI-applicable tasks):**
- `task_name`, `task_description`
- `frequency` — `"daily"` | `"weekly"` | `"monthly"`
- `ai_applicable` — boolean
- `ai_how_it_helps` — prose description
- `ai_impact_level` — integer 1–5
- `ai_effort_to_implement` — integer 1–5
- `ai_category` — e.g. `"documentation"`, `"decision_support"`, `"data_analysis"`
- `ai_tools` — comma-separated tool names (e.g. `"GPT-4, DAX Copilot"`)

**`occupation_automation_profile` table:**
- `composite_score` — overall automation potential 0–100
- `time_range_low` / `time_range_high` — minutes/day saved
- `time_range_by_block` — JSONB: per-module `{ low, high }` minute ranges
- `block_example_tasks` — JSONB: top example tasks per module with scores

---

## PDF 1 — Team Blueprint Deck

**Trigger:** Sent to `input.contactEmail` after successful `POST /api/build-a-team/inquiry`  
**Renderer:** New file `lib/pdf/team-blueprint.tsx`  
**Page count:** 7 base pages + 1 role-section page per role (so a 3-role team = ~10 pages)

### Page Structure

#### Page 1 — Cover (dark)
- Black background
- Kicker: `AI TIMEBACK · TEAM BLUEPRINT`
- Headline: `"Your team reclaims X hours every year."` (computed from all roles × headcount)
- Sub: List of role names with headcount badges
- Footer: `Prepared by Clear Road Labs · [date]`

#### Page 2 — Team at a Glance
- 3-stat row: total hours reclaimed/year, total annual value (sum across all roles × headcount × hourly wage), total AI-applicable tasks selected
- Role summary table: role title | headcount | minutes/day | annual value per person
- Custom requests (if any) in a callout box

#### Page 3 — Methodology
- 4-step numbered list explaining data provenance:
  1. BLS + O*NET task data for each occupation
  2. AI impact scored per task (1–5 scale) based on task description + category
  3. Tasks grouped into AI agent modules (Documentation, Intake, Coordination, etc.)
  4. User's task selections applied as the filter
- Brief note: "Numbers represent median estimates; your mileage will vary based on workflow and adoption speed."

#### Pages 4+ — Role Sections (one page per role)
- Accent bar + role title + headcount
- 3-stat row: minutes/day, annual value per person, annual value for headcount
- Module breakdown: each selected module shown as a row with color accent, name, and total minutes/day for that module
- Top 5 tasks for the role listed with: task name, `ai_how_it_helps` snippet, before time (`estimateTaskMinutes(task)`), after time (before × reduction factor derived from `ai_impact_level`: 5→15%, 4→30%, 3→50%, 2→70%, 1→85% of original)
- `ai_tools` shown inline per task where available

#### Module Deep-Dive Pages (top 4 modules by total minutes saved across the team)
- Module name + icon label
- What this agent does (1–2 sentence description from `MODULE_REGISTRY`)
- Table of tasks: task name | frequency | impact level (shown as dots) | time saved | tools
- Tasks shown are the union of selected tasks in that module across all roles, labeled by role
- Capped at 4 module pages to keep deck under 12 pages for any team size

#### Second-to-last Page — Implementation Roadmap
- 3 phases derived from `ai_effort_to_implement` scores:
  - **Phase 1 (Weeks 1–4):** Tasks with effort ≤ 2, sorted by impact desc
  - **Phase 2 (Month 2–3):** Tasks with effort = 3
  - **Phase 3 (Month 4+):** Tasks with effort ≥ 4
- Each phase shows: task count, role(s) affected, estimated time savings unlocked

#### Last Page — CTA (dark)
- Black background matching cover
- `"Book a 30-minute scoping call."`
- Supporting copy: "We'll walk through this blueprint, answer questions, and give you a fixed-price proposal within 48 hours."
- Contact block: `damon@clearroadlabs.com` + `CONTACT.email` from `lib/site.ts`
- Agency name + site URL from `lib/site.ts`

---

## PDF 2 — One-Pager v2

**Trigger:** Sent to `email` after successful `POST /api/one-pager`  
**Renderer:** Update existing `lib/pdf/blueprint.tsx` for the `"one-pager"` variant  
**Page count:** 2 pages (up from 1)

### Page 1 — Stats + Top Tasks (improved layout)
- Same header + 3-stat row as current
- Task list upgraded: each task now shows `task_name` + `ai_how_it_helps` + before time (`estimateTaskMinutes`) + after time (same reduction formula as team deck: `ai_impact_level` → % retained)
- Capped at 8 tasks (currently 12 — fewer, better)
- Data source footnote: "Task data from BLS O*NET. Time estimates are medians."

### Page 2 — Module Breakdown + CTA
- Section title: "AI Modules for this Role"
- One row per module: color-coded left border, module name, total minutes/day for module, 2–3 top task names
- CTA callout: "Want this built for your team? → [siteUrl]/build-a-team"
- Footer with agency name + URL

---

## Architecture

### New files
- `lib/pdf/team-blueprint.tsx` — new React-PDF component for team deck
- `lib/pdf/team-blueprint-renderer.ts` — `renderTeamBlueprintPdf(input, roles)` function that fetches data and calls the component

### Modified files
- `lib/pdf/blueprint.tsx` — update `"one-pager"` variant to 2 pages with module breakdown
- `app/api/build-a-team/inquiry/route.ts` — swap `renderDepartmentPdf` for `renderTeamBlueprintPdf`
- `app/api/one-pager/route.ts` — pass additional data (module breakdown, per-task time estimates) to the updated blueprint renderer

### Shared utilities (already exist)
- `lib/timeback.ts` — `estimateTaskMinutes`, `computeDisplayedTimeback`
- `lib/blueprint.ts` — `getBlockForTask`
- `lib/modules.ts` — `MODULE_REGISTRY` (labels + descriptions)
- `lib/pricing.ts` — `computeAnnualValue`

### Data flow for team deck
```
POST /api/build-a-team/inquiry
  → parse + validate input (roles_json contains selected task IDs per role)
  → for each role: fetch occupation + tasks + profile from Supabase
  → compute per-role stats (minutesPerDay, annualValue, module breakdown)
  → compute team totals
  → derive phase roadmap from effort scores
  → call renderTeamBlueprintPdf(teamData)
  → attach PDF to Resend email
```

### Font constraint
Continue using Helvetica (no CDN font fetching). Per the existing comment in `blueprint.tsx`: vendor TTFs into `/public/fonts` is a future plan (Plan 4), not this work.

---

## Constraints & Guardrails

- **No new DB queries beyond what the API route already does** — all data already fetched in the inquiry handler; pass it through rather than re-fetching
- **Two-writes-no-silent-failure pattern preserved** — DB insert happens before PDF generation; PDF failure does not fail the request
- **Server-side math only** — all time estimates derived server-side from profile + task data; nothing trusted from client payload
- **PDF generation timeout** — large teams (5+ roles) may produce 15+ page PDFs; keep each page's component simple to avoid `renderToBuffer` timeouts on Vercel (300s limit, well within range)

---

## Out of Scope
- Custom fonts (Plan 4)
- Charts/graphs inside the PDF (react-pdf has limited SVG support)
- Interactive PDFs
- Per-user PDF caching
