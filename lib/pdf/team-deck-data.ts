import type { MicroTask, AutomationProfile } from "@/types"
import { estimateTaskMinutes, inferArchetypeMultiplier, computeDisplayedTimeback } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
import { computeAnnualValue } from "@/lib/pricing"
import { PDF_MODULE_ACCENTS } from "./styles"
import type { RoleData } from "@/lib/build-a-team/compute"

/**
 * What fraction of the original task time remains after AI assistance,
 * derived from ai_impact_level. Impact 5 = 85% reduction = 0.15 retained.
 */
export function impactRetentionFactor(impactLevel: number | null): number {
  switch (impactLevel) {
    case 5: return 0.15
    case 4: return 0.30
    case 3: return 0.50
    case 2: return 0.70
    case 1: return 0.85
    default: return 0.50
  }
}

export type TaskWithTimes = {
  name: string
  howItHelps: string
  tools: string
  frequency: string
  impactLevel: number
  effortLevel: number
  beforeMinutes: number
  afterMinutes: number
  moduleKey: string
}

export type ModuleBreakdown = {
  moduleKey: string
  label: string
  accentColor: string
  minutesPerDay: number
  topTasks: TaskWithTimes[]
}

export type RoleDeckSection = {
  title: string
  slug: string
  count: number
  minutesPerPerson: number
  annualValuePerPerson: number
  modules: ModuleBreakdown[]
  topTasks: TaskWithTimes[]  // top 5 across all modules, sorted by beforeMinutes desc
}

export type CartItemWithSelection = {
  slug: string
  count: number
  selectedTaskIds: number[]
}

export function computeRoleSections(
  cart: CartItemWithSelection[],
  roleDataBySlug: Map<string, RoleData>
): RoleDeckSection[] {
  const sections: RoleDeckSection[] = []

  for (const cartRow of cart) {
    const data = roleDataBySlug.get(cartRow.slug)
    if (!data) continue

    const archetypeMultiplier = inferArchetypeMultiplier(data.profile)
    const selectedIds = new Set(cartRow.selectedTaskIds)
    const selectedTasks = data.tasks.filter(t => t.ai_applicable && selectedIds.has(t.id))

    // Compute raw total for proportional scaling
    const rawTotal = selectedTasks.reduce(
      (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier, 0
    )
    // displayedMinutes is derived from ALL ai_applicable tasks (not just selected ones).
    // This reflects the role's full time budget and serves as the denominator for
    // proportional scaling of selected tasks, ensuring consistent visualization across
    // different selection sizes.
    const { displayedMinutes } = computeDisplayedTimeback(
      data.profile,
      data.tasks,
      data.tasks.filter(t => t.ai_applicable).reduce(
        (sum, t) => sum + estimateTaskMinutes(t) * archetypeMultiplier, 0
      )
    )

    // Build TaskWithTimes for each selected task, scaling to displayedMinutes
    const tasksWithTimes: TaskWithTimes[] = selectedTasks.map(t => {
      const raw = estimateTaskMinutes(t) * archetypeMultiplier
      const scaled = rawTotal > 0 && displayedMinutes > 0
        ? Math.max(1, Math.round((raw / rawTotal) * displayedMinutes))
        : Math.max(1, Math.round(raw))
      const retention = impactRetentionFactor(t.ai_impact_level)
      return {
        name: t.task_name,
        howItHelps: t.ai_how_it_helps ?? "",
        tools: t.ai_tools ?? "",
        frequency: t.frequency,
        impactLevel: t.ai_impact_level ?? 3,
        effortLevel: t.ai_effort_to_implement ?? 3,
        beforeMinutes: scaled,
        afterMinutes: Math.max(1, Math.round(scaled * retention)),
        moduleKey: getBlockForTask(t),
      }
    })

    // Group into modules
    const moduleMap = new Map<string, TaskWithTimes[]>()
    for (const t of tasksWithTimes) {
      const arr = moduleMap.get(t.moduleKey) ?? []
      arr.push(t)
      moduleMap.set(t.moduleKey, arr)
    }

    const modules: ModuleBreakdown[] = []
    for (const [moduleKey, moduleTasks] of moduleMap) {
      const def = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
      const minutesPerDay = moduleTasks.reduce((s, t) => s + t.beforeMinutes - t.afterMinutes, 0)
      modules.push({
        moduleKey,
        label: def?.label ?? moduleKey,
        accentColor: PDF_MODULE_ACCENTS[moduleKey] ?? "#6b7280",
        minutesPerDay: Math.round(minutesPerDay),
        topTasks: [...moduleTasks].sort((a, b) => b.beforeMinutes - a.beforeMinutes).slice(0, 4),
      })
    }
    modules.sort((a, b) => b.minutesPerDay - a.minutesPerDay)

    const topTasks = [...tasksWithTimes]
      .sort((a, b) => b.beforeMinutes - a.beforeMinutes)
      .slice(0, 5)

    const annualValuePerPerson = computeAnnualValue(displayedMinutes, data.occupation.hourly_wage)

    sections.push({
      title: data.occupation.title,
      slug: data.occupation.slug,
      count: cartRow.count,
      minutesPerPerson: displayedMinutes,
      annualValuePerPerson,
      modules,
      topTasks,
    })
  }

  return sections
}
