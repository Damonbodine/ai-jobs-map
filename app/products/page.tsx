import Link from "next/link"
import {
  ArrowRight, Check, Search, ChevronRight,
  Cpu, Workflow, Layers, Shield, Clock, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { MODULE_LIST } from "@/lib/modules"
import { getAllCapabilities } from "@/lib/capabilities"
import type { ModuleCapability } from "@/types"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const capabilitiesByModule = await getAllCapabilities()

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <FadeIn>
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
            Personal AI assistants built for your role
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            We build custom support systems from a library of proven assistant modules.
            Each system is shaped around the work you actually do — not a generic product.
          </p>
        </div>
      </FadeIn>

      {/* ── Section 1: Support Systems ────────────────────────── */}
      <FadeIn delay={0.1}>
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What we build
            </h2>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2">
            Support modules that handle your routine work
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Every assistant system is assembled from these modules. Each module contains
            specific capabilities — named agents that handle defined categories of work.
          </p>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14" staggerDelay={0.06}>
        {MODULE_LIST.map((mod) => {
          const caps = capabilitiesByModule[mod.key] ?? []
          const Icon = mod.icon
          return (
            <StaggerItem key={mod.key}>
              <div className={cn(
                "rounded-xl border p-4 h-full",
                mod.color
              )}>
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <h4 className="text-sm font-semibold">{mod.label}</h4>
                </div>
                <p className="text-xs opacity-80 mb-3">{mod.description}</p>
                {caps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {caps.map((cap: ModuleCapability) => (
                      <span
                        key={cap.capability_key}
                        className="text-[10px] font-medium bg-white/60 dark:bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full"
                        title={cap.description}
                      >
                        {cap.capability_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>

      {/* ── Section 2: Engagement Tiers ───────────────────────── */}
      <FadeIn delay={0.15}>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How it scales
            </h2>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2">
            Three ways to start
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Your recommended tier depends on how many support areas your role needs.
            The app figures this out from your occupation data.
          </p>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14" staggerDelay={0.1}>
        <StaggerItem>
          <div className="rounded-xl border border-border bg-card p-5 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Starter Assistant</h4>
                <p className="text-[11px] text-muted-foreground">1 support area</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              One focused agent on your highest-impact work area. Setup in under a week.
            </p>
            <div className="space-y-1.5 mb-4">
              {["Single-task automation", "Pre-configured for your role", "Human review on all outputs"].map((b) => (
                <div key={b} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-accent flex-shrink-0" />
                  <span className="text-xs">{b}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-auto">One-time setup + monthly support</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-accent bg-accent/[0.03] shadow-lg shadow-accent/5 p-5 h-full flex flex-col">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-2">Most common</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center">
                <Workflow className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Workflow Bundle</h4>
                <p className="text-[11px] text-muted-foreground">2–5 support areas</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Multiple agents coordinating across your daily work. Agents hand off work to each other.
            </p>
            <div className="space-y-1.5 mb-4">
              {["3–5 coordinated agents", "Cross-task automation", "Human checkpoints at key stages", "Priority support"].map((b) => (
                <div key={b} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-accent flex-shrink-0" />
                  <span className="text-xs">{b}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-auto">2-week build + ongoing optimization</div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-xl border border-border bg-card p-5 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Ops Layer</h4>
                <p className="text-[11px] text-muted-foreground">5+ support areas</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Full operations layer with hub-and-spoke architecture, monitoring, and continuous improvement.
            </p>
            <div className="space-y-1.5 mb-4">
              {["Unlimited agents", "Hub-and-spoke orchestration", "Real-time monitoring", "Dedicated success manager"].map((b) => (
                <div key={b} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-accent flex-shrink-0" />
                  <span className="text-xs">{b}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-auto">4–6 week implementation + dedicated team</div>
          </div>
        </StaggerItem>
      </Stagger>

      {/* ── Section 3: How It Works ───────────────────────────── */}
      <FadeIn delay={0.2}>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How it works
            </h2>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-6">
            From your role to a working system
          </h3>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14" staggerDelay={0.08}>
        {[
          {
            step: "1",
            icon: Search,
            title: "Find your role",
            body: "Search across 800+ occupations. We map every role to specific tasks and time-back potential.",
          },
          {
            step: "2",
            icon: Clock,
            title: "See your time back",
            body: "Get a data-driven estimate of how much routine time AI could handle for someone in your position.",
          },
          {
            step: "3",
            icon: Users,
            title: "Review your blueprint",
            body: "See recommended modules and capabilities specific to your role. Add, remove, or adjust anything.",
          },
          {
            step: "4",
            icon: ArrowRight,
            title: "Request your system",
            body: "Submit your customized setup. We build it around the work you actually do — not a template.",
          },
        ].map((s) => (
          <StaggerItem key={s.step}>
            <div className="rounded-xl border border-border bg-card p-4 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                  {s.step}
                </div>
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-semibold mb-1">{s.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* ── Section 3.5: Worked Example ─────────────────────── */}
      <FadeIn delay={0.22}>
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Example
            </h2>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-6">
            What a system looks like in practice
          </h3>

          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Clinic Operations Manager</div>
                <h4 className="font-heading text-lg font-semibold">Workflow Bundle — 4 modules, 2-week build</h4>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-heading text-2xl font-bold text-accent">52</div>
                <div className="text-[10px] text-muted-foreground">min/day back</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Before</div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1" />
                    45 min/day on patient scheduling changes and follow-ups
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1" />
                    30 min/day drafting shift reports and status updates
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1" />
                    20 min/day chasing compliance documentation
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1" />
                    Staff spending time on data entry instead of patient care
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">After</div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                    Scheduling Assistant handles rebooking and reminders automatically
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                    Report Drafting agent prepares shift summaries by end of day
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                    Audit Prep assistant keeps compliance docs organized continuously
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                    Manager reviews and approves — doesn't assemble from scratch
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              {["Coordination & Scheduling", "Documentation", "Compliance & Policy", "Data & Reporting"].map((mod) => (
                <span key={mod} className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border bg-secondary/30">
                  {mod}
                </span>
              ))}
              <span className="text-[11px] text-muted-foreground self-center ml-1">
                Deployed in 2 weeks
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Section 4: Trust ──────────────────────────────────── */}
      <FadeIn delay={0.25}>
        <div className="rounded-xl border border-border bg-card p-6 mb-14">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-accent" />
            <h3 className="font-heading text-lg font-semibold">What stays with you</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              "Final decisions on anything with financial or legal impact",
              "Sensitive conversations and relationship management",
              "Strategic judgment and priority-setting",
              "Sign-off on outgoing communications",
              "Edge cases that fall outside standard procedures",
              "The ability to pause, adjust, or stop anything at any time",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <FadeIn delay={0.3}>
        <div className="text-center py-6">
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2">
            Start with your role
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Find your occupation, see the recommended support system, and customize it before you submit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/browse"
              className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Browse occupations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 border border-border px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Search for your role
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
