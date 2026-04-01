import Link from 'next/link';
import { ArrowRight, Check, Layers3, Sparkles, Waypoints } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { FadeIn } from '@/components/ui/fade-in';
import { TrackedLink } from '@/components/analytics/tracked-link';
import { TrackPageView } from '@/components/analytics/track-page-view';

export const metadata = {
  title: 'Products - AI Jobs Map',
  description: 'See the product packages that turn role-based time-back insights into practical AI support for teams and operators.',
};

const packages = [
  {
    name: 'Starter Assistant',
    icon: Sparkles,
    fit: 'Best for one role, one painful routine, and one clear time-back wedge.',
    forWho: 'Solo operators, managers testing the category, and teams that want a first deployment.',
    includes: [
      'One high-friction routine cluster',
      'A focused AI assistant or support workflow',
      'Initial tool connection and implementation guidance',
      'A clear before-and-after operating story',
    ],
    outcome: 'Prove time-back quickly without forcing a broad process change.',
  },
  {
    name: 'Workflow Bundle',
    icon: Waypoints,
    fit: 'Best for teams with 2 to 4 linked routines that should move together.',
    forWho: 'Operations teams, department leads, and managers with recurring intake, follow-up, reporting, or approval work.',
    includes: [
      'Multiple connected routine clusters',
      'Shared workflow logic across systems and teams',
      'Human review and exception routing',
      'A stronger daily time-back story across the workflow',
    ],
    outcome: 'Remove drag across a full operating sequence instead of one isolated task.',
  },
  {
    name: 'Ops Layer',
    icon: Layers3,
    fit: 'Best for complex operating environments that need broader support, approvals, and governance.',
    forWho: 'Larger teams with multiple systems, exception handling, compliance pressure, or change-management needs.',
    includes: [
      'Cross-system workflow support',
      'Approvals, oversight, and exception handling',
      'Ongoing support for a broader operating layer',
      'Packaging around durable team processes, not isolated tasks',
    ],
    outcome: 'Create a managed AI support layer for recurring operations.',
  },
];

const examples = [
  {
    role: 'Accountants and auditors',
    wedge: 'Document intake, reconciliations, recurring reporting, and review prep.',
    package: 'Workflow Bundle',
  },
  {
    role: 'Software developers',
    wedge: 'Ticket intake, bug triage, documentation, and release coordination.',
    package: 'Starter Assistant',
  },
  {
    role: 'Registered nurses',
    wedge: 'Documentation, patient communication prep, and administrative follow-through.',
    package: 'Starter Assistant',
  },
  {
    role: 'Operations managers',
    wedge: 'Cross-team coordination, status updates, approvals, and recurring reporting.',
    package: 'Ops Layer',
  },
];

const trustPoints = [
  {
    title: 'Grounded estimates',
    body: 'Time-back recommendations start from role-level task patterns, recurring routine clusters, and the realistic share of work that can be supported without removing human judgment.',
  },
  {
    title: 'Human review stays in the loop',
    body: 'We do not position these packages as full replacement. Approvals, exceptions, sensitive communication, and final accountability stay with the team.',
  },
  {
    title: 'Start narrow before expanding',
    body: 'The first package should prove value around a believable wedge. Broader workflow coverage comes after the initial routine cluster is working.',
  },
];

const engagementSteps = [
  {
    step: '01',
    title: 'Confirm the role and routine drag',
    body: 'We use the role insight to confirm where the time loss is actually happening and which package is the right entry point.',
  },
  {
    step: '02',
    title: 'Scope systems and guardrails',
    body: 'We identify the tools involved, where human review stays required, and what would need to be connected first.',
  },
  {
    step: '03',
    title: 'Recommend the first engagement',
    body: 'You get a practical starting plan instead of a generic demo. That includes the package, the routine cluster, and the likely shape of implementation.',
  },
];

