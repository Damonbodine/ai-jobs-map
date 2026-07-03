// lib/demo/resolve-demo-content.ts
import { db } from "@/lib/db/client"
import { demoAgentContent, demoAgentContentV2 } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
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

  try {
    // 1. Check v2 cache first
    const cachedV2 = await db
      .select({
        narrative: demoAgentContentV2.narrative,
        loopData: demoAgentContentV2.loopData,
        outputData: demoAgentContentV2.outputData,
      })
      .from(demoAgentContentV2)
      .where(
        and(
          eq(demoAgentContentV2.occupationId, occupationId),
          eq(demoAgentContentV2.moduleKey, moduleKey)
        )
      )
      .limit(1)

    if (cachedV2.length > 0) {
      return {
        narrative: cachedV2[0].narrative,
        loop:      cachedV2[0].loopData as AgentLoopContent,
        output:    cachedV2[0].outputData as AgentOutput,
      }
    }

    // 2. Fall back to v1 cache
    const cachedV1 = await db
      .select({
        narrative: demoAgentContent.narrative,
        loopData: demoAgentContent.loopData,
        outputData: demoAgentContent.outputData,
      })
      .from(demoAgentContent)
      .where(
        and(
          eq(demoAgentContent.occupationId, occupationId),
          eq(demoAgentContent.moduleKey, moduleKey)
        )
      )
      .limit(1)

    if (cachedV1.length > 0) {
      return {
        narrative: cachedV1[0].narrative,
        loop:      cachedV1[0].loopData as AgentLoopContent,
        output:    cachedV1[0].outputData as AgentOutput,
      }
    }
  } catch (err) {
    console.error("[resolveAgentContent] cache read failed:", err)
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

  try {
    // 4. Upsert into v2 cache only (ignore conflicts — concurrent request may have written first)
    await db.insert(demoAgentContentV2)
      .values({
        occupationId,
        moduleKey,
        agentName:    meta.agentName,
        label:         meta.label,
        accentColor:  meta.accentColor,
        timeOfDay:   meta.timeOfDay,
        narrative:     generated.narrative,
        loopData:     generated.loop,
        outputData:   generated.output,
      })
      .onConflictDoUpdate({
        target: [demoAgentContentV2.occupationId, demoAgentContentV2.moduleKey],
        set: {
          agentName:    meta.agentName,
          label:         meta.label,
          accentColor:  meta.accentColor,
          timeOfDay:   meta.timeOfDay,
          narrative:     generated.narrative,
          loopData:     generated.loop,
          outputData:   generated.output,
        }
      })
  } catch (upsertError) {
    console.error("[resolveAgentContent] upsert to v2 failed:", upsertError)
  }

  return {
    narrative: generated.narrative,
    loop:      generated.loop,
    output:    generated.output,
  }
}

