"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { encodeTaskSelections } from "@/lib/task-selection"

interface TaskItem {
  id: number
  task_name: string
  displayLow: number
  displayHigh: number
  ai_impact_level: number | null
  ai_how_it_helps: string | null
  moduleKey: string
}

interface TaskSelectorProps {
  tasks: TaskItem[]
  slug: string
  totalMinutes: number
  annualValue: number
}

export function TaskSelector({ tasks, slug, totalMinutes, annualValue }: TaskSelectorProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(tasks.map((t) => t.id))
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedTasks = tasks.filter((t) => selected.has(t.id))
  const selectedMinutes = selectedTasks.reduce(
    (sum, t) => sum + Math.round((t.displayLow + t.displayHigh) / 2),
    0
  )
  const selectedValue = totalMinutes > 0
    ? Math.round((selectedMinutes / totalMinutes) * annualValue)
    : 0

  function handleBuild() {
    const ids = Array.from(selected)
    router.push(`/blueprint/${slug}?tasks=${encodeTaskSelections(ids)}`)
  }

  return (
    <div>
      {/* Task table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 sm:px-5 py-3 border-b border-border bg-secondary/30">
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

        {/* Task rows */}
        {tasks.map((task) => {
          const isSelected = selected.has(task.id)
          const isAutomated = (task.ai_impact_level ?? 0) >= 4

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => toggle(task.id)}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] gap-3 px-4 sm:px-5 py-3.5 w-full text-left border-b border-border last:border-b-0 transition-colors",
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
                <div className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-accent text-white"
                    : "bg-secondary text-muted-foreground"
                )}>
                  <Check className="h-3 w-3" />
                  Include in my build
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Sticky CTA bar */}
      <div className="sticky bottom-0 z-40 mt-6 -mx-4 px-4 py-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{selected.size}</span> tasks selected
            {" "}&middot;{" "}
            <span className="font-semibold text-foreground">{selectedMinutes} min/day</span>
            {" "}&middot;{" "}
            <span className="font-semibold text-accent">${selectedValue.toLocaleString()}/yr value</span>
          </div>
          <button
            onClick={handleBuild}
            disabled={selected.size === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40 w-full sm:w-auto"
          >
            Build Your Custom AI Assistant
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
