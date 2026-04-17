"use client"

import { useState } from "react"
import { Mail, Check } from "lucide-react"

type Props = {
  taskDescription: string
  occupationContext?: string
}

type Status = "idle" | "submitting" | "success" | "error"

export function EmailCaptureCard({ taskDescription, occupationContext }: Props) {
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
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Couldn't save that right now.")
      }

      setStatus("success")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error."
      setErrorMessage(message)
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <Check className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Got it — we&apos;ll be in touch.
          </p>
          <p className="text-xs text-emerald-800 mt-0.5">
            We&apos;ll send a custom one-pager for this task to {email} within a day.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Want a custom PDF report for this task?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drop your email — we&apos;ll send a one-pager sized for your workflow. No spam.
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
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "submitting" || !email.trim()}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send it"}
        </button>
      </form>

      {status === "error" && errorMessage && (
        <p className="text-xs text-red-700 mt-2">{errorMessage}</p>
      )}
    </div>
  )
}
