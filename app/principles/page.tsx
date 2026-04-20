import Link from "next/link"
import { Users, ShieldCheck, Gauge, Sparkles, ArrowRight } from "lucide-react"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: "Principles",
  description: `How ${AGENCY.name} thinks about time reclaimed, human oversight, and the limits of our numbers on ${SITE.name}.`,
}

const PRINCIPLES = [
  {
    icon: Users,
    title: "Time reclaimed ≠ jobs eliminated.",
    body: "What we model is task-level time — the documentation, coordination, and research work that sits inside a role. Our clients use the reclaimed capacity for the backlog they've never had time for, higher-judgment work, or customers they couldn't serve before. If your goal is reducing headcount, we're not the right partner.",
  },
  {
    icon: ShieldCheck,
    title: "Humans stay in the loop.",
    body: "Every blueprint we build has explicit checkpoints where a person approves, edits, or rejects the AI's output. We name these in the blueprint and they aren't optional. Agents draft; people decide.",
  },
  {
    icon: Gauge,
    title: "Estimates are ranges, not promises.",
    body: "The minutes and dollars on this site are median estimates derived from O*NET task descriptions. Real time-back depends on your workflows, your tools, and your team's adoption speed. We refine every number during the scoping engagement before anything gets committed to a statement of work.",
  },
  {
    icon: Sparkles,
    title: "Judgment, creativity, and care don't automate.",
    body: "We score tasks that require physical presence, creative judgment, empathy, or high-stakes accountability lower on purpose. The highest-impact agents we build free people up for exactly that kind of work — they don't try to replace it.",
  },
]

export default function PrinciplesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Principles
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          What AI should and shouldn&apos;t do — how we think about it.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          {SITE.name} shows time-back estimates for 800+ occupations. Numbers
          out of context can read the wrong way, so this page is the stance
          behind them — written by {AGENCY.name}, the team that builds the
          systems.
        </p>
      </FadeIn>

      <Stagger className="space-y-8 mb-12" staggerDelay={0.1}>
        {PRINCIPLES.map(({ icon: Icon, title, body }) => (
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

      <FadeIn delay={0.4}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <h2 className="font-heading text-xl font-semibold mb-3">
            If something reads the wrong way, tell us.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We wrote the copy on this site, and we update it when it stops
            matching how we work. If a number, a label, or a page reads
            differently than we intended — especially if it lands badly on
            someone in the occupation being described — we want to hear it.
          </p>
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            {CONTACT.email}
          </a>
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            How we work
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Book a scoping call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
