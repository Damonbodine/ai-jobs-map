// lib/demo/compute-demo.test.ts
import { describe, it, expect } from "vitest"
import { buildDemoRoleStats } from "./compute-demo"
import type { DemoAgentStep } from "./types"

const mockTasks = [
  { id: 1, occupation_id: 10, task_name: "Triage emails", task_description: "", frequency: "daily" as const, ai_applicable: true, ai_impact_level: 5, ai_effort_to_implement: 2, ai_category: null, ai_how_it_helps: null, ai_tools: null },
  { id: 2, occupation_id: 10, task_name: "Write reports", task_description: "", frequency: "daily" as const, ai_applicable: true, ai_impact_level: 3, ai_effort_to_implement: 3, ai_category: null, ai_how_it_helps: null, ai_tools: null },
  { id: 3, occupation_id: 10, task_name: "Physical task", task_description: "", frequency: "daily" as const, ai_applicable: false, ai_impact_level: null, ai_effort_to_implement: null, ai_category: null, ai_how_it_helps: null, ai_tools: null },
]

const mockProfile = {
  id: 1, occupation_id: 10, composite_score: 70, work_activity_automation_potential: null,
  time_range_low: 40, time_range_high: 80, physical_ability_avg: 1.0,
}

const mockPartialAgents: Omit<DemoAgentStep, "beforeMinutes" | "afterMinutes">[] = [
  {
    moduleKey: "intake",
    agentName: "Scout",
    label: "Intake & Triage",
    accentColor: "#06b6d4",
    timeOfDay: "8:00 AM",
    narrative: "Test narrative",
    loop: { inputs: ["a", "b", "c"], actions: ["x", "y", "z"], outputs: ["1", "2", "3"], humanAction: "Review" },
    output: { format: "prose", label: "TEST", content: "Test output content here" },
  },
]

describe("buildDemoRoleStats", () => {
  it("returns afterMinutes <= beforeMinutes for each agent", () => {
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: mockProfile, tasks: mockTasks },
      mockPartialAgents
    )
    for (const agent of result.agents) {
      expect(agent.afterMinutes).toBeLessThanOrEqual(agent.beforeMinutes)
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

  it("handles no ai_applicable tasks gracefully", () => {
    const allNonAi = mockTasks.map((t) => ({ ...t, ai_applicable: false }))
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: null, tasks: allNonAi },
      mockPartialAgents
    )
    expect(result.agents).toHaveLength(mockPartialAgents.length)
    expect(result.totalBeforeMinutes).toBeGreaterThanOrEqual(0)
  })
})
