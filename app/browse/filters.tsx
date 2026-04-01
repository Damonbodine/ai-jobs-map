"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CATEGORIES } from "@/lib/categories"
import { cn } from "@/lib/utils"

interface BrowseFiltersProps {
  currentCategory: string | null
  currentSort: string
}

export function BrowseFilters({ currentCategory, currentSort }: BrowseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
        <button
          onClick={() => updateParams({ category: null, page: "1" })}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0",
            !currentCategory
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-secondary"
          )}
        >
          All
        </button>
        {CATEGORIES.slice(0, 10).map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              updateParams({
                category: currentCategory === cat.slug ? null : cat.slug,
                page: "1",
              })
            }
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0",
              currentCategory === cat.slug
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:bg-secondary"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <select
        value={currentSort}
        onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
        className="h-9 px-3 rounded-lg border border-input bg-card text-xs w-full sm:w-auto sm:self-end"
      >
        <option value="title">Sort: A-Z</option>
        <option value="time_back">Sort: Time Saved</option>
      </select>
    </div>
  )
}
