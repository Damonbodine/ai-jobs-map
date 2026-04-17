// app/demo/page.tsx
import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { DemoTeaser } from "@/components/demo/DemoTeaser"
import { OccupationSearch } from "@/components/demo/OccupationSearch"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Agent Suite Demo | AI Jobs Map",
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
  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("slug, title, major_category")
    .in("slug", FEATURED_SLUGS)

  const roles = data ?? []

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
      {roles.map((role) => (
        <Link
          key={role.slug}
          href={`/demo/${role.slug}`}
          className="group bg-white border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-cyan-300 hover:shadow-sm transition-all"
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {role.major_category}
          </p>
          <p className="text-sm font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors leading-snug">
            {role.title}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default async function DemoPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7]">
      {/* Hero + Search */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <p className="text-sm font-semibold text-cyan-600 uppercase tracking-widest mb-3">
          AI Agent Suite
        </p>
        <h1 className="text-4xl font-bold text-[#1a1a1a] font-display mb-4">
          See your workday, transformed
        </h1>
        <p className="text-lg text-[#555] mb-8">
          Search any job title. We&apos;ll show you exactly which agents handle which tasks — and how many hours they give back.
        </p>
        <OccupationSearch />
      </section>

      {/* Custom-task CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-10">
        <Link
          href="/demo/try"
          className="group block rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white px-5 py-4 text-center hover:border-cyan-400 hover:shadow-sm transition-all"
        >
          <p className="text-xs font-semibold text-cyan-700 uppercase tracking-widest mb-1">
            ✨ New — live custom demo
          </p>
          <p className="text-sm font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors">
            Don&apos;t see your role? Describe your task and we&apos;ll build the demo live →
          </p>
        </Link>
      </section>

      {/* Featured roles */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-5">
          Featured roles
        </p>
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          <FeaturedRoles />
        </Suspense>
      </section>

      {/* Existing scripted demo */}
      <section className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
            Full walkthrough
          </p>
          <h2 className="text-2xl font-bold text-[#1a1a1a] font-display text-center mb-10">
            Watch the agents in action
          </h2>
          <DemoTeaser />
        </div>
      </section>
    </main>
  )
}
