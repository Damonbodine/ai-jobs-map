import type { Metadata } from 'next';
import { FactoryHeader } from '@/components/ui/factory-header';

export const metadata: Metadata = {
  title: 'AI Jobs Factory - Automations',
  description: 'AI-Powered Automation Marketplace for Job Tasks',
};

export default function FactoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FactoryHeader />
      {children}
    </>
  );
}
