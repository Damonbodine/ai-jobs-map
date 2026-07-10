import { Suspense } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { FadeIn } from "@/components/FadeIn"
import { ContactForm } from "./contact-form"
import { AGENCY, CONTACT } from "@/lib/site"

export const metadata = {
  title: "Contact",
  description: `Engagements run through ${AGENCY.name}. Start with an audit, or send a note about the workflow you'd like to automate.`,
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <FadeIn>
        <p className="eyebrow mb-3">
          {AGENCY.name}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
          Timeback is the free diagnostic. When you&apos;re ready to prove the
          numbers on your own workflow, the next step runs through{" "}
          {AGENCY.name}.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-xl font-semibold tracking-tight mb-2">
            Engagements run through {AGENCY.name}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            The numbers here are estimates by design. The audit proves them on
            your actual workflow — two weeks, a ranked build plan.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={AGENCY.auditUrl}
              className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary"
            >
              How the audit works
            </a>
            <a
              href={AGENCY.enquireUrl}
              className="inline-flex items-center justify-center gap-2 bg-cyan px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"
            >
              Start with an audit
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.25}>
        <div className="mt-14 pt-10 border-t border-border max-w-2xl">
          <h2 className="font-heading text-xl font-semibold tracking-tight mb-2">
            Prefer to send a note?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Tell us about your team and the workflow you&apos;d like to
            automate. We reply within one business day — usually much faster.
          </p>
          <Suspense fallback={<div className="h-96" />}>
            <ContactForm />
          </Suspense>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="mt-12 pt-8 border-t border-border flex items-center gap-3 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 text-accent" />
          <span>
            Prefer email?{" "}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-foreground hover:text-accent transition-colors"
            >
              {CONTACT.email}
            </a>
          </span>
        </div>
      </FadeIn>
    </div>
  )
}
