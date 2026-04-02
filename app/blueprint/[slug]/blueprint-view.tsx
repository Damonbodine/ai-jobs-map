"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ChevronRight, Cpu, ArrowRight,
  Users, Workflow, CircleDot, Shield,
  Search, Plus, X,
} from "lucide-react"
import { generateBlueprint } from "@/lib/blueprint"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/PageTransition"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { computeDisplayedTimeback } from "@/lib/timeback"
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

const MODULE_DESCRIPTIONS: Record<string, string> = {
  intake: "Sort incoming requests and prep the next step.",
  analysis: "Review inputs and surface patterns or decisions.",
  documentation: "Draft recurring records, notes, and summaries.",
  coordination: "Keep schedules, handoffs, and follow-through moving.",
  exceptions: "Flag disruptions, edge cases, and escalations early.",
  learning: "Track updates, standards, and best practices.",
  research: "Pull supporting context and compare options quickly.",
  compliance: "Check policy, process, and regulatory requirements.",
  communication: "Prepare updates, messages, and stakeholder follow-through.",
  data_reporting: "Keep metrics, reports, and status views current.",
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
  const { displayedMinutes, displayedLow, displayedHigh } = computeDisplayedTimeback(
    profile ?? null,
    tasks,
    blueprint.totalMinutesSaved
  )
  const blueprintScale = blueprint.totalMinutesSaved > 0 ? displayedMinutes / blueprint.totalMinutesSaved : 1
  const recommendedTierLabel =
    blueprint.architecture === "single-agent"
      ? "Starter Assistant"
      : blueprint.architecture === "multi-agent"
        ? "Workflow Bundle"
        : "Ops Layer"
  const factoryTier =
    blueprint.architecture === "single-agent"
      ? "starter"
      : blueprint.architecture === "multi-agent"
        ? "workflow"
        : "ops"
  const recommendedModuleKeys = useMemo(
    () => blueprint.agents.map((agent) => agent.blockName),
    [blueprint.agents]
  )
  const allModuleKeys = useMemo(
    () => Object.keys(BLOCK_LABELS),
    []
  )
  const [selectedModules, setSelectedModules] = useState<string[]>(recommendedModuleKeys)
  const [moduleQuery, setModuleQuery] = useState("")
  const [customRequests, setCustomRequests] = useState<string[]>([])
  const [newRequest, setNewRequest] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const selectableModules = allModuleKeys.filter((key) => {
    if (selectedModules.includes(key)) return false
    if (!moduleQuery.trim()) return true
    const label = BLOCK_LABELS[key] ?? key
    return label.toLowerCase().includes(moduleQuery.toLowerCase())
  })

  async function submitAssistantRequest() {
    if (!contactEmail.trim()) {
      toast.error("Add an email so we know where to send your assistant plan.")
      return
    }

    setSubmitting(true)
    try {
      const selectedTools = Object.fromEntries(
        selectedModules.map((moduleKey) => [
          moduleKey,
          blueprint.agents
            .find((agent) => agent.blockName === moduleKey)
            ?.toolAccess ?? [],
        ])
      )

      const { error } = await supabase.functions.invoke("submit-config", {
        body: {
          occupation_title: occupation.title,
          occupation_slug: slug,
          selected_agents: selectedModules,
          selected_tools: selectedTools,
          custom_tasks: customRequests,
          pain_points: [
            `Requested from blueprint page for ${occupation.title}`,
            `Recommended suite: ${recommendedTierLabel}`,
          ],
          contact_name: contactName,
          contact_email: contactEmail,
          tier: factoryTier,
        },
      })

      if (error) throw error
      toast.success("Assistant request submitted. We'll turn this blueprint into a working plan.")
    } catch {
      toast.error("Could not submit the assistant request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

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
          <span className="text-foreground">Build your personal assistant</span>
        </nav>

        <FadeIn>
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-1">
            Build your personal assistant
          </h1>
          <p className="text-muted-foreground mb-8">
            Start from the recommended setup for {occupation.title}, then adjust the support modules and request exactly what you want from one screen.
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Recommended setup
            </div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight mb-2">
              {recommendedTierLabel} for {occupation.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              This setup maps the strongest task clusters into a support system you can review, trim down, or expand. Use it as the starting point for the assistant request you want us to build.
            </p>
            <div className="mt-3 text-sm text-foreground/80">
              Estimated impact: <span className="font-semibold">{displayedLow}–{displayedHigh} min/day</span> when the top modules are fully deployed.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <div className="rounded-xl bg-secondary/40 p-4">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Total time back
                </div>
                <div className="text-sm font-semibold mt-1">
                  {displayedMinutes} min/day
                </div>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Assistant layers
                </div>
                <div className="text-sm font-semibold mt-1">{blueprint.agents.length}</div>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Tasks mapped
                </div>
                <div className="text-sm font-semibold mt-1">{tasks.filter((task) => task.ai_applicable).length}</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Architecture Diagram */}
        <FadeIn delay={0.12}>
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
        <FadeIn delay={0.2}>
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            Recommended assistant modules
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
                      {Math.max(1, Math.round(agent.minutesSaved * blueprintScale * 0.82))}–{Math.max(Math.round(agent.minutesSaved * blueprintScale * 0.82) + 1, Math.round(agent.minutesSaved * blueprintScale * 1.18))}
                    </div>
                    <div className="text-[10px] text-muted-foreground">min/day potential</div>
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
        <FadeIn delay={0.3}>
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-accent" />
              You stay in control
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

        {/* Assistant Builder */}
        <FadeIn delay={0.38}>
          <div id="assistant-builder" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Build your personal assistant
            </div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight mb-2">
              Review the recommendation and shape the request.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Keep the recommended modules that fit, remove the ones you do not want, search the rest of the support library, and send us the exact assistant you want built.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mt-6">
              <div>
                <div className="text-sm font-semibold mb-3">Your assistant modules</div>
                <div className="space-y-3">
                  {selectedModules.map((moduleKey) => {
                    const agent = blueprint.agents.find((item) => item.blockName === moduleKey)
                    return (
                      <div key={moduleKey} className="rounded-xl border border-border bg-secondary/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">
                              {BLOCK_LABELS[moduleKey] ?? moduleKey}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {MODULE_DESCRIPTIONS[moduleKey] ?? "Assistant support for this work area."}
                            </div>
                            {agent && (
                              <div className="text-[11px] text-accent mt-2">
                                {Math.max(1, Math.round(agent.minutesSaved * blueprintScale * 0.82))}–{Math.max(Math.round(agent.minutesSaved * blueprintScale * 0.82) + 1, Math.round(agent.minutesSaved * blueprintScale * 1.18))} min/day potential
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedModules((prev) => prev.filter((key) => key !== moduleKey))
                            }
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold mb-3">Add more support modules</div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={moduleQuery}
                      onChange={(e) => setModuleQuery(e.target.value)}
                      placeholder="Search support modules..."
                      className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectableModules.map((moduleKey) => (
                      <button
                        key={moduleKey}
                        type="button"
                        onClick={() => setSelectedModules((prev) => [...prev, moduleKey])}
                        className="w-full text-left rounded-lg border border-border bg-card px-3 py-3 hover:border-accent/30 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{BLOCK_LABELS[moduleKey] ?? moduleKey}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {MODULE_DESCRIPTIONS[moduleKey] ?? "Add this module to your request."}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-accent flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-3">Anything else you want included?</div>
                  <div className="flex gap-2">
                    <input
                      value={newRequest}
                      onChange={(e) => setNewRequest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newRequest.trim()) {
                          setCustomRequests((prev) => [...prev, newRequest.trim()])
                          setNewRequest("")
                        }
                      }}
                      placeholder="Add a task, workflow, or requirement..."
                      className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newRequest.trim()) {
                          setCustomRequests((prev) => [...prev, newRequest.trim()])
                          setNewRequest("")
                        }
                      }}
                      className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {customRequests.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customRequests.map((request, index) => (
                        <span
                          key={`${request}-${index}`}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                        >
                          {request}
                          <button
                            type="button"
                            onClick={() =>
                              setCustomRequests((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                  <div className="text-sm font-semibold">Send your request</div>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    type="button"
                    onClick={submitAssistantRequest}
                    disabled={submitting || !contactEmail.trim()}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {submitting ? "Submitting..." : "Build your personal assistant"}
                    {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  )
}
