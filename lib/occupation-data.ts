// Fetchers deliberately do NOT catch database errors: an outage must surface
// to the route's error boundary, never masquerade as not-found/empty content.
import { cache } from "react"
import { db } from "@/lib/db/client"
import { occupations, occupationAutomationProfile, jobMicroTasks } from "@/lib/db/schema"
import { eq, ne, and, desc } from "drizzle-orm"
import type { Occupation, AutomationProfile, MicroTask } from "@/types"

export const getOccupationBySlug = cache(async (slug: string): Promise<Occupation | null> => {
  const data = await db
      .select({
        id: occupations.id,
        title: occupations.title,
        slug: occupations.slug,
        major_category: occupations.majorCategory,
        sub_category: occupations.subCategory,
        employment: occupations.employment,
        hourly_wage: occupations.hourlyWage,
        annual_wage: occupations.annualWage,
      })
      .from(occupations)
      .where(eq(occupations.slug, slug))
      .limit(1)

  if (data.length === 0) return null
  const o = data[0]
  return {
    ...o,
    hourly_wage: o.hourly_wage ? parseFloat(o.hourly_wage) : null,
    annual_wage: o.annual_wage ? parseFloat(o.annual_wage) : null,
  } as Occupation
})

export const getOccupationProfile = cache(async (occupationId: number): Promise<AutomationProfile | null> => {
  const data = await db
      .select({
        id: occupationAutomationProfile.id,
        occupation_id: occupationAutomationProfile.occupationId,
        composite_score: occupationAutomationProfile.compositeScore,
        work_activity_automation_potential: occupationAutomationProfile.workActivityAutomationPotential,
        time_range_low: occupationAutomationProfile.timeRangeLow,
        time_range_high: occupationAutomationProfile.timeRangeHigh,
        time_range_by_block: occupationAutomationProfile.timeRangeByBlock,
        block_example_tasks: occupationAutomationProfile.blockExampleTasks,
        top_automatable_activities: occupationAutomationProfile.topAutomatableActivities,
        top_blocking_abilities: occupationAutomationProfile.topBlockingAbilities,
        physical_ability_avg: occupationAutomationProfile.physicalAbilityAvg,
      })
      .from(occupationAutomationProfile)
      .where(eq(occupationAutomationProfile.occupationId, occupationId))
      .limit(1)

  if (data.length === 0) return null
  return data[0] as AutomationProfile
})

export const getOccupationTasks = cache(async (occupationId: number): Promise<MicroTask[]> => {
  const data = await db
      .select({
        id: jobMicroTasks.id,
        occupation_id: jobMicroTasks.occupationId,
        task_name: jobMicroTasks.taskName,
        task_description: jobMicroTasks.taskDescription,
        frequency: jobMicroTasks.frequency,
        ai_applicable: jobMicroTasks.aiApplicable,
        ai_how_it_helps: jobMicroTasks.aiHowItHelps,
        ai_impact_level: jobMicroTasks.aiImpactLevel,
        ai_effort_to_implement: jobMicroTasks.aiEffortToImplement,
        ai_category: jobMicroTasks.aiCategory,
        ai_tools: jobMicroTasks.aiTools,
      })
      .from(jobMicroTasks)
      .where(eq(jobMicroTasks.occupationId, occupationId))
      .orderBy(desc(jobMicroTasks.aiImpactLevel))

  return data as MicroTask[]
})

export type RelatedOccupation = Pick<Occupation, "id" | "title" | "slug" | "major_category">

export const getRelatedOccupations = cache(async (
  occupationId: number,
  majorCategory: string,
  limit = 4,
): Promise<RelatedOccupation[]> => {
  const data = await db
      .select({
        id: occupations.id,
        title: occupations.title,
        slug: occupations.slug,
        major_category: occupations.majorCategory,
      })
      .from(occupations)
      .where(
        and(
          eq(occupations.majorCategory, majorCategory),
          ne(occupations.id, occupationId)
        )
      )
      .orderBy(desc(occupations.employment))
      .limit(limit)

  return data as RelatedOccupation[]
})

