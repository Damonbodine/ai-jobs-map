"use client"

import { useMemo, useState, type CSSProperties } from "react"
import { useInView, useCountUp } from "../../_lib/motion"
import { computeAnnualValue, TEAM_SIZES } from "@/lib/pricing"
import type { ModuleGroup } from "./page"

// -----------------------------------------------------------------------------
// Fonts / palette — mirror neon-occupation.tsx so the builder inherits the look.
// These strings reference the same next/font CSS variables already declared in
// NeonOccupation via FONT_VARS; we don't re-instantiate the fonts here.

const F = {
  black: `"Archivo Black", var(--tc-archivo-black), sans-serif`,
  archivo: `"Archivo", var(--tc-archivo), sans-serif`,
  fraunces: `"Fraunces", var(--tc-fraunces), serif`,
  mono: `"DM Mono", var(--tc-mono), ui-monospace, monospace`,
  grotesk: `"Space Grotesk", var(--tc-grotesk), system-ui, sans-serif`,
} as const

const NEON = {
  cyan: "#00E5FF",
  magenta: "#FF3EA5",
  purple: "#B56CFF",
  yellow: "#FFD400",
  green: "#00FF88",
  orange: "#FF6B00",
} as const

// -----------------------------------------------------------------------------
// State

type Phase = "select" | "form" | "transmit" | "done"

interface OrbitalBuilderProps {
  slug: string
  occupationId: number
  occupationTitle: string
  hourlyWage: number | null
  moduleGroups: ModuleGroup[]
}

// -----------------------------------------------------------------------------
// Layout helpers — compute node positions around a circle

