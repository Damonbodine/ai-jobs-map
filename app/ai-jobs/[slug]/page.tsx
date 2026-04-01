import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { pool } from '@/lib/db/pool';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { DayChart } from '@/components/occupation/day-chart';
import { TimeBackChart } from '@/components/occupation/time-back-chart';
import { CountUp } from '@/components/ui/count-up';
import { FadeIn } from '@/components/ui/fade-in';
import { getOccupationRecommendationSnapshot } from '@/lib/ai-jobs/recommendations';
import { classifyOccupation, modulateTimeBack } from '@/lib/ai-jobs/archetypes';
import { DayValueMap } from '@/components/occupation/day-value-map';
import { Footer } from '@/components/ui/footer';
import { generateBlueprint } from '@/lib/ai-blueprints/generate-blueprint';
import { BlueprintSection } from '@/components/ai-blueprint/blueprint-section';
import { TrackedLink } from '@/components/analytics/tracked-link';
import { TrackPageView } from '@/components/analytics/track-page-view';
import { deriveBlendedTimeBack } from '@/lib/ai-jobs/timeback';

const opportunityCategoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  task_automation: { label: 'Routine support', color: 'bg-blue-500', icon: '🤖' },
  decision_support: { label: 'Decision prep', color: 'bg-purple-500', icon: '🎯' },
  research_discovery: { label: 'Research help', color: 'bg-green-500', icon: '🔬' },
  communication: { label: 'Communication support', color: 'bg-orange-500', icon: '💬' },
  creative_assistance: { label: 'Drafting help', color: 'bg-pink-500', icon: '🎨' },
  data_analysis: { label: 'Analysis support', color: 'bg-cyan-500', icon: '📊' },
  learning_education: { label: 'Learning support', color: 'bg-yellow-500', icon: '📚' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'text-green-400 bg-green-400/20' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-400 bg-yellow-400/20' },
  advanced: { label: 'Advanced', color: 'text-red-400 bg-red-400/20' },
};

const frequencyMeta: Record<string, { label: string; dayWeight: number; tone: string }> = {
  daily: { label: 'Daily', dayWeight: 1, tone: 'bg-cyan-500/12 text-cyan-300 border-cyan-500/20' },
  weekly: { label: 'Weekly', dayWeight: 0.35, tone: 'bg-indigo-500/12 text-indigo-300 border-indigo-500/20' },
  monthly: { label: 'Monthly', dayWeight: 0.12, tone: 'bg-violet-500/12 text-violet-300 border-violet-500/20' },
  'as-needed': { label: 'As Needed', dayWeight: 0.18, tone: 'bg-slate-500/12 text-slate-300 border-slate-500/20' },
};

const workBlockDefinitions = {
  intake: {
    label: 'Intake & signal review',
    tone: 'from-cyan-500/20 via-cyan-500/8 to-transparent',
    border: 'border-cyan-500/20',
    accent: 'text-cyan-300',
    posture: 'Triage, collect, sort, and get the right signals into the workflow.',
    humanEdge: 'People still decide what matters, what is urgent, and what deserves attention.',
  },
  analysis: {
    label: 'Analysis & decision prep',
    tone: 'from-indigo-500/20 via-indigo-500/8 to-transparent',
    border: 'border-indigo-500/20',
    accent: 'text-indigo-300',
    posture: 'Summarize data, compare options, and prepare the next best recommendation.',
    humanEdge: 'The final call still depends on context, tradeoffs, and professional judgment.',
  },
  documentation: {
    label: 'Documentation & deliverables',
    tone: 'from-violet-500/18 via-violet-500/8 to-transparent',
    border: 'border-violet-500/20',
    accent: 'text-violet-300',
    posture: 'Draft the repeatable reports, layouts, summaries, and client-ready outputs.',
    humanEdge: 'Humans refine voice, accuracy, and the final standard of quality.',
  },
  coordination: {
    label: 'Coordination & follow-through',
    tone: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-300',
    posture: 'Route next steps, chase decisions, and keep the work moving across people.',
    humanEdge: 'Relationship management and stakeholder trust stay human-led.',
  },
  exceptions: {
    label: 'Monitoring & exceptions',
    tone: 'from-amber-500/18 via-amber-500/8 to-transparent',
    border: 'border-amber-500/20',
    accent: 'text-amber-300',
    posture: 'Flag outliers, surface risks, and move edge cases into human review.',
    humanEdge: 'Exception handling is where experience and judgment carry the most value.',
  },
  learning: {
    label: 'Learning & upskilling',
    tone: 'from-rose-500/18 via-rose-500/8 to-transparent',
    border: 'border-rose-500/20',
    accent: 'text-rose-300',
    posture: 'Curate training materials, track certifications, and surface skill gaps.',
    humanEdge: 'What to learn and why still requires professional judgment and career context.',
  },
  research: {
    label: 'Research & discovery',
    tone: 'from-teal-500/18 via-teal-500/8 to-transparent',
    border: 'border-teal-500/20',
    accent: 'text-teal-300',
    posture: 'Scan sources, synthesize findings, and deliver briefings on what matters.',
    humanEdge: 'Interpreting meaning and setting research direction stays human-led.',
  },
  compliance: {
    label: 'Compliance & regulatory',
    tone: 'from-red-500/18 via-red-500/8 to-transparent',
    border: 'border-red-500/20',
    accent: 'text-red-300',
    posture: 'Track regulatory changes, prepare audit docs, and monitor policy adherence.',
    humanEdge: 'Judgment calls on risk tolerance and enforcement strategy remain yours.',
  },
  communication: {
    label: 'Client & stakeholder communication',
    tone: 'from-orange-500/18 via-orange-500/8 to-transparent',
    border: 'border-orange-500/20',
    accent: 'text-orange-300',
    posture: 'Draft emails, prepare presentations, and write stakeholder updates.',
    humanEdge: 'Tone, relationship nuance, and sensitive conversations stay human.',
  },
  data_reporting: {
    label: 'Data & reporting',
    tone: 'from-sky-500/18 via-sky-500/8 to-transparent',
    border: 'border-sky-500/20',
    accent: 'text-sky-300',
    posture: 'Build dashboards, generate recurring reports, and track KPIs automatically.',
    humanEdge: 'Choosing what to measure and interpreting trends requires your expertise.',
  },
} as const;

const workBlockColors: Record<string, string> = {
  intake: '#06b6d4',       // cyan-500
  analysis: '#6366f1',     // indigo-500
  documentation: '#8b5cf6', // violet-500
  coordination: '#10b981',  // emerald-500
  exceptions: '#f59e0b',   // amber-500
  learning: '#f43f5e',     // rose-500
  research: '#14b8a6',     // teal-500
  compliance: '#ef4444',   // red-500
  communication: '#f97316', // orange-500
  data_reporting: '#0ea5e9', // sky-500
};

