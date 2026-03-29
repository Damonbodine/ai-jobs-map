import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const opportunityCategoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  task_automation: { label: 'Task Automation', color: 'bg-blue-500', icon: '🤖' },
  decision_support: { label: 'Decision Support', color: 'bg-purple-500', icon: '🎯' },
  research_discovery: { label: 'Research & Discovery', color: 'bg-green-500', icon: '🔬' },
  communication: { label: 'Communication', color: 'bg-orange-500', icon: '💬' },
  creative_assistance: { label: 'Creative Assistance', color: 'bg-pink-500', icon: '🎨' },
  data_analysis: { label: 'Data Analysis', color: 'bg-cyan-500', icon: '📊' },
  learning_education: { label: 'Learning & Education', color: 'bg-yellow-500', icon: '📚' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'text-green-400 bg-green-400/20' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-400 bg-yellow-400/20' },
  advanced: { label: 'Advanced', color: 'text-red-400 bg-red-400/20' },
};

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
       MAX(tsm.is_core_skill) as has_core,
       MAX(tsm.is_differentiator_skill) as has_differentiator,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const occupation = await getOccupation(slug);
  
  if (!occupation) {
    return { title: 'Occupation Not Found' };
  }

  return {
    title: `${occupation.title} - AI Opportunities | AI Jobs Map`,
    description: `Discover how AI can transform your role as a ${occupation.title}. Find AI-powered opportunities, skill recommendations, and actionable insights.`,
  };
}

