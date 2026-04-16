import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { count: occupationCount } = await supabase
    .from("occupations")
    .select("id", { count: "exact", head: true })

  const { count: v2RowCount } = await supabase
    .from("demo_agent_content_v2")
    .select("id", { count: "exact", head: true })

  const { data: seededOccupationIds } = await supabase
    .from("demo_agent_content_v2")
    .select("occupation_id")

  const uniqueSeeded = new Set((seededOccupationIds ?? []).map((r) => r.occupation_id))

  console.log(`Total occupations:             ${occupationCount}`)
  console.log(`demo_agent_content_v2 rows:    ${v2RowCount}`)
  console.log(`Unique occupations seeded:     ${uniqueSeeded.size}`)
  console.log(`Occupations without any seed:  ${(occupationCount ?? 0) - uniqueSeeded.size}`)

  // Find a few high-employment unseeded occupations to prove LLM path
  const { data: allOccs } = await supabase
    .from("occupations")
    .select("id, title, slug, employment")
    .order("employment", { ascending: false, nullsFirst: false })
    .limit(100)

  const unseededTop = (allOccs ?? []).filter((o) => !uniqueSeeded.has(o.id)).slice(0, 5)
  console.log(`\nTop unseeded occupations (by employment):`)
  for (const o of unseededTop) {
    console.log(`  - ${o.title} (emp: ${o.employment})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
