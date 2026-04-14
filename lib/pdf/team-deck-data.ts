import type { MicroTask, AutomationProfile } from "@/types"
import { estimateTaskMinutes, inferArchetypeMultiplier, computeDisplayedTimeback } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
import { computeAnnualValue } from "@/lib/pricing"
import { PDF_MODULE_ACCENTS } from "./styles"

/**
 * What fraction of the original task time remains after AI assistance,
 * derived from ai_impact_level. Impact 5 = 85% reduction = 0.15 retained.
 */
export function impactRetentionFactor(impactLevel: number | null): number {
  switch (impactLevel) {
    case 5: return 0.15
    case 4: return 0.30
    case 3: return 0.50
    case 2: return 0.70
    case 1: return 0.85
    default: return 0.50
  }
}
