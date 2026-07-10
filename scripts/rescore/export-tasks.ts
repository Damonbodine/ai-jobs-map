/**
 * DG3: read-only export of every task to be re-scored.
 *
 * Writes data/scoring/tasks_to_score.csv with columns:
 *   kind (onet|micro), id, occupation_title, task_text
 *
 * onet_tasks supplies its task_title + description; job_micro_tasks supplies
 * task_name + description. Occupation title is included as scoring context.
 *
 * Usage: npx tsx scripts/rescore/export-tasks.ts
 */
import fs from "node:fs"
import path from "node:path"
import { sql } from "drizzle-orm"
import { db, pool } from "../db"

function csvEscape(s: string): string {
  return `"${(s ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`
}

async function main() {
  const onet = (await db.execute(sql`
    SELECT t.id, t.task_title, t.task_description, o.title AS occupation_title
    FROM onet_tasks t
    LEFT JOIN occupations o ON o.id = t.occupation_id
    ORDER BY t.id
  `)).rows as Array<{ id: number; task_title: string; task_description: string; occupation_title: string | null }>

  const micro = (await db.execute(sql`
    SELECT m.id, m.task_name, m.task_description, o.title AS occupation_title
    FROM job_micro_tasks m
    LEFT JOIN occupations o ON o.id = m.occupation_id
    ORDER BY m.id
  `)).rows as Array<{ id: number; task_name: string; task_description: string; occupation_title: string | null }>

  const lines = ["kind,id,occupation_title,task_text"]
  for (const t of onet) {
    const text = t.task_title === t.task_description || !t.task_description
      ? t.task_title
      : `${t.task_title} — ${t.task_description}`
    lines.push(["onet", t.id, csvEscape(t.occupation_title ?? ""), csvEscape(text)].join(","))
  }
  for (const m of micro) {
    const text = m.task_name === m.task_description || !m.task_description
      ? m.task_name
      : `${m.task_name} — ${m.task_description}`
    lines.push(["micro", m.id, csvEscape(m.occupation_title ?? ""), csvEscape(text)].join(","))
  }

  const outDir = path.join(process.cwd(), "data", "scoring")
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, "tasks_to_score.csv")
  fs.writeFileSync(outPath, lines.join("\n") + "\n")
  console.log(`Wrote ${onet.length} onet + ${micro.length} micro tasks to ${outPath}`)
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
