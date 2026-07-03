// Reports how many occupations have seeded demo_agent_content_v2 rows.
import { sql } from "drizzle-orm"
import { db, pool, schema } from "./db"

async function main() {
  const [{ occupationCount }] = await db
    .select({ occupationCount: sql<number>`count(*)::int` })
    .from(schema.occupations)

  const [{ v2RowCount }] = await db
    .select({ v2RowCount: sql<number>`count(*)::int` })
    .from(schema.demoAgentContentV2)

  const seededOccupationIds = await db
    .select({ occupation_id: schema.demoAgentContentV2.occupationId })
    .from(schema.demoAgentContentV2)

  const uniqueSeeded = new Set(seededOccupationIds.map((r) => r.occupation_id))

  console.log(`Total occupations:             ${occupationCount}`)
  console.log(`demo_agent_content_v2 rows:    ${v2RowCount}`)
  console.log(`Unique occupations seeded:     ${uniqueSeeded.size}`)
  console.log(`Occupations without any seed:  ${(occupationCount ?? 0) - uniqueSeeded.size}`)

  // Find a few high-employment unseeded occupations to prove LLM path
  const allOccs = await db
    .select({
      id: schema.occupations.id,
      title: schema.occupations.title,
      slug: schema.occupations.slug,
      employment: schema.occupations.employment,
    })
    .from(schema.occupations)
    .orderBy(sql`${schema.occupations.employment} desc nulls last`)
    .limit(100)

  const unseededTop = allOccs.filter((o) => !uniqueSeeded.has(o.id)).slice(0, 5)
  console.log(`\nTop unseeded occupations (by employment):`)
  for (const o of unseededTop) {
    console.log(`  - ${o.title} (emp: ${o.employment})`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
