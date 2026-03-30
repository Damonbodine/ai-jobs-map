'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Sparkles } from 'lucide-react';

interface ZeroBaseClientProps {
  occupation: any;
  exposure: number;
  minutesReclaimed: number;
  tasks: any[];
  opportunities: any[];
}

export default function ZeroBaseClient({ occupation, exposure, minutesReclaimed, tasks, opportunities }: ZeroBaseClientProps) {
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  return (
    <div className="bg-[#FFFFFF] min-h-screen text-[#1A1C1E] font-['Manrope'] selection:bg-blue-100 overflow-x-hidden italic font-['Newsreader']">
      
      {/* 1. Header Marker */}
      <nav className="fixed top-12 left-12 z-50 flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] opacity-20">
        Executive Synthesis v1.0
      </nav>

      {/* 2. Fixed Background Layer (Ghost Title) */}
      <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden uppercase">
        <h1 className="text-[15rem] md:text-[25rem] font-['Newsreader'] font-black italic text-slate-900/5 whitespace-nowrap select-none">
          {occupation.title}
        </h1>
      </div>

      {/* 3. Main Narrative Flow */}
      <main className="relative z-10 h-screen w-screen flex flex-col items-center justify-center text-center px-8 space-y-24">
        
        {/* Step A: The Judgment */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <h1 className="text-[clamp(3.5rem,8vw,7rem)] font-['Newsreader'] font-black italic tracking-tighter leading-[0.9] text-slate-900 mb-8">
            {occupation.title}s are now high-capacity <span className="text-blue-600">strategists.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto italic font-['Newsreader'] leading-relaxed opacity-60">
            The shift from verification to clinical judgment.
          </p>
        </motion.div>

        {/* Step B: The Core Metric */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full scale-150 group-hover:bg-blue-600/10 transition-colors"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-[12rem] md:text-[18rem] font-['Newsreader'] font-black italic tracking-tighter text-slate-900 leading-none">
              {exposure}%
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 mt-2">Synthetic Displacement</div>
          </div>
        </motion.div>

        {/* Step C: The Human ROI */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl flex flex-col items-center gap-12"
        >
           <p className="text-4xl font-['Newsreader'] font-black italic tracking-tighter text-slate-900">
             "We found your missing hour."
           </p>
           
           <button 
             onClick={() => setIsAuditOpen(true)}
             className="bg-slate-950 text-white px-20 py-8 rounded-full font-black uppercase tracking-widest text-[11px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] hover:bg-blue-700 transition-all active:scale-95 group flex items-center gap-4"
           >
             Audit the Task Map ({tasks.length})
             <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </button>
           
           <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20 italic">
             {minutesReclaimed}m Bedtime Minutes Reclaimed
           </div>
        </motion.div>
      </main>

      {/* 4. The Audit Drawer (The Manuscript) */}
      <AnimatePresence>
        {isAuditOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-[110] p-12 flex justify-between items-center border-b border-slate-50">
               <div>
                  <h3 className="text-3xl font-['Newsreader'] font-black italic tracking-tighter text-slate-900">The {occupation.title} Manuscript</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-2">A comprehensive audit of 67 professional actions</p>
               </div>
               <button 
                onClick={() => setIsAuditOpen(false)}
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all active:scale-90"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Manuscript Content */}
            <div className="max-w-7xl mx-auto w-full p-24">
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
                  {tasks.map((task, i) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group p-8 border-b border-slate-100 hover:bg-slate-50/50 transition-all rounded-3xl"
                    >
                       <div className="flex justify-between items-center mb-6">
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{task.taskType || 'Core Task'}</span>
                           <span className="text-[10px] font-black italic text-blue-600">{task.aiAutomationScore}% Potential</span>
                       </div>
                       <h4 className="text-2xl font-['Newsreader'] font-black italic text-slate-800 tracking-tight leading-none mb-6">{task.taskTitle}</h4>
                       <p className="text-sm italic font-['Newsreader'] text-slate-500 leading-relaxed mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                         {task.taskDescription}
                       </p>
                       <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest leading-none">AI Displacement Detected</span>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Drawer Footer (ROI Summary) */}
            <div className="p-24 bg-slate-950 text-white text-center">
               <h3 className="text-5xl font-['Newsreader'] font-black italic mb-12">"Shift the effort, save the hour."</h3>
               <button className="bg-blue-600 text-white px-20 py-8 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-blue-700 transition-all">
                  Initialize Recovery Flow
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
