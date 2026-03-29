'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Zap, Clock, TrendingUp, Activity, Cpu, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface WorkflowStep {
  order: number;
  stepId: string;
  agentId: string;
  agentName: string;
  category: string;
  skillsHandled: string[];
  skillCount: number;
  costPerExecution: number;
  latencyMs: number;
  needsApproval: boolean;
}

interface AgentBreakdown {
  agentId: string;
  agentName: string;
  category: string;
  skillCount: number;
  skills: string[];
}

interface Pipeline {
  occupation: {
    id: number;
    title: string;
    slug: string;
  };
  summary: {
    totalSkills: number;
    mappedSkills: number;
    unmappedSkills: number;
    automationCoverage: number;
    avgAiDependence: number;
    estimatedTimeSavedPerWeek: number;
    estimatedCostSavingsPerWeek: number;
    totalWorkflowCost: number;
    humanApprovalRequired: number;
  };
  workflowSteps: WorkflowStep[];
  agentBreakdown: AgentBreakdown[];
  confidence: number;
}

const categoryConfig: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; gradient: string }> = {
  input: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: <ArrowRight className="w-5 h-5" />, gradient: 'from-blue-500 to-blue-400' },
  processing: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: <Cpu className="w-5 h-5" />, gradient: 'from-purple-500 to-purple-400' },
  quality: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'from-yellow-500 to-yellow-400' },
  output: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: <Sparkles className="w-5 h-5" />, gradient: 'from-emerald-500 to-emerald-400' },
};

