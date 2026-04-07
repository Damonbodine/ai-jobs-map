import { Mail } from "lucide-react"
import { FadeIn } from "@/components/FadeIn"
import { ContactForm } from "./contact-form"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: "Contact",
  description: `Talk to ${AGENCY.name} about building an AI system for your team. We read every message personally.`,
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          {AGENCY.name}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Tell us about your team and the workflow you&apos;d like to automate.
          We&apos;ll reply within one business day — usually much faster — with
          an honest take on whether this is something we can help with.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <ContactForm />
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
