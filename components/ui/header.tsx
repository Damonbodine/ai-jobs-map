'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'text-[0.8rem] transition-colors duration-200',
        active
          ? 'text-ink font-medium'
          : 'text-ink-tertiary hover:text-ink'
      )}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const isMap = pathname.startsWith('/ai-jobs');
  const isProducts = pathname.startsWith('/products');
  const isAbout = pathname === '/ai-jobs/about';
  const isBrowse = pathname.startsWith('/ai-jobs/browse');

  return (
    <header className="sticky top-0 z-50 border-b border-edge/50 bg-surface/92 backdrop-blur-xl">
      <div className="page-container flex items-center justify-between py-4">
        <Link
          href="/ai-jobs"
          className="font-editorial text-[0.9rem] font-medium tracking-[-0.02em] text-ink transition-opacity hover:opacity-60"
        >
          AI Jobs Map
        </Link>

        <nav className="flex items-center gap-7">
          <NavLink href="/ai-jobs" active={isMap && !isBrowse && !isAbout}>Map</NavLink>
          <NavLink href="/products" active={isProducts}>Products</NavLink>
          <NavLink href="/ai-jobs/about" active={isAbout}>About</NavLink>
          <Link
            href="/ai-jobs/browse"
            className={cn(
              'rounded-full border px-3 py-1.5 text-[0.72rem] transition-colors duration-200',
              isBrowse
                ? 'border-edge-strong bg-surface-raised text-ink'
                : 'border-edge/70 text-ink-tertiary hover:border-edge-strong hover:text-ink'
            )}
          >
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
}
