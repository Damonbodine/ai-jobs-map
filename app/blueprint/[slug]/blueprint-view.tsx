"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ChevronRight, Cpu, ArrowRight, Shield,
  Plus, X,
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
} from "@/types"

import { MODULE_LABELS as BLOCK_LABELS, MODULE_DESCRIPTIONS as REGISTRY_DESCRIPTIONS, MODULE_COLORS } from "@/lib/modules"
import { TimeDonut } from "./time-donut"



const MODULE_DESCRIPTIONS = REGISTRY_DESCRIPTIONS

import type { ModuleCapability } from "@/types"

interface BlueprintViewProps {
  occupation: Occupation
  profile: AutomationProfile | null
  tasks: MicroTask[]
  slug: string
  capabilitiesByModule?: Record<string, ModuleCapability[]>
}

export function BlueprintView({ occupation, profile, tasks, slug, capabilitiesByModule = {} }: BlueprintViewProps) {
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
      const addedModules = selectedModules.filter((m) => !recommendedModuleKeys.includes(m))
      const removedModules = recommendedModuleKeys.filter((m) => !selectedModules.includes(m))

      // Collect capabilities for selected modules
      const selectedCapabilities = selectedModules.flatMap(
        (moduleKey) => (capabilitiesByModule[moduleKey] ?? []).map((c) => c.capability_key)
      )

      const payload = {
        occupation_title: occupation.title,
        occupation_slug: slug,
        recommended_modules: recommendedModuleKeys,
        selected_modules: selectedModules,
        added_modules: addedModules,
        removed_modules: removedModules,
        selected_capabilities: selectedCapabilities,
        custom_requests: customRequests,
        pain_points: [],
        contact_name: contactName,
        contact_email: contactEmail,
        tier: factoryTier,
        source: "blueprint",
      }

      // Insert directly into assistant_inquiries table
      const { error } = await supabase
        .from("assistant_inquiries")
        .insert({
          occupation_id: occupation.id,
          ...payload,
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
                  Support areas
                </div>
                <div className="text-sm font-semibold mt-1">
                  {blueprint.agents.length} working together
                </div>
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

        {/* Time-back breakdown chart */}
        <FadeIn delay={0.12}>
          <TimeDonut
            agents={blueprint.agents}
            capabilitiesByModule={capabilitiesByModule}
            totalMinutes={displayedMinutes}
            blueprintScale={blueprintScale}
          />
        </FadeIn>

        {/* Assistant Builder */}
        <FadeIn delay={0.2}>
          <div id="assistant-builder" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
              Shape your assistant
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Toggle modules on or off, add anything else you need, and send the request.
            </p>

            {/* Module toggles — all 10 modules as interactive chips */}
            <div className="mb-6">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Support modules
              </div>
              <div className="flex flex-wrap gap-2">
                {allModuleKeys.map((moduleKey) => {
                  const isSelected = selectedModules.includes(moduleKey)
                  const agent = blueprint.agents.find((a) => a.blockName === moduleKey)
                  const scaledMin = agent ? Math.max(1, Math.round(agent.minutesSaved * blueprintScale)) : null
                  return (
                    <button
                      key={moduleKey}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedModules((prev) => prev.filter((k) => k !== moduleKey))
                        } else {
                          setSelectedModules((prev) => [...prev, moduleKey])
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium border transition-all",
                        isSelected
                          ? MODULE_COLORS[moduleKey] || "bg-accent/10 text-accent border-accent/30"
                          : "bg-secondary/30 text-muted-foreground border-border hover:border-accent/30 hover:text-foreground"
                      )}
                    >
                      {BLOCK_LABELS[moduleKey] ?? moduleKey}
                      {isSelected && scaledMin && (
                        <span className="text-[10px] opacity-70">{scaledMin}m</span>
                      )}
                      {isSelected ? (
                        <X className="h-3 w-3 opacity-60" />
                      ) : (
                        <Plus className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">
                {selectedModules.length} of {allModuleKeys.length} modules selected
              </div>
            </div>

            {/* Custom requests */}
            <div className="mb-6">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Anything else?
              </div>
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

            {/* Human oversight note */}
            <div className="flex items-start gap-2 mb-6 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-accent" />
              <span>You stay in control — final decisions, sensitive communication, and exceptions always stay with you.</span>
            </div>

            {/* Submit */}
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Name</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-10 mt-1 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 mt-1 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={submitAssistantRequest}
                  disabled={submitting || !contactEmail.trim()}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                >
                  {submitting ? "Submitting..." : "Send request"}
                  {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  )
}
