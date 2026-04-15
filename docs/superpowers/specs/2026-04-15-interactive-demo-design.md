# Interactive Agent Suite Demo — Design Spec
**Date:** 2026-04-15
**Status:** Approved

---

## Overview

Build a role-switchable, full-workflow demo that shows the complete AI agent suite in action for one sample workday. Visitors pick a role (Operations Manager, Financial Analyst, or Software Developer), then walk through each agent that fires during that person's day: what it received, what it did, what it produced, and how much time it saved.

**Format:** Timeline nav (left) + expanded agent view (right). The expanded view has two layers:
1. A 4-phase animated loop diagram (Inputs → AI Processes → Outputs → Human Reviews) that loops continuously with Framer Motion
2. A real example output that types in character-by-character below the loop

**Goal:** Enterprise-quality sales demo. A buyer watching this should finish thinking "I need this for my team" — not "interesting data visualization."

---

## Vision & Tone

The demo should feel like the AI is a **co-pilot that lives inside the workday** — not a tool you open, but a presence that runs alongside everything the person does. The human is the decision-maker; the AI is the engine driving the day.

This has specific implications for every design and copy decision:

**Narrative voice:** Write in present tense, first-person proximity. Not "the agent helps with notes" — "while Mark is in his 10am, the agent is already sorting what comes next." The AI is *already running*. It never sleeps. It doesn't wait to be asked.

**Visual behavior:** The loop animation should feel **ambient and continuous** — it never fully stops, even between agents. When the user isn't interacting, the timeline auto-advances slowly (one agent every 8 seconds), like a real day passing. This creates a hypnotic quality: the work is just... happening.

**Pacing:** Don't make the user feel like they're watching a slideshow. The demo breathes on its own. Clicking an agent is zooming in on something that was already running, not starting it.

