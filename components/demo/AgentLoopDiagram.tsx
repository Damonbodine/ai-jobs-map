// components/demo/AgentLoopDiagram.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ShieldCheck } from "lucide-react"
import type { AgentLoopContent } from "@/lib/demo/types"

type Phase = "inputs" | "ai" | "outputs" | "human" | "pause"

const PHASE_DURATIONS: Record<Phase, number> = {
  inputs: 1500,
  ai: 2000,
  outputs: 1500,
  human: 1000,
  pause: 4500,
}

const PHASES: Phase[] = ["inputs", "ai", "outputs", "human", "pause"]

type Props = {
  loop: AgentLoopContent
  agentName: string
  accentColor: string
}

export function AgentLoopDiagram({ loop, agentName, accentColor }: Props) {
  const [phase, setPhase] = useState<Phase>("inputs")
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleNext(currentPhase: Phase) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const idx = PHASES.indexOf(currentPhase)
      const next = PHASES[(idx + 1) % PHASES.length]
      setPhase(next)
    }, PHASE_DURATIONS[currentPhase])
  }

  // Reset + restart when loop content changes (agent switch)
  useEffect(() => {
    setPhase("inputs")
    setPaused(false)
  }, [loop])

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    scheduleNext(phase)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused])

  const isActive = (p: Phase) =>
    PHASES.indexOf(phase) >= PHASES.indexOf(p) || phase === "pause"

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#0f0f0e] border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-xs font-medium text-white/50">
          {agentName} is processing
        </span>
        <button
          onClick={() => setPaused((p) => !p)}
          className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      {/* Loop diagram */}
      <div className="flex items-stretch gap-0 p-4">
        {/* Inputs */}
        <LoopBox
          active={isActive("inputs")}
          accentColor={accentColor}
          label="INPUTS"
          phase="inputs"
          currentPhase={phase}
        >
          {loop.inputs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={
                isActive("inputs") ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }
              }
              transition={{ delay: i * 0.3, duration: 0.35 }}
              className="text-[10px] text-white/60 leading-snug py-0.5"
            >
              {item}
            </motion.div>
          ))}
        </LoopBox>

        {/* Arrow */}
        <Arrow active={isActive("ai")} />

        {/* AI Processes */}
        <LoopBox
          active={isActive("ai")}
          accentColor="#ffffff"
          label="AI PROCESSES"
          phase="ai"
          currentPhase={phase}
          isAi
        >
          {loop.actions.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={
                isActive("ai") ? { opacity: 1 } : { opacity: 0 }
              }
              transition={{ delay: i * 0.4, duration: 0.3 }}
              className="text-[10px] text-white/60 leading-snug py-0.5"
            >
              {item}
            </motion.div>
          ))}
          {/* Pulse ring */}
          <motion.div
            animate={
              phase === "ai"
                ? { scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }
                : { scale: 1, opacity: 0.2 }
            }
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none"
          />
        </LoopBox>

        {/* Arrow */}
        <Arrow active={isActive("outputs")} />

        {/* Outputs */}
        <LoopBox
          active={isActive("outputs")}
          accentColor="#10b981"
          label="OUTPUTS"
          phase="outputs"
          currentPhase={phase}
        >
          {loop.outputs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={
                isActive("outputs") ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }
              }
              transition={{ delay: i * 0.3, duration: 0.35 }}
              className="flex items-start gap-1.5 py-0.5"
            >
              {isActive("outputs") && (
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="text-[10px] text-white/60 leading-snug">{item}</span>
            </motion.div>
          ))}
        </LoopBox>

        {/* Arrow */}
        <Arrow active={isActive("human")} />

        {/* Human Reviews */}
        <LoopBox
          active={isActive("human")}
          accentColor="#ffffff"
          label="HUMAN REVIEWS"
          phase="human"
          currentPhase={phase}
          dashed
          humanBox
        >
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60 inline-flex items-center gap-1 mb-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            Your approval required
          </span>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isActive("human") ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[10px] text-white/50 leading-relaxed"
          >
            {loop.humanAction}
          </motion.p>
          <AnimatePresence>
            {isActive("human") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-2 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full"
              >
                <Check className="w-2 h-2" /> Done
              </motion.div>
            )}
          </AnimatePresence>
        </LoopBox>
      </div>

      {/* Ambient AI pulse — always running */}
      <motion.div
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(ellipse at center, ${accentColor}22, transparent 70%)` }}
      />
    </div>
  )
}

function LoopBox({
  active,
  accentColor,
  label,
  children,
  isAi = false,
  dashed = false,
  humanBox = false,
}: {
  active: boolean
  accentColor: string
  label: string
  phase?: Phase
  currentPhase?: Phase
  children: React.ReactNode
  isAi?: boolean
  dashed?: boolean
  humanBox?: boolean
}) {
  const borderColor = humanBox && active
    ? "rgba(255,255,255,0.55)"
    : active
    ? `${accentColor}66`
    : "rgba(255,255,255,0.08)"

  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.35 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col gap-1 p-3 rounded-lg min-h-[100px]"
      style={{
        background: isAi ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px ${dashed ? "dashed" : "solid"} ${borderColor}`,
      }}
    >
      {isAi && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: accentColor === "#ffffff" ? "#3b82f6" : accentColor, color: "white" }}
        >
          AI
        </div>
      )}
      <span
        className="text-[8px] font-bold tracking-widest mb-1"
        style={{ color: active ? accentColor : "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
      {children}
    </motion.div>
  )
}

function Arrow({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{ opacity: active ? 0.7 : 0.2 }}
      className="flex items-center justify-center text-white/40 text-lg pb-6"
    >
      →
    </motion.div>
  )
}