function polar(i: number, n: number, radius: number): { x: number; y: number } {
  // Start at top (-90deg) and distribute evenly.
  const angle = (-Math.PI / 2) + (i / Math.max(n, 1)) * Math.PI * 2
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

// -----------------------------------------------------------------------------
// ModuleNode — one circle on either the outer or inner orbit

function ModuleNode({
  group,
  selected,
  position,
  onToggle,
}: {
  group: ModuleGroup
  selected: boolean
  position: { x: number; y: number }
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`${group.label}, ${group.groupMinutes} minutes per day, ${group.taskCount} tasks`}
      onClick={onToggle}
      className={selected ? "orbit-inner-node dock-pull-target" : "orbit-outer-node"}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
        width: 140,
        height: 140,
        borderRadius: "50%",
        border: `2px solid ${group.color}`,
        background: selected
          ? `radial-gradient(circle at 30% 30%, ${group.color}55, ${group.color}22 70%, transparent)`
          : `radial-gradient(circle at 30% 30%, ${group.color}22, transparent 70%)`,
        boxShadow: selected
          ? `0 0 30px ${group.color}aa, inset 0 0 20px ${group.color}66`
          : `0 0 12px ${group.color}44`,
        color: "#fff",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: 12,
        transition: "transform 800ms cubic-bezier(.2,1.2,.3,1), box-shadow 300ms, background 300ms",
        outline: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${group.color}, 0 0 30px ${group.color}aa`
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = selected
          ? `0 0 30px ${group.color}aa, inset 0 0 20px ${group.color}66`
          : `0 0 12px ${group.color}44`
        // Mirror onMouseLeave so tabbing away from a hovered node doesn't leave
        // a stuck scale(1.05) when the mouse is still sitting on top of it.
        e.currentTarget.style.transform = `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(1.05)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`
      }}
    >
      <div>
        <div style={{ fontFamily: F.black, fontSize: 13, lineHeight: 1.1, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
          {group.label}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: group.color, marginTop: 4, letterSpacing: "0.1em" }}>
          {group.groupMinutes} MIN/DAY
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
          {group.taskCount} TASKS
        </div>
      </div>
    </button>
  )
}

// -----------------------------------------------------------------------------
// OrbitCore — center of the orbit, live HUD for total min/day and $/yr

function OrbitCore({
  totalMinutes,
  annualValue,
  docked,
}: {
  totalMinutes: number
  annualValue: number
  docked: number
}) {
  const minuteCount = useCountUp(totalMinutes, 700, true)
  const valueCount = useCountUp(annualValue, 900, true)

  // Core brightness scales with how many modules are docked (0..max nodes).
  const intensity = Math.min(1, docked / 4) // saturate at 4 docked

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, rgba(0,229,255,0.6), rgba(181,108,255,0.3) 60%, transparent)",
        border: `1px solid ${NEON.cyan}`,
        boxShadow: `0 0 ${60 + intensity * 60}px ${NEON.cyan}${Math.round(0x66 + intensity * 0x55).toString(16)}, inset 0 0 ${40 + intensity * 20}px ${NEON.purple}44`,
        animation: "logo-pulse 3s ease-in-out infinite",
        display: "grid",
        placeItems: "center",
        zIndex: 3,
      }}
    >
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
          your stack
        </div>
        <div style={{ fontFamily: F.black, fontSize: 40, color: "#fff", lineHeight: 1, marginTop: 4 }}>
          {Math.round(minuteCount)}
        </div>
        <div style={{ fontFamily: F.fraunces, fontStyle: "italic", fontSize: 14, color: NEON.green, marginTop: 2 }}>
          min/day
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 10, letterSpacing: "0.05em" }}>
          ${Math.round(valueCount).toLocaleString()}/yr
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// FormPanel — dark-glass form panel that slides in from the right (Phase 2)

function FormPanel({
  teamSizeIndex,
  setTeamSizeIndex,
  customRequests,
  setCustomRequests,
  newRequest,
  setNewRequest,
  contactName,
  setContactName,
  contactEmail,
  setContactEmail,
  totalMinutes,
  scaledAnnualValue,
  dockedCount,
  submitError,
  phase,
  onSubmit,
}: {
  teamSizeIndex: number
  setTeamSizeIndex: (i: number) => void
  customRequests: string[]
  setCustomRequests: (next: string[] | ((prev: string[]) => string[])) => void
  newRequest: string
  setNewRequest: (v: string) => void
  contactName: string
  setContactName: (v: string) => void
  contactEmail: string
  setContactEmail: (v: string) => void
  totalMinutes: number
  scaledAnnualValue: number
  dockedCount: number
  submitError: string | null
  phase: Phase
  onSubmit: () => void
}) {
  const scaledCount = useCountUp(scaledAnnualValue, 900, true)

  function addCustomRequest() {
    const trimmed = newRequest.trim()
    if (!trimmed) return
    setCustomRequests((prev) => [...prev, trimmed])
    setNewRequest("")
  }

  const canSubmit = dockedCount > 0 && contactEmail.trim().length > 0 && phase === "form"

  return (
    <div
      style={{
        flex: "1 1 70%",
        background: "rgba(5,6,14,0.65)",
        border: `1px solid ${NEON.cyan}44`,
        borderRadius: 20,
        padding: 32,
        backdropFilter: "blur(12px)",
        boxShadow: `0 20px 60px rgba(0,229,255,0.12)`,
        animation: "formpanel-in 600ms cubic-bezier(.2,1,.3,1) both",
      }}
    >
      <div style={{ fontFamily: F.fraunces, fontStyle: "italic", fontSize: 28, color: "#fff", marginBottom: 4 }}>
        Assembly protocol
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.55)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 24 }}>
        what do we send you?
      </div>

      {/* Team size pills */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          team size
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TEAM_SIZES.map((size, index) => {
            const active = teamSizeIndex === index
            return (
              <button
                key={size.label}
                type="button"
                onClick={() => setTeamSizeIndex(index)}
                style={{
                  fontFamily: F.mono,
                  fontSize: 13,
                  color: active ? "#05060e" : "#fff",
                  background: active ? NEON.cyan : "transparent",
                  border: `1px solid ${active ? NEON.cyan : "rgba(255,255,255,0.2)"}`,
                  borderRadius: 999,
                  padding: "8px 16px",
                  cursor: "pointer",
                  boxShadow: active ? `0 0 20px ${NEON.cyan}66` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {size.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Live value card */}
      <div
        style={{
          marginBottom: 24,
          padding: 20,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${NEON.cyan}15, ${NEON.purple}15)`,
          border: `1px solid ${NEON.cyan}33`,
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          estimated annual value
        </div>
        <div
          style={{
            fontFamily: F.black,
            fontSize: 40,
            color: "#fff",
            background: `linear-gradient(90deg, ${NEON.cyan}, ${NEON.purple})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginTop: 4,
          }}
        >
          ${Math.round(scaledCount).toLocaleString()}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          {totalMinutes} min/day &middot; {TEAM_SIZES[teamSizeIndex].label}
        </div>
      </div>

      {/* Custom requests */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          anything specific?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newRequest}
            onChange={(e) => setNewRequest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addCustomRequest()
              }
            }}
            placeholder="a task, workflow, integration..."
            style={{
              flex: 1,
              fontFamily: F.grotesk,
              fontSize: 14,
              color: "#fff",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${NEON.cyan}33`,
              borderRadius: 8,
              padding: "10px 14px",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 3px ${NEON.cyan}22`
              e.currentTarget.style.borderColor = NEON.cyan
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none"
              e.currentTarget.style.borderColor = `${NEON.cyan}33`
            }}
          />
          <button
            type="button"
            onClick={addCustomRequest}
            style={{
              fontFamily: F.mono,
              fontSize: 13,
              color: "#fff",
              background: "transparent",
              border: `1px solid ${NEON.cyan}55`,
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
        {customRequests.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {customRequests.map((request, index) => (
              <span
                key={`${request}-${index}`}
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  color: "#fff",
                  background: `${NEON.cyan}15`,
                  border: `1px solid ${NEON.cyan}44`,
                  borderRadius: 999,
                  padding: "4px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {request}
                <button
                  type="button"
                  onClick={() => setCustomRequests((prev) => prev.filter((_, i) => i !== index))}
                  style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                  aria-label={`Remove ${request}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Name + email */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            name
          </label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              fontFamily: F.grotesk,
              fontSize: 14,
              color: "#fff",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${NEON.cyan}33`,
              borderRadius: 8,
              padding: "10px 14px",
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = NEON.cyan }}
            onBlur={(e) => { e.currentTarget.style.borderColor = `${NEON.cyan}33` }}
          />
        </div>
        <div>
          <label style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            email <span style={{ color: NEON.magenta }}>*</span>
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            style={{
              width: "100%",
              marginTop: 6,
              fontFamily: F.grotesk,
              fontSize: 14,
              color: "#fff",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${NEON.cyan}33`,
              borderRadius: 8,
              padding: "10px 14px",
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = NEON.cyan }}
            onBlur={(e) => { e.currentTarget.style.borderColor = `${NEON.cyan}33` }}
          />
        </div>
      </div>

      {/* Transmit button */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmit}
        className={submitError ? "transmit-shake-target" : ""}
        style={{
          fontFamily: F.black,
          fontSize: 20,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: canSubmit ? "#05060e" : "rgba(255,255,255,0.4)",
          background: canSubmit ? NEON.cyan : "rgba(255,255,255,0.08)",
          border: "none",
          borderRadius: 999,
          padding: "18px 36px",
          width: "100%",
          cursor: canSubmit ? "pointer" : "not-allowed",
          boxShadow: canSubmit ? `0 10px 40px ${NEON.cyan}66` : "none",
          animation: submitError
            ? "transmit-shake 0.4s ease-in-out"
            : canSubmit
              ? "btn-breathe 2s ease-in-out infinite"
              : "none",
          transition: "all 0.2s ease",
        }}
      >
        Transmit →
      </button>

      {submitError && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            fontFamily: F.mono,
            fontSize: 12,
            color: NEON.magenta,
            letterSpacing: "0.05em",
          }}
        >
          {submitError}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Top-level builder

export function OrbitalBuilder({
  moduleGroups,
  hourlyWage,
}: OrbitalBuilderProps) {
  const [sectionRef, seen] = useInView<HTMLElement>(0.2)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>("select")
  const [teamSizeIndex, setTeamSizeIndex] = useState(0)
  const [customRequests, setCustomRequests] = useState<string[]>([])
  const [newRequest, setNewRequest] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Split into outer (unselected) and inner (selected) orbits
  const outer = useMemo(() => moduleGroups.filter((g) => !selected.has(g.moduleKey)), [moduleGroups, selected])
  const inner = useMemo(() => moduleGroups.filter((g) => selected.has(g.moduleKey)), [moduleGroups, selected])

  const totalMinutes = useMemo(
    () => inner.reduce((sum, g) => sum + g.groupMinutes, 0),
    [inner],
  )
  const annualValue = useMemo(
    () => computeAnnualValue(totalMinutes, hourlyWage),
    [totalMinutes, hourlyWage],
  )
  const scaledAnnualValue = useMemo(
    () => annualValue * TEAM_SIZES[teamSizeIndex].multiplier,
    [annualValue, teamSizeIndex],
  )

  function toggle(moduleKey: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      return next
    })
  }

  // Orbit radii — sized so 140px nodes don't overlap the 220px core.
  const outerRadius = 300
  const innerRadius = 200

  return (
    <section
      id="orbital-builder"
      ref={sectionRef}
      style={{
        position: "relative",
        minHeight: "85vh",
        padding: "120px 32px",
        borderTop: `1px solid ${NEON.cyan}22`,
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(181,108,255,0.15) 0%, transparent 70%)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: NEON.cyan,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 18,
            textShadow: `0 0 10px ${NEON.cyan}`,
          }}
        >
          · section 04 / assemble your stack
        </div>

        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(40px, 6vw, 80px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "#fff",
            margin: "0 0 16px",
            textTransform: "uppercase",
          }}
        >
          dock the agents <br />
          <span style={{ fontFamily: F.fraunces, fontStyle: "italic", fontWeight: 700, color: NEON.cyan, textTransform: "none" }}>
            you actually need.
          </span>
        </h2>

        <p
          style={{
            fontFamily: F.grotesk,
            fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            margin: "0 0 48px",
            maxWidth: 640,
          }}
        >
          Click a module to pull it into your stack. Your core updates live —
          minutes reclaimed, dollars recovered, zero lock-in.
        </p>

        {/* Orbit + FormPanel flex container */}
        <div
          style={{
            display: "flex",
            flexDirection: phase === "select" ? "column" : "row",
            alignItems: "flex-start",
            gap: 32,
            transition: "all 600ms cubic-bezier(.2,1,.3,1)",
          }}
        >
          {/* Compressible orbit wrapper */}
          <div
            style={{
              flex: phase === "select" ? "1 1 auto" : "0 0 30%",
              width: "100%",
              transform: phase === "select" ? "scale(1)" : "scale(0.75)",
              transformOrigin: "top left",
              transition: "all 600ms cubic-bezier(.2,1,.3,1)",
            }}
          >
            {/* Orbit visualization */}
            <div
              style={{
                position: "relative",
                width: "min(820px, 100%)",
                aspectRatio: "1 / 1",
                margin: "0 auto 48px",
              }}
            >
              {/* Outer ring guide (dashed) */}
              <div
                className="orbit-outer-ring"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: outerRadius * 2,
                  height: outerRadius * 2,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  border: `1px dashed rgba(0,229,255,0.25)`,
                  animation: seen ? "orbit-outer 50s linear infinite" : "none",
                }}
              />

              {/* Inner ring guide (solid, brighter) */}
              <div
                className="orbit-inner-ring"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: innerRadius * 2,
                  height: innerRadius * 2,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  border: `1px solid rgba(0,229,255,0.45)`,
                  boxShadow: `0 0 20px rgba(0,229,255,0.15)`,
                  animation: seen ? "orbit-inner 30s linear infinite" : "none",
                }}
              />

              {/* Outer nodes (unselected) */}
              {outer.map((group, i) => (
                <ModuleNode
                  key={group.moduleKey}
                  group={group}
                  selected={false}
                  position={polar(i, outer.length, outerRadius)}
                  onToggle={() => toggle(group.moduleKey)}
                />
              ))}

              {/* Inner nodes (selected) */}
              {inner.map((group, i) => (
                <ModuleNode
                  key={group.moduleKey}
                  group={group}
                  selected={true}
                  position={polar(i, inner.length, innerRadius)}
                  onToggle={() => toggle(group.moduleKey)}
                />
              ))}

              {/* Core */}
              <OrbitCore totalMinutes={totalMinutes} annualValue={annualValue} docked={inner.length} />
            </div>
          </div>

          {(phase === "form" || phase === "transmit") && (
            <FormPanel
              teamSizeIndex={teamSizeIndex}
              setTeamSizeIndex={setTeamSizeIndex}
              customRequests={customRequests}
              setCustomRequests={setCustomRequests}
              newRequest={newRequest}
              setNewRequest={setNewRequest}
              contactName={contactName}
              setContactName={setContactName}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              totalMinutes={totalMinutes}
              scaledAnnualValue={scaledAnnualValue}
              dockedCount={inner.length}
              submitError={submitError}
              phase={phase}
              onSubmit={() => {
                // wiring lives in Task 7
                setPhase("transmit")
              }}
            />
          )}
        </div>

        {/* Footer bar — only shown during select phase */}
        {phase === "select" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.05em",
              }}
              aria-live="polite"
            >
              {inner.length} agents &middot; {totalMinutes} min/day &middot; ${annualValue.toLocaleString()}/yr
            </div>

            <button
              type="button"
              disabled={inner.length === 0}
              onClick={() => setPhase("form")}
              style={{
                fontFamily: F.black,
                fontSize: 18,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: inner.length === 0 ? "rgba(255,255,255,0.4)" : "#05060e",
                background: inner.length === 0 ? "rgba(255,255,255,0.1)" : NEON.cyan,
                border: "none",
                borderRadius: 999,
                padding: "18px 40px",
                cursor: inner.length === 0 ? "not-allowed" : "pointer",
                boxShadow: inner.length === 0 ? "none" : `0 10px 40px ${NEON.cyan}66`,
                animation: inner.length === 0 ? "none" : "btn-breathe 2s ease-in-out infinite",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (inner.length > 0) e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              Build my agent stack →
            </button>

            {inner.length === 0 && (
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                click a module to begin
              </div>
            )}
          </div>
        )}
      </div>

      {/* phase !== "select" UI lands in Task 6/7 */}
      {phase !== "select" && (
        <div style={{ marginTop: 40, color: "#fff", fontFamily: F.mono, textAlign: "center" }}>
          phase: {phase} (placeholder — Task 6+)
        </div>
      )}
    </section>
  )
}
