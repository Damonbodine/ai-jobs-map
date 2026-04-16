// lib/demo/compute-demo.ts
import { unstable_cache } from "next/cache"
import {
  getOccupationBySlug,
  getOccupationProfile,
  getOccupationTasks,
} from "@/lib/occupation-data"
import {
  estimateTaskMinutes,
  inferArchetypeMultiplier,
  computeDisplayedTimeback,
} from "@/lib/timeback"
import { impactRetentionFactor } from "@/lib/pdf/team-deck-data"
import { getBlockForTask, generateBlueprint } from "@/lib/blueprint"
import { computeAnnualValue } from "@/lib/pricing"
import { DEMO_ROLE_SCRIPTS } from "./demo-scripts"
import { selectDemoModules } from "./select-demo-modules"
import { resolveAgentContent } from "./resolve-demo-content"
import { getAgentMetadata } from "./agent-metadata"
import type { DemoRoleData, DemoAgentStep } from "./types"
import type { Occupation, MicroTask, AutomationProfile } from "@/types"
import type { ModuleKey } from "@/lib/modules"

type RoleInput = {
  occupation: Occupation
  profile: AutomationProfile | null
  tasks: MicroTask[]
  blueprintMinutes: number
}

type PartialAgentScript = Omit<DemoAgentStep, "beforeMinutes" | "afterMinutes">