export default async function OccupationPage({ params }: PageProps) {
  const { slug } = await params;
  const occupation = await getOccupation(slug);

  if (!occupation) {
    notFound();
  }

  const opportunities = await getOpportunities(occupation.id);
  const skills = await getSkills(occupation.id);
  const microTasks = await getMicroTasks(occupation.id);
  const granularSkills = await getGranularSkills(occupation.id);
  const skillProfile = await getSkillProfile(occupation.id);

  // Calculate AI readiness based on micro-tasks with AI
  const aiApplicableTasks = microTasks.filter((t: any) => t.ai_applicable && t.ai_impact_level);
  const readinessScore = aiApplicableTasks.length > 0
    ? Math.round(
        (aiApplicableTasks.reduce((sum: number, t: any) => sum + (t.ai_impact_level || 0), 0) / 
         aiApplicableTasks.length) * 20
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-jobs" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Map</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/ai-jobs" className="text-slate-300 hover:text-white transition-colors">
              Search
            </Link>
            <Link href="/ai-jobs/browse" className="text-slate-300 hover:text-white transition-colors">
              Browse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-12 max-w-7xl mx-auto">
        <Link 
          href="/ai-jobs"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <div className="text-emerald-400 font-medium mb-2">{occupation.major_category}</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {occupation.title}
            </h1>
            {occupation.employment && (
              <div className="text-slate-400 mb-4">
                {Number(occupation.employment).toLocaleString()} workers in the US
              </div>
            )}
          </div>

          {readinessScore !== null && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center min-w-[200px]">
              <div className="text-5xl font-bold text-emerald-400 mb-2">{readinessScore}</div>
              <div className="text-slate-400">AI Readiness Score</div>
              <div className="text-sm text-slate-500 mt-1">
                Based on {opportunities.length} AI opportunities
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="px-4 max-w-7xl mx-auto">
        {/* Micro-Tasks with AI Mapping */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-2xl">📋</span>
              Day-to-Day Tasks & AI Opportunities
            </h2>
            <div className="text-sm text-slate-400">
              {microTasks.length} tasks • {microTasks.filter((t: any) => t.ai_applicable).length} AI-enabled
            </div>
          </div>
          
          {microTasks.length > 0 ? (
            <div className="space-y-4">
              {microTasks.map((task: any) => {
                const config = opportunityCategoryConfig[task.ai_category || 'task_automation'] || {
                  label: 'Task Automation',
                  color: 'bg-gray-500',
                  icon: '✨'
                };
                const frequencyColors: Record<string, string> = {
                  daily: 'text-green-400 bg-green-400/20',
                  weekly: 'text-blue-400 bg-blue-400/20',
                  monthly: 'text-purple-400 bg-purple-400/20',
                  'as-needed': 'text-slate-400 bg-slate-400/20',
                };
                
                return (
                  <div 
                    key={task.id}
                    className={`border rounded-xl p-5 transition-all ${
                      task.ai_applicable 
                        ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/30' 
                        : 'bg-slate-800/40 border-slate-700/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{task.task_name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${frequencyColors[task.frequency] || frequencyColors['as-needed']}`}>
                            {task.frequency}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{task.task_description}</p>
                      </div>
                      {task.ai_applicable && (
                        <div className="flex gap-3 text-sm shrink-0">
                          <div className="text-center">
                            <div className="text-emerald-400 font-semibold">{task.ai_impact_level}/5</div>
                            <div className="text-slate-500">Impact</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-400 font-semibold">{task.ai_effort_to_implement}/5</div>
                            <div className="text-slate-500">Effort</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {task.ai_applicable && task.ai_how_it_helps && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className={`px-2 py-0.5 rounded text-xs text-white ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-emerald-300/80 text-sm mb-2">{task.ai_how_it_helps}</p>
                        {task.ai_tools && (
                          <p className="text-slate-500 text-xs">
                            <span className="text-slate-400">Tools:</span> {task.ai_tools}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {!task.ai_applicable && (
                      <div className="mt-2 text-slate-500 text-sm italic">
                        AI does not apply to this task
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">Micro-Task Analysis Coming Soon</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                We&apos;re analyzing the day-to-day tasks for this occupation to identify specific AI opportunities.
              </p>
            </div>
          )}
        </section>

        {/* Granular Skill Breakdown */}
        {granularSkills.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                Deep Skill Analysis
              </h2>
              <div className="text-sm text-slate-400">
                {granularSkills.length} unique skills • {granularSkills.filter((s: any) => s.has_differentiator).length} human differentiators
              </div>
            </div>

            {/* Skill Profile Summary */}
            {skillProfile && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="text-3xl font-bold text-emerald-400">{skillProfile.total_unique_skills || granularSkills.length}</div>
                  <div className="text-slate-400 text-sm">Total Skills</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-400">{skillProfile.core_skills_count || granularSkills.filter((s: any) => s.has_core).length}</div>
                  <div className="text-slate-400 text-sm">Core Skills</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-400">{skillProfile.automatable_skills_count || granularSkills.filter((s: any) => parseFloat(s.avg_ai_dependence || 0) > 0.5).length}</div>
                  <div className="text-slate-400 text-sm">AI Automatable</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="text-3xl font-bold text-orange-400">{skillProfile.human_differentiator_skills_count || granularSkills.filter((s: any) => s.has_differentiator).length}</div>
                  <div className="text-slate-400 text-sm">Human Differentiators</div>
                </div>
              </div>
            )}
            
            {/* Skills by Category */}
            <div className="space-y-6">
              {['Technical', 'Analytical', 'Management', 'Communication', 'Soft Skills', 'Financial', 'Sales and Marketing'].map(category => {
                const categorySkills = granularSkills.filter((s: any) => s.category === category);
                if (categorySkills.length === 0) return null;
                
                return (
                  <div key={category} className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-lg">
                        {category === 'Technical' ? '💻' : 
                         category === 'Analytical' ? '📊' :
                         category === 'Management' ? '📈' :
                         category === 'Communication' ? '💬' :
                         category === 'Soft Skills' ? '🧠' :
                         category === 'Financial' ? '💰' : '🎯'}
                      </span>
                      {category}
                      <span className="text-slate-500 text-sm font-normal">({categorySkills.length} skills)</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill: any) => {
                        const aiDep = parseFloat(skill.avg_ai_dependence || 0);
                        const isCore = skill.has_core;
                        const isDiff = skill.has_differentiator;
                        
                        return (
                          <div 
                            key={skill.id}
                            className={`px-3 py-2 rounded-lg border ${
                              isDiff 
                                ? 'bg-orange-500/10 border-orange-500/30' 
                                : aiDep > 0.5 
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : 'bg-slate-700/50 border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">{skill.skill_name}</span>
                              {isCore && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">core</span>}
                              {isDiff && <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">human</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${aiDep > 0.5 ? 'bg-emerald-400' : 'bg-slate-500'}`}
                                  style={{ width: `${aiDep * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{Math.round(aiDep * 100)}% AI</span>
                              <span className="text-xs text-slate-500">•</span>
                              <span className="text-xs text-slate-500">Prof: {Math.round(skill.avg_proficiency || 0)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Skill Recommendations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-2xl">📈</span>
            AI Skills to Learn
          </h2>
          
          {skills.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {skills.map((skill: any) => {
                const diff = difficultyConfig[skill.difficulty] || {
                  label: skill.difficulty,
                  color: 'text-gray-400 bg-gray-400/20'
                };
                return (
                  <div 
                    key={skill.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-5"
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
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">
                Skill recommendations will be available once we analyze this occupation.
              </p>
            </div>
          )}
        </section>

        {/* Impact/Effort Matrix */}
        {opportunities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              Impact vs Effort Matrix
            </h2>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
              <div className="relative h-64 bg-slate-900 rounded-lg overflow-hidden">
                {/* Grid */}
                <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className="border border-slate-800" />
                  ))}
                </div>
                
                {/* Quadrant labels */}
                <div className="absolute top-2 left-2 text-xs text-slate-500">Low Impact</div>
                <div className="absolute top-2 right-2 text-xs text-emerald-500">Quick Wins</div>
                <div className="absolute bottom-2 right-2 text-xs text-emerald-400">Big Bets</div>
                <div className="absolute bottom-2 left-2 text-xs text-slate-500">Low Priority</div>
                
                {/* Opportunities plotted */}
                {opportunities.map((opp: any, i: number) => {
                  const x = ((5 - opp.effort_level) / 4) * 90 + 5;
                  const y = ((opp.impact_level - 1) / 4) * 85 + 5;
                  const config = opportunityCategoryConfig[opp.category] || { color: 'bg-gray-500', icon: '✨' };
                  return (
                    <div
                      key={opp.id}
                      className={`absolute w-8 h-8 ${config.color} rounded-full flex items-center justify-center text-white text-sm cursor-pointer hover:scale-125 transition-transform`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      title={`${opp.title} (Impact: ${opp.impact_level}, Effort: ${opp.effort_level})`}
                    >
                      {config.icon}
                    </div>
                  );
                })}
                
                {/* Axes */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700" />
                <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-slate-700" />
                
                {/* Axis labels */}
                <div className="absolute bottom-1/2 -left-6 transform -rotate-90 text-xs text-slate-500">
                  Impact →
                </div>
                <div className="absolute top-1/2 right-1 text-xs text-slate-500">
                  Effort →
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>Built with Next.js, Supabase & Vercel</p>
          <p className="mt-2 text-sm">Data sourced from U.S. Bureau of Labor Statistics</p>
        </div>
      </footer>
    </div>
  );
}
