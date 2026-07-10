import { computeDemoForSlug } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"
import { DemoFadeIn } from "@/components/demo/DemoFadeIn"
import { DemoHeroText } from "@/components/demo/DemoHeroText"

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
        <p className="eyebrow mb-1">
          AI Agent Suite Demo
        </p>
        <h2 className="font-heading text-xl font-semibold">
          See your agents in action
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Watch how each agent handles a real task in your {occupationTitle} workday.
        </p>
      </div>
      <DemoHeroText />
      <DemoFadeIn>
        <AgentSuiteDemo roles={[role]} occupationTitle={occupationTitle} />
      </DemoFadeIn>
    </section>
  )
}

export function OccupationDemoSectionSkeleton() {
  return (
    <section className="mt-16 pt-12 border-t border-border">
      {/* Header text */}
      <div className="mb-6 animate-pulse">
        <div className="h-3 w-28 bg-muted mb-2" />
        <div className="h-6 w-48 bg-muted mb-2" />
        <div className="h-4 w-64 bg-muted/60" />
      </div>

      {/* Demo shell — mirrors AgentSuiteDemo structure */}
      <div className="border border-border overflow-hidden bg-background">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <div className="h-3 w-40 bg-muted" />
          </div>
          <div className="h-2 w-32 bg-muted/60" />
        </div>

        {/* Body: timeline + expanded view */}
        <div className="flex min-h-[560px]">
          {/* Timeline column */}
          <div className="w-52 shrink-0 border-r border-border bg-muted/10 p-3 flex flex-col gap-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25 shrink-0" />
                <div className="flex-1">
                  <div className="h-2.5 bg-muted w-3/4 mb-1" />
                  <div className="h-2 bg-muted/50 w-1/2" />
                </div>
              </div>
            ))}
          </div>

          {/* Expanded view */}
          <div className="flex-1 p-5 flex flex-col gap-4 animate-pulse">
            {/* Agent name + narrative */}
            <div>
              <div className="h-3 w-16 bg-muted/60 mb-2" />
              <div className="h-6 w-32 bg-muted mb-2" />
              <div className="h-3 w-full bg-muted/50 mb-1" />
              <div className="h-3 w-4/5 bg-muted/50 mb-1" />
              <div className="h-3 w-2/3 bg-muted/50" />
            </div>
            {/* Loop diagram placeholder */}
            <div className="bg-terminal border border-terminal-foreground/15 h-40" />
            {/* Output panel */}
            <div className="border border-border h-24 bg-muted/10" />
            {/* Before/After */}
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-destructive/10 border border-destructive/20" />
              <div className="h-16 bg-success/10 border border-success/20" />
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="border-t border-border px-5 py-4 bg-muted/20 flex items-center justify-between animate-pulse">
          <div>
            <div className="h-3.5 w-40 bg-muted mb-1.5" />
            <div className="h-3 w-32 bg-muted/60" />
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-28 bg-muted" />
            <div className="h-8 w-36 bg-muted" />
          </div>
        </div>
      </div>
    </section>
  )
}
