'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './Button';
import { Bot } from 'lucide-react';

export function FactoryHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/82 backdrop-blur-2xl">
      <div className="page-container flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/factory" className="flex min-w-0 items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-cyan-500/20 transition-all group-hover:scale-105 group-hover:shadow-cyan-500/40">
            <Bot className="text-white h-6 w-6" />
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-slate-100 transition-colors group-hover:text-cyan-300">
            AI Jobs Factory
          </span>
        </Link>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-5">
          <Link
            href="/ai-jobs"
            className="hidden text-sm font-medium text-slate-400 transition-colors hover:text-white lg:block"
          >
            ← Back to Map
          </Link>
          <Link
            href="/factory"
            className={`text-sm font-medium transition-colors ${
              pathname === '/factory' ? 'font-semibold text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Packages
          </Link>
          <Link
            href="/factory/case-studies"
            className={`text-sm font-medium transition-colors ${
              pathname === '/factory/case-studies' ? 'font-semibold text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Case Studies
          </Link>
          <Link
            href="/factory/roi"
            className={`text-sm font-medium transition-colors ${
              pathname === '/factory/roi' ? 'font-semibold text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            ROI Dashboard
          </Link>

          <Link href="/factory">
            <Button variant="default" className="h-10 px-4 font-semibold sm:px-5">
              Get Started
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
