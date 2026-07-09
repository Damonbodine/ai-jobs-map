// app/demo/page.tsx
import { Suspense } from "react"
import { db } from "@/lib/db/client"
import { occupations } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"
import { DemoTeaser } from "@/components/demo/DemoTeaser"
import { OccupationSearch } from "@/components/demo/OccupationSearch"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Agent Suite Demo",
  description: "See how AI agents transform a full workday for any job role.",
}

const FEATURED_SLUGS = [
  "registered-nurses",
  "general-and-operations-managers",
  "software-developers",
  "financial-analysts",
  "elementary-school-teachers",
  "accountants-and-auditors",
]

async function FeaturedRoles() {
  const roles = await db
    .select({
      slug: occupations.slug,
      title: occupations.title,
      major_category: occupations.majorCategory,
    })
    .from(occupations)
    .where(inArray(occupations.slug, FEATURED_SLUGS))

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
      {roles.map((role) => (
        <Link
          key={role.slug}
          href={`/demo/${role.slug}`}
          className="group bg-white border border-border rounded-xl px-4 py-3 text-left hover:border-accent/40 hover:shadow-sm transition-all"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            {role.major_category}
          </p>
          <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors leading-snug">
            {role.title}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default async function DemoPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero + Search */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">
          AI Agent Suite
        </p>
        <h1 className="text-4xl font-bold text-foreground font-heading mb-4">
          See your workday, transformed
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Search any job title. We&apos;ll show you exactly which agents handle which tasks — and how many hours they give back.
        </p>
        <OccupationSearch />
      </section>

      {/* Custom-task CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-10">
        <Link
          href="/demo/try"
          className="group block rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-white px-5 py-4 text-center hover:border-accent/50 hover:shadow-sm transition-all"
        >
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">
            ✨ New — live custom demo
          </p>
          <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
            Don&apos;t see your role? Describe your task and we&apos;ll build the demo live →
          </p>
        </Link>
      </section>

      {/* Featured roles */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-5">
          Featured roles
        </p>
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          <FeaturedRoles />
        </Suspense>
      </section>

      {/* Existing scripted demo */}
      <section className="border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-2">
            Full walkthrough
          </p>
          <h2 className="text-2xl font-bold text-foreground font-heading text-center mb-10">
            Watch the agents in action
          </h2>
          <DemoTeaser />
        </div>
      </section>
    </main>
  )
}
