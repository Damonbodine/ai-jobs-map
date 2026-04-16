// lib/demo/resolve-demo-content.ts
import { createServerClient } from "@/lib/supabase/server"
import { generateDemoContent } from "./generate-demo-content"
import { getAgentMetadata } from "./agent-metadata"
import type { AgentLoopContent, AgentOutput } from "./types"
import type { MicroTask } from "@/types"
import type { ModuleKey } from "@/lib/modules"

export type ResolvedAgentContent = {
  narrative: string
  loop: AgentLoopContent
  output: AgentOutput
}

type ResolveInput = {
  occupationId: number
  occupationTitle: string
  moduleKey: string
  tasks: MicroTask[]
}

export async function resolveAgentContent(input: ResolveInput): Promise<ResolvedAgentContent> {
  const { occupationId, occupationTitle, moduleKey, tasks } = input
  const supabase = createServerClient()

  // 1. Check cache
  const { data: cached } = await supabase
    .from("demo_agent_content")
    .select("narrative, loop_data, output_data")
    .eq("occupation_id", occupationId)
    .eq("module_key", moduleKey)
    .single()

  if (cached) {
    return {
      narrative: cached.narrative,
      loop:      cached.loop_data as AgentLoopContent,
      output:    cached.output_data as AgentOutput,
    }
  }

  // 2. Generate fresh content
  const generated = await generateDemoContent({ occupationTitle, moduleKey, tasks })

  const meta = getAgentMetadata(moduleKey as ModuleKey)

  // 3. Upsert into cache (ignore conflicts — concurrent request may have written first)
  await supabase.from("demo_agent_content").upsert(
    {
      occupation_id: occupationId,
      module_key:    moduleKey,
      agent_name:    meta.agentName,
      label:         meta.label,
      accent_color:  meta.accentColor,
      time_of_day:   meta.timeOfDay,
      narrative:     generated.narrative,
      loop_data:     generated.loop,
      output_data:   generated.output,
    },
    { onConflict: "occupation_id,module_key" }
  )

  return {
    narrative: generated.narrative,
    loop:      generated.loop,
    output:    generated.output,
  }
}
