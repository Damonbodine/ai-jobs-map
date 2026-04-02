import type { AutomationProfile, MicroTask } from "@/types"

const FREQUENCY_WEIGHT: Record<string, number> = {
  daily: 1,
  weekly: 0.35,
  monthly: 0.12,
  "as-needed": 0.18,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function estimateTaskMinutes(task: MicroTask) {
  if (!task.ai_applicable) return 0

  const dayWeight = FREQUENCY_WEIGHT[task.frequency] ?? 0.18
  const impact = task.ai_impact_level ?? 2
  const effort = task.ai_effort_to_implement ?? 3
  const automationFactor = Math.max(0.24, impact * 0.18 + (6 - effort) * 0.08)

  return dayWeight * 26 * automationFactor
}

export function inferArchetypeMultiplier(profile: AutomationProfile | null) {
  const physical = profile?.physical_ability_avg ?? 0
  if (physical > 2.5) return 0.58
  if (physical > 2.0) return 0.82
  return 1
}

export function computeDisplayedTimeback(
  profile: AutomationProfile | null,
  tasks: MicroTask[],
  blueprintMinutes: number
) {
  const aiTasks = tasks.filter((task) => task.ai_applicable)
  const archetypeMultiplier = inferArchetypeMultiplier(profile)
  const modeledTaskMinutesRaw = aiTasks.reduce(
    (sum, task) => sum + estimateTaskMinutes(task),
    0
  )
  const modeledTaskMinutes = Math.round(modeledTaskMinutesRaw * archetypeMultiplier)
  const optimisticBlueprintMinutes = blueprintMinutes
    ? Math.round(blueprintMinutes * 1.15)
    : 0
  const profileMidMinutes = profile
    ? Math.round(((profile.time_range_low ?? 0) + (profile.time_range_high ?? 0)) / 2)
    : 0
  const optimisticProfileMinutes =
    profile?.time_range_high != null && profile.time_range_high > 0
      ? profile.time_range_high
      : 0

  const displayedMinutes = Math.round(
    clamp(
      Math.max(
        profileMidMinutes > 0
          ? profileMidMinutes * 0.35 +
              optimisticProfileMinutes * 0.25 +
              modeledTaskMinutes * 0.25 +
              optimisticBlueprintMinutes * 0.15
          : optimisticProfileMinutes * 0.35 +
              modeledTaskMinutes * 0.45 +
              optimisticBlueprintMinutes * 0.2,
        modeledTaskMinutes,
        optimisticProfileMinutes,
        optimisticBlueprintMinutes
      ),
      0,
      180
    )
  )

  const profileLow = profile?.time_range_low ?? 0
  const profileHigh = profile?.time_range_high ?? 0
  const hasProfileRange = profileLow > 0 && profileHigh > 0

  const displayedLow =
    displayedMinutes > 0
      ? hasProfileRange
        ? Math.max(5, Math.round(displayedMinutes * (profileLow / Math.max(profileMidMinutes, 1))))
        : Math.max(5, Math.round(displayedMinutes * 0.72))
      : 0

  const displayedHigh =
    displayedMinutes > 0
      ? hasProfileRange
        ? Math.max(
            displayedLow + 5,
            Math.round(displayedMinutes * (profileHigh / Math.max(profileMidMinutes, 1)))
          )
        : Math.max(displayedLow + 5, Math.round(displayedMinutes * 1.18))
      : 0

  return {
    displayedMinutes,
    displayedLow,
    displayedHigh,
    modeledTaskMinutes,
  }
}
