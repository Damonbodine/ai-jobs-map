import Link from 'next/link';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/78 backdrop-blur-2xl">
      <div className="page-container flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/ai-jobs" className="flex min-w-0 items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-cyan-500/20 transition-all group-hover:scale-105 group-hover:shadow-cyan-500/40">
            <Sparkles className="text-white h-5 w-5" />
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-slate-100 transition-colors group-hover:text-cyan-300">
            AI Jobs Map
          </span>
        </Link>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-5">
          <Link
            href="/ai-jobs/browse"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Browse Paths
          </Link>
          <Link
            href="/ai-jobs/about"
            className="hidden text-sm font-medium text-slate-400 transition-colors hover:text-white sm:inline"
          >
            Methodology
          </Link>
          <Link href="/factory">
            <Button variant="default" className="h-10 px-4 font-semibold sm:px-5">
              AI Factory
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
