export const dynamic = "force-dynamic"

import Link from "next/link"
import { unstable_cache } from "next/cache"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { db } from "@/lib/db/client"
import { occupations, occupationAutomationProfile, jobMicroTasks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { CATEGORIES } from "@/lib/categories"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { BrowseFilters } from "./filters"
import { computeDisplayedTimeback } from "@/lib/timeback"
import { filterSortPage, type BrowseOccupation } from "@/lib/browse"
import type { AutomationProfile, MicroTask } from "@/types"

const PAGE_SIZE = 24

// Canonical estimates for every occupation, refreshed hourly. Sorting by
// time back must rank the WHOLE catalog before paginating — sorting a single
// alphabetical page (the old behavior) produced a factually wrong "top"
// list. One cached pass over all occupations also replaces the per-request
// blueprint + timeback computation for the 24 visible cards.
const getBrowseList = unstable_cache(
  async (): Promise<BrowseOccupation[]> => {
    const [occs, profiles, taskRows] = await Promise.all([
      db
        .select({
          id: occupations.id,
          title: occupations.title,
          slug: occupations.slug,
          major_category: occupations.majorCategory,
        })
        .from(occupations),
      db
        .select({
          occupation_id: occupationAutomationProfile.occupationId,
          composite_score: occupationAutomationProfile.compositeScore,
          time_range_low: occupationAutomationProfile.timeRangeLow,
          time_range_high: occupationAutomationProfile.timeRangeHigh,
          physical_ability_avg: occupationAutomationProfile.physicalAbilityAvg,
        })
        .from(occupationAutomationProfile),
      db
        .select({
          occupation_id: jobMicroTasks.occupationId,
          frequency: jobMicroTasks.frequency,
          ai_applicable: jobMicroTasks.aiApplicable,
          ai_impact_level: jobMicroTasks.aiImpactLevel,
          ai_effort_to_implement: jobMicroTasks.aiEffortToImplement,
        })
        .from(jobMicroTasks)
        .where(eq(jobMicroTasks.aiApplicable, true)),
    ])

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.occupation_id, p as unknown as AutomationProfile])
    )
    const tasksByOccupation = new Map<number, MicroTask[]>()
    for (const t of (taskRows ?? []) as unknown as MicroTask[]) {
      const existing = tasksByOccupation.get(t.occupation_id) ?? []
      existing.push(t)
      tasksByOccupation.set(t.occupation_id, existing)
    }

    return (occs ?? []).map((occ) => {
      const { displayedMinutes } = computeDisplayedTimeback(
        profileMap.get(occ.id) ?? null,
        tasksByOccupation.get(occ.id) ?? []
      )
      return {
        ...occ,
        // Occupations with no estimate show no number (composite_score is a
        // unitless index, never a minutes fallback).
        minutes: displayedMinutes > 0 ? displayedMinutes : null,
      }
    })
  },
  ["browse-occupation-estimates"],
  { revalidate: 3600 }
)

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

  // A DB failure here throws to error.tsx — an outage must never render as
  // "No occupations found".
  const list = await getBrowseList()
  const { rows: results, totalCount } = filterSortPage(list, {
    sort,
    category,
    page,
    pageSize: PAGE_SIZE,
  })

  const browseEstimates = new Map<number, number>()
  for (const occupation of results) {
    if (occupation.minutes !== null) {
      browseEstimates.set(occupation.id, occupation.minutes)
    }
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
            const estimatedMinutes = browseEstimates.get(occ.id) ?? null

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
                    {estimatedMinutes !== null && (
                      <div className="text-right">
                        <div className="font-heading text-lg font-bold text-accent">
                          {estimatedMinutes}
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
