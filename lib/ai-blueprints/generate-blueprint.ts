import type {
  AgentBlueprint,
  BlockAgent,
  TaskSpec,
  AutomationTier,
  AiPattern,
  ArchitectureType,
  OrchestrationPattern,
  ComplexityTier,
} from './types';
import {
  categoryToPattern,
  blockDefaultPattern,
  normalizeTools,
  blockRoleTemplates,
  describeAutomationApproach,
} from './constants';

// ── Input types ────────────────────────────────────────────────

interface TaskEntry {
  task_name: string;
  task_description: string;
  frequency: string;
  ai_applicable: boolean;
  ai_impact_level: number | null;
  ai_effort_to_implement: number | null;
  ai_category: string | null;
  ai_tools: string | null;
  ai_how_it_helps: string | null;
  workBlock: string;
  lens: { modeledMinutesPerDay: number };
}

interface OnetTask {
  task_title: string;
  ai_automation_score: number | null;
  ai_difficulty: string | null;
  estimated_time_saved_percent: number | null;
  gwa_title: string | null;
}

interface ArchetypeProfile {
  archetype: string;
  timeBackMultiplier: number;
}

// ── Universal quick wins ───────────────────────────────────────
// These apply to every occupation — the admin overhead everyone has.
// Time estimates based on research: McKinsey (2023) found knowledge workers
// spend 28% of time on email, 19% on information gathering, 14% on communication.
// Reclaim.ai (2024): avg professional spends 21.5 hrs/wk in meetings.
// Grammarly (2024): workers spend 88% of workweek communicating.

const universalQuickWins: TaskEntry[] = [
  {
    task_name: 'Email triage and response drafting',
    task_description: 'Sort incoming email by priority, draft routine responses, flag items needing attention',
    frequency: 'daily',
    ai_applicable: true,
    ai_impact_level: 4,
    ai_effort_to_implement: 2,
    ai_category: 'communication',
    ai_tools: 'Email,LLM',
    ai_how_it_helps: 'AI reads and prioritizes incoming mail, drafts routine replies, and surfaces only what needs your judgment',
    workBlock: 'intake',
    lens: { modeledMinutesPerDay: 15 },
  },
  {
    task_name: 'Meeting prep and follow-up notes',
    task_description: 'Summarize context before meetings, capture action items after, distribute notes',
    frequency: 'daily',
    ai_applicable: true,
    ai_impact_level: 4,
    ai_effort_to_implement: 2,
    ai_category: 'task_automation',
    ai_tools: 'Calendar,LLM,Documents',
    ai_how_it_helps: 'AI pulls context before meetings and generates structured notes with action items after',
    workBlock: 'coordination',
    lens: { modeledMinutesPerDay: 12 },
  },
  {
    task_name: 'Document and report drafting',
    task_description: 'Generate first drafts of recurring reports, memos, and status updates from templates and data',
    frequency: 'weekly',
    ai_applicable: true,
    ai_impact_level: 4,
    ai_effort_to_implement: 2,
    ai_category: 'creative_assistance',
    ai_tools: 'LLM,Documents,Spreadsheet',
    ai_how_it_helps: 'AI drafts recurring documents from templates and data — you refine rather than create from scratch',
    workBlock: 'documentation',
    lens: { modeledMinutesPerDay: 8 },
  },
  {
    task_name: 'Scheduling and calendar management',
    task_description: 'Coordinate meeting times, handle rescheduling, manage availability across calendars',
    frequency: 'daily',
    ai_applicable: true,
    ai_impact_level: 3,
    ai_effort_to_implement: 1,
    ai_category: 'task_automation',
    ai_tools: 'Calendar,Email',
    ai_how_it_helps: 'AI handles scheduling logistics — finding times, sending invites, rescheduling conflicts',
    workBlock: 'coordination',
    lens: { modeledMinutesPerDay: 8 },
  },
  {
    task_name: 'Information lookup and research',
    task_description: 'Find answers to routine questions, pull reference data, summarize background materials',
    frequency: 'daily',
    ai_applicable: true,
    ai_impact_level: 3,
    ai_effort_to_implement: 2,
    ai_category: 'research_discovery',
    ai_tools: 'LLM,Database',
    ai_how_it_helps: 'AI searches, retrieves, and summarizes relevant information so you skip the digging',
    workBlock: 'analysis',
    lens: { modeledMinutesPerDay: 10 },
  },
];

