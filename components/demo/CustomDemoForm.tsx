"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import type { DemoRoleData } from "@/lib/demo/types"
import { CustomDemoResult } from "./CustomDemoResult"

type Stage = "idle" | "generating" | "ready" | "error"

const PROGRESS_STAGES = [
  { at: 0, label: "Analyzing your task…" },
  { at: 1800, label: "Picking the right agent for the job…" },
  { at: 3500, label: "Drafting how it works…" },
  { at: 6000, label: "Almost there — formatting the output…" },
]

export function CustomDemoForm() {
  const [taskDescription, setTaskDescription] = useState("")
  const [occupationContext, setOccupationContext] = useState("")
  const [stage, setStage] = useState<Stage>("idle")
  const [progressLabel, setProgressLabel] = useState(PROGRESS_STAGES[0].label)
  const [errorMessage, setErrorMessage] = useState("")
  const [role, setRole] = useState<DemoRoleData | null>(null)

  const progressTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearProgressTimers = useCallback(() => {
    progressTimers.current.forEach(clearTimeout)
    progressTimers.current = []
  }, [])

  useEffect(() => () => clearProgressTimers(), [clearProgressTimers])

  const startProgressAnimation = useCallback(() => {
    clearProgressTimers()
    setProgressLabel(PROGRESS_STAGES[0].label)
    PROGRESS_STAGES.slice(1).forEach((stage) => {
      const timer = setTimeout(() => setProgressLabel(stage.label), stage.at)
      progressTimers.current.push(timer)
    })
  }, [clearProgressTimers])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmed = taskDescription.trim()
      if (trimmed.length < 12) {
        setErrorMessage("Add a bit more detail (at least a sentence).")
        return
      }
      setErrorMessage("")
      setStage("generating")
      startProgressAnimation()

      try {
        const response = await fetch("/api/demo/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskDescription: trimmed,
            occupationContext: occupationContext.trim() || undefined,
          }),
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            payload?.error || "Something went wrong generating the demo."
          )
        }

        const generatedRole = payload?.role as DemoRoleData | undefined
        if (!generatedRole) throw new Error("Malformed response.")

        clearProgressTimers()
        setRole(generatedRole)
        setStage("ready")
      } catch (err) {
        clearProgressTimers()
        const message =
          err instanceof Error ? err.message : "Unexpected error."
        setErrorMessage(message)
        setStage("error")
      }
    },
    [taskDescription, occupationContext, startProgressAnimation, clearProgressTimers]
  )

  const handleReset = useCallback(() => {
    setRole(null)
    setStage("idle")
    setErrorMessage("")
  }, [])

  if (stage === "ready" && role) {
    return (
      <CustomDemoResult
        role={role}
        taskDescription={taskDescription.trim()}
        occupationContext={occupationContext.trim() || undefined}
        onReset={handleReset}
      />
    )
  }

  const disabled = stage === "generating"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <div>
        <label
          htmlFor="demo-task"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          What task do you spend too much time on?
        </label>
        <textarea
          id="demo-task"
          name="taskDescription"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder={`e.g. "I spend 2 hours a day triaging insurance claim denials — checking eligibility, rewriting appeals, re-faxing forms to insurers"`}
          rows={4}
          disabled={disabled}
          maxLength={800}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 disabled:opacity-60 resize-none"
        />
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {taskDescription.length} / 800
        </div>
      </div>

      <div>
        <label
          htmlFor="demo-role"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Your role <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="demo-role"
          name="occupationContext"
          type="text"
          value={occupationContext}
          onChange={(e) => setOccupationContext(e.target.value)}
          placeholder="e.g. Dental office manager"
          maxLength={120}
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 disabled:opacity-60"
        />
      </div>

      {stage === "error" && errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {stage === "generating" ? (
        <div className="rounded-xl border border-foreground/10 bg-muted/30 px-4 py-4 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-foreground animate-pulse [animation-delay:120ms]" />
            <span className="w-2 h-2 rounded-full bg-foreground animate-pulse [animation-delay:240ms]" />
          </div>
          <p className="text-sm text-foreground font-medium">{progressLabel}</p>
        </div>
      ) : (
        <button
          type="submit"
          disabled={disabled || taskDescription.trim().length < 12}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          Build my agent demo
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {stage === "idle" && errorMessage && (
        <div className="text-xs text-red-700">{errorMessage}</div>
      )}
    </form>
  )
}