export default function PipelinePage() {
  const [occupation, setOccupation] = useState('');
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  async function buildPipeline(slug: string) {
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    
    try {
      const res = await fetch('/api/factory/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occupationSlug: slug }),
      });
      
      if (!res.ok) throw new Error('Failed to build pipeline');
      
      const data = await res.json();
      setPipeline(data);
    } catch {
      setError('Could not build pipeline. Try another occupation.');
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
    buildPipeline(occ.slug);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-40 right-1/3 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
      <div className="absolute top-1/2 left-10 w-[300px] h-[300px] bg-purple-600/6 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '11s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <Link href="/factory" className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-flex items-center gap-1.5 transition-colors group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Back to Factory
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">AI Pipeline</span>{' '}
            Builder
          </h1>
          <p className="text-slate-400 text-lg">
            See how AI agents can automate any occupation&apos;s tasks
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Enter occupation (e.g., Software Developers, Accountants, Managers)"
                value={occupation}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => occupation.length >= 2 && setShowSuggestions(true)}
                className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl pl-12 pr-6 py-4 text-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl mt-2 shadow-xl shadow-cyan-900/10 z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => selectOccupation(s)}
                      className="w-full px-6 py-3 text-left hover:bg-slate-800/80 transition-colors border-b border-slate-800/50 last:border-0 group"
                    >
                      <div className="font-medium group-hover:text-cyan-400 transition-colors">{s.title}</div>
                      <div className="text-sm text-slate-500">{s.major_category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => occupation && buildPipeline(occupation.toLowerCase().replace(/\s+/g, '-'))}
              disabled={loading || !occupation}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:shadow-none flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              {loading ? 'Building...' : 'Build Pipeline'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-14 w-14 border-2 border-slate-800 border-t-cyan-500 mx-auto mb-4" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 border-2 border-cyan-500" />
            </div>
            <p className="text-slate-400 mt-4">Building AI pipeline...</p>
          </div>
        )}

        {pipeline && !loading && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: `${pipeline.summary.automationCoverage}%`, label: 'Automation Coverage', icon: <Cpu className="w-5 h-5" />, color: 'text-cyan-400' },
                { value: `${pipeline.summary.estimatedTimeSavedPerWeek}h`, label: 'Saved per Week', icon: <Clock className="w-5 h-5" />, color: 'text-emerald-400' },
                { value: `$${pipeline.summary.estimatedCostSavingsPerWeek}`, label: 'Savings per Week', icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400' },
                { value: `${Math.round(pipeline.confidence * 100)}%`, label: 'Confidence', icon: <Zap className="w-5 h-5" />, color: 'text-orange-400' },
              ].map((metric, i) => (
                <div key={i} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 text-center border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className={`${metric.color} mx-auto mb-3 flex justify-center`}>{metric.icon}</div>
                  <div className={`text-4xl font-black ${metric.color}`}>{metric.value}</div>
                  <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Workflow Visualization */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                {pipeline.occupation.title} → AI Pipeline
              </h2>
              
              {/* Pipeline Flow */}
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/30 via-purple-500/30 to-emerald-500/30" />
                
                <div className="space-y-4">
                  {pipeline.workflowSteps.map((step) => {
                    const config = categoryConfig[step.category] || categoryConfig.processing;
                    return (
                      <div key={step.stepId} className="relative flex items-start gap-4 group">
                        {/* Step Icon */}
                        <div className={`w-16 h-16 rounded-xl ${config.bg} ${config.border} border-2 flex items-center justify-center flex-shrink-0 ${config.text} group-hover:scale-105 transition-transform`}>
                          {config.icon}
                        </div>
                        
                        {/* Step Content */}
                        <div className={`flex-1 ${config.bg} rounded-xl p-4 border ${config.border} hover:border-opacity-60 transition-all`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className={`${config.text} font-semibold`}>{step.agentName}</span>
                              <span className="text-slate-600 text-sm ml-2">#{step.order}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-slate-400 font-medium">{step.skillCount} skills</span>
                              <span className="text-slate-400">${step.costPerExecution}</span>
                              <span className="text-slate-400">{step.latencyMs}ms</span>
                              {step.needsApproval && (
                                <span className="text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Needs Approval
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-slate-400">
                            Handles: {step.skillsHandled.slice(0, 3).join(', ')}
                            {step.skillCount > 3 && <span className="text-slate-500"> +{step.skillCount - 3} more</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Agent Breakdown */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Cpu className="w-6 h-6 text-purple-400" />
                Agent Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pipeline.agentBreakdown.map((agent) => {
                  const config = categoryConfig[agent.category] || categoryConfig.processing;
                  return (
                    <div
                      key={agent.agentId}
                      className={`${config.bg} rounded-xl p-4 border ${config.border} hover:scale-[1.02] transition-transform`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={config.text}>{config.icon}</div>
                        <span className={`${config.text} text-xs uppercase font-bold tracking-wide`}>{agent.category}</span>
                      </div>
                      <h3 className="font-semibold mb-1">{agent.agentName}</h3>
                      <div className="text-sm text-slate-400">{agent.skillCount} skills handled</div>
                      <div className="mt-2 text-xs text-slate-500 truncate">
                        {agent.skills.slice(0, 3).join(', ')}
                        {agent.skillCount > 3 && ` +${agent.skillCount - 3}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coverage Meter */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                Coverage Analysis
              </h2>
              <div className="space-y-6">
                {[
                  { label: 'Automation Coverage', value: `${pipeline.summary.automationCoverage}%`, percent: pipeline.summary.automationCoverage, gradient: 'from-emerald-500 to-cyan-500', color: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
                  { label: 'AI Dependence', value: `${Math.round(pipeline.summary.avgAiDependence * 100)}%`, percent: pipeline.summary.avgAiDependence * 100, gradient: 'from-purple-500 to-pink-500', color: 'text-purple-400', shadow: 'shadow-purple-500/20' },
                  { label: 'Confidence Score', value: `${Math.round(pipeline.confidence * 100)}%`, percent: pipeline.confidence * 100, gradient: 'from-orange-500 to-yellow-500', color: 'text-orange-400', shadow: 'shadow-orange-500/20' },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{bar.label}</span>
                      <span className={`${bar.color} font-bold`}>{bar.value}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${bar.gradient} rounded-full shadow-sm ${bar.shadow} transition-all duration-1000`}
                        style={{ width: `${bar.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-cyan-900/30 rounded-2xl p-8 text-center border border-slate-800 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-4">Ready to automate?</h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                This pipeline can save {pipeline.summary.estimatedTimeSavedPerWeek} hours per week.
                Annual value: <span className="text-emerald-400 font-bold">${Math.round(pipeline.summary.estimatedCostSavingsPerWeek * 52).toLocaleString()}</span>
              </p>
              <Link
                href={`/factory/build?occupation=${pipeline.occupation.slug}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                <Zap className="w-5 h-5" />
                Build Custom Workflow
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
