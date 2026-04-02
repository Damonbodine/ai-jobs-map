"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight, ArrowLeft, Check, Plus, X, Cpu, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { PageTransition } from "@/components/PageTransition"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { MODULE_LIST, MODULE_TOOLS, CATEGORY_TO_MODULE } from "@/lib/modules"

const BOOKING_URL = "https://calendly.com" // Replace with your actual booking URL

const WORK_BLOCKS = MODULE_LIST.filter((m) => m.key !== "exceptions")

const TOOLS: Record<string, string[]> = MODULE_TOOLS

type Step = "role" | "agents" | "tools" | "custom" | "contact" | "done"

const STEPS: { key: Step; label: string }[] = [
  { key: "role", label: "Your Role" },
  { key: "agents", label: "Select Agents" },
  { key: "tools", label: "Choose Tools" },
  { key: "custom", label: "Custom Tasks" },
  { key: "contact", label: "Contact" },
]

interface Occupation {
  id: string
  title: string
  slug: string
  major_category: string
  [key: string]: unknown
}

interface MicroTask {
  id: string
  task_name: string
  ai_applicable: boolean
  ai_category: string | null
  ai_impact_level: number
  occupation_id: string
  [key: string]: unknown
}

function categoryToBlock(cat: string): string | null {
  return CATEGORY_TO_MODULE[cat] || null
}

