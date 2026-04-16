import { estimateTaskMinutes } from "@/lib/timeback"
import { getBlockForTask } from "@/lib/blueprint"
import type { MicroTask } from "@/types"

export type SelectedModule = {
  moduleKey: string
  tasks: MicroTask[]
  totalMinutes: number
}

export function selectDemoModules(tasks: MicroTask[], maxModules = 5): SelectedModule[] {
  const aiTasks = tasks.filter((t) => t.ai_applicable)

  const moduleMap = new Map<string, MicroTask[]>()
  for (const task of aiTasks) {
    const key = getBlockForTask(task)
    const existing = moduleMap.get(key) ?? []
    existing.push(task)
    moduleMap.set(key, existing)
  }

  const modules: SelectedModule[] = []
  for (const [moduleKey, moduleTasks] of moduleMap.entries()) {
    const totalMinutes = moduleTasks.reduce((sum, t) => sum + estimateTaskMinutes(t), 0)
    modules.push({ moduleKey, tasks: moduleTasks, totalMinutes })
  }

  return modules
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, maxModules)
}
