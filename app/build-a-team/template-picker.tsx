import Link from "next/link"
import type { Template } from "@/lib/build-a-team/templates"

export function TemplatePicker({ templates }: { templates: readonly Template[] }) {
  return (
    <div className="mb-12">
      <h2 className="font-heading text-lg font-semibold mb-3">
        Start from a template
      </h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Pick a starting team that&apos;s close to what you&apos;re planning, then
        edit the roles and counts to match your reality.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {templates.map((tpl) => (
          <Link
            key={tpl.key}
            href={`/build-a-team?template=${tpl.key}`}
            className="block rounded-2xl border border-border bg-card p-5 hover:border-accent/40 hover:bg-accent/5 transition-colors"
          >
            <h3 className="font-heading text-base font-semibold mb-1">
              {tpl.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {tpl.blurb}
            </p>
            <p className="text-xs text-muted-foreground">
              {tpl.cart.length} role
              {tpl.cart.length === 1 ? "" : "s"} ·{" "}
              {tpl.cart.reduce((sum, r) => sum + r.count, 0)} people
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