// ── O*NET task enrichment ──────────────────────────────────────

function inferBlockFromGwa(gwaTitle: string | null, taskTitle: string): string {
  const text = `${gwaTitle || ''} ${taskTitle}`.toLowerCase();
  if (/(communicat|correspond|contact|inform|advise|consult|coach|present)/.test(text)) return 'coordination';
  if (/(analyz|evaluat|examin|estimat|assess|study|research|interpret|investigat)/.test(text)) return 'analysis';
  if (/(prepar|document|record|report|write|develop|design|plan|creat|draft)/.test(text)) return 'documentation';
  if (/(monitor|inspect|test|check|verify|audit|review|supervise|maintain)/.test(text)) return 'exceptions';
  return 'intake';
}

function enrichWithOnetTasks(
  taskEntries: TaskEntry[],
  onetTasks: OnetTask[],
  archetype: ArchetypeProfile
): TaskEntry[] {
  if (!onetTasks || onetTasks.length === 0) return taskEntries;

  // Only add O*NET tasks that aren't already covered by micro-tasks
  const existingNames = new Set(taskEntries.map(t => t.task_name.toLowerCase()));
  const enriched = [...taskEntries];

  for (const onet of onetTasks) {
    if (!onet.task_title || !onet.ai_automation_score) continue;
    if (onet.ai_automation_score < 40) continue; // Only add meaningfully automatable tasks

    // Skip if a micro-task already covers this (fuzzy check on first 4 words)
    const shortTitle = onet.task_title.toLowerCase().split(' ').slice(0, 4).join(' ');
    if ([...existingNames].some(n => n.includes(shortTitle) || shortTitle.includes(n.split(' ').slice(0, 4).join(' ')))) continue;

    const block = inferBlockFromGwa(onet.gwa_title, onet.task_title);
    const score = onet.ai_automation_score;
    const impact = score >= 70 ? 4 : score >= 50 ? 3 : 2;
    const effort = onet.ai_difficulty === 'easy' ? 2 : onet.ai_difficulty === 'hard' ? 4 : 3;
    const timeSavedPct = onet.estimated_time_saved_percent || 25;

    // Estimate minutes: base 8 min for a task, scaled by time saved %
    const baseMinutes = Math.round(8 * (timeSavedPct / 100) * archetype.timeBackMultiplier);

    enriched.push({
      task_name: onet.task_title.length > 80 ? onet.task_title.substring(0, 77) + '...' : onet.task_title,
      task_description: onet.task_title,
      frequency: 'weekly',
      ai_applicable: true,
      ai_impact_level: impact,
      ai_effort_to_implement: effort,
      ai_category: block === 'analysis' ? 'research_discovery' : block === 'documentation' ? 'creative_assistance' : block === 'coordination' ? 'communication' : 'task_automation',
      ai_tools: null,
      ai_how_it_helps: null,
      workBlock: block,
      lens: { modeledMinutesPerDay: Math.max(1, baseMinutes) },
    });

    existingNames.add(onet.task_title.toLowerCase());
  }

  return enriched;
}

// ── Stage 1: Classify tasks into automation tiers ──────────────

function classifyTier(task: TaskEntry): AutomationTier {
  if (!task.ai_applicable) return 'human-only';

  const impact = task.ai_impact_level ?? 0;
  const effort = task.ai_effort_to_implement ?? 3;

  if (impact >= 4 && effort <= 2) return 'automated';
  if (impact >= 3) return 'assisted';
  if (impact >= 2 && effort <= 3) return 'assisted';

  return 'human-only';
}

// ── Stage 2: Build per-block agent specifications ──────────────

