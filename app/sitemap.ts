import type { MetadataRoute } from "next"
import { db } from "@/lib/db/client"
import { occupations } from "@/lib/db/schema"
import { CATEGORIES } from "@/lib/categories"
import { SITE } from "@/lib/site"

const STATIC_PATHS = [
  "",
  "/about",
  "/browse",
  "/build-a-team",
  "/contact",
  "/demo",
  "/principles",
  "/privacy",
  "/products",
  "/security",
  "/terms",
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE.url}${path}`,
  }))

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE.url}/category/${category.slug}`,
  }))

  try {
    const rows = await db
      .select({ slug: occupations.slug })
      .from(occupations)
      .orderBy(occupations.slug)

    const occupationPages: MetadataRoute.Sitemap = rows.map(({ slug }) => ({
      url: `${SITE.url}/occupation/${slug}`,
    }))

    return [...staticPages, ...categoryPages, ...occupationPages]
  } catch (error) {
    console.error("[sitemap] occupation fetch failed", error)
    return [...staticPages, ...categoryPages]
  }
}
