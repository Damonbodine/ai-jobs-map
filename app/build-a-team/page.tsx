import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { decodeCart, encodeCart, type CartRow } from "@/lib/build-a-team/url-state"
import { findTemplate, TEMPLATES } from "@/lib/build-a-team/templates"
import {
  computeDepartmentTotals,
  type RoleData,
} from "@/lib/build-a-team/compute"
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
  if (cart.length > 0) {
    const supabase = createServerClient()
    const slugs = cart.map((r) => r.slug)
    const { data: occupations } = await supabase
      .from("occupations")
      .select("id, slug, title, hourly_wage")
      .in("slug", slugs)

    if (occupations && occupations.length > 0) {
      const occupationIds = occupations.map((o) => o.id)
      const [{ data: profiles }, { data: tasks }] = await Promise.all([
        supabase
          .from("occupation_automation_profile")
          .select("*")
          .in("occupation_id", occupationIds),
        supabase
          .from("job_micro_tasks")
          .select("*")
          .in("occupation_id", occupationIds),
      ])

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
        <Cart initialCart={cart} shareUrl={shareUrl} />
      </FadeIn>

      {totals && totals.rows.length > 0 ? (
        <FadeIn delay={0.2}>
          <Results totals={totals} />
        </FadeIn>
      ) : null}
    </div>
  )
}
