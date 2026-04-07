"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { TEAM_SIZES, computeDynamicPrice } from "@/lib/pricing"

export function TeamContactForm({
  totalModules,
  onSubmit,
  onBack,
}: {
  totalModules: number
  onSubmit: (data: {
    contactName: string
    contactEmail: string
    teamSizeLabel: string
    tierKey: string
    customRequests: string[]
  }) => Promise<void>
  onBack: () => void
}) {
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [teamSizeIndex, setTeamSizeIndex] = useState(0)
  const [customRequests, setCustomRequests] = useState<string[]>([])
  const [newRequest, setNewRequest] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const tier = computeDynamicPrice(totalModules)

  function addRequest() {
    const t = newRequest.trim()
    if (!t) return
    setCustomRequests(p => [...p, t])
    setNewRequest("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)
    if (!contactEmail.trim()) {
      setEmailError("Email is required.")
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        contactName,
        contactEmail: contactEmail.trim().toLowerCase(),
        teamSizeLabel: TEAM_SIZES[teamSizeIndex]?.label ?? "",
        tierKey: tier.key,
        customRequests,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div>
        <h2 className="font-heading text-lg font-semibold">Request your team assistant plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send a PDF blueprint and follow up to scope the build.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Team size */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            How many people total will use AI assistants?
          </label>
          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.map((size, i) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setTeamSizeIndex(i)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  i === teamSizeIndex
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-secondary"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="team-contact-name" className="block text-sm font-medium text-foreground">
            Name <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <input
            id="team-contact-name"
            type="text"
            autoComplete="name"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="team-contact-email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="team-contact-email"
            type="email"
            required
            autoComplete="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "team-email-error" : undefined}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
          />
          {emailError && (
            <p id="team-email-error" className="text-xs text-destructive">{emailError}</p>
          )}
        </div>

        {/* Custom requests */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Anything specific you want to flag? <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequest}
              onChange={e => setNewRequest(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRequest() } }}
              placeholder="e.g. HIPAA compliance needed"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
            <button type="button" onClick={addRequest} className="px-3 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {customRequests.length > 0 && (
            <ul className="space-y-1.5 mt-2">
              {customRequests.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-secondary/30 rounded-lg px-3 py-1.5">
                  <span className="flex-1">{req}</span>
                  <button type="button" onClick={() => setCustomRequests(p => p.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : "Send me the team blueprint →"}
          </button>
        </div>
      </form>
    </div>
  )
}
