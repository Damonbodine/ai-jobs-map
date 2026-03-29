'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { 
  Clock, 
  CircleDollarSign, 
  CheckCircle2, 
  Bot, 
  AlertTriangle,
  Activity,
  Zap,
  ShieldCheck
} from 'lucide-react';

export default function ROIDashboard() {
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
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon?: React.ReactNode;
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDuration: '9s' }} />

      <main className="px-4 py-12 md:py-16 max-w-7xl mx-auto relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Welcome Banner */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/60 backdrop-blur-md overflow-hidden border-emerald-500/20 shadow-xl shadow-cyan-900/10">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                      Welcome back, {demoData.userName}!
                    </h1>
                    <div className="flex items-center gap-3 text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 shadow-inner">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        {demoData.plan}
                      </span>
                      <span>Active for {demoData.daysActive} days</span>
                    </div>
                  </div>
                  
                  <div className="text-left md:text-right bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-sm font-medium text-slate-400 mb-1">Payback Progress</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      32%
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium tracking-wide">
                      of $7,497 investment
                    </div>
                  </div>
                </div>

                <div className="mt-8 relative h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '32%' }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  />
                </div>
                <p className="text-sm font-medium text-slate-400 mt-4 flex items-center justify-center md:justify-start gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  At current pace, you'll reach 100% ROI in ~60 days
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Metrics */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-5">
             <StatCard 
               title="Hours Saved (Week)"
               value={`${demoData.metrics.hoursSavedThisWeek}h`}
               icon={<Clock className="w-5 h-5 text-emerald-400" />}
               description="+15% vs last week"
             />
             <StatCard 
               title="Value Recovered"
               value={`$${demoData.metrics.moneySavedTotal.toLocaleString()}`}
               icon={<CircleDollarSign className="w-5 h-5 text-cyan-400" />}
               description="3.2x your investment"
             />
             <StatCard 
               title="Success Rate"
               value={`${demoData.metrics.successRate}%`}
               icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
               description="Across all automations"
             />
             <StatCard 
               title="Errors Recovered"
               value={demoData.metrics.errorsResolved}
               icon={<Bot className="w-5 h-5 text-purple-400" />}
               description={`${demoData.metrics.avgRecoveryTime}s avg recovery`}
             />
          </motion.div>

          {/* Charts Section */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-200">Weekly Hours Saved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-56 mt-4">
                  {demoData.weeklyData.map((week, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <div className="w-full flex justify-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">
                        <span className="bg-slate-800 text-white text-xs py-1 px-3 rounded shadow-lg font-bold border border-slate-700">
                          {week.hours}h
                        </span>
                      </div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(week.hours / maxHours) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="w-full bg-gradient-to-t from-emerald-600/80 to-emerald-400 rounded-t-lg shadow-[0_0_10px_rgba(52,211,153,0.1)] group-hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] group-hover:from-emerald-500 group-hover:to-cyan-400 transition-all cursor-pointer"
                      />
                      <div className="text-xs font-medium text-slate-500 mt-3">{week.week}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-200">Weekly Value Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-56 mt-4">
                  {demoData.weeklyData.map((week, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <div className="w-full flex justify-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">
                        <span className="bg-slate-800 text-white text-xs py-1 px-3 rounded shadow-lg font-bold border border-slate-700">
                          ${week.money}
                        </span>
                      </div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(week.money / 700) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="w-full bg-gradient-to-t from-cyan-600/80 to-cyan-400 rounded-t-lg shadow-[0_0_10px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:from-cyan-500 group-hover:to-cyan-300 transition-all cursor-pointer"
                      />
                      <div className="text-xs font-medium text-slate-500 mt-3">{week.week}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Automations and Bot Status */}
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="h-full bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-200">Active Workflows</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {demoData.topAutomations.map((auto, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border ${
                        auto.status === 'needs_attention' 
                          ? 'bg-orange-500/5 border-orange-500/20' 
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <div className="relative flex h-3 w-3">
                           {auto.status === 'active' && (
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                           )}
                           <span className={`relative inline-flex rounded-full h-3 w-3 ${auto.status === 'active' ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                        </div>
                        <div>
                          <div className="text-slate-200 font-semibold">{auto.name}</div>
                          <div className="text-slate-500 text-sm font-medium">{auto.runs} runs this month</div>
                        </div>
                      </div>
                      
                      <div className="sm:text-right flex items-center sm:items-end justify-between sm:flex-col sm:justify-center">
                        <div className="text-cyan-400 font-bold tracking-tight">{auto.timeSaved}h saved</div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 ${auto.status === 'needs_attention' ? 'text-orange-400' : 'text-emerald-500/70'}`}>
                          {auto.status === 'needs_attention' ? (
                            <><AlertTriangle className="w-3.5 h-3.5" /> Needs attention</>
                          ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Running smoothly</>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Self-Healing Status */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-slate-900/50 border-cyan-500/20 shadow-lg shadow-cyan-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                      <div className="text-4xl font-black text-white mb-1">
                        {demoData.metrics.errorsResolved}
                      </div>
                      <div className="text-slate-400 text-sm font-medium">Auto-Recoveries</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                        <div className="text-2xl font-bold text-white mb-1">{demoData.metrics.avgRecoveryTime}s</div>
                        <div className="text-slate-500 text-xs font-medium">Avg Restart</div>
                      </div>
                      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                        <div className="text-2xl font-bold text-slate-300 mb-1">2</div>
                        <div className="text-slate-500 text-xs font-medium">Escalations</div>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-sm font-medium leading-relaxed bg-slate-800/30 p-4 rounded-xl">
                      The resilient auto-healing worker monitors automations 24/7. 
                      Only critical unrecoverable states reach standard human escalation workflow.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
