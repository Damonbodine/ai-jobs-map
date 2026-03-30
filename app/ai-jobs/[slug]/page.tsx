import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Pool } from 'pg';
import { getOccupationRecommendationSnapshot } from '@/lib/ai-jobs/recommendations';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
} as const;

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

  if (
    category === 'communication' ||
    /(schedule|follow[- ]?up|coordinate|communicat|notify|respond|meeting|handoff|route)/.test(content)
  ) {
    return 'coordination';
  }

  if (
    category === 'research_discovery' ||
    category === 'data_analysis' ||
    category === 'decision_support' ||
    /(analy|evaluat|compare|research|assess|forecast|estimate|study|review options)/.test(content)
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
    /(inspect|validate|verify|check|monitor|audit|compliance|quality|exception)/.test(content)
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
  // Get skill breakdown from task_skill_mapping
  const result = await pool.query(
    `SELECT 
       ms.id,
       ms.skill_code,
       ms.skill_name,
       ms.category,
       ms.difficulty_level,
       COUNT(tsm.id) as task_count,
       AVG(tsm.skill_proficiency_level) as avg_proficiency,
       BOOL_OR(tsm.is_core_skill) as has_core,
       BOOL_OR(tsm.is_differentiator_skill) as has_differentiator,
       AVG(tsm.ai_dependence_score) as avg_ai_dependence
     FROM task_skill_mapping tsm
     JOIN micro_skills ms ON tsm.micro_skill_id = ms.id
     JOIN onet_tasks ot ON tsm.onet_task_id = ot.id
     WHERE ot.occupation_id = $1
     GROUP BY ms.id, ms.skill_code, ms.skill_name, ms.category, ms.difficulty_level
     ORDER BY task_count DESC
     LIMIT 20`,
    [occupationId]
  );
  return result.rows;
}

async function getSkillProfile(occupationId: number) {
  const result = await pool.query(
    `SELECT * FROM occupation_skill_profile WHERE occupation_id = $1`,
    [occupationId]
  );
  return result.rows[0] || null;
}

async function getOnetTasks(occupationId: number) {
  const result = await pool.query(
    `SELECT id, task_title, task_description, gwa_title, task_type, ai_automatable, ai_automation_score, estimated_time_saved_percent
     FROM onet_tasks
     WHERE occupation_id = $1
     ORDER BY ai_automation_score DESC NULLS LAST, task_type ASC
     LIMIT 18`,
    [occupationId]
  );
  return result.rows;
}

