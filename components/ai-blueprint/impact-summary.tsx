import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AgentBlueprint } from '@/lib/ai-blueprints/types';

const complexityMeta: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: '#6B7F5E' },
  growth: { label: 'Growth', color: '#B8860B' },
  enterprise: { label: 'Enterprise', color: '#A0522D' },
};

export function ImpactSummary({
  blueprint,
  occupationSlug,
  occupationTitle,
}: {
  blueprint: AgentBlueprint;
  occupationSlug: string;
  occupationTitle: string;
}) {
  const cx = complexityMeta[blueprint.impact.complexity] || complexityMeta.starter;
  const weeklyMinutes = blueprint.impact.totalMinutesSaved * 5;
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);
  const topAgent = blueprint.agents[0];

  const factoryParams = new URLSearchParams({
    occupation: occupationSlug,
    name: `${topAgent.agentName} — ${topAgent.agentRole.split('—')[0].trim()}`,
  });

  return (
    <div className="rounded-xl border border-border/60 bg-surface-raised p-5 md:p-6">
      <div className="grid gap-6 sm:grid-cols-4">
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">Time recovered</p>
          <p className="mt-1.5 font-editorial text-2xl font-normal text-ink">
            {weeklyHours}<span className="text-[0.75rem] text-ink-muted font-normal"> hrs/wk</span>
          </p>
        </div>
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">Tasks handled</p>
          <p className="mt-1.5 font-editorial text-2xl font-normal text-ink">
            {blueprint.impact.automatedTaskCount + blueprint.impact.assistedTaskCount}
            <span className="text-[0.75rem] text-ink-muted font-normal"> of {blueprint.impact.automatedTaskCount + blueprint.impact.assistedTaskCount + blueprint.impact.humanRetainedTaskCount}</span>
          </p>
        </div>
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">Biggest impact</p>
          <p className="mt-1.5 text-[0.85rem] font-medium text-ink">{blueprint.impact.highestImpactBlock}</p>
        </div>
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">Recommended tier</p>
          <span
            className="mt-1.5 inline-block rounded-full px-3 py-1 text-[0.65rem] font-medium border"
            style={{ color: cx.color, backgroundColor: `${cx.color}10`, borderColor: `${cx.color}30` }}
          >
            {cx.label}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-border/40">
        <Link
          href={`/factory?${factoryParams.toString()}`}
          className="group inline-flex items-center gap-2.5 rounded-lg border border-ink bg-ink px-8 py-3.5 text-[0.82rem] font-medium text-white transition-all hover:bg-transparent hover:text-ink"
        >
          Request a build for {occupationTitle.toLowerCase()}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
