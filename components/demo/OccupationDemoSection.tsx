import { computeDemoForSlug } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"

type Props = {
  slug: string
  occupationTitle: string
}

export async function OccupationDemoSection({ slug, occupationTitle }: Props) {
  const role = await computeDemoForSlug(slug)
  if (!role) return null

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          AI Agent Suite Demo
        </p>
        <h2 className="font-heading text-xl font-semibold">
          See your agents in action
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Watch how each agent handles a real task in your {occupationTitle} workday.
        </p>
      </div>
      <AgentSuiteDemo roles={[role]} />
    </section>
  )
}

export function OccupationDemoSectionSkeleton() {
  return (
    <section className="mt-16 pt-12 border-t border-border animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-28 bg-muted rounded mb-2" />
        <div className="h-6 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted/60 rounded" />
      </div>
      <div className="bg-muted/30 rounded-xl h-[480px]" />
    </section>
  )
}
