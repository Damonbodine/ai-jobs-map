# PDF Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing single-page PDFs with a 7-page team blueprint deck and an upgraded 2-page one-pager, both driven by task-level DB data.

**Architecture:** New `lib/pdf/team-deck.tsx` React-PDF component for the team inquiry deck; update `lib/pdf/blueprint.tsx` for the one-pager 2nd page. A new `lib/pdf/team-deck-data.ts` module handles all data-to-props computation (module breakdowns, before/after times, roadmap phases) so the PDF component stays a pure presentational layer. Both renderers are exported from the existing `lib/pdf/render.tsx` entry point.

**Tech Stack:** `@react-pdf/renderer` (React-PDF), TypeScript, Supabase (data already fetched by API routes), existing `lib/timeback.ts` + `lib/modules.ts` + `lib/blueprint.ts` utilities.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/pdf/styles.ts` | Modify | Add `PDF_MODULE_ACCENTS` map (moduleKey → hex color) |
| `lib/pdf/team-deck-data.ts` | Create | Pure functions: `computeRoleSections`, `computeTopModules`, `computePhases`, `impactRetentionFactor` |
| `lib/pdf/team-deck.tsx` | Create | React-PDF component: `TeamDeckPdf` + `TeamDeckProps` type |
| `lib/pdf/blueprint.tsx` | Modify | Add second page (module breakdown + CTA) to `"one-pager"` variant |
| `lib/pdf/render.tsx` | Modify | Export `renderTeamDeckPdf` |
| `app/api/build-a-team/inquiry/route.ts` | Modify | Swap `renderDepartmentPdf` → `renderTeamDeckPdf`, pass computed deck data |
| `app/api/one-pager/route.ts` | Modify | Pass module breakdown data to `renderBlueprintPdf` |
| `lib/pdf/blueprint.tsx` | Modify | Accept + render `moduleBreakdown` prop on one-pager variant |

---

## Task 1: Add module accent colors to styles + `impactRetentionFactor` utility

**Files:**
- Modify: `lib/pdf/styles.ts`
- Create: `lib/pdf/team-deck-data.ts`
- Create: `lib/pdf/team-deck-data.test.ts`

- [ ] **Step 1: Add `PDF_MODULE_ACCENTS` to styles.ts**

Add after the existing `PDF_COLORS` export:

```typescript
// lib/pdf/styles.ts  (add after PDF_COLORS)

export const PDF_MODULE_ACCENTS: Record<string, string> = {
  intake: "#06b6d4",
  analysis: "#6366f1",
  documentation: "#8b5cf6",
  coordination: "#10b981",
  exceptions: "#f59e0b",
  learning: "#f43f5e",
  research: "#14b8a6",
  compliance: "#ef4444",
  communication: "#f97316",
  data_reporting: "#0ea5e9",
}
```

- [ ] **Step 2: Write the failing test for `impactRetentionFactor`**

```typescript
// lib/pdf/team-deck-data.test.ts
import { impactRetentionFactor } from "./team-deck-data"

