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
      makeTask({ id: 1, task_name: "analyze patient data", task_description: "analyze patterns", ai_impact_level: 5 }),
      makeTask({ id: 2, task_name: "analyze trends",       task_description: "analyze market trends", ai_impact_level: 5 }),
      makeTask({ id: 3, task_name: "write notes",          task_description: "write daily notes", ai_impact_level: 3 }),
    ]
    const result = selectDemoModules(tasks, 5)
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(5)
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
