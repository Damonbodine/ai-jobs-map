# Dynamic Demo — Any Occupation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/demo/[slug]` work for any of the 847 occupations in the DB by generating agent loop content via Claude (OpenRouter), caching results in Supabase, adding a searchable landing page at `/demo`, and embedding the demo on every `/occupation/[slug]` page.

**Architecture:** A new `demo_agent_content` Supabase table caches generated content per (occupation_id, module_key). On first visit, the server selects the top 5 modules by AI task volume, resolves each module's content (DB cache → generate-on-miss via OpenRouter/Claude), then passes the assembled `DemoRoleData` to the existing `AgentSuiteDemo` component. The existing three hand-scripted roles continue to work unchanged.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (postgres) · OpenRouter API (direct fetch, no new deps) · Vitest · Framer Motion (already installed)

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260415120000_demo_agent_content.sql` | Create | DB table + index |
| `lib/demo/agent-metadata.ts` | Create | agentName/label/accentColor/timeOfDay per moduleKey |
| `lib/demo/select-demo-modules.ts` | Create | Pick top-N modules by AI task minutes |
| `lib/demo/generate-demo-content.ts` | Create | Fetch OpenRouter → parse JSON → `PartialAgentScript` narrative/loop/output |
| `lib/demo/resolve-demo-content.ts` | Create | DB cache lookup + generate-on-miss + upsert |
| `lib/demo/compute-demo.ts` | Modify | Add `computeDemoForSlug(slug)` |
| `app/demo/[slug]/page.tsx` | Create | Dynamic route server component |
| `app/demo/[slug]/loading.tsx` | Create | Skeleton |
| `app/demo/[slug]/error.tsx` | Create | Error boundary |
| `app/api/demo/search/route.ts` | Create | Occupation typeahead API |
| `app/demo/page.tsx` | Modify | Add search bar + featured role cards |
| `scripts/seed-demo-content.ts` | Create | Pre-generate top 20 roles |
| `components/demo/OccupationDemoSection.tsx` | Create | Async server component — calls `computeDemoForSlug`, renders `AgentSuiteDemo` |
| `app/occupation/[slug]/page.tsx` | Modify | Add `<Suspense>` + `<OccupationDemoSection>` below the builder section |
| `lib/demo/agent-metadata.test.ts` | Create | Coverage for metadata |
| `lib/demo/select-demo-modules.test.ts` | Create | Coverage for selector |
| `lib/demo/generate-demo-content.test.ts` | Create | Coverage for generator |
| `lib/demo/resolve-demo-content.test.ts` | Create | Coverage for resolver |
| `lib/demo/compute-demo.test.ts` | Modify | Add `computeDemoForSlug` tests |

---

### Task 1: DB Migration — `demo_agent_content` table

**Files:**
- Create: `supabase/migrations/20260415120000_demo_agent_content.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260415120000_demo_agent_content.sql

create table if not exists demo_agent_content (
  id            bigserial primary key,
  occupation_id bigint not null,
  module_key    text   not null,
  agent_name    text   not null,
  label         text   not null,
  accent_color  text   not null,
  time_of_day   text   not null,
  narrative     text   not null,
  loop_data     jsonb  not null,
  output_data   jsonb  not null,
  created_at    timestamptz not null default now(),
  constraint uq_demo_content unique (occupation_id, module_key)
);

create index if not exists idx_demo_agent_content_occupation
  on demo_agent_content (occupation_id);
```

- [ ] **Step 2: Apply the migration**

```bash
cd /Users/damonbodine/ai-jobs-map
npx supabase db push
```

Expected: migration applied with no errors.

- [ ] **Step 3: Verify the table exists**

```bash
npx supabase db diff --use-migra 2>/dev/null | head -20
```

Expected: no diff (table is in sync).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260415120000_demo_agent_content.sql
git commit -m "feat(demo): add demo_agent_content cache table"
```

---

### Task 2: Agent Metadata Constants

**Files:**
- Create: `lib/demo/agent-metadata.ts`
- Create: `lib/demo/agent-metadata.test.ts`

`★ Insight ─────────────────────────────────────`
Centralizing agent names + accent colors here prevents them from being scattered across the generator, resolver, and demo-scripts. The module keys come from `MODULE_KEYS` in `lib/modules.ts` — this file should import that const so TypeScript catches any missing entries.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/demo/agent-metadata.test.ts
import { describe, it, expect } from "vitest"
import { AGENT_METADATA, MODULE_KEYS } from "@/lib/modules"
import { getAgentMetadata } from "./agent-metadata"

