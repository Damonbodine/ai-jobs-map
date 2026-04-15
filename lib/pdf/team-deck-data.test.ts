import { impactRetentionFactor, computeRoleSections, computeTopModules, computePhases, type RoleDeckSection, type TaskWithTimes } from "./team-deck-data"
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
    // impact level 5 → retention 0.15 → afterMinutes = round(beforeMinutes * 0.15), floored to 1
    // Verify the calculation: afterMinutes should equal max(1, round(beforeMinutes * 0.15))
    const expected = Math.max(1, Math.round(task.beforeMinutes * 0.15))
    expect(task.afterMinutes).toBe(expected)
  })

  it("returns empty array when slug not found in roleData", () => {
    const roleData = new Map<string, any>()
    const cart = [{ slug: "unknown-role", count: 1, selectedTaskIds: [1] }]
    const sections = computeRoleSections(cart, roleData)
    expect(sections).toHaveLength(0)
  })

  it("returns section with empty modules when no tasks selected", () => {
    const roleData = new Map([
      ["registered-nurses", {
        occupation: { id: 1, slug: "registered-nurses", title: "Registered Nurses", hourly_wage: 38 },
        profile: mockProfile,
        tasks: mockTasks,
      }],
    ])
    const cart = [{ slug: "registered-nurses", count: 1, selectedTaskIds: [] }]
    const sections = computeRoleSections(cart, roleData)
    expect(sections).toHaveLength(1)
    expect(sections[0].modules).toHaveLength(0)
    expect(sections[0].topTasks).toHaveLength(0)
  })
})

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
  it("returns 0.50 for null impact level (default)", () => {
    expect(impactRetentionFactor(null)).toBe(0.50)
  })
})

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
