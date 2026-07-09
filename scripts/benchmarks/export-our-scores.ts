/**
 * DG1: read-only export of our occupation scores for benchmark correlation.
 *
 * Writes data/benchmarks/our_scores.csv with one row per occupation:
 *   occupation_id, slug, title, soc_code, soc_confidence,
 *   composite_score, displayed_minutes, time_range_low, time_range_high
 *
 * soc_code is derived by majority vote over the occupation's onet_tasks
 * rows (the occupations table itself has no SOC column — see DG6).
 * soc_confidence is the majority share (1.0 = every task row agrees).
 * O*NET-SOC codes like "29-1141.00" are trimmed to BLS SOC "29-1141".
 *
 * Usage: npx tsx scripts/benchmarks/export-our-scores.ts
 */
import fs from "node:fs"
import path from "node:path"
import { sql } from "drizzle-orm"
import { db, pool } from "../db"
import { computeDisplayedTimeback } from "../../lib/timeback"
import type { AutomationProfile, MicroTask } from "../../types"

async function main() {
  const occs = (await db.execute(sql`
    SELECT o.id, o.slug, o.title,
           p.composite_score, p.time_range_low, p.time_range_high,
           p.physical_ability_avg
    FROM occupations o
    LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
    ORDER BY o.id
  `)).rows as Array<{
    id: number
    slug: string
    title: string
    composite_score: number | null
    time_range_low: number | null
    time_range_high: number | null
    physical_ability_avg: number | null
  }>

  const socRows = (await db.execute(sql`
    SELECT occupation_id, onet_soc_code, COUNT(*)::int AS n
    FROM onet_tasks
    GROUP BY occupation_id, onet_soc_code
  `)).rows as Array<{ occupation_id: number; onet_soc_code: string; n: number }>

  const taskRows = (await db.execute(sql`
    SELECT occupation_id, frequency, ai_applicable,
           ai_impact_level, ai_effort_to_implement
    FROM job_micro_tasks
    WHERE ai_applicable = true
  `)).rows as Array<Record<string, unknown>>

  // Majority-vote SOC per occupation
  const socByOcc = new Map<number, { code: string; share: number }>()
  const grouped = new Map<number, Array<{ code: string; n: number }>>()
  for (const r of socRows) {
    const arr = grouped.get(r.occupation_id) ?? []
    arr.push({ code: r.onet_soc_code, n: r.n })
    grouped.set(r.occupation_id, arr)
  }
  for (const [occId, arr] of grouped) {
    const total = arr.reduce((s, a) => s + a.n, 0)
    const top = arr.sort((a, b) => b.n - a.n)[0]
    // "29-1141.00" -> "29-1141"
    const trimmed = top.code.replace(/\.\d+$/, "")
    socByOcc.set(occId, { code: trimmed, share: total > 0 ? top.n / total : 0 })
  }

  const tasksByOcc = new Map<number, MicroTask[]>()
  for (const t of taskRows as unknown as MicroTask[]) {
    const arr = tasksByOcc.get(t.occupation_id) ?? []
    arr.push(t)
    tasksByOcc.set(t.occupation_id, arr)
  }

  const lines = [
    "occupation_id,slug,title,soc_code,soc_confidence,composite_score,displayed_minutes,time_range_low,time_range_high",
  ]
  let withSoc = 0
  for (const o of occs) {
    const profile = o.composite_score !== null
      ? ({
          id: 0,
          occupation_id: o.id,
          composite_score: Number(o.composite_score),
          work_activity_automation_potential: null,
          time_range_low: o.time_range_low ?? 0,
          time_range_high: o.time_range_high ?? 0,
          time_range_by_block: "",
          top_automatable_activities: "",
          top_blocking_abilities: "",
          physical_ability_avg: o.physical_ability_avg,
        } as AutomationProfile)
      : null
    const { displayedMinutes } = computeDisplayedTimeback(
      profile,
      tasksByOcc.get(o.id) ?? []
    )
    const soc = socByOcc.get(o.id)
    if (soc) withSoc++
    const title = `"${o.title.replace(/"/g, '""')}"`
    lines.push(
      [
        o.id,
        o.slug,
        title,
        soc?.code ?? "",
        soc ? soc.share.toFixed(2) : "",
        o.composite_score ?? "",
        displayedMinutes,
        o.time_range_low ?? "",
        o.time_range_high ?? "",
      ].join(",")
    )
  }

  const outDir = path.join(process.cwd(), "data", "benchmarks")
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, "our_scores.csv")
  fs.writeFileSync(outPath, lines.join("\n") + "\n")
  console.log(`Wrote ${occs.length} occupations (${withSoc} with SOC) to ${outPath}`)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
