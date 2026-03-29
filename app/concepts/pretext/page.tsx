'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Heart, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import { PretextRenderer } from './components/PretextRenderer';

export default function PretextConcept() {
  const [orbPos, setOrbPos] = useState({ x: 400, y: 300 });

  // Obstacle-aware width calculation
  const getWidthAtY = useCallback((y: number) => {
    const orbRadius = 120;
    const orbY = orbPos.y;
    const orbCenterX = orbPos.x;
    const padding = 40;
    
    // Total container width
    const containerWidth = 800;

    // Check if y is within the orb's vertical range
    const dy = Math.abs(y - orbY);
    if (dy < orbRadius) {
      // Calculate horizontal chord length at this y
      const dx = Math.sqrt(orbRadius ** 2 - dy ** 2);
      // We'll just subtract the orb's width from the container for now
      // A more complex layout would allow text on both sides, 
      // but Pretext's layoutNextLine normally assumes a single block.
      return containerWidth - (dx * 1.5) - padding;
    }

    return containerWidth;
  }, [orbPos]);

  const storyText = `In the early hours of a Tuesday morning, the silence of the accounting firm at 12th and Main isn't a sign of emptiness, but of deep, synthesized efficiency. The rhythmic tapping of keys has been replaced by the quiet hum of the Horizon Engine. 

Automation is no longer a threat; it is an architecture for human recovery. For the modern Accountant, the 'close' is no longer a weekend-stealing marathon. It is a background process, verified by AI but intended for the soul. 

When we talk about 60 minutes reclaimed, we aren't talking about productivity. We are talking about the sixty minutes you spend reading a story to your daughter without checking your phone. We are talking about the quiet morning where you actually taste your coffee. 

The future is balanced. The future is intentional. The future is yours to reclaim. Built on the bedrock of precision, we are creating a sanctuary for the human element in an automated world.`;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1C1B] selection:bg-[#F87171]/20 font-serif overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 mix-blend-multiply">
        <Link href="/ai-jobs" className="flex items-center gap-2 group text-sm font-sans uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Map
        </Link>
        <div className="text-xs font-sans font-black uppercase tracking-[0.3em] text-[#F87171]">
          Pretext powered • v1.0
        </div>
      </nav>

      {/* Main Narrative */}
      <main className="max-w-5xl mx-auto pt-40 pb-60 px-12 relative leading-relaxed">
        
        {/* Background ASCII Art (Variable Width Simulation) */}
        <div className="absolute top-20 right-0 opacity-[0.03] select-none pointer-events-none font-sans text-[10px] whitespace-pre leading-tight">
          {`
          ..................................................
          ..................................................
          ..........RECOVERY INDEX PROTOCOL V4.2............
          ..................................................
          ..................................................
          .................###........###...................
          ................#####......#####..................
          ...............#######....#######.................
          ..............#########..#########................
          .............######################...............
          ............########################..............
          ...........##########################.............
          ..........############################............
          .........##############################...........
          ........################################..........
          .......##################################.........
          `}
        </div>

        {/* Hero Title */}
        <div className="relative mb-32">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12rem] md:text-[16rem] font-black tracking-[-0.06em] leading-none text-[#1A1C1B]/10 absolute -top-20 -left-10 z-0 select-none"
          >
            Accountants
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 pt-20"
          >
            <div className="inline-flex items-center gap-2 mb-6 text-[#F87171] font-sans font-black uppercase tracking-widest text-xs">
              <Shield className="w-4 h-4" />
              Human-Centric Safeguard
            </div>
            <h2 className="text-7xl font-black tracking-tight mb-8 max-w-2xl leading-[1.1]">
              The Sanctuary of the <span className="text-[#F87171]">Reclaimed</span> Hour.
            </h2>
          </motion.div>
        </div>

        {/* Interactive Data Obstacle */}
        <motion.div 
          drag
          dragConstraints={{ left: 0, right: 600, top: 0, bottom: 800 }}
          onDrag={(e, info) => {
            setOrbPos({ 
              x: info.point.x - 300, // Adjust for center
              y: info.point.y - 400 
            });
          }}
          className="fixed z-40 cursor-grab active:cursor-grabbing"
          style={{ left: orbPos.x, top: orbPos.y }}
        >
          <div className="w-56 h-56 rounded-full bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-[#F87171]/10 flex flex-col items-center justify-center text-center p-8 backdrop-blur-xl bg-white/80">
            <Clock className="w-8 h-8 text-[#F87171] mb-2 animate-pulse" />
            <span className="text-4xl font-black tracking-tighter leading-none">60m</span>
            <span className="text-[10px] font-sans font-black uppercase tracking-widest mt-2 text-[#4B5563]">Daily Recovery</span>
            <div className="mt-4 w-12 h-0.5 bg-[#F87171]/20 rounded-full" />
          </div>
        </motion.div>

        {/* Narrative Flow (Pretext) */}
        <div className="relative z-30 max-w-3xl">
          <PretextRenderer 
            text={storyText}
            fontFamily="var(--font-heading)"
            fontSize={24}
            lineHeight={42}
            widthAtY={getWidthAtY}
            color="#4B5563"
            className="text-justify italic opacity-90"
          />
        </div>

        {/* CTA Section */}
        <div className="mt-40 flex flex-col items-center text-center border-t border-[#1A1C1B]/5 pt-32">
          <div className="text-sm font-sans font-bold uppercase tracking-[0.4em] mb-12 opacity-40">
            End of Manuscript v1.0
          </div>
          <button className="bg-[#1A1C1B] text-[#F9F8F6] px-12 py-6 rounded-full font-sans font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
            Explore the Pipeline
          </button>
        </div>

      </main>

      {/* Mouse Follow Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F87171]/5 blur-[120px] rounded-full" />
      </div>

    </div>
  );
}
