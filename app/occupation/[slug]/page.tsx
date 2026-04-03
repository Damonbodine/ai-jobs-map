export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Zap,
  Workflow,
  ChevronRight,
} from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { PageTransition } from "@/components/PageTransition"
import { cn } from "@/lib/utils"
import { deriveOccupationStory } from "@/lib/occupation-story"
import { computeDisplayedTimeback, estimateTaskMinutes, inferArchetypeMultiplier } from "@/lib/timeback"
import type {
  AiOpportunityCategory,
  TimeRangeByBlock,
  MicroTask,
  AutomationProfile,
  BlockExampleMap,
} from "@/types"

import { MODULE_LABELS as BLOCK_LABELS, MODULE_COLORS as BLOCK_PILL_STYLES } from "@/lib/modules"

// Muted card styles for the large featured block cards — white text on soft dark fills
const BLOCK_CARD_STYLES: Record<string, string> = {
  intake: "bg-cyan-700/80 text-white border-cyan-600/50 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-800",
  analysis: "bg-indigo-700/80 text-white border-indigo-600/50 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800",
  documentation: "bg-violet-700/80 text-white border-violet-600/50 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800",
  coordination: "bg-emerald-700/80 text-white border-emerald-600/50 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800",
  exceptions: "bg-amber-700/80 text-white border-amber-600/50 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
  learning: "bg-rose-700/80 text-white border-rose-600/50 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800",
  research: "bg-teal-700/80 text-white border-teal-600/50 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800",
  compliance: "bg-red-700/80 text-white border-red-600/50 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800",
  communication: "bg-orange-700/80 text-white border-orange-600/50 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800",
  data_reporting: "bg-sky-700/80 text-white border-sky-600/50 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800",
}

function formatHandle(handle: string) {
  if (!handle) return handle
  return handle.charAt(0).toUpperCase() + handle.slice(1)
}

