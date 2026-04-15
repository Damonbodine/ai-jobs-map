# Interactive Agent Suite Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a role-switchable, full-workday AI agent demo with timeline nav, animated loop diagram, and typewriter output — deployed at `/demo` with a teaser on homepage and `/products`.

**Architecture:** Server component fetches + caches all 3 roles' DB stats via `unstable_cache`. Client tree receives fully-computed `DemoRoleData[]` — no client-side Supabase. Framer Motion drives the 4-phase loop animation; a `useEffect` + `setInterval` typewriter renders agent outputs. Auto-advance timer lives in `AgentSuiteDemo` via `useRef`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, Framer Motion 12, Supabase, Vitest

---

### Task 1: TypeScript types

**Files:**
- Create: `lib/demo/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// lib/demo/types.ts

export type AgentLoopContent = {
  inputs: string[]      // exactly 3 items
  actions: string[]     // exactly 3 items
  outputs: string[]     // exactly 3 items
  humanAction: string   // 1 sentence
}

export type AgentOutput = {
  format: "prose" | "table" | "code"
  label: string         // e.g. "DRAFT DAILY DIGEST"
  content: string       // full text that types in
  language?: string     // only for format === "code"
}

export type DemoAgentStep = {
  moduleKey: string
  agentName: string     // e.g. "Scout"
  label: string         // e.g. "Intake & Triage"
  accentColor: string   // hex
  timeOfDay: string     // e.g. "8:00 AM"
  narrative: string     // 1–2 sentences
  loop: AgentLoopContent
  output: AgentOutput
  beforeMinutes: number
  afterMinutes: number
}

export type DemoRoleData = {
  slug: string
  displayName: string
  tagline: string
  agents: DemoAgentStep[]
  totalBeforeMinutes: number
  totalAfterMinutes: number
  annualValueDollars: number
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/demo/types.ts
git commit -m "feat(demo): add TypeScript types for agent suite demo"
```

---

### Task 2: Scripted content

**Files:**
- Create: `lib/demo/demo-scripts.ts`
- Create: `lib/demo/demo-scripts.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/demo/demo-scripts.test.ts
import { describe, it, expect } from "vitest"
import { DEMO_ROLE_SCRIPTS } from "./demo-scripts"

describe("DEMO_ROLE_SCRIPTS", () => {
  it("has exactly 3 roles", () => {
    expect(DEMO_ROLE_SCRIPTS).toHaveLength(3)
  })

  it("each role has exactly 5 agents", () => {
    for (const role of DEMO_ROLE_SCRIPTS) {
      expect(role.agents).toHaveLength(5)
    }
  })

  it("each agent has loop with exactly 3 inputs, 3 actions, 3 outputs", () => {
    for (const role of DEMO_ROLE_SCRIPTS) {
      for (const agent of role.agents) {
        expect(agent.loop.inputs).toHaveLength(3)
        expect(agent.loop.actions).toHaveLength(3)
        expect(agent.loop.outputs).toHaveLength(3)
        expect(agent.loop.humanAction).toBeTruthy()
      }
    }
  })

  it("each agent has non-empty output content", () => {
    for (const role of DEMO_ROLE_SCRIPTS) {
      for (const agent of role.agents) {
        expect(agent.output.content.length).toBeGreaterThan(50)
      }
    }
  })

  it("role slugs match expected values", () => {
    const slugs = DEMO_ROLE_SCRIPTS.map((r) => r.slug)
    expect(slugs).toContain("general-and-operations-managers")
    expect(slugs).toContain("financial-analysts")
    expect(slugs).toContain("software-developers")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/demo/demo-scripts.test.ts
```
Expected: FAIL — `Cannot find module './demo-scripts'`

- [ ] **Step 3: Write the scripts file**

```typescript
// lib/demo/demo-scripts.ts
import type { AgentLoopContent, AgentOutput } from "./types"

type AgentScript = {
  moduleKey: string
  agentName: string
  label: string
  accentColor: string
  timeOfDay: string
  narrative: string
  loop: AgentLoopContent
  output: AgentOutput
}

type RoleScript = {
  slug: string
  displayName: string
  tagline: string
  agents: AgentScript[]
}

export const DEMO_ROLE_SCRIPTS: RoleScript[] = [
  // ── Operations Manager ──────────────────────────────────────
  {
    slug: "general-and-operations-managers",
    displayName: "Operations Manager",
    tagline: "Running the whole operation — one agent at a time.",
    agents: [
      {
        moduleKey: "intake",
        agentName: "Scout",
        label: "Intake & Triage",
        accentColor: "#06b6d4",
        timeOfDay: "8:00 AM",
        narrative:
          "Mark used to start every morning triaging 30+ emails and Slack threads. Now Scout pre-sorts overnight. By the time he opens his laptop, the day is already organized.",
        loop: {
          inputs: ["31 unread emails", "4 Slack threads flagged", "2 overdue action items"],
          actions: [
            "Scores urgency 1–5 per item",
            "Groups by project and owner",
            "Flags 1 blocker requiring Mark's decision",
          ],
          outputs: [
            "Priority queue (top 5 items)",
            "1 escalation flagged for review",
            "23 items auto-filed by project",
          ],
          humanAction: "Mark reviews top 5 items and confirms the escalation — 2 min total.",
        },
        output: {
          format: "prose",
          label: "MORNING DIGEST",
          content: `Good morning, Mark. Here's what Scout sorted overnight.

PRIORITY QUEUE — 5 items need your attention today:

1. [ESCALATION] Vendor delivery SLA breach — Project Atlas (overdue 2 days). Downstream risk to Thursday launch. Requires your decision by 10am.

2. Budget reforecast request from CFO — due Friday. Assigned to you. No action taken yet.

3. Cross-functional sync with Product — rescheduled twice. Cal flagged this as at-risk. Recommend confirming today.

4. Contractor invoice ($12,400) — pending approval. No blockers. Ready to sign.

5. Q2 headcount plan — Sarah requested your input. Low urgency, due next week.

FILED AUTOMATICALLY (23 items): 14 FYIs, 6 newsletters, 3 status updates with no action required.

Your first decision: Vendor escalation. See the full brief below.`,
        },
      },
      {
        moduleKey: "coordination",
        agentName: "Cal",
        label: "Coordination",
        accentColor: "#10b981",
        timeOfDay: "10:30 AM",
        narrative:
          "Scheduling a cross-functional meeting used to mean 45 minutes of back-and-forth. Cal finds the slot, drafts the invite, and books the room before Mark finishes his coffee.",
        loop: {
          inputs: [
            "6 attendees' calendar availability",
            "Meeting agenda and pre-reads",
            "Conference room inventory",
          ],
          actions: [
            "Finds first mutual 60-min slot in next 3 days",
            "Drafts agenda with pre-read links attached",
            "Books room 3B (available, seats 8)",
          ],
          outputs: [
            "Calendar invite drafted and ready",
            "Agenda doc attached with pre-reads",
            "2 scheduling conflicts noted with alternatives",
          ],
          humanAction: "Mark hits send on the pre-drafted invite — 1 min.",
        },
        output: {
          format: "prose",
          label: "MEETING INVITE DRAFT",
          content: `Subject: Q2 Ops Review — Cross-Functional Sync (60 min)

When: Thursday, April 17 · 2:00–3:00 PM
Where: Conference Room 3B (booked)
Attendees: Mark Chen, Sarah Kim, David Park, Priya Nair, Tom Walsh, Lisa Chen

Hi team,

Scheduling our Q2 ops review. This one's been rescheduled twice — Thursday works for everyone.

AGENDA:
1. Q2 budget reforecast: where we stand (15 min) — Mark
2. Vendor SLA breach: impact and response (20 min) — Sarah
3. Headcount plan update (15 min) — Priya
4. Open blockers + actions (10 min) — All

PRE-READS (please review before the meeting):
- Q2 actuals vs. budget (attached)
- Vendor impact analysis (link)

Note: David has a hard stop at 3:00. Tom is remote — dial-in link included.

See you Thursday,
Mark`,
        },
      },
      {
        moduleKey: "exceptions",
        agentName: "Reed",
        label: "Exceptions",
        accentColor: "#f59e0b",
        timeOfDay: "2:00 PM",
        narrative:
          "A vendor delivery is 2 days late. Normally Mark would spend an hour chasing it manually. Reed identifies the downstream impact, drafts the escalation, and gives him two options before he's even read the alert.",
        loop: {
          inputs: [
            "Vendor SLA breach alert (Atlas project)",
            "Project dependency map",
            "Vendor contact directory",
          ],
          actions: [
            "Identifies 3 downstream tasks blocked by delay",
            "Drafts escalation email to vendor account manager",
            "Proposes 2 mitigation options with tradeoffs",
          ],
          outputs: [
            "Escalation email drafted (ready to send)",
            "Impact summary: Thursday launch at risk",
            "Option A: expedite shipping / Option B: scope reduction",
          ],
          humanAction: "Mark picks Option B, edits one line, sends — 3 min.",
        },
        output: {
          format: "prose",
          label: "ESCALATION BRIEF",
          content: `VENDOR ESCALATION — Project Atlas
