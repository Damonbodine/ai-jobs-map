"use client"

import Link from "next/link"
import { useState } from "react"
import { Mail, Check, ArrowRight } from "lucide-react"
import { AGENCY } from "@/lib/site"
import { track } from "@/lib/analytics"

type Props = {
  taskDescription: string
  occupationContext?: string
  generationId?: string
}

type Status = "idle" | "submitting" | "success" | "error"

export function EmailCaptureCard({ taskDescription, occupationContext, generationId }: Props) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus("submitting")
    setErrorMessage("")

    try {
      const response = await fetch("/api/demo/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          taskDescription,
          occupationContext,
          generationId,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Couldn't save that right now.")
      }

      setStatus("success")
      track("demo_lead_captured", { source: "demo_try" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error."
      setErrorMessage(message)
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-3">
        <div className="border border-success/30 bg-success/10 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-success flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-background" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success">
              Sent — check {email}.
            </p>
            <p className="text-xs text-success/90 mt-0.5">
              Your agent demo summary is on its way, and we&apos;ll follow up
              personally within a day.
            </p>
          </div>
        </div>

        <div className="border border-border bg-card px-5 py-4">
          <p className="text-sm font-semibold text-foreground mb-2">
            Rolling this out for a team?
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/build-a-team"
              className="inline-flex items-center justify-center gap-1.5 border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Plan my whole team
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href={AGENCY.enquireUrl}
              className="inline-flex items-center justify-center gap-1.5 bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
            >
              Start with an audit
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border bg-muted/20 px-5 py-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Want this in your inbox?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We&apos;ll send a summary of this agent — what it does, the minutes
            it saves, and how we&apos;d build it. No spam.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          disabled={status === "submitting"}
          className="flex-1 border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "submitting" || !email.trim()}
          className="bg-cyan px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send it"}
        </button>
      </form>

      {status === "error" && errorMessage && (
        <p className="text-xs text-destructive mt-2">{errorMessage}</p>
      )}
    </div>
  )
}