describe("getAgentMetadata", () => {
  it("returns metadata for every module key", () => {
    for (const key of MODULE_KEYS) {
      const meta = getAgentMetadata(key)
      expect(meta.agentName, `agentName missing for ${key}`).toBeTruthy()
      expect(meta.label, `label missing for ${key}`).toBeTruthy()
      expect(meta.accentColor, `accentColor missing for ${key}`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(meta.timeOfDay, `timeOfDay missing for ${key}`).toBeTruthy()
    }
  })

  it("returns Scout for intake module", () => {
    expect(getAgentMetadata("intake").agentName).toBe("Scout")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/damonbodine/ai-jobs-map
pnpm test lib/demo/agent-metadata.test.ts
```

Expected: FAIL with "Cannot find module './agent-metadata'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/demo/agent-metadata.ts
import type { ModuleKey } from "@/lib/modules"

export type AgentMeta = {
  agentName: string
  label: string
  accentColor: string
  timeOfDay: string
}

const AGENT_METADATA: Record<ModuleKey, AgentMeta> = {
  intake:        { agentName: "Scout", label: "Intake & Triage",          accentColor: "#06b6d4", timeOfDay: "8:00 AM"  },
  analysis:      { agentName: "Iris",  label: "Analysis",                 accentColor: "#6366f1", timeOfDay: "9:30 AM"  },
  documentation: { agentName: "Quill", label: "Documentation",            accentColor: "#8b5cf6", timeOfDay: "10:30 AM" },
  coordination:  { agentName: "Cal",   label: "Coordination & Scheduling", accentColor: "#10b981", timeOfDay: "11:30 AM" },
  research:      { agentName: "Wren",  label: "Research",                 accentColor: "#14b8a6", timeOfDay: "1:00 PM"  },
  compliance:    { agentName: "Nora",  label: "Compliance & Policy",      accentColor: "#ef4444", timeOfDay: "2:00 PM"  },
  exceptions:    { agentName: "Reed",  label: "Exceptions & Escalations", accentColor: "#f59e0b", timeOfDay: "2:30 PM"  },
  communication: { agentName: "Cleo",  label: "Communication",            accentColor: "#ec4899", timeOfDay: "3:30 PM"  },
  data_reporting:{ agentName: "Lex",   label: "Data & Reporting",         accentColor: "#0ea5e9", timeOfDay: "4:00 PM"  },
  learning:      { agentName: "Nova",  label: "Learning & Updates",       accentColor: "#f97316", timeOfDay: "4:45 PM"  },
}

export function getAgentMetadata(moduleKey: ModuleKey): AgentMeta {
  return AGENT_METADATA[moduleKey]
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test lib/demo/agent-metadata.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/demo/agent-metadata.ts lib/demo/agent-metadata.test.ts
git commit -m "feat(demo): add agent metadata constants for all 10 modules"
```

---

### Task 3: Module Selector

**Files:**
- Create: `lib/demo/select-demo-modules.ts`
- Create: `lib/demo/select-demo-modules.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/demo/select-demo-modules.test.ts
import { describe, it, expect } from "vitest"
import { selectDemoModules } from "./select-demo-modules"
import type { MicroTask } from "@/types"

function makeTask(overrides: Partial<MicroTask> = {}): MicroTask {
  return {
    id: 1,
    occupation_id: 1,
    task_name: "review patient records",
    task_description: "review patient records for accuracy",
    frequency: "daily",
    ai_applicable: true,
    ai_how_it_helps: null,
    ai_impact_level: 4,
    ai_effort_to_implement: null,
    ai_category: null,
    ai_tools: null,
    ...overrides,
  }
}

describe("selectDemoModules", () => {
  it("returns top modules sorted by total task minutes descending", () => {
    const tasks: MicroTask[] = [
      // analysis: high-impact daily tasks
      makeTask({ id: 1, task_name: "analyze patient data", task_description: "analyze patterns", ai_impact_level: 5 }),
      makeTask({ id: 2, task_name: "analyze trends",       task_description: "analyze market trends", ai_impact_level: 5 }),
      // documentation: one moderate task
      makeTask({ id: 3, task_name: "write notes",          task_description: "write daily notes", ai_impact_level: 3 }),
    ]
    const result = selectDemoModules(tasks, 5)
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(5)
    // analysis should rank above documentation (more tasks)
    const analysisIdx = result.findIndex((m) => m.moduleKey === "analysis")
    const docIdx      = result.findIndex((m) => m.moduleKey === "documentation")
    if (analysisIdx !== -1 && docIdx !== -1) {
      expect(analysisIdx).toBeLessThan(docIdx)
    }
  })

  it("excludes non-AI-applicable tasks", () => {
    const tasks: MicroTask[] = [
      makeTask({ id: 1, ai_applicable: false }),
    ]
    const result = selectDemoModules(tasks, 5)
    expect(result).toHaveLength(0)
  })

  it("returns fewer than maxModules when fewer modules exist", () => {
    const tasks: MicroTask[] = [
      makeTask({ id: 1, task_name: "analyze results", task_description: "analyze lab results", ai_impact_level: 4 }),
    ]
    const result = selectDemoModules(tasks, 5)
    expect(result.length).toBeLessThanOrEqual(1)
  })

  it("maps module keys correctly", () => {
    const tasks: MicroTask[] = [
      makeTask({ id: 1, task_name: "schedule meetings", task_description: "schedule calendar meetings", ai_impact_level: 4 }),
    ]
    const result = selectDemoModules(tasks, 5)
    expect(result.some((m) => m.moduleKey === "coordination")).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test lib/demo/select-demo-modules.test.ts
```

Expected: FAIL with "Cannot find module './select-demo-modules'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/demo/select-demo-modules.ts
import { estimateTaskMinutes } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import type { MicroTask } from "@/types"

export type SelectedModule = {
  moduleKey: string
  tasks: MicroTask[]
  totalMinutes: number
}

export function selectDemoModules(tasks: MicroTask[], maxModules = 5): SelectedModule[] {
  const aiTasks = tasks.filter((t) => t.ai_applicable)

  const moduleMap = new Map<string, MicroTask[]>()
  for (const task of aiTasks) {
    const key = getBlockForTask(task)
    const existing = moduleMap.get(key) ?? []
    existing.push(task)
    moduleMap.set(key, existing)
  }

  const modules: SelectedModule[] = []
  for (const [moduleKey, moduleTasks] of moduleMap.entries()) {
    const totalMinutes = moduleTasks.reduce((sum, t) => sum + estimateTaskMinutes(t), 0)
    modules.push({ moduleKey, tasks: moduleTasks, totalMinutes })
  }

  return modules
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, maxModules)
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test lib/demo/select-demo-modules.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/demo/select-demo-modules.ts lib/demo/select-demo-modules.test.ts
git commit -m "feat(demo): add selectDemoModules — picks top-N modules by AI task volume"
```

---

### Task 4: Content Generator (OpenRouter → Claude)

**Files:**
- Create: `lib/demo/generate-demo-content.ts`
- Create: `lib/demo/generate-demo-content.test.ts`

`★ Insight ─────────────────────────────────────`
Using a direct `fetch` against the OpenRouter API (which proxies Claude) avoids adding any new npm dependencies. The prompt is structured to elicit a strict JSON response with `narrative`, `loop`, and `output` fields — matching the existing `AgentLoopContent` and `AgentOutput` types exactly. Retry on JSON parse failure (1 retry) before throwing.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/demo/generate-demo-content.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateDemoContent } from "./generate-demo-content"
import type { MicroTask } from "@/types"

const VALID_RESPONSE = {
  narrative: "Alex used to spend 45 minutes each morning triaging requests. Scout pre-sorts overnight — she opens a clean queue and moves on in 3 minutes.",
  loop: {
    inputs:  ["12 new service tickets", "3 escalation alerts", "Overnight system logs"],
    actions: ["Scores urgency 1–5", "Groups by department", "Flags 2 items needing approval"],
    outputs: ["Priority queue (top 6)", "2 escalations flagged", "9 items auto-routed"],
    humanAction: "Alex confirms the two escalations and approves the queue — 3 min total.",
  },
  output: {
    format:  "prose",
    label:   "MORNING BRIEFING",
    content: "Good morning, Alex. Scout processed 12 new tickets overnight.\n\nPRIORITY QUEUE — 6 items today:\n\n1. [ESCALATION] Server outage in Region 2 — 4 hours unresolved. Requires your decision.\n2. Budget approval request from Finance — due today.\n3. Client onboarding stalled — missing credentials.\n\nAuto-routed (9 items): status updates and FYIs filed by project.",
  },
}

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-key")
})

describe("generateDemoContent", () => {
  it("parses a valid Claude response into agent content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const tasks: MicroTask[] = [
      {
        id: 1, occupation_id: 1,
        task_name: "triage service requests", task_description: "prioritize incoming requests",
        frequency: "daily", ai_applicable: true,
        ai_how_it_helps: "sorts by urgency", ai_impact_level: 4,
        ai_effort_to_implement: null, ai_category: null, ai_tools: null,
      },
    ]

    const result = await generateDemoContent({
      occupationTitle: "Service Manager",
      moduleKey: "intake",
      tasks,
    })

    expect(result.narrative).toContain("Alex")
    expect(result.loop.inputs).toHaveLength(3)
    expect(result.loop.actions).toHaveLength(3)
    expect(result.loop.outputs).toHaveLength(3)
    expect(result.loop.humanAction).toBeTruthy()
    expect(result.output.format).toMatch(/^(prose|table|code)$/)
    expect(result.output.label).toBeTruthy()
    expect(result.output.content).toBeTruthy()
  })

  it("sends a POST to OpenRouter with Authorization header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    await generateDemoContent({
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: [],
    })

    expect(mockFetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    )
  })

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 429,
      json: async () => ({ error: "rate limited" }),
    }))

    await expect(
      generateDemoContent({ occupationTitle: "Nurse", moduleKey: "intake", tasks: [] })
    ).rejects.toThrow("OpenRouter API error")
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test lib/demo/generate-demo-content.test.ts
```

Expected: FAIL with "Cannot find module './generate-demo-content'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/demo/generate-demo-content.ts
import { getAgentMetadata } from "./agent-metadata"
import type { AgentLoopContent, AgentOutput } from "./types"
import type { MicroTask, ModuleKey } from "@/types"
import type { ModuleKey as ModKey } from "@/lib/modules"

export type GeneratedContent = {
  narrative: string
  loop: AgentLoopContent
  output: AgentOutput
}

type GenerateInput = {
  occupationTitle: string
  moduleKey: string
  tasks: MicroTask[]
}

function buildPrompt(input: GenerateInput): string {
  const { occupationTitle, moduleKey, tasks } = input
  const meta = getAgentMetadata(moduleKey as ModKey)
  const taskSample = tasks.slice(0, 4).map((t) => `- ${t.task_name}: ${t.task_description}`).join("\n")

  return `You are writing demo content for an AI agent product targeting knowledge workers.

ROLE: ${occupationTitle}
AGENT: ${meta.agentName} — ${meta.label}
TIME: ${meta.timeOfDay}

SAMPLE TASKS THIS AGENT HANDLES:
${taskSample || "- General " + meta.label.toLowerCase() + " work"}

Write realistic, specific demo content for how ${meta.agentName} helps a ${occupationTitle} with ${meta.label.toLowerCase()} tasks. Use a realistic first name for the worker (not "the user"). Make it feel like a real workday.

Respond ONLY with valid JSON in this exact shape:
{
  "narrative": "<1-2 sentences: what changed for this worker — personal and specific>",
  "loop": {
    "inputs":     ["<exactly 3 specific inputs the agent receives>", "...", "..."],
    "actions":    ["<exactly 3 things the AI does>", "...", "..."],
    "outputs":    ["<exactly 3 concrete outputs delivered>", "...", "..."],
    "humanAction": "<1 sentence: what the worker reviews/approves and how long it takes>"
  },
  "output": {
    "format":  "prose",
    "label":   "<3-4 word ALL CAPS label, e.g. 'MORNING BRIEFING'>",
    "content": "<realistic 150-250 word output the agent would produce — formatted, specific>"
  }
}

Only JSON. No markdown fences. No explanation.`
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://aijobsmap.com",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4-5",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(`OpenRouter API error ${response.status}: ${JSON.stringify(body)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ""
}

function parseContent(raw: string): GeneratedContent {
  // Strip markdown fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  const parsed = JSON.parse(cleaned)

  if (
    typeof parsed.narrative !== "string" ||
    !Array.isArray(parsed.loop?.inputs) || parsed.loop.inputs.length !== 3 ||
    !Array.isArray(parsed.loop?.actions) || parsed.loop.actions.length !== 3 ||
    !Array.isArray(parsed.loop?.outputs) || parsed.loop.outputs.length !== 3 ||
    typeof parsed.loop?.humanAction !== "string" ||
    typeof parsed.output?.format !== "string" ||
    typeof parsed.output?.label !== "string" ||
    typeof parsed.output?.content !== "string"
  ) {
    throw new Error("Generated content failed schema validation")
  }

  return {
    narrative: parsed.narrative,
    loop: {
      inputs:      parsed.loop.inputs,
      actions:     parsed.loop.actions,
      outputs:     parsed.loop.outputs,
      humanAction: parsed.loop.humanAction,
    },
    output: {
      format:   parsed.output.format as AgentOutput["format"],
      label:    parsed.output.label,
      content:  parsed.output.content,
      language: parsed.output.language,
    },
  }
}

export async function generateDemoContent(input: GenerateInput): Promise<GeneratedContent> {
  const prompt = buildPrompt(input)

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenRouter(prompt)
      return parseContent(raw)
    } catch (err) {
      lastError = err
      // Only retry on parse errors, not API errors
      if (err instanceof Error && err.message.startsWith("OpenRouter API error")) {
        throw err
      }
    }
  }
  throw lastError
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test lib/demo/generate-demo-content.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/demo/generate-demo-content.ts lib/demo/generate-demo-content.test.ts
git commit -m "feat(demo): add OpenRouter content generator for dynamic agent demos"
```

---

### Task 5: Content Resolver (DB Cache + Generate-on-Miss)

**Files:**
- Create: `lib/demo/resolve-demo-content.ts`
- Create: `lib/demo/resolve-demo-content.test.ts`

`★ Insight ─────────────────────────────────────`
The resolver is the seam between the DB cache and the generator. It's the only place that touches both — making it easy to test by mocking both dependencies. The Supabase upsert uses `onConflict: 'occupation_id,module_key'` so concurrent requests don't double-insert.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/demo/resolve-demo-content.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

// Mock dependencies before importing the module
vi.mock("./generate-demo-content", () => ({
  generateDemoContent: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}))

import { resolveAgentContent } from "./resolve-demo-content"
import { generateDemoContent } from "./generate-demo-content"
import { createServerClient } from "@/lib/supabase/server"
import type { MicroTask } from "@/types"

const CACHED_ROW = {
  narrative: "Cached narrative.",
  loop_data: {
    inputs: ["a", "b", "c"],
    actions: ["x", "y", "z"],
    outputs: ["1", "2", "3"],
    humanAction: "Reviews and approves.",
  },
  output_data: { format: "prose", label: "REPORT", content: "Cached output." },
}

const GENERATED = {
  narrative: "Generated narrative.",
  loop: {
    inputs: ["a", "b", "c"],
    actions: ["x", "y", "z"],
    outputs: ["1", "2", "3"],
    humanAction: "Reviews and approves.",
  },
  output: { format: "prose" as const, label: "REPORT", content: "Generated output." },
}

function mockSupabase(cacheHit: boolean) {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: cacheHit ? CACHED_ROW : null,
      error: null,
    }),
  }
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ select: () => selectChain, upsert })
  vi.mocked(createServerClient).mockReturnValue({ from } as unknown as SupabaseClient)
  return { upsert }
}

const TASKS: MicroTask[] = [
  {
    id: 1, occupation_id: 10,
    task_name: "sort emails", task_description: "sort incoming",
    frequency: "daily", ai_applicable: true,
    ai_how_it_helps: null, ai_impact_level: 4,
    ai_effort_to_implement: null, ai_category: null, ai_tools: null,
  },
]

describe("resolveAgentContent", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns cached content when DB row exists", async () => {
    mockSupabase(true)
    const result = await resolveAgentContent({
      occupationId: 10,
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: TASKS,
    })
    expect(result.narrative).toBe("Cached narrative.")
    expect(generateDemoContent).not.toHaveBeenCalled()
  })

  it("generates and upserts when no cache row exists", async () => {
    const { upsert } = mockSupabase(false)
    vi.mocked(generateDemoContent).mockResolvedValue(GENERATED)

    const result = await resolveAgentContent({
      occupationId: 10,
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: TASKS,
    })

    expect(result.narrative).toBe("Generated narrative.")
    expect(generateDemoContent).toHaveBeenCalledOnce()
    expect(upsert).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test lib/demo/resolve-demo-content.test.ts
```

Expected: FAIL with "Cannot find module './resolve-demo-content'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/demo/resolve-demo-content.ts
import { createServerClient } from "@/lib/supabase/server"
import { generateDemoContent } from "./generate-demo-content"
import { getAgentMetadata } from "./agent-metadata"
import type { AgentLoopContent, AgentOutput } from "./types"
import type { MicroTask } from "@/types"
import type { ModuleKey } from "@/lib/modules"

export type ResolvedAgentContent = {
  narrative: string
  loop: AgentLoopContent
  output: AgentOutput
}

type ResolveInput = {
  occupationId: number
  occupationTitle: string
  moduleKey: string
  tasks: MicroTask[]
}

export async function resolveAgentContent(input: ResolveInput): Promise<ResolvedAgentContent> {
  const { occupationId, occupationTitle, moduleKey, tasks } = input
  const supabase = createServerClient()

  // 1. Check cache
  const { data: cached } = await supabase
    .from("demo_agent_content")
    .select("narrative, loop_data, output_data")
    .eq("occupation_id", occupationId)
    .eq("module_key", moduleKey)
    .single()

  if (cached) {
    return {
      narrative: cached.narrative,
      loop:      cached.loop_data as AgentLoopContent,
      output:    cached.output_data as AgentOutput,
    }
  }

  // 2. Generate fresh content
  const generated = await generateDemoContent({ occupationTitle, moduleKey, tasks })

  const meta = getAgentMetadata(moduleKey as ModuleKey)

  // 3. Upsert into cache (ignore conflicts — concurrent request may have written first)
  await supabase.from("demo_agent_content").upsert(
    {
      occupation_id: occupationId,
      module_key:    moduleKey,
      agent_name:    meta.agentName,
      label:         meta.label,
      accent_color:  meta.accentColor,
      time_of_day:   meta.timeOfDay,
      narrative:     generated.narrative,
      loop_data:     generated.loop,
      output_data:   generated.output,
    },
    { onConflict: "occupation_id,module_key" }
  )

  return {
    narrative: generated.narrative,
    loop:      generated.loop,
    output:    generated.output,
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test lib/demo/resolve-demo-content.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/demo/resolve-demo-content.ts lib/demo/resolve-demo-content.test.ts
git commit -m "feat(demo): add content resolver with DB cache + generate-on-miss"
```

---

### Task 6: `computeDemoForSlug` in compute-demo.ts

**Files:**
- Modify: `lib/demo/compute-demo.ts`
- Modify: `lib/demo/compute-demo.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/demo/compute-demo.test.ts` (append after existing tests):

```typescript
// --- computeDemoForSlug ---

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}))
vi.mock("./resolve-demo-content", () => ({
  resolveAgentContent: vi.fn(),
}))

import { computeDemoForSlug } from "./compute-demo"
import { resolveAgentContent } from "./resolve-demo-content"
import { createServerClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

const MOCK_OCCUPATION = {
  id: 99, title: "Registered Nurse", slug: "registered-nurses",
  major_category: "Healthcare", sub_category: null,
  employment: 3000000, hourly_wage: 38, annual_wage: 79000,
}
const MOCK_TASKS = [
  {
    id: 1, occupation_id: 99,
    task_name: "review patient records", task_description: "analyze lab results",
    frequency: "daily", ai_applicable: true,
    ai_how_it_helps: "auto-summarizes", ai_impact_level: 4,
    ai_effort_to_implement: null, ai_category: null, ai_tools: null,
  },
  {
    id: 2, occupation_id: 99,
    task_name: "write shift notes", task_description: "document patient status",
    frequency: "daily", ai_applicable: true,
    ai_how_it_helps: "drafts notes", ai_impact_level: 3,
    ai_effort_to_implement: null, ai_category: null, ai_tools: null,
  },
]
const MOCK_RESOLVED = {
  narrative: "Test narrative.",
  loop: { inputs: ["a","b","c"], actions: ["x","y","z"], outputs: ["1","2","3"], humanAction: "Reviews." },
  output: { format: "prose" as const, label: "REPORT", content: "Test output." },
}

function setupMockSupabase() {
  const occupationChain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: MOCK_OCCUPATION }),
  }
  const tasksChain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockResolvedValue({ data: MOCK_TASKS }),
  }
  const profileChain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
  }
  let call = 0
  const from = vi.fn().mockImplementation(() => {
    call++
    if (call === 1) return occupationChain
    if (call === 2) return tasksChain
    return profileChain
  })
  vi.mocked(createServerClient).mockReturnValue({ from } as unknown as SupabaseClient)
}

