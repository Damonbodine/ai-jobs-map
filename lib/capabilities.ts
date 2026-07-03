import { db } from "@/lib/db/client"
import { moduleCapabilities, taskCapabilityMappings } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import type { ModuleCapability } from "@/types"

/**
 * Fetch all capabilities for a given module key.
 */
export async function getCapabilitiesForModule(moduleKey: string): Promise<ModuleCapability[]> {
  try {
    const data = await db
      .select({
        id: moduleCapabilities.id,
        module_key: moduleCapabilities.moduleKey,
        capability_key: moduleCapabilities.capabilityKey,
        capability_name: moduleCapabilities.capabilityName,
        description: moduleCapabilities.description,
        example_tasks: moduleCapabilities.exampleTasks,
        likely_systems: moduleCapabilities.likelySystems,
      })
      .from(moduleCapabilities)
      .where(eq(moduleCapabilities.moduleKey, moduleKey))
      .orderBy(moduleCapabilities.capabilityName)

    return data as ModuleCapability[]
  } catch (error) {
    console.error(`Error fetching capabilities for ${moduleKey}:`, error)
    return []
  }
}

/**
 * Fetch all capabilities, grouped by module key.
 */
export async function getAllCapabilities(): Promise<Record<string, ModuleCapability[]>> {
  try {
    const data = await db
      .select({
        id: moduleCapabilities.id,
        module_key: moduleCapabilities.moduleKey,
        capability_key: moduleCapabilities.capabilityKey,
        capability_name: moduleCapabilities.capabilityName,
        description: moduleCapabilities.description,
        example_tasks: moduleCapabilities.exampleTasks,
        likely_systems: moduleCapabilities.likelySystems,
      })
      .from(moduleCapabilities)
      .orderBy(moduleCapabilities.moduleKey, moduleCapabilities.capabilityName)

    const grouped: Record<string, ModuleCapability[]> = {}
    for (const cap of data as ModuleCapability[]) {
      if (!grouped[cap.module_key]) grouped[cap.module_key] = []
      grouped[cap.module_key].push(cap)
    }
    return grouped
  } catch (error) {
    console.error("Error fetching capabilities:", error)
    return {}
  }
}

/**
 * Fetch capabilities relevant to a set of micro-task IDs.
 * Returns capabilities that have been mapped to those tasks.
 */
export async function getCapabilitiesForTasks(
  taskIds: number[]
): Promise<Record<string, ModuleCapability[]>> {
  if (taskIds.length === 0) return {}

  try {
    const mappings = await db
      .select({
        capability_key: taskCapabilityMappings.capabilityKey,
      })
      .from(taskCapabilityMappings)
      .where(inArray(taskCapabilityMappings.microTaskId, taskIds))

    if (!mappings?.length) return {}

    const capKeys = [...new Set(mappings.map((m) => m.capability_key))]

    const caps = await db
      .select({
        id: moduleCapabilities.id,
        module_key: moduleCapabilities.moduleKey,
        capability_key: moduleCapabilities.capabilityKey,
        capability_name: moduleCapabilities.capabilityName,
        description: moduleCapabilities.description,
        example_tasks: moduleCapabilities.exampleTasks,
        likely_systems: moduleCapabilities.likelySystems,
      })
      .from(moduleCapabilities)
      .where(inArray(moduleCapabilities.capabilityKey, capKeys))

    if (!caps) return {}

    const grouped: Record<string, ModuleCapability[]> = {}
    for (const cap of caps as ModuleCapability[]) {
      if (!grouped[cap.module_key]) grouped[cap.module_key] = []
      grouped[cap.module_key].push(cap)
    }
    return grouped
  } catch (error) {
    console.error("Error fetching capabilities for tasks:", error)
    return {}
  }
}

