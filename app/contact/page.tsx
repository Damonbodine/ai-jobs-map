import { Suspense } from "react"
import { Mail } from "lucide-react"
import { FadeIn } from "@/components/FadeIn"
import { BookingEmbed } from "@/components/BookingEmbed"
import { ContactForm } from "./contact-form"
import { AGENCY, CONTACT } from "@/lib/site"

export const metadata = {
  title: "Book a Call",
  description: `Book a 30-minute scoping call with ${AGENCY.name}, or send a note about the workflow you'd like to automate.`,
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          {AGENCY.name}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
          Grab 30 minutes — we&apos;ll scope the workflow you want to automate,
          no pitch. You&apos;ll leave with an honest take on whether this is
          something we can help with.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <section id="book" className="scroll-mt-20">
          <BookingEmbed />
        </section>
      </FadeIn>

      <FadeIn delay={0.25}>
        <div className="mt-14 pt-10 border-t border-border max-w-2xl">
          <h2 className="font-heading text-xl font-semibold tracking-tight mb-2">
            Not ready to book?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Tell us about your team and the workflow you&apos;d like to
            automate instead. We reply within one business day — usually much
            faster.
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
