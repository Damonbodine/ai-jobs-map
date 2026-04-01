'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Package, Workflow, SlidersHorizontal, Clock, Shield, ChevronRight, ArrowUpDown, Sparkles, Zap } from 'lucide-react';

interface WorkflowItem {
  id: number;
  workflow_code: string;
  workflow_name: string;
  workflow_description: string;
  category: string;
  base_price: number;
  monthly_maintenance: number;
  estimated_time_saved_per_day: number;
  requires_human_approval: boolean;
}

interface PackageItem {
  id: number;
  package_code: string;
  package_name: string;
  package_description: string;
  tier: string;
  base_price: number;
  monthly_price: number;
  setup_hours: number;
  includes_self_healing: boolean;
  includes_integrations: number;
  target_occupations: string[];
}

const categories = ['all', 'Document Processing', 'Analytics', 'Communication', 'Finance', 'Sales', 'Research', 'Quality', 'HR'];

const categoryIcons: Record<string, string> = {
  'Document Processing': '📄',
  'Analytics': '📊',
  'Communication': '💬',
  'Finance': '💰',
  'Sales': '📈',
  'Research': '🔬',
  'Quality': '✅',
  'HR': '👥',
};

const tierConfig: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  starter: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400' },
  growth: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', text: 'text-purple-400' },
  enterprise: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/20', text: 'text-orange-400' },
};

const workflowStory: Record<string, { routine: string; outcome: string }> = {
  'Document Processing': { routine: 'capture, extraction, and repetitive document handling', outcome: 'Move admin-heavy paperwork off the calendar.' },
  Analytics: { routine: 'report assembly, pattern review, and recurring analysis', outcome: 'Give teams back focused time for decisions.' },
  Communication: { routine: 'triage, follow-up, and response drafting', outcome: 'Reduce the drag of inbox and coordination work.' },
  Finance: { routine: 'reconciliation, approvals, and reporting', outcome: 'Target stable routines with clear time-back potential.' },
  Sales: { routine: 'CRM hygiene, lead follow-up, and qualification', outcome: 'Protect seller time for actual conversations.' },
  Research: { routine: 'collection, synthesis, and recurring briefing', outcome: 'Automate prep so deep work stays human.' },
  Quality: { routine: 'checks, validation, and exception handling', outcome: 'Remove manual review from recurring workflows.' },
  HR: { routine: 'screening, onboarding, and people-ops coordination', outcome: 'Return hours to higher-touch team work.' },
};

const packageStory: Record<string, { promise: string; fit: string }> = {
  starter: { promise: 'Best when one recurring routine is eating a meaningful slice of the day.', fit: 'A first one-hour-back wedge.' },
  growth: { promise: 'Designed for teams with several linked routines that should move together.', fit: 'A cross-functional automation layer.' },
  enterprise: { promise: 'Best for complex operational systems with approvals, exceptions, and integrations.', fit: 'A managed automation operating model.' },
};

