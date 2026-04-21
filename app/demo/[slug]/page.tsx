// app/demo/[slug]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { computeDemoForSlug } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const role = await computeDemoForSlug(slug)
  if (!role) return { title: "Demo | AI Jobs Map" }
  return {
    title: `${role.displayName} AI Demo | AI Jobs Map`,
    description: role.tagline,
  }
}

export default async function DemoSlugPage({ params }: Props) {
  const { slug } = await params
  const role = await computeDemoForSlug(slug)

  if (!role) notFound()

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-widest mb-1">
            AI Agent Suite Demo
          </p>
          <h1 className="text-3xl font-bold text-[#1a1a1a] font-display mb-2">
            {role.displayName}
          </h1>
          <p className="text-lg text-[#555]">{role.tagline}</p>
        </div>
        <AgentSuiteDemo roles={[role]} />

        <section className="mt-12 rounded-3xl border border-[#e8e4d9] bg-white p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-[#1a1a1a] font-display mb-2">
                Want this running for your team?
              </h2>
              <p className="text-[#555]">
                We build these agent suites custom — scoped in a single call, delivered in 1–4 weeks.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href={`/build-a-team?roles=${slug}:1`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[#e8e4d9] bg-white text-[#1a1a1a] text-sm font-semibold hover:bg-[#fafaf7] transition-colors whitespace-nowrap"
              >
                Add to my team
              </Link>
              <Link
                href={`/contact?source=demo-slug&role=${encodeURIComponent(role.displayName)}`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Book a scoping call
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
