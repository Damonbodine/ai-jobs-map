import { describe, expect, it } from "vitest"
import { getCategoryBySlug, getCategorySlug } from "./categories"
import { filterSortPage } from "./browse"

// Labels from the live occupation catalog; these previously returned empty categories.
const catalogSamples = [
  ["life-physical-social-science", "Life Physical and Social Science"],
  ["education", "Educational Instruction and Library"],
  ["arts-media", "Arts Design Entertainment Sports and Media"],
  ["food-service", "Food Preparation and Serving"],
  ["installation-repair", "Installation Maintenance and Repair"],
] as const

describe("category links match the occupation catalog", () => {
  it.each(catalogSamples)("finds occupations in %s", (slug, major_category) => {
    const category = getCategoryBySlug(slug)!
    const occupation = { id: 1, title: "Example role", slug: "example-role", major_category, minutes: 60 }
    expect(filterSortPage([occupation], {
      sort: "title", category: category.dbValue, page: 1, pageSize: 24,
    }).rows).toEqual([occupation])
    expect(getCategorySlug(major_category)).toBe(slug)
  })
})
