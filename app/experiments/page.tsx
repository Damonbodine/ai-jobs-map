'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Layers, Grid3X3, AlignLeft, BookOpen, SplitSquareHorizontal, GitBranch, LayoutGrid, Columns, FileText } from 'lucide-react';

const sampleData = {
  title: 'Software Engineer',
  subtitle: 'Where the day goes and where to start',
  category: 'Computer & Tech',
  minutesRecovered: 47,
  progress: 78,
  narrative: 'This role has meaningful automation pockets, but the biggest win is bundling several routine tasks together. A typical software engineer day revolves around code review, debugging, and documentation. The best automation story is not replacing the job, but bundling the repetitive pieces so the human can stay with judgment, exceptions, and final decisions.',
  workBlocks: [
    { label: 'Code Review', minutes: 15, color: 'emerald' },
    { label: 'Documentation', minutes: 12, color: 'violet' },
    { label: 'Debugging', minutes: 10, color: 'amber' },
    { label: 'Meetings', minutes: 8, color: 'cyan' },
  ],
  tasks: [
    { name: 'Review pull requests', minutes: 8, category: 'Analysis', impact: 'high' },
    { name: 'Write unit tests', minutes: 7, category: 'Documentation', impact: 'high' },
    { name: 'Update technical docs', minutes: 6, category: 'Documentation', impact: 'medium' },
    { name: 'Debug production issues', minutes: 5, category: 'Analysis', impact: 'medium' },
  ],
  skillCount: 12,
  humanEdgeCount: 5,
};

const variants = [
  {
    id: 'stacked-cards',
    name: 'Stacked Cards',
    icon: Layers,
    description: 'Vertically stacked card sections with clear visual separation',
  },
  {
    id: 'grid-equal',
    name: 'Equal Grid',
    icon: Grid3X3,
    description: 'All content in evenly-sized grid cells',
  },
  {
    id: 'narrow-column',
    name: 'Narrow Column',
    icon: AlignLeft,
    description: 'Classic reading width, centered content',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    icon: BookOpen,
    description: 'Magazine-style with drop caps and wide margins',
  },
  {
    id: 'split-screen',
    name: 'Split Screen',
    icon: SplitSquareHorizontal,
    description: 'Left/right split with sticky sidebar',
  },
  {
    id: 'timeline',
    name: 'Timeline Flow',
    icon: GitBranch,
    description: 'Vertical flow with connected nodes',
  },
  {
    id: 'modular',
    name: 'Modular Blocks',
    icon: LayoutGrid,
    description: 'Asymmetric grid with varied block sizes',
  },
  {
    id: 'magazine',
    name: 'Magazine',
    icon: FileText,
    description: 'Full-width hero with text wrapping around elements',
  },
  {
    id: 'dense-data',
    name: 'Dense Data',
    icon: Columns,
    description: 'Compact, information-dense layout',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: AlignLeft,
    description: 'Stark, minimal with maximum whitespace',
  },
];

