# Neon Orbital Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cream interactive builder with a neon orbital-assembly interface inline on `/type-city/occupation/[slug]`, preserving the `/api/inquiries` submission flow while adding heavier motion that pops.

**Architecture:** One new client component (`orbital-builder.tsx`) rendered inside `neon-occupation.tsx` between `AgentAnatomy` and `BigNumberMoment`. The server page computes a `moduleGroups` array (module-level aggregation of tasks) and passes it down. Motion hooks (`useInView`, `useCountUp`) are lifted into a shared `app/type-city/_lib/motion.ts` so both files can consume them without duplication. All animation is CSS keyframes + React state transitions — no new dependencies.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS keyframes, `next/font/google` page-scoped fonts, Supabase server client, zod (already used by `/api/inquiries`), `react-calendly` (via existing `CalendlyEmbed`).

**Design spec:** `docs/superpowers/specs/2026-04-19-neon-orbital-builder-design.md` — read before starting any task.

---

## File Structure

**New files:**
- `app/type-city/_lib/motion.ts` — shared `useInView` + `useCountUp` hooks (~50 lines)
- `app/type-city/occupation/[slug]/orbital-builder.tsx` — the client component and all its subparts (~700 lines)

**Modified files:**
- `app/type-city/type-city.css` — add 5 keyframes + a `prefers-reduced-motion` block
- `app/type-city/occupation/[slug]/page.tsx` — compute `moduleGroups` server-side, pass `occupationId` + `moduleGroups` to `NeonOccupation`
- `app/type-city/occupation/[slug]/neon-occupation.tsx` — import the shared motion hooks, accept new props, render `<OrbitalBuilder />` between `AgentAnatomy` and `BigNumberMoment`

**Unchanged / reused:**
- `/api/inquiries` POST endpoint and `lib/validation/inquiry.ts` schema
- `lib/modules.ts` `MODULE_REGISTRY`
- `lib/pricing.ts` `TEAM_SIZES`, `computeAnnualValue`, `computeDynamicPrice`
- `components/CalendlyEmbed.tsx` (wrapped in a neon frame, not modified)
- `lib/blueprint.ts` `getBlockForTask` (already used by the cream page for module assignment)

---

## Task 1: Lift motion hooks into shared `_lib/motion.ts`

**Goal:** Move `useInView` and `useCountUp` from `neon-occupation.tsx` into a shared module so the new `orbital-builder.tsx` can import them without duplication.

**Files:**
- Create: `app/type-city/_lib/motion.ts`
- Modify: `app/type-city/occupation/[slug]/neon-occupation.tsx` (lines 39–75 — current definitions of `useInView` / `useCountUp`)

- [ ] **Step 1: Create the shared motion module**

Create `app/type-city/_lib/motion.ts`:

```ts
"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Fires a boolean `seen` the first time `ref` intersects the viewport by at
 * least `threshold`. One-shot: disconnects after the first intersection.
 */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

/**
 * rAF count-up from 0 → target with cubic ease-out. Returns the live value.
 * Holds at 0 while `active` is false; restarts the tween whenever `target`
 * or `active` changes.
 */
export function useCountUp(target: number, duration = 1400, active = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])
  return val
}
```

- [ ] **Step 2: Replace the inline definitions in `neon-occupation.tsx`**

In `app/type-city/occupation/[slug]/neon-occupation.tsx`, delete lines 39–75 (the two hook definitions and the section comment `// Hooks`). At the top of the file, add:

```ts
import { useInView, useCountUp } from "../../_lib/motion"
```

Place the import alongside the existing `import { useEffect, useRef, useState, type CSSProperties } from "react"` line (line 5). The path `../../_lib/motion` resolves from `app/type-city/occupation/[slug]/` up to `app/type-city/_lib/motion.ts`.

Leave the `// Hooks` comment removed — the section no longer exists in this file.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (Pre-existing errors unrelated to this change are fine — note them but do not fix.)

- [ ] **Step 4: Smoke-test the existing neon page**

Run: `npm run dev`
Open: `http://localhost:3000/type-city/occupation/software-developers`
Expected: page loads, hero count-up animates, agent anatomy orbit rotates, Big-Number Moment count-up fires on scroll. (These all depend on the two hooks — if any of them fail, the import path is wrong.)

- [ ] **Step 5: Commit**

```bash
git add app/type-city/_lib/motion.ts app/type-city/occupation/[slug]/neon-occupation.tsx
git commit -m "refactor(type-city): lift useInView and useCountUp to shared _lib/motion"
```

---

## Task 2: Add orbital-builder keyframes to `type-city.css`

**Goal:** Add the 5 keyframes and a reduced-motion rule that the orbital builder will consume. Nothing renders yet — this is just CSS plumbing.

