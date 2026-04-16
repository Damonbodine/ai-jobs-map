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
  beforeMinutes?: number
  afterMinutes?: number
}

export async function resolveAgentContent(input: ResolveInput): Promise<ResolvedAgentContent> {
  const { occupationId, occupationTitle, moduleKey, tasks, beforeMinutes, afterMinutes } = input
  const supabase = createServerClient()

  // 1. Check v2 cache first
  const { data: cachedV2 } = await supabase
    .from("demo_agent_content_v2")
    .select("narrative, loop_data, output_data")
    .eq("occupation_id", occupationId)
    .eq("module_key", moduleKey)
    .single()

  if (cachedV2) {
    return {
      narrative: cachedV2.narrative,
      loop:      cachedV2.loop_data as AgentLoopContent,
      output:    cachedV2.output_data as AgentOutput,
    }
  }

  // 2. Fall back to v1 cache
  const { data: cachedV1 } = await supabase
    .from("demo_agent_content")
    .select("narrative, loop_data, output_data")
    .eq("occupation_id", occupationId)
    .eq("module_key", moduleKey)
    .single()

  if (cachedV1) {
    return {
      narrative: cachedV1.narrative,
      loop:      cachedV1.loop_data as AgentLoopContent,
      output:    cachedV1.output_data as AgentOutput,
    }
  }

  // 3. Generate fresh content
  const generated = await generateDemoContent({
    occupationTitle,
    moduleKey,
    tasks,
    beforeMinutes,
    afterMinutes,
  })

  const meta = getAgentMetadata(moduleKey as ModuleKey)
  if (!meta) throw new Error(`Unknown moduleKey: ${moduleKey}`)

  // 4. Upsert into v2 cache only (ignore conflicts — concurrent request may have written first)
  const { error: upsertError } = await supabase.from("demo_agent_content_v2").upsert(
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
  if (upsertError) console.error("[resolveAgentContent] upsert to v2 failed:", upsertError)

  return {
    narrative: generated.narrative,
    loop:      generated.loop,
    output:    generated.output,
  }
}
