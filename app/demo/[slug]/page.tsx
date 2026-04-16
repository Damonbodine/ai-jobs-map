// app/demo/[slug]/page.tsx
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
      </div>
    </main>
  )
}
