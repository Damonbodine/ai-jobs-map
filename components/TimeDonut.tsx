"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { MODULE_ACCENTS, MODULE_LABELS } from "@/lib/modules"
import type { ModuleCapability } from "@/types"

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

// React compares server-rendered SVG attributes as strings during hydration.
// Round calculated geometry so tiny runtime-specific float serialization
// differences cannot produce false hydration mismatches.
const stableSvgNumber = (value: number) => Math.round(value * 1_000_000) / 1_000_000

export function TimeDonut({ agents, capabilitiesByModule, totalMinutes, blueprintScale }: TimeDonutProps) {
  const [activeSlice, setActiveSlice] = useState<string | null>(null)

  const slices: DonutSlice[] = agents.map((agent) => {
    const scaledMinutes = Math.max(1, Math.round(agent.minutesSaved * blueprintScale))
    return {
      blockName: agent.blockName,
      label: MODULE_LABELS[agent.blockName] || agent.blockName,
      minutes: scaledMinutes,
      percentage: totalMinutes > 0 ? (scaledMinutes / totalMinutes) * 100 : 0,
      color: MODULE_ACCENTS[agent.blockName as keyof typeof MODULE_ACCENTS] ?? "#47586b",
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
    const offset = stableSvgNumber(circumference * (1 - slice.percentage / 100))
    const rotation = stableSvgNumber((startPercent / 100) * 360 - 90)
    return { ...slice, offset, rotation }
  })

  return (
    <div className="border border-border bg-card p-5 sm:p-6 mb-8">
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
              {arcs.map((arc) => {
                const angle = ((arc.rotation + 90) / 180) * Math.PI
                const inner = radius - strokeWidth / 2 - 4
                const outer = radius + strokeWidth / 2 + 4
                return (
                  <line
                    key={`sep-${arc.blockName}`}
                    x1={stableSvgNumber(center + inner * Math.sin(angle))}
                    y1={stableSvgNumber(center - inner * Math.cos(angle))}
                    x2={stableSvgNumber(center + outer * Math.sin(angle))}
                    y2={stableSvgNumber(center - outer * Math.cos(angle))}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                )
              })}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeData ? (
                <>
                  <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                    {activeData.minutes}
                  </div>
                  <div className="text-[10px] text-muted-foreground">min/day</div>
                </>
              ) : (
                <>
                  <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
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
                  "flex items-center gap-2 w-full text-left px-2 py-1 transition-colors text-xs",
                  activeSlice === slice.blockName ? "bg-secondary" : "hover:bg-secondary/50"
                )}
                onMouseEnter={() => setActiveSlice(slice.blockName)}
                onMouseLeave={() => setActiveSlice(null)}
                onClick={() => setActiveSlice(activeSlice === slice.blockName ? null : slice.blockName)}
              >
                <div
                  className="w-2.5 h-2.5 border border-border flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate flex-1">{slice.label}</span>
                <span className="font-mono text-muted-foreground tabular-nums">{slice.minutes}m</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="min-h-[280px]">
          {activeData ? (
            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                  <span
                    className="inline-block h-3 w-3 shrink-0 border border-border"
                    style={{ backgroundColor: activeData.color }}
                  />
                  {activeData.label} Agent
                </h3>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {activeData.minutes} min/day &middot; {Math.round(activeData.percentage)}% of total time back
                </div>
              </div>

              {/* Capabilities */}
              {activeData.capabilities.length > 0 && (
                <div>
                  <div className="eyebrow mb-2">
                    Capabilities included
                  </div>
                  <div className="space-y-2">
                    {activeData.capabilities.map((cap) => (
                      <div key={cap.capability_key} className="border border-border bg-secondary/30 px-3 py-2">
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
                  <div className="eyebrow mb-2">
                    Tasks handled ({activeData.tasks.length})
                  </div>
                  <div className="space-y-1">
                    {activeData.tasks.slice(0, 5).map((task, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1">
                        <span className="truncate flex-1 mr-2">{task.name}</span>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0",
                          task.tier === "automated" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
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
                  <div className="eyebrow mb-1.5">
                    Tools
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeData.tools.map((tool) => (
                      <span key={tool} className="text-[10px] bg-secondary px-2 py-0.5">
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
