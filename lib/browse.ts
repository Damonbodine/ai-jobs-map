export type BrowseOccupation = {
  id: number
  title: string
  slug: string
  major_category: string
  minutes: number | null
}

export type BrowseQuery = {
  sort: string
  category: string | null
  page: number
  pageSize: number
}

// Filter, sort, and paginate the full occupation list — in that order.
// Sorting must happen across the whole (filtered) list, never within a page.
export function filterSortPage(
  list: BrowseOccupation[],
  { sort, category, page, pageSize }: BrowseQuery
): { rows: BrowseOccupation[]; totalCount: number } {
  const filtered = category
    ? list.filter((o) => o.major_category === category)
    : list

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "time_back") {
      const diff = (b.minutes ?? -1) - (a.minutes ?? -1)
      if (diff !== 0) return diff
    }
    return a.title.localeCompare(b.title)
  })

  const from = (page - 1) * pageSize
  return { rows: sorted.slice(from, from + pageSize), totalCount: filtered.length }
}
