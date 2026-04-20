"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Check, CheckCircle2, ChevronDown, Mail, Shield, X } from "lucide-react"
import { toast } from "sonner"
import { MODULE_REGISTRY } from "@/lib/modules"
import { cn } from "@/lib/utils"
import {
  computeAnnualHours,
  computeAnnualValue,
  computeDynamicPrice,
  TEAM_SIZES,
} from "@/lib/pricing"
import { CalendlyEmbed } from "@/components/CalendlyEmbed"
import { CONTACT } from "@/lib/site"
import type { ModuleCapability } from "@/types"

interface TaskItem {
  id: number
  task_name: string
  displayLow: number
  displayHigh: number
  ai_impact_level: number | null
  ai_how_it_helps: string | null
  moduleKey: string
}

interface OccupationBuilderProps {
  tasks: TaskItem[]
  slug: string
  totalMinutes: number
  annualValue: number
  occupationId: number
  occupationTitle: string
  hourlyWage: number | null
  capabilitiesByModule: Record<string, ModuleCapability[]>
}

type BuilderPhase = "select" | "build" | "done"

const MODULE_ACCENTS: Record<string, string> = {
  intake: "#06b6d4",
  analysis: "#6366f1",
  documentation: "#8b5cf6",
  coordination: "#10b981",
  exceptions: "#f59e0b",
  learning: "#f43f5e",
  research: "#14b8a6",
  compliance: "#ef4444",
  communication: "#f97316",
  data_reporting: "#0ea5e9",
}

