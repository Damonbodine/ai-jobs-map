export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Zap,
  BookOpen,
  Target,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { PageTransition } from "@/components/PageTransition"
import { cn } from "@/lib/utils"
import type { AiOpportunityCategory, TimeRangeByBlock } from "@/types"

const CATEGORY_LABELS: Record<AiOpportunityCategory, string> = {
  task_automation: "Task Automation",
  decision_support: "Decision Support",
  research_discovery: "Research & Discovery",
  communication: "Communication",
  creative_assistance: "Creative Assistance",
  data_analysis: "Data Analysis",
  learning_education: "Learning & Education",
}

const CATEGORY_COLORS: Record<AiOpportunityCategory, string> = {
  task_automation: "bg-blue-100 text-blue-700",
  decision_support: "bg-purple-100 text-purple-700",
  research_discovery: "bg-green-100 text-green-700",
  communication: "bg-orange-100 text-orange-700",
  creative_assistance: "bg-pink-100 text-pink-700",
  data_analysis: "bg-cyan-100 text-cyan-700",
  learning_education: "bg-amber-100 text-amber-700",
}

const BLOCK_LABELS: Record<string, string> = {
  intake: "Intake",
  analysis: "Analysis",
  documentation: "Documentation",
  coordination: "Coordination",
  research: "Research",
  communication: "Communication",
  exceptions: "Exceptions",
  learning: "Learning",
  compliance: "Compliance",
  data_reporting: "Data & Reporting",
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

  const [
    { data: profile },
    { data: opportunities },
    { data: tasks },
    { data: skills },
    { data: related },
  ] = await Promise.all([
    supabase
      .from("occupation_automation_profile")
      .select("*")
      .eq("occupation_id", occupation.id)
      .single(),
    supabase
      .from("ai_opportunities")
      .select("*")
      .eq("occupation_id", occupation.id)
      .eq("is_approved", true)
      .order("impact_level", { ascending: false }),
    supabase
      .from("job_micro_tasks")
      .select("*")
      .eq("occupation_id", occupation.id)
      .order("ai_impact_level", { ascending: false }),
    supabase
      .from("skill_recommendations")
      .select("*")
      .eq("occupation_id", occupation.id)
      .order("priority", { ascending: false }),
    supabase
      .from("occupations")
      .select("id, title, slug")
      .eq("major_category", occupation.major_category)
      .neq("slug", slug)
      .limit(4),
  ])

  const midMinutes = profile
    ? Math.round(((profile.time_range_low ?? 0) + (profile.time_range_high ?? 0)) / 2)
    : 0

  let blocks: TimeRangeByBlock = {}
  try {
    blocks = profile?.time_range_by_block
      ? JSON.parse(profile.time_range_by_block)
      : {}
  } catch {
    blocks = {}
  }

  let topActivities: string[] = []
  try {
    const raw = profile?.top_automatable_activities
      ? JSON.parse(profile.top_automatable_activities)
      : []
    topActivities = raw.map((item: unknown) =>
      typeof item === "string" ? item : (item as { name?: string }).name ?? String(item)
    )
  } catch {
    topActivities = []
  }

  let topBlockers: string[] = []
  try {
    const raw = profile?.top_blocking_abilities
      ? JSON.parse(profile.top_blocking_abilities)
      : []
    topBlockers = raw.map((item: unknown) =>
      typeof item === "string" ? item : (item as { name?: string }).name ?? String(item)
    )
  } catch {
    topBlockers = []
  }

  const readiness = profile ? Math.round(profile.composite_score ?? 0) : 0

  const categoryBreakdown: Record<string, number> = {}
  opportunities?.forEach((opp) => {
    categoryBreakdown[opp.category] = (categoryBreakdown[opp.category] || 0) + 1
  })

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
          <div className="mb-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {occupation.major_category}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {occupation.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {occupation.employment && (
                <span>{occupation.employment.toLocaleString()} employed</span>
              )}
              {occupation.annual_wage && (
                <span>${occupation.annual_wage.toLocaleString()}/yr median</span>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Time-Back Hero Card */}
        {profile && (midMinutes > 0 || readiness > 0) && (
          <FadeIn delay={0.15}>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 mb-6 sm:mb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {midMinutes > 0 ? (
                    <>
                      <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Estimated Time Back
                      </div>
                      <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="font-heading text-4xl sm:text-6xl font-bold text-accent">
                          {midMinutes}
                        </span>
                        <span className="text-base sm:text-lg text-muted-foreground">
                          min/day
                        </span>
                      </div>
                      {profile.time_range_low != null && profile.time_range_high != null && (
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                          Range: {profile.time_range_low}–{profile.time_range_high} minutes
                          <span className="hidden sm:inline"> (conservative to optimistic)</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      AI Readiness Score
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="hsl(var(--accent))"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${readiness * 2.64} ${264 - readiness * 2.64}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-heading text-lg sm:text-xl font-bold">
                        {readiness}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                        readiness
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time by block */}
              {Object.keys(blocks).length > 0 && (
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border">
                  <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Time Savings by Work Area
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible scrollbar-hide">
                    {Object.entries(blocks).map(([block, range]) => (
                      <div
                        key={block}
                        className="rounded-lg bg-secondary/50 p-3 min-w-[120px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
                      >
                        <div className="text-[11px] text-muted-foreground mb-1">
                          {BLOCK_LABELS[block] || block}
                        </div>
                        <div className="font-heading text-sm font-semibold">
                          {range.low}–{range.high}
                          <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                            min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Micro Tasks */}
            {tasks && tasks.length > 0 && (
              <FadeIn delay={0.2}>
                <section>
                  <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    Daily Tasks & AI Applicability
                  </h2>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl border border-border bg-card p-3.5 sm:p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-sm font-semibold">
                                {task.task_name}
                              </span>
                              {task.ai_applicable && (
                                <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  AI
                                </span>
                              )}
                              <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground sm:hidden">
                                {task.frequency}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {task.task_description}
                            </p>
                            {task.ai_how_it_helps && (
                              <p className="text-xs text-accent mt-1.5">
                                {task.ai_how_it_helps}
                              </p>
                            )}
                          </div>
                          <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                              {task.frequency}
                            </span>
                            {task.ai_impact_level && (
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      i < task.ai_impact_level!
                                        ? "bg-accent"
                                        : "bg-border"
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </FadeIn>
            )}

            {/* AI Opportunities */}
            {opportunities && opportunities.length > 0 && (
              <FadeIn delay={0.25}>
                <section>
                  <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    AI Opportunities
                  </h2>
                  <div className="space-y-3">
                    {opportunities.map((opp) => (
                      <div
                        key={opp.id}
                        className="rounded-xl border border-border bg-card p-3.5 sm:p-4"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-sm font-semibold">{opp.title}</span>
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded",
                              CATEGORY_COLORS[opp.category as AiOpportunityCategory]
                            )}
                          >
                            {CATEGORY_LABELS[opp.category as AiOpportunityCategory]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {opp.description}
                        </p>
                        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                          <div className="text-[11px]">
                            <span className="text-muted-foreground">Impact </span>
                            <span className="font-semibold">{opp.impact_level}/5</span>
                          </div>
                          <div className="text-[11px]">
                            <span className="text-muted-foreground">Effort </span>
                            <span className="font-semibold">{opp.effort_level}/5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </FadeIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Automatable Activities */}
            {topActivities.length > 0 && (
              <FadeIn delay={0.3}>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-accent" />
                    Top Automatable
                  </h3>
                  <div className="space-y-2">
                    {topActivities.map((activity, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold bg-accent/10 text-accent w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Blocking Abilities */}
            {topBlockers.length > 0 && (
              <FadeIn delay={0.35}>
                <div className="rounded-xl border border-border bg-card p-5">
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

            {/* Skills */}
            {skills && skills.length > 0 && (
              <FadeIn delay={0.4}>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-accent" />
                    Recommended Skills
                  </h3>
                  <div className="space-y-3">
                    {skills.map((skill) => (
                      <div key={skill.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{skill.skill_name}</span>
                          <span
                            className={cn(
                              "text-[9px] font-medium px-1.5 py-0.5 rounded",
                              skill.difficulty === "beginner"
                                ? "bg-green-100 text-green-700"
                                : skill.difficulty === "intermediate"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            )}
                          >
                            {skill.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {skill.skill_description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Category Breakdown */}
            {Object.keys(categoryBreakdown).length > 0 && (
              <FadeIn delay={0.45}>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold mb-3">Opportunity Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(categoryBreakdown).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            CATEGORY_COLORS[cat as AiOpportunityCategory]
                          )}
                        >
                          {CATEGORY_LABELS[cat as AiOpportunityCategory]}
                        </span>
                        <span className="text-xs font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Related Occupations */}
            {related && related.length > 0 && (
              <FadeIn delay={0.5}>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold mb-3">Related Occupations</h3>
                  <div className="space-y-2">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        href={`/occupation/${r.slug}`}
                        className="flex items-center justify-between group"
                      >
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          {r.title}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Blueprint CTA */}
            <FadeIn delay={0.55}>
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                <h3 className="text-sm font-semibold mb-2">Agent Blueprint</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  See the full AI agent system design for {occupation.title}.
                </p>
                <Link
                  href={`/blueprint/${occupation.slug}`}
                  className="block text-center text-xs font-semibold bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity mb-2"
                >
                  View Blueprint
                </Link>
                <Link
                  href={`/factory?occupation=${occupation.slug}`}
                  className="block text-center text-xs font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Configure System
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