function StackedCardsLayout() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-white">{sampleData.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">{sampleData.narrative}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {sampleData.workBlocks.map((block) => (
          <div key={block.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-400">{block.label}</div>
            <div className="mt-2 text-3xl font-black text-white">{block.minutes}m</div>
          </div>
        ))}
      </div>
      
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8">
        <div className="mb-4 text-sm font-semibold text-slate-400">Priority Routines</div>
        <div className="space-y-3">
          {sampleData.tasks.map((task, i) => (
            <div key={task.name} className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/50 text-sm font-bold text-slate-400">{i + 1}</span>
                <span className="font-medium text-white">{task.name}</span>
              </div>
              <span className="font-bold text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EqualGridLayout() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-2 row-span-2 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{sampleData.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">{sampleData.narrative}</p>
      </div>
      
      {sampleData.workBlocks.map((block) => (
        <div key={block.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
          <div className="text-sm text-slate-400">{block.label}</div>
          <div className="mt-2 text-2xl font-black text-white">{block.minutes}m</div>
        </div>
      ))}
      
      <div className="col-span-4 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
        <div className="mb-4 text-sm font-semibold text-slate-400">Priority Routines</div>
        <div className="grid grid-cols-2 gap-3">
          {sampleData.tasks.map((task, i) => (
            <div key={task.name} className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
              <span className="text-sm font-medium text-white">{task.name}</span>
              <span className="text-sm font-bold text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NarrowColumnLayout() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{sampleData.title}</h1>
      </div>
      
      <div className="space-y-6 text-lg leading-relaxed text-slate-300">
        <p>{sampleData.narrative}</p>
      </div>
      
      <div className="space-y-3">
        {sampleData.workBlocks.map((block) => (
          <div key={block.label} className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-5 py-4">
            <span className="font-medium text-white">{block.label}</span>
            <span className="font-bold text-cyan-400">{block.minutes}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorialLayout() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400 mb-4">{sampleData.category}</div>
          <h1 className="text-6xl font-black tracking-tight text-white leading-[0.9]">
            {sampleData.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            {sampleData.subtitle}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 text-center">
          <div className="text-5xl font-black text-emerald-400">{sampleData.minutesRecovered}</div>
          <div className="mt-1 text-sm text-slate-400">minutes recoverable</div>
          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          </div>
        </div>
      </div>
      
      <div className="text-xl leading-relaxed text-slate-300">
        <span className="float-left mr-3 mt-1 text-6xl font-serif text-cyan-400 leading-none">T</span>
        <p>{sampleData.narrative}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {sampleData.workBlocks.map((block) => (
          <div key={block.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6">
            <div className="text-sm uppercase tracking-wider text-slate-500">{block.label}</div>
            <div className="mt-2 text-4xl font-black text-white">{block.minutes}m</div>
          </div>
        ))}
      </div>
      
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8">
        <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Priority Routines</div>
        <div className="space-y-4">
          {sampleData.tasks.map((task, i) => (
            <div key={task.name} className="flex items-center gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
              <span className="text-2xl font-serif text-slate-600">{i + 1}</span>
              <div className="flex-1">
                <div className="font-medium text-white">{task.name}</div>
                <div className="text-sm text-slate-500">{task.category}</div>
              </div>
              <span className="font-bold text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SplitScreenLayout() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{sampleData.title}</h1>
        </div>
        
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
          <div className="mb-4 text-sm font-semibold text-slate-400">Work Blocks</div>
          <div className="space-y-3">
            {sampleData.workBlocks.map((block) => (
              <div key={block.label} className="flex items-center justify-between">
                <span className="text-white">{block.label}</span>
                <span className="font-bold text-cyan-400">{block.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="sticky top-8 space-y-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 text-center">
            <div className="text-5xl font-black text-emerald-400">{sampleData.minutesRecovered}</div>
            <div className="mt-1 text-sm text-slate-400">minutes recoverable</div>
          </div>
          
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
            <div className="mb-4 text-sm font-semibold text-slate-400">Priority Tasks</div>
            <div className="space-y-2">
              {sampleData.tasks.map((task) => (
                <div key={task.name} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3">
                  <span className="text-sm text-white">{task.name}</span>
                  <span className="text-sm font-bold text-cyan-400">{task.minutes}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-span-2 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
        <p className="text-base leading-relaxed text-slate-400">{sampleData.narrative}</p>
      </div>
    </div>
  );
}

function TimelineLayout() {
  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500 via-emerald-500 to-slate-700"></div>
      
      <div className="space-y-8">
        <div className="relative pl-20">
          <div className="absolute left-6 h-4 w-4 rounded-full border-2 border-cyan-400 bg-slate-900"></div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">{sampleData.title}</h1>
        </div>
        
        {sampleData.workBlocks.map((block, i) => (
          <div key={block.label} className="relative pl-20">
            <div className="absolute left-6 h-4 w-4 rounded-full border-2 border-emerald-400 bg-slate-900"></div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">{block.label}</span>
                <span className="text-2xl font-black text-cyan-400">{block.minutes}m</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                  style={{ width: `${(block.minutes / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="relative pl-20">
          <div className="absolute left-6 h-4 w-4 rounded-full border-2 border-violet-400 bg-slate-900"></div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
            <div className="text-sm font-semibold text-slate-400">Narrative</div>
            <p className="mt-2 text-slate-300 leading-relaxed">{sampleData.narrative}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModularLayout() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8 lg:col-span-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-white">{sampleData.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-400">{sampleData.narrative}</p>
      </div>
      
      <div className="col-span-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 lg:col-span-4 lg:row-span-2">
        <div className="text-center">
          <div className="text-6xl font-black text-emerald-400">{sampleData.minutesRecovered}</div>
          <div className="mt-2 text-sm text-slate-400">minutes recoverable</div>
        </div>
        <div className="mt-6 space-y-2">
          {sampleData.workBlocks.map((block) => (
            <div key={block.label} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <span className="text-sm text-white">{block.label}</span>
              <span className="text-sm font-bold text-cyan-400">{block.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="col-span-12 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 lg:col-span-6">
        <div className="mb-4 text-sm font-semibold text-slate-400">Priority Tasks</div>
        <div className="space-y-2">
          {sampleData.tasks.slice(0, 2).map((task) => (
            <div key={task.name} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3">
              <span className="text-white">{task.name}</span>
              <span className="font-bold text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="col-span-12 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 lg:col-span-6">
        <div className="mb-4 text-sm font-semibold text-slate-400">Skills & Human Edge</div>
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-slate-800/40 p-4 text-center">
            <div className="text-2xl font-bold text-white">{sampleData.skillCount}</div>
            <div className="text-xs text-slate-400">Skills</div>
          </div>
          <div className="flex-1 rounded-lg bg-slate-800/40 p-4 text-center">
            <div className="text-2xl font-bold text-white">{sampleData.humanEdgeCount}</div>
            <div className="text-xs text-slate-400">Human Edge</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MagazineLayout() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 lg:col-span-2">
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8">
            <div className="absolute -top-4 -left-4 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
              {sampleData.category}
            </div>
            <h1 className="mt-6 text-6xl font-black tracking-tight text-white leading-[0.9]">
              {sampleData.title}
            </h1>
            <p className="mt-4 text-xl font-light leading-relaxed text-slate-300">
              {sampleData.subtitle}
            </p>
          </div>
        </div>
        
        <div className="col-span-3 lg:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 text-center">
            <div className="text-7xl font-black text-emerald-400">{sampleData.minutesRecovered}</div>
            <div className="mt-2 text-sm uppercase tracking-wider text-slate-400">Minutes Back</div>
            <div className="mt-4 h-3 rounded-full bg-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{ width: `${sampleData.progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-slate-500">{sampleData.progress}% to one hour</div>
          </div>
        </div>
      </div>
      
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8">
        <div className="columns-2 gap-8">
          <p className="break-inside-avoid text-lg leading-relaxed text-slate-300">{sampleData.narrative}</p>
          <p className="break-inside-avoid text-lg leading-relaxed text-slate-300">
            The goal is not to automate away the role, but to remove the repetitive overhead so the person can focus on what matters most. By identifying the highest-impact routines and automating them, we can realistically recover significant time each day.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {sampleData.workBlocks.map((block) => (
          <div key={block.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5 text-center">
            <div className="text-sm text-slate-400">{block.label}</div>
            <div className="mt-2 text-3xl font-black text-white">{block.minutes}m</div>
          </div>
        ))}
      </div>
      
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8">
        <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Priority Routines</div>
        <div className="space-y-4">
          {sampleData.tasks.map((task, i) => (
            <div key={task.name} className="flex items-center gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-lg font-bold text-cyan-400">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-white">{task.name}</div>
                <div className="text-sm text-slate-500">{task.category} • {task.impact} impact</div>
              </div>
              <span className="text-xl font-black text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DenseDataLayout() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">{sampleData.category}</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">{sampleData.title}</h1>
        </div>
        <div className="col-span-4 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
          <div className="text-3xl font-black text-emerald-400">{sampleData.minutesRecovered}m</div>
          <div className="text-[10px] text-slate-500">recoverable</div>
        </div>
      </div>
      
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Work Blocks</div>
        <div className="grid grid-cols-4 gap-2">
          {sampleData.workBlocks.map((block) => (
            <div key={block.label} className="rounded-lg border border-slate-700/40 bg-slate-800/30 px-3 py-2">
              <div className="text-[10px] text-slate-500">{block.label}</div>
              <div className="mt-0.5 text-lg font-bold text-white">{block.minutes}m</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Priority Tasks</div>
        <div className="space-y-1.5">
          {sampleData.tasks.map((task) => (
            <div key={task.name} className="flex items-center justify-between rounded bg-slate-800/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                <span className="text-sm text-white">{task.name}</span>
              </div>
              <span className="text-sm font-bold text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Narrative</div>
        <p className="text-sm leading-relaxed text-slate-400">{sampleData.narrative}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 text-center">
          <div className="text-2xl font-bold text-white">{sampleData.skillCount}</div>
          <div className="text-[10px] text-slate-500">AI Skills</div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 text-center">
          <div className="text-2xl font-bold text-white">{sampleData.humanEdgeCount}</div>
          <div className="text-[10px] text-slate-500">Human Edge</div>
        </div>
      </div>
    </div>
  );
}

function MinimalLayout() {
  return (
    <div className="max-w-xl mx-auto space-y-12">
      <div>
        <div className="text-sm text-slate-500">{sampleData.category}</div>
        <h1 className="mt-2 text-5xl font-black tracking-tight text-white">{sampleData.title}</h1>
      </div>
      
      <div>
        <p className="text-lg leading-relaxed text-slate-300">{sampleData.narrative}</p>
      </div>
      
      <div className="space-y-6">
        {sampleData.workBlocks.map((block) => (
          <div key={block.label} className="flex items-center justify-between py-3 border-b border-slate-800">
            <span className="text-white">{block.label}</span>
            <span className="text-2xl font-black text-cyan-400">{block.minutes}m</span>
          </div>
        ))}
      </div>
      
      <div>
        <div className="mb-4 text-sm text-slate-500">Priority Tasks</div>
        <div className="space-y-3">
          {sampleData.tasks.map((task) => (
            <div key={task.name} className="flex items-center justify-between">
              <span className="text-slate-300">{task.name}</span>
              <span className="font-bold text-cyan-400">{task.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center pt-8">
        <div className="text-5xl font-black text-emerald-400">{sampleData.minutesRecovered}</div>
        <div className="mt-1 text-sm text-slate-500">minutes recoverable</div>
      </div>
    </div>
  );
}

export default function ExperimentsPage() {
  const [currentVariant, setCurrentVariant] = useState(0);
  
  const variant = variants[currentVariant];
  
  const renderVariant = () => {
    switch (variant.id) {
      case 'stacked-cards': return <StackedCardsLayout />;
      case 'grid-equal': return <EqualGridLayout />;
      case 'narrow-column': return <NarrowColumnLayout />;
      case 'editorial': return <EditorialLayout />;
      case 'split-screen': return <SplitScreenLayout />;
      case 'timeline': return <TimelineLayout />;
      case 'modular': return <ModularLayout />;
      case 'magazine': return <MagazineLayout />;
      case 'dense-data': return <DenseDataLayout />;
      case 'minimal': return <MinimalLayout />;
      default: return <StackedCardsLayout />;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">UI Experiments</h1>
              <p className="text-sm text-slate-400">Text layout variants</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentVariant(Math.max(0, currentVariant - 1))}
                disabled={currentVariant === 0}
                className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-slate-400">
                {currentVariant + 1} / {variants.length}
              </span>
              <button
                onClick={() => setCurrentVariant(Math.min(variants.length - 1, currentVariant + 1))}
                disabled={currentVariant === variants.length - 1}
                className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/50">
                <variant.icon className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{variant.name}</h2>
                <p className="text-sm text-slate-400">{variant.description}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/20 p-8 min-h-[600px]">
            {renderVariant()}
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {variants.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setCurrentVariant(i)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  i === currentVariant
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
