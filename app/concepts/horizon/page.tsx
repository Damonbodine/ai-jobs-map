'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cpu, ArrowRight, Search, Zap, Globe } from 'lucide-react';

export default function HorizonConcept() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-emerald-500/30 overflow-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[50%] bg-blue-600/10 blur-[130px] rounded-full" />
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150" />
      </div>

      <nav className="relative z-10 px-8 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            <Cpu className="w-5 h-5 text-[#020617]" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">Horizon</span>
        </div>
        <div className="hidden md:flex gap-10 items-center text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="#" className="hover:text-emerald-400 transition-colors">The Pipeline</Link>
          <Link href="#" className="hover:text-emerald-400 transition-colors">ROI Audit</Link>
          <button className="bg-white text-slate-900 px-8 py-3 rounded-md hover:bg-emerald-400 transition-all font-black">
            ENTER FACTORY
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto pt-32 pb-40 px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-emerald-500/20">
            <Zap className="w-3 h-3 animate-pulse" />
            Time-Synthesis Engine v4.0
          </div>

          <h1 
            className="text-[clamp(4rem,10vw,8rem)] font-black leading-[0.88] tracking-[-0.06em] text-white mb-12 uppercase"
            style={{ textWrap: 'balance' } as any}
          >
            The Future is <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600">Automated.</span> Your Life is Not.
          </h1>

          <div className="max-w-2xl mx-auto p-1 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-2xl backdrop-blur-xl">
            <div className="bg-slate-950/80 rounded-xl p-6 border border-white/5 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 flex items-center gap-4 w-full">
                <Search className="w-6 h-6 text-emerald-500" />
                <input 
                  type="text" 
                  placeholder="Detect your carrier's inefficiency..."
                  className="bg-transparent text-xl font-medium focus:outline-none w-full placeholder:text-slate-600"
                />
              </div>
              <button className="w-full md:w-auto bg-emerald-500 text-slate-900 px-10 py-5 rounded-lg font-black uppercase tracking-tighter hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all">
                INITIATE AUDIT
              </button>
            </div>
          </div>
        </motion.div>

        {/* Floating Metrics Header */}
        <div className="mt-40 w-full grid md:grid-cols-4 gap-px bg-white/5 border-y border-white/5">
          {[
            { label: 'Latency Reduced', val: '-92%' },
            { label: 'Human Hours Freed', val: '+14k' },
            { label: 'Deployment Velocity', val: '200x' },
            { label: 'Safety Index', val: '99.9' }
          ].map((m, i) => (
            <div key={i} className="p-10 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{m.label}</span>
              <span className="text-4xl font-black text-emerald-400 tracking-tighter">{m.val}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
