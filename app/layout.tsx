import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Jobs Map',
  description: 'Discover AI opportunities for any career',
};

import './globals.css'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
