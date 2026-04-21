# Neon Orbital Builder — Design Spec

**Date:** 2026-04-19
**Owner:** Damon / Place To Stand
**Status:** Approved — ready for implementation plan

## Context

The Type City neon prototype (`/type-city/occupation/[slug]`, shipped 2026-04-19) currently has five sections but stops short of the builder — the interactive tool on the cream `/occupation/[slug]` page where users pick which assistant modules they want, enter contact info, and request a blueprint. This spec defines a neon replacement for that builder, placed inline on the same prototype page, with substantially heavier motion than the homepage prototype.

The user request was: *"rebuild the interactive builder to match this theme. maybe we could even change the complexity of the animations to make it pop more."* Intent is spectacle + preserved functionality.

## Interaction Metaphor — Orbital Assembly

Chosen from three directions (circuit-board, orbital-assembly, kinetic-stacking). Orbital assembly won because:

- It callbacks visually to the Agent Anatomy section on the same page (central pulsing core surrounded by agent nodes) — reinforces a consistent mental model.
- Magnetic docking + orbital physics give us real motion spectacle without a new animation library.
- "All modules orbit one core" maps cleanly to *"this is your custom agent."*

## Granularity — Module-level only

No per-task toggles in the orbital view. The cream `/occupation/[slug]` builder remains available for users who want task-level control. The neon prototype leans into decisiveness: ~6–8 module nodes, pick what you want, go. This keeps the orbit crisp — one ring, not nested.

## User Flow

### Phase 1 — Orbital selection

Full-width dark section, ~85vh, placed between Task Rail and Big-Number Moment.

**Layout:**
- Central "agent core" — scaled-up version of the pulsing core from the Anatomy section
- Two concentric orbits:
  - Outer (dashed, dim, slow counter-clockwise): unselected modules
  - Inner (solid, bright, faster clockwise): selected modules in their neon color
- Each module node: ~140px circle, neon-colored border, module label (Archivo Black), minutes saved, task count. Module colors come from a neon-mapped version of the existing `MODULE_ACCENTS` palette (cream-theme values like `#06b6d4` upgraded to pure neon `#00E5FF` etc. — preserving the module→color associations users already see elsewhere).

**Interactions:**
- Click outer node → detaches from outer orbit, flies inward on a curved magnetic path (~800ms eased), flashes as it docks, joins inner orbit
- Click inner node → kicks back out with a brief flicker, rejoins outer orbit
- Each dock sends a brief "power-surge" pulse along a trace from the docked module back to the core
- Hover on any node: scale +~5%, glow intensifies
- Core brightness scales with the number of docked modules (visual feedback on the selection set)

**Core as live HUD:**
Inside the central core, live-updating numbers with count-up animation on every change:
- Big `{min}/day`
- Smaller `${value}/yr` below

No separate totals panel — the core IS the receipt.

**Footer bar:**
Below the orbit:
- Status line: `{N} agents · {M} min/day · ${V}/yr`
- CTA button: **"BUILD MY AGENT STACK →"** (glowing, breathing)

Sticky variant of the footer appears when scrolling past the orbit.

### Phase 2 — Form capture

Clicking the CTA: the orbit compresses and slides to the left ~30% of the viewport at reduced scale, still rotating. Form slides up from the right ~70% as a dark glass panel. Orbit stays alive in its compressed state so the page never goes static.

**Form contents (all neon styling — glowing borders, mono labels):**
- Heading: *"Assembly protocol"* (Fraunces italic)
- Subtitle: "What do we send you?"
- Team-size segmented control: neon pills (1 person / 2–5 / 6–20 / 20+), glow on select, updates value card live
- Live value card: gradient number count-up reflecting team-size-scaled annual value
- Custom requests: glowing input with ripple border on focus, added items appear as chips
- Name + email inputs: neon outline, glow on focus
- Submit button: **"TRANSMIT →"** — massive glowing pill

### Phase 3 — Transmit + Confirmation

Maps to two internal states: `"transmit"` (the 3-second animation sequence) and `"done"` (the final state showing the Calendly embed). User experience is one continuous moment.

~3-second build sequence on submit:

| t     | Event |
|-------|-------|
| 0.0s  | Transmit button pulses and fades |
| 0.3s  | Selected modules accelerate inward, slam into the core one-by-one with a light pulse each |
| 1.5s  | Core detonates a radial particle burst in module colors |
| 2.2s  | Particles resolve into full-screen shimmer showing: |
|       |   – "TRANSMITTED." (huge Archivo Black) |
|       |   – "Your blueprint is en route to `{email}`." (mono) |
|       |   – Neon-framed Calendly embed |
|       |   – Mail link fallback |

## Architecture

### Files

