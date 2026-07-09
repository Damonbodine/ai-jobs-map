"use client"

import { ArrowRight, CheckCircle2 } from "lucide-react"
import { AGENCY } from "@/lib/site"
import { computeAnnualHours } from "@/lib/pricing"

export function TeamDone({
  email,
  totalPeople,
  totalMinutesPerDay,
}: {
  email: string
  totalPeople: number
  totalMinutesPerDay: number
}) {
  const hoursPerYear = computeAnnualHours(totalMinutesPerDay)
  return (
    <div className="space-y-8">
      <div role="status" aria-live="polite" className="border border-accent/30 bg-accent/5 p-6 flex items-start gap-4">
        <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">Your team blueprint is on its way.</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a PDF to <strong>{email}</strong> covering your {totalPeople}-person team
            ({hoursPerYear > 0 ? `~${hoursPerYear.toLocaleString()} hours reclaimed per year` : "full time-back breakdown"}).
            Start with an audit and we&apos;ll walk through the build together.
          </p>
        </div>
      </div>
      <div className="border border-border bg-card p-6">
        <h3 className="font-heading text-lg font-semibold mb-2">Ready to prove the numbers?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          These numbers are estimates. The audit proves them on your workflow —
          two weeks, a ranked build plan. Engagements run through {AGENCY.name}.
        </p>
        <a
          href={AGENCY.enquireUrl}
          className="inline-flex items-center justify-center gap-2 bg-cyan px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"
        >
          Start with an audit
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