function buildBlockAgent(
  blockKey: string,
  blockLabel: string,
  tasks: TaskEntry[],
  occupationTitle: string,
  archetype: ArchetypeProfile
): BlockAgent | null {
  const classified = tasks.map((task) => {
    const tier = classifyTier(task);
    return { task, tier };
  });

  const automated = classified.filter((c) => c.tier === 'automated');
  const assisted = classified.filter((c) => c.tier === 'assisted');
  const humanOnly = classified.filter((c) => c.tier === 'human-only');

  if (automated.length === 0 && assisted.length === 0) return null;

  const categoryCounts: Record<string, number> = {};
  for (const { task } of [...automated, ...assisted]) {
    const cat = task.ai_category || 'task_automation';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'task_automation';
  const primaryPattern: AiPattern = categoryToPattern[dominantCategory] || blockDefaultPattern[blockKey] || 'autonomous-agent';

  const allTools = tasks.flatMap((t) => normalizeTools(t.ai_tools));
  const toolAccess = [...new Set(allTools)].slice(0, 6);

  const rawMinutes = [...automated, ...assisted].reduce(
    (sum, { task }) => sum + task.lens.modeledMinutesPerDay, 0
  );
  const minutesSaved = Math.round(rawMinutes);

  const completeTasks = [...automated, ...assisted].filter(
    ({ task }) => task.ai_impact_level != null && task.ai_category != null
  ).length;
  const totalActionable = automated.length + assisted.length;
  const confidenceScore = totalActionable > 0 ? Math.round((completeTasks / totalActionable) * 100) / 100 : 0.5;

  const shortTitle = occupationTitle.split(',')[0].trim();

  const toTaskSpec = (items: { task: TaskEntry; tier: AutomationTier }[]): TaskSpec[] =>
    items.map(({ task, tier }) => ({
      taskName: task.task_name,
      frequency: task.frequency,
      minutesPerDay: task.lens.modeledMinutesPerDay,
      automationApproach: describeAutomationApproach(tier, task.ai_category, task.task_name),
      tier,
    }));

  return {
    blockKey,
    blockLabel,
    agentName: `${shortTitle} ${blockLabel.split(' ')[0]} Agent`,
    agentRole: (blockRoleTemplates[blockKey] || blockRoleTemplates.intake)(shortTitle.toLowerCase()),
    primaryPattern,
    toolAccess,
    automatedTasks: toTaskSpec(automated),
    assistedTasks: toTaskSpec(assisted),
    humanOnlyTasks: toTaskSpec(humanOnly),
    minutesSaved,
    confidenceScore,
  };
}

// ── Stage 3: Determine overall architecture ────────────────────

function determineArchitecture(agents: BlockAgent[]): {
  type: ArchitectureType;
  rationale: string;
} {
  const activeCount = agents.length;
  const totalTasks = agents.reduce((s, a) => s + a.automatedTasks.length + a.assistedTasks.length, 0);
  const coordinationAgent = agents.find((a) => a.blockKey === 'coordination');
  const coordinationDominant = coordinationAgent && coordinationAgent.minutesSaved > agents.reduce((s, a) => s + a.minutesSaved, 0) * 0.35;

  if (activeCount <= 2) {
    return {
      type: 'single-agent',
      rationale: `A focused AI assistant handling ${totalTasks} tasks across ${activeCount === 1 ? 'one area' : 'two areas'} of your work — streamlining the routine so you focus on what matters.`,
    };
  }

  if (coordinationDominant) {
    return {
      type: 'hub-and-spoke',
      rationale: `A coordinator agent manages the flow across ${activeCount} specialized agents — routing tasks, tracking follow-ups, and keeping everything in sync.`,
    };
  }

  return {
    type: 'multi-agent',
    rationale: `${activeCount} specialized agents work in parallel across different parts of your day — each focused on what it does best, sharing context where needed.`,
  };
}

function determineOrchestration(
  agents: BlockAgent[],
  tasks: TaskEntry[]
): AgentBlueprint['orchestration'] {
  const freqCounts: Record<string, number> = {};
  for (const t of tasks) {
    freqCounts[t.frequency] = (freqCounts[t.frequency] || 0) + 1;
  }
  const dominant = Object.entries(freqCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'daily';

  let pattern: OrchestrationPattern = 'parallel';
  if (dominant === 'daily') pattern = 'event-driven';
  else if (dominant === 'weekly' || dominant === 'monthly') pattern = 'scheduled';

  const humanCheckpoints = agents
    .filter((a) => a.assistedTasks.length > a.automatedTasks.length)
    .map((a) => a.blockLabel);

  const sharedContext: string[] = [];
  if (agents.some(a => a.blockKey === 'intake') && agents.some(a => a.blockKey === 'analysis')) {
    sharedContext.push('Intake findings feed into analysis');
  }
  if (agents.some(a => a.blockKey === 'analysis') && agents.some(a => a.blockKey === 'documentation')) {
    sharedContext.push('Analysis results inform document drafts');
  }
  if (agents.some(a => a.blockKey === 'coordination')) {
    sharedContext.push('Coordination agent tracks status across all areas');
  }
  if (agents.some(a => a.blockKey === 'exceptions')) {
    sharedContext.push('Exception flags route to the relevant agent');
  }

  return { pattern, humanCheckpoints, sharedContext };
}

// ── Stage 4: Compute impact ────────────────────────────────────

function computeImpact(agents: BlockAgent[]): AgentBlueprint['impact'] {
  const totalMinutesSaved = agents.reduce((s, a) => s + a.minutesSaved, 0);
  const automatedTaskCount = agents.reduce((s, a) => s + a.automatedTasks.length, 0);
  const assistedTaskCount = agents.reduce((s, a) => s + a.assistedTasks.length, 0);
  const humanRetainedTaskCount = agents.reduce((s, a) => s + a.humanOnlyTasks.length, 0);

  const highestImpactAgent = [...agents].sort((a, b) => b.minutesSaved - a.minutesSaved)[0];
  const highestImpactBlock = highestImpactAgent?.blockLabel || 'General';

  let complexity: ComplexityTier = 'starter';
  if (totalMinutesSaved >= 60) complexity = 'enterprise';
  else if (totalMinutesSaved >= 30) complexity = 'growth';

  return {
    totalMinutesSaved,
    automatedTaskCount,
    assistedTaskCount,
    humanRetainedTaskCount,
    highestImpactBlock,
    complexity,
  };
}

// ── Main export ────────────────────────────────────────────────

const blockLabels: Record<string, string> = {
  intake: 'Intake & signal review',
  analysis: 'Analysis & decision prep',
  documentation: 'Documentation & deliverables',
  coordination: 'Coordination & follow-through',
  exceptions: 'Monitoring & exceptions',
};

export function generateBlueprint(
  taskEntries: TaskEntry[],
  archetype: ArchetypeProfile,
  occupationTitle: string,
  onetTasks?: OnetTask[]
): AgentBlueprint | null {
  // Enrich with O*NET tasks — adds automatable tasks from government data
  let allTasks = onetTasks
    ? enrichWithOnetTasks(taskEntries, onetTasks, archetype)
    : taskEntries;

  // If still thin coverage (< 3 AI-applicable tasks), inject universal quick wins
  const aiApplicableCount = allTasks.filter(t => t.ai_applicable).length;
  if (aiApplicableCount < 3) {
    // Apply archetype multiplier to universal quick wins
    const scaledWins = universalQuickWins.map(w => ({
      ...w,
      lens: { modeledMinutesPerDay: Math.round(w.lens.modeledMinutesPerDay * archetype.timeBackMultiplier) },
    }));
    allTasks = [...allTasks, ...scaledWins];
  }

  // Group tasks by work block
  const blockGroups: Record<string, TaskEntry[]> = {};
  for (const task of allTasks) {
    const block = task.workBlock;
    if (!blockGroups[block]) blockGroups[block] = [];
    blockGroups[block].push(task);
  }

  // Build agent per block
  const agents: BlockAgent[] = [];
  for (const [blockKey, tasks] of Object.entries(blockGroups)) {
    const agent = buildBlockAgent(
      blockKey,
      blockLabels[blockKey] || blockKey,
      tasks,
      occupationTitle,
      archetype
    );
    if (agent) agents.push(agent);
  }

  // Fallback: if no agents from role data, always show universal quick wins
  if (agents.length === 0) {
    const scaledWins = universalQuickWins.map(w => ({
      ...w,
      lens: { modeledMinutesPerDay: Math.round(w.lens.modeledMinutesPerDay * archetype.timeBackMultiplier) },
    }));
    const fallbackGroups: Record<string, TaskEntry[]> = {};
    for (const task of scaledWins) {
      if (!fallbackGroups[task.workBlock]) fallbackGroups[task.workBlock] = [];
      fallbackGroups[task.workBlock].push(task);
    }
    for (const [blockKey, tasks] of Object.entries(fallbackGroups)) {
      const agent = buildBlockAgent(blockKey, blockLabels[blockKey] || blockKey, tasks, occupationTitle, archetype);
      if (agent) agents.push(agent);
    }
  }

  if (agents.length === 0) return null;

  agents.sort((a, b) => b.minutesSaved - a.minutesSaved);

  const architecture = determineArchitecture(agents);
  const orchestration = determineOrchestration(agents, allTasks);
  const impact = computeImpact(agents);

  return {
    architectureType: architecture.type,
    architectureRationale: architecture.rationale,
    agents,
    orchestration,
    impact,
  };
}
