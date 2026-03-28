'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Package {
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
  roi_multiplier: number;
}

interface Workflow {
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

const tierColors: Record<string, string> = {
  starter: 'from-emerald-500 to-cyan-500',
  growth: 'from-purple-500 to-pink-500',
  enterprise: 'from-orange-500 to-red-500',
};

const tierBadges: Record<string, string> = {
  starter: 'bg-emerald-500/20 text-emerald-400',
  growth: 'bg-purple-500/20 text-purple-400',
  enterprise: 'bg-orange-500/20 text-orange-400',
};

interface CoverageResult {
  occupation: { title: string; category: string };
  coverage: { percent: number; estimatedDailyHoursSaved: number; estimatedWeeklyHoursSaved: number; estimatedYearlyValue: number };
  recommendedPackages: any[];
}

export default function FactoryPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showIntake, setShowIntake] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Coverage lookup state
  const [coverageSearch, setCoverageSearch] = useState('');
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [isSearchingCoverage, setIsSearchingCoverage] = useState(false);

  // Intake form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    occupation: '',
    hourlyRate: 75,
    painPoints: [] as string[],
    currentTools: '',
    teamSize: 1,
  });
  const [roiResult, setRoiResult] = useState<{
    hoursSaved: number;
    moneySaved: number;
    paybackDays: number;
    yearlyROI: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [pkgRes, wfRes] = await Promise.all([
        fetch('/api/factory/packages'),
        fetch('/api/factory/workflows'),
      ]);
      const pkgData = await pkgRes.json();
      const wfData = await wfRes.json();
      setPackages(pkgData.packages || []);
      setWorkflows(wfData.workflows || []);
    } catch (error) {
      console.error('Error fetching factory data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function calculateROI() {
    const avgTimeSaved = 1.5; // hours per day (conservative)
    const workDaysPerYear = 250;
    const hoursSavedPerYear = avgTimeSaved * workDaysPerYear;
    const moneySavedPerYear = hoursSavedPerYear * formData.hourlyRate;
    
    // Estimate package price based on pain points
    const painPointCount = formData.painPoints.length || 1;
    const estimatedSetup = 2997 + (painPointCount - 1) * 1500;
    const estimatedMonthly = 147 + (painPointCount - 1) * 75;
    const yearlyCost = estimatedSetup + (estimatedMonthly * 12);
    
    const paybackDays = Math.round((estimatedSetup / (moneySavedPerYear / 365)));
    const yearlyROI = Math.round(((moneySavedPerYear - yearlyCost) / yearlyCost) * 100);
    
    setRoiResult({
      hoursSaved: hoursSavedPerYear,
      moneySaved: moneySavedPerYear,
      paybackDays,
      yearlyROI,
    });
  }

  async function searchCoverage() {
    if (!coverageSearch.trim()) return;
    
    setIsSearchingCoverage(true);
    try {
      // First find the occupation
      const searchRes = await fetch(`/api/ai-jobs/search?q=${encodeURIComponent(coverageSearch)}&limit=1`);
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const occ = searchData.results[0];
        // Get coverage data
        const recRes = await fetch(`/api/factory/recommend?occupation=${occ.slug}`);
        const recData = await recRes.json();
        
        setCoverageResult({
          occupation: { title: occ.title, category: occ.major_category },
          coverage: recData.coverage || { percent: 0, estimatedDailyHoursSaved: 0, estimatedWeeklyHoursSaved: 0, estimatedYearlyValue: 0 },
          recommendedPackages: recData.recommendedPackages || [],
        });
      } else {
        setCoverageResult(null);
      }
    } catch (error) {
      console.error('Coverage search error:', error);
      setCoverageResult(null);
    } finally {
      setIsSearchingCoverage(false);
    }
  }

  const painPointOptions = [
    'Manual data entry',
    'Email management',
    'Report generation',
    'Scheduling & coordination',
    'Invoice processing',
    'Customer follow-ups',
    'Lead qualification',
    'Document review',
    'Meeting preparation',
    'Social media posting',
  ];

  const filteredPackages = selectedTier === 'all' 
    ? packages 
    : packages.filter(p => p.tier === selectedTier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-jobs" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Factory</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/ai-jobs" className="text-slate-300 hover:text-white transition-colors">
              Jobs Map
            </Link>
            <Link href="/ai-jobs/browse" className="text-slate-300 hover:text-white transition-colors">
              Browse
            </Link>
            <button 
              onClick={() => setShowIntake(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Get Your Automation
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          AI-Powered Automation Marketplace
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Get <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">1 Hour Back</span>
          <br />Every Day
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          Pre-built AI automation engines for 800+ occupations. 
          Save time, reduce errors, and focus on what matters.
        </p>

        {/* Quick ROI Calculator */}
        <div className="max-w-xl mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-white mb-6">Quick ROI Estimate</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Your Hourly Rate</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tasks to Automate</label>
              <select 
                onChange={(e) => setFormData({ ...formData, painPoints: [e.target.value] })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
              >
                <option value="1">1 workflow</option>
                <option value="2">2-3 workflows</option>
                <option value="3">4+ workflows</option>
              </select>
            </div>
          </div>
          <button
            onClick={calculateROI}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Calculate My Savings
          </button>
          
          {roiResult && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-emerald-400">{roiResult.hoursSaved.toFixed(0)}</div>
                  <div className="text-sm text-slate-400">Hours saved/year</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400">${roiResult.moneySaved.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">Value recovered/year</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">{roiResult.paybackDays}</div>
                  <div className="text-sm text-slate-400">Days to payback</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">{roiResult.yearlyROI}%</div>
                  <div className="text-sm text-slate-400">Year 1 ROI</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Job Coverage Lookup */}
        <div className="max-w-xl mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mt-8">
          <h3 className="text-xl font-semibold text-white mb-2">Check Your Job Coverage</h3>
          <p className="text-slate-400 text-sm mb-6">See what percentage of your job can be automated</p>
          
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={coverageSearch}
              onChange={(e) => setCoverageSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCoverage()}
              placeholder="Enter your job title (e.g., 'Accountant', 'Project Manager')"
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500"
            />
            <button
              onClick={searchCoverage}
              disabled={isSearchingCoverage}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSearchingCoverage ? 'Searching...' : 'Check'}
            </button>
          </div>

          {coverageResult && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                <div className="text-sm text-emerald-400 mb-1">{coverageResult.occupation.title}</div>
                <div className="text-6xl font-bold text-white mb-2">
                  {coverageResult.coverage.percent.toFixed(0)}%
                </div>
                <div className="text-slate-400">of your job can be automated</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-400">{coverageResult.coverage.estimatedDailyHoursSaved.toFixed(1)}h</div>
                  <div className="text-xs text-slate-400">saved/day</div>
                </div>
                <div className="text-center p-4 bg-slate-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">{coverageResult.coverage.estimatedWeeklyHoursSaved}h</div>
                  <div className="text-xs text-slate-400">saved/week</div>
                </div>
                <div className="text-center p-4 bg-slate-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">${coverageResult.coverage.estimatedYearlyValue.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">value/year</div>
                </div>
              </div>

              {coverageResult.recommendedPackages && coverageResult.recommendedPackages.length > 0 && coverageResult.recommendedPackages[0] && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="text-emerald-400 font-medium mb-2">Recommended Package:</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{coverageResult.recommendedPackages[0].package_name || coverageResult.recommendedPackages[0].name || 'Package'}</div>
                      <div className="text-slate-400 text-sm">
                        ${(coverageResult.recommendedPackages[0].base_price || 0).toLocaleString()} + ${(coverageResult.recommendedPackages[0].monthly_price || 0).toLocaleString()}/mo
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600">
                      Get Quote
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tier Filter */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          {['all', 'starter', 'growth', 'enterprise'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTier === tier
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tier === 'all' ? 'All Packages' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Packages Grid */}
      <section className="px-4 pb-16 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all group"
              >
                <div className={`h-2 bg-gradient-to-r ${tierColors[pkg.tier]}`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierBadges[pkg.tier]}`}>
                      {pkg.tier.toUpperCase()}
                    </span>
                    {pkg.includes_self_healing && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Self-Healing
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {pkg.package_name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">{pkg.package_description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">${pkg.base_price.toLocaleString()}</span>
                    <span className="text-slate-500">+ ${pkg.monthly_price}/mo</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {pkg.includes_integrations} integration{pkg.includes_integrations > 1 ? 's' : ''} included
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {pkg.setup_hours} hours setup time
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {pkg.roi_multiplier}x average ROI
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
                      Get Quote
                    </button>
                    <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-all">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How the Factory Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Identify', desc: 'Map your tasks to our automation library', icon: '🔍' },
              { step: '02', title: 'Configure', desc: 'AI generates a custom PRD & estimate', icon: '⚙️' },
              { step: '03', title: 'Build', desc: 'Pre-built engines + custom integrations', icon: '🏗️' },
              { step: '04', title: 'Launch', desc: 'Deploy with self-healing warranty', icon: '🚀' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-emerald-400 font-mono text-sm mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Automate Your Work?
        </h2>
        <p className="text-slate-400 mb-8">
          Fill out our quick intake form and get a custom automation proposal in 24 hours.
        </p>
        <button
          onClick={() => setShowIntake(true)}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
        >
          Start Your Free Assessment
        </button>
      </section>

      {/* Intake Modal */}
      {showIntake && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Get Your Automation Quote</h2>
                <button onClick={() => setShowIntake(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    placeholder="Acme Inc"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Your Role</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    placeholder="Operations Manager"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">What tasks waste your time?</label>
                <div className="grid grid-cols-2 gap-2">
                  {painPointOptions.map((point) => (
                    <label
                      key={point}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.painPoints.includes(point)
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.painPoints.includes(point)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, painPoints: [...formData.painPoints, point] });
                          } else {
                            setFormData({ ...formData, painPoints: formData.painPoints.filter(p => p !== point) });
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-sm">{point}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Tools (optional)</label>
                <input
                  type="text"
                  value={formData.currentTools}
                  onChange={(e) => setFormData({ ...formData, currentTools: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                  placeholder="Salesforce, Slack, Google Sheets..."
                />
              </div>

              {/* ROI Preview */}
              {formData.painPoints.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <h4 className="text-emerald-400 font-medium mb-2">Your Estimated Savings</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">~1.5h</div>
                      <div className="text-xs text-slate-400">saved/day</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">${formData.painPoints.length * 2500}</div>
                      <div className="text-xs text-slate-400">est. setup</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">~60</div>
                      <div className="text-xs text-slate-400">days payback</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Get Custom Quote
                </button>
                <button 
                  onClick={() => setShowIntake(false)}
                  className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-12">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>AI Jobs Factory - Part of Place to Stand / Code for Community</p>
          <p className="mt-2 text-sm">Built with Next.js, Supabase & Vercel</p>
        </div>
      </footer>
    </div>
  );
}
