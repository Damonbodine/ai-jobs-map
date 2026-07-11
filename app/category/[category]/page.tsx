export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { ArrowRight, ChevronRight } from "lucide-react"
import { db } from "@/lib/db/client"
import {
  occupations as occupationsTable,
  occupationAutomationProfile,
  jobMicroTasks,
} from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { computeDisplayedTimeback } from "@/lib/timeback"
import type { AutomationProfile, MicroTask, Occupation } from "@/types"
import { SITE } from "@/lib/site"

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}) {
  const { category: categorySlug } = await props.params
  const cat = getCategoryBySlug(categorySlug)
  if (!cat) return {}
  return {
    title: `${cat.label} Occupations`,
    description: `Explore AI time-savings potential for ${cat.label} occupations.`,
    alternates: {
      canonical: `${SITE.url}/category/${cat.slug}`,
    },
  }
}

type CategoryOccupation = {
  id: number
  title: string
  slug: string
  employment: number | null
  minutes: number | null
}

// Computing displayedMinutes needs every occupation's tasks + full profile —
// heavy for large categories (Production has 104), so cache per category.
const getCategoryOccupations = unstable_cache(
  async (dbValue: string): Promise<CategoryOccupation[]> => {
    const rows = await db
      .select({
        id: occupationsTable.id,
        title: occupationsTable.title,
        slug: occupationsTable.slug,
        major_category: occupationsTable.majorCategory,
        employment: occupationsTable.employment,
      })
      .from(occupationsTable)
      .where(eq(occupationsTable.majorCategory, dbValue))
      .orderBy(occupationsTable.title)

    const ids = rows.map((r) => r.id)
    if (ids.length === 0) return []

    const [profiles, taskRows] = await Promise.all([
      db
        .select({
          id: occupationAutomationProfile.id,
          occupation_id: occupationAutomationProfile.occupationId,
          composite_score: occupationAutomationProfile.compositeScore,
          work_activity_automation_potential:
            occupationAutomationProfile.workActivityAutomationPotential,
          time_range_low: occupationAutomationProfile.timeRangeLow,
          time_range_high: occupationAutomationProfile.timeRangeHigh,
          time_range_by_block: occupationAutomationProfile.timeRangeByBlock,
          block_example_tasks: occupationAutomationProfile.blockExampleTasks,
          top_automatable_activities:
            occupationAutomationProfile.topAutomatableActivities,
          top_blocking_abilities:
            occupationAutomationProfile.topBlockingAbilities,
          physical_ability_avg: occupationAutomationProfile.physicalAbilityAvg,
        })
        .from(occupationAutomationProfile)
        .where(inArray(occupationAutomationProfile.occupationId, ids)),
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
        .where(inArray(jobMicroTasks.occupationId, ids)),
    ])

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.occupation_id, p as unknown as AutomationProfile])
    )
    const taskMap = new Map<number, MicroTask[]>()
    for (const t of (taskRows ?? []) as unknown as MicroTask[]) {
      const existing = taskMap.get(t.occupation_id) ?? []
      existing.push(t)
      taskMap.set(t.occupation_id, existing)
    }

    return rows.map((occ) => {
      const profile = profileMap.get(occ.id) ?? null
      const tasks = taskMap.get(occ.id) ?? []
      const { displayedMinutes } = computeDisplayedTimeback(profile, tasks)
      return {
        id: occ.id,
        title: occ.title,
        slug: occ.slug,
        employment: occ.employment,
        minutes: displayedMinutes > 0 ? displayedMinutes : null,
      }
    })
  },
  ["category-occupation-minutes"],
  { revalidate: 3600 }
)

export default async function CategoryPage(props: {
  params: Promise<{ category: string }>
}) {
  const { category: categorySlug } = await props.params
  const cat = getCategoryBySlug(categorySlug)
  if (!cat) notFound()

  let occupations: CategoryOccupation[] = []

  try {
    occupations = await getCategoryOccupations(cat.dbValue)
  } catch (err) {
    console.error("[CategoryPage] fetch error:", err)
    // fall back to empty results if DB unavailable
  }

  const otherCategories = CATEGORIES.filter((c) => c.slug !== categorySlug).slice(0, 8)

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
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
        <span className="text-foreground">{cat.label}</span>
      </nav>

      {/* Heading */}
      <FadeIn>
        <h1 className="font-heading text-3xl font-bold mb-2">{cat.label}</h1>
        <p className="text-muted-foreground mb-8">
          {occupations.length} occupation{occupations.length !== 1 ? "s" : ""} in this category
        </p>
      </FadeIn>

      {/* Other category pills */}
      <div className="relative -mx-4 sm:mx-0 mb-6 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 px-4 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
          {otherCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="px-3 py-1.5 border border-border text-xs font-medium hover:bg-secondary transition-colors whitespace-nowrap flex-shrink-0"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background via-background/80 to-transparent sm:hidden"
        />
      </div>

      {/* Occupation grid */}
      {occupations.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No occupations found for this category.
        </div>
      ) : (
        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          staggerDelay={0.04}
        >
          {occupations.map((occ) => (
            <StaggerItem key={occ.id}>
              <Link
                href={`/occupation/${occ.slug}`}
                className="group flex items-center justify-between border border-border bg-card p-4 hover:border-foreground/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div
                    title={occ.title}
                    className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-foreground/80 transition-colors"
                  >
                    {occ.title}
                  </div>
                  {occ.employment && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {occ.employment.toLocaleString()} employed
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  {occ.minutes !== null && (
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold tabular-nums text-accent">
                        {occ.minutes}
                      </div>
                      <div className="text-[10px] text-muted-foreground">min/day</div>
                    </div>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </main>
  )
}
