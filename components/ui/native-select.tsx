import * as React from 'react';
import { cn } from '@/lib/utils';

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-ink transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
