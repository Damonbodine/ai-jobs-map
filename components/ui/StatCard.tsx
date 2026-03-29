"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

export interface StatCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  colorClass?: string
  delay?: number
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  colorClass = "text-emerald-400", 
  delay = 0, 
  className, 
  ...props 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      className={cn(
        "relative overflow-hidden rounded-[1.2rem] border border-slate-800/65 bg-[linear-gradient(180deg,rgba(15,23,42,0.76),rgba(15,23,42,0.58))] p-5 text-left shadow-[0_10px_28px_rgba(2,6,23,0.14)] transition-colors group",
        className
      )}
      {...props}
    >
      <div className={cn("pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-0 blur-[45px] transition-opacity duration-700 group-hover:opacity-10", colorClass.replace('text-', 'bg-'))} />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
          <div className={cn("mt-3 text-4xl font-semibold tracking-[-0.03em]", colorClass)}>{value}</div>
        </div>
        {icon && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/45 p-3 transition-colors group-hover:bg-slate-900/80">
            {icon}
          </div>
        )}
      </div>

      {description && (
        <div className="relative z-10 mt-4 text-sm text-slate-500">
          {description}
        </div>
      )}
    </motion.div>
  )
}