**Files:**
- Modify: `app/type-city/type-city.css` (append before the `.type-city-root` rule)

- [ ] **Step 1: Append the keyframes**

In `app/type-city/type-city.css`, after the existing `@keyframes gradient-shift` block (line 42) and before the `.type-city-root` rule (line 44), add:

```css
/* Orbital builder — outer orbit rotates counter-clockwise, slower + dimmer */
@keyframes orbit-outer {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}

/* Inner orbit rotates clockwise, faster, carrying selected modules */
@keyframes orbit-inner {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Node dock-pull: a brief magnetic flash when a module arrives at the core */
@keyframes dock-pull {
  0%   { transform: scale(1);    filter: brightness(1);   }
  40%  { transform: scale(1.22); filter: brightness(1.8); }
  100% { transform: scale(1);    filter: brightness(1);   }
}

/* Transmit-shake: horizontal jitter used for the Transmit button on error */
@keyframes transmit-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-8px); }
  40%      { transform: translateX(8px); }
  60%      { transform: translateX(-5px); }
  80%      { transform: translateX(5px); }
}

/* Particle burst: radial ejection from core, used for Phase 3 confirmation.
 * Direction is supplied by --burst-x / --burst-y custom props on each particle. */
@keyframes particle-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform:
      translate(calc(var(--burst-x, 0) * 1px), calc(var(--burst-y, 0) * 1px))
      scale(0.2);
    opacity: 0;
  }
}

/* Reduced motion: kill rotation and particle animations, keep the functional
 * selection behavior. Orbits become static; dock-pull fades to opacity instead
 * of scaling. */
@media (prefers-reduced-motion: reduce) {
  .type-city-root .orbit-outer-ring,
  .type-city-root .orbit-inner-ring {
    animation: none !important;
  }
  .type-city-root .dock-pull-target {
    animation: none !important;
    transition: opacity 0.2s ease;
  }
  .type-city-root .particle {
    animation: none !important;
    opacity: 0 !important;
  }
}
```

- [ ] **Step 2: Verify the CSS parses**