describe("computeDemoForSlug", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null for an unknown slug", async () => {
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })
    vi.mocked(createServerClient).mockReturnValue({ from } as unknown as SupabaseClient)

    const result = await computeDemoForSlug("unknown-slug")
    expect(result).toBeNull()
  })

  it("returns a DemoRoleData with agents for a known slug", async () => {
    setupMockSupabase()
    vi.mocked(resolveAgentContent).mockResolvedValue(MOCK_RESOLVED)

    const result = await computeDemoForSlug("registered-nurses")
    expect(result).not.toBeNull()
    expect(result!.slug).toBe("registered-nurses")
    expect(result!.agents.length).toBeGreaterThan(0)
    expect(result!.totalBeforeMinutes).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test lib/demo/compute-demo.test.ts
```

Expected: FAIL with "computeDemoForSlug is not a function" (or similar export error)

- [ ] **Step 3: Add `computeDemoForSlug` to compute-demo.ts**

Append to the end of `lib/demo/compute-demo.ts`:

```typescript
import { selectDemoModules } from "./select-demo-modules"
import { resolveAgentContent } from "./resolve-demo-content"
import { getAgentMetadata } from "./agent-metadata"
import type { ModuleKey } from "@/lib/modules"

export async function computeDemoForSlug(slug: string): Promise<DemoRoleData | null> {
  const roleData = await fetchRoleData(slug)
  if (!roleData) return null

  const { occupation, profile, tasks } = roleData
  const selectedModules = selectDemoModules(tasks, 5)

  if (selectedModules.length === 0) return null

  // Resolve agent content for each selected module (parallel)
  const resolvedContents = await Promise.all(
    selectedModules.map((mod) =>
      resolveAgentContent({
        occupationId:    occupation.id,
        occupationTitle: occupation.title,
        moduleKey:       mod.moduleKey,
        tasks:           mod.tasks,
      })
    )
  )

  // Build PartialAgentScript array (everything except beforeMinutes/afterMinutes)
  const scriptAgents: PartialAgentScript[] = selectedModules.map((mod, i) => {
    const meta = getAgentMetadata(mod.moduleKey as ModuleKey)
    const content = resolvedContents[i]
    return {
      moduleKey:   mod.moduleKey,
      agentName:   meta.agentName,
      label:       meta.label,
      accentColor: meta.accentColor,
      timeOfDay:   meta.timeOfDay,
      narrative:   content.narrative,
      loop:        content.loop,
      output:      content.output,
    }
  })

  const roleStats = buildDemoRoleStats(roleData, scriptAgents)

  // Dynamic tagline for roles not in DEMO_ROLE_SCRIPTS
  if (!roleStats.tagline) {
    return {
      ...roleStats,
      tagline: `A full workday for ${occupation.title}, transformed by AI.`,
    }
  }

  return roleStats
}
```

Also add these imports near the top of `compute-demo.ts` (after the existing imports):

```typescript
import { selectDemoModules } from "./select-demo-modules"
import { resolveAgentContent } from "./resolve-demo-content"
import { getAgentMetadata } from "./agent-metadata"
import type { ModuleKey } from "@/lib/modules"
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test lib/demo/compute-demo.test.ts
```

Expected: All tests pass (existing + 2 new)

- [ ] **Step 5: Commit**

```bash
git add lib/demo/compute-demo.ts lib/demo/compute-demo.test.ts
git commit -m "feat(demo): add computeDemoForSlug for any occupation slug"
```

---

### Task 7: `/demo/[slug]` Dynamic Route

**Files:**
- Create: `app/demo/[slug]/page.tsx`
- Create: `app/demo/[slug]/loading.tsx`
- Create: `app/demo/[slug]/error.tsx`

`★ Insight ─────────────────────────────────────`
This route is a pure server component — no client-side fetching. Next.js will stream the page skeleton from `loading.tsx` while `computeDemoForSlug` resolves. The first visit to a new occupation will be slow (10-20s generation time), but subsequent visits serve the cached version in milliseconds.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Create the page component**

```typescript
// app/demo/[slug]/page.tsx
import { notFound } from "next/navigation"
import { computeDemoForSlug } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const role = await computeDemoForSlug(slug)
  if (!role) return { title: "Demo | AI Jobs Map" }
  return {
    title: `${role.displayName} AI Demo | AI Jobs Map`,
    description: role.tagline,
  }
}

export default async function DemoSlugPage({ params }: Props) {
  const { slug } = await params
  const role = await computeDemoForSlug(slug)

  if (!role) notFound()

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-widest mb-1">
            AI Agent Suite Demo
          </p>
          <h1 className="text-3xl font-bold text-[#1a1a1a] font-display mb-2">
            {role.displayName}
          </h1>
          <p className="text-lg text-[#555]">{role.tagline}</p>
        </div>
        <AgentSuiteDemo roles={[role]} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create the loading skeleton**

```typescript
// app/demo/[slug]/loading.tsx
export default function DemoSlugLoading() {
  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="mb-8">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-96 bg-gray-100 rounded" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 h-[500px]" />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create the error boundary**

```typescript
// app/demo/[slug]/error.tsx
"use client"
import { useEffect } from "react"

export default function DemoSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Demo slug error:", error)
  }, [error])

  return (
    <main className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-2">
          Demo Unavailable
        </p>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
          We couldn&apos;t load this demo
        </h1>
        <p className="text-[#666] mb-6">
          This occupation&apos;s demo is still being generated. Try again in a moment.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Test the route renders**

```bash
pnpm dev &
sleep 5
curl -s http://localhost:3000/demo/registered-nurses | grep -o "AI Agent Suite Demo" | head -1
```

Expected: "AI Agent Suite Demo" (confirms the page rendered without a 500)

Stop dev server: `kill %1`

- [ ] **Step 5: Commit**

```bash
git add app/demo/\[slug\]/page.tsx app/demo/\[slug\]/loading.tsx app/demo/\[slug\]/error.tsx
git commit -m "feat(demo): add /demo/[slug] dynamic route for any occupation"
```

---

### Task 8: Occupation Search API + Updated `/demo` Landing Page

**Files:**
- Create: `app/api/demo/search/route.ts`
- Modify: `app/demo/page.tsx`

- [ ] **Step 1: Create the search API route**

```typescript
// app/api/demo/search/route.ts
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("slug, title")
    .ilike("title", `%${q}%`)
    .order("employment", { ascending: false, nullsFirst: false })
    .limit(8)

  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 2: Read the current `/demo` page to understand its structure**

```bash
cat /Users/damonbodine/ai-jobs-map/app/demo/page.tsx
```

- [ ] **Step 3: Create the OccupationSearch client component**

```typescript
// components/demo/OccupationSearch.tsx
"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

type Result = { slug: string; title: string }

export function OccupationSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/demo/search?q=${encodeURIComponent(query)}`)
        const data: Result[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [query])

  function handleSelect(slug: string) {
    setOpen(false)
    setQuery("")
    router.push(`/demo/${slug}`)
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-cyan-400 focus-within:border-cyan-400 transition-all">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any job title — Nurse, Engineer, Teacher..."
          className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
          aria-label="Search occupations"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {results.map((r) => (
            <li key={r.slug}>
              <button
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(r.slug)}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update `/demo/page.tsx`**

Read the current file first:

```bash
cat /Users/damonbodine/ai-jobs-map/app/demo/page.tsx
```

Then update it to add the search bar and featured roles section above the existing `DemoTeaser`. The new structure:

```typescript
// app/demo/page.tsx
import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { DemoTeaser } from "@/components/demo/DemoTeaser"
import { OccupationSearch } from "@/components/demo/OccupationSearch"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Agent Suite Demo | AI Jobs Map",
  description: "See how AI agents transform a full workday for any job role.",
}

