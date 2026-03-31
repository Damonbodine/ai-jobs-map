'use client';

import { useState, useEffect, useRef } from 'react';

interface WorkBlock {
  key: string;
  label: string;
  minutes: number;
  recoverable: number;
  posture: string;
  color: string;
}

interface DayValueMapProps {
  blocks: WorkBlock[];
  totalRecoverable: number;
  fullDayMinutes: number;
  defaultHourlyRate: number;
  salaryLabel: string | null;
  occupationTitle: string;
}

const CHART_COLORS = ['#1C1816', '#B8860B', '#A0522D', '#6B7F5E', '#6B6259', '#7B506F', '#9C9488'];

/** Animated number that counts up from 0 on mount */
function AnimatedNumber({ value, duration = 1.5, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = (now - start) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/** Animated SVG donut that fills on scroll */
function AnimatedDonut({ pct, size = 160, strokeWidth = 12 }: { pct: number; size?: number; strokeWidth?: number }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const radius = (size / 2) - strokeWidth;
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
            const progress = Math.min(elapsed / 1.5, 1);
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
    <div ref={ref} className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E8E4DE" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="#B8860B"
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${remaining}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-editorial text-3xl font-normal text-ink">{animatedPct}%</span>
        <span className="text-[0.6rem] text-ink-muted">of your day</span>
      </div>
    </div>
  );
}

export function DayValueMap({
  blocks,
  totalRecoverable,
  fullDayMinutes,
  defaultHourlyRate,
  salaryLabel,
}: DayValueMapProps) {
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate);
  const [hasEdited, setHasEdited] = useState(false);

  const weeklyHours = Math.round((totalRecoverable / 60) * 5 * 10) / 10;
  const annualValue = Math.round(weeklyHours * 50 * hourlyRate);
  const monthlyValue = Math.round(annualValue / 12);
  const perMinuteValue = hourlyRate > 0 ? Math.round((hourlyRate / 60) * 100) / 100 : 0;

  const sortedBlocks = [...blocks].filter(b => b.recoverable > 0).sort((a, b) => b.recoverable - a.recoverable);
  const maxRecoverable = sortedBlocks.length > 0 ? sortedBlocks[0].recoverable : 1;
  const pct = Math.round((totalRecoverable / fullDayMinutes) * 100);

  function handleRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setHourlyRate(val);
      setHasEdited(true);
    }
  }

  return (
    <div>
      {/* Label spans full width */}
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted mb-3">
        Your day, mapped
      </p>

      {/* Narrative left, donut right — both start on the same line */}
      <div className="flex items-start justify-between gap-8">
        <p className="max-w-lg font-editorial font-normal text-ink" style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)', lineHeight: 1.4 }}>
          By automating repetitive workflows,
          <br />reducing context-switching, and reclaiming
          <br />deep work time — we believe you could save
        </p>

        <div className="flex flex-col items-end shrink-0">
          <p className="font-editorial font-normal text-ink text-right" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', lineHeight: 1 }}>
            <AnimatedNumber value={totalRecoverable} duration={1.5} />
            <span className="text-[0.85rem] text-ink-muted font-normal"> min/day</span>
          </p>
          <div className="mt-1">
            <AnimatedDonut pct={pct} size={180} strokeWidth={13} />
          </div>
        </div>
      </div>

      {/* Formula row: Rate × Time = Value — compact, pulled up into whitespace */}
      <div className="mt-4 flex items-baseline gap-6 flex-wrap">
        {/* Rate input */}
        <div className="flex items-baseline gap-1">
          <label htmlFor="hourly-rate" className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-muted mr-1">
            Your rate
          </label>
          <span className="font-editorial text-xl font-normal text-ink">$</span>
          <input
            id="hourly-rate"
            type="number"
            min={0}
            step={5}
            value={hourlyRate}
            onChange={handleRateChange}
            placeholder="55"
            className="w-14 border-b-2 border-accent bg-transparent font-editorial text-xl font-normal text-ink outline-none transition-colors focus:border-ink"
          />
          <span className="text-[0.7rem] text-ink-muted">/hr</span>
        </div>

        <span className="text-ink-muted text-[0.7rem]">&times;</span>

        {/* Time back */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-editorial text-xl font-normal text-ink">{totalRecoverable}</span>
          <span className="text-[0.7rem] text-ink-muted">min/day</span>
          <span className="text-[0.6rem] text-ink-muted">({weeklyHours} hrs/wk)</span>
        </div>

        <span className="text-ink-muted text-[0.7rem]">=</span>

        {/* Annual value */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-editorial text-xl font-normal text-ink">${annualValue.toLocaleString()}</span>
          <span className="text-[0.65rem] text-ink-muted">/year</span>
        </div>
      </div>

      <p className="mt-1.5 text-[0.6rem] text-ink-muted">
        {hasEdited ? 'Using your rate' : salaryLabel ? `Default: ${salaryLabel}` : 'Enter your hourly rate above'}
      </p>

      {/* Per-minute hook */}
      <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-secondary">
        Every minute of routine work costs you <span className="font-medium text-ink">${perMinuteValue.toFixed(2)}</span>.
        That&apos;s <span className="font-medium text-ink">${Math.round(perMinuteValue * totalRecoverable * 250).toLocaleString()}/year</span> spent
        on work a system could handle.
      </p>

      {/* Savings breakdown */}
      <div className="mt-12">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted mb-4">
          Where the time comes back
        </p>
        <div className="space-y-4">
          {sortedBlocks.map((block, i) => {
            const barWidth = Math.max(4, (block.recoverable / maxRecoverable) * 100);
            const dollarValue = Math.round((block.recoverable / 60) * hourlyRate * 250);
            return (
              <div key={block.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.8rem] text-ink">{block.label}</span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-editorial text-[1rem] font-normal text-ink">{block.recoverable} min</span>
                    <span className="text-[0.7rem] text-ink-muted">${dollarValue.toLocaleString()}/yr</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-border/30">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
                <p className="mt-1 text-[0.65rem] text-ink-muted">{block.posture}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