describe("impactRetentionFactor", () => {
  it("returns 0.15 for impact level 5 (85% reduction)", () => {
    expect(impactRetentionFactor(5)).toBe(0.15)
  })
  it("returns 0.30 for impact level 4", () => {
    expect(impactRetentionFactor(4)).toBe(0.30)
  })
  it("returns 0.50 for impact level 3", () => {
    expect(impactRetentionFactor(3)).toBe(0.50)
  })
  it("returns 0.70 for impact level 2", () => {
    expect(impactRetentionFactor(2)).toBe(0.70)
  })
  it("returns 0.85 for impact level 1 (15% reduction)", () => {
    expect(impactRetentionFactor(1)).toBe(0.85)
  })
  it("clamps to 0.50 for null/undefined impact level", () => {
    expect(impactRetentionFactor(null)).toBe(0.50)
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd /Users/damonbodine/ai-jobs-map
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module './team-deck-data'`

- [ ] **Step 4: Create `lib/pdf/team-deck-data.ts` with `impactRetentionFactor`**

```typescript
// lib/pdf/team-deck-data.ts
import type { MicroTask, AutomationProfile } from "@/types"
import { estimateTaskMinutes, inferArchetypeMultiplier, computeDisplayedTimeback } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
import { computeAnnualValue } from "@/lib/pricing"
import { PDF_MODULE_ACCENTS } from "./styles"

/**
 * What fraction of the original task time remains after AI assistance,
 * derived from ai_impact_level. Impact 5 = 85% reduction = 0.15 retained.
 */
export function impactRetentionFactor(impactLevel: number | null): number {
  switch (impactLevel) {
    case 5: return 0.15
    case 4: return 0.30
    case 3: return 0.50
    case 2: return 0.70
    case 1: return 0.85
    default: return 0.50
  }
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -10
```

Expected: `6 passed`

- [ ] **Step 6: Commit**

```bash
git add lib/pdf/styles.ts lib/pdf/team-deck-data.ts lib/pdf/team-deck-data.test.ts
git commit -m "feat(pdf): add module accent colors and impactRetentionFactor utility"
```

---

## Task 2: Add `computeRoleSections` to team-deck-data.ts

**Files:**
- Modify: `lib/pdf/team-deck-data.ts`
- Modify: `lib/pdf/team-deck-data.test.ts`

This function converts raw DB data (tasks + profile + occupation) for a single role into the structured `RoleDeckSection` shape the PDF component will consume.

- [ ] **Step 1: Define types and write failing test**

Add to `lib/pdf/team-deck-data.test.ts`:

```typescript
import { computeRoleSections, type RoleDeckSection } from "./team-deck-data"
import type { MicroTask, AutomationProfile } from "@/types"

const mockProfile: AutomationProfile = {
  id: 1, occupation_id: 1, composite_score: 60,
  ability_automation_potential: 0.5, work_activity_automation_potential: 0.5,
  keyword_score: 0.5, knowledge_digital_readiness: 0.5,
  task_frequency_weight: 0.3, physical_ability_avg: 1.2,
  cognitive_routine_avg: 3.0, cognitive_creative_avg: 3.0,
  top_automatable_activities: null, top_blocking_abilities: null,
  time_range_low: 20, time_range_high: 60,
  time_range_by_block: null, block_example_tasks: null,
  created_at: "", updated_at: "",
}

const mockTasks: MicroTask[] = [
  {
    id: 1, occupation_id: 1,
    task_name: "Write patient notes",
    task_description: "Draft clinical notes",
    frequency: "daily",
    ai_applicable: true,
    ai_how_it_helps: "AI drafts notes from voice input",
    ai_impact_level: 5,
    ai_effort_to_implement: 1,
    ai_category: "documentation",
    ai_tools: "GPT-4, DAX Copilot",
    created_at: "", updated_at: "",
  },
  {
    id: 2, occupation_id: 1,
    task_name: "Triage intake",
    task_description: "Sort incoming patients",
    frequency: "daily",
    ai_applicable: true,
    ai_how_it_helps: "AI prioritizes queue",
    ai_impact_level: 4,
    ai_effort_to_implement: 2,
    ai_category: "intake",
    ai_tools: "ChatGPT",
    created_at: "", updated_at: "",
  },
]

describe("computeRoleSections", () => {
  it("returns one section per role in the cart", () => {
    const roleData = new Map([
      ["registered-nurses", {
        occupation: { id: 1, slug: "registered-nurses", title: "Registered Nurses", hourly_wage: 38 },
        profile: mockProfile,
        tasks: mockTasks,
      }],
    ])
    const cart = [{ slug: "registered-nurses", count: 3, selectedTaskIds: [1, 2] }]
    const sections = computeRoleSections(cart, roleData)
    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBe("Registered Nurses")
    expect(sections[0].count).toBe(3)
  })

  it("only includes selected tasks", () => {
    const roleData = new Map([
      ["registered-nurses", {
        occupation: { id: 1, slug: "registered-nurses", title: "Registered Nurses", hourly_wage: 38 },
        profile: mockProfile,
        tasks: mockTasks,
      }],
    ])
    const cart = [{ slug: "registered-nurses", count: 1, selectedTaskIds: [1] }]
    const sections = computeRoleSections(cart, roleData)
    const allTaskNames = sections[0].modules.flatMap(m => m.topTasks.map(t => t.name))
    expect(allTaskNames).toContain("Write patient notes")
    expect(allTaskNames).not.toContain("Triage intake")
  })

  it("computes before/after minutes using impactRetentionFactor", () => {
    const roleData = new Map([
      ["registered-nurses", {
        occupation: { id: 1, slug: "registered-nurses", title: "Registered Nurses", hourly_wage: 38 },
        profile: mockProfile,
        tasks: mockTasks,
      }],
    ])
    const cart = [{ slug: "registered-nurses", count: 1, selectedTaskIds: [1] }]
    const sections = computeRoleSections(cart, roleData)
    const task = sections[0].modules[0].topTasks[0]
    // impact level 5 → retention 0.15 → afterMinutes = beforeMinutes * 0.15
    expect(task.afterMinutes).toBeCloseTo(task.beforeMinutes * 0.15, 1)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -10
```

Expected: `computeRoleSections is not a function`

- [ ] **Step 3: Add types and `computeRoleSections` to team-deck-data.ts**

```typescript
// Add to lib/pdf/team-deck-data.ts

import type { RoleData } from "@/lib/build-a-team/compute"

export type TaskWithTimes = {
  name: string
  howItHelps: string
  tools: string
  frequency: string
  impactLevel: number
  effortLevel: number
  beforeMinutes: number
  afterMinutes: number
  moduleKey: string
}

export type ModuleBreakdown = {
  moduleKey: string
  label: string
  accentColor: string
  minutesPerDay: number
  topTasks: TaskWithTimes[]
}

export type RoleDeckSection = {
  title: string
  slug: string
  count: number
  minutesPerPerson: number
  annualValuePerPerson: number
  modules: ModuleBreakdown[]
  topTasks: TaskWithTimes[]  // top 5 across all modules, sorted by beforeMinutes desc
}

export type CartItemWithSelection = {
  slug: string
  count: number
  selectedTaskIds: number[]
}

export function computeRoleSections(
  cart: CartItemWithSelection[],
  roleDataBySlug: Map<string, RoleData>
): RoleDeckSection[] {
  const sections: RoleDeckSection[] = []

  for (const cartRow of cart) {
    const data = roleDataBySlug.get(cartRow.slug)
    if (!data) continue

    const archetypeMultiplier = inferArchetypeMultiplier(data.profile)
    const selectedIds = new Set(cartRow.selectedTaskIds)
    const selectedTasks = data.tasks.filter(t => t.ai_applicable && selectedIds.has(t.id))

    // Compute raw total for proportional scaling
    const rawTotal = selectedTasks.reduce(
      (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier, 0
    )
    const { displayedMinutes } = computeDisplayedTimeback(
      data.profile, data.tasks,
      data.tasks.filter(t => t.ai_applicable).reduce(
        (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier, 0
      )
    )

    // Build TaskWithTimes for each selected task, scaling to displayedMinutes
    const tasksWithTimes: TaskWithTimes[] = selectedTasks.map(t => {
      const raw = estimateTaskMinutes(t) * archetypeMultiplier
      const scaled = rawTotal > 0 && displayedMinutes > 0
        ? Math.max(1, Math.round((raw / rawTotal) * displayedMinutes))
        : Math.max(1, Math.round(raw))
      const retention = impactRetentionFactor(t.ai_impact_level)
      return {
        name: t.task_name,
        howItHelps: t.ai_how_it_helps ?? "",
        tools: t.ai_tools ?? "",
        frequency: t.frequency,
        impactLevel: t.ai_impact_level ?? 3,
        effortLevel: t.ai_effort_to_implement ?? 3,
        beforeMinutes: scaled,
        afterMinutes: Math.max(1, Math.round(scaled * retention)),
        moduleKey: getBlockForTask(t),
      }
    })

    // Group into modules
    const moduleMap = new Map<string, TaskWithTimes[]>()
    for (const t of tasksWithTimes) {
      const arr = moduleMap.get(t.moduleKey) ?? []
      arr.push(t)
      moduleMap.set(t.moduleKey, arr)
    }

    const modules: ModuleBreakdown[] = []
    for (const [moduleKey, moduleTasks] of moduleMap) {
      const def = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
      const minutesPerDay = moduleTasks.reduce((s, t) => s + t.beforeMinutes - t.afterMinutes, 0)
      modules.push({
        moduleKey,
        label: def?.label ?? moduleKey,
        accentColor: PDF_MODULE_ACCENTS[moduleKey] ?? "#6b7280",
        minutesPerDay: Math.round(minutesPerDay),
        topTasks: [...moduleTasks].sort((a, b) => b.beforeMinutes - a.beforeMinutes).slice(0, 4),
      })
    }
    modules.sort((a, b) => b.minutesPerDay - a.minutesPerDay)

    const topTasks = [...tasksWithTimes]
      .sort((a, b) => b.beforeMinutes - a.beforeMinutes)
      .slice(0, 5)

    const annualValuePerPerson = computeAnnualValue(displayedMinutes, data.occupation.hourly_wage)

    sections.push({
      title: data.occupation.title,
      slug: data.occupation.slug,
      count: cartRow.count,
      minutesPerPerson: displayedMinutes,
      annualValuePerPerson,
      modules,
      topTasks,
    })
  }

  return sections
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -10
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/team-deck-data.ts lib/pdf/team-deck-data.test.ts
git commit -m "feat(pdf): add computeRoleSections with before/after task times"
```

---

## Task 3: Add `computeTopModules` and `computePhases` to team-deck-data.ts

**Files:**
- Modify: `lib/pdf/team-deck-data.ts`
- Modify: `lib/pdf/team-deck-data.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `lib/pdf/team-deck-data.test.ts`:

```typescript
import { computeTopModules, computePhases } from "./team-deck-data"

const sampleSections: RoleDeckSection[] = [
  {
    title: "Registered Nurses", slug: "registered-nurses", count: 2,
    minutesPerPerson: 60, annualValuePerPerson: 7000,
    topTasks: [],
    modules: [
      { moduleKey: "documentation", label: "Documentation", accentColor: "#8b5cf6", minutesPerDay: 28,
        topTasks: [
          { name: "Notes", howItHelps: "", tools: "", frequency: "daily", impactLevel: 5, effortLevel: 1,
            beforeMinutes: 18, afterMinutes: 3, moduleKey: "documentation" },
        ]},
      { moduleKey: "intake", label: "Intake", accentColor: "#06b6d4", minutesPerDay: 15,
        topTasks: [
          { name: "Triage", howItHelps: "", tools: "", frequency: "daily", impactLevel: 3, effortLevel: 2,
            beforeMinutes: 12, afterMinutes: 6, moduleKey: "intake" },
        ]},
    ],
  },
]

describe("computeTopModules", () => {
  it("returns modules sorted by total minutesPerDay across all roles, capped at 4", () => {
    const top = computeTopModules(sampleSections)
    expect(top.length).toBeLessThanOrEqual(4)
    expect(top[0].moduleKey).toBe("documentation")
    expect(top[1].moduleKey).toBe("intake")
  })
})

describe("computePhases", () => {
  it("puts effortLevel <= 2 tasks in phase1", () => {
    const allTasks: TaskWithTimes[] = [
      { name: "A", howItHelps: "", tools: "", frequency: "daily", impactLevel: 5,
        effortLevel: 1, beforeMinutes: 10, afterMinutes: 2, moduleKey: "documentation" },
      { name: "B", howItHelps: "", tools: "", frequency: "daily", impactLevel: 3,
        effortLevel: 3, beforeMinutes: 8, afterMinutes: 4, moduleKey: "intake" },
      { name: "C", howItHelps: "", tools: "", frequency: "daily", impactLevel: 2,
        effortLevel: 4, beforeMinutes: 6, afterMinutes: 4, moduleKey: "coordination" },
    ]
    const phases = computePhases(allTasks)
    expect(phases.phase1.map(t => t.name)).toContain("A")
    expect(phases.phase2.map(t => t.name)).toContain("B")
    expect(phases.phase3.map(t => t.name)).toContain("C")
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -10
```

Expected: `computeTopModules is not a function`

- [ ] **Step 3: Add `computeTopModules` and `computePhases` to team-deck-data.ts**

```typescript
// Add to lib/pdf/team-deck-data.ts

export function computeTopModules(sections: RoleDeckSection[]): ModuleBreakdown[] {
  // Merge modules across all roles, summing minutesPerDay
  const merged = new Map<string, ModuleBreakdown>()
  for (const section of sections) {
    for (const mod of section.modules) {
      const existing = merged.get(mod.moduleKey)
      if (existing) {
        merged.set(mod.moduleKey, {
          ...existing,
          minutesPerDay: existing.minutesPerDay + mod.minutesPerDay,
          topTasks: [...existing.topTasks, ...mod.topTasks]
            .sort((a, b) => b.beforeMinutes - a.beforeMinutes)
            .slice(0, 4),
        })
      } else {
        merged.set(mod.moduleKey, { ...mod })
      }
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.minutesPerDay - a.minutesPerDay)
    .slice(0, 4)
}

export type PhasedRoadmap = {
  phase1: TaskWithTimes[]  // effortLevel <= 2: quick wins
  phase2: TaskWithTimes[]  // effortLevel === 3: medium lift
  phase3: TaskWithTimes[]  // effortLevel >= 4: heavy lift
}

export function computePhases(allTasks: TaskWithTimes[]): PhasedRoadmap {
  const sorted = [...allTasks].sort((a, b) => b.impactLevel - a.impactLevel)
  return {
    phase1: sorted.filter(t => t.effortLevel <= 2),
    phase2: sorted.filter(t => t.effortLevel === 3),
    phase3: sorted.filter(t => t.effortLevel >= 4),
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -10
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/team-deck-data.ts lib/pdf/team-deck-data.test.ts
git commit -m "feat(pdf): add computeTopModules and computePhases utilities"
```

---

## Task 4: Build `TeamDeckPdf` component — pages 1–3 (Cover, Overview, Methodology)

**Files:**
- Create: `lib/pdf/team-deck.tsx`

- [ ] **Step 1: Create `lib/pdf/team-deck.tsx` with types and pages 1–3**

```typescript
// lib/pdf/team-deck.tsx
import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PDF_COLORS as C, PDF_MODULE_ACCENTS } from "./styles"
import type { RoleDeckSection, ModuleBreakdown, PhasedRoadmap } from "./team-deck-data"
import type { DepartmentTotals } from "@/lib/build-a-team/compute"

export type TeamDeckProps = {
  teamLabel: string
  contactEmail: string
  contactName?: string
  customRequests: string[]
  totals: DepartmentTotals
  roles: RoleDeckSection[]
  topModules: ModuleBreakdown[]
  phases: PhasedRoadmap
  siteUrl: string
  agencyName: string
  generatedAt: string
}

const s = StyleSheet.create({
  // ── Shared ──
  page: { backgroundColor: C.bg, padding: 48, fontSize: 10, color: C.fg, lineHeight: 1.5 },
  darkPage: { backgroundColor: C.fg, padding: 48, fontSize: 10, color: C.bg, lineHeight: 1.5 },
  footer: {
    position: "absolute", bottom: 32, left: 48, right: 48,
    borderTop: `1 solid ${C.border}`, paddingTop: 10,
    fontSize: 8, color: C.muted, flexDirection: "row", justifyContent: "space-between",
  },
  darkFooter: {
    position: "absolute", bottom: 32, left: 48, right: 48,
    borderTop: "1 solid rgba(255,255,255,0.15)", paddingTop: 10,
    fontSize: 8, color: "rgba(255,255,255,0.4)", flexDirection: "row", justifyContent: "space-between",
  },
  kicker: { fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 },
  darkKicker: { fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, fontWeight: 600, color: "rgba(255,255,255,0.45)" },
  h1: { fontSize: 28, fontWeight: 700, lineHeight: 1.2, marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
  h3: { fontSize: 13, fontWeight: 700, marginBottom: 8 },
  body: { fontSize: 10, color: C.fg },
  muted: { fontSize: 9, color: C.muted },
  section: { marginBottom: 24 },
  // ── Stats ──
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.cardBg, border: `1 solid ${C.border}`, borderRadius: 8, padding: 12 },
  statLabel: { fontSize: 7, letterSpacing: 0.8, textTransform: "uppercase", color: C.muted, marginBottom: 3 },
  statValue: { fontSize: 22, fontWeight: 700 },
  statUnit: { fontSize: 10, color: C.muted },
  // ── Table ──
  tableHeader: { flexDirection: "row", borderBottom: `1 solid ${C.border}`, paddingBottom: 5, marginBottom: 5, fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted, fontWeight: 600 },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottom: `1 solid ${C.border}` },
  // ── Bullet ──
  bullet: { flexDirection: "row", marginBottom: 6 },
  bulletDot: { width: 16, color: C.accent, fontWeight: 700 },
  bulletBody: { flex: 1 },
  // ── Module row ──
  moduleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, padding: 10, backgroundColor: C.cardBg, border: `1 solid ${C.border}`, borderRadius: 6 },
  // ── Callout ──
  callout: { backgroundColor: C.accentSoft, borderRadius: 8, padding: 14, marginBottom: 16 },
})

function Footer({ agencyName, siteUrl, page, dark }: { agencyName: string; siteUrl: string; page: number; dark?: boolean }) {
  return (
    <View style={dark ? s.darkFooter : s.footer} fixed>
      <Text>{agencyName} · {siteUrl}</Text>
      <Text>Page {page}</Text>
    </View>
  )
}

// ── Page 1: Cover ──────────────────────────────────────────────
function CoverPage({ props }: { props: TeamDeckProps }) {
  const hoursPerYear = Math.round((props.totals.totalMinutesPerDay * 240) / 60)
  return (
    <Page size="LETTER" style={s.darkPage}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={s.darkKicker}>AI Timeback · Team Blueprint</Text>
        <Text style={[s.h1, { color: C.bg, marginBottom: 6 }]}>
          Your team reclaims{"\n"}
          <Text style={{ color: "#60a5fa" }}>{hoursPerYear.toLocaleString()} hours</Text>
          {"\n"}every year.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
          {props.roles.map(r => (
            <View key={r.slug} style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{r.title} ×{r.count}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ borderTop: "1 solid rgba(255,255,255,0.12)", paddingTop: 16 }}>
        <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.4)" }}>
          Prepared by {props.agencyName} · {props.generatedAt}
        </Text>
      </View>
    </Page>
  )
}

// ── Page 2: Team Overview ──────────────────────────────────────
function OverviewPage({ props }: { props: TeamDeckProps }) {
  const hoursPerYear = Math.round((props.totals.totalMinutesPerDay * 240) / 60)
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={[s.kicker, { color: C.accent }]}>Team at a Glance</Text>
      <Text style={s.h2}>What AI gives back — across your whole team</Text>
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Hours reclaimed / year</Text>
          <Text style={s.statValue}>{hoursPerYear.toLocaleString()}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Annual value</Text>
          <Text style={s.statValue}>${Math.round(props.totals.totalAnnualValue).toLocaleString()}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>FTE equivalents</Text>
          <Text style={s.statValue}>{props.totals.fteEquivalents}<Text style={s.statUnit}> FTE</Text></Text>
        </View>
      </View>
      <Text style={s.h3}>Roles in this blueprint</Text>
      <View style={s.tableHeader}>
        <Text style={{ flex: 3 }}>Role</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>People</Text>
        <Text style={{ flex: 1.5, textAlign: "right" }}>Min/day each</Text>
        <Text style={{ flex: 1.5, textAlign: "right" }}>Annual value</Text>
      </View>
      {props.roles.map(r => (
        <View key={r.slug} style={s.tableRow}>
          <Text style={{ flex: 3 }}>{r.title}</Text>
          <Text style={{ flex: 1, textAlign: "center" }}>{r.count}</Text>
          <Text style={{ flex: 1.5, textAlign: "right" }}>{r.minutesPerPerson}</Text>
          <Text style={{ flex: 1.5, textAlign: "right" }}>${Math.round(r.annualValuePerPerson * r.count).toLocaleString()}</Text>
        </View>
      ))}
      {props.customRequests.length > 0 && (
        <View style={[s.callout, { marginTop: 16 }]}>
          <Text style={[s.h3, { marginBottom: 6 }]}>Custom requests noted</Text>
          {props.customRequests.map((req, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>·</Text>
              <Text style={s.bulletBody}>{req}</Text>
            </View>
          ))}
        </View>
      )}
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={2} />
    </Page>
  )
}

// ── Page 3: Methodology ────────────────────────────────────────
function MethodologyPage({ props }: { props: TeamDeckProps }) {
  const steps = [
    { n: "1", text: "Bureau of Labor Statistics + O*NET occupational task data was loaded for each role in your team." },
    { n: "2", text: "Each task was scored for AI impact (1–5) based on task description, frequency, and category. Tasks requiring physical presence, creative judgment, or human empathy were scored lower." },
    { n: "3", text: "Tasks were grouped into AI agent modules (Documentation, Intake, Coordination, etc.) by their primary work function." },
    { n: "4", text: "Your task selections were applied as the filter — only the tasks you chose to include appear in this blueprint." },
  ]
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={[s.kicker, { color: C.accent }]}>How these numbers were derived</Text>
      <Text style={s.h2}>Methodology</Text>
      <View style={s.section}>
        {steps.map(step => (
          <View key={step.n} style={[s.bullet, { marginBottom: 14 }]}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.fg, marginRight: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: C.bg }}>{step.n}</Text>
            </View>
            <Text style={[s.bulletBody, { paddingTop: 3 }]}>{step.text}</Text>
          </View>
        ))}
      </View>
      <View style={[s.callout, { marginTop: 8 }]}>
        <Text style={{ fontSize: 9, color: C.fg, lineHeight: 1.5 }}>
          Numbers represent median estimates based on typical workflows for these occupations. Your actual time savings will depend on workflow complexity, EHR/tool integrations, and team adoption speed. We refine all estimates during the scoping engagement.
        </Text>
      </View>
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={3} />
    </Page>
  )
}

export function TeamDeckPdf(props: TeamDeckProps) {
  return (
    <Document title={`AI Team Blueprint — ${props.teamLabel}`} author={props.agencyName}>
      <CoverPage props={props} />
      <OverviewPage props={props} />
      <MethodologyPage props={props} />
    </Document>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/damonbodine/ai-jobs-map
npx tsc --noEmit 2>&1 | grep "team-deck" | head -20
```

Expected: no errors for team-deck files

- [ ] **Step 3: Commit**

```bash
git add lib/pdf/team-deck.tsx
git commit -m "feat(pdf): add TeamDeckPdf pages 1-3 (cover, overview, methodology)"
```

---

## Task 5: Add role section pages, module deep-dives, roadmap + CTA to TeamDeckPdf

**Files:**
- Modify: `lib/pdf/team-deck.tsx`

- [ ] **Step 1: Add role section pages (one per role) to team-deck.tsx**

Add these components before the `TeamDeckPdf` export:

```typescript
// ── Role Section Page ──────────────────────────────────────────
function RoleSectionPage({ role, pageNum, props }: { role: RoleDeckSection; pageNum: number; props: TeamDeckProps }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ width: 6, height: 36, borderRadius: 3, backgroundColor: C.accent, marginRight: 12 }} />
        <View>
          <Text style={[s.h2, { marginBottom: 2 }]}>{role.title}</Text>
          <Text style={s.muted}>{role.count} {role.count === 1 ? "person" : "people"} · {role.minutesPerPerson} min/day · ${Math.round(role.annualValuePerPerson * role.count).toLocaleString()}/yr total</Text>
        </View>
      </View>

      <Text style={s.h3}>Time reclaimed by module</Text>
      {role.modules.map(mod => (
        <View key={mod.moduleKey} style={[s.moduleRow, { borderLeftWidth: 4, borderLeftColor: mod.accentColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: 600 }}>{mod.label}</Text>
            <Text style={s.muted}>{mod.topTasks.slice(0, 2).map(t => t.name).join(" · ")}</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: 700, color: mod.accentColor }}>{mod.minutesPerDay} min</Text>
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        <Text style={s.h3}>Top tasks — before & after AI</Text>
        <View style={s.tableHeader}>
          <Text style={{ flex: 3 }}>Task</Text>
          <Text style={{ flex: 1, textAlign: "center" }}>Before</Text>
          <Text style={{ flex: 1, textAlign: "center" }}>After</Text>
          <Text style={{ flex: 1.5 }}>Tools</Text>
        </View>
        {role.topTasks.map((t, i) => (
          <View key={i} style={s.tableRow}>
            <View style={{ flex: 3 }}>
              <Text style={{ fontSize: 9, fontWeight: 600 }}>{t.name}</Text>
              <Text style={[s.muted, { fontSize: 8 }]}>{t.howItHelps.slice(0, 80)}{t.howItHelps.length > 80 ? "…" : ""}</Text>
            </View>
            <Text style={{ flex: 1, textAlign: "center", fontSize: 9 }}>{t.beforeMinutes}m</Text>
            <Text style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#16a34a", fontWeight: 600 }}>{t.afterMinutes}m</Text>
            <Text style={{ flex: 1.5, fontSize: 8, color: C.muted }}>{t.tools.split(",")[0]}</Text>
          </View>
        ))}
      </View>

      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={pageNum} />
    </Page>
  )
}

// ── Module Deep-Dive Page ──────────────────────────────────────
function ModuleDeepDivePage({ mod, pageNum, props }: { mod: ModuleBreakdown; pageNum: number; props: TeamDeckProps }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: mod.accentColor, marginRight: 8 }} />
        <Text style={[s.kicker, { color: mod.accentColor, marginBottom: 0 }]}>{mod.label} Module</Text>
      </View>
      <Text style={s.h2}>{mod.minutesPerDay} minutes reclaimed daily across your team</Text>

      <View style={s.tableHeader}>
        <Text style={{ flex: 3 }}>Task</Text>
        <Text style={{ flex: 1 }}>Freq</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>Impact</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>Before</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>After</Text>
        <Text style={{ flex: 1.5 }}>Tools</Text>
      </View>
      {mod.topTasks.map((t, i) => (
        <View key={i} style={s.tableRow}>
          <View style={{ flex: 3 }}>
            <Text style={{ fontSize: 9, fontWeight: 600 }}>{t.name}</Text>
            <Text style={[s.muted, { fontSize: 8 }]}>{t.howItHelps.slice(0, 70)}{t.howItHelps.length > 70 ? "…" : ""}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 8, color: C.muted }}>{t.frequency}</Text>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 9 }}>{"●".repeat(t.impactLevel)}</Text>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 9 }}>{t.beforeMinutes}m</Text>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#16a34a", fontWeight: 600 }}>{t.afterMinutes}m</Text>
          <Text style={{ flex: 1.5, fontSize: 8, color: C.muted }}>{t.tools.split(",")[0]}</Text>
        </View>
      ))}
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={pageNum} />
    </Page>
  )
}

// ── Roadmap Page ───────────────────────────────────────────────
function RoadmapPage({ phases, pageNum, props }: { phases: PhasedRoadmap; pageNum: number; props: TeamDeckProps }) {
  const phaseConfig = [
    { key: "phase1" as const, label: "Phase 1 — Weeks 1–4", subtitle: "Quick wins: low effort, high impact", color: "#dcfce7", textColor: "#166534" },
    { key: "phase2" as const, label: "Phase 2 — Month 2–3", subtitle: "Medium lift: moderate setup required", color: "#eff6ff", textColor: "#1d4ed8" },
    { key: "phase3" as const, label: "Phase 3 — Month 4+", subtitle: "Heavy lift: deep integrations", color: "#faf5ff", textColor: "#7e22ce" },
  ]
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={[s.kicker, { color: C.accent }]}>Implementation</Text>
      <Text style={s.h2}>Phased rollout — ordered by effort</Text>
      {phaseConfig.map(({ key, label, subtitle, color, textColor }) => (
        <View key={key} style={{ backgroundColor: color, borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: 700, color: textColor, marginBottom: 2 }}>{label}</Text>
          <Text style={{ fontSize: 8, color: textColor, opacity: 0.8, marginBottom: 8 }}>{subtitle}</Text>
          {phases[key].slice(0, 5).map((t, i) => (
            <View key={i} style={[s.bullet, { marginBottom: 3 }]}>
              <Text style={[s.bulletDot, { color: textColor }]}>·</Text>
              <Text style={{ flex: 1, fontSize: 9, color: "#1a1a1a" }}>
                {t.name}
                <Text style={{ color: C.muted }}>{" — "}{t.beforeMinutes}m → {t.afterMinutes}m</Text>
              </Text>
            </View>
          ))}
          {phases[key].length > 5 && (
            <Text style={{ fontSize: 8, color: textColor, opacity: 0.7, marginTop: 4 }}>
              + {phases[key].length - 5} more tasks
            </Text>
          )}
        </View>
      ))}
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={pageNum} />
    </Page>
  )
}

// ── CTA Page ───────────────────────────────────────────────────
function CtaPage({ props }: { props: TeamDeckProps }) {
  return (
    <Page size="LETTER" style={s.darkPage}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={s.darkKicker}>Next step</Text>
        <Text style={[s.h1, { color: C.bg, marginBottom: 16 }]}>
          Book a 30-minute{"\n"}scoping call.
        </Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 400 }}>
          We'll walk through this blueprint together, answer questions, and give you a fixed-price implementation proposal within 48 hours.
        </Text>
      </View>
      <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 16 }}>
        <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Place To Stand Agency</Text>
        <Text style={{ fontSize: 10, color: C.bg }}>{props.agencyName}</Text>
        <Text style={{ fontSize: 10, color: "#60a5fa", marginTop: 2 }}>{props.siteUrl}/contact</Text>
      </View>
    </Page>
  )
}
```

- [ ] **Step 2: Update `TeamDeckPdf` export to include all pages**

Replace the existing `TeamDeckPdf` function with:

```typescript
export function TeamDeckPdf(props: TeamDeckProps) {
  // page numbers: 1=cover, 2=overview, 3=methodology, 4..=roles, then modules, roadmap, cta
  let pageNum = 3
  return (
    <Document title={`AI Team Blueprint — ${props.teamLabel}`} author={props.agencyName}>
      <CoverPage props={props} />
      <OverviewPage props={props} />
      <MethodologyPage props={props} />
      {props.roles.map(role => {
        pageNum++
        return <RoleSectionPage key={role.slug} role={role} pageNum={pageNum} props={props} />
      })}
      {props.topModules.map(mod => {
        pageNum++
        return <ModuleDeepDivePage key={mod.moduleKey} mod={mod} pageNum={pageNum} props={props} />
      })}
      <RoadmapPage phases={props.phases} pageNum={++pageNum} props={props} />
      <CtaPage props={props} />
    </Document>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "team-deck" | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/pdf/team-deck.tsx
git commit -m "feat(pdf): complete TeamDeckPdf all pages (roles, modules, roadmap, CTA)"
```

---

## Task 6: Wire `renderTeamDeckPdf` into render.tsx and the inquiry API route

**Files:**
- Modify: `lib/pdf/render.tsx`
- Modify: `app/api/build-a-team/inquiry/route.ts`

- [ ] **Step 1: Add `renderTeamDeckPdf` to render.tsx**

```typescript
// lib/pdf/render.tsx  — add import and export
import { TeamDeckPdf, type TeamDeckProps } from "./team-deck"

export async function renderTeamDeckPdf(props: TeamDeckProps): Promise<Buffer> {
  return renderToBuffer(<TeamDeckPdf {...props} />)
}
```

Full updated file:

```typescript
import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { BlueprintPdf, type BlueprintPdfProps } from "./blueprint"
import { DepartmentPdf, type DepartmentPdfProps } from "./department"
import { TeamDeckPdf, type TeamDeckProps } from "./team-deck"

export async function renderBlueprintPdf(props: BlueprintPdfProps): Promise<Buffer> {
  return renderToBuffer(<BlueprintPdf {...props} />)
}

export async function renderDepartmentPdf(props: DepartmentPdfProps): Promise<Buffer> {
  return renderToBuffer(<DepartmentPdf {...props} />)
}

export async function renderTeamDeckPdf(props: TeamDeckProps): Promise<Buffer> {
  return renderToBuffer(<TeamDeckPdf {...props} />)
}
```

- [ ] **Step 2: Update inquiry route to use renderTeamDeckPdf**

In `app/api/build-a-team/inquiry/route.ts`, replace the import and the PDF generation block:

Add to imports:
```typescript
import { renderTeamDeckPdf } from "@/lib/pdf/render"
import { computeRoleSections, computeTopModules, computePhases } from "@/lib/pdf/team-deck-data"
import type { CartItemWithSelection } from "@/lib/pdf/team-deck-data"
```

Remove:
```typescript
import { renderDepartmentPdf } from "@/lib/pdf/render"
```

Replace the entire `try { pdfBuffer = await renderDepartmentPdf(...)  } catch` block (lines ~114–137) with:

```typescript
  try {
    const cartWithSelections: CartItemWithSelection[] = input.roles.map(r => ({
      slug: r.slug,
      count: r.count,
      selectedTaskIds: r.selectedTaskIds,
    }))
    const roleSections = computeRoleSections(cartWithSelections, roleDataBySlug)
    const topModules = computeTopModules(roleSections)
    const allTasks = roleSections.flatMap(r => r.topTasks)
    const phases = computePhases(allTasks)

    pdfBuffer = await renderTeamDeckPdf({
      teamLabel: `${input.contactName ?? input.contactEmail}'s team`,
      contactEmail: input.contactEmail,
      contactName: input.contactName,
      customRequests: input.customRequests,
      totals,
      roles: roleSections,
      topModules,
      phases,
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
  } catch (err) {
    pdfError = err instanceof Error ? err.message : String(err)
    console.error("[build-a-team/inquiry] pdf failed", err)
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/pdf/render.tsx app/api/build-a-team/inquiry/route.ts
git commit -m "feat(pdf): wire renderTeamDeckPdf into inquiry API route"
```

---

## Task 7: Upgrade the one-pager to 2 pages in blueprint.tsx

**Files:**
- Modify: `lib/pdf/blueprint.tsx`
- Modify: `app/api/one-pager/route.ts`

The one-pager currently has no module data. We'll add a `moduleBreakdown` optional prop to `BlueprintPdfProps` and render a second page when it's present.

- [ ] **Step 1: Add `moduleBreakdown` to `BlueprintPdfProps` and second page**

In `lib/pdf/blueprint.tsx`, update the `BlueprintPdfProps` type to add:

```typescript
// Add to BlueprintPdfProps
moduleBreakdown?: Array<{
  moduleKey: string
  label: string
  accentColor: string
  minutesPerDay: number
  topTaskNames: string[]
}>
```

Add new styles inside `StyleSheet.create({...})`:

```typescript
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 10,
    backgroundColor: COLORS.cardBg,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 6,
  },
  page2Callout: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 8,
    padding: 14,
    marginTop: 24,
  },
```

Add a second `<Page>` inside `BlueprintPdf`'s `<Document>` when `props.moduleBreakdown` exists — add this after the existing `</Page>` closing tag:

```typescript
      {props.variant === "one-pager" && props.moduleBreakdown && props.moduleBreakdown.length > 0 ? (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.kicker}>AI MODULES FOR THIS ROLE</Text>
            <Text style={styles.title} render={() => props.occupation.title} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Modules for this role</Text>
            {props.moduleBreakdown.map(mod => (
              <View
                key={mod.moduleKey}
                style={[styles.moduleRow, { borderLeftWidth: 4, borderLeftColor: mod.accentColor }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleName}>{mod.label}</Text>
                  <Text style={styles.moduleBlurb}>{mod.topTaskNames.join(" · ")}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: 700, color: mod.accentColor }}>
                  {mod.minutesPerDay} min/day
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.page2Callout}>
            <Text style={[styles.calloutTitle, { marginBottom: 6 }]}>
              Want this built for your team?
            </Text>
            <Text style={styles.calloutBody}>
              {props.siteUrl}/build-a-team — configure your team, select the modules that matter, and receive a full blueprint like this one for every role.
            </Text>
          </View>

          <View style={styles.footer} fixed>
            <Text>{props.agencyName} · {props.siteUrl}</Text>
            <Text>Generated {props.generatedAt}</Text>
          </View>
        </Page>
      ) : null}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "blueprint" | head -20
```

Expected: no errors

- [ ] **Step 3: Update one-pager route to compute and pass moduleBreakdown**

In `app/api/one-pager/route.ts`, add to existing imports:

```typescript
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
import { PDF_MODULE_ACCENTS } from "@/lib/pdf/styles"
```

After the existing `routineCards` computation (look for the block that builds the task list for the PDF), add this before the `renderBlueprintPdf` call:

```typescript
    // Compute module breakdown for one-pager page 2
    const moduleMap = new Map<string, { minutesPerDay: number; taskNames: string[] }>()
    for (const card of routineCards) {
      const key = card.moduleKey
      const existing = moduleMap.get(key) ?? { minutesPerDay: 0, taskNames: [] }
      const mid = Math.round((card.displayLow + card.displayHigh) / 2)
      existing.minutesPerDay += mid
      if (existing.taskNames.length < 3) existing.taskNames.push(card.task_name)
      moduleMap.set(key, existing)
    }
    const moduleBreakdown = [...moduleMap.entries()]
      .map(([moduleKey, data]) => ({
        moduleKey,
        label: MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]?.label ?? moduleKey,
        accentColor: PDF_MODULE_ACCENTS[moduleKey] ?? "#6b7280",
        minutesPerDay: data.minutesPerDay,
        topTaskNames: data.taskNames,
      }))
      .sort((a, b) => b.minutesPerDay - a.minutesPerDay)
```

Then pass `moduleBreakdown` to `renderBlueprintPdf`:

```typescript
    pdfBuffer = await renderBlueprintPdf({
      variant: "one-pager",
      occupation: { title: occupation.title, slug: occupation.slug },
      stats: { minutesPerDay: displayedMinutes, annualValueDollars: annualValue, taskCount: routineCards.length },
      selectedTasks: routineCards.map(c => ({ name: c.task_name, minutesPerDay: Math.round((c.displayLow + c.displayHigh) / 2) })),
      recommendedModules: [],
      contact: { email },
      moduleBreakdown,          // ← new
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
```

Note: you'll need to look at the existing `renderBlueprintPdf` call in the route (around line 140–165) and add `moduleBreakdown` to it. The rest of the arguments stay identical.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/blueprint.tsx app/api/one-pager/route.ts
git commit -m "feat(pdf): upgrade one-pager to 2 pages with module breakdown"
```

---

## Task 8: End-to-end smoke test and deploy

**Files:**
- Modify: `tests/e2e/live-qa.spec.ts` (update assertion for one-pager)

- [ ] **Step 1: Run TypeScript check across the whole project**

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -30
```

Expected: 0 errors

- [ ] **Step 2: Run the unit tests**

```bash
npx jest lib/pdf/team-deck-data.test.ts --no-coverage 2>&1 | tail -15
```

Expected: all pass

- [ ] **Step 3: Run existing e2e smoke tests against local dev server**

```bash
npx playwright test tests/e2e/live-qa.spec.ts --reporter=list 2>&1 | tail -20
```

Expected: all 4 pass

- [ ] **Step 4: Commit and push**

```bash
git add -A
git status  # verify no unintended files
git commit -m "feat(pdf): complete PDF redesign — team deck + one-pager v2"
git push origin main
```

- [ ] **Step 5: Verify Vercel deployment completes**

```bash
vercel ls 2>&1 | head -10
```

Expected: newest deployment shows READY state

- [ ] **Step 6: Manual spot-check**

Submit the team inquiry form at `https://ai-jobs-map.vercel.app/build-a-team?roles=registered-nurses:2,software-developers:1` with `damon@placetostandagency.com`. Check that the PDF attachment is multi-page and contains role sections and module deep-dives.

Submit the one-pager form at `https://ai-jobs-map.vercel.app/occupation/registered-nurses`. Check that the PDF has 2 pages including a module breakdown.

---

## Self-Review

**Spec coverage:**
- ✅ Cover page (dark, headline hours stat, role badges) — Task 4
- ✅ Team overview (stats, role table, custom requests) — Task 4
- ✅ Methodology (4-step numbered list, caveat callout) — Task 4
- ✅ Role sections (one per role, module rows, top tasks before/after) — Task 5
- ✅ Module deep-dives (top 4, task table with impact dots) — Task 5
- ✅ Phased roadmap (effort-based grouping) — Task 5
- ✅ CTA page (dark, booking CTA, contact block) — Task 5
- ✅ `impactRetentionFactor` formula (5→0.15 ... 1→0.85) — Task 1
- ✅ `computeRoleSections` with scaled before/after times — Task 2
- ✅ `computeTopModules` capped at 4 — Task 3
- ✅ `computePhases` by effortLevel — Task 3
- ✅ One-pager page 2 module breakdown — Task 7
- ✅ One-pager page 2 CTA callout — Task 7
- ✅ API route wiring for both PDFs — Tasks 6 & 7
- ✅ Two-writes-no-silent-failure pattern preserved — existing code unchanged
- ✅ Server-side math only — all computation in `team-deck-data.ts` from DB data

**Type consistency check:**
- `CartItemWithSelection` defined in Task 2, used in Task 6 ✅
- `RoleDeckSection` defined in Task 2, used in Tasks 3, 5, 6 ✅
- `ModuleBreakdown` defined in Task 2, used in Tasks 3, 5 ✅
- `PhasedRoadmap` defined in Task 3, used in Tasks 5, 6 ✅
- `TeamDeckProps` defined in Task 4, used in Task 6 ✅
- `moduleBreakdown` prop added to `BlueprintPdfProps` in Task 7, passed from route in Task 7 ✅
