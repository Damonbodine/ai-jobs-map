// One-shot preview: generates content for 1 occupation without seeding
import { eq } from "drizzle-orm"
import { db, pool, schema } from "./db"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { generateDemoContent } from "../lib/demo/generate-demo-content"

async function main() {
  const SLUG = process.argv[2] ?? "software-developers"
  const LIMIT = parseInt(process.argv[3] ?? "2")

  const occRows = await db
    .select()
    .from(schema.occupations)
    .where(eq(schema.occupations.slug, SLUG))
    .limit(1)
  const occ = occRows[0]
  if (!occ) { console.error("Occupation not found:", SLUG); process.exit(1) }

  const tasks = await db
    .select()
    .from(schema.jobMicroTasks)
    .where(eq(schema.jobMicroTasks.occupationId, occ.id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules = selectDemoModules(tasks as any, LIMIT)

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

main()
  .catch(err => { console.error(err); process.exitCode = 1 })
  .finally(() => pool.end())
