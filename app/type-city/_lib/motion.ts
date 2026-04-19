"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Fires a boolean `seen` the first time `ref` intersects the viewport by at
 * least `threshold`. One-shot: disconnects after the first intersection.
 */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

/**
 * rAF count-up from 0 → target with cubic ease-out. Returns the live value.
 * Holds at 0 while `active` is false; restarts the tween whenever `target`
 * or `active` changes.
 */
export function useCountUp(target: number, duration = 1400, active = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])
  return val
}
