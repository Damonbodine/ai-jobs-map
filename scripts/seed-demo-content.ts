// Seeds demo_agent_content (v1 format) for the top 20 occupations by id.

import { and, asc, eq } from "drizzle-orm"
import { db, pool, schema } from "./db"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { generateDemoContent } from "../lib/demo/generate-demo-content"
import { getAgentMetadata } from "../lib/demo/agent-metadata"
import type { MicroTask, Occupation } from "../types"
import type { ModuleKey } from "../lib/modules"

async function fetchTopOccupations(limit = 20): Promise<Occupation[]> {
  const rows = await db
    .select({
      id: schema.occupations.id,
      title: schema.occupations.title,
      slug: schema.occupations.slug,
      major_category: schema.occupations.majorCategory,
      sub_category: schema.occupations.subCategory,
      employment: schema.occupations.employment,
      hourly_wage: schema.occupations.hourlyWage,
      annual_wage: schema.occupations.annualWage,
    })
    .from(schema.occupations)
    .orderBy(asc(schema.occupations.id))
    .limit(limit)

  return rows as unknown as Occupation[]
}

async function fetchTasksForOccupation(occupationId: number): Promise<MicroTask[]> {
  const rows = await db
    .select()
    .from(schema.jobMicroTasks)
    .where(eq(schema.jobMicroTasks.occupationId, occupationId))
  return rows as unknown as MicroTask[]
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
      const existing = await db
        .select({ id: schema.demoAgentContent.id })
        .from(schema.demoAgentContent)
        .where(
          and(
            eq(schema.demoAgentContent.occupationId, occupation.id),
            eq(schema.demoAgentContent.moduleKey, mod.moduleKey)
          )
        )
        .limit(1)

      if (existing.length > 0) {
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

      const values = {
        occupationId: occupation.id,
        moduleKey: mod.moduleKey,
        agentName: meta.agentName,
        label: meta.label,
        accentColor: meta.accentColor,
        timeOfDay: meta.timeOfDay,
        narrative: content.narrative,
        loopData: content.loop,
        outputData: content.output,
      }
      await db
        .insert(schema.demoAgentContent)
        .values(values)
        .onConflictDoUpdate({
          target: [schema.demoAgentContent.occupationId, schema.demoAgentContent.moduleKey],
          set: values,
        })

      console.log(`  ✓ ${occupation.title} / ${mod.moduleKey}`)
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

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
