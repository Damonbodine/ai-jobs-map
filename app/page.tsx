export const dynamic = "force-dynamic"

import Link from "next/link"
import { Clock, Cpu, Users } from "lucide-react"
import { db } from "@/lib/db/client"
import { occupations, occupationAutomationProfile, jobMicroTasks } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { CATEGORIES } from "@/lib/categories"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { LandingSearch } from "@/app/landing-search"
import { computeDisplayedTimeback } from "@/lib/timeback"
import type { Occupation, MicroTask, AutomationProfile } from "@/types"
import { Suspense } from "react"
import { DemoTeaser } from "@/components/demo/DemoTeaser"

const POPULAR_SLUGS = [
  "software-developers",
  "registered-nurses",
  "financial-managers",
  "marketing-managers",
  "accountants-and-auditors",
  "project-management-specialists",
  "human-resources-managers",
  "graphic-designers",
  "dental-hygienists",
  "civil-engineers",
]

// Fallback for the average when the DB is unavailable; otherwise it's derived
// from the popular-occupation estimates fetched below.
const FALLBACK_AVG_MINUTES = 58

const buildStats = (avgMinutes: number) => [
  { icon: Clock, value: String(avgMinutes), label: "Avg min saved / day" },
  { icon: Cpu, value: "12K+", label: "Tasks mapped" },
  { icon: Users, value: "847", label: "Occupations" },
]

const DATA_SOURCES = [
  "Bureau of Labor Statistics",
  "O*NET",
  "12,000+ tasks analyzed",
  "35 named capabilities",
]

