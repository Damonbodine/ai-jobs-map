// components/demo/AgentExpandedView.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AgentLoopDiagram } from "./AgentLoopDiagram"
import { AgentOutputPanel } from "./AgentOutputPanel"
import type { DemoAgentStep } from "@/lib/demo/types"

type Props = {
  agent: DemoAgentStep
}

export function AgentExpandedView({ agent }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${agent.moduleKey}-${agent.agentName}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 h-full overflow-y-auto"
      >
        {/* Agent header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: agent.accentColor }}
            />
            <span
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ color: agent.accentColor }}
            >
              {agent.label}
            </span>
          </div>
          <h2 className="text-xl font-black text-foreground leading-tight">{agent.agentName}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-lg">
            {agent.narrative}
          </p>
          <div className="text-[9px] text-muted-foreground mt-1">
            {agent.timeOfDay} · Saves {agent.beforeMinutes - agent.afterMinutes} minutes daily
          </div>
        </div>

        {/* Loop animation */}
        <AgentLoopDiagram
          loop={agent.loop}
          agentName={agent.agentName}
          accentColor={agent.accentColor}
        />

        {/* Output panel */}
        <AgentOutputPanel output={agent.output} agentName={agent.agentName} />

        {/* Before / After */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-100 dark:border-red-900/30">
            <div className="text-[8px] font-bold tracking-wider text-red-600 dark:text-red-400 mb-2 uppercase">
              Before
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">
              {agent.beforeMinutes} min
            </div>
            <div className="text-[9px] text-red-500/70 mt-0.5">manual work</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/30">
            <div className="text-[8px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 uppercase">
              After
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {agent.afterMinutes} min
            </div>
            <div className="text-[9px] text-emerald-500/70 mt-0.5">to review &amp; approve</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
