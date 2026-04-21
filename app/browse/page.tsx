export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
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
    const supabase = createServerClient()
    const from = (page - 1) * PAGE_SIZE

    async function runQuery(selectShape: string) {
      let query = supabase
        .from("occupations")
        .select(selectShape, { count: "exact" })

      if (category) {
        query = query.eq("major_category", category)
      }

      query = query.order("title").range(from, from + PAGE_SIZE - 1)
      return query
    }

    const primary = await runQuery(
      "id, title, slug, major_category, occupation_automation_profile(composite_score,time_range_high)"
    )

    if (primary.error) {
      const fallback = await runQuery(
        "id, title, slug, major_category, occupation_automation_profile(composite_score)"
      )
      if (fallback.error) {
        let plainQuery = supabase
          .from("occupations")
          .select("id, title, slug, major_category", { count: "exact" })

        if (category) {
          plainQuery = plainQuery.eq("major_category", category)
        }

        plainQuery = plainQuery.order("title").range(from, from + PAGE_SIZE - 1)
        const plain = await plainQuery
        results = plain.data ?? []
        totalCount = plain.count ?? 0
      } else {
        results = fallback.data ?? []
        totalCount = fallback.count ?? 0
      }
    } else {
      results = primary.data ?? []
      totalCount = primary.count ?? 0
    }

    const occupationIds = results
      .map((occupation) => occupation.id)
      .filter((id): id is number => typeof id === "number")

    if (occupationIds.length > 0) {
      const { data: taskRows } = await supabase
        .from("job_micro_tasks")
        .select(
          "id, occupation_id, task_name, task_description, frequency, ai_applicable, ai_how_it_helps, ai_impact_level, ai_effort_to_implement, ai_category, ai_tools"
        )
        .in("occupation_id", occupationIds)

      tasksByOccupation = new Map<number, MicroTask[]>()
      for (const task of taskRows ?? []) {
        const existing = tasksByOccupation.get(task.occupation_id) ?? []
        existing.push(task)
        tasksByOccupation.set(task.occupation_id, existing)
      }
    }
  } catch {
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
