// Seeds demo_agent_content_v2 with icon-forward short-label content (v2 format)

import { and, eq, sql } from "drizzle-orm"
import { db, pool, schema } from "./db"
import { selectDemoModules } from "../lib/demo/select-demo-modules"
import { generateDemoContent } from "../lib/demo/generate-demo-content"
import { computeModuleTimes } from "../lib/demo/compute-demo"
import { getAgentMetadata } from "../lib/demo/agent-metadata"
import type { MicroTask, Occupation, AutomationProfile } from "../types"
import type { ModuleKey } from "../lib/modules"

async function fetchTopOccupations(limit?: number): Promise<Occupation[]> {
  // Order by employment desc so high-traffic occupations seed first —
  // partial runs still deliver the most value.
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
    .orderBy(sql`${schema.occupations.employment} desc nulls last`)
    .limit(typeof limit === "number" ? limit : Number.MAX_SAFE_INTEGER)

  return rows as unknown as Occupation[]
}

async function fetchTasksForOccupation(occupationId: number): Promise<MicroTask[]> {
  const rows = await db
    .select()
    .from(schema.jobMicroTasks)
    .where(eq(schema.jobMicroTasks.occupationId, occupationId))
  return rows as unknown as MicroTask[]
}

async function fetchProfileForOccupation(occupationId: number): Promise<AutomationProfile | null> {
  const rows = await db
    .select({
      id: schema.occupationAutomationProfile.id,
      occupation_id: schema.occupationAutomationProfile.occupationId,
      composite_score: schema.occupationAutomationProfile.compositeScore,
      work_activity_automation_potential:
        schema.occupationAutomationProfile.workActivityAutomationPotential,
      time_range_low: schema.occupationAutomationProfile.timeRangeLow,
      time_range_high: schema.occupationAutomationProfile.timeRangeHigh,
      physical_ability_avg: schema.occupationAutomationProfile.physicalAbilityAvg,
    })
    .from(schema.occupationAutomationProfile)
    .where(eq(schema.occupationAutomationProfile.occupationId, occupationId))
    .limit(1)
  return (rows[0] ?? null) as unknown as AutomationProfile | null
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
      const existing = await db
        .select({ id: schema.demoAgentContentV2.id })
        .from(schema.demoAgentContentV2)
        .where(
          and(
            eq(schema.demoAgentContentV2.occupationId, occupation.id),
            eq(schema.demoAgentContentV2.moduleKey, mod.moduleKey)
          )
        )
        .limit(1)

      if (existing.length > 0) {
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

      // Upsert into v2
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
        .insert(schema.demoAgentContentV2)
        .values(values)
        .onConflictDoUpdate({
          target: [schema.demoAgentContentV2.occupationId, schema.demoAgentContentV2.moduleKey],
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

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
