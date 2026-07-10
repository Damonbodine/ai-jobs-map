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
              className="eyebrow text-[9px]"
              style={{ color: agent.accentColor }}
            >
              {agent.label}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-tight">{agent.agentName}</h2>
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
          <div className="bg-destructive/10 p-3 border border-destructive/20">
            <div className="text-[8px] font-bold tracking-wider text-destructive mb-2 uppercase">
              Before
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-destructive">
              {agent.beforeMinutes} min
            </div>
            <div className="text-[9px] text-destructive/70 mt-0.5">manual work</div>
          </div>
          <div className="bg-success/10 p-3 border border-success/20">
            <div className="text-[8px] font-bold tracking-wider text-success mb-2 uppercase">
              After
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-success">
              {agent.afterMinutes} min
            </div>
            <div className="text-[9px] text-success/70 mt-0.5">to review &amp; approve</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
