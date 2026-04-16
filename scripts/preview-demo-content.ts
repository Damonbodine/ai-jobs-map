// One-shot preview: generates content for 1 occupation without seeding
import { createClient } from "@supabase/supabase-js"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { generateDemoContent } from "../lib/demo/generate-demo-content"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const SLUG = process.argv[2] ?? "software-developers"
  const LIMIT = parseInt(process.argv[3] ?? "2")

  const { data: occ } = await supabase.from("occupations").select("*").eq("slug", SLUG).single()
  if (!occ) { console.error("Occupation not found:", SLUG); process.exit(1) }

  const { data: tasks } = await supabase.from("job_micro_tasks").select("*").eq("occupation_id", occ.id)
  const modules = selectDemoModules(tasks ?? [], LIMIT)

  console.log(`\nPreviewing: ${occ.title} (${modules.length} modules)\n${"─".repeat(60)}`)

  for (const mod of modules) {
    const content = await generateDemoContent({ occupationTitle: occ.title, moduleKey: mod.moduleKey, tasks: mod.tasks })
    console.log(`\n▶ MODULE: ${mod.moduleKey}`)
    console.log(`\nNARRATIVE:\n${content.narrative}`)
    console.log(`\nLOOP:`)
    console.log(`  inputs:  ${content.loop.inputs.join(" | ")}`)
    console.log(`  actions: ${content.loop.actions.join(" | ")}`)
    console.log(`  outputs: ${content.loop.outputs.join(" | ")}`)
    console.log(`  human:   ${content.loop.humanAction}`)
    console.log(`\nOUTPUT [${content.output.label}]:`)
    console.log(content.output.content)
    console.log(`\n${"─".repeat(60)}`)
    await new Promise(r => setTimeout(r, 1000))
  }
}

main().catch(err => { console.error(err); process.exit(1) })