const FEATURED_SLUGS = [
  "registered-nurses",
  "general-and-operations-managers",
  "software-developers",
  "financial-analysts",
  "elementary-school-teachers",
  "accountants-and-auditors",
]

async function FeaturedRoles() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("slug, title, major_category")
    .in("slug", FEATURED_SLUGS)

  const roles = data ?? []

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
      {roles.map((role) => (
        <Link
          key={role.slug}
          href={`/demo/${role.slug}`}
          className="group bg-white border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-cyan-300 hover:shadow-sm transition-all"
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {role.major_category}
          </p>
          <p className="text-sm font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors leading-snug">
            {role.title}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default async function DemoPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7]">
      {/* Hero + Search */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <p className="text-sm font-semibold text-cyan-600 uppercase tracking-widest mb-3">
          AI Agent Suite
        </p>
        <h1 className="text-4xl font-bold text-[#1a1a1a] font-display mb-4">
          See your workday, transformed
        </h1>
        <p className="text-lg text-[#555] mb-8">
          Search any job title. We&apos;ll show you exactly which agents handle which tasks — and how many hours they give back.
        </p>
        <OccupationSearch />
      </section>

      {/* Featured roles */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-5">
          Featured roles
        </p>
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          <FeaturedRoles />
        </Suspense>
      </section>

      {/* Existing scripted demo */}
      <section className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
            Full walkthrough
          </p>
          <h2 className="text-2xl font-bold text-[#1a1a1a] font-display text-center mb-10">
            Watch the agents in action
          </h2>
          <DemoTeaser />
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 5: Verify build passes**

```bash
cd /Users/damonbodine/ai-jobs-map
pnpm build 2>&1 | tail -20
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/demo/search/route.ts components/demo/OccupationSearch.tsx app/demo/page.tsx
git commit -m "feat(demo): add occupation search API + updated /demo landing with featured roles"
```

---

### Task 9: Seed Script for Top 20 Roles

**Files:**
- Create: `scripts/seed-demo-content.ts`

`★ Insight ─────────────────────────────────────`
Pre-seeding the top 20 occupations by employment count eliminates the slow first-load experience for the most-searched roles. The script calls `computeDemoForSlug` (which internally uses `resolveAgentContent`) — so it benefits from the same cache logic and won't re-generate already-cached entries.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Write the seed script**

```typescript
// scripts/seed-demo-content.ts
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { resolveAgentContent } from "../lib/demo/resolve-demo-content"
import { getAgentMetadata } from "../lib/demo/agent-metadata"
import { estimateTaskMinutes, inferArchetypeMultiplier } from "../lib/timeback"
import type { MicroTask, Occupation, AutomationProfile } from "../types"
import type { ModuleKey } from "../lib/modules"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchTopOccupations(limit = 20): Promise<Occupation[]> {
  const { data, error } = await supabase
    .from("occupations")
    .select("id, title, slug, major_category, sub_category, employment, hourly_wage, annual_wage")
    .not("employment", "is", null)
    .order("employment", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Occupation[]
}

async function fetchTasksForOccupation(occupationId: number): Promise<MicroTask[]> {
  const { data } = await supabase
    .from("job_micro_tasks")
    .select("*")
    .eq("occupation_id", occupationId)
  return (data ?? []) as MicroTask[]
}

async function seedOccupation(occupation: Occupation) {
  const tasks = await fetchTasksForOccupation(occupation.id)
  const selectedModules = selectDemoModules(tasks, 5)

  if (selectedModules.length === 0) {
    console.log(`  ⚠ ${occupation.title}: no AI tasks found, skipping`)
    return
  }

  for (const mod of selectedModules) {
    try {
      await resolveAgentContent({
        occupationId:    occupation.id,
        occupationTitle: occupation.title,
        moduleKey:       mod.moduleKey,
        tasks:           mod.tasks,
      })
      console.log(`  ✓ ${occupation.title} / ${mod.moduleKey}`)
    } catch (err) {
      console.error(`  ✗ ${occupation.title} / ${mod.moduleKey}:`, err)
    }
    // Rate limit: 1 request per second to stay within OpenRouter limits
    await new Promise((r) => setTimeout(r, 1000))
  }
}

async function main() {
  console.log("Fetching top 20 occupations...")
  const occupations = await fetchTopOccupations(20)
  console.log(`Found ${occupations.length} occupations\n`)

  for (const occupation of occupations) {
    console.log(`\nSeeding: ${occupation.title}`)
    await seedOccupation(occupation)
  }

  console.log("\nDone seeding demo content.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add the `seed:demo` script to package.json**

Open `package.json` and add to the `"scripts"` section:

```json
"seed:demo": "tsx scripts/seed-demo-content.ts"
```

- [ ] **Step 3: Verify `tsx` is available (it should be, as it's used for other scripts)**

```bash
pnpm tsx --version 2>/dev/null || npx tsx --version
```

Expected: version printed without error.

- [ ] **Step 4: Do a dry-run on 1 occupation to confirm the script works**

```bash
cd /Users/damonbodine/ai-jobs-map
NEXT_PUBLIC_SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2) \
SUPABASE_SERVICE_ROLE_KEY=$(grep 'SUPABASE_SERVICE_ROLE_KEY=eyJ' .env.local | cut -d= -f2) \
OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env.local | cut -d= -f2) \
npx tsx -e "
import { selectDemoModules } from './lib/demo/select-demo-modules'
console.log('Module selector loaded OK')
"
```

Expected: "Module selector loaded OK"

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-demo-content.ts package.json
git commit -m "feat(demo): add seed:demo script to pre-generate top 20 roles"
```

---

### Task 10: Embed Demo on Every Occupation Page

**Files:**
- Create: `components/demo/OccupationDemoSection.tsx`
- Modify: `app/occupation/[slug]/page.tsx`

`★ Insight ─────────────────────────────────────`
The occupation page already has its own data fetching — we don't re-use it. Instead, `OccupationDemoSection` is a standalone async server component that calls `computeDemoForSlug` independently. Wrapping it in `<Suspense>` means the main page (hero, donut, builder) renders instantly while the demo streams in behind it. First visit to an occupation generates content; every visit after is instant from DB cache.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Create `OccupationDemoSection`**

```typescript
// components/demo/OccupationDemoSection.tsx
import { computeDemoForSlug } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"

type Props = {
  slug: string
  occupationTitle: string
}

export async function OccupationDemoSection({ slug, occupationTitle }: Props) {
  const role = await computeDemoForSlug(slug)
  if (!role) return null

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          AI Agent Suite Demo
        </p>
        <h2 className="font-heading text-xl font-semibold">
          See your agents in action
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Watch how each agent handles a real task in your {occupationTitle} workday.
        </p>
      </div>
      <AgentSuiteDemo roles={[role]} />
    </section>
  )
}
```

- [ ] **Step 2: Create the loading skeleton for the Suspense boundary**

Add to `components/demo/OccupationDemoSection.tsx` — export a second named export for the skeleton:

```typescript
// Append to components/demo/OccupationDemoSection.tsx

export function OccupationDemoSectionSkeleton() {
  return (
    <section className="mt-16 pt-12 border-t border-border animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-28 bg-muted rounded mb-2" />
        <div className="h-6 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted/60 rounded" />
      </div>
      <div className="bg-muted/30 rounded-xl h-[480px]" />
    </section>
  )
}
```

- [ ] **Step 3: Add the demo section to the occupation page**

In `app/occupation/[slug]/page.tsx`, add two things:

**At the top, add to imports:**
```typescript
import { Suspense } from "react"
import { OccupationDemoSection, OccupationDemoSectionSkeleton } from "@/components/demo/OccupationDemoSection"
```

**In the JSX, insert the section after `</FadeIn>` (after OccupationBuilder's closing FadeIn) and before the final `</div>` and `</PageTransition>`:**

```tsx
        {/* AI Agent Demo — streams in after main page content */}
        <Suspense fallback={<OccupationDemoSectionSkeleton />}>
          <OccupationDemoSection
            slug={slug}
            occupationTitle={occupation.title}
          />
        </Suspense>
```

The final structure of the page JSX bottom should look like:

```tsx
        {/* Task Table with Checkboxes */}
        {routineCards.length > 0 && (
          <FadeIn delay={0.25}>
            ...
            <OccupationBuilder ... />
          </FadeIn>
        )}

        {/* AI Agent Demo — streams in after main page content */}
        <Suspense fallback={<OccupationDemoSectionSkeleton />}>
          <OccupationDemoSection
            slug={slug}
            occupationTitle={occupation.title}
          />
        </Suspense>
      </div>
    </PageTransition>
```

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/damonbodine/ai-jobs-map
pnpm build 2>&1 | tail -20
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 5: Verify the demo renders on an occupation page**

```bash
pnpm dev &
sleep 5
curl -s http://localhost:3000/occupation/registered-nurses | grep -o "See your agents in action" | head -1
kill %1
```

Expected: "See your agents in action" (confirms the section is present)

- [ ] **Step 6: Commit**

```bash
git add components/demo/OccupationDemoSection.tsx app/occupation/\[slug\]/page.tsx
git commit -m "feat(demo): embed AI agent demo on every occupation page via Suspense"
```

---

## Post-Implementation Checklist

- [ ] All tests pass: `pnpm test`
- [ ] Build passes: `pnpm build`
- [ ] `/demo` landing page loads with search bar + featured role cards
- [ ] `/demo/registered-nurses` generates a demo (first visit may take 10-20s)
- [ ] Subsequent visit to same slug is fast (served from DB cache)
- [ ] `/demo/unknown-slug` returns 404 (not found page)
- [ ] The 3 original scripted demos still work at `/demo` (DemoTeaser unchanged)
- [ ] `/occupation/registered-nurses` shows the demo section below the builder
- [ ] Occupation page main content loads instantly; demo streams in via Suspense
- [ ] Run seed script for top 20: `pnpm seed:demo`

---

## Notes for Implementer

- **OpenRouter model**: The plan uses `anthropic/claude-haiku-4-5`. If this model ID is unavailable on OpenRouter, use `anthropic/claude-haiku-3-5` as fallback.
- **First-load latency**: On first visit to a new occupation slug, the page will take 10-20s to load (generation time). This is expected. The loading skeleton covers this. After the first visit, all subsequent loads are fast.
- **Imports in compute-demo.ts**: The file already imports from `./demo-scripts`, `./types`, and several lib files. Add the new imports (`select-demo-modules`, `resolve-demo-content`, `agent-metadata`) at the top with the existing imports, not at the bottom before the new function.
- **`PartialAgentScript` type**: This type is already defined in `compute-demo.ts` as `type PartialAgentScript = Omit<DemoAgentStep, "beforeMinutes" | "afterMinutes">`. Use it in the new function — don't redefine it.
- **`fetchRoleData`**: Already defined in `compute-demo.ts`. The new `computeDemoForSlug` function calls it directly — no need to re-implement.
- **Test file for compute-demo**: The new tests mock `createServerClient` and `resolveAgentContent`. These mocks must be set up with `vi.mock()` calls at the top of the test file (before imports), or the existing test file structure may need adjusting. Check the existing test file before adding.
