'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics/client';

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  eventName: string;
  eventProps?: Record<string, unknown>;
  children: ReactNode;
};

export function TrackedLink({
  href,
  eventName,
  eventProps,
  onClick,
  children,
  ...rest
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        trackEvent(eventName, { href, ...eventProps });
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
