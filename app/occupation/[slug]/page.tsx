export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Info } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { PageTransition } from "@/components/PageTransition"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { deriveOccupationStory } from "@/lib/occupation-story"
import { computeDisplayedTimeback, estimateTaskMinutes, inferArchetypeMultiplier } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import { computeAnnualValue } from "@/lib/pricing"
import { getAllCapabilities } from "@/lib/capabilities"
import type { MicroTask, AutomationProfile, ModuleCapability } from "@/types"

import { OccupationDonut } from "./occupation-donut"
import { OccupationBuilder } from "./occupation-builder"

export default async function OccupationPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const supabase = createServerClient()

  const { data: occupation } = await supabase
    .from("occupations")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!occupation) notFound()

  const [{ data: profile }, { data: tasks }, capabilitiesByModule] = await Promise.all([
    supabase
      .from("occupation_automation_profile")
      .select("*")
      .eq("occupation_id", occupation.id)
      .single(),
    supabase
      .from("job_micro_tasks")
      .select("*")
      .eq("occupation_id", occupation.id)
      .order("ai_impact_level", { ascending: false }),
    getAllCapabilities(),
  ])

  const story = deriveOccupationStory(occupation, tasks ?? [], profile ?? null)
  const blueprint = story?.blueprint ?? null

  const aiTasks = (tasks ?? []).filter((task) => task.ai_applicable)
  const { displayedMinutes, displayedLow, displayedHigh } = computeDisplayedTimeback(
    profile ?? null,
    tasks ?? [],
    blueprint?.totalMinutesSaved ?? 0
  )
  const archetypeMultiplier = inferArchetypeMultiplier(profile ?? null)
  const annualValue = computeAnnualValue(displayedMinutes, occupation.hourly_wage)

  // Compute per-task display minutes scaled to displayed total
  const rawTaskTotal = aiTasks.reduce(
    (sum, task) => sum + estimateTaskMinutes(task) * archetypeMultiplier,
    0
  )

  const routineCards = aiTasks
    .map((task) => {
      const raw = estimateTaskMinutes(task) * archetypeMultiplier
      const share =
        rawTaskTotal > 0 && displayedMinutes > 0
          ? Math.max(1, Math.round((raw / rawTaskTotal) * displayedMinutes))
          : Math.max(1, Math.round(raw))

      const low = Math.max(1, Math.round(share * 0.78))
      const high = Math.max(low + 1, Math.round(share * 1.22))

      return {
        id: task.id,
        task_name: task.task_name,
        displayLow: low,
        displayHigh: high,
        ai_impact_level: task.ai_impact_level,
        ai_how_it_helps: task.ai_how_it_helps,
        moduleKey: getBlockForTask(task),
      }
    })
    .sort((a, b) => {
      const aMid = (a.displayLow + a.displayHigh) / 2
      const bMid = (b.displayLow + b.displayHigh) / 2
      if (bMid !== aMid) return bMid - aMid
      return (b.ai_impact_level ?? 0) - (a.ai_impact_level ?? 0)
    })

  // Prepare donut data from blueprint agents
  const blueprintScale = blueprint && blueprint.totalMinutesSaved > 0
    ? displayedMinutes / blueprint.totalMinutesSaved
    : 1

  const donutAgents = (blueprint?.agents ?? []).map((agent) => ({
    blockName: agent.blockName,
    role: agent.role,
    tasks: agent.tasks
      .filter((t) => t.tier !== "human-only")
      .map((t) => ({ name: t.name, tier: t.tier, minutesSaved: t.minutesSaved })),
    toolAccess: agent.toolAccess,
    minutesSaved: agent.minutesSaved,
  }))

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/browse" className="hover:text-foreground transition-colors">
            Browse
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{occupation.title}</span>
        </nav>

        {/* Hero */}
        <FadeIn>
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <div className="inline-block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 border border-border rounded-full px-3 py-1">
              Occupation
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-3">
              {occupation.title} &ndash; Reclaim {displayedMinutes} minutes every single day
              <TooltipProvider delay={120}>
                <Tooltip>
                  <TooltipTrigger
                    className="ml-2 inline-flex align-middle rounded-full border border-border/70 p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    aria-label="How this estimate is calculated"
                  >
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm items-start gap-0 px-3 py-2 text-left leading-relaxed">
                    <div>
                      We estimate how much daily time in this role sits in repeatable work AI can assist or automate.
                    </div>
                    <div className="mt-2 text-background/80">
                      The range reflects conservative and optimistic assumptions, and your selected tasks below change the custom build estimate.
                    </div>
                    <div className="mt-2 text-background/70">
                      This is an estimate, not a guarantee.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h1>
            <div className="text-sm text-muted-foreground mb-4">
              Range {displayedLow}&ndash;{displayedHigh} min
            </div>
            {story && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {story.dayChanges}
              </p>
            )}
          </div>
        </FadeIn>

        {/* Donut Chart */}
        {donutAgents.length > 0 && (
          <FadeIn delay={0.15}>
            <OccupationDonut
              agents={donutAgents}
              capabilitiesByModule={capabilitiesByModule}
              totalMinutes={displayedMinutes}
              blueprintScale={blueprintScale}
            />
          </FadeIn>
        )}

        {/* Task Table with Checkboxes */}
        {routineCards.length > 0 && (
          <FadeIn delay={0.25}>
            <div className="mb-4">
              <h2 className="font-heading text-xl font-semibold mb-1">
                Select the work you want included
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose the tasks you want covered, then request a custom assistant plan without leaving this page.
              </p>
            </div>
            <OccupationBuilder
              tasks={routineCards}
              slug={slug}
              totalMinutes={displayedMinutes}
              annualValue={annualValue}
              occupationId={occupation.id}
              occupationTitle={occupation.title}
              hourlyWage={occupation.hourly_wage}
              capabilitiesByModule={capabilitiesByModule as Record<string, ModuleCapability[]>}
            />
          </FadeIn>
        )}
      </div>
    </PageTransition>
  )
}
