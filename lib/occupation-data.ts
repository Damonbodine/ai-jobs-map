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
