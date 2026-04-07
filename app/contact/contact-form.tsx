"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { contactFormSchema } from "@/lib/validation/contact"

type Status = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "company" | "message", string>>
  >({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""), // honeypot
    }

    // Client-side preflight — fast feedback. Server revalidates authoritatively.
    const parsed = contactFormSchema.safeParse(data)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setFieldErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        company: flat.company?.[0],
        message: flat.message?.[0],
      })
      setStatus("idle")
      return
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setErrorMessage(
            "Too many requests. Please try again in a few minutes."
          )
        } else if (body?.issues) {
          setFieldErrors({
            name: body.issues.name?.[0],
            email: body.issues.email?.[0],
            company: body.issues.company?.[0],
            message: body.issues.message?.[0],
          })
        } else {
          setErrorMessage(
            body?.error ||
              "Something went wrong on our end. Please email us directly."
          )
        }
        setStatus("error")
        return
      }

      setStatus("success")
    } catch {
      setErrorMessage(
        "Network error. Please check your connection and try again."
      )
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center"
      >
        <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" />
        <h2 className="font-heading text-xl font-semibold mb-2">
          Message received
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Thanks for reaching out. We read every message personally and will
          get back to you within one business day — usually much faster.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot — hidden from humans, irresistible to bots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Website (leave empty)
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <Field
        label="Your name"
        name="name"
        type="text"
        required
        autoComplete="name"
        error={fieldErrors.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        error={fieldErrors.email}
      />
      <Field
        label="Company (optional)"
        name="company"
        type="text"
        autoComplete="organization"
        error={fieldErrors.company}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground"
        >
          What are you trying to build?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          minLength={10}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={
            fieldErrors.message ? "contact-message-error" : undefined
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
          placeholder="Tell us about your team, the workflow you'd like to automate, and any constraints we should know about."
        />
        {fieldErrors.message ? (
          <p
            id="contact-message-error"
            className="text-xs text-destructive"
          >
            {fieldErrors.message}
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
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
  error,
}: {
  label: string
  name: string
  type: string
  required?: boolean
  autoComplete?: string
  error?: string
}) {
  const inputId = `contact-${name}`
  const errorId = `${inputId}-error`
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
