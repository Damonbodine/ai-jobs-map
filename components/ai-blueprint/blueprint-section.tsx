import type { AgentBlueprint } from '@/lib/ai-blueprints/types';
import { FadeIn } from '@/components/ui/fade-in';
import { ArchitectureOverview } from './architecture-overview';
import { AgentCard } from './agent-card';
import { ImpactSummary } from './impact-summary';

export function BlueprintSection({
  blueprint,
  occupationSlug,
  occupationTitle,
  totalDayMinutes,
}: {
  blueprint: AgentBlueprint;
  occupationSlug: string;
  occupationTitle: string;
  totalDayMinutes: number;
}) {
  return (
    <section className="page-container py-16 md:py-20">
      <FadeIn>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          Your AI system
        </p>
        <h2
          className="mt-2 font-editorial font-normal text-ink"
          style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', lineHeight: 1.3 }}
        >
          What we&apos;d build for {occupationTitle.toLowerCase().endsWith('s') ? occupationTitle.toLowerCase() : occupationTitle.toLowerCase() + 's'}
        </h2>
        <p className="mt-2 max-w-xl text-[0.78rem] leading-[1.6] text-ink-secondary">
          Based on your role&apos;s actual tasks — here&apos;s the AI system we&apos;d design, which tasks get automated, which get assisted, and where you stay in the loop.
        </p>
      </FadeIn>

      {/* Architecture rationale — single line bridging to cards */}
      <FadeIn delay={0.06}>
        <div className="mt-5">
          <ArchitectureOverview blueprint={blueprint} />
        </div>
      </FadeIn>

      {/* Agent cards grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {blueprint.agents.map((agent, i) => (
          <FadeIn key={agent.blockKey} delay={0.1 + i * 0.05}>
            <AgentCard agent={agent} totalDayMinutes={totalDayMinutes} />
          </FadeIn>
        ))}
      </div>

      {/* Impact summary with CTA */}
      <FadeIn delay={0.1 + blueprint.agents.length * 0.05}>
        <div className="mt-5">
          <ImpactSummary
            blueprint={blueprint}
            occupationSlug={occupationSlug}
            occupationTitle={occupationTitle}
          />
        </div>
      </FadeIn>
    </section>
  );
}
