"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ModuleCapability } from "@/types"

// Module colors for the chart — solid fill colors that work in both themes
const DONUT_COLORS: Record<string, string> = {
  intake: "#06b6d4",        // cyan-500
  analysis: "#6366f1",      // indigo-500
  documentation: "#8b5cf6", // violet-500
  coordination: "#10b981",  // emerald-500
  exceptions: "#f59e0b",    // amber-500
  learning: "#f43f5e",      // rose-500
  research: "#14b8a6",      // teal-500
  compliance: "#ef4444",    // red-500
  communication: "#f97316", // orange-500
  data_reporting: "#0ea5e9",// sky-500
}

const MODULE_LABELS: Record<string, string> = {
  intake: "Intake & Triage",
  analysis: "Analysis",
  documentation: "Documentation",
  coordination: "Coordination & Scheduling",
  exceptions: "Exceptions & Escalations",
  learning: "Learning & Updates",
  research: "Research",
  compliance: "Compliance & Policy",
  communication: "Communication",
  data_reporting: "Data & Reporting",
}

interface DonutSlice {
  blockName: string
  label: string
  minutes: number
  percentage: number
  color: string
  tasks: { name: string; tier: string; minutesSaved: number }[]
  capabilities: ModuleCapability[]
  tools: string[]
}

interface TimeDonutProps {
  agents: {
    blockName: string
    role: string
    tasks: { name: string; tier: string; minutesSaved: number }[]
    toolAccess: string[]
    minutesSaved: number
  }[]
  capabilitiesByModule: Record<string, ModuleCapability[]>
  totalMinutes: number
  blueprintScale: number
}

export function TimeDonut({ agents, capabilitiesByModule, totalMinutes, blueprintScale }: TimeDonutProps) {
  const [activeSlice, setActiveSlice] = useState<string | null>(null)

  const slices: DonutSlice[] = agents.map((agent) => {
    const scaledMinutes = Math.max(1, Math.round(agent.minutesSaved * blueprintScale))
    return {
      blockName: agent.blockName,
      label: MODULE_LABELS[agent.blockName] || agent.blockName,
      minutes: scaledMinutes,
      percentage: totalMinutes > 0 ? (scaledMinutes / totalMinutes) * 100 : 0,
      color: DONUT_COLORS[agent.blockName] || "#6b7280",
      tasks: agent.tasks.filter((t) => t.tier !== "human-only"),
      capabilities: capabilitiesByModule[agent.blockName] || [],
      tools: agent.toolAccess,
    }
  })

  const activeData = slices.find((s) => s.blockName === activeSlice) || null

  // SVG donut chart
  const size = 220
  const strokeWidth = 36
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let cumulativePercent = 0
  const arcs = slices.map((slice) => {
    const startPercent = cumulativePercent
    cumulativePercent += slice.percentage
    const offset = circumference * (1 - slice.percentage / 100)
    const rotation = (startPercent / 100) * 360 - 90
    return { ...slice, offset, rotation }
  })

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Donut Chart */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-0">
              {arcs.map((arc) => (
                <circle
                  key={arc.blockName}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={activeSlice === arc.blockName ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={arc.offset}
                  strokeLinecap="butt"
                  transform={`rotate(${arc.rotation} ${center} ${center})`}
                  className="transition-all duration-200 cursor-pointer"
                  opacity={activeSlice && activeSlice !== arc.blockName ? 0.35 : 1}
                  onMouseEnter={() => setActiveSlice(arc.blockName)}
                  onMouseLeave={() => setActiveSlice(null)}
                  onClick={() => setActiveSlice(activeSlice === arc.blockName ? null : arc.blockName)}
                />
              ))}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeData ? (
                <>
                  <div className="font-heading text-2xl font-bold" style={{ color: activeData.color }}>
                    {activeData.minutes}
                  </div>
                  <div className="text-[10px] text-muted-foreground">min/day</div>
                </>
              ) : (
                <>
                  <div className="font-heading text-2xl font-bold text-accent">
                    {totalMinutes}
                  </div>
                  <div className="text-[10px] text-muted-foreground">min/day total</div>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-1.5 w-full">
            {slices.map((slice) => (
              <button
                key={slice.blockName}
                type="button"
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1 rounded-md transition-colors text-xs",
                  activeSlice === slice.blockName ? "bg-secondary" : "hover:bg-secondary/50"
                )}
                onMouseEnter={() => setActiveSlice(slice.blockName)}
                onMouseLeave={() => setActiveSlice(null)}
                onClick={() => setActiveSlice(activeSlice === slice.blockName ? null : slice.blockName)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate flex-1">{slice.label}</span>
                <span className="text-muted-foreground tabular-nums">{slice.minutes}m</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="min-h-[280px]">
          {activeData ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-lg font-semibold" style={{ color: activeData.color }}>
                  {activeData.label} Agent
                </h3>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {activeData.minutes} min/day &middot; {Math.round(activeData.percentage)}% of total time back
                </div>
              </div>

              {/* Capabilities */}
              {activeData.capabilities.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Capabilities included
                  </div>
                  <div className="space-y-2">
                    {activeData.capabilities.map((cap) => (
                      <div key={cap.capability_key} className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                        <div className="text-sm font-medium">{cap.capability_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{cap.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Tasks */}
              {activeData.tasks.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Tasks handled ({activeData.tasks.length})
                  </div>
                  <div className="space-y-1">
                    {activeData.tasks.slice(0, 5).map((task, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1">
                        <span className="truncate flex-1 mr-2">{task.name}</span>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0",
                          task.tier === "automated" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {task.tier}
                        </span>
                      </div>
                    ))}
                    {activeData.tasks.length > 5 && (
                      <div className="text-[10px] text-muted-foreground">
                        + {activeData.tasks.length - 5} more tasks
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tools */}
              {activeData.tools.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Tools
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeData.tools.map((tool) => (
                      <span key={tool} className="text-[10px] bg-secondary px-2 py-0.5 rounded">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="text-sm text-muted-foreground mb-2">
                Hover or tap a section to explore
              </div>
              <div className="text-xs text-muted-foreground/60">
                Each slice shows a support area and the time it can give back.
                <br />
                Click to lock the detail view.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