const automationSolutionDefinitions = [
  {
    key: 'intake',
    name: 'Intake Assistant',
    strapline: 'Turn messy requests, forms, emails, and documents into a clean starting queue.',
    watches: 'inboxes, submissions, requests, attachments, spreadsheets, and new records',
    produces: 'prioritized queues, structured summaries, routed assignments, and clean handoffs',
    review: 'humans keep priority, escalation, and final routing authority',
    matchCategories: ['communication', 'task_automation'],
    matchKeywords: ['collect', 'review', 'receive', 'screen', 'intake', 'request', 'capture', 'monitor'],
  },
  {
    key: 'analysis',
    name: 'Research Desk',
    strapline: 'Bundle recurring analysis, comparison, and recommendation prep into one system.',
    watches: 'datasets, briefs, vendor inputs, historical records, and recurring research prompts',
    produces: 'comparison tables, recommendation memos, summaries, and decision-ready briefs',
    review: 'humans still make the final call and set thresholds for risk',
    matchCategories: ['research_discovery', 'decision_support', 'data_analysis'],
    matchKeywords: ['analyze', 'evaluate', 'compare', 'research', 'assess', 'forecast', 'estimate', 'study'],
  },
  {
    key: 'documentation',
    name: 'Document Engine',
    strapline: 'Generate the repeatable paperwork and deliverables that quietly eat the day.',
    watches: 'notes, templates, source data, field inputs, and standard report formats',
    produces: 'draft reports, plans, summaries, layouts, forms, and client-ready documents',
    review: 'humans own final edits, accuracy checks, and sign-off',
    matchCategories: ['creative_assistance', 'communication', 'task_automation'],
    matchKeywords: ['design', 'draft', 'document', 'report', 'write', 'plan', 'layout', 'prepare'],
  },
  {
    key: 'coordination',
    name: 'Workflow Coordinator',
    strapline: 'Keep follow-ups, reminders, approvals, and next steps moving without manual chasing.',
    watches: 'status changes, due dates, approvals, inboxes, and collaboration tools',
    produces: 'follow-ups, reminders, meeting prep, escalations, and routed tasks',
    review: 'humans step in for sensitive communication and relationship moments',
    matchCategories: ['communication', 'task_automation'],
    matchKeywords: ['coordinate', 'schedule', 'follow', 'communicate', 'notify', 'update', 'track'],
  },
  {
    key: 'exceptions',
    name: 'Review Layer',
    strapline: 'Catch edge cases and surface the right items for human judgment instead of manual scanning.',
    watches: 'quality thresholds, exceptions, outliers, compliance checks, and unusual patterns',
    produces: 'exception queues, flagged records, confidence scores, and review packets',
    review: 'humans handle the exceptions rather than the whole stream',
    matchCategories: ['decision_support', 'data_analysis', 'learning_education'],
    matchKeywords: ['inspect', 'validate', 'verify', 'check', 'audit', 'test', 'monitor'],
  },
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}

function describeTaskLens(task: any) {
  const meta = frequencyMeta[task.frequency] ?? frequencyMeta['as-needed'];
  const impact = Number(task.ai_impact_level || 0);
  const effort = Number(task.ai_effort_to_implement || 3);
  const automationFactor = task.ai_applicable
    ? Math.max(0.24, (impact * 0.18) + ((6 - effort) * 0.08))
    : 0.06;
  const modeledMinutesPerDay = Math.round(meta.dayWeight * 26 * automationFactor);

  return {
    ...meta,
    impact,
    effort,
    automationFactor,
    modeledMinutesPerDay,
    modeledWeeklyMinutes: Math.round(modeledMinutesPerDay * 5),
  };
}

function inferWorkBlock(task: any) {
  const content = `${task.task_name || ''} ${task.task_description || ''} ${task.ai_how_it_helps || ''}`.toLowerCase();
  const category = String(task.ai_category || '').toLowerCase();

  // New blocks — check these first (more specific)
  if (
    category === 'learning_education' || category.includes('training') ||
    /(train|certif|skill gap|upskill|learn|course|curriculum|onboard|mentor|professional development)/.test(content)
  ) {
    return 'learning';
  }

  if (
    category.includes('compliance') || category.includes('regulatory') || category.includes('safety_compliance') ||
    /(regulat|compliance|audit|policy|licensure|accredit|legal requirement|safety protocol|hipaa|osha)/.test(content)
  ) {
    return 'compliance';
  }

  if (
    category === 'data_analysis' || category.includes('reporting') ||
    /(dashboard|kpi|metric|report generat|data visual|spreadsheet|tracking report|status report|analytics)/.test(content)
  ) {
    return 'data_reporting';
  }

  if (
    category === 'research_discovery' || category.includes('market_research') || category.includes('competitive') ||
    /(research|literature review|scan.*source|market intel|competitive|benchmark|survey|stay current|trend)/.test(content)
  ) {
    return 'research';
  }

  if (
    (category === 'communication' && /(email|draft|present|stakeholder|client|newsletter|memo|brief)/.test(content)) ||
    /(draft.*email|write.*update|prepare.*present|stakeholder.*update|client.*communicat|newsletter)/.test(content)
  ) {
    return 'communication';
  }

  // Original blocks
  if (
    category === 'communication' ||
    /(schedule|follow[- ]?up|coordinate|notify|respond|meeting|handoff|route)/.test(content)
  ) {
    return 'coordination';
  }

  if (
    category === 'decision_support' ||
    /(analy|evaluat|compare|assess|forecast|estimate|study|review options|recommend)/.test(content)
  ) {
    return 'analysis';
  }

  if (
    category === 'creative_assistance' ||
    /(design|draft|document|report|write|plan|layout|prepare|model)/.test(content)
  ) {
    return 'documentation';
  }

  if (
    /(inspect|validate|verify|check|monitor|quality|exception)/.test(content)
  ) {
    return 'exceptions';
  }

  return 'intake';
}

function toSentenceList(items: string[]) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function formatMinutes(minutes: number) {
  return `${minutes} min/day`;
}

function formatHours(hours: number) {
  if (hours >= 1) {
    return `${hours.toFixed(hours >= 2 ? 0 : 1)}h/day`;
  }

  return `${Math.round(hours * 60)} min/day`;
}

function scaleTaskMinutes(value: number, total: number, target: number, minimum = 1) {
  if (total <= 0 || target <= 0) {
    return Math.max(minimum, Math.round(value));
  }

  return Math.max(minimum, Math.round((value / total) * target));
}