Prepared by Reed · April 15, 2:04 PM

SITUATION
Acme Logistics delivery is 2 days overdue (SLA breach). Original due date: April 13. No ETA provided.

DOWNSTREAM IMPACT
- Task: Install hardware (scheduled April 16) — BLOCKED
- Task: QA testing window (April 17–18) — at risk
- Launch date: April 21 — HIGH RISK if not resolved by EOD tomorrow

DRAFT ESCALATION EMAIL (ready to send):

Subject: Urgent: SLA Breach — Atlas Delivery Overdue

Hi Jason,

Our April 13 delivery (PO #AT-4471) is now 2 days past SLA. We have a Thursday install window that cannot move without cascading our April 21 launch.

Please provide a confirmed ETA by 5pm today. If delivery cannot be guaranteed by April 16, I'd like to discuss partial shipment options.

Best,
Mark Chen

OPTIONS
A) Expedite shipping (+$1,200, delivers Wed PM) — preserves launch date
B) Reduce scope for April launch, deliver remainder May 5 — saves cost, delays one feature

Recommendation: Option B preserves relationships and margin. Option A if launch is non-negotiable.`,
        },
      },
      {
        moduleKey: "documentation",
        agentName: "Quill",
        label: "Documentation",
        accentColor: "#8b5cf6",
        timeOfDay: "4:00 PM",
        narrative:
          "End-of-day status updates used to eat 30 minutes of writing from scratch. Quill was in every meeting — it already knows what happened. Mark's job is to read it, not write it.",
        loop: {
          inputs: [
            "Meeting notes from 3 sessions",
            "Slack thread summaries",
            "Task tracker updates (Jira)",
          ],
          actions: [
            "Extracts decisions and action items from each session",
            "Formats as weekly status with owner attribution",
            "Flags 2 items with missing owners",
          ],
          outputs: [
            "Status report draft (ready for review)",
            "8 action items with owners and due dates",
            "2 flagged items needing owner assignment",
          ],
          humanAction: "Mark adds one note and assigns the 2 flagged items — 4 min.",
        },
        output: {
          format: "prose",
          label: "WEEKLY STATUS DRAFT",
          content: `OPERATIONS — WEEKLY STATUS
Week of April 14, 2025 · Prepared by Quill

SUMMARY
Mixed week. Vendor issue (Atlas) adds risk to Thursday launch. Budget reforecast on track. Headcount plan needs Mark's input by Friday.

DECISIONS MADE
- Vendor mitigation: Scope reduction selected (Option B). Mark Chen, April 15.
- Q2 reforecast approach: Bottom-up by department. Sarah Kim, April 14.
- Sprint 12 de-scope: Auth v2 moved to Sprint 13. Tom Walsh, April 14.

ACTION ITEMS
1. Mark Chen — Confirm vendor SLA resolution · Due: April 16
2. Sarah Kim — Submit budget reforecast · Due: April 18
3. Priya Nair — Headcount plan final draft · Due: April 17
4. David Park — QA testing sign-off · Due: April 18
5. [OWNER NEEDED] — Contractor invoice approval ($12,400) · Due: April 16
6. Tom Walsh — Sprint 13 scope confirmation · Due: April 17
7. Lisa Chen — Vendor onboarding docs update · Due: April 21
8. [OWNER NEEDED] — Customer comms re: feature delay · Due: April 17

RISKS
- Atlas launch (April 21): MEDIUM risk pending vendor confirmation
- Headcount plan: LOW risk, minor delay expected`,
        },
      },
      {
        moduleKey: "data_reporting",
        agentName: "Lex",
        label: "Data & Reporting",
        accentColor: "#0ea5e9",
        timeOfDay: "5:00 PM",
        narrative:
          "The weekly ops dashboard used to be a manual spreadsheet pull followed by 20 minutes of narrative writing. Lex ran it overnight. Mark's job is to check the anomalies and share.",
        loop: {
          inputs: [
            "Task completion rates (this week)",
            "Budget actuals vs. forecast",
            "Team utilization data",
          ],
          actions: [
            "Computes variance vs. weekly targets",
            "Identifies 2 anomalies outside normal range",
            "Formats KPI summary for exec review",
          ],
          outputs: [
            "Dashboard narrative draft (exec-ready)",
            "2 flagged anomalies with context",
            "Week-over-week trend summary",
          ],
          humanAction: "Mark approves and forwards to exec team — 2 min.",
        },
        output: {
          format: "table",
          label: "KPI SUMMARY",
          content: `OPERATIONS KPI SUMMARY — Week of April 14
Prepared by Lex

| Metric                  | Target | Actual | Variance | Status     |
|-------------------------|--------|--------|----------|------------|
| Task completion rate    | 85%    | 91%    | +6%      | ✓ On track |
| Budget utilization      | 78%    | 82%    | +4%      | ✓ Normal   |
| Vendor SLA compliance   | 98%    | 94%    | -4%      | ⚠ Flag     |
| Team utilization        | 80%    | 88%    | +8%      | ⚠ Flag     |
| Open action items       | <15    | 12     | -3       | ✓ On track |
| Escalations resolved    | 100%   | 100%   | 0%       | ✓ On track |

ANOMALIES (2)
1. Vendor SLA compliance at 94% (below 98% threshold) — Atlas breach is the primary driver. Expected to normalize next week pending resolution.

2. Team utilization at 88% (above 85% ceiling) — Priya's team absorbed 3 unplanned tasks from Atlas delay. Monitor for burnout signals.

NARRATIVE (exec summary):
Solid week operationally despite the Atlas vendor issue. Task completion and budget both ahead of pace. Two flags worth watching: vendor SLA and team load. Both have clear owners and resolution paths.`,
        },
      },
    ],
  },

  // ── Financial Analyst ───────────────────────────────────────
  {
    slug: "financial-analysts",
    displayName: "Financial Analyst",
    tagline: "From raw data to board-ready insight — before lunch.",
    agents: [
      {
        moduleKey: "analysis",
        agentName: "Iris",
        label: "Analysis",
        accentColor: "#6366f1",
        timeOfDay: "9:00 AM",
        narrative:
          "Priya's quarterly variance analysis used to take two full days. Iris ran it overnight on the Q3 actuals. She opens her laptop to a finished draft — her job is to validate the flags, not find them.",
        loop: {
          inputs: [
            "Q3 actuals export (CSV, 28 line items)",
            "Approved budget model",
            "Q2 comparison results",
          ],
          actions: [
            "Calculates line-item variances vs. budget",
            "Flags 4 deviations exceeding ±5% threshold",
            "Identifies root-cause pattern in marketing cluster",
          ],
          outputs: [
            "Variance table (28 line items with deltas)",
            "4 flagged anomalies with root-cause notes",
            "Draft commentary for each flagged item",
          ],
          humanAction: "Priya validates 3 of 4 flags, adds context to Q3 marketing overspend — 8 min.",
        },
        output: {
          format: "table",
          label: "Q3 VARIANCE REPORT",
          content: `Q3 VARIANCE ANALYSIS — Financial Summary
Prepared by Iris · April 15, 9:04 AM

| Line Item                | Budget    | Actual    | Variance  | % Var  | Flag |
|--------------------------|-----------|-----------|-----------|--------|------|
| Revenue — Product        | $4,200K   | $4,380K   | +$180K    | +4.3%  |      |
| Revenue — Services       | $1,800K   | $1,650K   | -$150K    | -8.3%  | ⚠   |
| COGS — Direct            | $2,100K   | $2,090K   | -$10K     | -0.5%  |      |
| Sales & Marketing        | $890K     | $1,045K   | +$155K    | +17.4% | ⚠   |
| R&D                      | $620K     | $598K     | -$22K     | -3.5%  |      |
| G&A                      | $310K     | $334K     | +$24K     | +7.7%  | ⚠   |
| Headcount (FTE)          | 42        | 45        | +3        | +7.1%  | ⚠   |
| Operating Income         | $2,080K   | $1,963K   | -$117K    | -5.6%  |      |

FLAGGED ANOMALIES (4):

1. Sales & Marketing (+17.4%): Three campaigns ran simultaneously in August (originally planned for Q4). One-time timing issue — not structural. Recommend footnote in board materials.

2. Services Revenue (-8.3%): Two enterprise renewals slipped to Q4. Pipeline confirms both closed Oct 1. No revenue risk.

3. G&A (+7.7%): Legal fees from IP filing ($24K). Non-recurring. No budget impact going forward.

