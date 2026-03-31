import type { AgentBlueprint } from '@/lib/ai-blueprints/types';

export function ArchitectureOverview({ blueprint }: { blueprint: AgentBlueprint }) {
  return (
    <p className="text-[0.8rem] leading-relaxed text-ink-secondary">
      {blueprint.architectureRationale}
    </p>
  );
}