**New:**
- `app/type-city/occupation/[slug]/orbital-builder.tsx` — client component (~700 lines). Contains OrbitalBuilder + subcomponents (OrbitCore, ModuleNode, TotalsFooter, FormPanel, TransmitSequence, DoneState).

**Modified:**
- `app/type-city/occupation/[slug]/page.tsx` — compute module-group data (mirrors the `assistantGroups` shape from `occupation-builder.tsx`), pass to neon-occupation
- `app/type-city/occupation/[slug]/neon-occupation.tsx` — import `OrbitalBuilder`, render between `TaskRail` and `BigNumberMoment`, pass props
- `app/type-city/type-city.css` — add keyframes: `orbit-outer`, `orbit-inner`, `dock-pull`, `transmit-shake`, `particle-burst`

**Reused unchanged:**
- `/api/inquiries` POST endpoint
- `TEAM_SIZES`, `computeAnnualValue`, `computeDynamicPrice`, `MODULE_REGISTRY`
- `CalendlyEmbed` component (wrapped in a neon frame)

### State

```ts
type Phase = "select" | "form" | "transmit" | "done"

// Inside OrbitalBuilder:
const [selected, setSelected] = useState<Set<string>>(...)   // module keys
const [phase, setPhase] = useState<Phase>("select")
const [teamSizeIndex, setTeamSizeIndex] = useState(0)
const [customRequests, setCustomRequests] = useState<string[]>([])
const [newRequest, setNewRequest] = useState("")
const [contactName, setContactName] = useState("")
const [contactEmail, setContactEmail] = useState("")
const [submitting, setSubmitting] = useState(false)
const [submitError, setSubmitError] = useState<string | null>(null)
```

### Data contract

Server `page.tsx` passes an array to `OrbitalBuilder`:

```ts
type ModuleGroup = {
  moduleKey: string            // 'intake' | 'analysis' | ...
  label: string                // display name from MODULE_REGISTRY
  description: string
  color: string                // neon accent assigned at module level
  taskCount: number
  groupMinutes: number         // summed task minutes for this module
  taskIds: number[]            // for the submission payload
}
```

Selection set is `Set<moduleKey>`. Submission sends all `taskIds` from selected modules plus the usual contact/tier payload.

### Dependencies

No new npm packages. Motion is CSS keyframes + React state + CSS transitions, matching existing Type City pattern. `useInView` and `useCountUp` hooks currently in `neon-occupation.tsx` may be lifted into `app/type-city/_lib/motion.ts` if needed by both files.

### Error handling

- **Submission failure:** Transmit button plays `transmit-shake` keyframe, mono-red error text appears below the form, phase stays in `"form"` so the user can retry.
- **Empty selection:** Transmit disabled; orbit shows a pulsing hint label near the CTA ("Select at least one assistant").
- **Email required:** inline validation, Transmit disabled until filled.
- **Offline:** subtle warning chip above the Transmit button, button disabled.

### Accessibility

- Module nodes: `role="checkbox"`, `aria-checked`, `aria-label` with module name and minutes
- Keyboard: tab through nodes, space/enter toggle
- Form: proper `<label>` associations, required fields marked
- Screen reader: live region announces selection changes ("Analysis module added, 36 minutes per day")
- `prefers-reduced-motion`: disables orbital rotation, dock-pull uses opacity fade instead of magnetic arc, particle burst becomes a single static flash. Functional interactions still work.
- Focus: visible outlines on all interactive elements (colored ring matching the module/accent)

### Testing

- **Manual via Playwright:** verify each phase transition, full submission flow (dev hits real `/api/inquiries`), Calendly render
- **Edge cases:** 1 module selected, all modules selected, empty submission attempt, network failure on submit (simulate), pre-filled email
- **Keyboard:** complete the entire flow using only the keyboard
- **Reduced motion:** toggle the macOS/browser setting and verify rotation stops + dock transitions simplify
- **Responsive:** verify layout at 1440px, 1024px, 768px breakpoints (prototype can skip mobile polish per Type City conventions)

## Non-goals

- No per-task toggle in the orbital view (cream builder covers that need).
- No changes to `/api/inquiries` or pricing math.
- No new animation library (Framer Motion, motion, etc.) — CSS + state only.
- No mobile-first polish (prototype is desktop-evaluated; responsive breakpoints land in a follow-up if promoted to `/`).

## Open questions for implementation plan

- Should `useInView` / `useCountUp` be lifted into a shared `_lib/motion.ts` now, or left inline and deduped only if a third consumer arrives?
- Particle burst — can we do it cleanly with a ~30-particle CSS-animated div grid, or do we reach for a small canvas? CSS first, escalate to canvas only if visual quality suffers.
