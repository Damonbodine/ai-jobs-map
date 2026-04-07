import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { decodeCart, encodeCart, type CartRow } from "@/lib/build-a-team/url-state"
import { findTemplate, TEMPLATES } from "@/lib/build-a-team/templates"
import {
  computeDepartmentTotals,
  type RoleData,
} from "@/lib/build-a-team/compute"
import type { MicroTask } from "@/types"
import { getAllCapabilities } from "@/lib/capabilities"
import {
  computeDisplayedTimeback,
  estimateTaskMinutes,
  inferArchetypeMultiplier,
} from "@/lib/timeback"
import { computeAnnualValue } from "@/lib/pricing"
import { Cart } from "./cart"
import { Results } from "./results"
import { TemplatePicker } from "./template-picker"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Build a Team",
  description:
    "What would your team look like with AI? Pick the roles, set the headcounts, and see the compounded time-back instantly. For founders, COOs, and ops leads designing a new function.",
}

type SearchParams = {
  roles?: string
  template?: string
}

export default async function BuildATeamPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // Resolve cart from `?roles=` query, OR fall back to a template if
  // `?template=key` is set, OR start empty.
  const initialFromQuery = decodeCart(params.roles)
  const template = findTemplate(params.template)
  const cart: CartRow[] =
    initialFromQuery.length > 0
      ? initialFromQuery
      : template
      ? [...template.cart]
      : []

  // Fetch all occupations in the cart server-side.
  let totals: ReturnType<typeof computeDepartmentTotals> | null = null
  let roleTaskData: Array<{
    slug: string
    title: string
    occupationId: number
    hourlyWage: number | null
    tasks: Array<{
      id: number
      task_name: string
      displayLow: number
      displayHigh: number
      ai_impact_level: number | null
      ai_how_it_helps: string | null
      moduleKey: string
    }>
    displayedMinutes: number
    annualValue: number
  }> = []
  let capabilitiesByModule: Record<string, import("@/types").ModuleCapability[]> = {}

  if (cart.length > 0) {
    const supabase = createServerClient()
    const slugs = cart.map((r) => r.slug)
    const { data: occupations } = await supabase
      .from("occupations")
      .select("id, slug, title, hourly_wage")
      .in("slug", slugs)

    if (occupations && occupations.length > 0) {
      const occupationIds = occupations.map((o) => o.id)
      const [{ data: profiles }, { data: tasks }, capabilities] = await Promise.all([
        supabase
          .from("occupation_automation_profile")
          .select("*")
          .in("occupation_id", occupationIds),
        supabase
          .from("job_micro_tasks")
          .select("*")
          .in("occupation_id", occupationIds),
        getAllCapabilities(),
      ])

      capabilitiesByModule = capabilities

      const roleDataBySlug = new Map<string, RoleData>()
      for (const occ of occupations) {
        roleDataBySlug.set(occ.slug, {
          occupation: occ,
          profile:
            (profiles ?? []).find((p) => p.occupation_id === occ.id) ?? null,
          tasks: (tasks ?? []).filter((t) => t.occupation_id === occ.id),
        })
      }

      totals = computeDepartmentTotals(cart, roleDataBySlug)

      // Compute per-role task items with display-minute scaling
      for (const [slug, roleData] of roleDataBySlug) {
        const archetypeMultiplier = inferArchetypeMultiplier(roleData.profile)
        const aiTasks = roleData.tasks.filter(t => t.ai_applicable)
        const rawTotal = aiTasks.reduce((s, t) => s + estimateTaskMinutes(t) * archetypeMultiplier, 0)
        const { displayedMinutes } = computeDisplayedTimeback(roleData.profile, roleData.tasks, rawTotal)

        const taskItems = aiTasks.map(task => {
          const raw = estimateTaskMinutes(task) * archetypeMultiplier
          const share = rawTotal > 0 && displayedMinutes > 0
            ? Math.max(1, Math.round((raw / rawTotal) * displayedMinutes))
            : Math.max(1, Math.round(raw))
          const low = Math.max(1, Math.round(share * 0.78))
          const high = Math.max(low + 1, Math.round(share * 1.22))
          return {
            id: task.id,
            task_name: task.task_name,
            displayLow: low,
            displayHigh: high,
            ai_impact_level: task.ai_impact_level ?? null,
            ai_how_it_helps: task.ai_how_it_helps ?? null,
            moduleKey: (task as MicroTask & { module_key?: string }).module_key ?? "general",
          }
        })

        const occ = roleData.occupation
        roleTaskData.push({
          slug,
          title: occ.title,
          occupationId: occ.id,
          hourlyWage: occ.hourly_wage ?? null,
          tasks: taskItems,
          displayedMinutes,
          annualValue: computeAnnualValue(displayedMinutes, occ.hourly_wage),
        })
      }
    }
  }

  const shareUrl = cart.length > 0 ? `?roles=${encodeCart(cart)}` : null

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-3">
          BUILD A TEAM
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          What would your team look like with AI?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
          For founders, COOs, and ops leads designing the shape of a new
          function before hiring. Pick the roles, set the headcounts, and
          see the compounded time-back instantly. Share the link with your
          team — your URL is your scratchpad.
        </p>
      </FadeIn>

      {cart.length === 0 ? (
        <FadeIn delay={0.1}>
          <TemplatePicker templates={TEMPLATES} />
        </FadeIn>
      ) : null}

      <FadeIn delay={0.15}>
        <Cart
          initialCart={cart}
          shareUrl={shareUrl}
          roleTaskData={roleTaskData}
          capabilitiesByModule={capabilitiesByModule}
        />
      </FadeIn>

      {totals && totals.rows.length > 0 ? (
        <FadeIn delay={0.2}>
          <Results totals={totals} />
        </FadeIn>
      ) : null}
    </div>
  )
}
