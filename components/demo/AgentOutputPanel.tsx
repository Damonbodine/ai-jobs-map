// components/demo/AgentOutputPanel.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import type { AgentOutput } from "@/lib/demo/types"

const CHARS_PER_SECOND = 80

type Props = {
  output: AgentOutput
  agentName: string
}

export function AgentOutputPanel({ output, agentName }: Props) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const [showSkip, setShowSkip] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when output changes (agent switch)
  useEffect(() => {
    setDisplayedLength(0)
    setShowSkip(false)

    if (intervalRef.current) clearInterval(intervalRef.current)
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current)

    const msPerChar = 1000 / CHARS_PER_SECOND
    intervalRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= output.content.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return prev
        }
        return prev + 1
      })
    }, msPerChar)

    // Show skip button after 2 seconds
    skipTimerRef.current = setTimeout(() => setShowSkip(true), 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
    }
  }, [output])

  const displayedText = output.content.slice(0, displayedLength)
  const isDone = displayedLength >= output.content.length

  function skip() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayedLength(output.content.length)
    setShowSkip(false)
  }

  return (
    <div className="overflow-hidden bg-terminal border border-terminal-foreground/15">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-terminal-foreground/15">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-widest text-terminal-foreground/40">
            {output.label}
          </span>
          {output.format === "code" && output.language && (
            <span className="text-[8px] bg-terminal-foreground/10 text-terminal-foreground/50 px-1.5 py-0.5 font-mono">
              {output.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isDone && showSkip && (
            <button
              onClick={skip}
              className="text-[9px] text-terminal-foreground/40 hover:text-terminal-foreground/70 transition-colors"
            >
              Skip to end →
            </button>
          )}
          {isDone && (
            <span className="text-[9px] text-success/70">{agentName} · complete</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-60 overflow-y-auto">
        {output.format === "code" || output.format === "table" ? (
          <pre className="text-[10px] font-mono text-terminal-foreground/70 whitespace-pre-wrap leading-relaxed">
            {displayedText}
            {!isDone && <span className="animate-pulse text-terminal-foreground/50">▌</span>}
          </pre>
        ) : (
          <p className="text-[11px] text-terminal-foreground/70 whitespace-pre-wrap leading-relaxed">
            {displayedText}
            {!isDone && <span className="animate-pulse text-terminal-foreground/50">▌</span>}
          </p>
        )}
      </div>
    </div>
  )
}
