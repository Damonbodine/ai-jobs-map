import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Pool } from 'pg';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { DayChart } from '@/components/occupation/day-chart';
import { TimeBackChart } from '@/components/occupation/time-back-chart';
import { CountUp } from '@/components/ui/count-up';
import { FadeIn } from '@/components/ui/fade-in';
import { getOccupationRecommendationSnapshot } from '@/lib/ai-jobs/recommendations';
import { Footer } from '@/components/ui/footer';

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
  // Always use the bottom-up sum so the hero number matches the breakdown
  // (the snapshot estimate can diverge wildly from task-level data)
  const displayedMinutesRecoveredPerDay = modeledMinutesRecoveredPerDay;
  const oneHourTargetProgress = Math.min(100, Math.round((displayedMinutesRecoveredPerDay / 60) * 100));
  const oneHourNarrative =
    displayedMinutesRecoveredPerDay >= 60
      ? 'This role has strong time-back potential. The right support tools could realistically recover over an hour of routine work each day.'
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

  // Build the "typical day" infographic data
  const totalMappedMinutes = workBlocks.reduce((sum: number, b: any) => sum + b.minutes, 0);
  const totalRecoverableMinutes = workBlocks.reduce((sum: number, b: any) => sum + b.aiMinutes, 0);
  const fullDayMinutes = 480; // 8-hour day
  const unmappedMinutes = Math.max(0, fullDayMinutes - totalMappedMinutes);
  const daySegments = [
    ...workBlocks.map((b: any) => ({
      label: b.label,
      minutes: b.minutes,
      recoverable: b.aiMinutes,
      posture: b.posture,
    })),
    ...(unmappedMinutes > 30 ? [{ label: 'Deep work & judgment calls', minutes: unmappedMinutes, recoverable: 0, posture: 'The work that requires your full attention — this stays yours.' }] : []),
  ].sort((a, b) => b.minutes - a.minutes);

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

  const exceedsTarget = displayedMinutesRecoveredPerDay > 60;
  const progressPercent = exceedsTarget ? 100 : oneHourTargetProgress;

  return (
    <div className="bg-surface text-ink">

      {/* ------------------------------------------------------------------ */}
      {/* BEAT 1 — Dark hero panel                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-panel">
        <div className="page-container pt-8 pb-14 md:pt-10 md:pb-16">
          <div className="mb-10">
            <Link
              href="/ai-jobs"
              className="dark-panel-muted inline-flex items-center gap-1 text-[0.78rem] transition-opacity hover:opacity-70"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>

          <p className="dark-panel-muted text-[0.6875rem] font-semibold uppercase tracking-[0.1em]">
            {occupation.major_category}
          </p>

          {/* Job title — THE hero of the page */}
          <h1
            className="dark-panel-text mt-6 font-editorial font-normal"
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: 1, letterSpacing: '-0.035em' }}
          >
            {occupation.title}
          </h1>

          {occupation.employment && (
            <p className="dark-panel-muted mt-4 text-[0.8rem]">
              {Number(occupation.employment).toLocaleString()} people in this role across the U.S.
            </p>
          )}

          {/* Number — right corner, text stacked above it */}
          <div className="mt-10 flex justify-end">
            <div className="text-right">
              <p className="dark-panel-muted text-[0.85rem]">We believe you can save</p>
              <div className="mt-1 flex items-baseline gap-2 justify-end">
                <CountUp
                  value={displayedMinutesRecoveredPerDay}
                  duration={1.5}
                  delay={0.3}
                  className="dark-panel-text font-editorial font-normal"
                  style={{ fontSize: 'clamp(3rem, 7vw, 4.5rem)', lineHeight: 0.85 }}
                />
                <span className="dark-panel-muted font-editorial text-base italic">min/day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BEAT 2 — A typical day (interactive charts)                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="page-container py-16 md:py-20">
        <FadeIn>
          <h2 className="font-editorial font-normal text-ink" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
            A typical day
          </h2>
          <p className="mt-2 max-w-xl text-[0.85rem] leading-[1.6] text-ink-secondary">
            Hover over the chart to explore how your 8-hour day breaks down — and where support tools could make a difference.
          </p>
        </FadeIn>

        {daySegments.length > 0 ? (
          <div className="mt-10">
            <DayChart
              segments={daySegments.map(s => ({ label: s.label, minutes: s.minutes, recoverable: s.recoverable, posture: s.posture }))}
              totalMinutes={displayedMinutesRecoveredPerDay}
              fullDayMinutes={fullDayMinutes}
            />

            {/* Time back breakdown */}
            <div className="mt-12">
              <TimeBackChart
                items={daySegments.filter(s => s.recoverable > 0).map(seg => {
                  const matchingSolution = automationSolutions.find(sol =>
                    sol.matchedBlocks.some(b => b.toLowerCase().includes(seg.label.split(' ')[0].toLowerCase()))
                  );
                  return {
                    label: seg.label,
                    recoverable: seg.recoverable,
                    posture: seg.posture,
                    solution: matchingSolution?.name,
                  };
                })}
                total={displayedMinutesRecoveredPerDay}
              />
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-edge bg-surface-raised px-6 py-12 text-center">
            <p className="text-ink-secondary">
              We&apos;re still mapping the day-to-day work for this occupation.
            </p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA — Go build your solution                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="page-container"><div className="border-t border-edge" /></div>

      <section className="page-container py-16 md:py-20">
        <FadeIn>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-editorial font-normal text-ink" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
                Ready to get that time back?
              </h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-secondary">
                Tell us about your day. We&apos;ll build a custom recommendation.
              </p>
            </div>
            <Link
              href={`/factory?occupation=${occupation.slug}`}
              className="btn-primary group inline-flex shrink-0 items-center gap-2.5 rounded-lg border border-primary bg-primary px-8 py-3.5 text-[0.9rem] font-medium transition-all hover:bg-transparent hover:text-ink"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
