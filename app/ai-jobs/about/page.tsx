import Link from 'next/link';
import { Database, BrainCircuit, BarChart3, Target, ChevronLeft, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { FadeIn } from '@/components/ui/fade-in';

export const metadata = {
  title: 'About - AI Jobs Map',
  description: 'Learn how AI Jobs Map identifies time-back opportunities across 800+ occupations from the Bureau of Labor Statistics.',
};

const features = [
  { icon: Database, title: 'Comprehensive Database', desc: '826 occupations across 22 categories, each with routines and support-path mappings.', color: '#6B7F5E' },
  { icon: BrainCircuit, title: 'AI-Guided Insights', desc: 'Actionable guidance about where systems can lighten the load in your occupation.', color: '#B8860B' },
  { icon: BarChart3, title: 'Impact & Effort Ratings', desc: 'Each opportunity includes ratings to help you prioritize which ideas to explore.', color: '#5B7B8A' },
  { icon: Target, title: 'Task-Level Breakdown', desc: 'Routine-level analysis shows exactly where support systems can give time back.', color: '#A0522D' },
];

const themes = [
  { name: 'Routine Support', desc: 'Lightening repetitive manual work', color: '#6B7F5E' },
  { name: 'Decision Prep', desc: 'Helping prepare better decisions', color: '#B8860B' },
  { name: 'Research & Discovery', desc: 'Finding insights in data', color: '#5B7B8A' },
  { name: 'Communication Support', desc: 'Improving follow-through', color: '#7B506F' },
  { name: 'Drafting Help', desc: 'Document and creative tasks', color: '#9C6B4E' },
  { name: 'Analysis Support', desc: 'Analyzing data and trends', color: '#A0522D' },
  { name: 'Learning Support', desc: 'Skill development', color: '#4A6741' },
];

const techStack = ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Vercel', 'Drizzle ORM'];

export default function AboutPage() {
  return (
    <div className="app-shell">
      {/* ── Dark Hero ── */}
      <section className="bg-panel">
        <div className="page-container pt-8 pb-14 md:pt-10 md:pb-20">
          <Link
            href="/ai-jobs"
            className="dark-panel-muted mb-8 inline-flex items-center gap-1 text-[0.78rem] transition-opacity hover:opacity-70"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <div className="dark-panel-muted eyebrow">About</div>
          <h1
            className="dark-panel-text mt-3 font-editorial font-normal"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, letterSpacing: '-0.035em' }}
          >
            About AI Jobs Map
          </h1>
          <p className="dark-panel-muted mt-4 max-w-xl text-[0.9rem] leading-relaxed">
            Mapping practical time-back opportunities across over 800 occupations
            from the U.S. Bureau of Labor Statistics.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="bg-surface">
        {/* What is AI Jobs Map? */}
        <section className="page-container max-w-4xl py-14 md:py-20">
          <FadeIn>
            <div className="eyebrow">Overview</div>
            <h2 className="mt-3 font-editorial text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-[-0.02em] text-ink">
              What is AI Jobs Map?
            </h2>
            <div className="mt-6 space-y-4">
              <p className="text-[0.9rem] leading-relaxed text-ink-secondary">
                AI Jobs Map maps practical support opportunities to over 800 occupations from the U.S. Bureau of Labor Statistics. Our mission is to help professionals understand how AI can lighten repetitive work, support better decisions, and create new opportunities for career growth.
              </p>
              <p className="text-[0.9rem] leading-relaxed text-ink-secondary">
                Whether you&apos;re a developer looking to use AI tools more effectively, a healthcare professional exploring supportive diagnostics, or a creative professional curious about faster drafting, AI Jobs Map provides practical guidance for your role.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* Key Features */}
        <section className="page-container max-w-4xl pb-14 md:pb-20">
          <FadeIn>
            <div className="eyebrow">Capabilities</div>
            <h2 className="mt-3 font-editorial text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-[-0.02em] text-ink">
              Key Features
            </h2>
          </FadeIn>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={f.title} delay={i * 0.08}>
                  <div className="group relative overflow-hidden rounded-xl border border-edge-strong bg-surface-raised shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    {/* Accent stripe */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: f.color }}
                    />
                    <div className="p-5 pl-6">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${f.color}18` }}>
                        <Icon className="h-4.5 w-4.5" style={{ color: f.color }} />
                      </div>
                      <h3 className="mt-3 text-[0.9rem] font-semibold text-ink">{f.title}</h3>
                      <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-tertiary">{f.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Opportunity Themes */}
        <section className="page-container max-w-4xl pb-14 md:pb-20">
          <FadeIn>
            <div className="eyebrow">Categories</div>
            <h2 className="mt-3 font-editorial text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-[-0.02em] text-ink">
              Opportunity Themes
            </h2>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-secondary">
              Themes are grouped into seven areas to help you understand the kind of support that fits.
            </p>
          </FadeIn>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {themes.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.05}>
                <div className="flex items-start gap-3.5 rounded-xl border border-edge bg-surface-raised p-4 shadow-sm">
                  <div
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <div>
                    <p className="text-[0.85rem] font-medium text-ink">{t.name}</p>
                    <p className="mt-0.5 text-[0.75rem] text-ink-tertiary">{t.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Data Sources */}
        <section className="page-container max-w-4xl pb-14 md:pb-20">
          <FadeIn>
            <div className="eyebrow">Methodology</div>
            <h2 className="mt-3 font-editorial text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-[-0.02em] text-ink">
              Data Sources
            </h2>
            <div className="mt-6 space-y-4">
              <p className="text-[0.9rem] leading-relaxed text-ink-secondary">
                Occupation data comes from the U.S. Bureau of Labor Statistics Standard Occupational Classification (SOC) system, covering all major occupational categories.
              </p>
              <p className="text-[0.9rem] leading-relaxed text-ink-secondary">
                Opportunity themes and micro-tasks are generated using language models trained on industry knowledge and current AI capabilities. These insights are designed to be practical and actionable.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* Technology Stack */}
        <section className="page-container max-w-4xl pb-14 md:pb-20">
          <FadeIn>
            <div className="eyebrow">Built with</div>
            <h2 className="mt-3 font-editorial text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-[-0.02em] text-ink">
              Technology Stack
            </h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-edge bg-surface-raised px-4 py-2 text-[0.8rem] font-medium text-ink-secondary shadow-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* CTA */}
        <section className="page-container max-w-4xl pb-20 md:pb-28">
          <FadeIn>
            <div className="rounded-2xl border border-edge-strong bg-surface-raised p-10 text-center shadow-sm md:p-14">
              <h2 className="font-editorial text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-[-0.02em] text-ink">
                Ready to explore?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.85rem] leading-relaxed text-ink-secondary">
                Search for your occupation to discover specific ways AI can support your work and give you time back.
              </p>
              <Link
                href="/ai-jobs"
                className="btn-primary group mt-6 inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-6 py-3 text-[0.85rem] font-medium transition-all hover:bg-transparent hover:text-ink"
              >
                Explore Occupations
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
