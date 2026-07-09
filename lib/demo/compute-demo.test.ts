// lib/demo/compute-demo.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { buildDemoRoleStats } from "./compute-demo"
import type { DemoAgentStep } from "./types"

// Top-level mocks — must be hoisted before any imports that use these modules
vi.mock("@/lib/occupation-data", () => ({
  getOccupationBySlug: vi.fn(),
  getOccupationProfile: vi.fn(),
  getOccupationTasks: vi.fn(),
}))

vi.mock("./resolve-demo-content", () => ({
  resolveAgentContent: vi.fn(),
}))

// Also mock next/cache so unstable_cache doesn't blow up in test env
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}))

const mockTasks = [
  { id: 1, occupation_id: 10, task_name: "Triage emails", task_description: "", frequency: "daily" as const, ai_applicable: true, ai_impact_level: 5, ai_effort_to_implement: 2, ai_category: null, ai_how_it_helps: null, ai_tools: null },
  { id: 2, occupation_id: 10, task_name: "Write reports", task_description: "", frequency: "daily" as const, ai_applicable: true, ai_impact_level: 3, ai_effort_to_implement: 3, ai_category: null, ai_how_it_helps: null, ai_tools: null },
  { id: 3, occupation_id: 10, task_name: "Physical task", task_description: "", frequency: "daily" as const, ai_applicable: false, ai_impact_level: null, ai_effort_to_implement: null, ai_category: null, ai_how_it_helps: null, ai_tools: null },
]

