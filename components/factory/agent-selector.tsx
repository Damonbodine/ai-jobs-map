'use client';

import { Check } from 'lucide-react';
import type { BlockAgent } from '@/lib/ai-blueprints/types';
import { patternMeta } from '@/lib/ai-blueprints/constants';

const blockColors: Record<string, string> = {
  intake: '#1C1816',
  analysis: '#B8860B',
  documentation: '#A0522D',
  coordination: '#6B7F5E',
  exceptions: '#7B506F',
};

export function AgentSelector({
  agent,
  selected,
  onToggle,
}: {
  agent: BlockAgent;
  selected: boolean;
  onToggle: () => void;
}) {
  const color = blockColors[agent.blockKey] || '#6B6259';
  const pattern = patternMeta[agent.primaryPattern];
  const taskCount = agent.automatedTasks.length + agent.assistedTasks.length;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-150 ${
        selected
          ? 'border-ink bg-surface-sunken shadow-sm'
          : 'border-edge bg-surface-raised hover:border-edge-strong hover:shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          selected ? 'border-ink bg-ink' : 'border-edge-strong'
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Mini donut */}
      <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
        <svg width={56} height={56} viewBox="0 0 56 56">
          <circle cx={28} cy={28} r={21} fill="none" stroke="#E8E4DE" strokeWidth={5} />
          <circle
            cx={28} cy={28} r={21}
            fill="none"
            stroke={selected ? color : '#C4BEB6'}
            strokeWidth={5}
            strokeDasharray={`${(agent.minutesSaved / Math.max(agent.minutesSaved + 30, 60)) * 131.9} 131.9`}
            strokeDashoffset={33}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-editorial text-[0.85rem] font-normal text-ink leading-none">{agent.minutesSaved}</span>
          <span className="text-[0.4rem] text-ink-muted leading-none mt-0.5">min/day</span>
        </div>
      </div>

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] font-medium text-ink">{agent.agentName}</p>
        <p className="mt-0.5 text-[0.7rem] text-ink-tertiary">
          {taskCount} tasks · {agent.minutesSaved} min/day saved
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 text-[0.55rem] font-medium"
            style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30` }}
          >
            {pattern.label}
          </span>
        </div>
      </div>
    </button>
  );
}