Run: `npm run dev`
Expected: dev server starts without CSS errors. Open `http://localhost:3000/type-city` and confirm the homepage still renders normally (no regressions from the new rules — they use classes that don't exist yet).

- [ ] **Step 3: Commit**

```bash
git add app/type-city/type-city.css
git commit -m "feat(type-city): add orbital-builder keyframes and reduced-motion rules"
```

---

## Task 3: Extend `page.tsx` to compute `moduleGroups` server-side

**Goal:** Aggregate `aiTasks` into module-level groups (using the same `getBlockForTask` mapping the cream page uses) and pass the array + a neon color per module + `occupationId` + a normalized `hourlyWage` default to `NeonOccupation`.

**Files:**
- Modify: `app/type-city/occupation/[slug]/page.tsx`

- [ ] **Step 1: Add neon module accent map + types**

Below the `AGENT_COLORS` constant (line 27), add:

```ts
/** Neon-mapped module accents — same key set as MODULE_ACCENTS on the cream
 * builder, but saturated for the dark orbital surface. Order preserves the
 * module→color associations users already see on the cream page. */
const NEON_MODULE_ACCENTS: Record<string, string> = {
  intake:        "#00E5FF", // cyan
  analysis:      "#7A8BFF", // indigo
  documentation: "#B56CFF", // violet
  coordination:  "#00FF88", // green
  exceptions:    "#FFD400", // yellow
  learning:      "#FF3EA5", // magenta
  research:      "#1EFFD4", // teal
  compliance:    "#FF4155", // red
  communication: "#FF6B00", // orange
  data_reporting:"#4DC9FF", // sky
}

export type ModuleGroup = {
  moduleKey: string
  label: string
  description: string
  color: string
  taskCount: number
  groupMinutes: number
  taskIds: number[]
}
```

- [ ] **Step 2: Add the MODULE_REGISTRY import**

At the top of `page.tsx`, alongside the existing import from `@/lib/blueprint`, extend the import list:

```ts
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
```

- [ ] **Step 3: Compute `moduleGroups` from `aiTasks`**

Minutes must be normalized so the sum across all groups equals `claimedMinutes`. The server route's zod schema enforces `displayedMinutes: max(600)` — passing raw estimated sums would fail validation when many tasks accumulate. Normalization also keeps the orbital core's "dock everything = full claimed minutes" story consistent with the hero.

After the `taskCards` computation (after the `.slice(0, 10)` at line 77) and before the `agents` mapping (line 79), insert:

```ts
const moduleGroups: ModuleGroup[] = (() => {
  type Raw = { taskCount: number; rawMinutes: number; taskIds: number[] }
  const raw = new Map<string, Raw>()
  for (const task of aiTasks) {
    const moduleKey = getBlockForTask(task)
    const minutes = estimateTaskMinutes(task) * archetypeMultiplier
    const existing = raw.get(moduleKey)
    if (existing) {
      existing.taskCount += 1
      existing.rawMinutes += minutes
      existing.taskIds.push(task.id)
    } else {
      raw.set(moduleKey, { taskCount: 1, rawMinutes: minutes, taskIds: [task.id] })
    }
  }

  // Normalize so the sum of groupMinutes equals claimedMinutes. This mirrors
  // the proportional redistribution used by taskCards above.
  const rawModuleTotal = Array.from(raw.values()).reduce((s, r) => s + r.rawMinutes, 0)

  return Array.from(raw.entries())
    .map(([moduleKey, r]): ModuleGroup => {
      const def = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
      const groupMinutes =
        rawModuleTotal > 0 && claimedMinutes > 0
          ? Math.max(1, Math.round((r.rawMinutes / rawModuleTotal) * claimedMinutes))
          : Math.max(1, Math.round(r.rawMinutes))
      return {
        moduleKey,
        label: def?.label ?? moduleKey,
        description: def?.description ?? "",
        color: NEON_MODULE_ACCENTS[moduleKey] ?? "#00E5FF",
        taskCount: r.taskCount,
        groupMinutes,
        taskIds: r.taskIds,
      }
    })
    .sort((a, b) => b.groupMinutes - a.groupMinutes)
})()
```

- [ ] **Step 4: Pass the new props to `NeonOccupation`**

In the `return <NeonOccupation ... />` block (lines 94–111), add two new props below `agents={agents}`:

```tsx
agents={agents}
moduleGroups={moduleGroups}
occupationId={occupation.id}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: one error — `NeonOccupation` doesn't yet accept `moduleGroups` or `occupationId`. That error is resolved in Task 4.

- [ ] **Step 6: Commit (partial build is expected at this checkpoint)**

```bash
git add app/type-city/occupation/[slug]/page.tsx
git commit -m "feat(type-city): compute module groups server-side for orbital builder"
```

Note: build will be broken until Task 4 lands. That is intentional — these two file changes form one logical unit but are split for reviewability.

---

## Task 4: Wire `moduleGroups` + `occupationId` through `neon-occupation.tsx`

**Goal:** Accept the new props, render an `<OrbitalBuilder />` placeholder in the correct slot (between `AgentAnatomy` and `BigNumberMoment`), and unbreak the build. The component itself is a stub that Task 5 will replace.

**Files:**
- Modify: `app/type-city/occupation/[slug]/neon-occupation.tsx`
- Create: `app/type-city/occupation/[slug]/orbital-builder.tsx` (stub only)

- [ ] **Step 1: Create the stub component**

Create `app/type-city/occupation/[slug]/orbital-builder.tsx`:

```tsx
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
```

Note: we re-export `ModuleGroup` from `page.tsx` rather than duplicating the type. This keeps the server page as the single source of truth for the data shape.

- [ ] **Step 2: Accept the new props in `NeonOccupation`**

In `app/type-city/occupation/[slug]/neon-occupation.tsx`, extend the `NeonOccupation` prop type (starting at line 1506). Find the existing closing `}[]` for the `agents` prop (line 1528) and immediately after the `agents` prop definition, before the closing `}`, add:

```ts
  moduleGroups: {
    moduleKey: string
    label: string
    description: string
    color: string
    taskCount: number
    groupMinutes: number
    taskIds: number[]
  }[]
  occupationId: number
```

And in the destructured params at the top of the function (starting around line 1493), add `moduleGroups` and `occupationId` alongside the other destructured props.

- [ ] **Step 3: Import and render the stub**

Near the top of `neon-occupation.tsx`, add:

```ts
import { OrbitalBuilder } from "./orbital-builder"
```

In the JSX return (currently ending at line 1556 with `<FinaleCTA />`), after the `{agents.length > 0 && <AgentAnatomy ... />}` line (line 1547), and before `<BigNumberMoment ... />`, insert:

```tsx
<OrbitalBuilder
  slug={slug}
  occupationId={occupationId}
  occupationTitle={title}
  hourlyWage={hourlyWage}
  moduleGroups={moduleGroups}
/>
```

Placement rationale: the Agent Anatomy section introduces the "central core + surrounding agents" metaphor; the orbital builder reuses and extends it by letting the user choose their own set. Keeping them adjacent reinforces the callback from the spec.

- [ ] **Step 4: Type-check + smoke-test**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npm run dev`
Open: `http://localhost:3000/type-city/occupation/software-developers`
Expected: page renders, and the placeholder text "Orbital builder placeholder — N module groups loaded." appears between the Agent Anatomy orbit and the Big-Number Moment section. `N` should match the number of distinct `getBlockForTask` values across the occupation's tasks (typically 4–8).

