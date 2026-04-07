import { FadeIn } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE.name}, a project by ${AGENCY.name}.`,
}

const LAST_UPDATED = "April 6, 2026"

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-sm max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              1. Who we are
            </h2>
            <p>
              {SITE.name} (&ldquo;the Site&rdquo;) is operated by {AGENCY.name} (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;). The Site provides task-level AI automation research based
              on publicly available occupational data (Bureau of Labor
              Statistics, O*NET) and is offered as a lead-generation and
              research tool for our custom AI implementation services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              2. Acceptable use
            </h2>
            <p>
              You agree to use the Site only for lawful purposes. You will not:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                Scrape, crawl, or bulk-download the Site&apos;s content for
                commercial redistribution.
              </li>
              <li>
                Attempt to reverse engineer, probe, or disrupt the Site&apos;s
                infrastructure.
              </li>
              <li>
                Submit false, misleading, or abusive content through any form
                on the Site.
              </li>
              <li>
                Use the Site to build, train, or fine-tune any AI model
                without written permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              3. The information we provide is research, not advice
            </h2>
            <p>
              Time-back estimates, occupation scores, and AI capability
              recommendations on the Site are research outputs derived from
              public datasets and our own analysis. They are intended as a
              starting point for conversation, not as professional, legal,
              financial, or employment advice. Actual results depend on your
              specific workflow, team, tooling, and implementation quality.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              4. Your submissions
            </h2>
            <p>
              When you submit the contact form or the occupation builder, you
              give us permission to contact you about your inquiry and to use
              the information you submitted to prepare a response or proposal.
              We will not publicly share what you submitted without your
              permission. See our{" "}
              <a href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </a>{" "}
              for details on data handling.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              5. Intellectual property
            </h2>
            <p>
              The Site&apos;s design, code, analysis, and written content are
              owned by {AGENCY.name} unless otherwise noted. Underlying
              occupational data is sourced from public government datasets and
              is used in accordance with their respective terms. You may share
              links to Site pages and quote short excerpts with attribution.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              6. No warranty
            </h2>
            <p>
              The Site is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis. We
              make no warranties, express or implied, about the accuracy,
              completeness, or fitness of the Site&apos;s content for any
              particular purpose. To the fullest extent permitted by law, we
              disclaim all liability for damages arising from your use of the
              Site.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              7. Changes
            </h2>
            <p>
              We may update these Terms from time to time. The &ldquo;Last updated&rdquo;
              date at the top of this page reflects the most recent change.
              Continued use of the Site after an update constitutes acceptance
              of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              8. Contact
            </h2>
            <p>
              Questions about these Terms? Email us at{" "}
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
