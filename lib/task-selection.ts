import type { MicroTask } from "@/types"
import { getBlockForTask } from "@/lib/blueprint"

export function encodeTaskSelections(taskIds: number[]): string {
  return taskIds.join(",")
}

export function decodeTaskSelections(param: string): number[] {
  return param
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n))
}

export function tasksToModuleKeys(
  tasks: MicroTask[],
  selectedIds: number[]
): string[] {
  const selectedSet = new Set(selectedIds)
  const moduleKeys = new Set<string>()

  for (const task of tasks) {
    if (selectedSet.has(task.id)) {
      moduleKeys.add(getBlockForTask(task))
    }
  }

  return Array.from(moduleKeys)
}
