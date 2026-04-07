"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Loader2, CheckCircle2, X } from "lucide-react"
import { onePagerSchema } from "@/lib/validation/one-pager"

type Status = "idle" | "submitting" | "success" | "error"

export function OnePagerButton({
  occupationSlug,
  occupationTitle,
}: {
  occupationSlug: string
  occupationTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  // Escape closes the dialog, autofocus the email input on open,
  // restore focus to the trigger on close, and lock body scroll while
  // the modal is open. These are the standard a11y dialog behaviors
  // expected by screen readers and keyboard users.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = "hidden"
    // Defer focus to next tick so the input has actually mounted.
    const id = window.setTimeout(() => emailInputRef.current?.focus(), 0)
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
      // Restore focus to whatever opened the dialog (typically the
      // trigger button).
      previouslyFocused?.focus?.()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setFieldError(null)

    const parsed = onePagerSchema.safeParse({
      email,
      occupationSlug,
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
      const res = await fetch("/api/one-pager", {
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
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => {
          setOpen(true)
          setStatus("idle")
          setEmail("")
          setErrorMessage(null)
          setFieldError(null)
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download One-Pager
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="one-pager-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="text-center py-4"
              >
                <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
                <h3
                  id="one-pager-title"
                  className="font-heading text-lg font-semibold mb-2"
                >
                  On its way.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Check your inbox in the next minute or two for the one-pager
                  PDF. Share it freely &mdash; it&apos;s built for that.
                </p>
              </div>
            ) : (
              <>
                <h3
                  id="one-pager-title"
                  className="font-heading text-lg font-semibold mb-1"
                >
                  Download the {occupationTitle} one-pager
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  We&apos;ll email you a shareable PDF with the top automation
                  opportunities and time-back potential for this role.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="one-pager-email"
                      className="block text-sm font-medium text-foreground"
                    >
                      Email
                    </label>
                    <input
                      id="one-pager-email"
                      ref={emailInputRef}
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={fieldError ? true : undefined}
                      aria-describedby={
                        fieldError ? "one-pager-email-error" : undefined
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
                    />
                    {fieldError ? (
                      <p
                        id="one-pager-email-error"
                        className="text-xs text-destructive"
                      >
                        {fieldError}
                      </p>
                    ) : null}
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
                      "Email me the one-pager"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
