export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { db } from "@/lib/db/client"
import { occupations, occupationAutomationProfile, jobMicroTasks } from "@/lib/db/schema"
import { eq, inArray, sql } from "drizzle-orm"
import { CATEGORIES } from "@/lib/categories"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { BrowseFilters } from "./filters"
import { computeDisplayedTimeback } from "@/lib/timeback"
import { generateBlueprint } from "@/lib/blueprint"
import type { AutomationProfile, MicroTask, Occupation } from "@/types"

const PAGE_SIZE = 24

export default async function BrowsePage(props: {
  searchParams: Promise<{ page?: string; sort?: string; category?: string }>
}) {
  const searchParams = await props.searchParams

  const page = Math.max(1, parseInt(searchParams.page || "1"))
  const sort = searchParams.sort || "title"
  const categorySlug = searchParams.category || null
  const category = categorySlug
    ? CATEGORIES.find((c) => c.slug === categorySlug)?.dbValue ?? null
    : null

  let results: any[] = []
  let totalCount = 0
  let tasksByOccupation = new Map<number, MicroTask[]>()

  try {
    const from = (page - 1) * PAGE_SIZE

    // Count query
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(occupations)

    const countResult = category
      ? await countQuery.where(eq(occupations.majorCategory, category))
      : await countQuery

    totalCount = Number(countResult[0]?.count || 0)

    // Results query
    let queryResults = db
      .select({
        id: occupations.id,
        title: occupations.title,
        slug: occupations.slug,
        major_category: occupations.majorCategory,
        occupation_automation_profile: {
          composite_score: occupationAutomationProfile.compositeScore,
          time_range_high: occupationAutomationProfile.timeRangeHigh,
        }
      })
      .from(occupations)
      .leftJoin(
        occupationAutomationProfile,
        eq(occupations.id, occupationAutomationProfile.occupationId)
      )

    const finalQuery = category
      ? queryResults.where(eq(occupations.majorCategory, category))
      : queryResults

    results = await finalQuery
      .orderBy(occupations.title)
      .limit(PAGE_SIZE)
      .offset(from)

    const occupationIds = results
      .map((occupation) => occupation.id)
      .filter((id): id is number => typeof id === "number")

    if (occupationIds.length > 0) {
      const taskRows = await db
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
        .where(inArray(jobMicroTasks.occupationId, occupationIds))

      tasksByOccupation = new Map<number, MicroTask[]>()
      for (const task of (taskRows ?? []) as unknown as MicroTask[]) {
        const existing = tasksByOccupation.get(task.occupation_id) ?? []
        existing.push(task)
        tasksByOccupation.set(task.occupation_id, existing)
      }
    }
  } catch (err) {
    console.error("[BrowsePage] fetch error:", err)
    // silently fall back to empty results if DB unavailable
  }

  const browseEstimates = new Map<number, number>()
  for (const occupation of results) {
    const profileRaw = occupation.occupation_automation_profile
    const profile = (Array.isArray(profileRaw)
      ? profileRaw[0]
      : profileRaw) as AutomationProfile | null
    const tasks = tasksByOccupation.get(occupation.id) ?? []
    const blueprint = generateBlueprint(occupation as Occupation, tasks, profile)
    const { displayedMinutes } = computeDisplayedTimeback(
      profile,
      tasks,
      blueprint.totalMinutesSaved
    )

    browseEstimates.set(
      occupation.id,
      displayedMinutes || Math.round(profile?.time_range_high ?? profile?.composite_score ?? 0)
    )
  }

  // Client-side sort by time saved when requested
  if (sort === "time_back") {
    results = [...results].sort((a, b) => {
      return (browseEstimates.get(b.id) ?? 0) - (browseEstimates.get(a.id) ?? 0)
    })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function buildHref(updates: Record<string, string | null>) {
    const params = new URLSearchParams()
    if (page !== 1) params.set("page", String(page))
    if (sort !== "title") params.set("sort", sort)
    if (categorySlug) params.set("category", categorySlug)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    return `/browse${qs ? `?${qs}` : ""}`
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <FadeIn>
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Browse Occupations</h1>
          <p className="text-muted-foreground">
            Explore AI time-savings potential across all occupations.
          </p>
        </div>
      </FadeIn>

      {/* Filters — client component */}
      <BrowseFilters currentCategory={categorySlug} currentSort={sort} />

      {/* Results count */}
      {totalCount > 0 && (
        <p className="text-xs text-muted-foreground mb-4">
          {totalCount.toLocaleString()} occupation{totalCount !== 1 ? "s" : ""}
          {categorySlug
            ? ` in ${CATEGORIES.find((c) => c.slug === categorySlug)?.label ?? categorySlug}`
            : ""}
        </p>
      )}

      {/* Grid */}
      {results.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No occupations found.
        </div>
      ) : (
        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          staggerDelay={0.04}
        >
          {results.map((occ) => {
            const upperBoundMinutes = browseEstimates.get(occ.id) ?? null

            return (
              <StaggerItem key={occ.id}>
                <Link
                  href={`/occupation/${occ.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-ring/40 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      title={occ.title}
                      className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-foreground/80 transition-colors"
                    >
                      {occ.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {occ.major_category}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    {upperBoundMinutes !== null && (
                      <div className="text-right">
                        <div className="font-heading text-lg font-bold text-[hsl(var(--accent))]">
                          {upperBoundMinutes}
                        </div>
                        <div className="text-[10px] text-muted-foreground">min/day</div>
                      </div>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Link
            href={buildHref({ page: String(page - 1) })}
            aria-disabled={page <= 1}
            className={
              page <= 1
                ? "pointer-events-none p-2 rounded-lg border border-border opacity-40"
                : "p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildHref({ page: String(page + 1) })}
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages
                ? "pointer-events-none p-2 rounded-lg border border-border opacity-40"
                : "p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </main>
  )
}