export function OccupationBuilder({
  tasks,
  slug,
  totalMinutes,
  annualValue,
  occupationId,
  occupationTitle,
  hourlyWage,
  capabilitiesByModule,
}: OccupationBuilderProps) {
  const [phase, setPhase] = useState<BuilderPhase>("select")
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(tasks.map((task) => task.id))
  )
  const [teamSizeIndex, setTeamSizeIndex] = useState(0)
  const [customRequests, setCustomRequests] = useState<string[]>([])
  const [newRequest, setNewRequest] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const builderRef = useRef<HTMLDivElement | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleModule(moduleKey: string) {
    const moduleTaskIds = tasks
      .filter((task) => task.moduleKey === moduleKey)
      .map((task) => task.id)

    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = moduleTaskIds.every((id) => next.has(id))

      if (allSelected) {
        moduleTaskIds.forEach((id) => next.delete(id))
      } else {
        moduleTaskIds.forEach((id) => next.add(id))
      }

      return next
    })
  }

  function toggleExpandedModule(moduleKey: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      return next
    })
  }

  const selectedTasks = useMemo(
    () => tasks.filter((task) => selected.has(task.id)),
    [tasks, selected]
  )
  const selectedMinutes = useMemo(
    () =>
      selectedTasks.reduce(
        (sum, task) => sum + Math.round((task.displayLow + task.displayHigh) / 2),
        0
      ),
    [selectedTasks]
  )
  const selectedModules = useMemo(
    () => Array.from(new Set(selectedTasks.map((task) => task.moduleKey))),
    [selectedTasks]
  )
  const assistantGroups = useMemo(() => {
    const groups = new Map<string, TaskItem[]>()

    for (const task of tasks) {
      const existing = groups.get(task.moduleKey) ?? []
      existing.push(task)
      groups.set(task.moduleKey, existing)
    }

    return Array.from(groups.entries())
      .map(([moduleKey, groupTasks]) => {
        const moduleDefinition = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
        const groupMinutes = groupTasks.reduce(
          (sum, task) => sum + Math.round((task.displayLow + task.displayHigh) / 2),
          0
        )
        const selectedCount = groupTasks.filter((task) => selected.has(task.id)).length

        return {
          moduleKey,
          definition: moduleDefinition,
          tasks: groupTasks.sort((a, b) => {
            const aMid = (a.displayLow + a.displayHigh) / 2
            const bMid = (b.displayLow + b.displayHigh) / 2
            return bMid - aMid
          }),
          groupMinutes,
          selectedCount,
        }
      })
      .sort((a, b) => b.groupMinutes - a.groupMinutes)
  }, [selected, tasks])
  const currentTier = useMemo(
    () => computeDynamicPrice(selectedModules.length),
    [selectedModules.length]
  )
  const scaledAnnualValue = useMemo(() => {
    const baseValue = computeAnnualValue(selectedMinutes, hourlyWage)
    return baseValue * TEAM_SIZES[teamSizeIndex].multiplier
  }, [hourlyWage, selectedMinutes, teamSizeIndex])

  // Hours/year framing for public display. Keeps the dollar figure in state
  // for the inquiry payload + PDF (buyer context), but strips labor-cost
  // math from surfaces any visitor can see.
  const scaledHoursPerYear = useMemo(
    () => computeAnnualHours(selectedMinutes * TEAM_SIZES[teamSizeIndex].multiplier),
    [selectedMinutes, teamSizeIndex]
  )
  const selectedHoursPerYear = useMemo(
    () => computeAnnualHours(selectedMinutes),
    [selectedMinutes]
  )

  useEffect(() => {
    if (phase !== "build" || !builderRef.current) return
    builderRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [phase])

  function addCustomRequest() {
    const trimmed = newRequest.trim()
    if (!trimmed) return
    setCustomRequests((prev) => [...prev, trimmed])
    setNewRequest("")
  }

  async function submitAssistantRequest() {
    if (selectedModules.length === 0) {
      toast.error("Select at least one task to build the assistant.")
      return
    }

    if (!contactEmail.trim()) {
      toast.error("Add an email so we know where to send your assistant plan.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupationId,
          occupationTitle,
          occupationSlug: slug,
          selectedModules,
          selectedCapabilities: selectedModules.flatMap((moduleKey) =>
            (capabilitiesByModule[moduleKey] ?? []).map(
              (capability) => capability.capability_key
            )
          ),
          selectedTaskIds: Array.from(selected),
          customRequests,
          teamSize: TEAM_SIZES[teamSizeIndex]?.label ?? "",
          tierKey: currentTier.key,
          displayedMinutes: selectedMinutes,
          displayedAnnualValue: annualValue,
          contactName,
          contactEmail,
          website: "", // honeypot — real users never see it
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "Could not submit the assistant request. Please try again."
        )
      }

      setPhase("done")
    } catch (err) {
      console.error("[builder] submit failed", err)
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not submit the assistant request. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handlePrimaryAction() {
    if (phase === "select") {
      if (selected.size === 0) return
      setPhase("build")
      return
    }

    if (phase === "build") {
      void submitAssistantRequest()
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {assistantGroups.map((group) => {
          const { moduleKey, definition, tasks: groupTasks, groupMinutes, selectedCount } = group
          const isExpanded = expandedModules.has(moduleKey)
          const allSelected = selectedCount === groupTasks.length
          const someSelected = selectedCount > 0
          const accent = MODULE_ACCENTS[moduleKey] ?? "#6b7280"
          const Icon = definition?.icon

          return (
            <div
              key={moduleKey}
              role="button"
              tabIndex={0}
              onClick={() => toggleModule(moduleKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  toggleModule(moduleKey)
                }
              }}
              className={cn(
                "border-b border-border last:border-b-0 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-inset",
                allSelected
                  ? "bg-white text-black"
                  : someSelected
                    ? "bg-secondary/10"
                    : "bg-card"
              )}
            >
              <div
                className={cn(
                  "border-l-4 px-4 py-4 sm:px-5",
                  allSelected ? "bg-white" : someSelected ? "bg-secondary/10" : "bg-card"
                )}
                style={{ borderLeftColor: accent }}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      {Icon ? (
                        <div
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background"
                          style={{ borderColor: `${accent}40`, color: accent }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className={cn(
                            "font-heading text-lg font-semibold tracking-tight",
                            allSelected ? "text-black" : "text-foreground"
                          )}>
                            {definition?.label ?? moduleKey}
                          </h3>
                          <div className={cn(
                            "text-sm font-medium tabular-nums",
                            allSelected ? "text-black/80" : "text-foreground/80"
                          )}>
                            {groupMinutes} min/day
                          </div>
                        </div>
                        <p className={cn(
                          "mt-1 text-sm",
                          allSelected ? "text-black/75" : "text-muted-foreground"
                        )}>
                          {definition?.description ?? "Bundle related work into one assistant scope."}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleExpandedModule(moduleKey)
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          className={cn(
                            "mt-2 text-sm font-medium underline-offset-4 hover:underline transition-colors",
                            allSelected
                              ? "text-black/70 hover:text-black"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {isExpanded ? "Hide tasks" : `Show ${groupTasks.length} tasks`}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 lg:pl-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleModule(moduleKey)
                      }}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors min-w-[150px]",
                        allSelected
                          ? "bg-black text-white hover:opacity-90"
                          : someSelected
                            ? "bg-secondary text-foreground hover:bg-secondary/80"
                            : "bg-accent text-white hover:opacity-90"
                      )}
                    >
                      <Check className="h-4 w-4" />
                      {allSelected ? "Included" : someSelected ? "Partially included" : "Include assistant"}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-background/40">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-3 sm:px-6 border-b border-border bg-secondary/20">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Task
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right min-w-[80px]">
                      Avg per day
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right min-w-[140px]">
                      Scope
                    </div>
                  </div>

                  {groupTasks.map((task) => {
                    const isSelected = selected.has(task.id)

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggle(task.id)}
                        className={cn(
                          "grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-3.5 sm:px-6 w-full text-left border-b border-border last:border-b-0 transition-all",
                          isSelected
                            ? "bg-white text-black"
                            : "bg-transparent hover:bg-secondary/30"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium leading-snug",
                          isSelected ? "text-black" : "text-foreground/85"
                        )}>
                          {task.task_name}
                        </div>
                        <div className={cn(
                          "text-sm tabular-nums text-right min-w-[80px]",
                          isSelected ? "text-black/80" : "text-muted-foreground"
                        )}>
                          {task.displayLow}&ndash;{task.displayHigh}m
                        </div>
                        <div className="flex items-center justify-end gap-2 min-w-[140px]">
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                              isSelected
                                ? "bg-black text-white shadow-sm"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            <Check className="h-3 w-3" />
                            {isSelected ? "Included" : "Excluded"}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {phase === "build" && (
        <div
          ref={builderRef}
          className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h3 className="font-heading text-xl font-semibold tracking-tight mb-1">
            Request your custom AI assistant plan
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Confirm the scope, add anything missing, and we will send back a recommended build plan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-3 mb-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">Team size</div>
              <div className="relative">
                <select
                  value={teamSizeIndex}
                  onChange={(e) => setTeamSizeIndex(Number(e.target.value))}
                  className="appearance-none h-10 w-full pl-3 pr-8 rounded-lg border border-input bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                >
                  {TEAM_SIZES.map((size, index) => (
                    <option key={size.label} value={index}>
                      {size.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="text-xs text-muted-foreground mb-1">Hours reclaimed / yr</div>
              <div className="font-heading text-2xl font-bold text-accent">
                {scaledHoursPerYear.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">Selected time back</div>
              <div className="font-heading text-2xl font-bold">
                {selectedMinutes} min/day
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Custom requests
            </div>
            <div className="flex gap-2">
              <input
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomRequest()
                  }
                }}
                placeholder="Add a task, workflow, or requirement..."
                className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="button"
                onClick={addCustomRequest}
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
                        setCustomRequests((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Contact
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Name
                </label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 mt-1 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Email
                </label>
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full h-10 mt-1 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-6 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-accent" />
            <span>
              You stay in control. Final decisions, sensitive communication, and exceptions
              remain with your team.
            </span>
          </div>

          <button
            type="button"
            onClick={() => void submitAssistantRequest()}
            disabled={submitting || !contactEmail.trim() || selectedModules.length === 0}
            aria-label="Request Your Custom AI Assistant Plan Form"
            data-testid="occupation-builder-submit-form"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-50 w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Request Your Custom AI Assistant Plan"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      )}

      {phase === "done" && (
        <div
          ref={builderRef}
          className="mt-6"
        >
          <div className="space-y-6">
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8"
            >
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-xl font-semibold mb-1">
                    Your blueprint is in your inbox.
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We just emailed a PDF of your custom AI assistant blueprint to{" "}
                    <strong className="text-foreground">{contactEmail}</strong>.
                    Share it with your team, push back on the numbers, and book a
                    scoping call below whenever you&apos;re ready to talk specifics.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-heading text-lg font-semibold mb-3">
                Book a 30-minute scoping call
              </h3>
              <CalendlyEmbed
                prefill={{
                  email: contactEmail,
                  name: contactName || undefined,
                }}
              />
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
              <Mail className="h-4 w-4 text-accent" />
              <span>
                Prefer email?{" "}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  {CONTACT.email}
                </a>
              </span>
            </div>
          </div>
        </div>
      )}

      {phase !== "done" && (
        <div className="sticky bottom-0 z-40 mt-6 px-2 sm:px-0 py-4">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background shadow-[0_-10px_30px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 sm:px-5">
            {phase === "select" ? (
              <>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedModules.length}</span> assistant types selected
                  {" "}&middot;{" "}
                  <span className="font-semibold text-foreground">{selectedMinutes} min/day</span>
                  {" "}&middot;{" "}
                  <span className="font-semibold text-accent">
                    ~{selectedHoursPerYear.toLocaleString()} hrs/yr reclaimed
                  </span>
                </div>
                <button
                  onClick={handlePrimaryAction}
                  disabled={selected.size === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40 w-full sm:w-auto"
                >
                  Request Your Custom AI Assistant Plan
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedModules.length}</span> modules
                  {" "}&middot;{" "}
                  <span className="font-semibold text-foreground">{selectedMinutes} min/day</span>
                  {" "}&middot;{" "}
                  <span className="font-semibold text-accent">{currentTier.label}</span>
                </div>
                <button
                  onClick={handlePrimaryAction}
                  disabled={submitting || !contactEmail.trim() || selectedModules.length === 0}
                  aria-label="Request Your Custom AI Assistant Plan Sticky Bar"
                  data-testid="occupation-builder-submit-sticky"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 w-full sm:w-auto"
                >
                  {submitting ? "Submitting..." : "Request Your Custom AI Assistant Plan"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
