import type { PricingTier, ROIEstimate } from "@/types"

export const PRICING_TIERS: PricingTier[] = [
  { key: "starter", label: "Starter", basePrice: 12500, maxModules: 3 },
  { key: "recommended", label: "Recommended", basePrice: 29000, maxModules: 7 },
  { key: "enterprise", label: "Enterprise", basePrice: 55000, maxModules: 10 },
]

export function computeDynamicPrice(selectedModuleCount: number): PricingTier {
  if (selectedModuleCount <= 3) return PRICING_TIERS[0]
  if (selectedModuleCount <= 7) return PRICING_TIERS[1]
  return PRICING_TIERS[2]
}

export function computeAnnualValue(
  minutesPerDay: number,
  hourlyWage: number | null
): number {
  const wage = hourlyWage ?? 100
  return Math.round((minutesPerDay / 60) * wage * 250)
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