export function FactoryWizard() {
  const searchParams = useSearchParams()
  const occupationSlug = searchParams.get("occupation")
  const initialTier = searchParams.get("tier") as "starter" | "workflow" | "ops" | null

  const [step, setStep] = useState<Step>("role")
  const [roleQuery, setRoleQuery] = useState("")
  const [selectedSlug, setSelectedSlug] = useState(occupationSlug || "")
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({})
  const [customTasks, setCustomTasks] = useState<string[]>([])
  const [newTask, setNewTask] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [painPoints, setPainPoints] = useState<string[]>([])
  const [newPainPoint, setNewPainPoint] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [searchResults, setSearchResults] = useState<Occupation[]>([])
  const [occupation, setOccupation] = useState<Occupation | null>(null)
  const [tasks, setTasks] = useState<MicroTask[]>([])

  // Search occupations
  useEffect(() => {
    if (roleQuery.length < 2) { setSearchResults([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("occupations")
        .select("id, title, slug, major_category")
        .ilike("title", `%${roleQuery}%`)
        .order("title")
        .limit(10)
      setSearchResults(data ?? [])
    }, 200)
    return () => clearTimeout(timeout)
  }, [roleQuery])

  // Load occupation when slug selected
  useEffect(() => {
    if (!selectedSlug) return
    supabase
      .from("occupations")
      .select("*")
      .eq("slug", selectedSlug)
      .single()
      .then(({ data }) => setOccupation(data))
  }, [selectedSlug])

  // Load tasks when occupation loaded
  useEffect(() => {
    if (!occupation?.id) return
    supabase
      .from("job_micro_tasks")
      .select("*")
      .eq("occupation_id", occupation.id)
      .order("ai_impact_level", { ascending: false })
      .then(({ data }) => setTasks(data ?? []))
  }, [occupation?.id])

  // Pre-select agents based on tasks
  useEffect(() => {
    if (tasks && tasks.length > 0 && selectedAgents.length === 0) {
      const blocks = new Set<string>()
      tasks.forEach((t) => {
        if (t.ai_applicable && t.ai_category) {
          const block = categoryToBlock(t.ai_category)
          if (block) blocks.add(block)
        }
      })
      if (blocks.size > 0) {
        setSelectedAgents(Array.from(blocks))
      }
    }
  }, [tasks, selectedAgents.length])

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)

  function goNext() {
    const idx = STEPS.findIndex((s) => s.key === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key)
    else setStep("done")
  }

  function goBack() {
    const idx = STEPS.findIndex((s) => s.key === step)
    if (idx > 0) setStep(STEPS[idx - 1].key)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const { error } = await supabase.functions.invoke("submit-config", {
        body: {
          occupation_title: occupation?.title || null,
          occupation_slug: selectedSlug || null,
          selected_agents: selectedAgents,
          selected_tools: selectedTools,
          custom_tasks: customTasks,
          pain_points: painPoints,
          contact_name: contactName,
          contact_email: contactEmail,
          tier: initialTier,
        },
      })
      if (error) throw error
      toast.success("Configuration submitted! We'll be in touch shortly.")
      setStep("done")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "done") {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-20 max-w-lg text-center">
          <FadeIn>
            <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-6 flex items-center justify-center">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-3">Configuration Submitted</h1>
            <p className="text-muted-foreground mb-2">
              We&apos;ve received your AI system configuration
              {occupation ? ` for ${occupation.title}` : ""}.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {selectedAgents.length} agents selected across{" "}
              {Object.values(selectedTools).flat().length} tools
              {customTasks.length > 0 ? ` with ${customTasks.length} custom tasks` : ""}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/"
                className="px-5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Back to Home
              </Link>
              <Link
                href="/browse"
                className="px-5 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Explore More Roles
              </Link>
            </div>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline mt-4"
            >
              Or book a call to discuss your setup
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </FadeIn>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <FadeIn>
          <h1 className="font-heading text-2xl font-bold mb-1">Configure Your AI System</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {initialTier === "starter" && "Starter Assistant — single-agent setup"}
            {initialTier === "workflow" && "Workflow Bundle — multi-agent configuration"}
            {initialTier === "ops" && "Ops Layer — full orchestration system"}
            {!initialTier && "Build a custom AI system for your role"}
          </p>
        </FadeIn>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full flex-1 transition-colors",
                  i <= currentStepIndex ? "bg-accent" : "bg-border"
                )}
              />
            </div>
          ))}
        </div>

        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].label}
        </div>

        {/* Step 1: Role */}
        {step === "role" && (
          <FadeIn>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Search your occupation</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Type your job title..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-border overflow-hidden">
                    {searchResults.map((occ) => (
                      <button
                        key={occ.id}
                        onClick={() => {
                          setSelectedSlug(occ.slug)
                          setRoleQuery(occ.title)
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors flex items-center justify-between",
                          selectedSlug === occ.slug && "bg-accent/5"
                        )}
                      >
                        <div>
                          <div className="font-medium">{occ.title}</div>
                          <div className="text-xs text-muted-foreground">{occ.major_category}</div>
                        </div>
                        {selectedSlug === occ.slug && <Check className="h-4 w-4 text-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {occupation && (
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                  <div className="text-sm font-semibold">{occupation.title}</div>
                  <div className="text-xs text-muted-foreground">{occupation.major_category}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  What are your biggest pain points? (optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newPainPoint}
                    onChange={(e) => setNewPainPoint(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPainPoint.trim()) {
                        setPainPoints([...painPoints, newPainPoint.trim()])
                        setNewPainPoint("")
                      }
                    }}
                    placeholder="e.g., Too much time on emails..."
                    className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    onClick={() => {
                      if (newPainPoint.trim()) {
                        setPainPoints([...painPoints, newPainPoint.trim()])
                        setNewPainPoint("")
                      }
                    }}
                    className="h-10 w-10 rounded-lg border border-input flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {painPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {painPoints.map((pp, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-secondary px-3 py-1 rounded-lg text-xs">
                        {pp}
                        <button onClick={() => setPainPoints(painPoints.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Step 2: Select Agents */}
        {step === "agents" && (
          <Stagger className="space-y-3" staggerDelay={0.05}>
            <StaggerItem>
              <p className="text-sm text-muted-foreground mb-4">
                Select work areas where you want AI agents to help.
                {tasks.length > 0 && " We've pre-selected based on your occupation's tasks."}
              </p>
            </StaggerItem>
            {WORK_BLOCKS.map((block) => {
              const Icon = block.icon
              const isSelected = selectedAgents.includes(block.key)
              const blockTasks = tasks.filter((t) => {
                const mapped = t.ai_category ? categoryToBlock(t.ai_category) : null
                return mapped === block.key && t.ai_applicable
              })

              return (
                <StaggerItem key={block.key}>
                  <button
                    onClick={() =>
                      setSelectedAgents((prev) =>
                        prev.includes(block.key)
                          ? prev.filter((a) => a !== block.key)
                          : [...prev, block.key]
                      )
                    }
                    className={cn(
                      "w-full text-left rounded-xl border p-4 transition-all",
                      isSelected
                        ? "border-accent bg-accent/5 shadow-sm"
                        : "border-border bg-card hover:border-accent/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          isSelected ? "bg-accent text-white" : "bg-secondary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{block.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-accent" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {block.description}
                        </p>
                        {blockTasks.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {blockTasks.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="text-[10px] bg-secondary px-2 py-0.5 rounded"
                              >
                                {t.task_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}

        {/* Step 3: Choose Tools */}
        {step === "tools" && (
          <Stagger className="space-y-6" staggerDelay={0.1}>
            <StaggerItem>
              <p className="text-sm text-muted-foreground mb-4">
                Pick tools for each selected agent.
              </p>
            </StaggerItem>
            {selectedAgents.map((agentKey) => {
              const block = WORK_BLOCKS.find((b) => b.key === agentKey)
              const tools = TOOLS[agentKey] || []
              if (!block) return null

              return (
                <StaggerItem key={agentKey}>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <block.icon className="h-4 w-4 text-accent" />
                      <h3 className="text-sm font-semibold">{block.label} Agent</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {tools.map((toolName) => {
                        const isSelected = selectedTools[agentKey]?.includes(toolName) ?? false
                        return (
                          <button
                            key={toolName}
                            onClick={() => {
                              setSelectedTools((prev) => {
                                const current = prev[agentKey] || []
                                return {
                                  ...prev,
                                  [agentKey]: isSelected
                                    ? current.filter((t) => t !== toolName)
                                    : [...current, toolName],
                                }
                              })
                            }}
                            className={cn(
                              "text-left p-3 rounded-lg border text-xs transition-all",
                              isSelected
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/30"
                            )}
                          >
                            <div className="font-medium flex items-center justify-between">
                              {toolName}
                              {isSelected && <Check className="h-3 w-3 text-accent" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}

        {/* Step 4: Custom Tasks */}
        {step === "custom" && (
          <FadeIn>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add any specific tasks you&apos;d like automated that weren&apos;t covered above.
              </p>
              <div className="flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTask.trim()) {
                      setCustomTasks([...customTasks, newTask.trim()])
                      setNewTask("")
                    }
                  }}
                  placeholder="e.g., Summarize weekly standup notes..."
                  className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  onClick={() => {
                    if (newTask.trim()) {
                      setCustomTasks([...customTasks, newTask.trim()])
                      setNewTask("")
                    }
                  }}
                  className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </div>
              {customTasks.length > 0 ? (
                <div className="space-y-2">
                  {customTasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <span className="text-sm">{task}</span>
                      <button
                        onClick={() => setCustomTasks(customTasks.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Cpu className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No custom tasks yet. Add tasks above or skip this step.
                  </p>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Step 5: Contact */}
        {step === "contact" && (
          <FadeIn>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                How should we reach you about your configuration?
              </p>

              {/* Summary */}
              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Configuration Summary
                </h3>
                {occupation && (
                  <div className="text-sm mb-2">
                    <span className="text-muted-foreground">Role: </span>
                    <span className="font-medium">{occupation.title}</span>
                  </div>
                )}
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Agents: </span>
                  <span className="font-medium">{selectedAgents.length}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({selectedAgents.map((a) => WORK_BLOCKS.find((b) => b.key === a)?.label).join(", ")})
                  </span>
                </div>
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Tools: </span>
                  <span className="font-medium">{Object.values(selectedTools).flat().length}</span>
                </div>
                {customTasks.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Custom tasks: </span>
                    <span className="font-medium">{customTasks.length}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 mt-2">
                <p className="text-sm font-medium mb-1">Prefer to talk live?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Book a free consultation to discuss your AI system configuration.
                </p>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                >
                  Book a Call
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {step === "contact" ? (
            <button
              onClick={handleSubmit}
              disabled={!contactEmail.trim() || submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {submitting ? "Submitting..." : "Submit Configuration"}
              {!submitting && <Check className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={step === "role" && !selectedSlug}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {step === "custom" ? "Continue" : "Next"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
