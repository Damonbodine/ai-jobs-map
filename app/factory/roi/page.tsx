import Link from 'next/link';

export default function ROIDashboard() {
  // This would be dynamic in production based on user data
  const demoData = {
    userName: "Demo User",
    plan: "Growth Engine",
    startDate: "2026-03-01",
    daysActive: 28,
    metrics: {
      hoursSavedThisWeek: 4.2,
      hoursSavedTotal: 32,
      moneySavedThisWeek: 315,
      moneySavedTotal: 2400,
      automationsRun: 156,
      successRate: 98.7,
      errorsResolved: 23,
      avgRecoveryTime: 4.2,
    },
    weeklyData: [
      { week: 'Week 1', hours: 2.1, money: 157, automations: 34 },
      { week: 'Week 2', hours: 4.7, money: 352, automations: 45 },
      { week: 'Week 3', hours: 8.9, money: 667, automations: 67 },
      { week: 'Week 4', hours: 4.2, money: 315, automations: 42 },
    ],
    topAutomations: [
      { name: 'Invoice Processing', runs: 89, timeSaved: 12.4, status: 'active' },
      { name: 'Email Follow-ups', runs: 67, timeSaved: 8.2, status: 'active' },
      { name: 'Report Generation', runs: 45, timeSaved: 6.8, status: 'active' },
      { name: 'Data Entry', runs: 34, timeSaved: 4.6, status: 'needs_attention' },
    ],
  };

  const maxHours = Math.max(...demoData.weeklyData.map(d => d.hours));
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/factory" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Factory</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/factory" className="text-slate-300 hover:text-white transition-colors">
              Packages
            </Link>
            <Link href="/factory/roi" className="text-emerald-400 font-medium">
              ROI Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-4 py-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Welcome back, {demoData.userName}!
              </h1>
              <p className="text-slate-400">
                {demoData.plan} • Active for {demoData.daysActive} days
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Payback Progress</div>
              <div className="text-3xl font-bold text-emerald-400">32%</div>
              <div className="text-xs text-slate-500">of $7,497 investment</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500"
              style={{ width: '32%' }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            At current pace, you'll have paid back your investment in ~60 more days
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">This Week</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-3xl font-bold text-white">{demoData.metrics.hoursSavedThisWeek}h</div>
            <div className="text-emerald-400 text-sm">hours saved</div>
            <div className="text-slate-500 text-xs mt-1">+15% vs last week</div>
          </div>
          
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Saved</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">${demoData.metrics.moneySavedTotal.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">value recovered</div>
            <div className="text-emerald-400 text-xs mt-1">3.2× your investment</div>
          </div>
          
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Success Rate</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-white">{demoData.metrics.successRate}%</div>
            <div className="text-slate-400 text-sm">automation success</div>
            <div className="text-emerald-400 text-xs mt-1">Self-healing working</div>
          </div>
          
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Errors Fixed</span>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="text-3xl font-bold text-white">{demoData.metrics.errorsResolved}</div>
            <div className="text-slate-400 text-sm">auto-recovered</div>
            <div className="text-slate-500 text-xs mt-1">{demoData.metrics.avgRecoveryTime}s avg recovery</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Hours Saved Chart */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Hours Saved Per Week</h2>
            <div className="flex items-end gap-3 h-48">
              {demoData.weeklyData.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 to-cyan-500 rounded-t-lg"
                    style={{ height: `${(week.hours / maxHours) * 100}%` }}
                  />
                  <div className="text-xs text-slate-500 mt-2">{week.week}</div>
                  <div className="text-sm text-white font-medium">{week.hours}h</div>
                </div>
              ))}
            </div>
          </div>

          {/* Money Saved Chart */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Value Recovered Per Week</h2>
            <div className="flex items-end gap-3 h-48">
              {demoData.weeklyData.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg"
                    style={{ height: `${(week.money / 700) * 100}%` }}
                  />
                  <div className="text-xs text-slate-500 mt-2">{week.week}</div>
                  <div className="text-sm text-white font-medium">${week.money}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Automations */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Your Active Automations</h2>
          <div className="space-y-3">
            {demoData.topAutomations.map((auto, i) => (
              <div 
                key={i}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  auto.status === 'needs_attention' 
                    ? 'bg-orange-500/10 border-orange-500/30' 
                    : 'bg-slate-700/50 border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${auto.status === 'active' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                  <div>
                    <div className="text-white font-medium">{auto.name}</div>
                    <div className="text-slate-500 text-sm">{auto.runs} runs this month</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-semibold">{auto.timeSaved}h saved</div>
                  <div className="text-slate-500 text-xs">
                    {auto.status === 'needs_attention' ? '⚠️ Needs attention' : '✓ Running smoothly'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Healing Status */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 border border-slate-600 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🤖</span>
            Self-Healing Bot Status
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">{demoData.metrics.errorsResolved}</div>
              <div className="text-slate-400 text-sm">Errors Auto-Recovered</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className="text-2xl font-bold text-white">{demoData.metrics.avgRecoveryTime}s</div>
              <div className="text-slate-400 text-sm">Avg Recovery Time</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className="text-2xl font-bold text-white">2</div>
              <div className="text-slate-400 text-sm">Escalated to Humans</div>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4 text-center">
            The self-healing bot monitors your automations 24/7 and automatically recovers from errors.
            Only critical issues that can't be resolved are escalated to our team.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>AI Jobs Factory - Track your automation ROI</p>
        </div>
      </footer>
    </div>
  );
}
