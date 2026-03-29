'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Zap, CheckCircle2, X, Search, Activity, Cpu, Wand2 } from 'lucide-react';

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
  starter: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  growth: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  enterprise: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  // Fetch autocomplete suggestions
  async function fetchSuggestions(query: string) {
    if (query.length < 1) {
      const res = await fetch('/api/ai-jobs/autocomplete?limit=8');
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
      return;
    }
    
    try {
      const res = await fetch(`/api/ai-jobs/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    }
  }

  // Handle input change with debounce
  function handleCoverageInputChange(value: string) {
    setCoverageSearch(value);
    setHighlightedIndex(-1);
    
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }

  // Select an occupation from suggestions
  async function selectOccupation(occ: any) {
    setCoverageSearch(occ.title);
    setShowSuggestions(false);
    setCoverageResult(null);
    setIsSearchingCoverage(true);
    
    try {
      const recRes = await fetch(`/api/factory/recommend?occupation=${occ.slug}`);
      const recData = await recRes.json();
      
      setCoverageResult({
        occupation: { title: occ.title, category: occ.major_category },
        coverage: recData.coverage || { percent: 0, estimatedDailyHoursSaved: 0, estimatedWeeklyHoursSaved: 0, estimatedYearlyValue: 0 },
        recommendedPackages: recData.recommendedPackages || [],
      });
    } catch (error) {
      console.error('Coverage fetch error:', error);
    } finally {
      setIsSearchingCoverage(false);
    }
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectOccupation(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.5 } }
  };

  return (
    <div className="app-shell bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '8s' }} />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="page-container relative z-10 flex flex-col items-center py-12 md:py-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-8 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
          <Zap className="w-4 h-4" />
          <span className="font-medium tracking-wide">Automation designed to give teams an hour back</span>
        </div>
        
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl mb-6">
          Get <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">1 Hour Back</span>
          <br />Every Day
        </h1>
        <p className="mb-12 max-w-2xl text-base font-medium text-slate-400 sm:text-lg md:text-xl">
          Turn repetitive work into reliable automation packages built around the routines that quietly consume each day.
        </p>

        <div className="grid w-full max-w-5xl gap-6 text-left lg:grid-cols-2">
          {/* Quick ROI Estimator */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-emerald-400" />
                Quick ROI Estimate
              </h3>
              <div className="grid grid-cols-2 gap-5 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Your Hourly Rate</label>
                  <Input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Tasks to Automate</label>
                  <Select 
                    onChange={(e) => setFormData({ ...formData, painPoints: [e.target.value] })}
                    className="font-bold text-lg"
                  >
                    <option value="1" className="bg-slate-900">1 workflow</option>
                    <option value="2" className="bg-slate-900">2-3 workflows</option>
                    <option value="3" className="bg-slate-900">4+ workflows</option>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateROI} className="w-full text-lg shadow-emerald-500/20 shadow-lg">
                Calculate My Savings
              </Button>
              
              <AnimatePresence>
                {roiResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-slate-800/80 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/10">
                        <div className="text-3xl font-black text-emerald-400">{roiResult.hoursSaved.toFixed(0)}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Hours/year</div>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-cyan-500/10">
                        <div className="text-3xl font-black text-cyan-400">${roiResult.moneySaved.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Value/year</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Job Coverage Finder */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Search className="w-6 h-6 text-cyan-400" />
                Coverage Finder
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-6">See what percentage of your role can be automated</p>
              
              <div className="relative mb-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      value={coverageSearch}
                      onChange={(e) => handleCoverageInputChange(e.target.value)}
                      onFocus={() => { fetchSuggestions(coverageSearch); setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. Sales Manager..."
                      autoComplete="off"
                      className="font-medium text-lg"
                    />
                    
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="custom-scrollbar absolute top-full left-0 right-0 z-50 mt-3 max-h-80 overflow-y-auto overflow-x-hidden divide-y divide-slate-800/80 rounded-xl border border-slate-700/50 bg-slate-900/95 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                        >
                          {suggestions.map((occ, index) => (
                            <button
                              key={occ.id}
                              onClick={() => selectOccupation(occ)}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              className={`w-full px-5 py-4 text-left flex items-center justify-between transition-colors ${
                                index === highlightedIndex ? 'bg-cyan-500/10' : 'hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="pr-4">
                                <div className="text-slate-200 font-semibold mb-1">{occ.title}</div>
                                <div className="text-xs font-medium text-slate-500 tracking-wide uppercase">{occ.major_category}</div>
                              </div>
                              {occ.coverage_percent && (
                                <div className="text-right whitespace-nowrap bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                  <div className="text-emerald-400 font-bold">{parseFloat(occ.coverage_percent).toFixed(0)}%</div>
                                </div>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Button
                    onClick={() => suggestions.length > 0 && selectOccupation(suggestions[0])}
                    disabled={isSearchingCoverage || suggestions.length === 0}
                    className="w-24 shadow-cyan-500/20 shadow-lg"
                  >
                    {isSearchingCoverage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Check'}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {coverageResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between p-5 bg-slate-950/50 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-sm font-semibold text-slate-400 mb-1 leading-snug max-w-[200px] truncate">{coverageResult.occupation.title}</div>
                        <div className="text-slate-500 text-xs font-medium">Automatable tasks</div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          {coverageResult.coverage.percent.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Tier Filter */}
      <section className="page-container relative z-10 py-10">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {['all', 'starter', 'growth', 'enterprise'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-6 py-2.5 rounded-full font-bold transition-all text-sm tracking-wide ${
                selectedTier === tier
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {tier === 'all' ? 'All Packages' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-900/50 h-96 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredPackages.map((pkg) => (
              <motion.div variants={itemVariants} key={pkg.id}>
                <Card className="group flex h-full min-h-[29rem] cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border-slate-800 bg-slate-900/60 shadow-xl shadow-cyan-900/5 transition-colors hover:border-emerald-500/50">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${tierColors[pkg.tier]}`} />
                  <CardContent className="p-8 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${tierBadges[pkg.tier]}`}>
                        {pkg.tier}
                      </span>
                      {pkg.includes_self_healing && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                          <Cpu className="w-3.5 h-3.5" />
                          Self-Healing
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-200 mb-3 group-hover:text-cyan-400 transition-colors leading-tight">
                      {pkg.package_name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-6 font-medium leading-relaxed">
                      {pkg.package_description}
                    </p>
                    
                    <div className="mb-8 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl font-black text-white">${pkg.base_price.toLocaleString()}</span>
                        <span className="font-medium text-slate-500">+ ${pkg.monthly_price}/mo</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        {pkg.includes_integrations} included integration{pkg.includes_integrations > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        {pkg.setup_hours} hours standard setup
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        Target {pkg.roi_multiplier}x average ROI
                      </div>
                    </div>

                    <div className="flex gap-3 mt-auto pt-4">
                      <Button onClick={() => setShowIntake(true)} className="flex-1 shadow-emerald-500/20 shadow-lg">
                        Get Quote
                      </Button>
                      <Button variant="outline" className="px-6 border-slate-700 text-slate-300 hover:text-white">
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* How It Works */}
      <section className="relative z-10 mt-12 border-y border-slate-800/50 bg-slate-900/30 py-24">
        <div className="page-container">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-16 tracking-tight">How the Factory Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Identify', desc: 'Map your manual tasks directly to our workflow library', icon: <Search className="w-8 h-8 text-cyan-400" /> },
              { step: '02', title: 'Configure', desc: 'AI agent drafts a tailored PRD and integration blueprint', icon: <Wand2 className="w-8 h-8 text-purple-400" /> },
              { step: '03', title: 'Deploy', desc: 'Pre-built engines hooked instantly into your software', icon: <Cpu className="w-8 h-8 text-emerald-400" /> },
              { step: '04', title: 'Scale', desc: 'Self-healing workers handle exceptions 24/7 automatically', icon: <Zap className="w-8 h-8 text-orange-400" /> },
            ].map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={item.step} 
                className="text-center group"
              >
                <div className="w-20 h-20 mx-auto bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:-translate-y-2 transition-transform shadow-slate-900/20">
                  {item.icon}
                </div>
                <div className="text-slate-500 font-black text-sm tracking-widest uppercase mb-3">Phase {item.step}</div>
                <h3 className="text-xl font-bold text-slate-200 mb-3 group-hover:text-white transition-colors">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Intake Modal */}
      <AnimatePresence>
        {showIntake && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowIntake(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh]"
            >
              <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between shrink-0">
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    Automation Proposal Request
                  </h2>
                  <button onClick={() => setShowIntake(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <CardContent className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Work Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Company Name</label>
                      <Input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Your Role</label>
                      <Input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="Operations Director"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-4">Select Bottlenecks / Time Waster Categories</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {painPointOptions.map((point) => (
                        <label
                          key={point}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.painPoints.includes(point)
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            formData.painPoints.includes(point) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 bg-slate-950'
                          }`}>
                            {formData.painPoints.includes(point) && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-sm font-medium ${formData.painPoints.includes(point) ? 'text-emerald-300' : 'text-slate-300'}`}>{point}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Current Critical Tools (Optional)</label>
                    <Input
                      type="text"
                      value={formData.currentTools}
                      onChange={(e) => setFormData({ ...formData, currentTools: e.target.value })}
                      placeholder="Salesforce, Notion, Stripe, Zendesk..."
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex gap-4">
                    <Button className="flex-1 font-bold text-lg shadow-emerald-500/20 shadow-lg py-6" onClick={() => setShowIntake(false)}>
                      Submit Configuration
                    </Button>
                    <Button variant="outline" className="px-6 border-slate-700 text-slate-300" onClick={() => setShowIntake(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-12 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p className="font-semibold tracking-wide">AI Jobs Factory - Marketplace Division</p>
          <p className="mt-2 text-sm">Empowering automated workflows built on Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