function formatOccupationLabel(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ occupation?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const occupationSlug = params?.occupation;
  const occupationLabel = occupationSlug ? formatOccupationLabel(occupationSlug) : null;

  return (
    <div className="app-shell">
      <TrackPageView eventName="products_viewed" properties={{ occupationSlug: occupationSlug || null }} />
      <section className="bg-panel">
        <div className="page-container pt-10 pb-14 md:pt-14 md:pb-18">
          <div className="eyebrow dark-panel-muted">Products</div>
          <h1
            className="dark-panel-text mt-3 font-editorial font-normal"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', lineHeight: 0.98, letterSpacing: '-0.045em' }}
          >
            Turn role insight into a real operating package.
          </h1>
          <p className="dark-panel-muted mt-5 max-w-3xl text-[1rem] leading-8">
            We identify where routine work is draining time in a role, then package the right AI support around the routines most worth removing.
          </p>
          {occupationLabel ? (
            <div className="mt-6 inline-flex rounded-full border border-panel-muted/30 bg-panel-lighter/50 px-4 py-2 text-[0.78rem] font-medium text-panel-text">
              Viewing packages for: {occupationLabel}
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href={occupationSlug ? `/factory?occupation=${occupationSlug}` : '/factory'}
              eventName="products_factory_clicked"
              eventProps={{ occupationSlug: occupationSlug || null, cta: 'hero' }}
              className="btn-primary inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-3 text-[0.85rem] font-medium transition-all hover:bg-transparent hover:text-ink"
            >
              Get your plan
              <ArrowRight className="h-3.5 w-3.5" />
            </TrackedLink>
            <TrackedLink
              href="/ai-jobs"
              eventName="products_map_clicked"
              eventProps={{ cta: 'hero' }}
              className="inline-flex items-center gap-2 rounded-lg border border-panel-muted/30 bg-panel-lighter/40 px-5 py-3 text-[0.85rem] font-medium text-panel-text transition-colors hover:bg-panel-lighter/60"
            >
              Start with your role
            </TrackedLink>
          </div>
        </div>
      </section>

      <main>
        <section className="page-container py-14 md:py-18">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="eyebrow">How it works</div>
              <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.3rem)] font-normal tracking-[-0.03em] text-ink">
                Start with the role. Package the routines. Recover the time.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              'Search a role and identify where routine work is eating the day.',
              'See the routine clusters with the strongest time-back potential.',
              'Move into the package that fits the role, team, and operating complexity.',
            ].map((step, index) => (
              <FadeIn key={step} delay={index * 0.08}>
                <div className="rounded-2xl border border-edge bg-surface-raised p-6 shadow-sm">
                  <div className="text-[0.8rem] font-semibold text-ink-tertiary">0{index + 1}</div>
                  <p className="mt-3 text-[0.95rem] leading-7 text-ink-secondary">{step}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="page-container pb-14 md:pb-20">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="eyebrow">Packages</div>
              <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.3rem)] font-normal tracking-[-0.03em] text-ink">
                Three ways to start, depending on how much routine drag you need to remove.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {packages.map((item, index) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.name} delay={index * 0.08}>
                  <div className="flex h-full flex-col rounded-[1.75rem] border border-edge-strong bg-surface-raised p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-sunken text-ink">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-edge bg-surface px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
                        Product package
                      </span>
                    </div>

                    <h3 className="mt-5 font-editorial text-[1.7rem] font-normal tracking-[-0.03em] text-ink">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-[0.9rem] leading-7 text-ink-secondary">{item.fit}</p>

                    <div className="mt-5 rounded-2xl border border-edge bg-surface p-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Best for</p>
                      <p className="mt-2 text-[0.82rem] leading-6 text-ink-secondary">{item.forWho}</p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {item.includes.map((line) => (
                        <div key={line} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                          <p className="text-[0.82rem] leading-6 text-ink-secondary">{line}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="rounded-2xl bg-surface-sunken px-4 py-4">
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Outcome</p>
                        <p className="mt-2 text-[0.82rem] leading-6 text-ink-secondary">{item.outcome}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        <section className="page-container pb-14 md:pb-20">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="eyebrow">Role examples</div>
              <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.3rem)] font-normal tracking-[-0.03em] text-ink">
                Role insights should point to a product recommendation, not a maze of options.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {examples.map((example, index) => (
              <FadeIn key={example.role} delay={index * 0.06}>
                <div className="rounded-2xl border border-edge bg-surface-raised p-5 shadow-sm">
                  <p className="eyebrow">Example role</p>
                  <h3 className="mt-3 text-[1rem] font-semibold text-ink">{example.role}</h3>
                  <p className="mt-2 text-[0.84rem] leading-6 text-ink-secondary">{example.wedge}</p>
                  <div className="mt-4 inline-flex rounded-full border border-edge bg-surface px-3 py-1.5 text-[0.75rem] font-medium text-ink-secondary">
                    Recommended starting package: {example.package}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="page-container pb-20 md:pb-28">
          <FadeIn>
            <div className="rounded-[2rem] border border-edge-strong bg-surface-raised p-8 shadow-sm md:p-12">
              <div className="max-w-3xl">
                <div className="eyebrow">Why trust it</div>
                <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.3rem)] font-normal tracking-[-0.03em] text-ink">
                  The estimate is directional, but it is grounded.
                </h2>
                <p className="mt-4 text-[0.9rem] leading-7 text-ink-secondary">
                  The purpose of the products page is not to claim false precision. It is to show a credible starting package based on the kind of repetitive work a role actually carries, and to keep the human parts of the job in view.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {trustPoints.map((point, index) => (
                  <FadeIn key={point.title} delay={index * 0.06}>
                    <div className="rounded-[1.4rem] border border-edge bg-surface p-5">
                      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">{point.title}</p>
                      <p className="mt-3 text-[0.84rem] leading-6 text-ink-secondary">{point.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        <section className="page-container pb-20 md:pb-28">
          <FadeIn>
            <div className="rounded-[2rem] border border-edge-strong bg-surface-raised p-8 shadow-sm md:p-12">
              <div className="max-w-3xl">
                <div className="eyebrow">Engagement model</div>
                <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.3rem)] font-normal tracking-[-0.03em] text-ink">
                  What a first engagement usually looks like.
                </h2>
                <p className="mt-4 text-[0.9rem] leading-7 text-ink-secondary">
                  You do not need to design the system yourself. The next step is a lightweight qualification flow so we can confirm the role, the routines, the systems involved, and the package that fits best.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {engagementSteps.map((step, index) => (
                  <FadeIn key={step.step} delay={index * 0.06}>
                    <div className="rounded-[1.4rem] border border-edge bg-surface p-5">
                      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">{step.step}</p>
                      <h3 className="mt-3 text-[0.98rem] font-semibold text-ink">{step.title}</h3>
                      <p className="mt-3 text-[0.84rem] leading-6 text-ink-secondary">{step.body}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <TrackedLink
                  href={occupationSlug ? `/factory?occupation=${occupationSlug}` : '/factory'}
                  eventName="products_factory_clicked"
                  eventProps={{ occupationSlug: occupationSlug || null, cta: 'footer' }}
                  className="btn-primary inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-3 text-[0.85rem] font-medium transition-all hover:bg-transparent hover:text-ink"
                >
                  Get your plan
                  <ArrowRight className="h-3.5 w-3.5" />
                </TrackedLink>
                <TrackedLink
                  href="/ai-jobs/browse"
                  eventName="products_browse_clicked"
                  eventProps={{ cta: 'footer' }}
                  className="inline-flex items-center gap-2 rounded-lg border border-edge-strong bg-surface px-5 py-3 text-[0.85rem] font-medium text-ink-secondary transition-colors hover:text-ink"
                >
                  Browse roles
                </TrackedLink>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