async function getRoleAlignedPackages(occupationTitle: string) {
  const result = await pool.query(
    `SELECT package_code, package_name, package_description, tier, base_price, monthly_price, includes_integrations, roi_multiplier
     FROM automation_packages
     WHERE $1 = ANY(target_occupations)
     ORDER BY
       CASE tier
         WHEN 'starter' THEN 1
         WHEN 'growth' THEN 2
         WHEN 'enterprise' THEN 3
         ELSE 4
       END,
       base_price ASC
     LIMIT 3`,
    [occupationTitle]
  );
  return result.rows;
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

  const skills = await getSkills(occupation.id);
  const microTasks = await getMicroTasks(occupation.id);
  const granularSkills = await getGranularSkills(occupation.id);
  const skillProfile = await getSkillProfile(occupation.id);
  const roleAlignedPackages = await getRoleAlignedPackages(occupation.title);
  const recommendationSnapshot = await getOccupationRecommendationSnapshot(pool, occupation.id);
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
  const displayedMinutesRecoveredPerDay = snapshotMinutesRecoveredPerDay > 0
    ? snapshotMinutesRecoveredPerDay
    : modeledMinutesRecoveredPerDay;
  const oneHourTargetProgress = Math.min(100, Math.round((displayedMinutesRecoveredPerDay / 60) * 100));
  const oneHourNarrative =
    displayedMinutesRecoveredPerDay >= 60
      ? 'This role has a credible path to giving people back at least one hour per day by reducing repeat work and coordination drag.'
      : 'This role already shows meaningful time-back potential, but the strongest gains will come from bundling several support moves together.';
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

  const workBlocks = Object.values(blockMap)
    .sort((a: any, b: any) => b.minutes - a.minutes)
    .slice(0, 5)
    .map((block: any) => ({
      ...block,
      tasks: block.tasks.sort((a: any, b: any) => b.lens.modeledMinutesPerDay - a.lens.modeledMinutesPerDay),
      percentOfRecovery: displayedMinutesRecoveredPerDay > 0
        ? Math.round((block.aiMinutes / displayedMinutesRecoveredPerDay) * 100)
        : 0,
    }));

  const dailyNarrative = workBlocks.length > 0
    ? `A typical ${occupation.title.toLowerCase()} day in this model revolves around ${toSentenceList(workBlocks.slice(0, 3).map((block: any) => block.label.toLowerCase()))}. The right product story is not replacement. It is reducing the repetitive setup around the work so the person can stay with judgment, exceptions, and final accountability.`
    : `This role still needs deeper day mapping, but the core product story should focus on reducing repetitive work in a way that clearly gives time back.`;

  const automationSolutions = automationSolutionDefinitions
    .map((product) => {
      const matchingTasks = taskEntries.filter((task: any) => {
        const content = `${task.task_name} ${task.task_description} ${task.ai_how_it_helps || ''}`.toLowerCase();
        return (
          (product.matchCategories as readonly string[]).includes(String(task.ai_category || '')) ||
          product.matchKeywords.some((keyword) => content.includes(keyword))
        );
      });

      const totalMinutes = matchingTasks.reduce((sum: number, task: any) => sum + task.lens.modeledMinutesPerDay, 0);
      const matchedBlocks = [...new Set(matchingTasks.map((task: any) => task.workBlock))]
        .map((blockKey) => workBlockDefinitions[blockKey as keyof typeof workBlockDefinitions].label);

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
  const priorityTasks = topRecoverableTasks.slice(0, 3);
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

  return (
    <div className="app-shell text-slate-50">
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDuration: '9s' }} />

      <section className="page-container relative z-10 py-12 md:py-16">
        <Link 
          href="/ai-jobs"
          className="mb-8 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="panel rounded-[2rem] p-7 md:p-8">
            <div className="eyebrow mb-5">{occupation.major_category}</div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              {occupation.title}
            </h1>
            {occupation.employment && (
              <div className="mt-4 text-slate-400">
                {Number(occupation.employment).toLocaleString()} workers in the US
              </div>
            )}
            <p className="mt-5 max-w-3xl text-slate-400 leading-8">
              Explore the day-to-day tasks, task clusters, and support systems most likely to give this role meaningful time back.
            </p>
          </div>

          <div className="panel rounded-[2rem] p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Daily time-back model</div>
            <div className="mt-3 text-6xl font-black text-emerald-400">{displayedMinutesRecoveredPerDay}</div>
            <div className="mt-2 text-slate-300">Minutes of repeat work we can realistically lighten</div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
                style={{ width: `${oneHourTargetProgress}%` }}
              />
            </div>
            <div className="mt-3 text-sm text-slate-500">
              {Math.min(displayedMinutesRecoveredPerDay, 60)} of 60 minutes/day target
            </div>
          </div>
        </div>
      </section>

      <main className="page-container relative z-10 space-y-10 pb-16">
        <section className="panel rounded-[2rem] p-7 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-center">
            <div className="mx-auto flex w-full max-w-[320px] items-center justify-center">
              <svg viewBox="0 0 280 280" className="w-full">
                <circle cx="140" cy="140" r="122" fill="rgba(15,23,42,0.55)" stroke="rgba(148,163,184,0.12)" />
                {wheelSegments.map((segment) => (
                  <path
                    key={segment.label}
                    d={segment.path}
                    fill={segment.color}
                    fillOpacity="0.88"
                    stroke="rgba(2,6,23,0.7)"
                    strokeWidth="2"
                  />
                ))}
                <circle cx="140" cy="140" r="58" fill="rgba(2,6,23,0.92)" stroke="rgba(148,163,184,0.1)" />
                <text x="140" y="126" textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  Daily Recovery
                </text>
                <text x="140" y="155" textAnchor="middle" className="fill-white text-[34px] font-black">
                  {displayedMinutesRecoveredPerDay}m
                </text>
                <text x="140" y="176" textAnchor="middle" className="fill-emerald-300 text-[12px] font-semibold">
                  Aiming for one hour back
                </text>
              </svg>
            </div>

            <div className="space-y-6">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">One-hour-back snapshot</div>
                <h2 className="mt-2 text-3xl font-black text-white">Where the day goes and where to start</h2>
                <p className="mt-3 text-base leading-8 text-slate-300">{oneHourNarrative}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{dailyNarrative}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
                <div className="rounded-[1.4rem] border border-slate-800/75 bg-slate-950/35 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Best places to start</div>
                  <div className="mt-4 space-y-3">
                    {categoryMix.map(([category, minutes]) => {
                      const config = opportunityCategoryConfig[category] || { label: 'Automation', color: 'bg-slate-500', icon: '✨' };
                      return (
                        <div key={category} className="flex items-center justify-between gap-4 rounded-[1rem] border border-slate-800/70 bg-slate-950/45 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${config.color}`}>
                              {config.icon}
                            </span>
                            <div>
                              <div className="font-semibold text-white">{config.label}</div>
                              <div className="text-xs text-slate-500">Early time-back theme</div>
                            </div>
                          </div>
                          <div className="text-xl font-black text-emerald-300">{minutes}m</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-slate-800/75 bg-slate-950/35 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top routines</div>
                  <div className="mt-4 grid gap-2">
                    {priorityTasks.map((task: any, index: number) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-800/70 bg-slate-950/45 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white">{index + 1}. {task.task_name}</div>
                          <div className="text-xs text-slate-500">{task.lens.label}</div>
                        </div>
                        <div className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 text-sm font-bold text-cyan-300">
                          {task.lens.modeledMinutesPerDay}m
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <details className="panel group rounded-[2rem] p-7 md:p-8">
            <summary className="flex cursor-pointer list-none flex-col gap-3 marker:content-none md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Day architecture</div>
                <h2 className="mt-2 text-3xl font-black text-white">The routines that shape the day</h2>
                <p className="mt-3 text-slate-400 leading-8">
                  Open this if you want the fuller shape of the role. It is helpful context, but most people can start with the priority routines below.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span>View supporting context</span>
                <span className="rounded-full border border-slate-700/70 bg-slate-950/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-transform duration-200 group-open:rotate-180">
                  ↓
                </span>
              </div>
            </summary>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {summaryBlocks.map((block: any) => (
                <div
                  key={block.key}
                  className={`rounded-[1.35rem] border bg-gradient-to-br ${block.tone} ${block.border} p-5`}
                >
                  <div className={`text-sm font-semibold uppercase tracking-[0.16em] ${block.accent}`}>
                    {block.label}
                  </div>
                  <div className="mt-3 text-3xl font-black text-white">{formatMinutes(block.aiMinutes)}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{block.posture}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {block.tasks.slice(0, 2).map((task: any) => (
                      <span key={task.id} className="rounded-full border border-slate-700/80 bg-slate-950/45 px-3 py-1 text-xs text-slate-300">
                        {task.task_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details open className="group space-y-4">
            <summary className="flex cursor-pointer list-none flex-col gap-2 marker:content-none md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Priority routines</div>
                <h2 className="mt-2 text-3xl font-black text-white">The first tasks worth redesigning</h2>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span>Showing the top {priorityTasks.length} routines with the clearest time-back potential</span>
                <span className="rounded-full border border-slate-700/70 bg-slate-950/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-transform duration-200 group-open:rotate-180">
                  ↓
                </span>
              </div>
            </summary>

            {priorityTasks.length > 0 ? (
              <div className="grid gap-3">
                {priorityTasks.map((task: any) => {
                  const config = opportunityCategoryConfig[task.ai_category || 'task_automation'] || {
                    label: 'Task Automation',
                    color: 'bg-slate-500',
                    icon: '✨'
                  };

                  return (
                    <div
                      key={task.id}
                      className={`rounded-[1.35rem] border p-4 transition-all ${
                        task.ai_applicable
                          ? 'border-slate-800/75 bg-slate-900/58'
                          : 'border-slate-800/60 bg-slate-900/40 opacity-80'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                        <div className="max-w-3xl">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{task.task_name}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${task.lens.tone}`}>
                              {task.lens.label}
                            </span>
                          </div>
                          <p className="text-slate-400 leading-7">{task.task_description}</p>

                          {task.ai_applicable && task.ai_how_it_helps ? (
                            <div className="mt-4 rounded-[1rem] border border-slate-800/75 bg-slate-950/40 p-3.5">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="text-lg">{config.icon}</span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-sm leading-7 text-emerald-200/90">{task.ai_how_it_helps}</p>
                            </div>
                          ) : (
                            <div className="mt-4 text-sm italic text-slate-500">
                              This task is less likely to be an early time-back candidate.
                            </div>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                          <div className="rounded-[1rem] border border-slate-800/75 bg-slate-950/45 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time-back potential</div>
                            <div className="mt-2 text-3xl font-black text-cyan-300">{task.lens.modeledMinutesPerDay}m</div>
                            <div className="mt-1 text-sm text-slate-500">per day</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="panel rounded-[2rem] p-12 text-center">
                <div className="mb-4 text-4xl">🤖</div>
                <h3 className="mb-2 text-xl font-semibold text-white">Task analysis coming soon</h3>
                <p className="mx-auto max-w-md text-slate-400">
                  We&apos;re still mapping the day-to-day work for this occupation before we can estimate recoverable time.
                </p>
              </div>
            )}
          </details>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended solutions</div>
              <h2 className="mt-2 text-3xl font-black text-white">The best-fit solution path</h2>
            </div>
              <div className="text-sm text-slate-400">One support path tied directly to the strongest routine cluster.</div>
          </div>

          <div className="grid gap-4">
            {primarySolutions.map((product) => (
              <div key={product.name} className="panel rounded-[1.6rem] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Recommended support system</div>
                    <h3 className="mt-2 text-2xl font-black text-white">{product.name}</h3>
                    <p className="mt-3 text-slate-300 leading-7">{product.strapline}</p>
                  </div>
                  <div className="rounded-[1rem] border border-emerald-500/15 bg-emerald-500/6 px-4 py-3 text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">Modeled time back</div>
                    <div className="mt-1 text-3xl font-black text-white">
                      {recommendationSnapshot.coverage.estimatedDailyHoursSaved > 0
                        ? formatHours(recommendationSnapshot.coverage.estimatedDailyHoursSaved)
                        : `${product.totalMinutes}m`}
                    </div>
                    <div className="text-xs text-slate-500">from mapped routines and workflow coverage</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.1rem] border border-slate-800/75 bg-slate-950/45 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Watches</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{product.watches}</p>
                  </div>
                  <div className="rounded-[1.1rem] border border-slate-800/75 bg-slate-950/45 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Produces</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{product.produces}</p>
                  </div>
                  <div className="rounded-[1.1rem] border border-slate-800/75 bg-slate-950/45 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Human checkpoint</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{product.review}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {product.matchedBlocks.map((blockLabel) => (
                    <span key={blockLabel} className="rounded-full border border-slate-700/80 bg-slate-900/50 px-3 py-1 text-xs text-slate-300">
                      {blockLabel}
                    </span>
                  ))}
                  {recommendationSnapshot.coverage.percent > 0 && (
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                      {Math.round(recommendationSnapshot.coverage.percent)}% workflow coverage
                    </span>
                  )}
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  Best matched routines: {product.matchingTasks.slice(0, 3).map((task: any) => task.task_name).join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {recommendationSnapshot.topActions.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence layer</div>
                <h2 className="mt-2 text-3xl font-black text-white">How this role maps into reusable systems</h2>
              </div>
              <div className="text-sm text-slate-400">This is the bridge from occupation research to a product recommendation.</div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="panel rounded-[1.5rem] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Common action patterns</div>
                <div className="mt-4 grid gap-3">
                  {recommendationSnapshot.topActions.slice(0, 5).map((action) => (
                    <div key={action.code} className="rounded-[1rem] border border-slate-800/75 bg-slate-950/45 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{action.name}</div>
                          <div className="text-xs text-slate-500">{action.taskCount} mapped tasks • {Math.round(action.confidence * 100)}% confidence</div>
                        </div>
                        <div className="text-xs uppercase tracking-[0.14em] text-emerald-300">{action.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel rounded-[1.5rem] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Package fit</div>
                <div className="mt-4 grid gap-3">
                  {recommendationSnapshot.recommendedPackages.slice(0, 3).map((pkg) => (
                    <div key={pkg.id} className="rounded-[1rem] border border-slate-800/75 bg-slate-950/45 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{pkg.name}</div>
                          <div className="mt-1 text-sm leading-6 text-slate-400">{pkg.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-300">${pkg.basePrice.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">{pkg.tier}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {visibleSkillSummary.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Human edge</div>
                <h2 className="mt-2 text-3xl font-black text-white">What still belongs to the person</h2>
              </div>
              <div className="text-sm text-slate-400">A compact view of what should stay human-led.</div>
            </div>

            <div className="panel rounded-[1.4rem] p-6">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
                <div>
                  <p className="text-slate-300 leading-7">
                    The goal here is not to automate away judgment. It is to remove the repetitive setup around the work so the person can stay with context, edge cases, trust, and final decisions.
                  </p>
                  {humanEdgeNotes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {humanEdgeNotes.map((note) => (
                        <span key={note} className="rounded-full border border-slate-700/80 bg-slate-950/45 px-3 py-2 text-xs text-slate-300">
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                  {visibleSkillSummary.map((item) => (
                    <div key={item.label} className="rounded-[1rem] border border-slate-800/75 bg-slate-950/45 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                      <div className="mt-2 text-2xl font-bold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {skills.length > 0 && (
        <section className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Upskilling</div>
            <h2 className="mt-2 text-3xl font-black text-white">AI skills to learn next</h2>
          </div>
          
            <div className="grid gap-4 md:grid-cols-2">
              {skills.slice(0, 4).map((skill: any) => {
                const diff = difficultyConfig[skill.difficulty] || {
                  label: skill.difficulty,
                  color: 'text-slate-400 bg-slate-400/20'
                };
                return (
                  <div 
                    key={skill.id}
                    className="panel rounded-[1.5rem] p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white">{skill.skill_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${diff.color}`}>
                        {diff.label}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">{skill.skill_description}</p>
                    {skill.learning_resources && (
                      <a
                        href={skill.learning_resources}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Learning Resources
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
        </section>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>Designed around giving people time back with workflow support systems.</p>
          <p className="mt-2 text-sm">Data sourced from U.S. Bureau of Labor Statistics</p>
        </div>
      </footer>
    </div>
  );
}
