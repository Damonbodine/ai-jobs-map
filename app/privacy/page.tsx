import { FadeIn } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: `Privacy Policy — ${SITE.name}`,
  description: `How ${SITE.name} collects, uses, and protects your information.`,
}

const LAST_UPDATED = "April 6, 2026"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-sm max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              Summary
            </h2>
            <p>
              {SITE.name} is operated by {AGENCY.name}. We collect only the
              information you voluntarily give us through our contact form or
              occupation builder. We use it to respond to your inquiry. We
              don&apos;t sell it, we don&apos;t use it for advertising, and we keep it
              only as long as we need it to do business with you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              1. What we collect
            </h2>
            <p>We collect the following information, and only this:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Contact form submissions:</strong>{" "}
                your name, email address, optional company name, and your message.
              </li>
              <li>
                <strong className="text-foreground">Occupation builder submissions:</strong>{" "}
                the occupation you selected, the tasks and modules you toggled,
                your team size, any custom requests you typed, and your name
                and email.
              </li>
              <li>
                <strong className="text-foreground">Server logs:</strong>{" "}
                standard request metadata (IP address, user agent, timestamp,
                referring URL) retained for up to 30 days for security and
                debugging purposes.
              </li>
            </ul>
            <p className="mt-2">
              We do <em>not</em> use cookies for tracking, advertising, or
              analytics on this Site as of the &ldquo;Last updated&rdquo; date above.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              2. How we use it
            </h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>To respond to your inquiry or scoping request.</li>
              <li>
                To prepare a proposal, blueprint, or implementation plan for
                you.
              </li>
              <li>
                To send you relevant follow-up about your specific engagement.
                We do not send marketing newsletters from this Site.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              3. Who we share it with
            </h2>
            <p>
              We share your information only with the service providers we use
              to operate the Site:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Supabase</strong> — stores
                form submissions in an encrypted Postgres database.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> — delivers
                transactional email (confirmations, notifications).
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — hosts
                and serves the Site.
              </li>
            </ul>
            <p className="mt-2">
              Each of these providers processes data under their own terms and
              security controls. We do not sell your information to anyone,
              ever.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              4. How long we keep it
            </h2>
            <p>
              We keep form submissions for as long as it takes to respond to
              your inquiry and complete any engagement that follows. You can
              ask us to delete your data at any time by emailing{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              . We&apos;ll delete it within 30 days and confirm when it&apos;s done.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              5. Your rights
            </h2>
            <p>
              Depending on where you live, you may have rights under laws like
              GDPR (EU/UK) or CCPA (California) to access, correct, delete, or
              port your data. To exercise any of these rights, email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              . We&apos;ll respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              6. Security
            </h2>
            <p>
              We use industry-standard encryption in transit (HTTPS) and at
              rest (Supabase managed Postgres). No system is perfectly secure,
              but we take reasonable care to protect your information and will
              notify you promptly if we learn of a breach affecting your data.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              7. Children
            </h2>
            <p>
              This Site is not directed to children under 16, and we do not
              knowingly collect information from them. If you believe a child
              has submitted information to us, please email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>{" "}
              and we&apos;ll delete it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              8. Changes
            </h2>
            <p>
              We&apos;ll update this policy when our data practices change. The
              &ldquo;Last updated&rdquo; date at the top reflects the most recent change.
              For material changes, we&apos;ll note them on the homepage for at
              least 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              9. Contact
            </h2>
            <p>
              Questions about privacy? Email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              .
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  )
}
