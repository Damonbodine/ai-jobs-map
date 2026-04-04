"use client"

import { TimeDonut } from "@/components/TimeDonut"
import type { ModuleCapability } from "@/types"

interface OccupationDonutProps {
  agents: {
    blockName: string
    role: string
    tasks: { name: string; tier: string; minutesSaved: number }[]
    toolAccess: string[]
    minutesSaved: number
  }[]
  capabilitiesByModule: Record<string, ModuleCapability[]>
  totalMinutes: number
  blueprintScale: number
}

export function OccupationDonut(props: OccupationDonutProps) {
  return <TimeDonut {...props} />
}
