// components/demo/AgentSuiteDemo.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DemoTimeline } from "./DemoTimeline"
import { AgentExpandedView } from "./AgentExpandedView"
import type { DemoRoleData } from "@/lib/demo/types"

const AUTO_ADVANCE_INTERVAL = 13000  // ms per agent
const IDLE_RESET_DELAY = 30000      // ms before auto-advance resumes after interaction

type Props = {
  roles: DemoRoleData[]
  occupationTitle?: string
}

export function AgentSuiteDemo({ roles, occupationTitle }: Props) {
  const [activeRoleSlug, setActiveRoleSlug] = useState(roles[0]?.slug ?? "")
  const [activeAgentIndex, setActiveAgentIndex] = useState(0)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeRole = roles.find((r) => r.slug === activeRoleSlug) ?? roles[0]

  // Viewport detection via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
    autoAdvanceRef.current = setInterval(() => {
      setActiveAgentIndex((prev) => {
        const agents = roles.find((r) => r.slug === activeRoleSlug)?.agents ?? []
        if (!agents.length) return prev
        return (prev + 1) % agents.length
      })
    }, AUTO_ADVANCE_INTERVAL)
  }, [activeRoleSlug, roles])

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
  }, [])

  const resetIdleTimer = useCallback(() => {
    if (idleResetRef.current) clearTimeout(idleResetRef.current)
    idleResetRef.current = setTimeout(() => {
      setIsUserInteracting(false)
    }, IDLE_RESET_DELAY)
  }, [])

  // Pause/resume based on visibility and user interaction
  useEffect(() => {
    if (isVisible && !isUserInteracting) {
      startAutoAdvance()
    } else {
      stopAutoAdvance()
    }
    return () => stopAutoAdvance()
  }, [isVisible, isUserInteracting, startAutoAdvance, stopAutoAdvance])

  // Cleanup idle reset timer on unmount
  useEffect(() => {
    return () => {
      if (idleResetRef.current) clearTimeout(idleResetRef.current)
    }
  }, [])

  const handleAgentSelect = useCallback(
    (index: number) => {
      setActiveAgentIndex(index)
      setIsUserInteracting(true)
      resetIdleTimer()
    },
    [resetIdleTimer]
  )

  const handleRoleChange = useCallback((slug: string) => {
    setActiveRoleSlug(slug)
    setActiveAgentIndex(0)
    setIsUserInteracting(false)
  }, [])

  if (!activeRole) return null

  const activeAgent = activeRole.agents[activeAgentIndex]
  const minutesSaved = activeRole.totalBeforeMinutes - activeRole.totalAfterMinutes
  const isAutoAdvancing = isVisible && !isUserInteracting

  const ctaLabel = occupationTitle
    ? `Build this for my ${occupationTitle} team`
    : "Build this for my team"

  return (
    <div ref={containerRef} className="rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
      {/* Demo header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">
            {activeRole.displayName} · Full AI Agent Suite
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground italic">
          {activeRole.tagline}
        </span>
      </div>

      {/* Mobile: horizontal tab row (below md) */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-border md:hidden">
        {activeRole.agents.map((agent, i) => {
          const isActive = i === activeAgentIndex
          return (
            <button
              key={agent.moduleKey}
              onClick={() => handleAgentSelect(i)}
              className={`flex items-center gap-1.5 shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: agent.accentColor }}
              />
              {agent.agentName}
            </button>
          )
        })}
      </div>

      {/* Main layout: timeline left, expanded view right */}
      <div className="flex min-h-[560px]">
        {/* Timeline — hidden on mobile, visible on md+ */}
        <div className="hidden md:block w-52 shrink-0 border-r border-border bg-muted/10">
          <DemoTimeline
            roles={roles}
            activeRoleSlug={activeRoleSlug}
            activeAgentIndex={activeAgentIndex}
            onRoleChange={handleRoleChange}
            onAgentSelect={handleAgentSelect}
            isAutoAdvancing={isAutoAdvancing}
            autoAdvanceInterval={AUTO_ADVANCE_INTERVAL}
          />
        </div>

        {/* Expanded view */}
        <div className="flex-1 p-5 overflow-hidden">
          {activeAgent && <AgentExpandedView agent={activeAgent} />}
        </div>
      </div>

      {/* CTA footer */}
      <div className="border-t border-border px-5 py-4 bg-muted/20 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-foreground">
            {minutesSaved} minutes back every day.
          </div>
          <div className="text-xs text-muted-foreground">
            ${activeRole.annualValueDollars.toLocaleString()} per year, per person.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="text-xs text-muted-foreground border border-border rounded-full px-4 py-2 hover:bg-muted transition-colors"
          >
            Book a scoping call
          </Link>
          <Link
            href="/build-a-team"
            className="flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
