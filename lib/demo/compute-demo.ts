// lib/demo/compute-demo.ts
import { unstable_cache } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import {
  estimateTaskMinutes,
  inferArchetypeMultiplier,
  computeDisplayedTimeback,
} from "@/lib/timeback"
import { impactRetentionFactor } from "@/lib/pdf/team-deck-data"
import { getBlockForTask } from "@/lib/blueprint"
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
}

type PartialAgentScript = Omit<DemoAgentStep, "beforeMinutes" | "afterMinutes">

export function buildDemoRoleStats(
  input: RoleInput,
  scriptAgents: PartialAgentScript[]
): DemoRoleData {
  const { occupation, profile, tasks } = input
  const aiTasks = tasks.filter((t) => t.ai_applicable)
  const archetypeMultiplier = inferArchetypeMultiplier(profile)

  const { displayedMinutes } = computeDisplayedTimeback(profile, tasks, 0)
  const totalRawMinutes = aiTasks.reduce(
    (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier,
    0
  )
  const displayedScaleFactor = displayedMinutes / Math.max(totalRawMinutes, 1)

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
  const supabase = createServerClient()

  const { data: occupation } = await supabase
    .from("occupations")
    .select("id, title, slug, major_category, sub_category, employment, hourly_wage, annual_wage")
    .eq("slug", slug)
    .single()

  if (!occupation) return null

  const [{ data: tasks }, { data: profile }] = await Promise.all([
    supabase
      .from("job_micro_tasks")
      .select("id, occupation_id, task_name, task_description, frequency, ai_applicable, ai_how_it_helps, ai_impact_level, ai_effort_to_implement, ai_category, ai_tools")
      .eq("occupation_id", occupation.id),
    supabase
      .from("automation_profiles")
      .select("id, occupation_id, composite_score, work_activity_automation_potential, time_range_low, time_range_high, physical_ability_avg")
      .eq("occupation_id", occupation.id)
      .single(),
  ])

  return {
    occupation: occupation as Occupation,
    profile: profile ?? null,
    tasks: (tasks ?? []) as MicroTask[],
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

export async function computeDemoForSlug(slug: string): Promise<DemoRoleData | null> {
  const roleData = await fetchRoleData(slug)
  if (!roleData) return null

  const { occupation, tasks } = roleData
  const selectedModules = selectDemoModules(tasks, 5)

  if (selectedModules.length === 0) return null

  // Resolve agent content for each selected module (parallel)
  const resolvedContents = await Promise.all(
    selectedModules.map((mod) =>
      resolveAgentContent({
        occupationId:    occupation.id,
        occupationTitle: occupation.title,
        moduleKey:       mod.moduleKey,
        tasks:           mod.tasks,
      })
    )
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