function midpoint(range: { low: number; high: number }) {
  return (range.low + range.high) / 2
}

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

  const [{ data: profile }, { data: tasks }] = await Promise.all([
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
  ])

  let blocks: TimeRangeByBlock = {}
  try {
    blocks = profile?.time_range_by_block
      ? JSON.parse(profile.time_range_by_block)
      : {}
  } catch {
    blocks = {}
  }

  let topBlockers: string[] = []
  let blockExampleTasks: BlockExampleMap = {}
  try {
    const raw = profile?.top_blocking_abilities
      ? JSON.parse(profile.top_blocking_abilities)
      : []
    topBlockers = raw
      .map((item: unknown) => {
        if (typeof item === "string") return item
        if (!item || typeof item !== "object") return null

        const candidate =
          (item as { name?: string; ability?: string; title?: string; label?: string }).name ??
          (item as { name?: string; ability?: string; title?: string; label?: string }).ability ??
          (item as { name?: string; ability?: string; title?: string; label?: string }).title ??
          (item as { name?: string; ability?: string; title?: string; label?: string }).label

        return candidate && candidate !== "[object Object]" ? candidate : null
      })
      .filter((item: string | null): item is string => Boolean(item))
  } catch {
    topBlockers = []
  }

  try {
    blockExampleTasks = profile?.block_example_tasks
      ? JSON.parse(profile.block_example_tasks)
      : {}
  } catch {
    blockExampleTasks = {}
  }

  const readiness = profile ? Math.round(profile.composite_score ?? 0) : 0
  const story = deriveOccupationStory(occupation, tasks ?? [], profile ?? null)
  const blueprint = story?.blueprint ?? null

  const aiTasks = (tasks ?? []).filter((task) => task.ai_applicable)
  const { displayedMinutes, displayedLow, displayedHigh } = computeDisplayedTimeback(
    profile ?? null,
    tasks ?? [],
    blueprint?.totalMinutesSaved ?? 0
  )
  const archetypeMultiplier = inferArchetypeMultiplier(profile ?? null)

  if (Object.keys(blocks).length === 0 && blueprint?.agents?.length) {
    blocks = Object.fromEntries(
      blueprint.agents.map((agent) => [
        agent.blockName,
        {
          low: Math.max(1, Math.round(agent.minutesSaved * 0.72)),
          high: Math.max(2, Math.round(agent.minutesSaved * 1.18)),
        },
      ])
    )
  }

  const blockEntries = Object.entries(blocks)
  if (blockEntries.length > 0 && displayedMinutes > 0) {
    const currentMidTotal = blockEntries.reduce(
      (sum, [_, range]) => sum + (range.low + range.high) / 2,
      0
    )

    if (currentMidTotal > 0) {
      const scale = displayedMinutes / currentMidTotal
      blocks = Object.fromEntries(
        blockEntries.map(([block, range]) => {
          const mid = ((range.low + range.high) / 2) * scale
          const halfWidth = Math.max(1, ((range.high - range.low) / 2) * Math.max(0.7, scale))

          return [
            block,
            {
              low: Math.max(1, Math.round(mid - halfWidth)),
              high: Math.max(2, Math.round(mid + halfWidth)),
            },
          ]
        })
      )
    }
  }

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
        ...task,
        displayMinutes: share,
        displayLow: low,
        displayHigh: high,
      }
    })
    .sort((a, b) => {
      if (b.displayMinutes !== a.displayMinutes) return b.displayMinutes - a.displayMinutes
      return (b.ai_impact_level ?? 0) - (a.ai_impact_level ?? 0)
    })

  const featuredRoutines = routineCards.slice(0, 6)
  const extraRoutines = routineCards.slice(6, 18)
  const blueprintBlockExamples = Object.fromEntries(
    (blueprint?.agents ?? []).map((agent) => [
      agent.blockName,
      agent.tasks
        .slice()
        .sort((a, b) => b.minutesSaved - a.minutesSaved)
        .slice(0, 3)
        .map((task) => task.name),
    ])
  ) as Record<string, string[]>

  const blockTaskExamples = Object.fromEntries(
    Object.keys(blocks).map((block) => [
      block,
      (blockExampleTasks[block]?.examples ?? []).map((example) => example.title),
    ])
  ) as Record<string, string[]>

  const featuredBlocks = Object.entries(blocks)
    .sort((a, b) => midpoint(b[1]) - midpoint(a[1]))
    .slice(0, 3)
  const featuredBlockKeys = new Set(featuredBlocks.map(([block]) => block))
  const secondaryBlocks = Object.entries(blocks)
    .sort((a, b) => midpoint(b[1]) - midpoint(a[1]))
    .filter(([block]) => !featuredBlockKeys.has(block))
  const recommendedTier =
    story?.blueprint.architecture === "single-agent"
      ? "starter"
      : story?.blueprint.architecture === "multi-agent"
        ? "workflow"
        : "ops"
  const recommendedTierLabel =
    recommendedTier === "starter"
      ? "Starter Assistant"
      : recommendedTier === "workflow"
        ? "Workflow Bundle"
        : "Ops Layer"
  const taskBackedBlocks = new Set(
    aiTasks
      .map((task) => task.ai_category)
      .filter(Boolean)
  ).size

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

        {/* Header */}
        <FadeIn>
          <div className="mb-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {occupation.major_category}
            </div>
            <div className="mb-2 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:gap-6">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-[0.92] max-w-[14ch]">
                {occupation.title}
              </h1>
              {displayedMinutes > 0 && (
                <div className="lg:text-right lg:self-center">
                  <div className="flex items-end gap-2.5 lg:justify-end">
                    <div className="font-heading text-[3rem] sm:text-[3.5rem] font-bold text-accent leading-none">
                      {displayedMinutes}
                    </div>
                    <div className="text-lg sm:text-xl text-foreground/80 mb-1">
                      min/day back
                    </div>
                  </div>
                  {displayedLow != null && displayedHigh != null && (
                    <div className="text-sm text-muted-foreground mt-1.5 lg:text-right">
                      Range {displayedLow}–{displayedHigh} minutes
                    </div>
                  )}
                </div>
              )}
            </div>
            {story ? (
              <div className="max-w-2xl space-y-3">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {story.dayChanges}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {story.recommendationReason}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                See where routine work is slowing this role down and what the first practical support setup should look like.
              </p>
            )}
          </div>
        </FadeIn>

        {(story || Object.keys(blocks).length > 0) && (
          <FadeIn delay={0.18}>
            <section className="mb-8">
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
                {story && (
                  <>
                    <div className="max-w-3xl mb-6">
                      <div className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                        Save time with an AI assistant
                      </div>
                      <h2 className="font-heading text-lg sm:text-xl font-semibold tracking-tight mt-2 text-foreground/80">
                        {story.startWith}
                      </h2>
                      {featuredBlocks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {featuredBlocks.map(([block, range]) => (
                            <div
                              key={`summary-${block}`}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                                BLOCK_PILL_STYLES[block] || "bg-secondary/30 text-foreground border-border"
                              )}
                            >
                              <span className="font-medium">
                                {BLOCK_LABELS[block] || block}
                              </span>
                              <span className="opacity-80">
                                {range.low}–{range.high} min
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {Object.keys(blocks).length > 0 && (
                  <div className="mb-5 space-y-3">
                    {featuredBlocks.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {featuredBlocks.map(([block, range]) => {
                          const examples = (blockTaskExamples[block] ?? []).length > 0
                            ? blockTaskExamples[block]
                            : (blueprintBlockExamples[block] ?? [])

                          return (
                            <div
                              key={block}
                              className={cn(
                                "rounded-xl border p-4",
                                BLOCK_CARD_STYLES[block] || "bg-secondary/30 text-foreground border-border"
                              )}
                            >
                              <div className="flex items-end justify-between gap-3">
                                <div className="text-sm font-semibold">
                                  {BLOCK_LABELS[block] || block}
                                </div>
                                <div className="text-xs opacity-80">
                                  {range.low}–{range.high} min
                                </div>
                              </div>

                              {examples.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {examples.map((example) => (
                                    <div
                                      key={example}
                                      className="rounded-lg bg-white/15 border border-white/20 px-3 py-2 text-xs leading-relaxed text-white/90"
                                    >
                                      {example}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {secondaryBlocks.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Other work areas
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible scrollbar-hide">
                          {secondaryBlocks.map(([block, range]) => (
                            <div
                              key={block}
                              className={cn(
                                "rounded-lg border p-3 min-w-[120px] sm:min-w-0 flex-shrink-0 sm:flex-shrink",
                                BLOCK_CARD_STYLES[block] || "bg-secondary/50 text-foreground border-border"
                              )}
                            >
                              <div className="text-[11px] opacity-80 mb-1">
                                {BLOCK_LABELS[block] || block}
                              </div>
                              <div className="font-heading text-sm font-semibold">
                                {range.low}–{range.high}
                                <span className="text-[10px] opacity-75 font-normal ml-0.5">
                                  min
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </FadeIn>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {story && (
              <FadeIn delay={0.4}>
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <Workflow className="h-4 w-4 text-accent" />
                    Build your AI assistant
                  </div>
                  <div className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                    This role already maps cleanly into a recommended assistant setup. Start with the blueprint, then modify the support areas and task coverage into a version that matches how you actually work.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    <div className="rounded-xl bg-secondary/40 p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Recommended suite
                      </div>
                      <div className="text-sm font-semibold mt-1">{recommendedTierLabel}</div>
                    </div>
                    <div className="rounded-xl bg-secondary/40 p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Support areas
                      </div>
                      <div className="text-sm font-semibold mt-1">
                        {taskBackedBlocks || story.blueprint.agents.length}
                      </div>
                    </div>
                    <div className="rounded-xl bg-secondary/40 p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Tasks mapped
                      </div>
                      <div className="text-sm font-semibold mt-1">{aiTasks.length}</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/blueprint/${slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
                    >
                      Build your personal assistant
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Featured Routines — individual tasks AI would handle */}
            {featuredRoutines.length > 0 && (
              <FadeIn delay={0.5}>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    Top tasks your assistant would handle
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {featuredRoutines.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-border bg-card px-3.5 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium leading-snug">{task.task_name}</div>
                          <div className="text-xs text-accent font-semibold whitespace-nowrap">
                            {task.displayLow}–{task.displayHigh}m
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {task.ai_how_it_helps || task.task_description}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground capitalize">{task.frequency}</span>
                          {task.ai_impact_level && (
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded",
                              task.ai_impact_level >= 4
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            )}>
                              {task.ai_impact_level >= 4 ? "automated" : "assisted"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {extraRoutines.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-3">
                      + {extraRoutines.length} more tasks mapped
                    </div>
                  )}
                </div>
              </FadeIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Blocking Abilities */}
            {topBlockers.length > 0 && (
              <FadeIn delay={0.35}>
                <div className="rounded-xl border border-border bg-secondary/10 p-5">
                  <h3 className="text-sm font-semibold mb-3">Requires Human Judgment</h3>
                  <div className="space-y-1.5">
                    {topBlockers.map((blocker, i) => (
                      <div
                        key={i}
                        className="text-xs text-muted-foreground flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                        {blocker}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

          </div>
        </div>
      </div>
    </PageTransition>
  )
}
