'use client';

import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { InsightCard } from '@/components/ui/insight-card';
import { StatRing } from '@/components/ui/stat-ring';

const CHART_COLORS = ['#1C1816', '#B8860B', '#A0522D', '#6B7F5E', '#6B6259', '#7B506F', '#9C9488'];

interface DaySegment {
  label: string;
  minutes: number;
  recoverable: number;
  posture: string;
}

interface DayChartProps {
  segments: DaySegment[];
  totalMinutes: number;
  fullDayMinutes: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-edge-strong bg-surface-raised px-4 py-3 shadow-lg">
      <p className="text-[0.8rem] font-medium text-ink">{data.label}</p>
      <p className="mt-0.5 text-[0.75rem] text-ink-secondary">
        {(data.minutes / 60).toFixed(1)}h per day
      </p>
      {data.recoverable > 0 && (
        <p className="mt-0.5 text-[0.72rem] font-medium text-accent-blue">
          {data.recoverable} min could be lighter
        </p>
      )}
      <p className="mt-1.5 text-[0.68rem] leading-[1.4] text-ink-tertiary max-w-[220px]">
        {data.posture}
      </p>
    </div>
  );
}

export function DayChart({ segments, totalMinutes, fullDayMinutes }: DayChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = segments.map((seg, i) => ({
    ...seg,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div ref={ref}>
      {/* Donut + Cards grid */}
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        {/* Donut chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[280px]"
        >
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="minutes"
                  animationBegin={200}
                  animationDuration={1200}
                  onMouseEnter={(_, i) => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {chartData.map((entry, i) => (
                    <Cell
                      key={entry.label}
                      fill={entry.color}
                      opacity={hoveredIndex === null ? 1 : hoveredIndex === i ? 1 : 0.3}
                      stroke="none"
                      style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label — absolute positioned over the donut hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-editorial text-[1.75rem] font-normal text-ink">{Math.round(fullDayMinutes / 60)}h</span>
              <span className="text-[0.6rem] text-ink-tertiary">workday</span>
            </div>
          </div>
        </motion.div>

        {/* Work block cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {chartData.map((seg, i) => (
            <InsightCard
              key={seg.label}
              title={seg.label}
              value={`${(seg.minutes / 60).toFixed(1)}h`}
              subtitle={seg.recoverable > 0 ? `${seg.recoverable}m back` : undefined}
              description={seg.posture}
              accentColor={seg.color}
              delay={i * 0.08}
              chart={
                <StatRing
                  value={Math.round((seg.minutes / fullDayMinutes) * 100)}
                  size={48}
                  strokeWidth={4}
                  color={seg.color}
                  label={`${Math.round((seg.minutes / fullDayMinutes) * 100)}%`}
                />
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
