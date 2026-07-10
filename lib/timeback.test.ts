import { describe, it, expect } from "vitest"
import {
  estimateTaskMinutes,
  inferArchetypeMultiplier,
  computeDisplayedTimeback,
} from "./timeback"
import type { AutomationProfile, MicroTask } from "@/types"

function makeTask(overrides: Partial<MicroTask> = {}): MicroTask {
  return {
    id: 1,
    occupation_id: 1,
    task_name: "Draft status report",
    task_description: "Write the weekly status report",
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

describe("estimateTaskMinutes", () => {
  it("returns 0 for tasks that are not AI-applicable", () => {
    expect(estimateTaskMinutes(makeTask({ ai_applicable: false }))).toBe(0)
  })

  it("gives daily tasks more minutes than weekly tasks", () => {
    const daily = estimateTaskMinutes(makeTask({ frequency: "daily" }))
    const weekly = estimateTaskMinutes(makeTask({ frequency: "weekly" }))
    expect(daily).toBeGreaterThan(weekly)
  })
})

describe("inferArchetypeMultiplier", () => {
  it("discounts physical occupations and not desk occupations", () => {
    expect(inferArchetypeMultiplier(makeProfile({ physical_ability_avg: 3.0 }))).toBeLessThan(1)
    expect(inferArchetypeMultiplier(makeProfile({ physical_ability_avg: 1.0 }))).toBe(1)
    expect(inferArchetypeMultiplier(null)).toBe(1)
  })
})

describe("computeDisplayedTimeback", () => {
  it("returns 0 when there are no AI-applicable tasks and no profile", () => {
    const { displayedMinutes, displayedLow, displayedHigh } = computeDisplayedTimeback(
      null,
      [makeTask({ ai_applicable: false })]
    )
    expect(displayedMinutes).toBe(0)
    expect(displayedLow).toBe(0)
    expect(displayedHigh).toBe(0)
  })

  it("does not convert composite_score into minutes when the profile has no time ranges", () => {
    // A profile with a high composite score but zero time ranges and zero
    // AI-applicable work should not manufacture minutes out of the score.
    const profile = makeProfile({
      composite_score: 100,
      time_range_low: 0,
      time_range_high: 0,
    })
    const { displayedMinutes } = computeDisplayedTimeback(
      profile,
      [makeTask({ ai_applicable: false })]
    )
    expect(displayedMinutes).toBe(0)
  })

  it("ignores fabricated blueprint minutes when no AI-applicable work exists", () => {
    // Blueprint totals historically included human-only tasks and injected
    // quick-win tasks; they must not be able to set the hero number.
    const { displayedMinutes } = computeDisplayedTimeback(
      null,
      [makeTask({ ai_applicable: false })],
      // @ts-expect-error legacy third argument — removed from the signature
      50
    )
    expect(displayedMinutes).toBe(0)
  })

  it("clamps the displayed estimate to at most 180 minutes", () => {
    const tasks = Array.from({ length: 60 }, (_, i) =>
      makeTask({ id: i, ai_impact_level: 5, ai_effort_to_implement: 1 })
    )
    const profile = makeProfile({ time_range_low: 500, time_range_high: 900 })
    const { displayedMinutes } = computeDisplayedTimeback(profile, tasks)
    expect(displayedMinutes).toBeLessThanOrEqual(180)
  })

  it("keeps low <= displayed <= high whenever an estimate is shown", () => {
    const cases = [
      computeDisplayedTimeback(makeProfile(), [makeTask()]),
      computeDisplayedTimeback(null, [makeTask()]),
      computeDisplayedTimeback(makeProfile({ time_range_low: 10, time_range_high: 80 }), [makeTask(), makeTask({ id: 2, frequency: "weekly" })]),
    ]
    for (const c of cases) {
      expect(c.displayedMinutes).toBeGreaterThan(0)
      expect(c.displayedLow).toBeLessThanOrEqual(c.displayedMinutes)
      expect(c.displayedHigh).toBeGreaterThanOrEqual(c.displayedMinutes)
    }
  })

  it("never shows less than the profile's optimistic bound (current product behavior)", () => {
    const profile = makeProfile({ time_range_low: 20, time_range_high: 75 })
    const { displayedMinutes } = computeDisplayedTimeback(profile, [makeTask()])
    expect(displayedMinutes).toBeGreaterThanOrEqual(75)
  })
})
