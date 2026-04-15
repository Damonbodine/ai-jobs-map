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

GAP 1: MD&A — Known Trends Disclosure (Item 303)
Required: SEC Item 303 requires disclosure of any known trends or uncertainties that have had, or the registrant expects will have, a material favorable or unfavorable impact on net sales, revenues, or income.

Current draft: Does not address the S&M timing pull-forward ($155K overspend) as a known trend or one-time event.

Risk: If not disclosed, auditors may flag during review. SEC staff may issue comment.

Suggested language: "During Q3 2025, the Company accelerated planned marketing campaigns originally scheduled for Q4, resulting in S&M expenses approximately 17% above quarterly budget. Management does not expect this timing difference to recur in Q4."

GAP 2: SOX §302 — Material Weakness Attestation
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

React Query v5 changed useInfiniteQuery to useSuspenseInfiniteQuery with a new initialPageParam required field. The old getNextPageParam approach still works but is now typed differently.

\`\`\`typescript
// New v5 pattern (use this)
const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
  queryKey: ['jobs', filters],
  queryFn: ({ pageParam }) => fetchJobs({ cursor: pageParam, ...filters }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})
\`\`\`

Prior example in codebase: components/browse/OccupationList.tsx:47
(uses the same cursor-based pattern, just on a different entity)

## Approach 2 — Offset pagination (simpler, less scalable)
Only use if cursor-based pagination is not supported by the API endpoint.

## Approach 3 — Manual scroll listener
Do not use — IntersectionObserver via @tanstack/react-virtual is already in the project.

## Breaking change note
v5 removed the onSuccess/onError callbacks. Use useEffect watching data instead.
See: lib/hooks/useOccupationSearch.ts:23 for the updated pattern.`,
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
Adds infinite scroll pagination to the job listings page using React Query v5's useSuspenseInfiniteQuery. Replaces the previous "Load more" button with automatic scroll-triggered fetching.

Fixes: PROD-1204

## Changes
- components/browse/JobList.tsx — Replaced useQuery with useSuspenseInfiniteQuery; added IntersectionObserver trigger at list bottom
- lib/hooks/useJobSearch.ts — Updated to cursor-based pagination; removed deprecated onSuccess callback
- app/browse/page.tsx — Wrapped JobList in Suspense boundary (required for Suspense variant)

## Breaking Changes
None. The API contract is unchanged. Old offset-based endpoints still work.

## Test Plan
- [x] useJobSearch.test.ts — 2 new tests: cursor pagination, empty next page
- [x] JobList.test.tsx — IntersectionObserver mock verifies fetchNextPage called on scroll
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
  + Benchmark: renders drop from 50 to 1 on filter change
  - Does not fix the underlying state placement issue

Fix B — Move filter count state back to FilterBar
  + Fixes root cause, correct architecture
  + Benchmark: same result as Fix A
  - Requires refactoring FilterBar and JobList interface
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
- 8 of 12 tickets done
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
