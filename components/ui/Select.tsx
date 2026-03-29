import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-12 w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/70 px-4 pr-10 py-2 text-base text-white shadow-inner shadow-black/20 ring-offset-slate-950 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer",
            className
          )}
          ref={ref}
          {...props}
        />
        {/* Chevron */}
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
