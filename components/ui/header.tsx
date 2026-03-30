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
  const isFactory = pathname.startsWith('/factory');

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
          {isFactory ? (
            <>
              <NavLink href="/ai-jobs" active={false}>Map</NavLink>
              <NavLink href="/ai-jobs/browse" active={false}>Browse</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/ai-jobs/browse" active={pathname.startsWith('/ai-jobs/browse')}>Browse</NavLink>
              <NavLink href="/ai-jobs/about" active={pathname === '/ai-jobs/about'}>About</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
