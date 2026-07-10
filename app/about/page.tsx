import Link from "next/link"
import { Database, Brain, Target, Users, ArrowRight } from "lucide-react"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { AGENCY, PROOF_POINTS, SITE } from "@/lib/site"

export const metadata = {
  title: "About",
  description: `${SITE.name} is built by ${AGENCY.name}. Task-level AI analysis grounded in real occupational data from the BLS and O*NET, delivered as concrete implementation plans.`,
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
    body: "AI should augment your work, not replace you. Our blueprints identify tasks where AI excels and where human judgment remains essential — including explicit checkpoints where people stay in the loop. Read our full principles for how we think about time reclaimed, human oversight, and the limits of our numbers.",
    link: { href: "/principles", label: "Our principles →" },
  },
]

export default function AboutPage() {
  const valise = PROOF_POINTS[0]

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <p className="eyebrow mb-3">
          A project by {AGENCY.name}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          We help teams build AI systems that actually ship.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-3">
          {SITE.name} is the research arm of {AGENCY.name} — a small studio that
          designs and implements custom AI systems for knowledge-work teams. We
          built this site because every engagement starts with the same
          question: <em>where, concretely, is the time?</em> Now you can answer
          that question for your role in under a minute, and — if the numbers
          make sense — talk to us about building the system.
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          See also:{" "}
          <Link href="/principles" className="text-accent hover:underline">
            our principles
          </Link>
          {" · "}
          <Link href="/security" className="text-accent hover:underline">
            security &amp; data handling
          </Link>
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 mb-12">
          <p className="eyebrow mb-2" style={{ color: "var(--color-accent)" }}>
            Recent work
          </p>
          <p className="font-heading text-lg font-semibold mb-1">
            {valise.client}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {valise.outcome}. We mapped their operations team&apos;s week, built a
            task-level blueprint like the ones on this site, then implemented
            the system end-to-end.
          </p>
        </div>
      </FadeIn>

      <Stagger className="space-y-8 mb-12" staggerDelay={0.1}>
        {INFO_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <StaggerItem key={section.title}>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.body}
                  </p>
                  {"link" in section && section.link && (
                    <Link
                      href={section.link.href}
                      className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                    >
                      {section.link.label}
                    </Link>
                  )}
                </div>
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>

      <FadeIn delay={0.5}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <div className="eyebrow mb-2">SEC 01 · Our Methodology</div>
          <h2 className="font-heading text-xl font-semibold mb-3">
            Our Methodology
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Each occupation&apos;s automation profile combines multiple signals:
              O*NET task descriptions and their AI applicability scores, ability
              requirements (physical vs cognitive), knowledge domains, and work
              activity patterns.
            </p>
            <p>
              The composite score (0–100) reflects overall AI readiness.
              Time-back estimates are given as conservative-to-optimistic
              ranges, broken down by work block (intake, analysis,
              documentation, coordination, etc.).
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
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <div className="eyebrow mb-2">SEC 02 · How we work</div>
          <h2 className="font-heading text-xl font-semibold mb-3">
            How we work
          </h2>
          <ol className="text-sm text-muted-foreground leading-relaxed space-y-3 list-decimal list-inside">
            <li>
              <strong className="text-foreground">Discover.</strong> We use
              this site (and a 45-min call) to map where your team&apos;s time
              actually goes.
            </li>
            <li>
              <strong className="text-foreground">Blueprint.</strong> You get a
              concrete implementation plan — tools, integrations, human
              checkpoints, and an honest ROI estimate. No fluff.
            </li>
            <li>
              <strong className="text-foreground">Build.</strong> We implement
              the system with your team. Weekly demos, real code, no vendor
              lock-in.
            </li>
            <li>
              <strong className="text-foreground">Support.</strong> Ongoing
              tuning, monitoring, and improvements once you&apos;re live.
            </li>
          </ol>
        </div>
      </FadeIn>

      <FadeIn delay={0.7}>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary"
          >
            Explore Occupations
          </Link>
          <a
            href={AGENCY.enquireUrl}
            className="inline-flex items-center justify-center gap-2 bg-cyan px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"
          >
            Start with an audit
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </FadeIn>
    </div>
  )
}
