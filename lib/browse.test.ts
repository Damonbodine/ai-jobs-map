import { describe, it, expect } from "vitest"
import { filterSortPage, type BrowseOccupation } from "./browse"

const list: BrowseOccupation[] = [
  { id: 1, title: "Accountants", slug: "accountants", major_category: "Business", minutes: 40 },
  { id: 2, title: "Zoologists", slug: "zoologists", major_category: "Science", minutes: 90 },
  { id: 3, title: "Bakers", slug: "bakers", major_category: "Food", minutes: null },
  { id: 4, title: "Nurses", slug: "nurses", major_category: "Healthcare", minutes: 75 },
  { id: 5, title: "Engineers", slug: "engineers", major_category: "Science", minutes: 60 },
]

describe("filterSortPage", () => {
  it("sorts by time back across the WHOLE list before paginating", () => {
    // Page 1 of size 2 must contain the two highest estimates overall,
    // not a re-sorted alphabetical page.
    const { rows, totalCount } = filterSortPage(list, {
      sort: "time_back",
      category: null,
      page: 1,
      pageSize: 2,
    })
    expect(totalCount).toBe(5)
    expect(rows.map((r) => r.slug)).toEqual(["zoologists", "nurses"])
  })

  it("puts occupations without an estimate last under time_back sort", () => {
    const { rows } = filterSortPage(list, {
      sort: "time_back",
      category: null,
      page: 3,
      pageSize: 2,
    })
    expect(rows.map((r) => r.slug)).toEqual(["bakers"])
  })

  it("sorts by title by default and paginates", () => {
    const page2 = filterSortPage(list, { sort: "title", category: null, page: 2, pageSize: 2 })
    expect(page2.rows.map((r) => r.title)).toEqual(["Engineers", "Nurses"])
  })

  it("filters by category before counting and paginating", () => {
    const { rows, totalCount } = filterSortPage(list, {
      sort: "time_back",
      category: "Science",
      page: 1,
      pageSize: 24,
    })
    expect(totalCount).toBe(2)
    expect(rows.map((r) => r.slug)).toEqual(["zoologists", "engineers"])
  })

  it("returns an empty page beyond the end", () => {
    const { rows } = filterSortPage(list, { sort: "title", category: null, page: 9, pageSize: 24 })
    expect(rows).toEqual([])
  })
})
