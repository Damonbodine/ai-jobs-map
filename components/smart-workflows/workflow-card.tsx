import Link from 'next/link';
import { ArrowRight, Clock, Zap } from 'lucide-react';

interface WorkflowCardProps {
  id: number;
  name: string;
  description: string;
  integrations: string[];
  complexity: string;
  estimatedHoursSaved: number;
  triggerType: string;
  occupationSlug: string;
}

const complexityConfig: Record<string, { label: string; tone: string }> = {
  beginner: { label: 'Simple', tone: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  intermediate: { label: 'Moderate', tone: 'text-amber-600 bg-amber-50 border-amber-200' },
  advanced: { label: 'Advanced', tone: 'text-rose-600 bg-rose-50 border-rose-200' },
};

const triggerLabels: Record<string, string> = {
  webhook: 'Event-triggered',
  schedule: 'Scheduled',
  email: 'Email-triggered',
  manual: 'On-demand',
};

export function WorkflowCard({
  id,
  name,
  description,
  integrations,
  complexity,
  estimatedHoursSaved,
  triggerType,
  occupationSlug,
}: WorkflowCardProps) {
  const cx = complexityConfig[complexity] || complexityConfig.beginner;
  const truncatedDesc = description.length > 120 ? description.slice(0, 117) + '...' : description;
  const visibleIntegrations = integrations.slice(0, 4);
  const extraCount = integrations.length - visibleIntegrations.length;

  return (
    <div className="group flex flex-col rounded-xl border border-border/60 bg-surface p-5 transition-all hover:border-accent/40 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[0.8rem] font-medium leading-snug text-ink group-hover:text-accent transition-colors">
          {name}
        </h4>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-medium ${cx.tone}`}>
          {cx.label}
        </span>
      </div>

      {/* Description */}
      <p className="mt-2 text-[0.7rem] leading-relaxed text-ink-secondary">{truncatedDesc}</p>

      {/* Integration pills */}
      {visibleIntegrations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleIntegrations.map((name) => (
            <span
              key={name}
              className="rounded-full border border-border/60 bg-surface-raised px-2 py-0.5 text-[0.6rem] text-ink-muted"
            >
              {name}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="rounded-full border border-border/40 px-2 py-0.5 text-[0.6rem] text-ink-muted">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Meta row */}
      <div className="mt-auto pt-4 flex items-center gap-4 text-[0.65rem] text-ink-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ~{estimatedHoursSaved}h/wk saved
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {triggerLabels[triggerType] || triggerType}
        </span>
      </div>

      {/* CTA */}
      <Link
        href={`/factory?occupation=${encodeURIComponent(occupationSlug)}&workflow=${id}&name=${encodeURIComponent(name)}`}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5 text-[0.75rem] font-medium text-accent transition-all hover:bg-accent/10 hover:border-accent/50"
      >
        Request this automation
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