4. Headcount (+3 FTE): Two contractors converted to FTE in August. Approved by HR, not reflected in original budget. Update Q4 plan.`,
        },
      },
      {
        moduleKey: "data_reporting",
        agentName: "Lex",
        label: "Data & Reporting",
        accentColor: "#0ea5e9",
        timeOfDay: "10:30 AM",
        narrative:
          "Building the exec dashboard used to mean a full morning in Excel followed by manual narrative writing. Lex aggregated everything overnight. Priya's job is to check one metric label.",
        loop: {
          inputs: [
            "Revenue and cost actuals (all departments)",
            "Headcount by department",
            "Prior quarter results for comparison",
          ],
          actions: [
            "Aggregates KPIs across 6 departments",
            "Computes MoM and YoY deltas for each",
            "Formats as exec-ready dashboard layout",
          ],
          outputs: [
            "Board dashboard draft with 12 KPIs",
            "MoM and YoY trend data per metric",
            "Narrative summary (3 bullets)",
          ],
          humanAction: "Priya adjusts one metric label and approves for distribution — 3 min.",
        },
        output: {
          format: "table",
          label: "EXEC KPI SUMMARY",
          content: `EXECUTIVE DASHBOARD — Q3 2025
Prepared by Lex

REVENUE
| Metric              | Q3 Actual | Q3 Budget | YoY      | MoM (Sep) |
|---------------------|-----------|-----------|----------|-----------|
| Total Revenue       | $6.03M    | $6.00M    | +12.4%   | +3.1%     |
| ARR (run rate)      | $24.1M    | $23.8M    | +18.2%   | +1.8%     |
| Gross Margin        | 65.3%     | 65.0%     | +0.8pp   | +0.2pp    |
| NRR                 | 108%      | 110%      | -2pp     | flat      |

COSTS
| Metric              | Q3 Actual | Q3 Budget | YoY      |
|---------------------|-----------|-----------|----------|
| Total OpEx          | $4.07M    | $3.82M    | +14.1%   |
| S&M % Revenue       | 17.3%     | 14.8%     | +2.5pp   |
| R&D % Revenue       | 9.9%      | 10.3%     | -0.4pp   |
| G&A % Revenue       | 5.5%      | 5.2%      | +0.3pp   |

KEY MESSAGES
1. Revenue +$30K vs. budget; gross margin holds. Strong quarter operationally.
2. S&M overspend driven by Q4 campaigns pulled forward — one-time, not structural.
3. NRR at 108% — below 110% target. Two slipped renewals close Q4; monitor closely.`,
        },
      },
      {
        moduleKey: "compliance",
        agentName: "Nora",
        label: "Compliance",
        accentColor: "#ef4444",
        timeOfDay: "1:00 PM",
        narrative:
          "Regulatory filing cross-checks used to require a manual policy review taking most of an afternoon. Nora scanned the draft against the current SOX checklist and flagged the gaps before Priya even opened the document.",
        loop: {
          inputs: [
            "Draft 10-Q disclosure document",
            "Current SOX and SEC compliance checklist",
            "Prior quarter filed disclosures",
          ],
          actions: [
            "Scans draft for all required disclosure items",
            "Cross-references against 47-item compliance checklist",
            "Flags 2 potential gaps with rule citations",
          ],
          outputs: [
            "Compliance gap report (2 issues flagged)",
            "Rule citations for each gap (SOX §302, SEC Item 303)",
            "Suggested remediation language for each",
          ],
          humanAction: "Priya reviews both flags and routes to outside counsel — 5 min.",
        },
        output: {
          format: "prose",
          label: "COMPLIANCE GAP MEMO",
          content: `COMPLIANCE REVIEW — 10-Q Draft (Q3 2025)
Prepared by Nora · April 15, 1:02 PM
Status: 2 items require attention before filing

CHECKLIST RESULT: 45 of 47 items confirmed. 2 gaps identified.

─────────────────────────────────────────────
GAP 1: MD&A — Known Trends Disclosure (Item 303)
─────────────────────────────────────────────
Required: SEC Item 303 requires disclosure of any known trends or uncertainties that have had, or the registrant expects will have, a material favorable or unfavorable impact on net sales, revenues, or income.

Current draft: Does not address the S&M timing pull-forward ($155K overspend) as a known trend or one-time event.

Risk: If not disclosed, auditors may flag during review. SEC staff may issue comment.

Suggested language: "During Q3 2025, the Company accelerated planned marketing campaigns originally scheduled for Q4, resulting in S&M expenses approximately 17% above quarterly budget. Management does not expect this timing difference to recur in Q4."

─────────────────────────────────────────────
GAP 2: SOX §302 — Material Weakness Attestation
─────────────────────────────────────────────
Required: CEO/CFO certification must reference any changes in internal controls during the quarter.

Current draft: Certification section is template-only; does not reference the finance system migration completed in August.

Risk: System migrations are typically disclosable as changes affecting internal controls.

Recommend: Confirm with external counsel whether August migration requires explicit disclosure.`,
        },
      },
      {
        moduleKey: "research",
        agentName: "Wren",
        label: "Research",
        accentColor: "#14b8a6",
        timeOfDay: "2:30 PM",
        narrative:
          "Competitive benchmarking used to be a half-day web research sprint. Wren read every earnings transcript, pulled every ratio, and wrote the talking points. Priya's job is to add one observation she already knows.",
        loop: {
          inputs: [
            "4 peer company names and reporting periods",
            "Metrics to benchmark (margin, growth, capex)",
            "Q3 earnings call transcripts",
          ],
          actions: [
            "Extracts margin, revenue growth, and capex ratios for each peer",
            "Summarizes analyst commentary themes from transcripts",
            "Identifies 3 differentiating talking points vs. peers",
          ],
          outputs: [
            "Competitive benchmark table (4 peers, 8 metrics)",
            "Key differentiators noted with evidence",
            "3 talking points for board presentation",
          ],
          humanAction: "Priya adds one observation from a recent customer call, sends to VP — 4 min.",
        },
        output: {
          format: "table",
          label: "PEER BENCHMARK",
          content: `COMPETITIVE BENCHMARK — Q3 2025
Prepared by Wren · Peers: Acme Corp, NovaSoft, Meridian Analytics, Polaris Systems

| Metric              | Our Co   | Acme Corp | NovaSoft | Meridian | Polaris  |
|---------------------|----------|-----------|----------|----------|----------|
| Revenue Growth YoY  | +12.4%   | +8.1%     | +19.3%   | +6.7%    | +14.2%   |
| Gross Margin        | 65.3%    | 61.8%     | 68.4%    | 59.2%    | 63.7%    |
| S&M % Revenue       | 17.3%    | 22.1%     | 18.9%    | 24.4%    | 19.8%    |
| R&D % Revenue       | 9.9%     | 12.4%     | 14.2%    | 8.8%     | 11.3%    |
| Operating Margin    | 22.8%    | 17.2%     | 19.6%    | 15.1%    | 20.4%    |
| NRR                 | 108%     | 104%      | 118%     | 101%     | 107%     |
| ARR per FTE         | $536K    | $410K     | $623K    | $389K    | $498K    |
| Headcount Growth    | +7.1%    | +3.2%     | +24.1%   | +1.8%    | +9.4%    |

ANALYST COMMENTARY THEMES (from Q3 earnings calls):
- Acme: "Investing for efficiency, not growth. Multiple contraction expected."
- NovaSoft: "Land-and-expand strategy driving NRR; high S&M spend is intentional."
- Meridian: "Cost discipline showing results but growth rate concern from several analysts."
- Polaris: "Solid but unexciting — no major product differentiation noted."

TALKING POINTS FOR BOARD:
1. Best-in-class operating margin (22.8%) while maintaining above-median growth — the efficiency narrative is working.
2. NRR at 108% is above Acme and Polaris, but NovaSoft's 118% shows the ceiling. Renewal strategy worth pressure-testing.
3. ARR per FTE ($536K) is second-best in peer group, ahead of Polaris and Acme. Validates lean hiring approach.`,
        },
      },
      {
        moduleKey: "documentation",
        agentName: "Quill",
        label: "Documentation",
        accentColor: "#8b5cf6",
        timeOfDay: "4:30 PM",
        narrative:
          "Writing the investment memo narrative used to be the last thing standing between Priya and the weekend. Quill drafted it from the analysis outputs. She edits 2 paragraphs and it's done.",
        loop: {
          inputs: [
            "Q3 variance analysis and commentary",
            "Exec dashboard KPI summary",
            "Competitive benchmark results",
          ],
          actions: [
            "Drafts memo narrative in house style",
            "Structures as Situation / Analysis / Recommendation",
            "Flags 2 sections needing Priya's input",
          ],
          outputs: [
            "Investment memo draft (~800 words, 3 sections)",
            "Structured headers with supporting data",
            "2 flagged gaps for Priya to complete",
          ],
          humanAction: "Priya edits 2 paragraphs, removes one flag, approves — 10 min.",
        },
        output: {
          format: "prose",
          label: "INVESTMENT MEMO DRAFT",
          content: `INVESTMENT MEMO — Q3 2025 Performance Review
Prepared by Quill · For CFO Review · April 15, 2025

SITUATION

Q3 2025 closed ahead of revenue budget (+$30K, +0.5%) with gross margin holding at 65.3%. Operating income came in at $1.96M against a $2.08M target, a $117K shortfall driven entirely by a planned marketing acceleration. The business is healthy. The variance story is clean and defensible.

