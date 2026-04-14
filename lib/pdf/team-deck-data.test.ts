import { impactRetentionFactor, computeRoleSections, type RoleDeckSection } from "./team-deck-data"
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