const mockProfile = {
  id: 1, occupation_id: 10, composite_score: 70, work_activity_automation_potential: null,
  time_range_low: 40, time_range_high: 80, physical_ability_avg: 1.0,
  time_range_by_block: "", top_automatable_activities: "", top_blocking_abilities: "",
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

  it("total demo savings equal the canonical displayed estimate exactly", async () => {
    const { computeDisplayedTimeback } = await import("@/lib/timeback")
    // Agents covering every module the tasks map to (communication + documentation)
    const coveringAgents = [
      { ...mockPartialAgents[0], moduleKey: "communication" },
      { ...mockPartialAgents[0], moduleKey: "documentation" },
    ]
    const result = buildDemoRoleStats(
      { occupation: { id: 10, title: "Test Role", slug: "test-role", major_category: "Test", sub_category: null, employment: null, hourly_wage: 60, annual_wage: null }, profile: mockProfile, tasks: mockTasks },
      coveringAgents
    )
    const { displayedMinutes } = computeDisplayedTimeback(mockProfile, mockTasks)
    expect(result.totalBeforeMinutes - result.totalAfterMinutes).toBe(displayedMinutes)
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

// --- computeDemoForSlug tests ---
describe("computeDemoForSlug", () => {
  // Lazy-import so the module picks up our vi.mock stubs above
  let computeDemoForSlug: (slug: string) => Promise<import("./types").DemoRoleData | null>
  let getOccupationBySlugMock: ReturnType<typeof vi.fn>
  let getOccupationProfileMock: ReturnType<typeof vi.fn>
  let getOccupationTasksMock: ReturnType<typeof vi.fn>
  let resolveAgentContentMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const occDataMod = await import("@/lib/occupation-data")
    getOccupationBySlugMock = vi.mocked(occDataMod.getOccupationBySlug)
    getOccupationProfileMock = vi.mocked(occDataMod.getOccupationProfile)
    getOccupationTasksMock = vi.mocked(occDataMod.getOccupationTasks)

    const resolverMod = await import("./resolve-demo-content")
    resolveAgentContentMock = vi.mocked(resolverMod.resolveAgentContent)

    const computeMod = await import("./compute-demo")
    computeDemoForSlug = computeMod.computeDemoForSlug
  })

  function makeOccupationDataMock(
    occupationData: any,
    tasksData: any,
    profileData: any
  ) {
    getOccupationBySlugMock.mockResolvedValue(occupationData)
    getOccupationTasksMock.mockResolvedValue(tasksData ?? [])
    getOccupationProfileMock.mockResolvedValue(profileData)
  }

  it("returns null for an unknown slug", async () => {
    makeOccupationDataMock(null, null, null)

    const result = await computeDemoForSlug("nonexistent-slug")
    expect(result).toBeNull()
  })

  it("returns null when occupation has no AI-applicable tasks", async () => {
    const occupation = {
      id: 42,
      title: "Manual Laborer",
      slug: "manual-laborer",
      major_category: "Construction",
      sub_category: null,
      employment: null,
      hourly_wage: "25", // String payload as in Drizzle
      annual_wage: null,
    }
    const noAiTasks = [
      { id: 1, occupation_id: 42, task_name: "Dig holes", task_description: "", frequency: "daily", ai_applicable: false, ai_impact_level: null, ai_effort_to_implement: null, ai_category: null, ai_how_it_helps: null, ai_tools: null },
    ]
    makeOccupationDataMock(occupation, noAiTasks, null)

    const result = await computeDemoForSlug("manual-laborer")
    expect(result).toBeNull()
  })

  it("returns a DemoRoleData with agents for a known slug", async () => {
    const occupation = {
      id: 99,
      title: "Data Analyst",
      slug: "data-analyst",
      major_category: "Business",
      sub_category: null,
      employment: 50000,
      hourly_wage: "40", // String payload as in Drizzle
      annual_wage: null,
    }
    const tasks = [
      { id: 10, occupation_id: 99, task_name: "Triage data requests", task_description: "", frequency: "daily", ai_applicable: true, ai_impact_level: 5, ai_effort_to_implement: 2, ai_category: "intake", ai_how_it_helps: "automates routing", ai_tools: null },
      { id: 11, occupation_id: 99, task_name: "Build dashboards", task_description: "", frequency: "daily", ai_applicable: true, ai_impact_level: 4, ai_effort_to_implement: 3, ai_category: "analysis", ai_how_it_helps: "generates charts", ai_tools: null },
    ]
    makeOccupationDataMock(occupation, tasks, mockProfile)

    const fakeContent = {
      narrative: "Agent handles this automatically.",
      loop: { inputs: ["a"], actions: ["b"], outputs: ["c"], humanAction: "Review" },
      output: { format: "prose" as const, label: "Summary", content: "Done." },
    }
    resolveAgentContentMock.mockResolvedValue(fakeContent)

    const result = await computeDemoForSlug("data-analyst")

    expect(result).not.toBeNull()
    expect(result!.slug).toBe("data-analyst")
    expect(result!.agents.length).toBeGreaterThan(0)
    expect(result!.totalBeforeMinutes).toBeGreaterThan(0)
    expect(result!.tagline).toBeTruthy()
    // For a slug not in DEMO_ROLE_SCRIPTS the tagline should mention the title
    expect(result!.tagline).toContain("Data Analyst")
  })

  it("resolveAgentContent is called once per selected module", async () => {
    const occupation = {
      id: 99,
      title: "Data Analyst",
      slug: "data-analyst",
      major_category: "Business",
      sub_category: null,
      employment: 50000,
      hourly_wage: "40", // String payload as in Drizzle
      annual_wage: null,
    }
    // Two tasks from different categories → two modules
    const tasks = [
      { id: 10, occupation_id: 99, task_name: "Triage data requests", task_description: "", frequency: "daily", ai_applicable: true, ai_impact_level: 5, ai_effort_to_implement: 2, ai_category: "intake", ai_how_it_helps: "automates routing", ai_tools: null },
      { id: 11, occupation_id: 99, task_name: "Build dashboards", task_description: "", frequency: "daily", ai_applicable: true, ai_impact_level: 4, ai_effort_to_implement: 3, ai_category: "analysis", ai_how_it_helps: "generates charts", ai_tools: null },
    ]
    makeOccupationDataMock(occupation, tasks, null)

    const fakeContent = {
      narrative: "Handled.",
      loop: { inputs: ["a"], actions: ["b"], outputs: ["c"], humanAction: "Review" },
      output: { format: "prose" as const, label: "Output", content: "Done." },
    }
    resolveAgentContentMock.mockResolvedValue(fakeContent)

    const result = await computeDemoForSlug("data-analyst")
    expect(result).not.toBeNull()
    expect(resolveAgentContentMock).toHaveBeenCalledTimes(result!.agents.length)
  })
})