Two items warrant board attention: a services revenue timing gap (two enterprise renewals slipped one quarter, both now closed) and an S&M overspend that is structural-looking but isn't. Context matters here.

ANALYSIS

Revenue quality is strong. ARR run rate reached $24.1M (+18.2% YoY), and NRR held at 108% despite the renewal slippage. The pipeline that drove the slip is now converted — Q4 services revenue will reflect it.

The cost picture is noisier. S&M ran 17.4% over budget because the team pulled two Q4 campaigns into Q3 to capitalize on a competitor's pricing misstep. This was the right call operationally. It was not the right call for clean variance optics. Going forward, mid-quarter budget amendments should be logged at the time of the decision, not reconstructed after the fact.

Headcount added 3 FTE above plan (contractor conversions, HR-approved). G&A overage is non-recurring legal fees from IP filing. Neither item recurs.

[PRIYA TO COMPLETE: Add your read on the NRR trajectory and whether 110% is the right Q4 target given the two renewals that slipped.]

RECOMMENDATION

No material concerns. Recommend presenting to the board as a clean quarter with two one-time items — marketing timing and legal fees — that should be footnoted, not flagged. The NRR miss is the one number worth a forward-looking sentence.

[PRIYA TO COMPLETE: Add your recommended Q4 NRR guidance number based on current renewal pipeline.]

Next steps: Finalize Q4 budget model by April 21. Submit 10-Q draft to outside counsel by April 22. Board package due April 28.`,
        },
      },
    ],
  },

  // ── Software Developer ──────────────────────────────────────
  {
    slug: "software-developers",
    displayName: "Software Developer",
    tagline: "Less searching. Less writing. More shipping.",
    agents: [
      {
        moduleKey: "research",
        agentName: "Wren",
        label: "Research",
        accentColor: "#14b8a6",
        timeOfDay: "9:30 AM",
        narrative:
          "Before starting a new feature, Alex would spend an hour reading docs and Stack Overflow. Wren read React Query v5's full changelog, found 2 prior examples in the codebase, and summarized the tradeoffs. Alex chooses an approach in 3 minutes.",
        loop: {
          inputs: [
            "Feature requirement doc (infinite scroll pagination)",
            "Codebase context (existing data-fetching patterns)",
            "React Query v5 documentation",
          ],
          actions: [
            "Identifies the right useSuspenseInfiniteQuery pattern for v5",
            "Finds 2 relevant prior implementations in codebase",
            "Summarizes breaking change tradeoffs vs. v4 approach",
          ],
          outputs: [
            "Implementation approach summary (3 options ranked)",
            "2 code snippets from existing codebase",
            "Library version compatibility note",
          ],
          humanAction: "Alex reads the summary, picks Approach 1, starts building — 3 min.",
        },
        output: {
          format: "code",
          label: "IMPLEMENTATION PLAN",
          language: "markdown",
          content: `# Infinite Scroll Pagination — Implementation Approach
Prepared by Wren · React Query v5 · April 15, 9:32 AM

## Recommended: Approach 1 — useSuspenseInfiniteQuery (v5 native)

React Query v5 changed \`useInfiniteQuery\` → \`useSuspenseInfiniteQuery\` with a new \`initialPageParam\` required field. The old \`getNextPageParam\` approach still works but is now typed differently.

\`\`\`typescript
// New v5 pattern (use this)
const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
  queryKey: ['jobs', filters],
  queryFn: ({ pageParam }) => fetchJobs({ cursor: pageParam, ...filters }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})
\`\`\`

**Prior example in codebase:** \`components/browse/OccupationList.tsx:47\`
(uses the same cursor-based pattern, just on a different entity)

## Approach 2 — Offset pagination (simpler, less scalable)
Only use if cursor-based pagination isn't supported by the API endpoint.

## Approach 3 — Manual scroll listener
Don't use — IntersectionObserver via \`@tanstack/react-virtual\` is already in the project.

## Breaking change note
v5 removed the \`onSuccess\`/\`onError\` callbacks. Use \`useEffect\` watching \`data\` instead.
See: \`lib/hooks/useOccupationSearch.ts:23\` for the updated pattern.`,
        },
      },
      {
        moduleKey: "documentation",
        agentName: "Quill",
        label: "Documentation",
        accentColor: "#8b5cf6",
        timeOfDay: "12:00 PM",
        narrative:
          "Writing PR descriptions used to be the last thing anyone wanted to do. Quill read the diff, the Jira ticket, and the test files. Alex adds one screenshot and opens the PR.",
        loop: {
          inputs: [
            "Git diff (47 lines changed, 3 files)",
            "Linked Jira ticket (PROD-1204)",
            "Affected test files",
          ],
          actions: [
            "Summarizes what changed and why in plain language",
            "Documents any breaking changes or migration notes",
            "Generates test coverage note from test files",
          ],
          outputs: [
            "PR description draft with Summary, Changes, and Test Plan",
            "Breaking change section (none detected)",
            "Test coverage note (2 new tests added)",
          ],
          humanAction: "Alex adds one screenshot to the PR, hits open — 2 min.",
        },
        output: {
          format: "code",
          label: "PR DESCRIPTION",
          language: "markdown",
          content: `## Summary
Adds infinite scroll pagination to the job listings page using React Query v5's \`useSuspenseInfiniteQuery\`. Replaces the previous "Load more" button with automatic scroll-triggered fetching.

Fixes: PROD-1204

## Changes
- \`components/browse/JobList.tsx\` — Replaced \`useQuery\` with \`useSuspenseInfiniteQuery\`; added IntersectionObserver trigger at list bottom
- \`lib/hooks/useJobSearch.ts\` — Updated to cursor-based pagination; removed deprecated \`onSuccess\` callback
- \`app/browse/page.tsx\` — Wrapped JobList in \`<Suspense>\` boundary (required for Suspense variant)

## Breaking Changes
None. The API contract is unchanged. Old offset-based endpoints still work.

## Test Plan
- [x] \`useJobSearch.test.ts\` — 2 new tests: cursor pagination, empty next page
- [x] \`JobList.test.tsx\` — IntersectionObserver mock verifies fetchNextPage called on scroll
- [ ] Manual: verify no double-fetch on mount in Strict Mode
- [ ] Manual: verify scroll position preserved on browser back

## Screenshots
[Add screenshot of infinite scroll in action]`,
        },
      },
      {
        moduleKey: "analysis",
        agentName: "Iris",
        label: "Analysis",
        accentColor: "#6366f1",
        timeOfDay: "2:00 PM",
        narrative:
          "Debugging a performance regression meant manually reading through profiler output for an hour. Iris traced it to a specific commit in 3 minutes. Alex picks a fix and implements.",
        loop: {
          inputs: [
            "Chrome profiler trace (JSON, 2.4MB)",
            "Affected component names (JobCard, JobList)",
            "Recent git log (last 14 days)",
          ],
          actions: [
            "Identifies the hot path causing 180ms render delay",
            "Traces regression to commit abc1234 (April 11)",
            "Proposes 2 fixes with performance tradeoff analysis",
          ],
          outputs: [
            "Root cause summary with evidence",
            "Suspected commit and changed line",
            "Fix A (memo) vs Fix B (query refactor) with benchmarks",
          ],
          humanAction: "Alex picks Fix A, implements in 15 minutes, re-runs profiler — 5 min decision.",
        },
        output: {
          format: "prose",
          label: "REGRESSION ANALYSIS",
          content: `PERFORMANCE REGRESSION ANALYSIS
Prepared by Iris · April 15, 2:03 PM
Component: JobList → JobCard (rendering 50 items)

ROOT CAUSE
The profiler trace shows JobCard re-rendering on every parent state change, even when props are unchanged. The hot path is: JobList (state update) → all 50 JobCards (re-render) → 50 × formatSalary() calls.

formatSalary() is not memoized and runs a regex + Intl.NumberFormat on each render. At 50 items, this accounts for ~165ms of the observed 180ms delay.

SUSPECTED COMMIT
Commit abc1234 (April 11, 2:30 PM) — "feat: add real-time filter count badge"
Changed line: JobList.tsx:34 — moved filter count state into JobList instead of a separate FilterBar component. This caused JobList to re-render on every keystroke, taking all 50 JobCards with it.

OPTIONS
Fix A — Memoize JobCard with React.memo
  + Simple, 2-line change
  + Benchmark: renders drop from 50 → 1 on filter change
  - Doesn't fix the underlying state placement issue

Fix B — Move filter count state back to FilterBar
  + Fixes root cause, correct architecture
  + Benchmark: same result as Fix A
  - Requires refactoring FilterBar ↔ JobList interface
  - Riskier, touches more code

Recommendation: Fix A now (ship the perf fix today), Fix B in a cleanup PR next sprint.`,
        },
      },
      {
        moduleKey: "coordination",
        agentName: "Cal",
        label: "Coordination",
        accentColor: "#10b981",
        timeOfDay: "3:30 PM",
        narrative:
          "Sprint planning prep used to mean manually pulling Jira stats and writing a team update. Cal pulled the last 3 sprints, identified blockers, and drafted the email. Alex sends it without editing.",
        loop: {
          inputs: [
            "12 open Jira tickets with status",
            "Velocity data (last 3 sprints)",
            "2 tickets marked as blocked",
          ],
          actions: [
            "Drafts sprint status summary with ticket counts",
            "Identifies blockers with current owners",
            "Suggests 2 de-scope candidates based on velocity trend",
          ],
          outputs: [
            "Sprint status email draft (ready to send)",
            "2 blockers called out with owner names",
            "Suggested agenda for sprint planning",
          ],
          humanAction: "Alex forwards to the team without edits — 1 min.",
        },
        output: {
          format: "prose",
          label: "SPRINT UPDATE",
          content: `Subject: Sprint 12 Update + Sprint 13 Prep

Hey team,

Quick status going into sprint planning tomorrow.

SPRINT 12 (ending Friday)
- 8 of 12 tickets done ✓
- 2 in review (PROD-1198, PROD-1201)
- 2 blocked (details below)
- Velocity: 34 points (vs. 31 avg last 3 sprints) — good week

BLOCKERS
1. PROD-1199 (Auth token refresh) — blocked on security review. Owner: Tom. ETA unknown. Recommend moving to Sprint 13 unless Tom gets sign-off today.

2. PROD-1203 (CSV export) — blocked on design spec. Owner: Lisa (design). Alex to follow up before EOD.

SPRINT 13 PLANNING (tomorrow 10am)
Capacity: 32 points (Tom is out Weds–Fri)
Backlog top 5 ready for sprint: PROD-1204, 1207, 1209, 1212, 1215

DE-SCOPE CANDIDATES (if capacity is tight):
- PROD-1212 (analytics dashboard v2) — nice-to-have, no external dependency
- PROD-1215 (bulk export) — customer request but no SLA commitment

See you at 10.
Alex`,
        },
      },
      {
        moduleKey: "communication",
        agentName: "Cleo",
        label: "Communication",
        accentColor: "#f97316",
        timeOfDay: "5:00 PM",
        narrative:
          "Explaining a technical decision to a non-technical stakeholder used to take careful drafting and second-guessing every word. Cleo translated the ADR into plain language. Alex reviews and hits send.",
        loop: {
          inputs: [
            "Architecture decision record (ADR-007: move to cursor pagination)",
            "Stakeholder background (VP of Product, non-technical)",
            "Decision summary from Alex",
          ],
          actions: [
            "Translates technical rationale into plain language",
            "Preserves key tradeoffs without jargon",
            "Adjusts tone for a VP-level, business-outcome audience",
          ],
          outputs: [
            "Stakeholder email draft (non-technical, clear)",
            "3-bullet summary of the decision",
            "One-sentence business case",
          ],
          humanAction: "Alex reads it, likes it, hits send — 2 min.",
        },
        output: {
          format: "prose",
          label: "STAKEHOLDER EMAIL",
          content: `Subject: Update on job listings performance — what we changed and why

Hi Rachel,

Quick update on a technical change we shipped this week that you'll notice in the product.

WHAT CHANGED
The "Load more" button on the job listings page is gone. It now loads automatically as you scroll — same way LinkedIn or Twitter work. We also fixed a slowdown that was making filters feel laggy on pages with 50+ results.

WHY WE DID IT
Two reasons:
1. The scroll behavior is just better. Drop-off data showed users were stopping at the button instead of continuing. Auto-scroll should improve engagement on longer searches.
2. The performance fix was necessary before we can scale the listings. We were running into a wall at 50 items — now we can handle 500+ without slowing down.

WHAT YOU MIGHT NOTICE
- Listings load as you scroll instead of clicking a button
- Filters feel snappier (the lag on every keystroke is fixed)
- No change to the data or which jobs appear — just how you navigate them

No action needed on your end. Let me know if anything looks off.

Alex`,
        },
      },
    ],
  },
]
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run lib/demo/demo-scripts.test.ts
```
Expected: 5 passing

- [ ] **Step 5: Commit**

```bash
git add lib/demo/demo-scripts.ts lib/demo/demo-scripts.test.ts
git commit -m "feat(demo): add scripted content for all 3 roles (15 agent steps)"
```

---

### Task 3: Compute logic

**Files:**
- Create: `lib/demo/compute-demo.ts`
- Create: `lib/demo/compute-demo.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/demo/compute-demo.test.ts
import { describe, it, expect } from "vitest"
import { buildDemoRoleStats } from "./compute-demo"
import type { DemoAgentStep } from "./types"

