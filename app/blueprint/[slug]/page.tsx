export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { BlueprintView } from "./blueprint-view"
import { getAllCapabilities } from "@/lib/capabilities"

export default async function BlueprintPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const supabase = await createServerClient()

  const { data: occupation } = await supabase
    .from("occupations")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!occupation) notFound()

  const [{ data: profile }, { data: tasks }, capabilitiesByModule] = await Promise.all([
    supabase
      .from("occupation_automation_profile")
      .select("*")
      .eq("occupation_id", occupation.id)
      .single(),
    supabase
      .from("job_micro_tasks")
      .select("*")
      .eq("occupation_id", occupation.id)
      .order("ai_impact_level", { ascending: false }),
    getAllCapabilities(),
  ])

  return (
    <BlueprintView
      occupation={occupation}
      profile={profile}
      tasks={tasks ?? []}
      slug={slug}
      capabilitiesByModule={capabilitiesByModule}
    />
  )
}
