'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  chart?: React.ReactNode;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export function InsightCard({
  title,
  value,
  subtitle,
  description,
  accentColor = '#1C1816',
  icon,
  chart,
  delay = 0,
  className,
  children,
}: InsightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-edge-strong bg-surface-raised shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      {/* Accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-5 pl-6">
        {/* Top row: title + ring in corner */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-ink-tertiary">
            {title}
          </p>
          {(icon || chart) && (
            <div className="shrink-0 -mt-0.5">
              {chart || icon}
            </div>
          )}
        </div>

        {/* Value — large, below title */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-editorial text-[1.75rem] font-normal tracking-[-0.03em] text-ink">
            {value}
          </span>
          {subtitle && (
            <span className="font-editorial text-[0.78rem] italic text-ink-tertiary">{subtitle}</span>
          )}
        </div>

        {/* Description — always visible, muted */}
        {description && (
          <p className="mt-2 text-[0.75rem] leading-[1.5] text-ink-tertiary">
            {description}
          </p>
        )}

        {children}
      </div>
    </motion.div>
  );
}