export default function MarketplacePage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'workflows' | 'packages'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'savings'>('name');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [wfRes, pkgRes] = await Promise.all([
        fetch('/api/factory/workflows'),
        fetch('/api/factory/packages'),
      ]);
      const wfData = await wfRes.json();
      const pkgData = await pkgRes.json();
      setWorkflows(wfData.workflows || []);
      setPackages(pkgData.packages || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredWorkflows = workflows.filter(w => {
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      w.workflow_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.workflow_description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPackages = packages.filter(p => {
    const matchesTier = selectedTier === 'all' || p.tier === selectedTier;
    const matchesSearch = !searchQuery || 
      p.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.package_description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    if (sortBy === 'name') return a.workflow_name.localeCompare(b.workflow_name);
    if (sortBy === 'price') return a.base_price - b.base_price;
    if (sortBy === 'savings') return b.estimated_time_saved_per_day - a.estimated_time_saved_per_day;
    return 0;
  });

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    if (sortBy === 'name') return a.package_name.localeCompare(b.package_name);
    if (sortBy === 'price') return a.base_price - b.base_price;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-800/50 rounded-xl w-64" />
            <div className="h-6 bg-slate-800/40 rounded w-96" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-56 bg-slate-900/60 rounded-2xl border border-slate-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell bg-slate-950 text-slate-100">
      {/* Glow Orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-40 right-1/3 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />

      <div className="page-container relative z-10 py-12 md:py-16">
        <div className="mb-10 max-w-4xl">
          <Link href="/factory" className="mb-5 inline-flex items-center gap-1.5 text-sm text-cyan-400 transition-colors hover:text-cyan-300 group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Back to Factory
          </Link>
          <div className="eyebrow mb-5">Secondary library</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 leading-[0.96]">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Automation</span>{' '}
            Marketplace
          </h1>
          <p className="text-slate-400 text-lg leading-8">
            Browse workflow bundles and package components after you understand the recommended starting package. This page supports deeper exploration. It is not the main buying path.
          </p>
        </div>

        <div className="mb-8 rounded-[1.8rem] border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended order</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-100">Start with the role and package, then use the library for depth.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                If you are still deciding what to buy, go back to the role-based recommendation or the products page first. Come here when you want to inspect workflow parts in more detail.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/15"
              >
                See products first
              </Link>
              <Link
                href="/factory"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/30 hover:text-white"
              >
                Get your plan
              </Link>
            </div>
          </div>
        </div>

        <div className="panel mb-8 rounded-[1.8rem] p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[220px] flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search workflows and packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner shadow-black/20 transition-all focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex rounded-2xl border border-slate-800 bg-slate-950/55 p-1">
              {(['all', 'workflows', 'packages'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-[0.9rem] px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode === 'workflows' ? `Workflows (${workflows.length})` : `Packages (${packages.length})`}
                </button>
              ))}
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none rounded-2xl border border-slate-800 bg-slate-950/70 py-3 pl-9 pr-8 text-sm text-slate-100 shadow-inner shadow-black/20 focus:border-emerald-500/40 focus:outline-none"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="savings">Sort by Savings</option>
              </select>
            </div>
          </div>

          {/* Category/Tier Filters */}
          {(viewMode === 'all' || viewMode === 'workflows') && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'border border-emerald-500/20 bg-emerald-500/12 text-emerald-300'
                      : 'border border-transparent bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : `${categoryIcons[cat] || ''} ${cat}`}
                </button>
              ))}
            </div>
          )}

          {(viewMode === 'all' || viewMode === 'packages') && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTier('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedTier === 'all' ? 'border border-emerald-500/20 bg-emerald-500/12 text-emerald-300' : 'border border-transparent bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Tiers
              </button>
              {['starter', 'growth', 'enterprise'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize font-medium transition-all ${
                    selectedTier === tier 
                      ? `${tierConfig[tier]?.badge} border`
                      : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-200'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workflows Grid */}
        {(viewMode === 'all' || viewMode === 'workflows') && sortedWorkflows.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Workflow className="w-6 h-6 text-cyan-400" />
              Workflow building blocks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedWorkflows.map(workflow => (
                <div
                  key={workflow.id}
                  className="rounded-[1rem] border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all group hover:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-2xl mb-2 block">
                        {categoryIcons[workflow.category] || '⚙️'}
                      </span>
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{workflow.category}</div>
                      <h3 className="mt-3 text-2xl font-semibold transition-colors group-hover:text-cyan-300">{workflow.workflow_name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-emerald-300">
                        ${workflow.base_price.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        +${workflow.monthly_maintenance}/mo
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-7">
                    {workflow.workflow_description}
                  </p>

                  <div className="mb-4 rounded-[0.95rem] border border-slate-800 bg-slate-950/55 p-4">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Routine cluster</div>
                    <div className="mt-2 text-sm text-slate-300">{workflowStory[workflow.category]?.routine ?? 'Recurring workflow coordination and repetitive admin.'}</div>
                    <div className="mt-3 text-sm text-cyan-300">{workflowStory[workflow.category]?.outcome ?? 'Designed to pull routine work out of the day.'}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Up to {workflow.estimated_time_saved_per_day}h/day back</span>
                    </div>
                    {workflow.requires_human_approval && (
                      <span className="text-yellow-400/80 text-xs flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                        ⚠️ Needs approval
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/factory/build?workflow=${workflow.workflow_code}`}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 text-center font-medium text-slate-200 transition-all hover:border-cyan-400/30 hover:text-white"
                  >
                    Customize this workflow
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packages Grid */}
        {(viewMode === 'all' || viewMode === 'packages') && sortedPackages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-400" />
              Time-back packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPackages.map(pkg => {
                const tier = tierConfig[pkg.tier] || tierConfig.starter;
                const packageNarrative = packageStory[pkg.tier] || packageStory.starter;
                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[1rem] p-6 border ${tier.border} ${tier.bg} bg-slate-900/60 backdrop-blur-xl transition-all group hover:-translate-y-0.5`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs uppercase font-bold mb-2 border ${tier.badge}`}>
                          {pkg.tier}
                        </span>
                        <h3 className="text-2xl font-semibold transition-colors group-hover:text-cyan-300">{pkg.package_name}</h3>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-semibold ${tier.text}`}>
                          ${pkg.base_price.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          +${pkg.monthly_price}/mo
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-7">
                      {pkg.package_description}
                    </p>
                    <div className="mb-4 rounded-[0.95rem] border border-slate-800 bg-slate-950/55 p-4">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Why this exists</div>
                      <div className="mt-2 text-sm text-slate-300">{packageNarrative.promise}</div>
                      <div className="mt-3 text-sm text-cyan-300">{packageNarrative.fit}</div>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-400">Setup:</span>
                        <span className="font-medium">{pkg.setup_hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-400">Integrations:</span>
                        <span className="font-medium">{pkg.includes_integrations} included</span>
                      </div>
                      {pkg.includes_self_healing && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Shield className="w-3.5 h-3.5" />
                          <span className="font-medium">Self-healing enabled</span>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/factory/build?package=${pkg.package_code}`}
                      className="block w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 text-center font-medium text-slate-200 transition-all hover:border-cyan-400/30 hover:text-white"
                    >
                      See package fit
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(sortedWorkflows.length === 0 && sortedPackages.length === 0) && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-900/60 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-slate-800">
              <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-slate-400 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={() => {setSearchQuery(''); setSelectedCategory('all'); setSelectedTier('all');}}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-emerald-900/30 via-slate-900/60 to-cyan-900/30 rounded-2xl p-8 text-center border border-slate-800 backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-4">Need a package built around your role?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Start from the routines consuming the day, then let the product compose a package around those repetitive tasks instead of forcing you into a catalog-first buying flow.
          </p>
          <Link
            href="/factory"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            <Sparkles className="w-5 h-5" />
            Get your plan
          </Link>
        </div>
      </div>
    </div>
  );
}
