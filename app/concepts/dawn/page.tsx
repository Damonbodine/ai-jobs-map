'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Search, Clock, Heart } from 'lucide-react';

export default function DawnConcept() {
  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#1e293b] selection:bg-amber-100">
      {/* Soft Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-100/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-50/50 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 px-6 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-serif text-2xl italic">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-200">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          Horizon
        </div>
        <div className="flex gap-8 items-center text-sm font-medium text-slate-500">
          <Link href="#" className="hover:text-amber-600 transition-colors">Our Philosophy</Link>
          <Link href="#" className="hover:text-amber-600 transition-colors">Browse Paths</Link>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            Start Your Audit
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto pt-24 pb-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest mb-8 border border-amber-100/50 shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            Reclaim Your Afternoons
          </div>

          <h1 
            className="text-[clamp(3rem,8vw,5.5rem)] font-serif italic leading-[1.05] tracking-[-0.03em] text-slate-900 mb-10"
            style={{ textWrap: 'balance' } as any}
          >
            The future of work is <span className="text-amber-500">actually seeing your kids</span> before bedtime.
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            We use advanced AI mapping to identify the micro-routines stealing your time. 
            One hour back, every single day. That's the promise.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div className="bg-white rounded-[2.5rem] p-3 shadow-[0_20px_60px_-15px_rgba(30,41,59,0.12)] border border-slate-100 flex items-center">
              <div className="bg-amber-50 p-4 rounded-full mr-4">
                <Search className="w-6 h-6 text-amber-500" />
              </div>
              <input 
                type="text" 
                placeholder="What do you do for a living?"
                className="flex-1 bg-transparent text-lg focus:outline-none placeholder:text-slate-300 font-medium"
              />
              <button className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:scale-[1.02] transition-transform">
                Find Time
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: '800+ Roles', icon: <Heart className="w-5 h-5" />, color: 'bg-rose-50 text-rose-500' },
            { title: '1 Hour Saved', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500' },
            { title: 'Ready to Scale', icon: <Sparkles className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-500' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${item.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                Mathematically proven automation paths for sustainable careers and fuller lives.
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