// Minimal fixture matching the RoleInput shape
const mockTasks = [
  { id: 1, occupation_id: 10, task_name: "Triage emails", task_description: "", frequency: "daily" as const, ai_applicable: true, ai_impact_level: 5, ai_effort_to_implement: 2, ai_category: null, ai_how_it_helps: null, ai_tools: null },
  { id: 2, occupation_id: 10, task_name: "Write reports", task_description: "", frequency: "daily" as const, ai_applicable: true, ai_impact_level: 3, ai_effort_to_implement: 3, ai_category: null, ai_how_it_helps: null, ai_tools: null },
  { id: 3, occupation_id: 10, task_name: "Physical task", task_description: "", frequency: "daily" as const, ai_applicable: false, ai_impact_level: null, ai_effort_to_implement: null, ai_category: null, ai_how_it_helps: null, ai_tools: null },
]

const mockProfile = {
  id: 1, occupation_id: 10, composite_score: 70, work_activity_automation_potential: null,
  time_range_low: 40, time_range_high: 80, physical_ability_avg: 1.0,
}

const mockPartialAgents: Pick<DemoAgentStep, "moduleKey" | "agentName" | "label" | "accentColor" | "timeOfDay" | "narrative" | "loop" | "output">[] = [
  {
    moduleKey: "intake",
    agentName: "Scout",
    label: "Intake & Triage",
    accentColor: "#06b6d4",
    timeOfDay: "8:00 AM",
    narrative: "Test narrative",
    loop: { inputs: ["a", "b", "c"], actions: ["x", "y", "z"], outputs: ["1", "2", "3"], humanAction: "Review" },
    output: { format: "prose", label: "TEST", content: "Test output" },
  },
]

describe("buildDemoRoleStats", () => {
  it("returns afterMinutes < beforeMinutes for each agent", () => {
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: mockProfile, tasks: mockTasks },
      mockPartialAgents
    )
    for (const agent of result.agents) {
      expect(agent.afterMinutes).toBeLessThan(agent.beforeMinutes)
    }
  })

  it("totalBeforeMinutes equals sum of agent beforeMinutes", () => {
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: mockProfile, tasks: mockTasks },
      mockPartialAgents
    )
    const sum = result.agents.reduce((s, a) => s + a.beforeMinutes, 0)
    expect(result.totalBeforeMinutes).toBe(sum)
  })

  it("annualValueDollars is positive when hourly_wage is set", () => {
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: mockProfile, tasks: mockTasks },
      mockPartialAgents
    )
    expect(result.annualValueDollars).toBeGreaterThan(0)
  })

  it("skips non-ai_applicable tasks", () => {
    const allNonAi = mockTasks.map((t) => ({ ...t, ai_applicable: false }))
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: null, tasks: allNonAi },
      mockPartialAgents
    )
    // With no AI tasks, all stats should fall back gracefully
    expect(result.totalBeforeMinutes).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run lib/demo/compute-demo.test.ts
```
Expected: FAIL — `Cannot find module './compute-demo'`

- [ ] **Step 3: Write the module**

```typescript
// lib/demo/compute-demo.ts
import { unstable_cache } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import {
  estimateTaskMinutes,
  inferArchetypeMultiplier,
  computeDisplayedTimeback,
} from "@/lib/timeback"
import { impactRetentionFactor } from "@/lib/pdf/team-deck-data"
import { getBlockForTask } from "@/lib/blueprint"
import { computeAnnualValue } from "@/lib/pricing"
import { DEMO_ROLE_SCRIPTS } from "./demo-scripts"
import type { DemoRoleData, DemoAgentStep } from "./types"
import type { Occupation, MicroTask, AutomationProfile } from "@/types"

type RoleInput = {
  occupation: Occupation
  profile: AutomationProfile | null
  tasks: MicroTask[]
}

type PartialAgentScript = Omit<DemoAgentStep, "beforeMinutes" | "afterMinutes">