- [ ] **Step 5: Commit**

```bash
git add app/type-city/occupation/[slug]/orbital-builder.tsx \
        app/type-city/occupation/[slug]/neon-occupation.tsx
git commit -m "feat(type-city): slot OrbitalBuilder placeholder between anatomy and big-number"
```

---

## Task 5: Build the Phase 1 orbital selection UI

**Goal:** Replace the stub with the real selection phase — central core + two rotating orbits + clickable module nodes + live HUD in the core + footer status/CTA bar. No form or transmit yet; clicking the CTA just logs for now.

**Files:**
- Modify: `app/type-city/occupation/[slug]/orbital-builder.tsx` (full replacement)

- [ ] **Step 1: Write the full Phase-1 component**

Replace the entire contents of `app/type-city/occupation/[slug]/orbital-builder.tsx` with:

```tsx
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
// Top-level builder

export function OrbitalBuilder({
  moduleGroups,
  hourlyWage,
}: OrbitalBuilderProps) {
  const [sectionRef, seen] = useInView<HTMLElement>(0.2)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<Phase>("select")

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

        {/* Footer bar */}
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
```

- [ ] **Step 2: Update the page.tsx `ModuleGroup` export**

`orbital-builder.tsx` imports `ModuleGroup` from `./page`. Confirm the `export type ModuleGroup` line from Task 3 Step 1 is still present at the top of `app/type-city/occupation/[slug]/page.tsx`. If not, re-add it.

- [ ] **Step 3: Smoke-test in the browser**

Run: `npm run dev`
Open: `http://localhost:3000/type-city/occupation/software-developers`

Verify manually:
1. The orbital section appears between Agent Anatomy and Big-Number Moment.
2. The outer (dashed) ring rotates counter-clockwise slowly; the inner (solid) ring rotates clockwise faster.
3. The central core shows "your stack / 0 / min/day / $0/yr" initially.
4. All module nodes sit on the outer ring.
5. Clicking a module moves it inward: it snaps to an inner orbit position, glows brighter, and the core's min/day + $/yr count up to the new total.
6. Clicking it again returns it to the outer orbit.
7. The CTA button is disabled and dim until at least one module is docked. It breathes with a cyan glow when enabled.
8. Clicking the enabled CTA changes the "phase:" placeholder text at the bottom to "form".

- [ ] **Step 4: Commit**

```bash
git add app/type-city/occupation/[slug]/orbital-builder.tsx \
        app/type-city/occupation/[slug]/page.tsx
git commit -m "feat(type-city): orbital builder Phase 1 — core, orbits, module docking"
```

---

## Task 6: Add Phase 2 — compressed orbit + form slide-in

**Goal:** When the CTA is clicked, the orbit compresses to the left 30% (still rotating, still alive), and a dark-glass form panel slides in from the right 70% with team-size pills, custom requests, name, email, and a Transmit button.

**Files:**
- Modify: `app/type-city/occupation/[slug]/orbital-builder.tsx`

- [ ] **Step 1: Extend state and add the form panel**

In `orbital-builder.tsx`, within the `OrbitalBuilder` component body, add more state alongside the existing `selected` + `phase` state:

```tsx
const [teamSizeIndex, setTeamSizeIndex] = useState(0)
const [customRequests, setCustomRequests] = useState<string[]>([])
const [newRequest, setNewRequest] = useState("")
const [contactName, setContactName] = useState("")
const [contactEmail, setContactEmail] = useState("")
const [submitError, setSubmitError] = useState<string | null>(null)
```

- [ ] **Step 2: Compute team-size-scaled annual value**

Below the existing `annualValue` memo, add:

```tsx
const scaledAnnualValue = useMemo(
  () => annualValue * TEAM_SIZES[teamSizeIndex].multiplier,
  [annualValue, teamSizeIndex],
)
```

- [ ] **Step 3: Wrap the orbit visualization in a compressible container**

The existing `<div style={{ position: "relative", width: "min(820px, 100%)", aspectRatio: "1 / 1", margin: "0 auto 48px" }}>` block contains the whole orbit. Wrap it with a container that compresses when `phase !== "select"`:

```tsx
<div
  style={{
    display: "flex",
    flexDirection: phase === "select" ? "column" : "row",
    alignItems: "flex-start",
    gap: 32,
    transition: "all 600ms cubic-bezier(.2,1,.3,1)",
  }}
>
  <div
    style={{
      flex: phase === "select" ? "1 1 auto" : "0 0 30%",
      width: "100%",
      transform: phase === "select" ? "scale(1)" : "scale(0.75)",
      transformOrigin: "top left",
      transition: "all 600ms cubic-bezier(.2,1,.3,1)",
    }}
  >
    {/* existing orbit visualization div stays inside here */}
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
```

