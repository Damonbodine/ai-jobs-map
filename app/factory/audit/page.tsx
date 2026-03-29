'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Zap, Clock, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Timer, Shield, ChevronRight, X, ExternalLink, Sparkles } from 'lucide-react';

interface AuditTask {
  id: number;
  task_code: string;
  task_name: string;
  task_description: string;
  category_name: string;
  category_code: string;
  category_icon: string;
  frequency: string;
  weekly_hours: number;
  risk_level: string;
  automation_readiness: string;
  automation_difficulty: string;
  automation_confidence: number;
  estimated_annual_savings_dollars: number;
  proof_points?: Array<{
    id: number;
    tool_name: string;
    tool_url: string;
    tool_pricing: string;
    tool_setup_time: string;
  }>;
}

interface AuditData {
  session: {
    token: string;
    occupation: string;
    generated_at: string;
  };
  summary: {
    automation_score: number;
    total_tasks: number;
    ready_now_tasks: number;
    total_weekly_hours: number;
    automatable_weekly_hours: number;
    potential_weekly_savings: number;
    potential_annual_savings: number;
  };
  tasks_by_readiness: {
    ready_now: AuditTask[];
    ready_soon: AuditTask[];
    needs_review: AuditTask[];
    not_ready: AuditTask[];
  };
  top_opportunities: AuditTask[];
  insights: string[];
  hourly_rate: number;
}

const readinessConfig: Record<string, { bg: string; border: string; text: string; label: string; icon: React.ReactNode }> = {
  ready_now: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Ready Now', icon: <CheckCircle2 className="w-4 h-4" /> },
  ready_soon: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Ready Soon', icon: <Timer className="w-4 h-4" /> },
  needs_review: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Needs Review', icon: <AlertTriangle className="w-4 h-4" /> },
  not_ready: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Not Ready', icon: <XCircle className="w-4 h-4" /> },
};

