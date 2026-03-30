import type { Metadata } from 'next';
import { Manrope, Newsreader, Geist } from 'next/font/google';

const headingFont = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Jobs Map',
  description: 'Discover AI opportunities for any career',
};

import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${headingFont.variable} ${bodyFont.variable} bg-surface text-ink antialiased`}>{children}</body>
    </html>
  );
}
