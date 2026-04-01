import Link from "next/link"
import { Database, Brain, Target, Users } from "lucide-react"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"

export const metadata = {
  title: "About — AI Jobs Map",
  description:
    "Task-level AI analysis grounded in real occupational data from the BLS and O*NET.",
}

const INFO_SECTIONS = [
  {
    icon: Database,
    title: "Built on Real Data",
    body: "Our analysis starts with the Bureau of Labor Statistics occupation database (800+ occupations) and O*NET task data from the Department of Labor. Every time-back estimate is derived from actual task descriptions, not guesswork.",
  },
  {
    icon: Brain,
    title: "Task-Level Analysis",
    body: "Instead of broad predictions, we break each occupation into micro-tasks and score them individually for AI applicability, impact, and implementation effort.",
  },
  {
    icon: Target,
    title: "Actionable Blueprints",
    body: "For every occupation, we generate an agent blueprint — a concrete plan for which AI agents to deploy, what tools they need, and how they coordinate. Not theory: a system you can actually build.",
  },
  {
    icon: Users,
    title: "Human-Centered Approach",
    body: "AI should augment your work, not replace you. Our blueprints identify tasks where AI excels and where human judgment remains essential — including explicit checkpoints where people stay in the loop.",
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          About AI Jobs Map
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          We help professionals understand exactly how AI can save time in their
          specific role — not with vague predictions, but with task-level analysis
          grounded in real occupational data.
        </p>
      </FadeIn>

      <Stagger className="space-y-8 mb-12" staggerDelay={0.1}>
        {INFO_SECTIONS.map(({ icon: Icon, title, body }) => (
          <StaggerItem key={title}>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold mb-1">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.5}>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="font-heading text-xl font-semibold mb-3">Our Methodology</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Each occupation&apos;s automation profile combines multiple signals: O*NET
              task descriptions and their AI applicability scores, ability
              requirements (physical vs cognitive), knowledge domains, and
              work activity patterns.
            </p>
            <p>
              The composite score (0–100) reflects overall AI readiness. Time-back
              estimates are given as conservative-to-optimistic ranges, broken down
              by work block (intake, analysis, documentation, coordination, etc.).
            </p>
            <p>
              We classify occupations by archetype — desk/digital, mixed, or
              physical — with corresponding multipliers that account for the
              practical limits of AI in non-desk work.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.6}>
        <div className="mt-10 text-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Explore Occupations
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
