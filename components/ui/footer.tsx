import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-32 border-t border-edge py-10">
      <div className="page-container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-[0.75rem] text-ink-tertiary/60">
          AI Jobs Map &middot; U.S. Bureau of Labor Statistics
        </p>
        <nav className="flex gap-6">
          <Link href="/ai-jobs/browse" className="text-[0.75rem] text-ink-tertiary/60 transition-colors hover:text-ink-tertiary">
            Browse
          </Link>
          <Link href="/ai-jobs/about" className="text-[0.75rem] text-ink-tertiary/60 transition-colors hover:text-ink-tertiary">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
