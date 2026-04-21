import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"
import type { Occupation, AutomationProfile, MicroTask } from "@/types"

export const getOccupationBySlug = cache(async (slug: string): Promise<Occupation | null> => {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("*")
    .eq("slug", slug)
    .single()
  return (data ?? null) as Occupation | null
})

export const getOccupationProfile = cache(async (occupationId: number): Promise<AutomationProfile | null> => {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupation_automation_profile")
    .select("*")
    .eq("occupation_id", occupationId)
    .single()
  return (data ?? null) as AutomationProfile | null
})

export const getOccupationTasks = cache(async (occupationId: number): Promise<MicroTask[]> => {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("job_micro_tasks")
    .select("*")
    .eq("occupation_id", occupationId)
    .order("ai_impact_level", { ascending: false })
  return (data ?? []) as MicroTask[]
})

export type RelatedOccupation = Pick<Occupation, "id" | "title" | "slug" | "major_category">

export const getRelatedOccupations = cache(async (
  occupationId: number,
  majorCategory: string,
  limit = 4,
): Promise<RelatedOccupation[]> => {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("id, title, slug, major_category")
    .eq("major_category", majorCategory)
    .neq("id", occupationId)
    .order("employment", { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []) as RelatedOccupation[]
})
