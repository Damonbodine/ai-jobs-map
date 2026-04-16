// Seeds demo_agent_content_v2 with icon-forward short-label content (v2 format)

// Env vars must be passed via command line (dotenvx overrides them)
import { createClient } from "@supabase/supabase-js"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { generateDemoContent } from "../lib/demo/generate-demo-content"
import { computeModuleTimes } from "../lib/demo/compute-demo"
import { getAgentMetadata } from "../lib/demo/agent-metadata"
import type { MicroTask, Occupation, AutomationProfile } from "../types"
import type { ModuleKey } from "../lib/modules"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchTopOccupations(limit?: number): Promise<Occupation[]> {
  // Order by employment desc so high-traffic occupations seed first —
  // partial runs still deliver the most value.
  let query = supabase
    .from("occupations")
    .select("id, title, slug, major_category, sub_category, employment, hourly_wage, annual_wage")
    .order("employment", { ascending: false, nullsFirst: false })

  if (typeof limit === "number") query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Occupation[]
}

async function fetchTasksForOccupation(occupationId: number): Promise<MicroTask[]> {
  const { data } = await supabase
    .from("job_micro_tasks")
    .select("*")
    .eq("occupation_id", occupationId)
  return (data ?? []) as MicroTask[]
}

async function fetchProfileForOccupation(occupationId: number): Promise<AutomationProfile | null> {
  const { data } = await supabase
    .from("occupation_automation_profile")
    .select("id, occupation_id, composite_score, work_activity_automation_potential, time_range_low, time_range_high, physical_ability_avg")
    .eq("occupation_id", occupationId)
    .maybeSingle()
  return (data ?? null) as AutomationProfile | null
}

async function seedOccupation(occupation: Occupation) {
  const [tasks, profile] = await Promise.all([
    fetchTasksForOccupation(occupation.id),
    fetchProfileForOccupation(occupation.id),
  ])
  const selectedModules = selectDemoModules(tasks, 5)

  if (selectedModules.length === 0) {
    console.log(`  ⚠ ${occupation.title}: no AI tasks found, skipping`)
    return
  }

  const selectedModuleKeys = selectedModules.map((m) => m.moduleKey)
  const roleInput = { occupation, profile, tasks }
  const moduleTimes = computeModuleTimes(roleInput, selectedModuleKeys)

  for (const mod of selectedModules) {
    try {
      // Check if already cached in v2
      const { data: existing } = await supabase
        .from("demo_agent_content_v2")
        .select("id")
        .eq("occupation_id", occupation.id)
        .eq("module_key", mod.moduleKey)
        .maybeSingle()

      if (existing) {
        console.log(`  ↩ ${occupation.title} / ${mod.moduleKey} (cached, skipping)`)
        continue
      }

      // Generate content with actual time impact numbers
      const times = moduleTimes.get(mod.moduleKey)
      const content = await generateDemoContent({
        occupationTitle: occupation.title,
        moduleKey: mod.moduleKey,
        tasks: mod.tasks,
        beforeMinutes: times?.beforeMinutes,
        afterMinutes: times?.afterMinutes,
      })

      const meta = getAgentMetadata(mod.moduleKey as ModuleKey)

      // Insert into v2
      const { error: insertError } = await supabase.from("demo_agent_content_v2").upsert(
        {
          occupation_id: occupation.id,
          module_key: mod.moduleKey,
          agent_name: meta.agentName,
          label: meta.label,
          accent_color: meta.accentColor,
          time_of_day: meta.timeOfDay,
          narrative: content.narrative,
          loop_data: content.loop,
          output_data: content.output,
        },
        { onConflict: "occupation_id,module_key" }
      )

      if (insertError) {
        console.error(`  ✗ upsert failed:`, insertError)
      } else {
        console.log(`  ✓ ${occupation.title} / ${mod.moduleKey}`)
      }
    } catch (err) {
      console.error(`  ✗ ${occupation.title} / ${mod.moduleKey}:`, err)
    }
    // Rate limit: 1 request per second to stay within OpenRouter limits
    await new Promise((r) => setTimeout(r, 1000))
  }
}

async function main() {
  // Optional first arg = limit (e.g. `pnpm seed:demo:v2 100` to cap at 100).
  // Omit for a full pass over all occupations.
  const argLimit = process.argv[2] ? Number(process.argv[2]) : undefined
  const limitLabel = argLimit ? `top ${argLimit}` : "all"
  console.log(`Fetching ${limitLabel} occupations (by employment desc)...`)
  const occupations = await fetchTopOccupations(argLimit)
  console.log(`Found ${occupations.length} occupations\n`)

  let done = 0
  for (const occupation of occupations) {
    done++
    console.log(`\n[${done}/${occupations.length}] Seeding: ${occupation.title}`)
    await seedOccupation(occupation)
  }

  console.log("\nDone seeding demo content v2.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