Remove the standalone footer bar + CTA button from the Phase-1 block when `phase !== "select"` — they're replaced by the form's Transmit button. Guard the existing footer with `{phase === "select" && ( ... )}`.

- [ ] **Step 4: Define `FormPanel` subcomponent**

Add to `orbital-builder.tsx`, above the main `OrbitalBuilder` export:

```tsx
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
        animation: "sunrise 600ms ease-out both",
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
```

- [ ] **Step 5: Smoke-test**

Run: `npm run dev`
Open: `http://localhost:3000/type-city/occupation/software-developers`

Verify:
1. Select 2–3 modules, click "Build my agent stack".
2. The orbit slides/compresses to the left and continues rotating.
3. The form panel slides in from the right with cyan-bordered inputs.
4. Click different team-size pills — the gradient value card updates with a count-up.
5. Type a custom request, press Enter → a chip appears. Click × on the chip → it disappears.
6. Type a name and email. The Transmit button enables when email is filled.
7. Clicking Transmit changes the "phase:" indicator text to "transmit" (the real wiring lands in Task 7).

- [ ] **Step 6: Commit**

```bash
git add app/type-city/occupation/[slug]/orbital-builder.tsx
git commit -m "feat(type-city): orbital builder Phase 2 — compressed orbit + form panel"
```

---

## Task 7: Phase 3 — submit, transmit sequence, done state

**Goal:** Wire `onSubmit` to `/api/inquiries`. On success, play a ~3-second build sequence: selected modules accelerate into the core, a radial particle burst fires, then the view resolves to a full-screen "TRANSMITTED." shimmer with the Calendly embed and mail fallback. On failure, roll back to `"form"` with `transmit-shake` + inline error.

**Files:**
- Modify: `app/type-city/occupation/[slug]/orbital-builder.tsx`

- [ ] **Step 1: Add submit handler**

Inside `OrbitalBuilder`, add above the `return (...)`:

```tsx
async function handleSubmit() {
  if (inner.length === 0) {
    setSubmitError("Dock at least one module before transmitting.")
    return
  }
  if (!contactEmail.trim()) {
    setSubmitError("Email is required so we can send your blueprint.")
    return
  }

  setSubmitError(null)
  setPhase("transmit")

  // Fire the inquiry immediately; animation runs in parallel for ~3s so the
  // user sees the spectacle even on a fast network. If the server responds
  // before the animation finishes, we still wait out the timeline.
  const minDuration = new Promise<void>((resolve) => setTimeout(resolve, 3000))

  const tierKey: "starter" | "recommended" | "enterprise" =
    inner.length <= 3 ? "starter" : inner.length <= 7 ? "recommended" : "enterprise"

  const selectedTaskIds = inner.flatMap((g) => g.taskIds)

  const fetchPromise = fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      occupationId,
      occupationTitle,
      occupationSlug: slug,
      selectedModules: inner.map((g) => g.moduleKey),
      selectedCapabilities: [],
      selectedTaskIds,
      customRequests,
      teamSize: TEAM_SIZES[teamSizeIndex].label,
      tierKey,
      displayedMinutes: totalMinutes,
      displayedAnnualValue: annualValue, // unscaled — matches what the core shows
      contactName,
      contactEmail,
      website: "", // honeypot
    }),
  })

  try {
    const [res] = await Promise.all([fetchPromise, minDuration])
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message =
        typeof body?.error === "string"
          ? body.error
          : "Transmission failed. Please try again."
      setSubmitError(message)
      setPhase("form")
      return
    }
    setPhase("done")
  } catch (err) {
    console.error("[orbital-builder] submit failed", err)
    setSubmitError("Transmission failed. Check your connection and try again.")
    setPhase("form")
  }
}
```

Update the `onSubmit` prop passed to `FormPanel` to use this handler:

```tsx
onSubmit={handleSubmit}
```

Also read `slug`, `occupationId`, `occupationTitle` from destructured props at the top of `OrbitalBuilder`:

```tsx
export function OrbitalBuilder({
  slug,
  occupationId,
  occupationTitle,
  hourlyWage,
  moduleGroups,
}: OrbitalBuilderProps) {
```

- [ ] **Step 2: Add `TransmitSequence` component**

Above the `OrbitalBuilder` export, add:

