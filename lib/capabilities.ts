import { createServerClient } from "@/lib/supabase/server"
import type { ModuleCapability } from "@/types"

/**
 * Fetch all capabilities for a given module key.
 */
export async function getCapabilitiesForModule(moduleKey: string): Promise<ModuleCapability[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("module_capabilities")
    .select("*")
    .eq("module_key", moduleKey)
    .order("capability_name")

  if (error) {
    console.error(`Error fetching capabilities for ${moduleKey}:`, error)
    return []
  }
  return data as ModuleCapability[]
}

/**
 * Fetch all capabilities, grouped by module key.
 */
export async function getAllCapabilities(): Promise<Record<string, ModuleCapability[]>> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("module_capabilities")
    .select("*")
    .order("module_key")
    .order("capability_name")

  if (error) {
    console.error("Error fetching capabilities:", error)
    return {}
  }

  const grouped: Record<string, ModuleCapability[]> = {}
  for (const cap of data as ModuleCapability[]) {
    if (!grouped[cap.module_key]) grouped[cap.module_key] = []
    grouped[cap.module_key].push(cap)
  }
  return grouped
}

/**
 * Fetch capabilities relevant to a set of micro-task IDs.
 * Returns capabilities that have been mapped to those tasks.
 */
export async function getCapabilitiesForTasks(
  taskIds: number[]
): Promise<Record<string, ModuleCapability[]>> {
  if (taskIds.length === 0) return {}

  const supabase = await createServerClient()
  const { data: mappings, error: mapError } = await supabase
    .from("task_capability_mappings")
    .select("capability_key")
    .in("micro_task_id", taskIds)

  if (mapError || !mappings?.length) return {}

  const capKeys = [...new Set(mappings.map((m: { capability_key: string }) => m.capability_key))]

  const { data: caps, error: capError } = await supabase
    .from("module_capabilities")
    .select("*")
    .in("capability_key", capKeys)

  if (capError || !caps) return {}

  const grouped: Record<string, ModuleCapability[]> = {}
  for (const cap of caps as ModuleCapability[]) {
    if (!grouped[cap.module_key]) grouped[cap.module_key] = []
    grouped[cap.module_key].push(cap)
  }
  return grouped
}
