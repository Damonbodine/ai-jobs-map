import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const headingFont = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Jobs Map',
  description: 'Discover AI opportunities for any career',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('font-sans', bodyFont.variable)}>
      <body className={cn(headingFont.variable, 'bg-surface text-ink antialiased')}>
        {children}
      </body>
    </html>
  );
}
