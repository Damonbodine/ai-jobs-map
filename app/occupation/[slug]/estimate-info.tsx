"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function EstimateInfo() {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative inline-flex shrink-0 self-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex rounded-full border border-border/70 p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="How this estimate is calculated"
        aria-expanded={open}
      >
        <Info className="h-4 w-4" />
      </button>

      <div
        className={cn(
          "pointer-events-none absolute left-full top-full z-50 ml-3 mt-3 w-80 rounded-md bg-foreground px-3 py-2 text-left text-xs leading-relaxed text-background shadow-xl transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0"
        )}
      >
        <div>
          We estimate how much daily time in this role sits in repeatable work AI can assist or automate.
        </div>
        <div className="mt-2 text-background/80">
          The range reflects conservative and optimistic assumptions, and your selected tasks below change the custom build estimate.
        </div>
        <div className="mt-2 text-background/70">
          This is an estimate, not a guarantee.
        </div>
      </div>
    </div>
  )
}