```tsx
function TransmitSequence({ colors }: { colors: string[] }) {
  const particleCount = 36

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(0,229,255,0.6) 40%, transparent 70%)",
          animation: "logo-pulse 1.5s ease-in-out infinite",
        }}
      />
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2
        const distance = 300 + Math.random() * 200
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        const color = colors[i % colors.length] ?? "#00E5FF"
        const delay = 1.5 + Math.random() * 0.3
        const duration = 1.2 + Math.random() * 0.4

        return (
          <div
            key={i}
            className="particle"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 12px ${color}`,
              transform: "translate(-50%, -50%)",
              animation: `particle-burst ${duration}s ease-out ${delay}s forwards`,
              "--burst-x": x,
              "--burst-y": y,
            } as CSSProperties & { "--burst-x": number; "--burst-y": number }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Add `DoneState` component**

Also above the `OrbitalBuilder` export, add:

```tsx
function DoneState({
  email,
  name,
}: {
  email: string
  name: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 40,
        padding: 48,
        borderRadius: 24,
        background: `linear-gradient(135deg, rgba(0,229,255,0.08), rgba(181,108,255,0.08))`,
        border: `1px solid ${NEON.cyan}55`,
        boxShadow: `0 20px 80px ${NEON.cyan}22`,
      }}
    >
      <h3
        style={{
          fontFamily: F.black,
          fontSize: "clamp(36px, 5vw, 64px)",
          color: "#fff",
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: 16,
        }}
      >
        Transmitted.
      </h3>
      <p
        style={{
          fontFamily: F.mono,
          fontSize: 14,
          color: "rgba(255,255,255,0.75)",
          letterSpacing: "0.05em",
          margin: "0 0 32px",
        }}
      >
        Your blueprint is en route to <strong style={{ color: NEON.cyan }}>{email}</strong>. Book a 30-min scoping call below whenever you&apos;re ready.
      </p>

      {/* Neon-framed Calendly embed — the CalendlyEmbed component is kept
       * unmodified; we just wrap it in our own container. */}
      <div
        style={{
          borderRadius: 20,
          padding: 4,
          background: `linear-gradient(135deg, ${NEON.cyan}66, ${NEON.purple}66)`,
          marginBottom: 16,
        }}
      >
        <div style={{ borderRadius: 18, overflow: "hidden", background: "#05060e" }}>
          <CalendlyEmbed
            prefill={{ email, name: name || undefined }}
          />
        </div>
      </div>

      <div
        style={{
          fontFamily: F.mono,
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.05em",
        }}
      >
        prefer email?{" "}
        <a
          href="mailto:hello@placetostand.co"
          style={{ color: NEON.cyan, textDecoration: "underline", textUnderlineOffset: 4 }}
        >
          hello@placetostand.co
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Import CalendlyEmbed and CONTACT, wire the mail fallback**

At the top of `orbital-builder.tsx`, add:

```ts
import { CalendlyEmbed } from "@/components/CalendlyEmbed"
import { CONTACT } from "@/lib/site"
```

In the `DoneState` component written in Step 3, replace the hardcoded `hello@placetostand.co` in both the `href` and the link text with `CONTACT.email`:

```tsx
<a
  href={`mailto:${CONTACT.email}`}
  style={{ color: NEON.cyan, textDecoration: "underline", textUnderlineOffset: 4 }}
>
  {CONTACT.email}
</a>
```

`DoneState` stays `{ email, name }` — `email` is the submitter's address shown inline in the "en route to ..." sentence; the site-wide fallback uses `CONTACT.email` directly without being a prop.

- [ ] **Step 5: Render transmit + done in the main JSX**

Inside the `<section id="orbital-builder">` JSX, replace the existing `{phase !== "select" && ...}` placeholder block at the bottom with:

```tsx
{phase === "transmit" && (
  <TransmitSequence colors={inner.map((g) => g.color)} />
)}

{phase === "done" && (
  <DoneState email={contactEmail} name={contactName} />
)}
```

During `phase === "transmit"`, the orbit is already compressed (from Phase 2 wrapper). The TransmitSequence is fixed-positioned so it overlays the entire viewport with the particle burst while the orbit continues to rotate underneath.

During `phase === "done"`, keep the compressed orbit visible too (don't hide it); the form panel is conditionally rendered via the `{(phase === "form" || phase === "transmit") && <FormPanel .../>}` guard from Task 6, so it disappears automatically when we reach "done". The DoneState replaces it visually.

- [ ] **Step 6: Smoke-test the happy path**

Run: `npm run dev`
Open: `http://localhost:3000/type-city/occupation/software-developers`

1. Select modules → Build my agent stack → fill email → Transmit.
2. For 3 seconds: orbit stays compressed, a particle burst blooms out from the center in the selected module colors.
3. After 3 seconds, the form panel is replaced by the "TRANSMITTED." card with the Calendly embed.
4. Confirm your email inbox receives the blueprint PDF (the existing `/api/inquiries` endpoint mails it — this is the same backend as the cream builder).

- [ ] **Step 7: Smoke-test the failure path**

