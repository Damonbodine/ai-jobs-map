"use client"

import Link from "next/link"
import {
  ChevronRight, Cpu, ArrowRight,
  Users, Workflow, CircleDot, Shield,
} from "lucide-react"
import { generateBlueprint } from "@/lib/blueprint"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/PageTransition"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import type {
  Occupation,
  MicroTask,
  AutomationProfile,
  ArchitectureType,
  AutomationTier,
} from "@/types"

const BLOCK_LABELS: Record<string, string> = {
  intake: "Intake & Triage",
  analysis: "Analysis",
  documentation: "Documentation",
  coordination: "Coordination",
  exceptions: "Exceptions",
  learning: "Learning",
  research: "Research",
  compliance: "Compliance",
  communication: "Communication",
  data_reporting: "Data & Reporting",
}

const ARCHITECTURE_LABELS: Record<ArchitectureType, { label: string; description: string }> = {
  "single-agent": {
    label: "Single Agent",
    description: "One focused agent handles all tasks sequentially",
  },
  "multi-agent": {
    label: "Multi-Agent",
    description: "Multiple agents work in parallel on different work areas",
  },
  "hub-and-spoke": {
    label: "Hub & Spoke",
    description: "Central orchestrator coordinates specialized agents",
  },
}

const TIER_STYLES: Record<AutomationTier, string> = {
  automated: "bg-green-100 text-green-700",
  assisted: "bg-blue-100 text-blue-700",
  "human-only": "bg-gray-100 text-gray-600",
}

interface BlueprintViewProps {
  occupation: Occupation
  profile: AutomationProfile | null
  tasks: MicroTask[]
  slug: string
}

export function BlueprintView({ occupation, profile, tasks, slug }: BlueprintViewProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Cpu className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-bold mb-2">Loading blueprint data...</h1>
        <p className="text-sm text-muted-foreground">
          Task data is being loaded for {occupation.title}.
        </p>
      </div>
    )
  }

  const blueprint = generateBlueprint(occupation, tasks, profile ?? null)
  const archInfo = ARCHITECTURE_LABELS[blueprint.architecture]

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`/occupation/${slug}`}
            className="hover:text-foreground transition-colors"
          >
            {occupation.title}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Agent Blueprint</span>
        </nav>

        <FadeIn>
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-1">
            Agent Blueprint
          </h1>
          <p className="text-muted-foreground mb-8">
            AI system design for {occupation.title}
          </p>
        </FadeIn>

        {/* Impact Summary */}
        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 mb-6 sm:mb-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Total Time Back
                </div>
                <div className="font-heading text-3xl font-bold text-accent">
                  {blueprint.totalMinutesSaved}
                  <span className="text-base text-muted-foreground font-normal ml-1">
                    min/day
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Agents
                </div>
                <div className="font-heading text-3xl font-bold">
                  {blueprint.agents.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Architecture
                </div>
                <div className="text-sm font-semibold mt-1">{archInfo.label}</div>
                <div className="text-[11px] text-muted-foreground">{archInfo.description}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Orchestration
                </div>
                <div className="text-sm font-semibold mt-1 capitalize">
                  {blueprint.orchestration}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Architecture Diagram */}
        <FadeIn delay={0.2}>
          <div className="rounded-2xl border border-border bg-card p-6 mb-8">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Workflow className="h-4 w-4 text-accent" />
              System Architecture
            </h2>

            {blueprint.architecture === "hub-and-spoke" && (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center">
                  <Cpu className="h-5 w-5 mx-auto mb-1 text-accent" />
                  <div className="text-sm font-semibold">Orchestrator</div>
                  <div className="text-[10px] text-muted-foreground">
                    Routes tasks, monitors agents
                  </div>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex flex-wrap gap-3 justify-center">
                  {blueprint.agents.map((agent) => (
                    <div
                      key={agent.blockName}
                      className="rounded-lg border border-border p-3 text-center min-w-[120px]"
                    >
                      <div className="text-xs font-semibold">
                        {BLOCK_LABELS[agent.blockName]}
                      </div>
                      <div className="text-[10px] text-accent mt-0.5">
                        {agent.minutesSaved} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blueprint.architecture === "multi-agent" && (
              <div className="flex flex-wrap gap-3 justify-center">
                {blueprint.agents.map((agent, i) => (
                  <div key={agent.blockName} className="flex items-center gap-2">
                    <div className="rounded-lg border border-border p-3 text-center min-w-[120px]">
                      <div className="text-xs font-semibold">
                        {BLOCK_LABELS[agent.blockName]}
                      </div>
                      <div className="text-[10px] text-accent mt-0.5">
                        {agent.minutesSaved} min
                      </div>
                    </div>
                    {i < blueprint.agents.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {blueprint.architecture === "single-agent" && (
              <div className="flex justify-center">
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-6 text-center max-w-xs">
                  <Cpu className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <div className="text-sm font-semibold">
                    {BLOCK_LABELS[blueprint.agents[0]?.blockName]}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {blueprint.agents[0]?.tasks.length} tasks,{" "}
                    {blueprint.agents[0]?.minutesSaved} min/day
                  </div>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Agent Cards */}
        <FadeIn delay={0.3}>
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            Agent Details
          </h2>
        </FadeIn>
        <Stagger className="space-y-4 mb-8" staggerDelay={0.08}>
          {blueprint.agents.map((agent) => (
            <StaggerItem key={agent.blockName}>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold">
                      {BLOCK_LABELS[agent.blockName]} Agent
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-xl font-bold text-accent">
                      {agent.minutesSaved}
                    </div>
                    <div className="text-[10px] text-muted-foreground">min/day saved</div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2 mb-4">
                  {agent.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CircleDot className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{task.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            TIER_STYLES[task.tier]
                          )}
                        >
                          {task.tier}
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {task.minutesSaved}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tool tags */}
                <div className="flex flex-wrap gap-1.5">
                  {agent.toolAccess.map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] bg-secondary px-2 py-0.5 rounded"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Human Checkpoints */}
        <FadeIn delay={0.4}>
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-accent" />
              Human Checkpoints
            </h2>
            <div className="space-y-2">
              {blueprint.humanCheckpoints.map((cp, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  {cp}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.5}>
          <div className="text-center py-6">
            <Link
              href={`/factory?occupation=${slug}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Configure This System
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  )
}
