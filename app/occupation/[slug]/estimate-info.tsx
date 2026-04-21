"use client"

import { useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function EstimateInfo() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointer(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handlePointer)
    document.addEventListener("touchstart", handlePointer)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handlePointer)
      document.removeEventListener("touchstart", handlePointer)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex shrink-0 self-center"
    >
      <button
        type="button"
        className="inline-flex rounded-full border border-border/70 p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="How this estimate is calculated"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Info className="h-4 w-4" />
      </button>

      <div
        role="tooltip"
        className={cn(
          "absolute left-0 top-full z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-md bg-foreground px-3 py-2 text-left text-xs leading-relaxed text-background shadow-xl transition-opacity duration-150 sm:left-full sm:top-0 sm:ml-3 sm:mt-0",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
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
