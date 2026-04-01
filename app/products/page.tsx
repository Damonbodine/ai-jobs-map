import Link from "next/link"
import { Check, Cpu, Workflow, Layers, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"

interface ProductTier {
  name: string
  subtitle: string
  icon: React.ReactNode
  description: string
  benefits: string[]
  examples: string[]
  trustPoints: string[]
  engagement: string
  highlight: boolean
  ctaLabel: string
  ctaLink: string
}

const tiers: ProductTier[] = [
  {
    name: "Starter Assistant",
    subtitle: "Your first AI assistant",
    icon: <Cpu className="h-5 w-5" />,
    description:
      "One AI agent focused on your highest-impact task. Quick setup, immediate time savings. Perfect for trying AI in your workflow.",
    benefits: [
      "Single-task automation",
      "Pre-configured for your role",
      "Setup in under a week",
      "No technical skills needed",
    ],
    examples: [
      "Email drafting assistant for sales teams",
      "Report summarizer for analysts",
      "Document reviewer for legal professionals",
    ],
    trustPoints: [
      "Human review on all outputs",
      "Easy to pause or adjust",
      "Works with your existing tools",
    ],
    engagement: "One-time setup + monthly support",
    highlight: false,
    ctaLabel: "Get Started",
    ctaLink: "/factory?tier=starter",
  },
  {
    name: "Workflow Bundle",
    subtitle: "Connected AI team",
    icon: <Workflow className="h-5 w-5" />,
    description:
      "Multiple AI agents working together across your daily tasks. Agents hand off work to each other, automating entire workflows end-to-end.",
    benefits: [
      "3-5 coordinated agents",
      "Cross-task automation",
      "Custom tool integrations",
      "Priority support channel",
    ],
    examples: [
      "Intake → analysis → report pipeline for consultants",
      "Patient scheduling + documentation for clinics",
      "Lead scoring → outreach → follow-up for sales",
    ],
    trustPoints: [
      "Human checkpoints at key stages",
      "Escalation paths for edge cases",
      "Weekly performance reviews",
    ],
    engagement: "2-week build + ongoing optimization",
    highlight: true,
    ctaLabel: "Get Started",
    ctaLink: "/factory?tier=workflow",
  },
  {
    name: "Ops Layer",
    subtitle: "Complete AI operations",
    icon: <Layers className="h-5 w-5" />,
    description:
      "Complete AI operations layer for your team. Hub-and-spoke architecture with centralized orchestration, monitoring, and continuous improvement.",
    benefits: [
      "Unlimited agents",
      "Hub-and-spoke architecture",
      "Real-time monitoring dashboard",
      "Dedicated success manager",
    ],
    examples: [
      "Full back-office automation for accounting firms",
      "Department-wide workflow orchestration",
      "Enterprise knowledge management system",
    ],
    trustPoints: [
      "SOC 2 compliant infrastructure",
      "Custom SLAs and uptime guarantees",
      "Quarterly strategy reviews",
    ],
    engagement: "4-6 week implementation + dedicated team",
    highlight: false,
    ctaLabel: "Talk to Us",
    ctaLink: "/factory?tier=ops",
  },
]

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
      <FadeIn>
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 sm:mb-3">
            AI Systems for Your Role
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            From a single assistant to a full operations layer.
            Pick the level that matches your needs.
          </p>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-6" staggerDelay={0.12}>
        {tiers.map((tier) => (
          <StaggerItem
            key={tier.name}
            className={cn(
              "rounded-2xl border p-6 flex flex-col",
              tier.highlight
                ? "border-accent bg-accent/[0.03] shadow-lg shadow-accent/5"
                : "border-border bg-card"
            )}
          >
            {tier.highlight && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-3">
                Most Popular
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tier.highlight
                    ? "bg-accent text-white"
                    : "bg-secondary text-foreground"
                )}
              >
                {tier.icon}
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">{tier.name}</h2>
                <p className="text-xs text-muted-foreground">{tier.subtitle}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {tier.description}
            </p>

            <div className="space-y-2 mb-5">
              {tier.benefits.map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Examples
              </h4>
              <div className="space-y-1.5">
                {tier.examples.map((e) => (
                  <p key={e} className="text-xs text-muted-foreground leading-relaxed">
                    {e}
                  </p>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Trust &amp; Safety
              </h4>
              <div className="space-y-1.5">
                {tier.trustPoints.map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground mb-6 mt-auto">
              {tier.engagement}
            </div>

            <Link
              href={tier.ctaLink}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                tier.highlight
                  ? "bg-accent text-white hover:opacity-90"
                  : "bg-foreground text-background hover:opacity-90"
              )}
            >
              {tier.ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}
