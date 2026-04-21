import Link from "next/link"
import { Shield, Lock, Server, Database, FileCheck, AlertCircle } from "lucide-react"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: "Trust & Security",
  description: `How ${AGENCY.name} handles data, LLM interactions, and security during AI implementation engagements.`,
}

const LAST_UPDATED = "April 6, 2026"

const PILLARS = [
  {
    icon: Lock,
    title: "Your data stays yours",
    body: "We never use client data to train models. Every engagement runs on enterprise LLM endpoints with zero-retention agreements, or on client-hosted models (Bedrock, Azure OpenAI, self-hosted) when regulatory requirements demand it.",
  },
  {
    icon: Server,
    title: "Infrastructure you can audit",
    body: "Our production stack runs on Vercel (SOC 2 Type II) and Supabase (SOC 2 Type II, managed Postgres with encryption at rest and in transit). We document exactly which systems touch your data and can provide sub-processor lists on request.",
  },
  {
    icon: Database,
    title: "Least-privilege data access",
    body: "During engagements, we work with the minimum data needed to build and test the system. We use scoped credentials, short-lived tokens where possible, and we hand over admin access to your team at the end of every build.",
  },
  {
    icon: FileCheck,
    title: "Clear data lifecycle",
    body: "We document every system's data retention policy in writing before kickoff. You decide how long we keep engagement artifacts, and we delete them on request — typically within 30 days of project close.",
  },
]

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-3">
          <Shield className="h-3.5 w-3.5" />
          Trust &amp; Security
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          How we handle your data.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-3">
          {AGENCY.name} builds custom AI systems for knowledge-work teams.
          That means we touch sensitive operational data during engagements —
          and we treat that as a responsibility, not a footnote.
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          See also:{" "}
          <Link href="/principles" className="text-accent hover:underline">
            our principles
          </Link>
          {" · "}
          <Link href="/about" className="text-accent hover:underline">
            how we work
          </Link>
        </p>
      </FadeIn>

      <Stagger className="grid sm:grid-cols-2 gap-5 mb-12" staggerDelay={0.1}>
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <StaggerItem key={title}>
            <div className="rounded-2xl border border-border bg-card p-6 h-full">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold mb-2">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.4}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            LLM data handling
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <strong className="text-foreground">Default posture.</strong>{" "}
              We use enterprise API endpoints from OpenAI, Anthropic, and
              Amazon Bedrock with zero-retention and no-training agreements
              for production workloads. Prompts and completions are not
              logged beyond what&apos;s needed for real-time delivery.
            </p>
            <p>
              <strong className="text-foreground">Configurable per engagement.</strong>{" "}
              When client requirements or regulations demand stricter
              controls, we deploy into your cloud tenant (Azure OpenAI,
              Bedrock in your AWS account) or use self-hosted open models.
              You keep the keys, you keep the logs, you keep the model.
            </p>
            <p>
              <strong className="text-foreground">Evaluation and tuning.</strong>{" "}
              Prompt engineering and evaluation work happens on synthetic or
              anonymized data whenever possible. If real data is required for
              a specific test, we document exactly what is used, where it
              lives, and how long it&apos;s retained — in writing, before the work
              starts.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            This website
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Separately from client engagements, this website ({SITE.name})
              collects only what you voluntarily submit through the contact
              form or occupation builder. See our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>{" "}
              for the full breakdown of what&apos;s collected, why, and how long
              it&apos;s kept. Highlights:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>No tracking cookies, no advertising, no third-party analytics (as of the date above).</li>
              <li>Submitted form data is stored in Supabase (encrypted at rest, RLS-locked).</li>
              <li>Notification email is delivered via Resend; no marketing newsletters.</li>
              <li>You can request full deletion at any time by emailing{" "}
                <a href={`mailto:${CONTACT.email}`} className="text-accent hover:underline">
                  {CONTACT.email}
                </a>
                .
              </li>
            </ul>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.6}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            Regulated data
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              HIPAA-, PCI-, and FedRAMP-eligible architecture is available on
              request — scoped per engagement. For HIPAA-capable builds, we
              work with covered entities to sign a BAA, deploy exclusively to
              client-hosted infrastructure, and use LLM providers that support
              BAAs (AWS Bedrock, Azure OpenAI). If a specific framework is
              load-bearing for your deployment, tell us up front and we&apos;ll
              confirm scope before kickoff.
            </p>
            <p>
              If you have a specific compliance requirement, tell us up front —
              it shapes the architecture decisions we make in week one, and
              it&apos;s much cheaper to plan for than to retrofit.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.7}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <h2 className="font-heading text-xl font-semibold">
              Incident response
            </h2>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              If you believe you&apos;ve found a security issue in this website or
              in an engagement we&apos;ve delivered, please email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>{" "}
              with the subject line <em>&ldquo;Security&rdquo;</em>. We acknowledge every
              report within one business day and will work with you on
              responsible disclosure.
            </p>
            <p>
              For active client engagements, incident response procedures are
              defined in your statement of work and include named contacts,
              notification timelines, and escalation paths.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.8}>
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground mb-1">
              Want to discuss your security requirements?
            </h3>
            <p className="text-sm text-muted-foreground">
              Tell us about your compliance needs and data-handling constraints. We&apos;ll scope it honestly before any work starts.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            Book a scoping call
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
