import Link from 'next/link';
import { Database, BrainCircuit, BarChart3, Target, ChevronRight } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

export const metadata = {
  title: 'About - AI Jobs Map',
  description: 'Learn how AI Jobs Map identifies time-back opportunities across 800+ occupations from the Bureau of Labor Statistics.',
};

export default function AboutPage() {
  return (
    <div className="app-shell">
      <main className="page-container max-w-4xl py-14 md:py-16">
        <Link href="/ai-jobs" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Map
        </Link>

        <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
          About AI Jobs Map
        </h1>
        <p className="mt-3 text-lg text-ink-secondary">
          Mapping time-back opportunities across over 800 occupations.
        </p>

        <div className="mt-12 space-y-12">
          {/* Mission */}
          <section>
            <h2 className="text-xl font-semibold text-ink">What is AI Jobs Map?</h2>
            <div className="mt-4 rounded-lg border border-edge bg-surface-raised p-6 shadow-sm space-y-4">
              <p className="leading-relaxed text-ink-secondary">
                AI Jobs Map maps practical support opportunities to over 800 occupations from the U.S. Bureau of Labor Statistics. Our mission is to help professionals understand how AI can lighten repetitive work, support better decisions, and create new opportunities for career growth.
              </p>
              <p className="leading-relaxed text-ink-secondary">
                Whether you&apos;re a developer looking to use AI tools more effectively, a healthcare professional exploring supportive diagnostics, or a creative professional curious about faster drafting, AI Jobs Map provides practical guidance for your role.
              </p>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-xl font-semibold text-ink">Key Features</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { icon: Database, title: 'Comprehensive Database', desc: '826 occupations across 22 categories, each with routines and support-path mappings.' },
                { icon: BrainCircuit, title: 'AI-Guided Insights', desc: 'Actionable guidance about where systems can lighten the load in your occupation.' },
                { icon: BarChart3, title: 'Impact & Effort Ratings', desc: 'Each opportunity includes ratings to help you prioritize which ideas to explore.' },
                { icon: Target, title: 'Task-Level Breakdown', desc: 'Routine-level analysis shows exactly where support systems can give time back.' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-lg border border-edge bg-surface-raised p-5 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-blue-subtle text-accent-blue">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-xl font-semibold text-ink">Opportunity Themes</h2>
            <div className="mt-4 rounded-lg border border-edge bg-surface-raised p-6 shadow-sm">
              <p className="leading-relaxed text-ink-secondary">
                Themes are grouped into seven areas to help you understand the kind of support that fits:
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  { name: 'Routine Support', desc: 'Lightening repetitive manual work' },
                  { name: 'Decision Prep', desc: 'Helping prepare better decisions' },
                  { name: 'Research & Discovery', desc: 'Finding insights in data' },
                  { name: 'Communication Support', desc: 'Improving follow-through' },
                  { name: 'Drafting Help', desc: 'Document and creative tasks' },
                  { name: 'Analysis Support', desc: 'Analyzing data and trends' },
                  { name: 'Learning Support', desc: 'Skill development' },
                ].map((cat) => (
                  <div key={cat.name} className="flex items-start gap-3 rounded-md bg-surface-sunken p-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium text-ink">{cat.name}</p>
                      <p className="text-xs text-ink-tertiary">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <h2 className="text-xl font-semibold text-ink">Data Sources</h2>
            <div className="mt-4 rounded-lg border border-edge bg-surface-raised p-6 shadow-sm space-y-4">
              <p className="leading-relaxed text-ink-secondary">
                Occupation data comes from the U.S. Bureau of Labor Statistics Standard Occupational Classification (SOC) system, covering all major occupational categories.
              </p>
              <p className="leading-relaxed text-ink-secondary">
                Opportunity themes and micro-tasks are generated using language models trained on industry knowledge and current AI capabilities. These insights are designed to be practical and actionable.
              </p>
            </div>
          </section>

          {/* Tech Stack */}
          <section>
            <h2 className="text-xl font-semibold text-ink">Technology Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Vercel', 'Drizzle ORM'].map((tech) => (
                <span key={tech} className="rounded-sm bg-surface-sunken px-3 py-1.5 text-sm font-medium text-ink-secondary">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-edge bg-surface-raised p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Get Started</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-secondary">
              Ready to explore time-back opportunities? Search for your occupation to discover specific ways AI can support your work.
            </p>
            <Link
              href="/ai-jobs"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore Occupations
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