export function buildDemoRoleStats(
  input: RoleInput,
  scriptAgents: PartialAgentScript[]
): DemoRoleData {
  const { occupation, profile, tasks } = input
  const aiTasks = tasks.filter((t) => t.ai_applicable)
  const archetypeMultiplier = inferArchetypeMultiplier(profile)

  const { displayedMinutes } = computeDisplayedTimeback(profile, tasks, 0)
  const totalRawMinutes = aiTasks.reduce(
    (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier,
    0
  )
  const displayedScaleFactor = displayedMinutes / Math.max(totalRawMinutes, 1)

  // Group tasks by module key
  const moduleTaskMap = new Map<string, MicroTask[]>()
  for (const task of aiTasks) {
    const key = getBlockForTask(task)
    const existing = moduleTaskMap.get(key) ?? []
    existing.push(task)
    moduleTaskMap.set(key, existing)
  }

  // Compute before/after per module
  const agents: DemoAgentStep[] = scriptAgents.map((script) => {
    const moduleTasks = moduleTaskMap.get(script.moduleKey) ?? []
    let beforeMinutes = 0
    let afterMinutes = 0
    for (const t of moduleTasks) {
      const rawMinutes = estimateTaskMinutes(t) * archetypeMultiplier
      const scaled = Math.round(rawMinutes * displayedScaleFactor)
      const retention = impactRetentionFactor(t.ai_impact_level)
      beforeMinutes += scaled
      afterMinutes += Math.max(1, Math.round(scaled * retention))
    }
    // Ensure at least 1 minute each
    beforeMinutes = Math.max(1, beforeMinutes)
    afterMinutes = Math.max(1, Math.min(afterMinutes, beforeMinutes - 1))
    return { ...script, beforeMinutes, afterMinutes }
  })

  const totalBeforeMinutes = agents.reduce((s, a) => s + a.beforeMinutes, 0)
  const totalAfterMinutes = agents.reduce((s, a) => s + a.afterMinutes, 0)
  const minutesSaved = totalBeforeMinutes - totalAfterMinutes
  const annualValueDollars = computeAnnualValue(minutesSaved, occupation.hourly_wage)

  // Find the matching script for role-level fields
  const roleScript = DEMO_ROLE_SCRIPTS.find((r) => r.slug === occupation.slug)

  return {
    slug: occupation.slug,
    displayName: roleScript?.displayName ?? occupation.title,
    tagline: roleScript?.tagline ?? "",
    agents,
    totalBeforeMinutes,
    totalAfterMinutes,
    annualValueDollars,
  }
}

async function fetchRoleData(slug: string): Promise<RoleInput | null> {
  const supabase = createServerClient()

  const { data: occupation } = await supabase
    .from("occupations")
    .select("id, title, slug, major_category, sub_category, employment, hourly_wage, annual_wage")
    .eq("slug", slug)
    .single()

  if (!occupation) return null

  const [{ data: tasks }, { data: profile }] = await Promise.all([
    supabase
      .from("job_micro_tasks")
      .select("id, occupation_id, task_name, task_description, frequency, ai_applicable, ai_how_it_helps, ai_impact_level, ai_effort_to_implement, ai_category, ai_tools")
      .eq("occupation_id", occupation.id),
    supabase
      .from("automation_profiles")
      .select("id, occupation_id, composite_score, work_activity_automation_potential, time_range_low, time_range_high, physical_ability_avg")
      .eq("occupation_id", occupation.id)
      .single(),
  ])

  return {
    occupation: occupation as Occupation,
    profile: profile ?? null,
    tasks: (tasks ?? []) as MicroTask[],
  }
}

export const computeDemoRoles: () => Promise<DemoRoleData[]> = unstable_cache(
  async (): Promise<DemoRoleData[]> => {
    const roleInputs = await Promise.all(
      DEMO_ROLE_SCRIPTS.map((r) => fetchRoleData(r.slug))
    )

    return roleInputs
      .map((input, i) => {
        if (!input) return null
        const script = DEMO_ROLE_SCRIPTS[i]
        return buildDemoRoleStats(input, script.agents)
      })
      .filter((r): r is DemoRoleData => r !== null)
  },
  ["demo-roles"],
  { revalidate: 60 }
)
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run lib/demo/compute-demo.test.ts
```
Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add lib/demo/compute-demo.ts lib/demo/compute-demo.test.ts
git commit -m "feat(demo): add compute-demo with buildDemoRoleStats + cached computeDemoRoles"
```

---

### Task 4: AgentLoopDiagram component

**Files:**
- Create: `components/demo/AgentLoopDiagram.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/demo/AgentLoopDiagram.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import type { AgentLoopContent } from "@/lib/demo/types"

type Phase = "inputs" | "ai" | "outputs" | "human" | "pause"

const PHASE_DURATIONS: Record<Phase, number> = {
  inputs: 1500,
  ai: 2000,
  outputs: 1500,
  human: 1000,
  pause: 2000,
}

const PHASES: Phase[] = ["inputs", "ai", "outputs", "human", "pause"]

type Props = {
  loop: AgentLoopContent
  agentName: string
  accentColor: string
}

export function AgentLoopDiagram({ loop, agentName, accentColor }: Props) {
  const [phase, setPhase] = useState<Phase>("inputs")
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleNext(currentPhase: Phase) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const idx = PHASES.indexOf(currentPhase)
      const next = PHASES[(idx + 1) % PHASES.length]
      setPhase(next)
    }, PHASE_DURATIONS[currentPhase])
  }

  // Reset + restart when loop content changes (agent switch)
  useEffect(() => {
    setPhase("inputs")
    setPaused(false)
  }, [loop])

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    scheduleNext(phase)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused])

  const isActive = (p: Phase) =>
    PHASES.indexOf(phase) >= PHASES.indexOf(p) || phase === "pause"

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#0f0f0e] border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-xs font-medium text-white/50">
          {agentName} is processing
        </span>
        <button
          onClick={() => setPaused((p) => !p)}
          className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      {/* Loop diagram */}
      <div className="grid grid-cols-4 gap-0 p-4">
        {/* Inputs */}
        <LoopBox
          active={isActive("inputs")}
          accentColor={accentColor}
          label="INPUTS"
          phase="inputs"
          currentPhase={phase}
        >
          {loop.inputs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={
                isActive("inputs") ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }
              }
              transition={{ delay: i * 0.3, duration: 0.35 }}
              className="text-[10px] text-white/60 leading-snug py-0.5"
            >
              {item}
            </motion.div>
          ))}
        </LoopBox>

        {/* Arrow */}
        <Arrow active={isActive("ai")} />

        {/* AI Processes */}
        <LoopBox
          active={isActive("ai")}
          accentColor="#ffffff"
          label="AI PROCESSES"
          phase="ai"
          currentPhase={phase}
          isAi
        >
          {loop.actions.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={
                isActive("ai") ? { opacity: 1 } : { opacity: 0 }
              }
              transition={{ delay: i * 0.4, duration: 0.3 }}
              className="text-[10px] text-white/60 leading-snug py-0.5"
            >
              {item}
            </motion.div>
          ))}
          {/* Pulse ring */}
          <motion.div
            animate={
              phase === "ai"
                ? { scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }
                : { scale: 1, opacity: 0.2 }
            }
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none"
          />
        </LoopBox>

        {/* Arrow */}
        <Arrow active={isActive("outputs")} />

        {/* Outputs */}
        <LoopBox
          active={isActive("outputs")}
          accentColor="#10b981"
          label="OUTPUTS"
          phase="outputs"
          currentPhase={phase}
        >
          {loop.outputs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={
                isActive("outputs") ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }
              }
              transition={{ delay: i * 0.3, duration: 0.35 }}
              className="flex items-start gap-1.5 py-0.5"
            >
              {isActive("outputs") && (
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="text-[10px] text-white/60 leading-snug">{item}</span>
            </motion.div>
          ))}
        </LoopBox>

        {/* Arrow */}
        <Arrow active={isActive("human")} />

        {/* Human Reviews */}
        <LoopBox
          active={isActive("human")}
          accentColor="#ffffff"
          label="HUMAN REVIEWS"
          phase="human"
          currentPhase={phase}
          dashed
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={isActive("human") ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[10px] text-white/50 leading-relaxed"
          >
            {loop.humanAction}
          </motion.p>
          <AnimatePresence>
            {isActive("human") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-2 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full"
              >
                <Check className="w-2 h-2" /> Done
              </motion.div>
            )}
          </AnimatePresence>
        </LoopBox>
      </div>

      {/* Ambient AI pulse — always running */}
      <motion.div
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(ellipse at center, ${accentColor}22, transparent 70%)` }}
      />
    </div>
  )
}

