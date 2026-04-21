import type { PricingTier, ROIEstimate } from "@/types"

export const PRICING_TIERS: PricingTier[] = [
  { key: "starter", label: "Starter", basePrice: 12500, maxModules: 3 },
  { key: "recommended", label: "Recommended", basePrice: 29000, maxModules: 7 },
  { key: "enterprise", label: "Enterprise", basePrice: 55000, maxModules: 10 },
]

export const TEAM_SIZES = [
  { label: "1 person", multiplier: 1 },
  { label: "2–5 people", multiplier: 3 },
  { label: "5–10 people", multiplier: 7 },
  { label: "10+ people", multiplier: 12 },
] as const

export function computeDynamicPrice(selectedModuleCount: number): PricingTier {
  if (selectedModuleCount <= 3) return PRICING_TIERS[0]
  if (selectedModuleCount <= 7) return PRICING_TIERS[1]
  return PRICING_TIERS[2]
}

const WORK_DAYS_PER_YEAR = 250

export function computeAnnualValue(
  minutesPerDay: number,
  hourlyWage: number | null
): number {
  const wage = hourlyWage ?? 100
  return Math.round((minutesPerDay / 60) * wage * WORK_DAYS_PER_YEAR)
}

// Public-facing companion to computeAnnualValue — same day count, hours only.
// Used on surfaces where showing dollars reads as labor-cost math.
export function computeAnnualHours(minutesPerDay: number): number {
  return Math.round((minutesPerDay * WORK_DAYS_PER_YEAR) / 60)
}

export function computeROI(
  minutesPerDay: number,
  hourlyWage: number | null
): ROIEstimate {
  const wage = hourlyWage ?? 100
  return {
    minutesPerDay,
    annualValue: computeAnnualValue(minutesPerDay, hourlyWage),
    hourlyWage: wage,
  }
}