In devtools, open Network → right-click `/api/inquiries` → Block request URL.

Try submitting again:
1. The phase should flip back to "form".
2. The Transmit button should shake once.
3. A magenta error message should appear below: "Transmission failed. Check your connection and try again." (or the server's error text if the server returned a 4xx).

Unblock the URL.

- [ ] **Step 8: Smoke-test guard rails**

1. With zero docked modules, the "Build my agent stack" button is disabled (unchanged from Task 5).
2. With modules docked but no email, the Transmit button is disabled.
3. Enter an invalid email like `foo` and click Transmit — the server rejects with "Please enter a valid email" (zod message); the magenta error displays it.

- [ ] **Step 9: Commit**

```bash
git add app/type-city/occupation/[slug]/orbital-builder.tsx
git commit -m "feat(type-city): orbital builder Phase 3 — transmit sequence + done state"
```

---

## Task 8: Accessibility pass

**Goal:** Match the spec's a11y requirements. Keyboard-navigable module nodes, live region for selection changes, visible focus outlines, and a reduced-motion pass that's functional even with zero rotation.

**Files:**
- Modify: `app/type-city/occupation/[slug]/orbital-builder.tsx`

- [ ] **Step 1: Add live region for selection announcements**

In `OrbitalBuilder`, add a state alongside the others:

```tsx
const [liveAnnouncement, setLiveAnnouncement] = useState("")
```

Update `toggle`:

```tsx
function toggle(moduleKey: string) {
  const group = moduleGroups.find((g) => g.moduleKey === moduleKey)
  setSelected((prev) => {
    const next = new Set(prev)
    const wasSelected = next.has(moduleKey)
    if (wasSelected) {
      next.delete(moduleKey)
      if (group) setLiveAnnouncement(`${group.label} module removed. Your stack has ${next.size} agents.`)
    } else {
      next.add(moduleKey)
      if (group) setLiveAnnouncement(`${group.label} module added, ${group.groupMinutes} minutes per day. Your stack has ${next.size} agents.`)
    }
    return next
  })
}
```

Add at the top of the section JSX (first child of `<section>`):

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
>
  {liveAnnouncement}
</div>
```

- [ ] **Step 2: Confirm keyboard flow works**

`<ModuleNode>` is already a `<button>` with `role="checkbox"` and `aria-checked` — native keyboard behavior applies (Tab to focus, Space or Enter to toggle). No extra work here, but verify manually (below).

- [ ] **Step 3: Focus ring already set**

`ModuleNode`'s `onFocus` handler sets a 3px colored ring + enhanced glow. Verify this renders on keyboard focus.

- [ ] **Step 4: Reduced-motion pass**

The keyframes from Task 2 already have a `@media (prefers-reduced-motion: reduce)` block that kills orbit rotation, particle animations, and the dock-pull. Confirm the inline `animation: seen ? "orbit-outer ..." : "none"` declarations on the ring divs use the CSS class names so the media query catches them:

Verify that the outer ring div has `className="orbit-outer-ring"` and the inner ring has `className="orbit-inner-ring"` (added in Task 5 Step 1). If any are missing, add them.

Verify the particle elements in `TransmitSequence` use `className="particle"` (added in Task 7 Step 2).

- [ ] **Step 5: Verify with Playwright**

Use the Playwright MCP tool to verify keyboard flow end-to-end on a real page.

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:3000/type-city/occupation/software-developers
mcp__plugin_playwright_playwright__browser_press_key → Tab (repeat until reaching the orbital section's first module)
mcp__plugin_playwright_playwright__browser_press_key → Space
mcp__plugin_playwright_playwright__browser_take_screenshot
```

Expected: focus ring visible on the focused node, pressing Space docks it, the visually hidden live region announces the change (verifiable via `browser_evaluate` reading `document.querySelector('[aria-live=polite]').textContent`).

- [ ] **Step 6: Verify reduced-motion**

macOS: System Settings → Accessibility → Display → Reduce motion ON.
Reload the page. Expected:
- Orbit rings no longer rotate.
- Clicking a module: transitions via opacity (dock-pull class has `animation: none` but `transition: opacity` in the reduced-motion block).
- Submitting: particles don't fly — they immediately fade to `opacity: 0`.
- Functional flow (select → form → submit → done) still works completely.

Turn reduce motion back off.

- [ ] **Step 7: Commit**

```bash
git add app/type-city/occupation/[slug]/orbital-builder.tsx
git commit -m "feat(type-city): orbital builder accessibility — live region, keyboard, reduced motion"
```

---

## Task 9: Full-flow Playwright verification + polish

**Goal:** Walk through the whole flow end-to-end on a real occupation page at the three responsive breakpoints the spec cares about. Capture screenshots. Note any polish gaps and fix them inline.

**Files:**
- Modify: `app/type-city/occupation/[slug]/orbital-builder.tsx` (only if polish fixes are needed)

- [ ] **Step 1: Navigate + run the happy path**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:3000/type-city/occupation/software-developers
mcp__plugin_playwright_playwright__browser_resize → 1440, 900
mcp__plugin_playwright_playwright__browser_evaluate → window.scrollTo(0, document.querySelector('#orbital-builder').offsetTop)
mcp__plugin_playwright_playwright__browser_take_screenshot → orbital-select.png
```

Click 3 outer nodes, wait for docking, screenshot:

```
mcp__plugin_playwright_playwright__browser_click → first module node
(wait 1000ms via browser_wait_for time)
mcp__plugin_playwright_playwright__browser_click → second module node
mcp__plugin_playwright_playwright__browser_click → third module node
mcp__plugin_playwright_playwright__browser_take_screenshot → orbital-docked.png
```

Click the CTA, screenshot the form:

```
mcp__plugin_playwright_playwright__browser_click → "Build my agent stack" button
(wait for the slide-in transition, ~700ms)
mcp__plugin_playwright_playwright__browser_take_screenshot → orbital-form.png
```

Fill and submit:

```
mcp__plugin_playwright_playwright__browser_fill_form → [
  { name: "email", value: "damonbodine@gmail.com" },
  { name: "name", value: "Damon" }
]
mcp__plugin_playwright_playwright__browser_click → "Transmit →"
(wait 3500ms)
mcp__plugin_playwright_playwright__browser_take_screenshot → orbital-done.png
```

Expected final state: "TRANSMITTED." headline visible, Calendly widget loaded.

- [ ] **Step 2: Test tablet (1024px) and narrow-tablet (768px)**

```
mcp__plugin_playwright_playwright__browser_resize → 1024, 768
mcp__plugin_playwright_playwright__browser_take_screenshot → orbital-1024.png

mcp__plugin_playwright_playwright__browser_resize → 768, 1024
mcp__plugin_playwright_playwright__browser_take_screenshot → orbital-768.png
```

At 768px the orbit will be smaller; nodes may crowd. Per the spec non-goals, mobile polish is a follow-up — but note any actual broken interactions (not just tight layouts) and fix them here.

- [ ] **Step 3: Edge cases**

1. **1 module docked** → does core HUD show reasonable numbers? does "1 agents" grammar look OK? If the singular matters enough to fix, change the status line to `{count} agent{count === 1 ? "" : "s"}`.
2. **All modules docked** → does the inner orbit still lay out cleanly? It may crowd with 10 nodes at innerRadius=200. If nodes overlap visibly, bump `innerRadius` to 220.
3. **Empty email, Transmit attempt** → button stays disabled; no network request fires.

- [ ] **Step 4: Check console errors**

```
mcp__plugin_playwright_playwright__browser_console_messages
```

Expected: no red errors. If any appear, fix them.

- [ ] **Step 5: Commit any polish fixes**

If Step 2 or 3 required code changes:

```bash
git add app/type-city/occupation/[slug]/orbital-builder.tsx
git commit -m "polish(type-city): orbital builder layout + edge-case handling"
```

If no changes were needed, skip this step.

---

## Self-Review Checklist

After completing all tasks, verify:

- [ ] **Spec coverage:**
  - Orbital selection (Phase 1) → Task 5 ✓
  - Core as live HUD → Task 5 ✓
  - Footer status + CTA → Task 5 ✓
  - Module dock/undock animation → Task 2 (keyframes) + Task 5 (transition) ✓
  - Form phase with orbit compression → Task 6 ✓
  - Team-size pills, custom requests, contact fields → Task 6 ✓
  - Transmit sequence (particle burst) → Task 7 ✓
  - Confirmation + Calendly + mail fallback → Task 7 ✓
  - Submission failure recovery → Task 7 ✓
  - Accessibility (aria-checked, keyboard, live region, reduced motion) → Task 8 ✓
  - No new dependencies → confirmed (all motion via CSS keyframes + React state) ✓

- [ ] **Type consistency:**
  - `ModuleGroup` defined in `page.tsx`, imported by `orbital-builder.tsx` (both use the same shape)
  - `Phase = "select" | "form" | "transmit" | "done"` is the only enum — consistent everywhere
  - `useInView` / `useCountUp` signatures unchanged from pre-refactor versions

- [ ] **No placeholders:** every step has runnable code, exact commands, and expected output.

---

## Non-goals (from spec)

- No per-task toggles in the orbital view — the cream `/occupation/[slug]` builder remains for task-level control.
- No changes to `/api/inquiries` or pricing math.
- No new animation library.
- No mobile-first polish — desktop breakpoints only in this plan.