export default async function HomePage() {
  let categoryCounts: Record<string, number> = {}
  let popularOccupations: { title: string; slug: string; minutes: number }[] = []
  let featuredExample: { title: string; slug: string; minutes: number; topAreas: string[] } | null = null

  try {
    // Fetch category counts
    const categoryRows = await db
      .select({ major_category: occupations.majorCategory })
      .from(occupations)

    for (const row of categoryRows ?? []) {
      categoryCounts[row.major_category] = (categoryCounts[row.major_category] || 0) + 1
    }

    // Fetch popular occupations with live time estimates
    const popOccs = await db
      .select({
        id: occupations.id,
        title: occupations.title,
        slug: occupations.slug,
        major_category: occupations.majorCategory,
      })
      .from(occupations)
      .where(inArray(occupations.slug, POPULAR_SLUGS))

    if (popOccs && popOccs.length > 0) {
      const popIds = popOccs.map((o) => o.id)

      const [profiles, tasks] = await Promise.all([
        db
          .select({
            id: occupationAutomationProfile.id,
            occupation_id: occupationAutomationProfile.occupationId,
            composite_score: occupationAutomationProfile.compositeScore,
            work_activity_automation_potential: occupationAutomationProfile.workActivityAutomationPotential,
            time_range_low: occupationAutomationProfile.timeRangeLow,
            time_range_high: occupationAutomationProfile.timeRangeHigh,
            time_range_by_block: occupationAutomationProfile.timeRangeByBlock,
            block_example_tasks: occupationAutomationProfile.blockExampleTasks,
            top_automatable_activities: occupationAutomationProfile.topAutomatableActivities,
            top_blocking_abilities: occupationAutomationProfile.topBlockingAbilities,
            physical_ability_avg: occupationAutomationProfile.physicalAbilityAvg,
          })
          .from(occupationAutomationProfile)
          .where(inArray(occupationAutomationProfile.occupationId, popIds)),
        db
          .select({
            id: jobMicroTasks.id,
            occupation_id: jobMicroTasks.occupationId,
            task_name: jobMicroTasks.taskName,
            task_description: jobMicroTasks.taskDescription,
            frequency: jobMicroTasks.frequency,
            ai_applicable: jobMicroTasks.aiApplicable,
            ai_how_it_helps: jobMicroTasks.aiHowItHelps,
            ai_impact_level: jobMicroTasks.aiImpactLevel,
            ai_effort_to_implement: jobMicroTasks.aiEffortToImplement,
            ai_category: jobMicroTasks.aiCategory,
            ai_tools: jobMicroTasks.aiTools,
          })
          .from(jobMicroTasks)
          .where(inArray(jobMicroTasks.occupationId, popIds)),
      ])

      const profileMap = new Map((profiles ?? []).map((p) => [p.occupation_id, p as unknown as AutomationProfile]))
      const taskMap = new Map<number, MicroTask[]>()
      for (const t of (tasks ?? []) as unknown as MicroTask[]) {
        const existing = taskMap.get(t.occupation_id) ?? []
        existing.push(t)
        taskMap.set(t.occupation_id, existing)
      }

      popularOccupations = POPULAR_SLUGS
        .map((slug) => {
          const occ = popOccs.find((o) => o.slug === slug)
          if (!occ) return null
          const profile = profileMap.get(occ.id) ?? null
          const occTasks = taskMap.get(occ.id) ?? []
          const { displayedMinutes } = computeDisplayedTimeback(profile, occTasks)
          return { title: occ.title, slug: occ.slug, minutes: displayedMinutes }
        })
        .filter((o): o is { title: string; slug: string; minutes: number } => o !== null)
    }

    // Pick a rotating featured example from popular occupations
    const examples = [
      { slug: "registered-nurses", areas: ["documentation", "coordination", "analysis"] },
      { slug: "construction-managers", areas: ["communication", "compliance", "documentation"] },
      { slug: "software-developers", areas: ["documentation", "research", "analysis"] },
      { slug: "financial-and-investment-analysts", areas: ["research", "analysis", "data reporting"] },
      { slug: "human-resources-managers", areas: ["coordination", "communication", "documentation"] },
      { slug: "project-management-specialists", areas: ["coordination", "communication", "documentation"] },
      { slug: "accountants-and-auditors", areas: ["documentation", "compliance", "data reporting"] },
    ]
    const todayIndex = new Date().getDay() % examples.length
    const pick = examples[todayIndex]
    const matchedPop = popularOccupations.find((p) => p.slug === pick.slug)

    if (matchedPop) {
      featuredExample = { ...matchedPop, topAreas: pick.areas }
    } else {
      // Fetch separately if not in popular list
      const occs = await db
        .select({
          id: occupations.id,
          title: occupations.title,
          slug: occupations.slug,
          major_category: occupations.majorCategory,
        })
        .from(occupations)
        .where(eq(occupations.slug, pick.slug))
        .limit(1)

      if (occs.length > 0) {
        const occ = occs[0]
        const profiles = await db
          .select({
            id: occupationAutomationProfile.id,
            occupation_id: occupationAutomationProfile.occupationId,
            composite_score: occupationAutomationProfile.compositeScore,
            work_activity_automation_potential: occupationAutomationProfile.workActivityAutomationPotential,
            time_range_low: occupationAutomationProfile.timeRangeLow,
            time_range_high: occupationAutomationProfile.timeRangeHigh,
            time_range_by_block: occupationAutomationProfile.timeRangeByBlock,
            block_example_tasks: occupationAutomationProfile.blockExampleTasks,
            top_automatable_activities: occupationAutomationProfile.topAutomatableActivities,
            top_blocking_abilities: occupationAutomationProfile.topBlockingAbilities,
            physical_ability_avg: occupationAutomationProfile.physicalAbilityAvg,
          })
          .from(occupationAutomationProfile)
          .where(eq(occupationAutomationProfile.occupationId, occ.id))
          .limit(1)

        const tsk = await db
          .select({
            id: jobMicroTasks.id,
            occupation_id: jobMicroTasks.occupationId,
            task_name: jobMicroTasks.taskName,
            task_description: jobMicroTasks.taskDescription,
            frequency: jobMicroTasks.frequency,
            ai_applicable: jobMicroTasks.aiApplicable,
            ai_how_it_helps: jobMicroTasks.aiHowItHelps,
            ai_impact_level: jobMicroTasks.aiImpactLevel,
            ai_effort_to_implement: jobMicroTasks.aiEffortToImplement,
            ai_category: jobMicroTasks.aiCategory,
            ai_tools: jobMicroTasks.aiTools,
          })
          .from(jobMicroTasks)
          .where(eq(jobMicroTasks.occupationId, occ.id))

        const prof = profiles.length > 0 ? (profiles[0] as unknown as AutomationProfile) : null
        const { displayedMinutes } = computeDisplayedTimeback(prof, (tsk ?? []) as unknown as MicroTask[])
        featuredExample = { title: occ.title, slug: occ.slug, minutes: displayedMinutes, topAreas: pick.areas }
      }
    }
  } catch (err) {
    console.error("[HomePage] fetch error:", err)
    // silently fall back
  }

  const avgMinutes = popularOccupations.length
    ? Math.round(
        popularOccupations.reduce((sum, o) => sum + o.minutes, 0) /
          popularOccupations.length
      )
    : FALLBACK_AVG_MINUTES
  const stats = buildStats(avgMinutes)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <FadeIn delay={0}>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border mb-6">
            Grounded in BLS &amp; O*NET task data
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Your team is losing an hour a day to work AI can already do.
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Timeback maps 800+ occupations task by task to show exactly where.
            See the numbers for your roles in under a minute — and if they hold up, we build the system that gets that time back.
          </p>
        </FadeIn>

        {/* Concrete example — rotates daily */}
        {featuredExample && (
          <FadeIn delay={0.25}>
            <Link
              href={`/occupation/${featuredExample.slug}`}
              className="mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm hover:border-ring/40 hover:shadow-md transition-all group"
            >
              <span className="font-medium text-foreground group-hover:text-foreground/80">
                {featuredExample.title}
              </span>
              <span className="font-semibold text-accent">
                Reclaim {featuredExample.minutes} minutes daily
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                in {featuredExample.topAreas.join(", ")}
              </span>
            </Link>
          </FadeIn>
        )}

        <FadeIn delay={0.3} className="mt-8">
          <LandingSearch />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-3">
            <Link
              href="/demo/try"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Describe a task — watch an agent handle it live →
            </Link>
            <Link
              href="/build-a-team"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Or build a whole team →
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Popular Occupations */}
      <section className="container mx-auto px-4 pb-16">
        <FadeIn delay={0.1}>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Popular occupations</h2>
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularOccupations.map((occ) => (
            <StaggerItem key={occ.slug}>
              <Link
                href={`/occupation/${occ.slug}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-ring/40 transition-all group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                  {occ.title}
                </span>
                <span className="text-sm font-semibold text-accent ml-4 shrink-0">
                  Reclaim {occ.minutes} min/day
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Stats Row */}
      <section className="border-y border-border bg-card py-10">
        <div className="container mx-auto px-4">
          <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="flex flex-col items-center gap-2">
                  <stat.icon className="h-5 w-5 text-accent" />
                  <span className="font-heading text-4xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Derived from BLS &amp; O*NET task data.{" "}
            <Link href="/about" className="text-accent hover:underline">
              See methodology →
            </Link>
          </p>
        </div>
      </section>

      {/* Data credibility strip */}
      <section className="container mx-auto px-4 py-6">
        <FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wider">Built on</span>
            {DATA_SOURCES.map((src) => (
              <span key={src} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent" />
                {src}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── Demo teaser ─────────────────────────────────────── */}
      <section className="mt-12 mb-10">
        <Suspense fallback={<div className="h-64 rounded-2xl bg-muted/10 border border-border animate-pulse" />}>
          <DemoTeaser />
        </Suspense>
      </section>

      {/* Browse by Category */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn delay={0.05}>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Browse by category</h2>
        </FadeIn>

        <Stagger className="flex flex-wrap gap-2" staggerDelay={0.04}>
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.dbValue]
            return (
              <StaggerItem key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-card hover:bg-secondary hover:border-ring/40 transition-all text-foreground"
                >
                  {cat.label}
                  {count !== undefined && (
                    <span className="text-xs text-muted-foreground">({count})</span>
                  )}
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <FadeIn>
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ready to reclaim your time?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Explore a single role, or plan a whole team of AI assistants.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Browse all occupations
              </Link>
              <Link
                href="/build-a-team"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Plan my team
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  )
}