**Color:** Lead with dark backgrounds for the expanded agent view. The loop diagram lives in near-black (#0f0f0e). The output types into a dark terminal-like surface. Light only for the timeline nav and the before/after panels. Dark = the AI's world; light = the human's moment of review.

**Copy rule:** Every agent narrative ends with how little the human had to do — not how much the AI did. The power move is the human's new job is *3 minutes of approval*, not 45 minutes of work. That's what sells it.

**The AI plays a different role for each agent** — and the narrative copy should name it, because it's what makes the demo feel personal rather than generic. Examples:
- Intake Agent → chief of staff ("already sorted your morning before you opened your laptop")
- Documentation Agent → ghostwriter who was in the room with you
- Exceptions Agent → experienced colleague who knows exactly who to call
- Coordination Agent → the person who remembers everything you forgot to schedule
- Analysis Agent → the analyst who ran the numbers overnight
- Research Agent → the smart intern who read everything so you don't have to
- Compliance Agent → the risk officer who checks everything before you sign
- Communication Agent → the editor who says what you meant but better

The goal is for visitors to think: *"I have needed this person my entire career."*

---

## Agent Names

Every agent has a name. Not "the Documentation Agent" — **Quill**. Names are displayed in the demo as the primary label, with the module type as a secondary badge. They appear in the timeline nav, the expanded view header, and anywhere the agent is referenced in copy.

Names are human-sounding but not generic. Each hints at what the agent does without being on-the-nose.

| Module | Name | Why |
|--------|------|-----|
| intake | **Scout** | First one in. Always watching. Already sorted your morning. |
| documentation | **Quill** | The ghostwriter who was in the room with you. |
| coordination | **Cal** | Remembers everything you forgot to schedule. |
| analysis | **Iris** | Sees the pattern in the noise. |
| exceptions | **Reed** | Steady under pressure. Knows exactly who to call. |
| research | **Wren** | Read everything so you don't have to. |
| compliance | **Nora** | Checks everything before you sign. Nothing gets past her. |
| communication | **Cleo** | Says what you meant, but better. |
| data_reporting | **Lex** | The analyst who ran the numbers overnight. |
| learning | **Coda** | Always adding. Always current. |

In the demo UI, each agent card shows: **[Name]** in large type, the module label in small caps below it (e.g. "INTAKE & TRIAGE"), and the accent color dot. The loop diagram header reads e.g. "Scout is processing your morning queue."

---

## Placement

Three surfaces, one shared component at different depths:

| Surface | Component | Depth |
|---------|-----------|-------|
| `/demo` | `AgentSuiteDemo` | Full — role switcher + timeline + expanded agent view |
| Homepage (`/`) | `DemoTeaser` | Teaser — role switcher + timeline list only, no expanded panel, "See full demo →" CTA |
| `/products` | `DemoTeaser` | Same teaser, placed before the inquiry CTA |

The teaser is `AgentSuiteDemo` with a `teaser={true}` prop that hides the right panel and adds the CTA link.

---

## Roles

Three roles with real DB slugs:

| Display name | DB slug | Featured modules (in order) |
|---|---|---|
| Operations Manager | `general-and-operations-managers` | intake, coordination, exceptions, documentation, data_reporting |
| Financial Analyst | `financial-analysts` | analysis, data_reporting, compliance, research, documentation |
| Software Developer | `software-developers` | research, documentation, analysis, coordination, communication |

Each role shows 5 agent steps. The order matches a realistic workday sequence.

---

## Data Flow

```
app/demo/page.tsx  (server component)
  → lib/demo/compute-demo.ts
      → Supabase: fetch occupation row for each of the 3 slugs
      → Supabase: fetch job_micro_tasks for each occupation
      → for each role × module:
          sum estimateTaskMinutes * archetypeMultiplier for tasks in that module
          scale to displayedMinutes (same pipeline as one-pager route)
          compute afterMinutes via impactRetentionFactor
      → merge computed stats with scripted content from lib/demo/demo-scripts.ts
      → return DemoRoleData[] (all 3 roles pre-computed)
  → pass to <AgentSuiteDemo roles={demoRoles} /> (client component)
```

The server component fetches all 3 roles in parallel (`Promise.all`). The client receives fully-computed data — no client-side Supabase calls.

---

## Architecture

### New files

| File | Responsibility |
|------|---------------|
| `app/demo/page.tsx` | Server component — fetches + computes data, renders `AgentSuiteDemo` |
| `app/demo/loading.tsx` | Skeleton loading state (3 ghost agent rows) |
| `lib/demo/types.ts` | TypeScript types: `DemoRoleData`, `DemoAgentStep`, `AgentLoopContent`, `AgentOutput` |
| `lib/demo/compute-demo.ts` | `computeDemoRoles(): Promise<DemoRoleData[]>` — DB fetch + stat computation |
| `lib/demo/demo-scripts.ts` | All scripted content: narrative, loop items, example outputs per role × agent |
| `components/demo/AgentSuiteDemo.tsx` | Main client component — role switcher state + layout |
| `components/demo/DemoTimeline.tsx` | Left panel: role switcher chips + scrollable agent list |
| `components/demo/AgentExpandedView.tsx` | Right panel: loop diagram + output panel + before/after footer |
| `components/demo/AgentLoopDiagram.tsx` | 4-phase Framer Motion loop animation |
| `components/demo/AgentOutputPanel.tsx` | Typewriter output with role-appropriate formatting |
| `components/demo/DemoTeaser.tsx` | Teaser wrapper for homepage + /products |

### Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | Add `<DemoTeaser />` section between hero and social proof strip |
| `app/products/page.tsx` | Add `<DemoTeaser />` before the inquiry CTA section |
| `components/layout/Header.tsx` | Add "Demo" link to nav (between "Browse" and "Build a Team") |

---

## TypeScript Types

```typescript
// lib/demo/types.ts

export type AgentLoopContent = {
  inputs: string[]        // 3 items: what the agent received
  actions: string[]       // 3 items: what the AI did
  outputs: string[]       // 3 items: what it produced
  humanAction: string     // 1 sentence: what the person does to confirm
}

export type AgentOutput = {
  format: "prose" | "table" | "code"
  label: string           // e.g. "DRAFT DAILY DIGEST"
  content: string         // the full example text that types in
  language?: string       // only for format === "code" (e.g. "markdown")
}

export type DemoAgentStep = {
  moduleKey: string
  label: string
  accentColor: string
  timeOfDay: string       // e.g. "8:00 AM"
  narrative: string       // 1–2 sentences: what changed for this person
  loop: AgentLoopContent
  output: AgentOutput
  beforeMinutes: number   // from DB computation
  afterMinutes: number    // from DB computation
}

export type DemoRoleData = {
  slug: string
  displayName: string
  tagline: string         // e.g. "Running the whole operation, one agent at a time"
  agents: DemoAgentStep[]
  totalBeforeMinutes: number
  totalAfterMinutes: number
  annualValueDollars: number
}
```

---

## Scripted Content

### Operations Manager

**Tagline:** "Running the whole operation — one agent at a time."

| Agent | Time | Narrative | Inputs | AI Actions | Outputs | Human action | Example output format |
|---|---|---|---|---|---|---|---|
| Intake & Triage | 8:00 AM | Mark used to start every morning triaging 30+ emails and Slack threads. Now the Intake Agent pre-sorts overnight. | 31 unread emails; 4 Slack threads flagged; 2 overdue action items | Scores urgency 1–5; groups by project; flags 1 blocker requiring Mark's decision | Priority queue (top 5 items); 1 escalation flagged; 23 items auto-filed | Mark reviews top 5, confirms the escalation — 2 min | Prose: morning digest |
| Coordination | 10:30 AM | Scheduling a cross-functional meeting used to mean 45 minutes of back-and-forth. | 6 attendees' calendar availability; meeting agenda; room inventory | Finds first mutual 60-min slot; drafts agenda with pre-read links; books room | Calendar invite drafted; agenda attached; conflicts noted | Mark hits send — 1 min | Prose: meeting invite draft |
| Exceptions | 2:00 PM | A vendor delivery is late. Normally Mark would chase it manually. | Vendor SLA breach alert; project dependency map; contact directory | Identifies downstream impact; drafts escalation email; proposes 2 mitigation options | Escalation email drafted; impact summary; recommended action | Mark picks option 2, sends — 3 min | Prose: escalation email |
| Documentation | 4:00 PM | End-of-day status updates used to eat 30 minutes. | Meeting notes from 3 sessions; Slack thread summaries; task tracker updates | Extracts decisions + action items; formats as weekly status; attributes owners | Status report draft; 8 action items with owners + due dates | Mark reviews, adds one note — 4 min | Prose: weekly status report |
| Data & Reporting | 5:00 PM | Weekly ops dashboard used to be a manual spreadsheet pull. | Task completion rates; budget actuals; headcount utilization | Computes variance vs. targets; highlights 2 anomalies; formats for exec review | Dashboard narrative draft; 2 flagged anomalies with context | Mark approves, shares with exec — 2 min | Table: KPI summary |

---

### Financial Analyst

**Tagline:** "From raw data to board-ready insight — before lunch."

| Agent | Time | Narrative | Inputs | AI Actions | Outputs | Human action | Example output format |
|---|---|---|---|---|---|---|---|
| Analysis | 9:00 AM | Priya's quarterly variance analysis took two days. The Analysis Agent runs it in minutes. | Q3 actuals (CSV); budget model; prior quarter results | Calculates line-item variances; flags >5% deviations; identifies root-cause patterns | Variance table (28 line items); 4 flagged anomalies; draft commentary | Priya validates 3 of 4 flags, adds context to Q3 marketing overspend — 8 min | Table: variance report |
| Data & Reporting | 10:30 AM | Building the exec dashboard used to mean a full morning in Excel. | Revenue data; cost actuals; headcount by department | Aggregates KPIs; computes MoM and YoY deltas; formats exec-ready layout | Board dashboard draft; trend charts described; YoY narrative | Priya adjusts one metric label, approves — 3 min | Table: exec KPI summary |
| Compliance | 1:00 PM | Regulatory filing cross-checks used to require a manual policy review. | Draft disclosure document; current regulatory checklist (SOX, SEC); prior filings | Scans for missing required disclosures; flags 2 potential issues; cites relevant rules | Compliance gap report; 2 flagged items with rule citations; suggested language | Priya reviews flags, sends to counsel — 5 min | Prose: compliance gap memo |
| Research | 2:30 PM | Competitive benchmarking used to be a half-day web research sprint. | 4 peer company names; metrics to benchmark; earnings call transcripts | Extracts margin, revenue growth, and capex ratios; summarizes analyst commentary | Competitive benchmark table; key differentiators noted; 3 talking points | Priya adds one observation, sends to VP — 4 min | Table: peer benchmark |
| Documentation | 4:30 PM | Writing the investment memo narrative used to be the last thing standing between Priya and the weekend. | Analysis outputs; variance commentary; exec dashboard | Drafts memo narrative in house style; structures as situation / analysis / recommendation | Investment memo draft (800 words); structured sections; flagged gaps | Priya edits 2 paragraphs, done — 10 min | Prose: investment memo |

---

### Software Developer

**Tagline:** "Less searching. Less writing. More shipping."

| Agent | Time | Narrative | Inputs | AI Actions | Outputs | Human action | Example output format |
|---|---|---|---|---|---|---|---|
| Research | 9:30 AM | Before starting a new feature, Alex would spend an hour reading docs and Stack Overflow. | Feature requirement doc; codebase context; relevant library docs (React Query v5) | Identifies the right API pattern; finds 2 relevant prior examples in codebase; summarizes tradeoffs | Implementation approach summary; 2 code snippets; library version note | Alex reads summary, chooses approach — 3 min | Code: implementation plan |
| Documentation | 12:00 PM | Writing PR descriptions used to be the last thing anyone wanted to do. | Git diff (47 lines changed); linked Jira ticket; affected test files | Summarizes what changed and why; documents breaking changes; generates test coverage note | PR description draft with summary, changes, and test plan | Alex adds one screenshot, opens PR — 2 min | Code: PR description (markdown) |
| Analysis | 2:00 PM | Debugging a performance regression meant manually reading through profiler output. | Profiler trace (JSON); affected component names; recent git changes | Identifies the hot path; traces the regression to a specific commit; suggests 2 fixes | Root cause summary; suspected commit; 2 fix options with tradeoff | Alex picks fix 1, implements — 5 min | Prose: regression analysis |
| Coordination | 3:30 PM | Sprint planning prep used to mean manually pulling Jira stats and writing the team update. | 12 open tickets; velocity data (last 3 sprints); 2 blocked items | Drafts sprint summary; identifies blockers with owners; suggests de-scope candidates | Sprint status email draft; 2 blockers called out; suggested agenda | Alex sends to team — 1 min | Prose: sprint update |
| Communication | 5:00 PM | Explaining a technical decision to a non-technical stakeholder used to take careful drafting. | Architecture decision record (ADR); stakeholder background; decision summary | Translates technical rationale into plain language; preserves key tradeoffs; adjusts tone for audience | Stakeholder email draft (non-technical); 3-bullet summary; decision rationale | Alex reviews, hits send — 2 min | Prose: stakeholder email |

---

## Animation Behavior

### AgentLoopDiagram

Four phases animate sequentially using Framer Motion `animate` with `transition`:

1. **Inputs phase** (1.5s): The 3 input items fade in one at a time (staggered 0.3s apart). Inputs box has a subtle cyan border glow.
2. **AI Processes phase** (2s): Center "AI" block pulses (scale 1 → 1.03 → 1). The 3 action lines type in one at a time.
3. **Outputs phase** (1.5s): Output items appear with a green check icon, staggered 0.3s.
4. **Human Reviews phase** (1s): The human action text fades in. A "✓ Done" badge appears.
5. **Pause** (2s): All phases visible simultaneously.
6. **Reset + loop**: All items fade out over 0.5s, then phase 1 begins again.

User can click a **pause/play button** (top-right of the loop diagram) to freeze the animation on the current frame.

Switching to a different agent: current animation fades out over 0.3s, new animation starts from phase 1.

**Auto-advance:** When the user is not interacting, the timeline automatically advances to the next agent every 8 seconds (after the current agent's loop completes at least once). This makes the demo feel alive — the day is progressing whether or not the user clicks. Clicking any agent in the timeline overrides auto-advance and locks focus on that agent until the user clicks away or 30 seconds pass with no interaction, at which point auto-advance resumes.

**Ambient state:** The loop animation never fully stops. Even when transitioning between agents, a faint pulse on the center "AI" block persists — the AI is always running.

### AgentOutputPanel

The `content` string from `AgentOutput` plays via a typewriter effect:
- Characters append at ~40 chars/second (fast enough to feel instant, slow enough to read)
- Implemented with `useEffect` + `setInterval` + `useState` tracking current index
- For `format === "code"`: wraps in a code block with a language label badge; characters still type in
- For `format === "table"`: content is a pre-formatted markdown table that types in monospace
- A **"Skip to end"** button appears after 2 seconds so users don't wait

Typewriter resets when the agent changes.

---

## DemoTeaser (homepage + /products)

Shows:
- Role switcher chips (3 roles)
- Agent timeline list for the selected role (module color dot + agent name + before→after time)
- A summary stat bar: total minutes/day + annual value + number of agents
- "See the full demo →" button linking to `/demo`

Does **not** show: the expanded agent view, the loop animation, or the output panel.

The teaser fetches its data from the same server-computed `DemoRoleData[]` passed as a prop (no additional DB call). On the homepage, it's a RSC that calls `computeDemoRoles()` directly. `computeDemoRoles` must be wrapped with Next.js `unstable_cache` (60-second revalidation) so the 3 Supabase queries don't run on every homepage render.

---

## CTA at end of `/demo`

After the last agent step, the timeline shows a "Full suite summary" footer:
- Total minutes reclaimed per day across all agents
- Annual value per person (at this role's median wage)
- Two CTAs side by side:
  - **"Build this for my team"** → `/build-a-team`
  - **"Book a scoping call"** → `/contact`

---

## Out of Scope

- Real AI calls (no LLM API integration — content is fully scripted)
- User-editable demo inputs (no forms inside the demo)
- More than 3 roles at launch
- Mobile-optimized expanded view (timeline collapses to a tab bar on mobile; expanded view scrolls below)
- Video file hosting or embedded MP4s
- Persisting which agent the user last viewed
