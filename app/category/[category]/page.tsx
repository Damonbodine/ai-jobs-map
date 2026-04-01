import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"

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
    title: `${cat.label} Occupations — AI Jobs Map`,
    description: `Explore AI time-savings potential for ${cat.label} occupations.`,
  }
}

export default async function CategoryPage(props: {
  params: Promise<{ category: string }>
}) {
  const { category: categorySlug } = await props.params
  const cat = getCategoryBySlug(categorySlug)
  if (!cat) notFound()

  let occupations: any[] = []

  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from("occupations")
      .select(
        "id, title, slug, major_category, employment, occupation_automation_profile(time_range_low, time_range_high)"
      )
      .eq("major_category", cat.dbValue)
      .order("title")
    occupations = data ?? []
  } catch {
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
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible mb-6 sm:mb-8 scrollbar-hide">
        {otherCategories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors whitespace-nowrap flex-shrink-0"
          >
            {c.label}
          </Link>
        ))}
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
          {occupations.map((occ) => {
            const profileRaw = occ.occupation_automation_profile
            const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
            const minutes =
              profile
                ? Math.round((profile.time_range_low + profile.time_range_high) / 2)
                : null

            return (
              <StaggerItem key={occ.id}>
                <Link
                  href={`/occupation/${occ.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-ring/40 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate group-hover:text-foreground/80 transition-colors">
                      {occ.title}
                    </div>
                    {occ.employment && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {occ.employment.toLocaleString()} employed
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    {minutes !== null && (
                      <div className="text-right">
                        <div className="font-heading text-lg font-bold text-[hsl(var(--accent))]">
                          {minutes}
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
    </main>
  )
}
