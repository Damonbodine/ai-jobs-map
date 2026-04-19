export const revalidate = 3600

import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { deriveOccupationStory } from "@/lib/occupation-story"
import { computeDisplayedTimeback, estimateTaskMinutes, inferArchetypeMultiplier } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
import { computeAnnualValue } from "@/lib/pricing"
import {
  getOccupationBySlug,
  getOccupationProfile,
  getOccupationTasks,
} from "@/lib/occupation-data"

import { NeonOccupation } from "./neon-occupation"

export async function generateStaticParams() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("slug, employment")
    .order("employment", { ascending: false, nullsFirst: false })
    .limit(12)
  return (data ?? []).map((o) => ({ slug: o.slug }))
}

const AGENT_COLORS = ["#00E5FF", "#B56CFF", "#FF3EA5", "#00FF88", "#FFD400", "#FF6B00"]

/** Neon-mapped module accents — same key set as MODULE_ACCENTS on the cream
 * builder, but saturated for the dark orbital surface. Order preserves the
 * module→color associations users already see on the cream page. */
const NEON_MODULE_ACCENTS: Record<string, string> = {
  intake:        "#00E5FF", // cyan
  analysis:      "#7A8BFF", // indigo
  documentation: "#B56CFF", // violet
  coordination:  "#00FF88", // green
  exceptions:    "#FFD400", // yellow
  learning:      "#FF3EA5", // magenta
  research:      "#1EFFD4", // teal
  compliance:    "#FF4155", // red
  communication: "#FF6B00", // orange
  data_reporting:"#4DC9FF", // sky
}

export type ModuleGroup = {
  moduleKey: string
  label: string
  description: string
  color: string
  taskCount: number
  groupMinutes: number
  taskIds: number[]
}

export default async function NeonOccupationPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  const occupation = await getOccupationBySlug(slug)
  if (!occupation) notFound()

  const [profile, tasks] = await Promise.all([
    getOccupationProfile(occupation.id),
    getOccupationTasks(occupation.id),
  ])

  const story = deriveOccupationStory(occupation, tasks, profile)
  const blueprint = story?.blueprint ?? null

  const aiTasks = tasks.filter((t) => t.ai_applicable)
  const { displayedMinutes, displayedHigh } = computeDisplayedTimeback(
    profile,
    tasks,
    blueprint?.totalMinutesSaved ?? 0
  )
  const claimedMinutes = displayedHigh > 0 ? displayedHigh : displayedMinutes
  const archetypeMultiplier = inferArchetypeMultiplier(profile)
  const annualValue = computeAnnualValue(claimedMinutes, occupation.hourly_wage)

  const rawTotal = aiTasks.reduce(
    (s, t) => s + estimateTaskMinutes(t) * archetypeMultiplier,
    0
  )

  const taskCards = aiTasks
    .map((t) => {
      const raw = estimateTaskMinutes(t) * archetypeMultiplier
      const share =
        rawTotal > 0 && claimedMinutes > 0
          ? Math.max(1, Math.round((raw / rawTotal) * claimedMinutes))
          : Math.max(1, Math.round(raw))
      return {
        id: t.id,
        name: t.task_name,
        minutes: share,
        impact: t.ai_impact_level ?? 0,
        how: t.ai_how_it_helps ?? "",
        block: getBlockForTask(t),
      }
    })
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10)

  const moduleGroups: ModuleGroup[] = (() => {
    type Raw = { taskCount: number; rawMinutes: number; taskIds: number[] }
    const raw = new Map<string, Raw>()
    for (const task of aiTasks) {
      const moduleKey = getBlockForTask(task)
      const minutes = estimateTaskMinutes(task) * archetypeMultiplier
      const existing = raw.get(moduleKey)
      if (existing) {
        existing.taskCount += 1
        existing.rawMinutes += minutes
        existing.taskIds.push(task.id)
      } else {
        raw.set(moduleKey, { taskCount: 1, rawMinutes: minutes, taskIds: [task.id] })
      }
    }

    // Normalize so the sum of groupMinutes equals claimedMinutes. This mirrors
    // the proportional redistribution used by taskCards above.
    const rawModuleTotal = Array.from(raw.values()).reduce((s, r) => s + r.rawMinutes, 0)

    return Array.from(raw.entries())
      .map(([moduleKey, r]): ModuleGroup => {
        const def = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
        const groupMinutes =
          rawModuleTotal > 0 && claimedMinutes > 0
            ? Math.max(1, Math.round((r.rawMinutes / rawModuleTotal) * claimedMinutes))
            : Math.max(1, Math.round(r.rawMinutes))
        return {
          moduleKey,
          label: def?.label ?? moduleKey,
          description: def?.description ?? "",
          color: NEON_MODULE_ACCENTS[moduleKey] ?? "#00E5FF",
          taskCount: r.taskCount,
          groupMinutes,
          taskIds: r.taskIds,
        }
      })
      .sort((a, b) => b.groupMinutes - a.groupMinutes)
  })()

  const agents = (blueprint?.agents ?? []).map((a, i) => ({
    blockName: a.blockName,
    role: a.role,
    color: AGENT_COLORS[i % AGENT_COLORS.length],
    minutesSaved: a.minutesSaved,
    automatedCount: a.tasks.filter((t) => t.tier === "automated").length,
    assistedCount: a.tasks.filter((t) => t.tier === "assisted").length,
    topTasks: a.tasks
      .filter((t) => t.tier !== "human-only")
      .slice(0, 3)
      .map((t) => t.name),
  }))

  const annualMinutes = claimedMinutes * 260

  return (
    <NeonOccupation
      slug={slug}
      title={occupation.title}
      category={occupation.category ?? "Occupation"}
      employment={occupation.employment ?? null}
      hourlyWage={occupation.hourly_wage ?? null}
      claimedMinutes={claimedMinutes}
      annualMinutes={annualMinutes}
      annualValue={annualValue}
      dayChanges={story?.dayChanges ?? ""}
      whyItFits={story?.whyItFits ?? ""}
      handles={story?.handles ?? []}
      staysWithYou={story?.staysWithYou ?? []}
      taskCards={taskCards}
      agents={agents}
      moduleGroups={moduleGroups}
      occupationId={occupation.id}
    />
  )
}
