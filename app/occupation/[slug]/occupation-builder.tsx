"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Check, ChevronDown, Shield, X } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { computeAnnualValue, computeDynamicPrice, TEAM_SIZES } from "@/lib/pricing"
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

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
  const selectedValue = useMemo(
    () =>
      totalMinutes > 0
        ? Math.round((selectedMinutes / totalMinutes) * annualValue)
        : 0,
    [annualValue, selectedMinutes, totalMinutes]
  )
  const selectedModules = useMemo(
    () => Array.from(new Set(selectedTasks.map((task) => task.moduleKey))),
    [selectedTasks]
  )
  const currentTier = useMemo(
    () => computeDynamicPrice(selectedModules.length),
    [selectedModules.length]
  )
  const scaledAnnualValue = useMemo(() => {
    const baseValue = computeAnnualValue(selectedMinutes, hourlyWage)
    return baseValue * TEAM_SIZES[teamSizeIndex].multiplier
  }, [hourlyWage, selectedMinutes, teamSizeIndex])

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
      const { error } = await supabase
        .from("assistant_inquiries")
        .insert({
          occupation_id: occupationId,
          occupation_title: occupationTitle,
          occupation_slug: slug,
          recommended_modules: selectedModules,
          selected_modules: selectedModules,
          added_modules: [],
          removed_modules: [],
          selected_capabilities: selectedModules.flatMap(
            (moduleKey) =>
              (capabilitiesByModule[moduleKey] ?? []).map((capability) => capability.capability_key)
          ),
          custom_requests: customRequests,
          pain_points: [],
          contact_name: contactName,
          contact_email: contactEmail,
          tier: currentTier.key,
          source: "occupation-inline",
        })

      if (error) throw error
      setPhase("done")
    } catch {
      toast.error("Could not submit the assistant request. Please try again.")
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
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 sm:px-5 border-b border-border bg-secondary/30">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Task
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right min-w-[80px]">
            Current Time
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right min-w-[140px]">
            AI Capability
          </div>
        </div>

        {tasks.map((task) => {
          const isSelected = selected.has(task.id)

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => toggle(task.id)}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3.5 sm:px-5 w-full text-left border-b border-border last:border-b-0 transition-colors",
                isSelected ? "bg-card" : "bg-card/50 opacity-60"
              )}
            >
              <div className="text-sm font-medium leading-snug">
                {task.task_name}
              </div>
              <div className="text-sm text-muted-foreground tabular-nums text-right min-w-[80px]">
                {task.displayLow}&ndash;{task.displayHigh}m
              </div>
              <div className="flex items-center justify-end gap-2 min-w-[140px]">
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Check className="h-3 w-3" />
                  Include in my build
                </div>
              </div>
            </button>
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
              <div className="text-xs text-muted-foreground mb-1">Estimated annual value</div>
              <div className="font-heading text-2xl font-bold text-accent">
                ${scaledAnnualValue.toLocaleString()}
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
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-4 border border-green-200">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-heading text-2xl font-semibold tracking-tight mb-2">
            We received your plan request
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-lg">
            We&apos;ll review the build scope for {occupationTitle} and send the recommended plan to{" "}
            <span className="font-medium text-slate-900">{contactEmail}</span>.
          </p>

          <div className="rounded-xl border border-green-200 bg-white p-4 mb-6 text-left">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-3">
              Request summary
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Occupation:</span>{" "}
                <span className="font-medium text-slate-900">{occupationTitle}</span>
              </div>
              <div>
                <span className="text-slate-500">Modules:</span>{" "}
                <span className="font-medium text-slate-900">{selectedModules.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Tier:</span>{" "}
                <span className="font-medium text-slate-900">{currentTier.label}</span>
              </div>
              <div>
                <span className="text-slate-500">Time estimate:</span>{" "}
                <span className="font-medium text-slate-900">{selectedMinutes} min/day</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
              We review the selected workflows and map them to the right assistant modules.
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
              You receive a scoped build recommendation with timeline and deliverables.
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
              We confirm checkpoints before implementation starts.
            </div>
          </div>
        </div>
      )}

      {phase !== "done" && (
        <div className="sticky bottom-0 z-40 mt-6 -mx-4 px-4 py-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {phase === "select" ? (
              <>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selected.size}</span> tasks selected
                  {" "}&middot;{" "}
                  <span className="font-semibold text-foreground">{selectedMinutes} min/day</span>
                  {" "}&middot;{" "}
                  <span className="font-semibold text-accent">
                    ${selectedValue.toLocaleString()}/yr value
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
      )}
    </div>
  )
}
