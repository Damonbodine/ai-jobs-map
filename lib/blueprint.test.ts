import { describe, it, expect } from "vitest"
import { generateBlueprint, getBlockForTask } from "./blueprint"
import { estimateTaskMinutes } from "./timeback"
import type { AutomationProfile, MicroTask, Occupation } from "@/types"

function makeTask(overrides: Partial<MicroTask> = {}): MicroTask {
  return {
    id: 1,
    occupation_id: 1,
    task_name: "Compile weekly report",
    task_description: "Assemble the weekly report from source data",
    frequency: "daily",
    ai_applicable: true,
    ai_how_it_helps: null,
    ai_impact_level: 3,
    ai_effort_to_implement: 3,
    ai_category: null,
    ai_tools: null,
    ...overrides,
  }
}

function makeProfile(overrides: Partial<AutomationProfile> = {}): AutomationProfile {
  return {
    id: 1,
    occupation_id: 1,
    composite_score: 50,
    work_activity_automation_potential: null,
    time_range_low: 30,
    time_range_high: 60,
    time_range_by_block: "{}",
    top_automatable_activities: "[]",
    top_blocking_abilities: "[]",
    physical_ability_avg: 1.0,
    ...overrides,
  }
}

const occupation = {
  id: 1,
  title: "Test Occupation",
  slug: "test-occupation",
  major_category: "Test",
  sub_category: null,
  employment: null,
  hourly_wage: null,
  annual_wage: null,
} as Occupation

describe("generateBlueprint", () => {
  it("derives per-task minutes from the canonical timeback model", () => {
    const task = makeTask()
    const blueprint = generateBlueprint(occupation, [task], makeProfile())
    const spec = blueprint.agents
      .flatMap((a) => a.tasks)
      .find((t) => t.name === task.task_name)
    expect(spec).toBeDefined()
    expect(spec!.minutesSaved).toBeCloseTo(estimateTaskMinutes(task), 0)
  })

  it("excludes human-only tasks from minutes saved", () => {
    // Same block (documentation): one AI task, one human-only task.
    const aiTask = makeTask({ id: 1 })
    const humanTask = makeTask({
      id: 2,
      task_name: "Review printed report binder",
      ai_applicable: false,
      ai_impact_level: null,
    })
    expect(getBlockForTask(aiTask)).toBe(getBlockForTask(humanTask))

    const blueprint = generateBlueprint(occupation, [aiTask, humanTask], makeProfile())
    const agent = blueprint.agents.find((a) => a.blockName === getBlockForTask(aiTask))
    expect(agent).toBeDefined()
    expect(agent!.minutesSaved).toBe(
      Math.round(estimateTaskMinutes(aiTask))
    )
    expect(blueprint.totalMinutesSaved).toBe(Math.round(estimateTaskMinutes(aiTask)))
  })

  it("applies the archetype multiplier for physical occupations", () => {
    const tasks = [makeTask()]
    const desk = generateBlueprint(occupation, tasks, makeProfile({ physical_ability_avg: 1.0 }))
    const physical = generateBlueprint(occupation, tasks, makeProfile({ physical_ability_avg: 3.0 }))
    expect(physical.totalMinutesSaved).toBeLessThan(desk.totalMinutesSaved)
  })

  it("does not inject fabricated quick-win tasks for sparse occupations", () => {
    const blueprint = generateBlueprint(occupation, [makeTask()], makeProfile())
    const names = blueprint.agents.flatMap((a) => a.tasks.map((t) => t.name))
    expect(names).not.toContain("Email Drafting")
    expect(names).not.toContain("Meeting Notes")
    expect(names).not.toContain("Document Search")
  })

  it("returns no agents and zero minutes when nothing is AI-applicable", () => {
    const blueprint = generateBlueprint(
      occupation,
      [makeTask({ ai_applicable: false, ai_impact_level: null })],
      makeProfile()
    )
    expect(blueprint.agents).toHaveLength(0)
    expect(blueprint.totalMinutesSaved).toBe(0)
  })
})