function LoopBox({
  active,
  accentColor,
  label,
  children,
  isAi = false,
  dashed = false,
}: {
  active: boolean
  accentColor: string
  label: string
  phase: Phase
  currentPhase: Phase
  children: React.ReactNode
  isAi?: boolean
  dashed?: boolean
}) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.35 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col gap-1 p-3 rounded-lg min-h-[100px]"
      style={{
        background: isAi ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px ${dashed ? "dashed" : "solid"} ${
          active ? `${accentColor}66` : "rgba(255,255,255,0.08)"
        }`,
      }}
    >
      {isAi && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: accentColor === "#ffffff" ? "#3b82f6" : accentColor, color: "white" }}
        >
          AI
        </div>
      )}
      <span
        className="text-[8px] font-bold tracking-widest mb-1"
        style={{ color: active ? accentColor : "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
      {children}
    </motion.div>
  )
}

function Arrow({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{ opacity: active ? 0.7 : 0.2 }}
      className="flex items-center justify-center text-white/40 text-lg pb-6"
    >
      →
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/demo/AgentLoopDiagram.tsx
git commit -m "feat(demo): add AgentLoopDiagram 4-phase Framer Motion animation"
```

---

### Task 5: AgentOutputPanel component

**Files:**
- Create: `components/demo/AgentOutputPanel.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/demo/AgentOutputPanel.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import type { AgentOutput } from "@/lib/demo/types"

const CHARS_PER_SECOND = 40

type Props = {
  output: AgentOutput
  agentName: string
}

export function AgentOutputPanel({ output, agentName }: Props) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const [showSkip, setShowSkip] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when output changes (agent switch)
  useEffect(() => {
    setDisplayedLength(0)
    setShowSkip(false)

    if (intervalRef.current) clearInterval(intervalRef.current)
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current)

    const msPerChar = 1000 / CHARS_PER_SECOND
    intervalRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= output.content.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return prev
        }
        return prev + 1
      })
    }, msPerChar)

    // Show skip button after 2 seconds
    skipTimerRef.current = setTimeout(() => setShowSkip(true), 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
    }
  }, [output])

  const displayedText = output.content.slice(0, displayedLength)
  const isDone = displayedLength >= output.content.length

  function skip() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayedLength(output.content.length)
    setShowSkip(false)
  }

  return (
    <div className="rounded-xl overflow-hidden bg-[#0f0f0e] border border-white/8">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-widest text-white/40">
            {output.label}
          </span>
          {output.format === "code" && output.language && (
            <span className="text-[8px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">
              {output.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isDone && showSkip && (
            <button
              onClick={skip}
              className="text-[9px] text-white/40 hover:text-white/70 transition-colors"
            >
              Skip to end →
            </button>
          )}
          {isDone && (
            <span className="text-[9px] text-emerald-500/70">{agentName} · complete</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-60 overflow-y-auto">
        {output.format === "code" || output.format === "table" ? (
          <pre className="text-[10px] font-mono text-white/70 whitespace-pre-wrap leading-relaxed">
            {displayedText}
            {!isDone && <span className="animate-pulse text-white/50">▌</span>}
          </pre>
        ) : (
          <p className="text-[11px] text-white/70 whitespace-pre-wrap leading-relaxed">
            {displayedText}
            {!isDone && <span className="animate-pulse text-white/50">▌</span>}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/demo/AgentOutputPanel.tsx
git commit -m "feat(demo): add AgentOutputPanel typewriter component"
```

---

### Task 6: DemoTimeline component

**Files:**
- Create: `components/demo/DemoTimeline.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/demo/DemoTimeline.tsx
"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { DemoRoleData } from "@/lib/demo/types"

type Props = {
  roles: DemoRoleData[]
  activeRoleSlug: string
  activeAgentIndex: number
  onRoleChange: (slug: string) => void
  onAgentSelect: (index: number) => void
}

export function DemoTimeline({
  roles,
  activeRoleSlug,
  activeAgentIndex,
  onRoleChange,
  onAgentSelect,
}: Props) {
  const activeRole = roles.find((r) => r.slug === activeRoleSlug) ?? roles[0]

  return (
    <div className="flex flex-col h-full">
      {/* Role switcher chips */}
      <div className="flex flex-wrap gap-1.5 p-4 border-b border-border">
        {roles.map((role) => (
          <button
            key={role.slug}
            onClick={() => onRoleChange(role.slug)}
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors",
              role.slug === activeRoleSlug
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            )}
          >
            {role.displayName}
          </button>
        ))}
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-3 pb-2 text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
          {activeRole.displayName}&apos;s day
        </div>

        <div className="flex flex-col gap-0.5 px-2">
          {activeRole.agents.map((agent, i) => {
            const isActive = i === activeAgentIndex
            return (
              <motion.button
                key={agent.moduleKey}
                onClick={() => onAgentSelect(i)}
                initial={false}
                animate={isActive ? { backgroundColor: "hsl(var(--foreground))" } : { backgroundColor: "transparent" }}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                  isActive ? "text-background" : "hover:bg-muted/50"
                )}
              >
                <div className="text-[9px] mb-1" style={{ color: isActive ? "rgba(255,255,255,0.5)" : "#999" }}>
                  {agent.timeOfDay}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: agent.accentColor }}
                  />
                  <span className={cn("text-[11px] font-bold", isActive ? "text-white" : "text-foreground")}>
                    {agent.agentName}
                  </span>
                </div>
                <div className="text-[9px] mt-0.5 pl-3.5" style={{ color: isActive ? "rgba(255,255,255,0.45)" : "#aaa" }}>
                  {agent.label}
                </div>
                {isActive && (
                  <div className="text-[9px] mt-1 pl-3.5 font-semibold text-emerald-400">
                    {agent.beforeMinutes} min → {agent.afterMinutes} min
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="p-3 border-t border-border">
        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50">
          <div className="text-[8px] font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-1 uppercase">
            Total reclaimed
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300">
            {activeRole.totalBeforeMinutes - activeRole.totalAfterMinutes} min
          </div>
          <div className="text-[9px] text-blue-500 dark:text-blue-400">every single day</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/demo/DemoTimeline.tsx
git commit -m "feat(demo): add DemoTimeline left panel with role switcher and agent list"
```

---

### Task 7: AgentExpandedView component

**Files:**
- Create: `components/demo/AgentExpandedView.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/demo/AgentExpandedView.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AgentLoopDiagram } from "./AgentLoopDiagram"
import { AgentOutputPanel } from "./AgentOutputPanel"
import type { DemoAgentStep } from "@/lib/demo/types"

type Props = {
  agent: DemoAgentStep
}

export function AgentExpandedView({ agent }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${agent.moduleKey}-${agent.agentName}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 h-full overflow-y-auto"
      >
        {/* Agent header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: agent.accentColor }}
            />
            <span
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ color: agent.accentColor }}
            >
              {agent.label}
            </span>
          </div>
          <h2 className="text-xl font-black text-foreground leading-tight">{agent.agentName}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-lg">
            {agent.narrative}
          </p>
          <div className="text-[9px] text-muted-foreground mt-1">
            {agent.timeOfDay} · Saves {agent.beforeMinutes - agent.afterMinutes} minutes daily
          </div>
        </div>

        {/* Loop animation */}
        <AgentLoopDiagram
          loop={agent.loop}
          agentName={agent.agentName}
          accentColor={agent.accentColor}
        />

        {/* Output panel */}
        <AgentOutputPanel output={agent.output} agentName={agent.agentName} />

        {/* Before / After */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-100 dark:border-red-900/30">
            <div className="text-[8px] font-bold tracking-wider text-red-600 dark:text-red-400 mb-2 uppercase">
              Before
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">
              {agent.beforeMinutes} min
            </div>
            <div className="text-[9px] text-red-500/70 mt-0.5">manual work</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/30">
            <div className="text-[8px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 uppercase">
              After
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {agent.afterMinutes} min
            </div>
            <div className="text-[9px] text-emerald-500/70 mt-0.5">to review &amp; approve</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/demo/AgentExpandedView.tsx
git commit -m "feat(demo): add AgentExpandedView right panel"
```

---

### Task 8: AgentSuiteDemo main component

**Files:**
- Create: `components/demo/AgentSuiteDemo.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/demo/AgentSuiteDemo.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DemoTimeline } from "./DemoTimeline"
import { AgentExpandedView } from "./AgentExpandedView"
import type { DemoRoleData } from "@/lib/demo/types"

const AUTO_ADVANCE_INTERVAL = 8000  // ms per agent
const IDLE_RESET_DELAY = 30000      // ms before auto-advance resumes after interaction

type Props = {
  roles: DemoRoleData[]
  teaser?: false
}

export function AgentSuiteDemo({ roles }: Props) {
  const [activeRoleSlug, setActiveRoleSlug] = useState(roles[0]?.slug ?? "")
  const [activeAgentIndex, setActiveAgentIndex] = useState(0)
  const [isUserInteracting, setIsUserInteracting] = useState(false)

  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeRole = roles.find((r) => r.slug === activeRoleSlug) ?? roles[0]

  function startAutoAdvance() {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
    autoAdvanceRef.current = setInterval(() => {
      setActiveAgentIndex((prev) => {
        const agents = roles.find((r) => r.slug === activeRoleSlug)?.agents ?? []
        return (prev + 1) % agents.length
      })
    }, AUTO_ADVANCE_INTERVAL)
  }

  function stopAutoAdvance() {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
  }

  function resetIdleTimer() {
    if (idleResetRef.current) clearTimeout(idleResetRef.current)
    idleResetRef.current = setTimeout(() => {
      setIsUserInteracting(false)
    }, IDLE_RESET_DELAY)
  }

  // Start auto-advance on mount
  useEffect(() => {
    startAutoAdvance()
    return () => stopAutoAdvance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoleSlug])

  // Pause/resume based on user interaction
  useEffect(() => {
    if (isUserInteracting) {
      stopAutoAdvance()
    } else {
      startAutoAdvance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserInteracting])

  const handleAgentSelect = useCallback(
    (index: number) => {
      setActiveAgentIndex(index)
      setIsUserInteracting(true)
      resetIdleTimer()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleRoleChange = useCallback((slug: string) => {
    setActiveRoleSlug(slug)
    setActiveAgentIndex(0)
    setIsUserInteracting(false)
  }, [])

  if (!activeRole) return null

  const activeAgent = activeRole.agents[activeAgentIndex]
  const minutesSaved = activeRole.totalBeforeMinutes - activeRole.totalAfterMinutes

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
      {/* Demo header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">
            {activeRole.displayName} · Full AI Agent Suite
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground italic">
          {activeRole.tagline}
        </span>
      </div>

      {/* Main layout: timeline left, expanded view right */}
      <div className="flex min-h-[560px]">
        {/* Timeline */}
        <div className="w-52 shrink-0 border-r border-border bg-muted/10">
          <DemoTimeline
            roles={roles}
            activeRoleSlug={activeRoleSlug}
            activeAgentIndex={activeAgentIndex}
            onRoleChange={handleRoleChange}
            onAgentSelect={handleAgentSelect}
          />
        </div>

        {/* Expanded view */}
        <div className="flex-1 p-5 overflow-hidden">
          {activeAgent && <AgentExpandedView agent={activeAgent} />}
        </div>
      </div>

      {/* CTA footer — appears after last agent OR always */}
      <div className="border-t border-border px-5 py-4 bg-muted/20 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-foreground">
            {minutesSaved} minutes back every day.
          </div>
          <div className="text-xs text-muted-foreground">
            ${activeRole.annualValueDollars.toLocaleString()} per year, per person.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="text-xs text-muted-foreground border border-border rounded-full px-4 py-2 hover:bg-muted transition-colors"
          >
            Book a scoping call
          </Link>
          <Link
            href="/build-a-team"
            className="flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Build this for my team
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/demo/AgentSuiteDemo.tsx
git commit -m "feat(demo): add AgentSuiteDemo main component with auto-advance"
```

---

### Task 9: DemoTeaser component

**Files:**
- Create: `components/demo/DemoTeaser.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/demo/DemoTeaser.tsx
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { computeDemoRoles } from "@/lib/demo/compute-demo"

export async function DemoTeaser() {
  let roles
  try {
    roles = await computeDemoRoles()
  } catch {
    return null
  }

  if (!roles.length) return null

  const defaultRole = roles[0]
  const minutesSaved = defaultRole.totalBeforeMinutes - defaultRole.totalAfterMinutes

  return (
    <section className="border border-border rounded-2xl overflow-hidden bg-muted/10">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">See it working</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            One role. Full agent suite. A complete workday.
          </p>
        </div>
        <Link
          href="/demo"
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
        >
          See full demo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Role tabs (static, links to /demo) */}
      <div className="flex gap-1.5 px-4 pt-3">
        {roles.map((role, i) => (
          <Link
            key={role.slug}
            href="/demo"
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              i === 0
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            {role.displayName}
          </Link>
        ))}
      </div>

      {/* Agent list */}
      <div className="px-4 py-3">
        <div className="flex flex-col divide-y divide-border">
          {defaultRole.agents.map((agent) => (
            <div key={agent.moduleKey} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: agent.accentColor }}
                />
                <div>
                  <span className="text-xs font-bold text-foreground">{agent.agentName}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{agent.label}</span>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {agent.beforeMinutes} min → {agent.afterMinutes} min
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stat + CTA */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
          <div>
            <div className="text-lg font-black text-blue-700 dark:text-blue-300">
              {minutesSaved} min/day
            </div>
            <div className="text-[9px] text-blue-500 dark:text-blue-400">
              ${defaultRole.annualValueDollars.toLocaleString()}/yr per person
            </div>
          </div>
          <Link
            href="/demo"
            className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 text-white rounded-full px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            See full demo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/demo/DemoTeaser.tsx
git commit -m "feat(demo): add DemoTeaser server component for homepage and /products"
```

---

### Task 10: /demo route

**Files:**
- Create: `app/demo/page.tsx`
- Create: `app/demo/loading.tsx`

- [ ] **Step 1: Create the page**

```typescript
// app/demo/page.tsx
import type { Metadata } from "next"
import { computeDemoRoles } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"

export const metadata: Metadata = {
  title: "Interactive Demo · AI Timeback",
  description:
    "See the full AI agent suite in action for a complete workday. Watch how Scout, Quill, Cal, Iris, and Reed transform how professionals work.",
}

export default async function DemoPage() {
  const roles = await computeDemoRoles()

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          A full workday. Transformed.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Pick a role. Watch the AI suite run the day. Each agent has a name,
          a job, and a moment where it hands control back to you.
        </p>
      </div>

      <AgentSuiteDemo roles={roles} />
    </div>
  )
}
```

- [ ] **Step 2: Create the loading skeleton**

```typescript
// app/demo/loading.tsx
export default function DemoLoading() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="h-8 w-72 bg-muted animate-pulse rounded-lg mx-auto mb-3" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded mx-auto" />
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        {/* Header bar skeleton */}
        <div className="h-11 bg-muted/30 border-b border-border" />

        <div className="flex min-h-[560px]">
          {/* Timeline skeleton */}
          <div className="w-52 shrink-0 border-r border-border p-4 flex flex-col gap-2">
            <div className="flex gap-1.5 mb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-6 w-16 bg-muted animate-pulse rounded-full" />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>

          {/* Expanded view skeleton */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            <div className="h-6 w-36 bg-muted animate-pulse rounded" />
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify the page works locally**

```bash
npx next dev
```
Open `http://localhost:3000/demo` and confirm:
- The page loads without errors
- 3 role chips appear in the timeline
- The loop animation plays automatically
- The typewriter output types in
- Auto-advance moves to the next agent after 8 seconds

- [ ] **Step 4: Commit**

```bash
git add app/demo/page.tsx app/demo/loading.tsx
git commit -m "feat(demo): add /demo route with AgentSuiteDemo and loading skeleton"
```

---

### Task 11: Wire into homepage, /products, and Header

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/products/page.tsx`
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Add DemoTeaser to homepage**

In `app/page.tsx`, import `DemoTeaser` and add it after the hero/stats section (before the social proof or search section). Find the first major `{/* ── ... */}` comment after the hero block and insert before it:

```typescript
import { DemoTeaser } from "@/components/demo/DemoTeaser"
```

Add the teaser section inside the page JSX (after the hero stats, before the category grid or search):

```tsx
{/* ── Demo teaser ─────────────────────────────────────── */}
<section className="mt-12 mb-10">
  <DemoTeaser />
</section>
```

- [ ] **Step 2: Add DemoTeaser to /products page**

In `app/products/page.tsx`, import and add before the inquiry CTA section. Find the last section (typically a CTA or pricing block) and insert above it:

```typescript
import { DemoTeaser } from "@/components/demo/DemoTeaser"
```

In the JSX, before the CTA section:

```tsx
{/* ── Demo teaser ─────────────────────────────────────── */}
<section className="mt-12 mb-10">
  <DemoTeaser />
</section>
```

- [ ] **Step 3: Add Demo to Header nav**

In `components/layout/Header.tsx`, add a Demo link to the `links` array between "Industries" and "Build a Team":

```typescript
const links = [
  { href: "/about", label: "About" },
  { href: "/browse", label: "Industries" },
  { href: "/demo", label: "Demo" },
  { href: "/build-a-team", label: "Build a Team" },
  { href: "/products", label: "Pricing" },
]
```

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```
Expected: all tests pass (no new failures)

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/products/page.tsx components/layout/Header.tsx
git commit -m "feat(demo): wire DemoTeaser into homepage and /products; add Demo nav link"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| `/demo` full page with role switcher + timeline + expanded view | Task 10 |
| Timeline nav (left) + expanded agent view (right) | Tasks 6, 7, 8 |
| 4-phase loop animation (Framer Motion) | Task 4 |
| Typewriter output panel | Task 5 |
| Auto-advance every 8s | Task 8 |
| Pause/resume button on loop | Task 4 |
| 3 roles: Ops Manager, Financial Analyst, Software Developer | Task 2 |
| 5 agents per role with scripted content | Task 2 |
| Agent names (Scout, Quill, Cal, Iris, Reed, Wren, Nora, Cleo, Lex, Coda) | Task 2 |
| DB-computed before/after minutes | Task 3 |
| `unstable_cache` (60s revalidation) | Task 3 |
| Before/after footer per agent | Task 7 |
| Summary CTA at end of `/demo` | Task 8 |
| DemoTeaser for homepage + /products | Task 9 |
| "See full demo →" CTA in teaser | Task 9 |
| Demo nav link in Header | Task 11 |
| Loading skeleton | Task 10 |
| `format: "code"` renders in code block | Task 5 |
| `format: "table"` renders in monospace | Task 5 |
| "Skip to end" button after 2s | Task 5 |
| Switching agent resets animation + typewriter | Tasks 4, 5 |
| Clicking agent overrides auto-advance, resumes after 30s idle | Task 8 |
| `annualValueDollars` computed from DB wage | Task 3 |

All spec requirements are covered. ✓
