"use client"

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useMemo, useState, useEffect, useCallback } from "react"
import {
  ChevronRight, Cpu, ArrowRight, Shield,
  Plus, X, Check, ChevronDown,
} from "lucide-react"
import { generateBlueprint } from "@/lib/blueprint"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/PageTransition"
import { FadeIn } from "@/components/FadeIn"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { computeDisplayedTimeback } from "@/lib/timeback"
import { computeAnnualValue, computeDynamicPrice, PRICING_TIERS } from "@/lib/pricing"
import { decodeTaskSelections, tasksToModuleKeys } from "@/lib/task-selection"
import type {
  Occupation,
  MicroTask,
  AutomationProfile,
  ModuleCapability,
} from "@/types"

import { MODULE_LABELS as BLOCK_LABELS, MODULE_DESCRIPTIONS as REGISTRY_DESCRIPTIONS, MODULE_COLORS } from "@/lib/modules"
import { TimeDonut } from "@/components/TimeDonut"

const MODULE_DESCRIPTIONS = REGISTRY_DESCRIPTIONS

interface BlueprintViewProps {
  occupation: Occupation
  profile: AutomationProfile | null
  tasks: MicroTask[]
  slug: string
  capabilitiesByModule?: Record<string, ModuleCapability[]>
}

const TEAM_SIZES = [
  { label: "1 person", multiplier: 1 },
  { label: "2–5 people", multiplier: 3 },
  { label: "5–10 people", multiplier: 7 },
  { label: "10+ people", multiplier: 12 },
]

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
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize modules: from ?tasks= param (occupation page selections), ?modules= param, or recommended
  const initialModules = useMemo(() => {
    const urlTasks = searchParams.get("tasks")
    if (urlTasks) {
      const taskIds = decodeTaskSelections(urlTasks)
      if (taskIds.length > 0) {
        const derived = tasksToModuleKeys(tasks, taskIds)
        if (derived.length > 0) return derived
      }
    }
    const urlModules = searchParams.get("modules")
    if (urlModules) {
      const parsed = urlModules.split(",").filter((m) => allModuleKeys.includes(m))
      return parsed.length > 0 ? parsed : recommendedModuleKeys
    }
    return recommendedModuleKeys
  }, [searchParams, allModuleKeys, recommendedModuleKeys, tasks])

  const [selectedModules, setSelectedModules] = useState<string[]>(initialModules)
  const [teamSizeIndex, setTeamSizeIndex] = useState(0)

  // Sync selections to URL
  const syncUrl = useCallback((modules: string[], custom: string[]) => {
    const params = new URLSearchParams()
    const isDefault = modules.length === recommendedModuleKeys.length &&
      modules.every((m) => recommendedModuleKeys.includes(m))
    if (!isDefault) {
      params.set("modules", modules.join(","))
    }
    if (custom.length > 0) {
      params.set("custom", custom.join("|"))
    }
    const qs = params.toString()
    const newUrl = `/blueprint/${slug}${qs ? `?${qs}` : ""}`
    router.replace(newUrl, { scroll: false })
  }, [recommendedModuleKeys, slug, router])

  const initialCustom = useMemo(() => {
    const urlCustom = searchParams.get("custom")
    return urlCustom ? urlCustom.split("|").filter(Boolean) : []
  }, [searchParams])
  const [customRequests, setCustomRequests] = useState<string[]>(initialCustom)
  const [newRequest, setNewRequest] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [showContactForm, setShowContactForm] = useState(false)

  useEffect(() => {
    syncUrl(selectedModules, customRequests)
  }, [selectedModules, customRequests, syncUrl])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Computed values
  const baseAnnualValue = computeAnnualValue(displayedMinutes, occupation.hourly_wage)
  const teamMultiplier = TEAM_SIZES[teamSizeIndex].multiplier
  const annualValue = baseAnnualValue * teamMultiplier
  const currentTier = computeDynamicPrice(selectedModules.length)

  // Selected module time
  const selectedMinutes = selectedModules.reduce((sum, key) => {
    const agent = blueprint.agents.find((a) => a.blockName === key)
    if (!agent) return sum
    return sum + Math.max(1, Math.round(agent.minutesSaved * blueprintScale))
  }, 0)

  async function submitAssistantRequest() {
    if (!contactEmail.trim()) {
      toast.error("Add an email so we know where to send your assistant plan.")
      return
    }

    setSubmitting(true)
    try {
      const addedModules = selectedModules.filter((m) => !recommendedModuleKeys.includes(m))
      const removedModules = recommendedModuleKeys.filter((m) => !selectedModules.includes(m))
      const selectedCapabilities = selectedModules.flatMap(
        (moduleKey) => (capabilitiesByModule[moduleKey] ?? []).map((c) => c.capability_key)
      )

      const { error } = await supabase
        .from("assistant_inquiries")
        .insert({
          occupation_id: occupation.id,
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
        })

      if (error) throw error
      setSubmitted(true)
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
          <span className="text-foreground">Blueprint</span>
        </nav>

        {/* Hero headline */}
        <FadeIn>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-1">
            Build Your {occupation.title} AI Assistant
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Start from the recommended blueprint
          </p>
        </FadeIn>

        {/* ROI Stats Bar */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-8">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="text-xs text-muted-foreground mb-1">Estimated time back:</div>
              <div className="font-heading text-2xl font-bold text-accent">
                {displayedMinutes} min/day
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">Potential annual value:</div>
              <div className="font-heading text-2xl font-bold">
                ${annualValue.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Team Size</label>
              <div className="relative">
                <select
                  value={teamSizeIndex}
                  onChange={(e) => setTeamSizeIndex(Number(e.target.value))}
                  className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-input bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                >
                  {TEAM_SIZES.map((size, i) => (
                    <option key={i} value={i}>{size.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Donut Chart */}
        <FadeIn delay={0.12}>
          <div className="mb-2">
            <h2 className="font-heading text-xl font-semibold mb-1">Start Savings</h2>
            <p className="text-sm text-muted-foreground mb-4">
              See where your time goes — hover or tap each segment for details.
            </p>
          </div>
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
            {submitted ? (
              <div className="py-4 text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight mb-2">
                  We received your blueprint
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                  We&apos;ll review your setup for {occupation.title} and send a scoping document to <span className="font-medium text-foreground">{contactEmail}</span> within 48 hours.
                </p>

                <div className="rounded-xl border border-border bg-secondary/20 p-4 mb-6 text-left">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    What you requested
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role:</span>{" "}
                      <span className="font-medium">{occupation.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Modules ({selectedModules.length}):</span>{" "}
                      <span className="font-medium">{selectedModules.map((k) => BLOCK_LABELS[k] ?? k).join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Build scope:</span>{" "}
                      <span className="font-medium">{currentTier.label}</span>
                    </div>
                    {customRequests.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Custom requests:</span>{" "}
                        <span className="font-medium">{customRequests.join(", ")}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Estimated time back:</span>{" "}
                      <span className="font-medium">{selectedMinutes} min/day</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    We review your blueprint and map it to our capability vault
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    You receive a scoping document with timeline and deliverables
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    We build your system — you stay in control at every checkpoint
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
                  Shape your assistant
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Toggle modules on or off, add anything else you need, and send the request.
                </p>

                {/* Module toggle grid — 3 column cards */}
                <div className="mb-6">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Module Shots
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                            "flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-left",
                            isSelected
                              ? "border-transparent"
                              : "border-border bg-card hover:border-accent/20"
                          )}
                          style={isSelected ? {
                            backgroundColor: "hsl(var(--foreground))",
                            color: "hsl(var(--background))",
                          } : undefined}
                        >
                          <div>
                            <div className="text-sm font-medium" style={isSelected ? { color: "hsl(var(--background))" } : undefined}>{BLOCK_LABELS[moduleKey] ?? moduleKey}</div>
                            <div className="text-xs text-muted-foreground" style={isSelected ? { color: "hsl(var(--background) / 0.7)" } : undefined}>
                              {scaledMin ? `${scaledMin}m saved` : "Time saved"}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "w-10 h-6 rounded-full flex items-center transition-colors px-0.5",
                              isSelected ? "justify-end" : "bg-muted-foreground/20 justify-start"
                            )}
                            style={isSelected ? { backgroundColor: "hsl(var(--background) / 0.3)" } : undefined}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full transition-colors shadow-sm",
                                !isSelected && "bg-muted-foreground/50"
                              )}
                              style={isSelected ? { backgroundColor: "hsl(var(--background))" } : undefined}
                            />
                          </div>
                        </button>
                      )
                    })}
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

                {/* Scope tiers */}
                <div className="mb-6">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Build scope
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRICING_TIERS.map((tier) => (
                      <div
                        key={tier.key}
                        className={cn(
                          "rounded-xl border-2 p-3 text-center transition-colors",
                          currentTier.key === tier.key
                            ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                            : "border-border bg-card opacity-60"
                        )}
                      >
                        <div className="font-heading text-sm font-bold mb-0.5">{tier.label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {tier.key === "starter" ? "≤3 modules" : tier.key === "recommended" ? "4–7 modules" : "8+ modules"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact form (expandable) */}
                {showContactForm ? (
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
                ) : null}
              </>
            )}
          </div>
        </FadeIn>

        {/* Floating summary panel */}
        {!submitted && (
          <div className="sticky bottom-0 z-40 -mx-4 px-4 py-4 bg-background/95 backdrop-blur border-t border-border mt-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>
                  Selected: <span className="font-semibold">{selectedModules.length} of {allModuleKeys.length}</span> modules
                </span>
                <span>
                  Total Time: <span className="font-semibold">{selectedMinutes} min</span>
                </span>
                <span>
                  Scope: <span className="font-semibold text-accent">{currentTier.label}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (showContactForm) {
                    submitAssistantRequest()
                  } else {
                    setShowContactForm(true)
                    setTimeout(() => {
                      document.querySelector<HTMLInputElement>('#assistant-builder input[placeholder="you@example.com"]')?.focus()
                    }, 100)
                  }
                }}
                disabled={submitting || (showContactForm && !contactEmail.trim())}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity w-full sm:w-auto"
              >
                {submitting ? "Submitting..." : "Send Custom Build Request"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
