import type { Metadata } from 'next';
import { Header } from '@/components/ui/Header';

export const metadata: Metadata = {
  title: 'AI Jobs Map - Discover AI Opportunities for Your Career',
  description: 'Search any occupation to find AI-powered opportunities, skill recommendations, and actionable insights for leveraging AI in your job.',
};

export default function AIJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
