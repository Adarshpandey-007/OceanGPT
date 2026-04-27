import ChatAppShell from '../../components/ChatAppShell';
import { Suspense } from 'react';
import SeededShell from './seeded';
import PageHeader from '../../components/layout/PageHeader';

export default function AppPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <PageHeader
        title="Ocean Explorer"
        subtitle="Interactive conversational workspace for ARGO float discovery, profiling & analysis."
        breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Explorer' }]}
      />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-2xl border border-white/[0.08] bg-floatchat-primary overflow-hidden">
            <Suspense fallback={<div className="h-[calc(100vh-10rem)] w-full p-4"><div className="animate-pulse h-full w-full bg-white/[0.03] rounded-2xl" /></div>}>
              <SeededShell />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