function allocateWeightedMinutes<T>(
  items: T[],
  target: number,
  getWeight: (item: T) => number
) {
  if (items.length === 0) {
    return [];
  }

  if (target <= 0) {
    return items.map(() => 0);
  }

  const weights = items.map((item) => Math.max(0, getWeight(item)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const rawShares = totalWeight > 0
    ? weights.map((weight) => (weight / totalWeight) * target)
    : items.map(() => target / items.length);
  const baseShares = rawShares.map((share) => Math.floor(share));
  let remainder = target - baseShares.reduce((sum, share) => sum + share, 0);

  const rankedRemainders = rawShares
    .map((share, index) => ({ index, remainder: share - baseShares[index] }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < rankedRemainders.length && remainder > 0; i += 1) {
    baseShares[rankedRemainders[i].index] += 1;
    remainder -= 1;
  }

  return baseShares;
}

function complexityFromMinutes(minutes: number): 'starter' | 'growth' | 'enterprise' {
  if (minutes >= 60) return 'enterprise';
  if (minutes >= 30) return 'growth';
  return 'starter';
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getOccupation(slug: string) {
  const result = await pool.query(
    `SELECT id, title, slug, major_category, sub_category, employment, hourly_wage, annual_wage
     FROM occupations WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

async function getOpportunities(occupationId: number) {
  const result = await pool.query(
    `SELECT id, title, description, category, impact_level, effort_level, is_ai_generated, is_approved
     FROM ai_opportunities WHERE occupation_id = $1
     ORDER BY impact_level DESC, effort_level ASC`,
    [occupationId]
  );
  return result.rows;
}

async function getSkills(occupationId: number) {
  const result = await pool.query(
    `SELECT id, skill_name, skill_description, difficulty, learning_resources, priority
     FROM skill_recommendations WHERE occupation_id = $1 ORDER BY priority DESC`,
    [occupationId]
  );
  return result.rows;
}

async function getMicroTasks(occupationId: number) {
  const result = await pool.query(
    `SELECT id, task_name, task_description, frequency, ai_applicable, ai_how_it_helps,
            ai_impact_level, ai_effort_to_implement, ai_category, ai_tools
     FROM job_micro_tasks WHERE occupation_id = $1
     ORDER BY ai_impact_level DESC NULLS LAST, ai_effort_to_implement ASC NULLS LAST`,
    [occupationId]
  );
  return result.rows;
}

async function getGranularSkills(occupationId: number) {
  try {
    const result = await pool.query(
      `SELECT
         ms.id, ms.skill_code, ms.skill_name, ms.category, ms.difficulty_level,
         COUNT(tsm.id) as task_count, AVG(tsm.skill_proficiency_level) as avg_proficiency,
         BOOL_OR(tsm.is_core_skill) as has_core, BOOL_OR(tsm.is_differentiator_skill) as has_differentiator,
         AVG(tsm.ai_dependence_score) as avg_ai_dependence
       FROM task_skill_mapping tsm
       JOIN micro_skills ms ON tsm.micro_skill_id = ms.id
       JOIN onet_tasks ot ON tsm.onet_task_id = ot.id
       WHERE ot.occupation_id = $1
       GROUP BY ms.id, ms.skill_code, ms.skill_name, ms.category, ms.difficulty_level
       ORDER BY task_count DESC LIMIT 20`,
      [occupationId]
    );
    return result.rows;
  } catch { return []; }
}

async function getSkillProfile(occupationId: number) {
  try {
    const result = await pool.query(
      `SELECT * FROM occupation_skill_profile WHERE occupation_id = $1`,
      [occupationId]
    );
    return result.rows[0] || null;
  } catch { return null; }
}

async function getOnetTasks(occupationId: number) {
  const result = await pool.query(
    `SELECT id, task_title, task_description, gwa_title, task_type, ai_automatable, ai_automation_score, estimated_time_saved_percent
     FROM onet_tasks
     WHERE occupation_id = $1
     ORDER BY ai_automation_score DESC NULLS LAST, task_type ASC
     LIMIT 30`,
    [occupationId]
  );
  return result.rows;
}

async function getAutomationProfile(occupationId: number) {
  try {
    const result = await pool.query(
      `SELECT composite_score, ability_automation_potential, work_activity_automation_potential,
              keyword_score, knowledge_digital_readiness, task_frequency_weight,
              physical_ability_avg, cognitive_routine_avg, cognitive_creative_avg,
              top_automatable_activities, top_blocking_abilities,
              time_range_low, time_range_high, time_range_by_block
       FROM occupation_automation_profile WHERE occupation_id = $1`,
      [occupationId]
    );
    return result.rows[0] || null;
  } catch {
    // Fallback if time_range columns don't exist yet in production
    const result = await pool.query(
      `SELECT composite_score, ability_automation_potential, work_activity_automation_potential,
              keyword_score, knowledge_digital_readiness, task_frequency_weight,
              physical_ability_avg, cognitive_routine_avg, cognitive_creative_avg,
              top_automatable_activities, top_blocking_abilities
       FROM occupation_automation_profile WHERE occupation_id = $1`,
      [occupationId]
    );
    return result.rows[0] || null;
  }
}

async function getTopAbilities(occupationId: number) {
  try {
    const result = await pool.query(
      `SELECT element_name, importance, level
       FROM onet_abilities WHERE occupation_id = $1
       ORDER BY importance DESC NULLS LAST
       LIMIT 8`,
      [occupationId]
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getTopKnowledge(occupationId: number) {
  try {
    const result = await pool.query(
      `SELECT element_name, importance, level
       FROM onet_knowledge WHERE occupation_id = $1
       ORDER BY importance DESC NULLS LAST
       LIMIT 8`,
      [occupationId]
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getRelevantTools(occupationId: number) {
  try {
    const result = await pool.query(
      `WITH occ_categories AS (
         SELECT DISTINCT
           CASE
             WHEN element_id LIKE '4.A.1%' THEN 'information_input'
             WHEN element_id LIKE '4.A.2%' THEN 'mental_processes'
             WHEN element_id LIKE '4.A.3.b%' THEN 'technical_work'
             WHEN element_id LIKE '4.A.4.a%' THEN 'communication'
             WHEN element_id LIKE '4.A.4.b%' THEN 'management'
             WHEN element_id LIKE '4.A.4.c%' THEN 'administrative'
           END as gwa_category
         FROM onet_work_activities
         WHERE occupation_id = $1 AND importance > 3.5
       )
       SELECT DISTINCT t.tool_name, t.vendor, t.category, t.pricing_model,
              t.monthly_cost_low, t.monthly_cost_high, t.url, t.capabilities
       FROM ai_tools t, occ_categories oc
       WHERE t.dwa_categories::jsonb ? oc.gwa_category
       ORDER BY t.monthly_cost_low ASC NULLS FIRST
       LIMIT 6`,
      [occupationId]
    );
    return result.rows;
  } catch { return []; }
}

async function getRoleAlignedPackages(occupationTitle: string) {
  try {
    const result = await pool.query(
      `SELECT package_code, package_name, package_description, tier, base_price, monthly_price, includes_integrations, roi_multiplier
       FROM automation_packages
       WHERE $1 = ANY(target_occupations)
       ORDER BY CASE tier WHEN 'starter' THEN 1 WHEN 'growth' THEN 2 WHEN 'enterprise' THEN 3 ELSE 4 END, base_price ASC
       LIMIT 3`,
      [occupationTitle]
    );
    return result.rows;
  } catch { return []; }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const occupation = await getOccupation(slug);

  if (!occupation) {
    return { title: 'Occupation Not Found' };
  }

  return {
    title: `${occupation.title} - AI Opportunities | AI Jobs Map`,
    description: `See where ${occupation.title} can get meaningful time back, which routines are easiest to lighten, and which workflow support systems fit best.`,
  };
}

export default async function OccupationPage({ params }: PageProps) {
  const { slug } = await params;
  const occupation = await getOccupation(slug);

  if (!occupation) {
    notFound();
  }

  const [skills, microTasks, granularSkills, skillProfile, roleAlignedPackages, recommendationSnapshot, automationProfile, topAbilities, topKnowledge, onetTasks] = await Promise.all([
    getSkills(occupation.id),
    getMicroTasks(occupation.id),
    getGranularSkills(occupation.id),
    getSkillProfile(occupation.id),
    getRoleAlignedPackages(occupation.title),
    getOccupationRecommendationSnapshot(pool, occupation.id),
    getAutomationProfile(occupation.id),
    getTopAbilities(occupation.id),
    getTopKnowledge(occupation.id),
    getOnetTasks(occupation.id),
  ]);
  const taskEntries = microTasks.map((task: any) => ({
    ...task,
    lens: describeTaskLens(task),
    workBlock: inferWorkBlock(task),
  }));
  const aiApplicableTasks = taskEntries.filter((task: any) => task.ai_applicable);
  const topRecoverableTasks = [...aiApplicableTasks]
    .sort((a: any, b: any) => b.lens.modeledMinutesPerDay - a.lens.modeledMinutesPerDay)
    .slice(0, 10);
  const modeledMinutesRecoveredPerDay = topRecoverableTasks.reduce(
    (sum: number, task: any) => sum + task.lens.modeledMinutesPerDay,
    0
  );
  const snapshotMinutesRecoveredPerDay = Math.round(recommendationSnapshot.coverage.estimatedDailyHoursSaved * 60);

  // Archetype: classify occupation and modulate time-back claim by credibility
  const occupationArchetype = classifyOccupation(automationProfile);

  // Use O*NET-grounded time ranges when available, fall back to LLM-derived estimate
  const hasTimeRange = automationProfile?.time_range_low != null && automationProfile?.time_range_high != null;
  const fallbackMinutes = modulateTimeBack(modeledMinutesRecoveredPerDay, occupationArchetype);
  const initialTimeRangeLow = hasTimeRange ? automationProfile.time_range_low : fallbackMinutes;
  const initialTimeRangeHigh = hasTimeRange ? automationProfile.time_range_high : Math.max(fallbackMinutes + 10, fallbackMinutes);
  const timeRangeByBlock = hasTimeRange && automationProfile.time_range_by_block
    ? JSON.parse(automationProfile.time_range_by_block)
    : null;

  // AI Blueprint: generate dynamic agent architecture from task data + O*NET enrichment
  const blueprint = generateBlueprint(taskEntries, occupationArchetype, occupation.title, onetTasks, timeRangeByBlock);
  const blendedTimeBack = deriveBlendedTimeBack({
    onetLow: initialTimeRangeLow,
    onetHigh: initialTimeRangeHigh,
    workflowMinutes: snapshotMinutesRecoveredPerDay,
    microtaskMinutes: modeledMinutesRecoveredPerDay,
    blueprintMinutes: blueprint?.impact.totalMinutesSaved ?? null,
  });
  const displayedMinutesRecoveredPerDay = blendedTimeBack.displayMinutes;
  const timeRangeLow = blendedTimeBack.rangeLow;
  const timeRangeHigh = blendedTimeBack.rangeHigh;
  const taskContextByName = new Map(
    taskEntries.map((task: any) => [task.task_name, task])
  );
  const displayBlueprint = blueprint
    ? (() => {
        const rawAgents = blueprint.agents;
        const displayAllocations = allocateWeightedMinutes(
          rawAgents,
          displayedMinutesRecoveredPerDay,
          (agent) => agent.minutesSaved
        );
        const lowAllocations = allocateWeightedMinutes(
          rawAgents,
          timeRangeLow,
          (agent) => timeRangeByBlock?.[agent.blockKey]?.low ?? agent.minutesSaved
        );
        const highAllocations = allocateWeightedMinutes(
          rawAgents,
          timeRangeHigh,
          (agent) => timeRangeByBlock?.[agent.blockKey]?.high ?? timeRangeByBlock?.[agent.blockKey]?.low ?? agent.minutesSaved
        );
        const scaledAgents = rawAgents
          .map((agent, index) => ({
            ...agent,
            minutesSaved: displayAllocations[index] ?? agent.minutesSaved,
            rangeLow: lowAllocations[index] ?? agent.minutesSaved,
            rangeHigh: Math.max(highAllocations[index] ?? agent.minutesSaved, lowAllocations[index] ?? agent.minutesSaved),
          }))
          .sort((a, b) => b.minutesSaved - a.minutesSaved);

        return {
          ...blueprint,
          agents: scaledAgents,
          impact: {
            ...blueprint.impact,
            totalMinutesSaved: displayedMinutesRecoveredPerDay,
            highestImpactBlock: scaledAgents[0]?.blockLabel || blueprint.impact.highestImpactBlock,
            complexity: complexityFromMinutes(displayedMinutesRecoveredPerDay),
          },
        };
      })()
    : null;
  const blockAlignedTasks = displayBlueprint
    ? displayBlueprint.agents.flatMap((agent) => {
        const actionableTasks = [...agent.automatedTasks, ...agent.assistedTasks];
        const taskMinuteAllocations = allocateWeightedMinutes(
          actionableTasks,
          agent.minutesSaved,
          (task) => task.minutesPerDay
        );
        const taskLowAllocations = allocateWeightedMinutes(
          actionableTasks,
          agent.rangeLow ?? agent.minutesSaved,
          (task) => task.minutesPerDay
        );
        const taskHighAllocations = allocateWeightedMinutes(
          actionableTasks,
          agent.rangeHigh ?? agent.minutesSaved,
          (task) => task.minutesPerDay
        );

        return actionableTasks
          .map((task, index) => {
            const sourceTask = taskContextByName.get(task.taskName);

            return {
              id: `${agent.blockKey}-${task.taskName}`,
              task_name: task.taskName,
              task_description: sourceTask?.task_description || sourceTask?.ai_how_it_helps || task.automationApproach,
              ai_how_it_helps: sourceTask?.ai_how_it_helps || task.automationApproach,
              ai_category: sourceTask?.ai_category || null,
              frequency: task.frequency,
              lens: {
                ...sourceTask?.lens,
                label: frequencyMeta[task.frequency]?.label ?? task.frequency,
                tone: frequencyMeta[task.frequency]?.tone ?? frequencyMeta['as-needed'].tone,
              },
              workBlock: agent.blockKey,
              blockLabel: agent.blockLabel,
              scaledMinutes: taskMinuteAllocations[index] ?? 0,
              scaledRangeLow: taskLowAllocations[index] ?? 0,
              scaledRangeHigh: Math.max(taskHighAllocations[index] ?? 0, taskLowAllocations[index] ?? 0),
            };
          })
          .filter((task) => task.scaledMinutes > 0);
      })
    : topRecoverableTasks.map((task: any) => ({
        ...task,
        blockLabel: workBlockDefinitions[task.workBlock as keyof typeof workBlockDefinitions]?.label ?? 'Routine support',
        scaledMinutes: scaleTaskMinutes(
          task.lens.modeledMinutesPerDay,
          modeledMinutesRecoveredPerDay,
          displayedMinutesRecoveredPerDay
        ),
        scaledRangeLow: scaleTaskMinutes(
          task.lens.modeledMinutesPerDay,
          modeledMinutesRecoveredPerDay,
          timeRangeLow
        ),
        scaledRangeHigh: scaleTaskMinutes(
          task.lens.modeledMinutesPerDay,
          modeledMinutesRecoveredPerDay,
          timeRangeHigh
        ),
      }));
  const targetVisibleCoverage = Math.round(displayedMinutesRecoveredPerDay * 0.82);
  const allRoutineTasks = [...blockAlignedTasks]
    .sort((a: any, b: any) => b.scaledMinutes - a.scaledMinutes)
  const priorityTasks = allRoutineTasks
    .reduce((selected: any[], task: any) => {
    const currentTotal = selected.reduce((sum: number, item: any) => sum + item.scaledMinutes, 0);
    if (selected.length < 4 || (currentTotal < targetVisibleCoverage && selected.length < 6)) {
      selected.push(task);
    }
    return selected;
  }, []);
  const visibleTaskMinutes = priorityTasks.reduce((sum: number, task: any) => sum + task.scaledMinutes, 0);
  const remainingTaskCount = Math.max(0, allRoutineTasks.length - priorityTasks.length);
  const remainingTaskMinutes = Math.max(0, displayedMinutesRecoveredPerDay - visibleTaskMinutes);

  const oneHourTargetProgress = Math.min(100, Math.round((displayedMinutesRecoveredPerDay / 60) * 100));
  const oneHourNarrative =
    displayedMinutesRecoveredPerDay >= 60
      ? 'This role has strong time-back potential. The right support tools could realistically recover over an hour of routine work each day.'
      : occupationArchetype.archetype === 'physical'
        ? `We identified ${displayedMinutesRecoveredPerDay} minutes of administrative and coordination work that could be streamlined — freeing you to focus on the hands-on work itself.`
        : occupationArchetype.archetype === 'mixed'
          ? `We identified ${displayedMinutesRecoveredPerDay} minutes of admin and coordination overhead that could be lightened, so you spend more time on the work that matters.`
          : `We identified ${displayedMinutesRecoveredPerDay} minutes of routine work that could be lightened with the right support — and there may be more as we map additional tasks.`;
  const categoryMix = Object.entries(
    aiApplicableTasks.reduce((acc: Record<string, number>, task: any) => {
      const key = task.ai_category || 'task_automation';
      acc[key] = (acc[key] || 0) + task.lens.modeledMinutesPerDay;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const wheelTasks = topRecoverableTasks.slice(0, 8);
  const wheelSegments = wheelTasks.map((task: any, index: number) => {
    const startAngle = (index / wheelTasks.length) * 360;
    const endAngle = ((index + 1) / wheelTasks.length) * 360;
    const outerRadius = 118;
    const innerRadius = 60;
    const startOuter = polarToCartesian(140, 140, outerRadius, endAngle);
    const endOuter = polarToCartesian(140, 140, outerRadius, startAngle);
    const startInner = polarToCartesian(140, 140, innerRadius, endAngle);
    const endInner = polarToCartesian(140, 140, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    const path = [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
      'Z',
    ].join(' ');

    const palette = ['#34d399', '#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f59e0b', '#fb7185', '#14b8a6'];

    return {
      label: task.task_name,
      value: task.lens.modeledMinutesPerDay,
      path,
      color: palette[index % palette.length],
    };
  });

  const blockMap = taskEntries.reduce((acc: Record<string, any>, task: any) => {
    const key = task.workBlock;
    if (!acc[key]) {
      acc[key] = {
        key,
        ...workBlockDefinitions[key as keyof typeof workBlockDefinitions],
        tasks: [],
        minutes: 0,
        aiMinutes: 0,
      };
    }

    acc[key].tasks.push(task);
    acc[key].minutes += task.lens.modeledMinutesPerDay;
    if (task.ai_applicable) {
      acc[key].aiMinutes += task.lens.modeledMinutesPerDay;
    }
    return acc;
  }, {});
  const displayAgentMap = new Map(
    (displayBlueprint?.agents || []).map((agent) => [agent.blockKey, agent])
  );

  const workBlocks = Object.values(blockMap)
    .sort((a: any, b: any) => b.minutes - a.minutes)
    .slice(0, 5)
    .map((block: any) => {
      const displayAgent = displayAgentMap.get(block.key);
      const recoverableMinutes = displayAgent?.minutesSaved ?? block.aiMinutes;
      const recoverableLow = displayAgent?.rangeLow ?? block.aiMinutes;
      const recoverableHigh = displayAgent?.rangeHigh ?? block.aiMinutes;

      return {
        ...block,
        recoverableMinutes,
        recoverableLow,
        recoverableHigh,
        tasks: block.tasks.sort((a: any, b: any) => b.lens.modeledMinutesPerDay - a.lens.modeledMinutesPerDay),
        percentOfRecovery: displayedMinutesRecoveredPerDay > 0
          ? Math.round((recoverableMinutes / displayedMinutesRecoveredPerDay) * 100)
          : 0,
      };
    });

  // Build the "typical day" infographic data
  const totalMappedMinutes = workBlocks.reduce((sum: number, b: any) => sum + b.minutes, 0);
  const totalRecoverableMinutes = workBlocks.reduce((sum: number, b: any) => sum + b.aiMinutes, 0);
  const fullDayMinutes = 480; // 8-hour day
  const unmappedMinutes = Math.max(0, fullDayMinutes - totalMappedMinutes);
  const daySegments = [
    ...workBlocks.map((b: any) => ({
      label: b.label,
      minutes: b.minutes,
      recoverable: b.recoverableMinutes,
      posture: b.posture,
    })),
    ...(unmappedMinutes > 30 ? [{ label: 'Deep work & judgment calls', minutes: unmappedMinutes, recoverable: 0, posture: 'The work that requires your full attention — this stays yours.' }] : []),
  ].sort((a, b) => b.minutes - a.minutes);

  const dailyNarrative = workBlocks.length > 0
    ? `A typical ${occupation.title.toLowerCase()} day in this model revolves around ${toSentenceList(workBlocks.slice(0, 3).map((block: any) => block.label.toLowerCase()))}. The right product story is not replacement. It is reducing the repetitive setup around the work so the person can stay with judgment, exceptions, and final accountability.`
    : `This role still needs deeper day mapping, but the core product story should focus on reducing repetitive work in a way that clearly gives time back.`;

  const automationSolutions = automationSolutionDefinitions
    .map((product) => {
      const matchingBlockKeys = new Set(
        (displayBlueprint?.agents || [])
          .filter((agent) => {
            if (agent.blockKey === product.key) return true;
            if (product.key === 'analysis' && ['research', 'data_reporting'].includes(agent.blockKey)) return true;
            if (product.key === 'coordination' && ['communication'].includes(agent.blockKey)) return true;
            return false;
          })
          .map((agent) => agent.blockKey)
      );

      const matchingTasks = blockAlignedTasks.filter((task: any) => {
        if (matchingBlockKeys.has(task.workBlock)) return true;
        const content = `${task.task_name} ${task.task_description} ${task.ai_how_it_helps || ''}`.toLowerCase();
        return (
          (product.matchCategories as readonly string[]).includes(String(task.ai_category || '')) ||
          product.matchKeywords.some((keyword) => content.includes(keyword))
        );
      });

      const totalMinutes = matchingTasks.reduce((sum: number, task: any) => sum + task.scaledMinutes, 0);
      const matchedBlocks = [...new Set(matchingTasks.map((task: any) => task.blockLabel || workBlockDefinitions[task.workBlock as keyof typeof workBlockDefinitions]?.label))]
        .filter(Boolean);

      return {
        ...product,
        matchingTasks,
        totalMinutes,
        matchedBlocks,
      };
    })
    .filter((product) => product.matchingTasks.length > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 4);
  const summaryBlocks = workBlocks.slice(0, 3);
  const primarySolutions = automationSolutions.slice(0, 1);
  const skillSummary = skillProfile
    ? [
        { label: 'Core skills', value: skillProfile.core_skills_count || granularSkills.filter((s: any) => s.has_core).length },
        { label: 'Human differentiators', value: skillProfile.human_differentiator_skills_count || granularSkills.filter((s: any) => s.has_differentiator).length },
        { label: 'Automation-supporting skills', value: skillProfile.automatable_skills_count || granularSkills.filter((s: any) => parseFloat(s.avg_ai_dependence || 0) > 0.5).length },
      ]
    : [];
  const visibleSkillSummary = skillSummary.filter((item) => item.value > 0);
  const humanEdgeNotes = [...new Set(summaryBlocks.map((block: any) => block.humanEdge))].slice(0, 2);
  const estimateTrustPoints = [
    {
      title: 'Based on recurring task patterns',
      body: `This estimate is built from recurring routines in ${occupation.title.toLowerCase()} work, not from a generic industry average. The strongest routine clusters carry the most weight.`,
    },
    {
      title: 'Blended across multiple data layers',
      body: 'The headline is not just the conservative O*NET floor. It blends task-level modeling, workflow coverage, and the package architecture so the estimate reflects how the solution would actually be deployed.',
    },
    {
      title: 'Judgment-heavy work stays human',
      body: 'The model is intentionally conservative around exceptions, approvals, sensitive communication, and final accountability.',
    },
  ];
  const firstEngagementSteps = [
    {
      step: '01',
      title: 'Confirm the routine cluster',
      body: 'We narrow the first engagement to the routines most likely to produce visible time-back quickly.',
    },
    {
      step: '02',
      title: 'Map systems and review points',
      body: 'We identify the tools involved and where human review, approvals, or exception handling need to stay in place.',
    },
    {
      step: '03',
      title: 'Recommend the starting package',
      body: 'You get a practical package recommendation and handoff path rather than a request to configure the system yourself.',
    },
  ];

  // "What changes" — top 3 tasks with before/after framing
  const whatChangesTasks = priorityTasks.slice(0, 3).map((task: any) => {
    const currentMin = task.scaledMinutes;
    const reducedMin = Math.max(1, Math.round(currentMin * 0.35));
    return {
      name: task.task_name,
      category: task.ai_category,
      frequency: task.frequency,
      currentMinutes: currentMin,
      afterMinutes: reducedMin,
      savedMinutes: currentMin - reducedMin,
      howItHelps: task.ai_how_it_helps,
    };
  });

  // ROI calculation
  const annualWage = occupation.annual_wage ? Number(occupation.annual_wage) * 1000 : null;
  const hourlyRate = annualWage ? annualWage / 2080 : 75; // fallback $75/hr
  const dailyHoursSaved = displayedMinutesRecoveredPerDay / 60;
  const annualValueSaved = Math.round(dailyHoursSaved * 250 * hourlyRate);
  const weeklyHoursSaved = Math.round(dailyHoursSaved * 5 * 10) / 10;

  const exceedsTarget = displayedMinutesRecoveredPerDay > 60;
  const progressPercent = exceedsTarget ? 100 : oneHourTargetProgress;

  return (
    <div className="app-shell bg-surface text-ink">
      <TrackPageView eventName="occupation_viewed" properties={{ occupationSlug: occupation.slug, occupationTitle: occupation.title }} />
      <section className="relative overflow-hidden bg-panel">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[12%] top-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute right-[10%] top-20 h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl" />
        </div>
        <div className="page-container relative pb-14 pt-10 md:pb-16 md:pt-14">
          <Link
            href="/ai-jobs"
            className="inline-flex items-center gap-1.5 text-[0.82rem] text-[#c8bfb4] transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to search
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="eyebrow dark-panel-muted">{occupation.major_category}</p>
            <h1 className="mt-4 font-editorial text-[clamp(2.4rem,5.8vw,5rem)] font-normal leading-[0.95] tracking-[-0.055em] text-white">
              {occupation.title}
            </h1>
            {occupation.employment && (
              <p className="mt-4 text-[0.88rem] text-[#c8bfb4]">
                {Number(occupation.employment).toLocaleString()} people in this role across the U.S.
              </p>
            )}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div className="rounded-[2.2rem] border border-white/10 bg-white/6 p-8 shadow-2xl backdrop-blur-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#c8bfb4]">
              Recoverable time per day
            </p>
            <div className="mt-4 flex items-end gap-3">
              <CountUp
                value={displayedMinutesRecoveredPerDay}
                className="font-editorial text-[clamp(4.2rem,10vw,7rem)] leading-none tracking-[-0.08em] text-white"
              />
              <span className="pb-2 text-[1.25rem] font-medium text-[#d4cbc0]">min</span>
            </div>
            <p className="mt-4 max-w-2xl text-[0.96rem] leading-8 text-[#e7dfd5]">
              {oneHourNarrative}
            </p>
            <div className="mt-7 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.78rem] text-[#c8bfb4]">
              <span>{Math.min(displayedMinutesRecoveredPerDay, 60)} of 60 min/day target</span>
              <span>{weeklyHoursSaved}h/week potential</span>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-black/10 p-6 backdrop-blur-sm">
            <p className="eyebrow dark-panel-muted">Why this matters</p>
            <p className="mt-3 text-[0.92rem] leading-7 text-[#ddd5ca]">
              This is not a replacement story. It is a routine-load story: reduce the repetitive setup around the work so the human stays with judgment, exceptions, and final accountability.
            </p>
            <div className="mt-4 inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[0.75rem] font-medium text-white">
              {occupationArchetype.label}
            </div>
          </div>
        </div>
        </div>
      </section>

      <main className="page-container -mt-6 space-y-16 pb-20 md:-mt-8 md:space-y-20">
        {priorityTasks.length > 0 && (
          <section>
            <div className="max-w-2xl">
              <p className="eyebrow">Where your time goes</p>
              <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.4rem)] font-normal tracking-[-0.03em] text-ink">
                The routines with the clearest time-back potential.
              </h2>
              <p className="mt-3 text-[0.9rem] leading-7 text-ink-secondary">
                These are the leading routine clusters behind the headline estimate. Together, the visible routines account for about {visibleTaskMinutes} of the {displayedMinutesRecoveredPerDay} recoverable minutes shown above.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {priorityTasks.map((task: any) => (
                <div key={task.id} className="rounded-[1.6rem] border border-edge bg-surface-raised p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 pr-3">
                        <span className={`rounded-full border px-2.5 py-1 text-[0.66rem] font-medium ${task.lens.tone}`}>
                          {task.lens.label}
                        </span>
                        <span className="rounded-full border border-edge bg-surface px-2.5 py-1 text-[0.66rem] font-medium text-ink-tertiary">
                          {task.ai_category ? opportunityCategoryConfig[String(task.ai_category)]?.label ?? 'Routine support' : 'Routine support'}
                        </span>
                        <span className="rounded-full border border-edge bg-surface px-2.5 py-1 text-[0.66rem] font-medium text-ink-tertiary">
                          {task.blockLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 text-[0.96rem] font-semibold leading-7 text-ink">{task.task_name}</h3>
                      <p className="mt-2 text-[0.82rem] leading-6 text-ink-secondary">
                        {task.task_description || task.ai_how_it_helps || 'Recurring work pattern with strong time-back potential.'}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-[1.2rem] bg-surface-sunken px-4 py-3 text-right">
                      <div className="font-editorial text-[1.9rem] leading-none tracking-[-0.05em] text-ink">
                        {task.scaledMinutes}
                      </div>
                      <div className="mt-1 text-[0.66rem] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                        min/day
                      </div>
                      <div className="mt-2 text-[0.64rem] text-ink-tertiary">
                        Range: {task.scaledRangeLow}-{task.scaledRangeHigh} min/day
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max(12, Math.round((task.scaledMinutes / Math.max(priorityTasks[0]?.scaledMinutes || 1, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {remainingTaskCount > 0 ? (
              <details className="mt-5 rounded-[1.6rem] border border-edge bg-surface-raised p-5 shadow-sm">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[0.82rem] font-semibold text-ink">More routine coverage</p>
                      <p className="mt-1 text-[0.76rem] leading-6 text-ink-tertiary">
                        {remainingTaskCount} additional routines contribute about {remainingTaskMinutes} more min/day across the same model.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-edge bg-surface px-3 py-1.5 text-[0.72rem] font-medium text-ink-secondary">
                      Expand all routines
                    </span>
                  </div>
                </summary>
                <div className="mt-5 grid gap-3">
                  {allRoutineTasks.slice(priorityTasks.length).map((task: any) => (
                    <div key={task.id} className="rounded-2xl border border-edge bg-surface p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-medium ${task.lens.tone}`}>
                              {task.lens.label}
                            </span>
                            <span className="rounded-full border border-edge bg-surface-sunken px-2.5 py-1 text-[0.64rem] font-medium text-ink-tertiary">
                              {task.blockLabel}
                            </span>
                          </div>
                          <h3 className="mt-3 text-[0.88rem] font-medium text-ink">{task.task_name}</h3>
                          <p className="mt-1 text-[0.76rem] leading-6 text-ink-secondary">
                            {task.ai_how_it_helps || task.task_description || 'Recurring work pattern with measurable support potential.'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[0.84rem] font-semibold text-ink">{task.scaledMinutes}m/day</div>
                          <div className="mt-1 text-[0.66rem] text-ink-tertiary">
                            {task.scaledRangeLow}-{task.scaledRangeHigh}m/day
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        )}

        <section>
          <div className="max-w-2xl">
            <p className="eyebrow">The best place to start</p>
            <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.4rem)] font-normal tracking-[-0.03em] text-ink">
              Start with the package that matches the strongest routine cluster.
            </h2>
          </div>

          {primarySolutions.length > 0 ? (
            <div className="mt-8 rounded-[2rem] border border-edge-strong bg-surface-raised p-8 shadow-md">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex rounded-full border border-edge bg-surface px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
                    Recommended starting system
                  </div>
                  <h3 className="mt-4 font-editorial text-[2rem] font-normal tracking-[-0.04em] text-ink">
                    {primarySolutions[0].name}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-7 text-ink-secondary">
                    {primarySolutions[0].strapline}
                  </p>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-edge bg-surface p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Covers</p>
                      <p className="mt-2 text-[0.82rem] leading-6 text-ink-secondary">
                        ~{primarySolutions[0].totalMinutes} min/day of the strongest routine drag.
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-edge bg-surface p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Watches</p>
                      <p className="mt-2 text-[0.82rem] leading-6 text-ink-secondary">
                        {primarySolutions[0].watches}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-edge bg-surface p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Produces</p>
                      <p className="mt-2 text-[0.82rem] leading-6 text-ink-secondary">
                        {primarySolutions[0].produces}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 lg:w-64">
                  <TrackedLink
                    href={`/products?occupation=${occupation.slug}`}
                    eventName="occupation_products_clicked"
                    eventProps={{ occupationSlug: occupation.slug, occupationTitle: occupation.title }}
                    className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-5 py-3 text-[0.86rem] font-medium transition-all hover:bg-transparent hover:text-ink"
                  >
                    See the best package
                    <ArrowRight className="h-4 w-4" />
                  </TrackedLink>
                  <TrackedLink
                    href={`/factory?occupation=${occupation.slug}`}
                    eventName="occupation_factory_clicked"
                    eventProps={{ occupationSlug: occupation.slug, occupationTitle: occupation.title, cta: 'primary' }}
                    className="inline-flex items-center justify-center rounded-xl border border-edge-strong bg-surface px-5 py-3 text-[0.86rem] font-medium text-ink-secondary transition-colors hover:text-ink"
                  >
                    Get your plan
                  </TrackedLink>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.6rem] border border-edge bg-surface-raised p-6 shadow-sm">
              <p className="text-[0.9rem] leading-7 text-ink-secondary">
                We are still mapping the best starting package for this role, but the next step is the same: confirm the routines, the systems involved, and the level of operating support you need.
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="eyebrow">Why trust this number</p>
            <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.4rem)] font-normal tracking-[-0.03em] text-ink">
              The estimate is directional, but it is grounded in the work.
            </h2>
            <p className="mt-3 text-[0.9rem] leading-7 text-ink-secondary">
              The goal is not false precision. The goal is a credible view of where routine drag lives in this role and what kind of support could realistically give time back.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {estimateTrustPoints.map((point, index) => (
              <FadeIn key={point.title} delay={index * 0.06}>
                <div className="rounded-[1.6rem] border border-edge bg-surface-raised p-6 shadow-sm">
                  <p className="text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">{point.title}</p>
                  <p className="mt-3 text-[0.84rem] leading-6 text-ink-secondary">{point.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="eyebrow">What happens next</p>
            <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.4rem)] font-normal tracking-[-0.03em] text-ink">
              A first engagement should feel scoped, not overwhelming.
            </h2>
            <p className="mt-3 text-[0.9rem] leading-7 text-ink-secondary">
              If this role looks relevant, the next step is a short qualification flow. We use it to turn the role insight into a practical starting plan.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {firstEngagementSteps.map((step, index) => (
              <FadeIn key={step.step} delay={index * 0.06}>
                <div className="rounded-[1.6rem] border border-edge bg-surface-raised p-6 shadow-sm">
                  <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">{step.step}</p>
                  <h3 className="mt-3 text-[0.98rem] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-3 text-[0.84rem] leading-6 text-ink-secondary">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <details className="group rounded-[1.6rem] border border-edge bg-surface-raised p-5 shadow-sm">
            <summary className="cursor-pointer list-none text-[0.88rem] font-medium text-ink">
              Day architecture
            </summary>
            <div className="mt-5">
              <p className="max-w-3xl text-[0.88rem] leading-7 text-ink-secondary">
                {dailyNarrative}
              </p>
              {workBlocks.length > 0 ? (
                <div className="mt-6">
                  <DayValueMap
                    blocks={workBlocks.map((b: any) => {
                      const blockKey = b.key as string;
                      return {
                        key: b.key,
                        label: b.label,
                        minutes: b.minutes,
                        recoverable: b.recoverableLow,
                        recoverableHigh: b.recoverableHigh,
                        posture: b.posture,
                        color: workBlockColors[blockKey as keyof typeof workBlockColors] || '#94a3b8',
                      };
                    })}
                    totalRecoverable={timeRangeLow}
                    totalRecoverableHigh={timeRangeHigh}
                    fullDayMinutes={fullDayMinutes}
                    defaultHourlyRate={Math.round(hourlyRate)}
                    salaryLabel={annualWage ? `$${(annualWage / 1000).toFixed(0)}K median salary` : null}
                    occupationTitle={occupation.title}
                  />
                </div>
              ) : null}
            </div>
          </details>

          <details className="group rounded-[1.6rem] border border-edge bg-surface-raised p-5 shadow-sm">
            <summary className="cursor-pointer list-none text-[0.88rem] font-medium text-ink">
              Evidence layer
            </summary>
            <div className="mt-5 space-y-5">
              {automationProfile ? (
                <div className="rounded-2xl border border-edge bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[0.84rem] font-medium text-ink">
                      Composite score: {Math.round(automationProfile.composite_score)}/100
                    </p>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-medium ${occupationArchetype.badgeTone}`}>
                      {occupationArchetype.label}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.8rem] leading-6 text-ink-secondary">
                    {occupationArchetype.rationale}
                  </p>
                </div>
              ) : null}

              {categoryMix.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {categoryMix.map(([category, minutes]) => (
                    <div key={category} className="rounded-2xl border border-edge bg-surface p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
                        {opportunityCategoryConfig[category]?.label ?? category}
                      </p>
                      <p className="mt-2 text-[1.2rem] font-semibold text-ink">{minutes}m/day</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <p className="text-[0.72rem] text-ink-tertiary">
                Data: O*NET 30.x, BLS employment statistics, and task analysis across 15,000+ government task statements.
              </p>
            </div>
          </details>

          <details className="group rounded-[1.6rem] border border-edge bg-surface-raised p-5 shadow-sm">
            <summary className="cursor-pointer list-none text-[0.88rem] font-medium text-ink">
              Human edge and upskilling
            </summary>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-edge bg-surface p-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">What stays human</p>
                <div className="mt-3 space-y-2">
                  {(humanEdgeNotes.length > 0 ? humanEdgeNotes : ['Judgment, exceptions, and final accountability remain human-led.']).map((note) => (
                    <p key={note} className="text-[0.8rem] leading-6 text-ink-secondary">{note}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-edge bg-surface p-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Skill profile</p>
                <div className="mt-3 space-y-2">
                  {visibleSkillSummary.length > 0 ? visibleSkillSummary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-[0.8rem] text-ink-secondary">
                      <span>{item.label}</span>
                      <span className="font-medium text-ink">{item.value}</span>
                    </div>
                  )) : (
                    <p className="text-[0.8rem] leading-6 text-ink-secondary">
                      This role still needs deeper skill-layer mapping, but the strongest human edge remains in judgment, context, and final review.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </details>

          {displayBlueprint ? (
            <details className="group rounded-[1.4rem] border border-edge bg-surface-raised p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-[0.88rem] font-medium text-ink">
                Product architecture preview
              </summary>
              <div className="mt-6">
                <BlueprintSection
                  blueprint={displayBlueprint}
                  occupationSlug={occupation.slug}
                  occupationTitle={occupation.title}
                  totalDayMinutes={displayedMinutesRecoveredPerDay}
                />
              </div>
            </details>
          ) : null}
        </section>

        <section>
          <FadeIn>
            <div className="rounded-[2rem] border border-edge-strong bg-surface-raised p-8 shadow-md">
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="eyebrow">Next step</p>
                  <h2 className="mt-3 font-editorial text-[clamp(1.6rem,3vw,2.4rem)] font-normal tracking-[-0.03em] text-ink">
                    Move from role insight into the right package.
                  </h2>
                  <p className="mt-3 text-[0.9rem] leading-7 text-ink-secondary">
                    The best next step is not designing the system yourself. It is confirming the role, the routines, the systems involved, and the level of support you need.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/products?occupation=${occupation.slug}`}
                    className="btn-primary group inline-flex shrink-0 items-center gap-3 rounded-xl border border-primary bg-primary px-8 py-4 text-[0.95rem] font-medium transition-all hover:bg-transparent hover:text-ink"
                  >
                    See the best package
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href={`/factory?occupation=${occupation.slug}`}
                    className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-edge-strong bg-surface px-8 py-4 text-[0.95rem] font-medium text-ink-secondary transition-colors hover:text-ink"
                  >
                    Get your plan
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
