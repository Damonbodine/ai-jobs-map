'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface StatCardProps extends Omit<HTMLMotionProps<'div'>, 'title'> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  colorClass?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  colorClass,
  delay = 0,
  className,
  ...props
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-lg border border-edge bg-surface-raised p-5 shadow-sm',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-sm text-ink-secondary">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-blue-subtle text-accent-blue">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
