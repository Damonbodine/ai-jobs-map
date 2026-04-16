import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { generateDemoContent } from "../lib/demo/generate-demo-content"
import { getAgentMetadata } from "../lib/demo/agent-metadata"
import type { MicroTask, Occupation } from "../types"
import type { ModuleKey } from "../lib/modules"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchTopOccupations(limit = 20): Promise<Occupation[]> {
  const { data, error } = await supabase
    .from("occupations")
    .select("id, title, slug, major_category, sub_category, employment, hourly_wage, annual_wage")
    .not("employment", "is", null)
    .order("employment", { ascending: false })
    .limit(limit)

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

async function seedOccupation(occupation: Occupation) {
  const tasks = await fetchTasksForOccupation(occupation.id)
  const selectedModules = selectDemoModules(tasks, 5)

  if (selectedModules.length === 0) {
    console.log(`  ⚠ ${occupation.title}: no AI tasks found, skipping`)
    return
  }

  for (const mod of selectedModules) {
    try {
      // Check if already cached
      const { data: existing } = await supabase
        .from("demo_agent_content")
        .select("id")
        .eq("occupation_id", occupation.id)
        .eq("module_key", mod.moduleKey)
        .maybeSingle()

      if (existing) {
        console.log(`  ↩ ${occupation.title} / ${mod.moduleKey} (cached, skipping)`)
        continue
      }

      // Generate content
      const content = await generateDemoContent({
        occupationTitle: occupation.title,
        moduleKey: mod.moduleKey,
        tasks: mod.tasks,
      })

      const meta = getAgentMetadata(mod.moduleKey as ModuleKey)

      // Insert
      const { error: insertError } = await supabase.from("demo_agent_content").upsert(
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
  console.log("Fetching top 20 occupations...")
  const occupations = await fetchTopOccupations(20)
  console.log(`Found ${occupations.length} occupations\n`)

  for (const occupation of occupations) {
    console.log(`\nSeeding: ${occupation.title}`)
    await seedOccupation(occupation)
  }

  console.log("\nDone seeding demo content.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