export function computeModuleTimes(
  input: RoleInput,
  selectedModuleKeys: string[]
): Map<string, { beforeMinutes: number; afterMinutes: number }> {
  const { profile, tasks, blueprintMinutes } = input
  const aiTasks = tasks.filter((t) => t.ai_applicable)
  const archetypeMultiplier = inferArchetypeMultiplier(profile)
  const { displayedHigh } = computeDisplayedTimeback(profile, tasks, blueprintMinutes)
  const totalRawMinutes = aiTasks.reduce(
    (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier,
    0
  )
  const scaleFactor = displayedHigh / Math.max(totalRawMinutes, 1)

  // Group tasks by module
  const moduleTaskMap = new Map<string, MicroTask[]>()
  for (const task of aiTasks) {
    const key = getBlockForTask(task)
    const existing = moduleTaskMap.get(key) ?? []
    existing.push(task)
    moduleTaskMap.set(key, existing)
  }

  // Compute raw before/after per selected module
  const rawTimes = new Map<string, { before: number; after: number }>()
  for (const moduleKey of selectedModuleKeys) {
    const moduleTasks = moduleTaskMap.get(moduleKey) ?? []
    let before = 0
    let after = 0
    for (const t of moduleTasks) {
      const raw = estimateTaskMinutes(t) * archetypeMultiplier
      const scaled = Math.round(raw * scaleFactor)
      const retention = impactRetentionFactor(t.ai_impact_level)
      before += scaled
      after += Math.max(1, Math.round(scaled * retention))
    }
    before = Math.max(1, before)
    after = before > 1 ? Math.max(1, Math.min(after, before - 1)) : 0
    rawTimes.set(moduleKey, { before, after })
  }

  // Apply correction so total savings = displayedHigh
  const rawTotalSaved = Array.from(rawTimes.values()).reduce(
    (s, t) => s + (t.before - t.after),
    0
  )
  const correction =
    rawTotalSaved > 0 && displayedHigh > 0 ? displayedHigh / rawTotalSaved : 1

  const result = new Map<string, { beforeMinutes: number; afterMinutes: number }>()
  for (const [key, t] of rawTimes) {
    const before = Math.round(t.before * correction)
    let after = Math.max(1, Math.round(t.after * correction))
    if (after >= before) after = Math.max(1, before - 1)
    result.set(key, { beforeMinutes: before, afterMinutes: after })
  }
  return result
}

export function buildDemoRoleStats(
  input: RoleInput,
  scriptAgents: PartialAgentScript[]
): DemoRoleData {
  const { occupation, profile, tasks, blueprintMinutes } = input
  const aiTasks = tasks.filter((t) => t.ai_applicable)
  const archetypeMultiplier = inferArchetypeMultiplier(profile)

  const { displayedMinutes, displayedHigh } = computeDisplayedTimeback(profile, tasks, blueprintMinutes)
  const totalRawMinutes = aiTasks.reduce(
    (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier,
    0
  )
  // Use the high end of the range for demo display — aspirational but defensible
  const displayedScaleFactor = displayedHigh / Math.max(totalRawMinutes, 1)

  // Group tasks by module key
  const moduleTaskMap = new Map<string, MicroTask[]>()
  for (const task of aiTasks) {
    const key = getBlockForTask(task)
    const existing = moduleTaskMap.get(key) ?? []
    existing.push(task)
    moduleTaskMap.set(key, existing)
  }

  // Compute before/after per agent module
  const agents: DemoAgentStep[] = scriptAgents.map((script) => {
    const moduleTasks = moduleTaskMap.get(script.moduleKey) ?? []
    let beforeMinutes = 0
    let afterMinutes = 0
    for (const t of moduleTasks) {
      const rawMinutes = estimateTaskMinutes(t) * archetypeMultiplier
      const scaled = Math.round(rawMinutes * displayedScaleFactor)
      const retention = impactRetentionFactor(t.ai_impact_level)
      beforeMinutes += scaled
      afterMinutes += Math.max(1, Math.round(scaled * retention))
    }
    // Ensure at least 1 minute each, afterMinutes < beforeMinutes
    beforeMinutes = Math.max(1, beforeMinutes)
    afterMinutes = beforeMinutes > 1
      ? Math.max(1, Math.min(afterMinutes, beforeMinutes - 1))
      : 0
    return { ...script, beforeMinutes, afterMinutes }
  })

  // Scale agent savings so total matches displayedHigh — the demo shows a subset
  // of all tasks, so raw savings will always be less than the full occuption claim.
  const rawSaved = agents.reduce((s, a) => s + (a.beforeMinutes - a.afterMinutes), 0)
  if (rawSaved > 0 && displayedHigh > rawSaved) {
    const correction = displayedHigh / rawSaved
    for (const a of agents) {
      a.beforeMinutes = Math.round(a.beforeMinutes * correction)
      a.afterMinutes = Math.max(1, Math.round(a.afterMinutes * correction))
      if (a.afterMinutes >= a.beforeMinutes) {
        a.afterMinutes = Math.max(1, a.beforeMinutes - 1)
      }
    }
  }

  const totalBeforeMinutes = agents.reduce((s, a) => s + a.beforeMinutes, 0)
  const totalAfterMinutes = agents.reduce((s, a) => s + a.afterMinutes, 0)
  const minutesSaved = totalBeforeMinutes - totalAfterMinutes
  const annualValueDollars = computeAnnualValue(minutesSaved, occupation.hourly_wage)

  const roleScript = DEMO_ROLE_SCRIPTS.find((r) => r.slug === occupation.slug)

  return {
    slug: occupation.slug,
    displayName: roleScript?.displayName ?? occupation.title,
    tagline: roleScript?.tagline ?? "",
    agents,
    totalBeforeMinutes,
    totalAfterMinutes,
    annualValueDollars,
  }
}

async function fetchRoleData(slug: string): Promise<RoleInput | null> {
  const occupation = await getOccupationBySlug(slug)
  if (!occupation) return null

  const [tasks, profile] = await Promise.all([
    getOccupationTasks(occupation.id),
    getOccupationProfile(occupation.id),
  ])

  const blueprint = generateBlueprint(occupation, tasks, profile)

  return {
    occupation,
    profile,
    tasks,
    blueprintMinutes: blueprint.totalMinutesSaved,
  }
}

export const computeDemoRoles: () => Promise<DemoRoleData[]> = unstable_cache(
  async (): Promise<DemoRoleData[]> => {
    const roleInputs = await Promise.all(
      DEMO_ROLE_SCRIPTS.map((r) => fetchRoleData(r.slug))
    )

    return roleInputs
      .map((input, i) => {
        if (!input) return null
        const script = DEMO_ROLE_SCRIPTS[i]
        return buildDemoRoleStats(input, script.agents)
      })
      .filter((r): r is DemoRoleData => r !== null)
  },
  ["demo-roles"],
  { revalidate: 60 }
)

async function _computeDemoForSlug(slug: string): Promise<DemoRoleData | null> {
  const roleData = await fetchRoleData(slug)
  if (!roleData) return null

  const { occupation, tasks } = roleData
  const selectedModules = selectDemoModules(tasks, 5)

  if (selectedModules.length === 0) return null

  const selectedModuleKeys = selectedModules.map((m) => m.moduleKey)
  const moduleTimes = computeModuleTimes(roleData, selectedModuleKeys)

  // Resolve agent content for each selected module (parallel)
  const resolvedContents = await Promise.all(
    selectedModules.map((mod) => {
      const times = moduleTimes.get(mod.moduleKey)
      return resolveAgentContent({
        occupationId:    occupation.id,
        occupationTitle: occupation.title,
        moduleKey:       mod.moduleKey,
        tasks:           mod.tasks,
        beforeMinutes:   times?.beforeMinutes,
        afterMinutes:    times?.afterMinutes,
      })
    })
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

export function computeDemoForSlug(slug: string): Promise<DemoRoleData | null> {
  return unstable_cache(
    () => _computeDemoForSlug(slug),
    [`demo-slug-${slug}`],
    { revalidate: 3600 }
  )()
}