const riskConfig: Record<string, { text: string; icon: React.ReactNode }> = {
  low: { text: 'text-emerald-400', icon: <Shield className="w-3.5 h-3.5" /> },
  medium: { text: 'text-yellow-400', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  high: { text: 'text-orange-400', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  critical: { text: 'text-red-400', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function AuditPage() {
  const [occupation, setOccupation] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState(50);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AuditTask | null>(null);

  async function fetchSuggestions(query: string) {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/ai-jobs/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }

  async function generateAudit(slug: string) {
    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const res = await fetch('/api/factory/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupationSlug: slug,
          email: email || undefined,
          hourlyRate,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate audit');

      const data = await res.json();
      setAuditData(data);
    } catch {
      setError('Could not generate audit. Try another occupation.');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(value: string) {
    setOccupation(value);
    fetchSuggestions(value);
  }

  function selectOccupation(occ: any) {
    setOccupation(occ.title);
    setShowSuggestions(false);
    generateAudit(occ.slug);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-40 right-1/4 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
      <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-purple-600/6 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '11s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-10">
          <Link href="/factory" className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-flex items-center gap-1.5 transition-colors group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Back to Factory
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">AI Opportunity</span>{' '}
            Audit
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Discover exactly what&apos;s possible for your job, right now — with real tools, real savings, and real proof.
          </p>
        </div>

        {/* Input Form */}
        {!auditData && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Start Your Free Audit</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-wide">
                  Your Job Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Marketing Manager, Software Developer, Accountant"
                    value={occupation}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => occupation.length >= 2 && setShowSuggestions(true)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl mt-2 shadow-xl shadow-cyan-900/10 z-50 max-h-64 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => selectOccupation(s)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-800/80 transition-colors border-b border-slate-800/50 last:border-0 group"
                        >
                          <div className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{s.title}</div>
                          <div className="text-sm text-slate-500">{s.major_category}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-wide">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-wide">
                    Your Hourly Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-lg font-medium">$</span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      min="10"
                      max="500"
                      className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                    <span className="text-slate-400 text-sm font-medium">/hour</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => occupation && generateAudit(occupation.toLowerCase().replace(/\s+/g, '-'))}
                disabled={loading || !occupation}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Your Audit...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Generate My Free Audit
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 text-red-400 flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-14 w-14 border-2 border-slate-800 border-t-cyan-500 mx-auto mb-4" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 border-2 border-cyan-500" />
            </div>
            <p className="text-slate-400 mt-4">Analyzing your job and calculating opportunities...</p>
          </div>
        )}

        {/* Audit Results */}
        {auditData && !loading && (
          <div className="space-y-8">
            {/* Summary Header */}
            <div className="bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-cyan-900/30 rounded-2xl p-8 border border-slate-800 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                    {auditData.session.occupation}
                  </h2>
                  <p className="text-slate-400">
                    AI Opportunity Audit · Generated {new Date(auditData.session.generated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {auditData.summary.automation_score}%
                  </div>
                  <div className="text-sm text-slate-400 font-medium tracking-wide uppercase mt-1">Automation Score</div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: `$${auditData.summary.potential_annual_savings.toLocaleString()}`, label: 'Annual Savings Potential', icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400' },
                { value: `${auditData.summary.automatable_weekly_hours}h`, label: 'Hours Saved per Week', icon: <Clock className="w-5 h-5" />, color: 'text-cyan-400' },
                { value: auditData.summary.ready_now_tasks, label: 'Tasks Ready to Automate', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-purple-400' },
                { value: auditData.summary.total_tasks, label: 'Total Tasks Analyzed', icon: <Zap className="w-5 h-5" />, color: 'text-orange-400' },
              ].map((metric, i) => (
                <div key={i} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 text-center hover:border-slate-700 transition-colors">
                  <div className={`${metric.color} mx-auto mb-3 flex justify-center`}>{metric.icon}</div>
                  <div className={`text-3xl font-black ${metric.color}`}>{metric.value}</div>
                  <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Key Insights
              </h3>
              <div className="space-y-3">
                {auditData.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-500/25 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Opportunities */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Your Top Opportunities to Automate
              </h3>
              <div className="space-y-4">
                {auditData.top_opportunities.map((task) => {
                  const config = readinessConfig[task.automation_readiness] || readinessConfig.needs_review;
                  const risk = riskConfig[task.risk_level] || riskConfig.medium;
                  return (
                    <div
                      key={task.id}
                      className={`${config.bg} rounded-xl p-5 border ${config.border} cursor-pointer hover:scale-[1.01] transition-all group`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{task.category_icon}</span>
                          <div>
                            <h4 className="font-semibold group-hover:text-cyan-400 transition-colors">{task.task_name}</h4>
                            <p className="text-sm text-slate-400">{task.category_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${config.text}`}>
                            ${Math.round(task.estimated_annual_savings_dollars).toLocaleString()}/year
                          </div>
                          <div className="text-sm text-slate-500">
                            {task.weekly_hours}h/week
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${config.text} font-medium flex items-center gap-1`}>
                          {config.icon}
                          {readinessConfig[task.automation_readiness]?.label}
                        </span>
                        <span className="text-slate-700">|</span>
                        <span className={`${risk.text} flex items-center gap-1`}>
                          {risk.icon}
                          {task.risk_level.charAt(0).toUpperCase() + task.risk_level.slice(1)} Risk
                        </span>
                        <span className="text-slate-700">|</span>
                        <span className="text-slate-400">{task.frequency}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Task Detail Modal */}
            {selectedTask && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedTask(null)}>
                <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl shadow-cyan-900/10" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedTask.category_icon}</span>
                        <div>
                          <h3 className="text-xl font-bold">{selectedTask.task_name}</h3>
                          <p className="text-slate-400">{selectedTask.category_name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-slate-300 mb-6">{selectedTask.task_description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                        <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase mb-1">Time Investment</div>
                        <div className="text-2xl font-bold">{selectedTask.weekly_hours}h/week</div>
                      </div>
                      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                        <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase mb-1">Potential Savings</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          ${Math.round(selectedTask.estimated_annual_savings_dollars).toLocaleString()}/year
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {[
                        { label: 'Automation Readiness', value: readinessConfig[selectedTask.automation_readiness]?.label, className: readinessConfig[selectedTask.automation_readiness]?.text },
                        { label: 'Risk Level', value: selectedTask.risk_level.charAt(0).toUpperCase() + selectedTask.risk_level.slice(1), className: riskConfig[selectedTask.risk_level]?.text },
                        { label: 'Frequency', value: selectedTask.frequency, className: 'text-slate-200' },
                        { label: 'Confidence', value: `${Math.round(selectedTask.automation_confidence * 100)}%`, className: 'text-slate-200' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                          <span className="text-slate-400 text-sm">{item.label}</span>
                          <span className={`font-medium ${item.className}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Proof Points */}
                    {selectedTask.proof_points && selectedTask.proof_points.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          Recommended Tools
                        </h4>
                        <div className="space-y-3">
                          {selectedTask.proof_points.map((proof) => (
                            <div key={proof.id} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{proof.tool_name}</span>
                                <a
                                  href={proof.tool_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 transition-colors"
                                >
                                  Try it <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <div className="text-sm text-slate-400">
                                {proof.tool_pricing} · {proof.tool_setup_time} setup
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedTask(null)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25"
                    >
                      Start Automating This Task
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-cyan-900/30 rounded-2xl p-8 text-center border border-slate-800 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Save {auditData.summary.automatable_weekly_hours} Hours Per Week?
              </h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Start with one task and see results in minutes. Most tools take less than 15 minutes to set up.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/factory/build?occupation=${auditData.session.occupation.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 inline-flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Start with Top Task
                </Link>
                <button
                  onClick={() => setAuditData(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-8 py-3 rounded-xl font-semibold transition-colors"
                >
                  Try Another Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
