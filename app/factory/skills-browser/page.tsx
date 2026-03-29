'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, ArrowUpDown, Cpu, BrainCircuit, Sparkles, Layers, Users, Briefcase, Zap } from 'lucide-react';

interface Skill {
  id: number;
  skill_code: string;
  skill_name: string;
  category: string;
  description: string;
  ai_dependence_score: number;
  difficulty_level: number;
  task_count: number;
}

interface Category {
  category: string;
  count: number;
}

const categoryColors: Record<string, string> = {
  'Information Processing': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Communication': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Analytics': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Sales': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Finance': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Operations': 'bg-red-500/10 text-red-400 border-red-500/20',
  'HR': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Legal': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Technical': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Research': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'bg-red-500';
  if (score >= 0.6) return 'bg-orange-500';
  if (score >= 0.4) return 'bg-yellow-500';
  if (score >= 0.2) return 'bg-emerald-500';
  return 'bg-slate-500';
}

function getScoreLabel(score: number): string {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium-High';
  if (score >= 0.4) return 'Medium';
  if (score >= 0.2) return 'Low';
  return 'Minimal';
}

export default function SkillsBrowserPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [sortBy, setSortBy] = useState<'name' | 'tasks' | 'ai_score'>('tasks');

  useEffect(() => {
    fetchSkills();
  }, [selectedCategory, pagination.offset]);

  async function fetchSkills() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      params.set('limit', pagination.limit.toString());
      params.set('offset', pagination.offset.toString());

      const res = await fetch(`/api/factory/skills?${params}`);
      const data = await res.json();
      
      if (pagination.offset === 0) {
        setSkills(data.skills || []);
        setCategories(data.categories || []);
      } else {
        setSkills(prev => [...prev, ...(data.skills || [])]);
      }
      setPagination(data.pagination || { total: 0, limit: 50, offset: 0, hasMore: false });
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSkills = searchQuery 
    ? skills.filter(s => 
        s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skills;

  const sortedSkills = [...filteredSkills].sort((a, b) => {
    if (sortBy === 'tasks') return b.task_count - a.task_count;
    if (sortBy === 'ai_score') return (b.ai_dependence_score || 0) - (a.ai_dependence_score || 0);
    return a.skill_name.localeCompare(b.skill_name);
  });

  function loadMore() {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-40 left-1/4 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <Link href="/factory" className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-flex items-center gap-1.5 transition-colors group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Back to Factory
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Skills</span>{' '}
            Browser
          </h1>
          <p className="text-slate-400 text-lg">
            Explore {pagination.total.toLocaleString()}+ micro-skills extracted from O*NET tasks
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: pagination.total.toLocaleString(), label: 'Total Skills', icon: <Layers className="w-5 h-5" />, color: 'text-cyan-400' },
            { value: categories.length.toString(), label: 'Categories', icon: <Briefcase className="w-5 h-5" />, color: 'text-emerald-400' },
            { value: '15,473', label: 'Tasks Analyzed', icon: <BrainCircuit className="w-5 h-5" />, color: 'text-purple-400' },
            { value: '826', label: 'Occupations', icon: <Users className="w-5 h-5" />, color: 'text-orange-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 text-center border border-slate-800 hover:border-slate-700 transition-colors">
              <div className={`${stat.color} mx-auto mb-2 flex justify-center`}>{stat.icon}</div>
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 mb-8 border border-slate-800 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500/50 text-sm appearance-none cursor-pointer"
              >
                <option value="tasks">Sort by Tasks</option>
                <option value="ai_score">Sort by AI Score</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory('all'); setPagination(prev => ({ ...prev, offset: 0 })); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All ({pagination.total})
            </button>
            {categories.map(cat => (
              <button
                key={cat.category}
                onClick={() => { setSelectedCategory(cat.category); setPagination(prev => ({ ...prev, offset: 0 })); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.category ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        {isLoading && skills.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 animate-pulse">
                <div className="h-5 bg-slate-800/60 rounded-lg w-1/3 mb-3" />
                <div className="h-6 bg-slate-800/60 rounded-lg w-2/3 mb-3" />
                <div className="h-4 bg-slate-800/40 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {sortedSkills.map(skill => (
                <div
                  key={skill.id}
                  className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${categoryColors[skill.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {skill.category}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">{skill.skill_code}</span>
                  </div>
                  
                  <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition-colors">{skill.skill_name}</h3>
                  
                  {skill.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {skill.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400">Tasks:</span>
                      <span className="font-semibold">{skill.task_count}</span>
                    </div>
                    
                    {skill.ai_dependence_score !== null && (
                      <div className="flex items-center gap-2" title={`AI Dependence: ${getScoreLabel(skill.ai_dependence_score)}`}>
                        <BrainCircuit className="w-3.5 h-3.5 text-slate-500" />
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreColor(skill.ai_dependence_score)} rounded-full`}
                            style={{ width: `${skill.ai_dependence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {Math.round(skill.ai_dependence_score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Link
                    href={`/factory/build?skill=${skill.skill_code}`}
                    className="block w-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500 hover:to-cyan-500 text-emerald-400 hover:text-white text-center py-2.5 rounded-xl text-sm font-medium transition-all border border-emerald-500/20 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" />
                    Automate with AI
                  </Link>
                </div>
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && !searchQuery && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-8 py-3 rounded-xl transition-colors font-medium"
                >
                  {isLoading ? 'Loading...' : `Load More (${pagination.total - skills.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && sortedSkills.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-900/60 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-slate-800">
              <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No skills found</h3>
            <p className="text-slate-400 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            How Skills Map to Automations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-cyan-400 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                AI Dependence Score
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                Shows how much AI can perform this skill without human help. Higher scores = more automatable.
              </p>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded" />High (80%+)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-orange-500 rounded" />Med-High</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-500 rounded" />Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" />Low</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-cyan-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Build Custom Workflows
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                Click &quot;Automate with AI&quot; on any skill to start building a custom workflow that combines multiple skills.
              </p>
              <Link
                href="/factory/build"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
              >
                Try the workflow builder <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
