"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { DemoRoleData } from "@/lib/demo/types"

type Props = {
  roles: DemoRoleData[]
  activeRoleSlug: string
  activeAgentIndex: number
  onRoleChange: (slug: string) => void
  onAgentSelect: (index: number) => void
}

export function DemoTimeline({
  roles,
  activeRoleSlug,
  activeAgentIndex,
  onRoleChange,
  onAgentSelect,
}: Props) {
  const activeRole = roles.find((r) => r.slug === activeRoleSlug) ?? roles[0]

  return (
    <div className="flex flex-col h-full">
      {/* Role switcher chips */}
      <div className="flex flex-wrap gap-1.5 p-4 border-b border-border">
        {roles.map((role) => (
          <button
            key={role.slug}
            onClick={() => onRoleChange(role.slug)}
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors",
              role.slug === activeRoleSlug
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            )}
          >
            {role.displayName}
          </button>
        ))}
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-3 pb-2 text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
          {activeRole.displayName}&apos;s day
        </div>

        <div className="flex flex-col gap-0.5 px-2">
          {activeRole.agents.map((agent, i) => {
            const isActive = i === activeAgentIndex
            return (
              <motion.button
                key={agent.moduleKey}
                onClick={() => onAgentSelect(i)}
                initial={false}
                animate={isActive ? { backgroundColor: "hsl(var(--foreground))" } : { backgroundColor: "transparent" }}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                  isActive ? "text-background" : "hover:bg-muted/50"
                )}
              >
                <div className="text-[9px] mb-1" style={{ color: isActive ? "rgba(255,255,255,0.5)" : "#999" }}>
                  {agent.timeOfDay}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: agent.accentColor }}
                  />
                  <span className={cn("text-[11px] font-bold", isActive ? "text-white" : "text-foreground")}>
                    {agent.agentName}
                  </span>
                </div>
                <div className="text-[9px] mt-0.5 pl-3.5" style={{ color: isActive ? "rgba(255,255,255,0.45)" : "#aaa" }}>
                  {agent.label}
                </div>
                {isActive && (
                  <div className="text-[9px] mt-1 pl-3.5 font-semibold text-emerald-400">
                    {agent.beforeMinutes} min → {agent.afterMinutes} min
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="p-3 border-t border-border">
        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50">
          <div className="text-[8px] font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-1 uppercase">
            Total reclaimed
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300">
            {activeRole.totalBeforeMinutes - activeRole.totalAfterMinutes} min
          </div>
          <div className="text-[9px] text-blue-500 dark:text-blue-400">every single day</div>
        </div>
      </div>
    </div>
  )
}
