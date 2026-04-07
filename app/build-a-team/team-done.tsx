"use client"

import { CheckCircle2 } from "lucide-react"
import { CalendlyEmbed } from "@/components/CalendlyEmbed"
import { CONTACT } from "@/lib/site"

export function TeamDone({
  email,
  totalPeople,
  annualValue,
}: {
  email: string
  totalPeople: number
  annualValue: number
}) {
  return (
    <div className="space-y-8">
      <div role="status" aria-live="polite" className="rounded-2xl border border-accent/30 bg-accent/5 p-6 flex items-start gap-4">
        <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">Your team blueprint is on its way.</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a PDF to <strong>{email}</strong> covering your {totalPeople}-person team
            ({annualValue > 0 ? `$${Math.round(annualValue).toLocaleString()} in annual AI value` : "full ROI breakdown"}).
            Book a scoping call below and we&apos;ll walk through the build together.
          </p>
        </div>
      </div>
      <CalendlyEmbed prefill={{ email }} />
    </div>
  )
}
