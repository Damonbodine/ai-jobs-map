"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CheckCircle2, X } from "lucide-react"
import { buildATeamPdfSchema } from "@/lib/validation/build-a-team"
import type { CartRow } from "@/lib/build-a-team/url-state"

type Status = "idle" | "submitting" | "success" | "error"

export function PdfModal({
  cart,
  onClose,
}: {
  cart: CartRow[]
  onClose: () => void
}) {
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [teamLabel, setTeamLabel] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = "hidden"
    const id = window.setTimeout(() => emailInputRef.current?.focus(), 0)
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setFieldError(null)

    const parsed = buildATeamPdfSchema.safeParse({
      cart,
      email,
      teamLabel: teamLabel || undefined,
      website: "",
    })
    if (!parsed.success) {
      setFieldError(
        parsed.error.flatten().fieldErrors.email?.[0] ??
          "Please enter a valid email address."
      )
      setStatus("idle")
      return
    }

    try {
      const res = await fetch("/api/build-a-team/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setErrorMessage("Too many requests. Please try again shortly.")
        } else if (body?.issues?.email) {
          setFieldError(body.issues.email[0])
        } else {
          setErrorMessage(
            body?.error ?? "Something went wrong. Please email us directly."
          )
        }
        setStatus("error")
        return
      }
      setStatus("success")
    } catch {
      setErrorMessage("Network error. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "success" ? (
          <div role="status" aria-live="polite" className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
            <h3
              id="pdf-modal-title"
              className="font-heading text-lg font-semibold mb-2"
            >
              On its way.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Check your inbox in the next minute or two for the department
              blueprint PDF.
            </p>
          </div>
        ) : (
          <>
            <h3
              id="pdf-modal-title"
              className="font-heading text-lg font-semibold mb-1"
            >
              Email me the department blueprint
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              We&apos;ll email you a branded PDF with the compounded math for
              the team you just built.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="pdf-modal-email"
                  className="block text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="pdf-modal-email"
                  ref={emailInputRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={
                    fieldError ? "pdf-modal-email-error" : undefined
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
                />
                {fieldError ? (
                  <p
                    id="pdf-modal-email-error"
                    className="text-xs text-destructive"
                  >
                    {fieldError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pdf-modal-label"
                  className="block text-sm font-medium text-foreground"
                >
                  Team label{" "}
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="pdf-modal-label"
                  type="text"
                  value={teamLabel}
                  onChange={(e) => setTeamLabel(e.target.value)}
                  placeholder='e.g. "Acme Health ops team"'
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                />
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Email me the PDF"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
