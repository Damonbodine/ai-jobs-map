export const revalidate = 3600

import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { PageTransition } from "@/components/PageTransition"
import { deriveOccupationStory } from "@/lib/occupation-story"
import { computeDisplayedTimeback, estimateTaskMinutes, inferArchetypeMultiplier } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import { computeAnnualValue } from "@/lib/pricing"
import { getAllCapabilities } from "@/lib/capabilities"
import {
  getOccupationBySlug,
  getOccupationProfile,
  getOccupationTasks,
  getRelatedOccupations,
} from "@/lib/occupation-data"
import type { ModuleCapability } from "@/types"

import { EstimateInfo } from "./estimate-info"
import { OccupationDonut } from "./occupation-donut"
import { OccupationBuilder } from "./occupation-builder"
import { OnePagerButton } from "./one-pager-button"
import { OccupationDemoSection, OccupationDemoSectionSkeleton } from "@/components/demo/OccupationDemoSection"

export async function generateStaticParams() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("slug, employment")
    .order("employment", { ascending: false, nullsFirst: false })
    .limit(20)
  return (data ?? []).map((o) => ({ slug: o.slug }))
}

export default async function OccupationPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  const occupation = await getOccupationBySlug(slug)
  if (!occupation) notFound()

  const [profile, tasks, capabilitiesByModule, relatedRoles] = await Promise.all([
    getOccupationProfile(occupation.id),
    getOccupationTasks(occupation.id),
    getAllCapabilities(),
    getRelatedOccupations(occupation.id, occupation.major_category, 4),
  ])

  const story = deriveOccupationStory(occupation, tasks, profile)
  const blueprint = story?.blueprint ?? null

  const aiTasks = tasks.filter((task) => task.ai_applicable)
  const { displayedMinutes, displayedLow, displayedHigh } = computeDisplayedTimeback(
    profile,
    tasks,
    blueprint?.totalMinutesSaved ?? 0
  )
  const archetypeMultiplier = inferArchetypeMultiplier(profile)
  // Use displayedHigh (optimistic end of BLS range) as the headline claim so
  // the hero "Reclaim X minutes" matches what the agent demo footer shows.
  const claimedMinutes = displayedHigh > 0 ? displayedHigh : displayedMinutes
  const annualValue = computeAnnualValue(claimedMinutes, occupation.hourly_wage)

  // Compute per-task display minutes scaled to displayed total
  const rawTaskTotal = aiTasks.reduce(
    (sum, task) => sum + estimateTaskMinutes(task) * archetypeMultiplier,
    0
  )

  const routineCards = aiTasks
    .map((task) => {
      const raw = estimateTaskMinutes(task) * archetypeMultiplier
      const share =
        rawTaskTotal > 0 && claimedMinutes > 0
          ? Math.max(1, Math.round((raw / rawTaskTotal) * claimedMinutes))
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
    ? claimedMinutes / blueprint.totalMinutesSaved
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

        {/* Hero — compact so the demo lands in the first viewport */}
        <FadeIn>
          <div className="mb-8 text-center max-w-3xl mx-auto">
            <div className="inline-block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 border border-border rounded-full px-3 py-1">
              Occupation
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-balance">
              {occupation.title}
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <p className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-balance text-muted-foreground">
                Custom AI agents built to reclaim your{" "}
                <span className="text-foreground font-bold">{claimedMinutes} minutes</span>{" "}
                a day
              </p>
              <EstimateInfo />
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
              >
                Book a scoping call
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* AI Agent Demo — streams in, positioned above breakdown for max impact */}
        <div id="agent-demo" className="scroll-mt-8">
          <Suspense fallback={<OccupationDemoSectionSkeleton />}>
            <OccupationDemoSection
              slug={slug}
              occupationTitle={occupation.title}
            />
          </Suspense>
        </div>

        {/* Post-demo context + secondary CTAs — recovers the lead-magnets the hero dropped */}
        <FadeIn delay={0.1}>
          <div className="my-12 max-w-2xl mx-auto text-center">
            {story && (
              <>
                <h2 className="font-heading text-xl font-semibold mb-3">
                  What a day looks like
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {story.dayChanges}
                </p>
              </>
            )}
            <div className={`${story ? "mt-6 " : ""}flex flex-col items-center gap-3 sm:flex-row sm:justify-center`}>
              <OnePagerButton
                occupationSlug={slug}
                occupationTitle={occupation.title}
              />
              <Link
                href={`/build-a-team?roles=${occupation.slug}:1`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
              >
                Add to Team
              </Link>
              <a
                href="#assistant-builder"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Build your assistant ↓
              </a>
            </div>
          </div>
        </FadeIn>

        {/* Donut Chart */}
        {donutAgents.length > 0 && (
          <FadeIn delay={0.15}>
            <div id="assistant-breakdown">
              <OccupationDonut
                agents={donutAgents}
                capabilitiesByModule={capabilitiesByModule}
                totalMinutes={claimedMinutes}
                blueprintScale={blueprintScale}
              />
            </div>
          </FadeIn>
        )}

        {/* Task Table with Checkboxes */}
        {routineCards.length > 0 && (
          <FadeIn delay={0.25}>
            <div id="assistant-builder" className="mb-4 scroll-mt-24">
              <h2 className="font-heading text-xl font-semibold mb-1">
                Build Your Custom Assistant
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose the tasks you want covered, then request a custom assistant plan.
              </p>
            </div>
            <OccupationBuilder
              tasks={routineCards}
              slug={slug}
              totalMinutes={claimedMinutes}
              annualValue={annualValue}
              occupationId={occupation.id}
              occupationTitle={occupation.title}
              hourlyWage={occupation.hourly_wage}
              capabilitiesByModule={capabilitiesByModule as Record<string, ModuleCapability[]>}
              relatedRoles={relatedRoles}
            />
          </FadeIn>
        )}
      </div>
    </PageTransition>
  )
}
