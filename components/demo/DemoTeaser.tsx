import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { computeDemoRoles } from "@/lib/demo/compute-demo"

export async function DemoTeaser() {
  let roles
  try {
    roles = await computeDemoRoles()
  } catch {
    return null
  }

  if (!roles.length) return null

  const defaultRole = roles[0]
  const minutesSaved = defaultRole.totalBeforeMinutes - defaultRole.totalAfterMinutes

  return (
    <section className="border border-border rounded-2xl overflow-hidden bg-muted/10">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">See it working</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            One role. Full agent suite. A complete workday.
          </p>
        </div>
        <Link
          href="/demo"
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
        >
          See full demo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Role tabs (static, all link to /demo) */}
      <div className="flex gap-1.5 px-4 pt-3">
        {roles.map((role, i) => (
          <Link
            key={role.slug}
            href="/demo"
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              i === 0
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            {role.displayName}
          </Link>
        ))}
      </div>

      {/* Agent list */}
      <div className="px-4 py-3">
        <div className="flex flex-col divide-y divide-border">
          {defaultRole.agents.map((agent) => (
            <div key={agent.moduleKey} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: agent.accentColor }}
                />
                <div>
                  <span className="text-xs font-bold text-foreground">{agent.agentName}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{agent.label}</span>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-success dark:text-success">
                {agent.beforeMinutes} min → {agent.afterMinutes} min
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stat + CTA */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-accent/10 dark:bg-accent/20 rounded-xl p-3 border border-accent/20 dark:border-accent/20">
          <div>
            <div className="text-lg font-black text-accent dark:text-accent/70">
              {minutesSaved} min/day
            </div>
            <div className="text-[9px] text-accent dark:text-accent/80">
              ${defaultRole.annualValueDollars.toLocaleString()}/yr per person
            </div>
          </div>
          <Link
            href="/demo"
            className="flex items-center gap-1.5 text-xs font-bold bg-accent text-white rounded-full px-4 py-2 hover:bg-accent/90 transition-colors"
          >
            See full demo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}
