export const dynamic = "force-dynamic"

import Link from "next/link"
import { Clock, Cpu, Users } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { CATEGORIES } from "@/lib/categories"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { LandingSearch } from "@/app/landing-search"

const POPULAR_OCCUPATIONS = [
  { title: "Software Developer", slug: "software-developers", minutes: 52 },
  { title: "Registered Nurse", slug: "registered-nurses", minutes: 28 },
  { title: "Financial Manager", slug: "financial-managers", minutes: 47 },
  { title: "Marketing Manager", slug: "marketing-managers", minutes: 61 },
  { title: "Accountant", slug: "accountants-and-auditors", minutes: 42 },
  { title: "Project Manager", slug: "project-management-specialists", minutes: 55 },
  { title: "Human Resources Manager", slug: "human-resources-managers", minutes: 58 },
  { title: "Graphic Designer", slug: "graphic-designers", minutes: 44 },
  { title: "Dental Hygienist", slug: "dental-hygienists", minutes: 31 },
  { title: "Civil Engineer", slug: "civil-engineers", minutes: 39 },
]

const STATS = [
  { icon: Clock, value: "58", label: "Avg min saved / day" },
  { icon: Cpu, value: "12K+", label: "Tasks mapped" },
  { icon: Users, value: "847", label: "Occupations" },
]

const DATA_SOURCES = [
  "Bureau of Labor Statistics",
  "O*NET",
  "12,000+ tasks analyzed",
  "35 named capabilities",
]

export default async function HomePage() {
  let categoryCounts: Record<string, number> = {}
  let featuredExample: { title: string; slug: string; minutes: number; topAreas: string[] } | null = null

  try {
    const supabase = createServerClient()

    // Fetch category counts
    const { data } = await supabase.from("occupations").select("major_category")
    for (const row of data ?? []) {
      categoryCounts[row.major_category] = (categoryCounts[row.major_category] || 0) + 1
    }

    // Pick a rotating featured example based on the day of the week
    const examples = [
      { slug: "registered-nurses", areas: ["documentation", "coordination", "analysis"] },
      { slug: "construction-managers", areas: ["communication", "compliance", "documentation"] },
      { slug: "software-developers", areas: ["documentation", "research", "analysis"] },
      { slug: "financial-and-investment-analysts", areas: ["research", "analysis", "data reporting"] },
      { slug: "human-resources-managers", areas: ["coordination", "communication", "documentation"] },
      { slug: "project-management-specialists", areas: ["coordination", "communication", "documentation"] },
      { slug: "accountants-and-auditors", areas: ["documentation", "compliance", "data reporting"] },
    ]
    const todayIndex = new Date().getDay() % examples.length
    const pick = examples[todayIndex]

    const { data: occ } = await supabase
      .from("occupations")
      .select("title, slug")
      .eq("slug", pick.slug)
      .single()

    if (occ) {
      const matched = POPULAR_OCCUPATIONS.find((p) => p.slug === pick.slug)
      featuredExample = {
        title: occ.title,
        slug: occ.slug,
        minutes: matched?.minutes ?? 50,
        topAreas: pick.areas,
      }
    }
  } catch {
    // silently fall back
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <FadeIn delay={0}>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border mb-6">
            800+ Occupations Analyzed
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            How much time could AI give you back?
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Explore AI-assisted time savings across 800+ occupations — grounded in O*NET task data.
          </p>
        </FadeIn>

        {/* Concrete example — rotates daily */}
        {featuredExample && (
          <FadeIn delay={0.25}>
            <Link
              href={`/occupation/${featuredExample.slug}`}
              className="mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm hover:border-ring/40 hover:shadow-md transition-all group"
            >
              <span className="font-medium text-foreground group-hover:text-foreground/80">
                {featuredExample.title}
              </span>
              <span className="font-semibold text-[hsl(var(--accent))]">
                Save {featuredExample.minutes} min/day
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                in {featuredExample.topAreas.join(", ")}
              </span>
            </Link>
          </FadeIn>
        )}

        <FadeIn delay={0.3} className="mt-8">
          <LandingSearch />
        </FadeIn>
      </section>

      {/* Popular Occupations */}
      <section className="container mx-auto px-4 pb-16">
        <FadeIn delay={0.1}>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Popular occupations</h2>
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {POPULAR_OCCUPATIONS.map((occ) => (
            <StaggerItem key={occ.slug}>
              <Link
                href={`/occupation/${occ.slug}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-ring/40 transition-all group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                  {occ.title}
                </span>
                <span className="text-sm font-semibold text-[hsl(var(--accent))] ml-4 shrink-0">
                  Save {occ.minutes} min/day
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Stats Row */}
      <section className="border-y border-border bg-card py-10">
        <div className="container mx-auto px-4">
          <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="flex flex-col items-center gap-2">
                  <stat.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  <span className="font-heading text-4xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Data credibility strip */}
      <section className="container mx-auto px-4 py-6">
        <FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wider">Built on</span>
            {DATA_SOURCES.map((src) => (
              <span key={src} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent" />
                {src}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Browse by Category */}
      <section className="container mx-auto px-4 py-16">
        <FadeIn delay={0.05}>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Browse by category</h2>
        </FadeIn>

        <Stagger className="flex flex-wrap gap-2" staggerDelay={0.04}>
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.dbValue]
            return (
              <StaggerItem key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-card hover:bg-secondary hover:border-ring/40 transition-all text-foreground"
                >
                  {cat.label}
                  {count !== undefined && (
                    <span className="text-xs text-muted-foreground">({count})</span>
                  )}
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <FadeIn>
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ready to reclaim your time?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start from a recommended assistant setup tailored to your role.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Browse All
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[hsl(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Build your personal assistant
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  )
}
