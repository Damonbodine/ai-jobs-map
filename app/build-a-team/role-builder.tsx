"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { MODULE_REGISTRY } from "@/lib/modules"
import { cn } from "@/lib/utils"

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

export type TaskItem = {
  id: number
  task_name: string
  displayLow: number
  displayHigh: number
  ai_impact_level: number | null
  ai_how_it_helps: string | null
  moduleKey: string
}

type ModuleGroup = {
  moduleKey: string
  tasks: TaskItem[]
  groupMinutes: number
  selectedCount: number
}

export function RoleBuilder({
  tasks,
  selected,
  onToggleModule,
  onToggleTask,
}: {
  tasks: TaskItem[]
  selected: Set<number>
  onToggleModule: (moduleKey: string, taskIds: number[]) => void
  onToggleTask: (id: number) => void
}) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Group tasks by module
  const groups: ModuleGroup[] = []
  const seen = new Map<string, TaskItem[]>()
  for (const task of tasks) {
    const arr = seen.get(task.moduleKey) ?? []
    arr.push(task)
    seen.set(task.moduleKey, arr)
  }
  for (const [moduleKey, moduleTasks] of seen) {
    const groupMinutes = moduleTasks.reduce((s, t) => s + Math.round((t.displayLow + t.displayHigh) / 2), 0)
    const selectedCount = moduleTasks.filter(t => selected.has(t.id)).length
    groups.push({ moduleKey, tasks: moduleTasks, groupMinutes, selectedCount })
  }

  function toggleExpand(moduleKey: string) {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(moduleKey) ? next.delete(moduleKey) : next.add(moduleKey)
      return next
    })
  }

  if (groups.length === 0) return (
    <p className="text-sm text-muted-foreground py-4 px-1">No AI-applicable tasks found for this role.</p>
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mt-3">
      {groups.map(({ moduleKey, tasks: groupTasks, groupMinutes, selectedCount }) => {
        const allSelected = selectedCount === groupTasks.length
        const someSelected = selectedCount > 0
        const accent = MODULE_ACCENTS[moduleKey] ?? "#6b7280"
        const definition = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
        const Icon = definition?.icon
        const isExpanded = expandedModules.has(moduleKey)

        return (
          <div key={moduleKey} className="border-b border-border last:border-b-0">
            <div
              className={cn(
                "border-l-4 px-4 py-3 flex items-center justify-between gap-3",
                allSelected ? "bg-white" : someSelected ? "bg-secondary/10" : "bg-card"
              )}
              style={{ borderLeftColor: accent }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {Icon && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background"
                    style={{ borderColor: `${accent}40`, color: accent }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold", allSelected ? "text-black" : "text-foreground")}>
                    {definition?.label ?? moduleKey}
                    <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                      {groupMinutes} min/day
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleExpand(moduleKey)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? "Hide tasks" : `${groupTasks.length} tasks`}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleModule(moduleKey, groupTasks.map(t => t.id))}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  allSelected
                    ? "bg-black text-white hover:opacity-90"
                    : someSelected
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "bg-accent text-white hover:opacity-90"
                )}
              >
                <Check className="h-3 w-3" />
                {allSelected ? "Selected" : someSelected ? "Partial" : "Select"}
              </button>
            </div>

            {isExpanded && (
              <ul className="divide-y divide-border border-t border-border bg-secondary/5">
                {groupTasks.map(task => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => onToggleTask(task.id)}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors flex items-center justify-center",
                      selected.has(task.id) ? "bg-black border-black" : "border-border bg-background"
                    )}>
                      {selected.has(task.id) && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground leading-snug">{task.task_name}</p>
                      {task.ai_how_it_helps && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{task.ai_how_it_helps}</p>
                      )}
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums pt-0.5">
                      {Math.round((task.displayLow + task.displayHigh) / 2)} min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
