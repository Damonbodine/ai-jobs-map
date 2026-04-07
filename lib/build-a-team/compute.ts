import type { CartRow } from "./url-state"
import type {
  AutomationProfile,
  MicroTask,
  Occupation,
} from "@/types"
import {
  computeDisplayedTimeback,
  estimateTaskMinutes,
  inferArchetypeMultiplier,
} from "@/lib/timeback"
import { computeAnnualValue } from "@/lib/pricing"

export type RoleData = {
  occupation: Pick<Occupation, "id" | "slug" | "title" | "hourly_wage">
  profile: AutomationProfile | null
  tasks: MicroTask[]
}

export type RoleBreakdown = {
  slug: string
  title: string
  count: number
  minutesPerPerson: number
  annualValuePerPerson: number
  totalMinutesPerDay: number
  totalAnnualValue: number
}

export type DepartmentTotals = {
  totalPeople: number
  totalMinutesPerDay: number
  totalAnnualValue: number
  // Derived: what fraction of an FTE worth of time we're reclaiming.
  // 1 FTE ≈ 480 work min/day. The framing matters because "180 min/day"
  // doesn't tell a CFO anything but "0.4 FTEs reclaimed" does.
  fteEquivalents: number
  rows: RoleBreakdown[]
}

const FTE_MINUTES_PER_DAY = 480

/**
 * Compute the department-level rollup from a cart of roles + the
 * fetched occupation data for each. The math here is identical to
 * what /occupation/[slug] does for one role; we just sum across roles.
 */
export function computeDepartmentTotals(
  cart: CartRow[],
  roleDataBySlug: Map<string, RoleData>
): DepartmentTotals {
  const rows: RoleBreakdown[] = []
  let totalPeople = 0
  let totalMinutesPerDay = 0
  let totalAnnualValue = 0

  for (const cartRow of cart) {
    const data = roleDataBySlug.get(cartRow.slug)
    if (!data) continue

    const archetypeMultiplier = inferArchetypeMultiplier(data.profile ?? null)
    const aiTasks = data.tasks.filter((t) => t.ai_applicable)
    const totalBlueprintMinutes = aiTasks.reduce(
      (sum, task) => sum + estimateTaskMinutes(task) * archetypeMultiplier,
      0
    )
    const { displayedMinutes } = computeDisplayedTimeback(
      data.profile ?? null,
      data.tasks,
      totalBlueprintMinutes
    )
    const annualValuePerPerson = computeAnnualValue(
      displayedMinutes,
      data.occupation.hourly_wage
    )

    const roleTotalMinutes = displayedMinutes * cartRow.count
    const roleTotalValue = annualValuePerPerson * cartRow.count

    rows.push({
      slug: data.occupation.slug,
      title: data.occupation.title,
      count: cartRow.count,
      minutesPerPerson: displayedMinutes,
      annualValuePerPerson,
      totalMinutesPerDay: roleTotalMinutes,
      totalAnnualValue: roleTotalValue,
    })

    totalPeople += cartRow.count
    totalMinutesPerDay += roleTotalMinutes
    totalAnnualValue += roleTotalValue
  }

  return {
    totalPeople,
    totalMinutesPerDay,
    totalAnnualValue,
    fteEquivalents:
      Math.round((totalMinutesPerDay / FTE_MINUTES_PER_DAY) * 10) / 10,
    rows,
  }
}
