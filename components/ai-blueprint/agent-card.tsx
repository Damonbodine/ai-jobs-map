'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BlockAgent } from '@/lib/ai-blueprints/types';
import { patternMeta } from '@/lib/ai-blueprints/constants';

const blockColors: Record<string, string> = {
  intake: '#1C1816',
  analysis: '#B8860B',
  documentation: '#A0522D',
  coordination: '#6B7F5E',
  exceptions: '#7B506F',
};

function AgentDonut({
  minutes,
  totalMinutes,
  color,
  size = 100,
  strokeWidth = 8,
}: {
  minutes: number;
  totalMinutes: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const pct = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;

  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const filled = (animatedPct / 100) * circumference;
  const remaining = circumference - filled;

  useEffect(() => {
    if (hasAnimated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = (now - start) / 1000;
            const progress = Math.min(elapsed / 1.2, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedPct(Math.round(eased * pct));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="relative shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E4DE" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${remaining}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-editorial text-xl font-normal text-ink">{minutes}</span>
        <span className="text-[0.5rem] text-ink-muted">min/day</span>
      </div>
    </div>
  );
}

export function AgentCard({ agent, totalDayMinutes }: { agent: BlockAgent; totalDayMinutes: number }) {
  const [expanded, setExpanded] = useState(false);
  const pattern = patternMeta[agent.primaryPattern];
  const color = blockColors[agent.blockKey] || '#6B6259';
  const totalTasks = agent.automatedTasks.length + agent.assistedTasks.length + agent.humanOnlyTasks.length;
  const automatedPct = totalTasks > 0 ? Math.round((agent.automatedTasks.length / totalTasks) * 100) : 0;
  const assistedPct = totalTasks > 0 ? Math.round((agent.assistedTasks.length / totalTasks) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-surface-raised overflow-hidden">
      {/* Main card — donut + info */}
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-5">
          {/* Donut */}
          <AgentDonut minutes={agent.minutesSaved} totalMinutes={totalDayMinutes} color={color} />

          {/* Agent info */}
          <div className="flex-1 min-w-0">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              {agent.blockLabel}
            </p>
            <h4 className="mt-1 font-editorial text-[1.05rem] font-normal text-ink leading-snug">
              {agent.agentName}
            </h4>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-secondary line-clamp-2">
              {agent.agentRole}
            </p>

            {/* Pattern + tools */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.56rem] font-medium"
                style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30` }}
              >
                {pattern.label}
              </span>
              {agent.toolAccess.slice(0, 3).map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-border/50 bg-surface px-1.5 py-0.5 text-[0.54rem] text-ink-muted"
                >
                  {tool}
                </span>
              ))}
              {agent.toolAccess.length > 3 && (
                <span className="text-[0.54rem] text-ink-muted">+{agent.toolAccess.length - 3}</span>
              )}
            </div>
          </div>
        </div>

        {/* Task breakdown bar — compact */}
        <div className="mt-4">
          <div className="text-[0.55rem] text-ink-muted mb-1">
            <span>{agent.automatedTasks.length} automated · {agent.assistedTasks.length} assisted</span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-border/30">
            {automatedPct > 0 && (
              <div className="rounded-l-full" style={{ width: `${automatedPct}%`, backgroundColor: color }} />
            )}
            {assistedPct > 0 && (
              <div style={{ width: `${assistedPct}%`, backgroundColor: `${color}50` }} />
            )}
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      {(agent.automatedTasks.length > 0 || agent.assistedTasks.length > 0) && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between border-t border-border/40 px-5 py-3 text-[0.72rem] font-medium text-ink-secondary hover:text-ink hover:bg-surface/50 transition-colors md:px-6"
            style={{ borderColor: `${color}15` }}
          >
            <span>{expanded ? 'Hide task breakdown' : 'View task breakdown'}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="border-t border-border/30 bg-surface px-5 py-4 space-y-4 md:px-6">
              {agent.automatedTasks.length > 0 && (
                <div>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color }}>
                    Fully automated
                  </p>
                  {agent.automatedTasks.map((t) => (
                    <div key={t.taskName} className="py-1.5 border-b border-border/15 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[0.7rem] text-ink">{t.taskName}</p>
                        <span className="shrink-0 text-[0.58rem] text-ink-muted capitalize">{t.frequency}</span>
                      </div>
                      <p className="text-[0.6rem] text-ink-muted mt-0.5">{t.automationApproach}</p>
                    </div>
                  ))}
                </div>
              )}
              {agent.assistedTasks.length > 0 && (
                <div>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                    AI-assisted
                  </p>
                  {agent.assistedTasks.map((t) => (
                    <div key={t.taskName} className="py-1.5 border-b border-border/15 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[0.7rem] text-ink">{t.taskName}</p>
                        <span className="shrink-0 text-[0.58rem] text-ink-muted capitalize">{t.frequency}</span>
                      </div>
                      <p className="text-[0.6rem] text-ink-muted mt-0.5">{t.automationApproach}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
