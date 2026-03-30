'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#1C1816', '#B8860B', '#A0522D', '#6B7F5E', '#6B6259'];

interface TimeBackItem {
  label: string;
  recoverable: number;
  posture: string;
  solution?: string;
}

interface TimeBackChartProps {
  items: TimeBackItem[];
  total: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-edge-strong bg-surface-raised px-4 py-3 shadow-lg max-w-[260px]">
      <p className="text-[0.8rem] font-medium text-ink">{data.label}</p>
      <p className="mt-1 text-[1.1rem] font-editorial font-normal text-ink">{data.recoverable} min/day</p>
      {data.solution && (
        <p className="mt-1.5 text-[0.72rem] font-medium text-accent-blue">→ {data.solution} could handle this</p>
      )}
      <p className="mt-1.5 text-[0.68rem] leading-[1.4] text-ink-tertiary">{data.posture}</p>
    </div>
  );
}

export function TimeBackChart({ items, total }: TimeBackChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const chartData = items.map((item, i) => ({
    ...item,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Summary line */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink-tertiary">Your time back</p>
          <p className="mt-0.5 text-[0.78rem] text-ink-secondary">Hover each bar to see what would handle it.</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-editorial text-[2rem] tabular-nums tracking-[-0.03em] text-ink">{total}</span>
          <span className="font-editorial text-[0.8rem] italic text-ink-tertiary">min/day</span>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="rounded-xl border border-edge-strong bg-surface-raised p-5 shadow-sm">
        <ResponsiveContainer width="100%" height={items.length * 56 + 20}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barCategoryGap={8}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={180}
              tick={{ fontSize: 13, fill: '#1C1816', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ECE8E1' }} />
            <Bar
              dataKey="recoverable"
              radius={[0, 6, 6, 0]}
              animationBegin={300}
              animationDuration={1000}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.label} fill={entry.color} style={{ cursor: 'pointer' }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Solution cards below */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.filter(i => i.solution).map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            className="rounded-lg border border-edge bg-surface-raised px-4 py-3 transition-shadow hover:shadow-md"
          >
            <p className="text-[0.72rem] font-medium text-accent-blue">{item.solution}</p>
            <p className="mt-0.5 text-[0.78rem] text-ink-secondary">{item.recoverable} min from {item.label.toLowerCase()}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
