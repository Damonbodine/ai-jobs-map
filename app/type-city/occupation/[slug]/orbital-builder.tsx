"use client"

import type { ModuleGroup } from "./page"

export function OrbitalBuilder({
  moduleGroups,
}: {
  slug: string
  occupationId: number
  occupationTitle: string
  hourlyWage: number | null
  moduleGroups: ModuleGroup[]
}) {
  return (
    <section
      id="orbital-builder"
      style={{
        minHeight: "40vh",
        padding: "120px 32px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        borderTop: "1px solid rgba(0,229,255,0.2)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        Orbital builder placeholder — {moduleGroups.length} module groups loaded.
      </div>
    </section>
  )
}
