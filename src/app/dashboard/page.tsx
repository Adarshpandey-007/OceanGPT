"use client";
import { useEffect, useState } from 'react';
import { StatCards } from '../../components/dashboard/StatCards';
import { RecentProjectsTable } from '../../components/dashboard/RecentProjectsTable';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/dashboard/metrics');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to load dashboard metrics", e);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-floatchat-bg relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
              Executive Dashboard
            </h1>
            <p className="text-slate-400">
              System overview of oceanic data collection and coastal planning.
            </p>
          </div>
          {loading && (
            <div className="text-sm text-cyan-400 flex items-center gap-2 animate-pulse">
              <span className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              Syncing...
            </div>
          )}
        </div>

        <div className="space-y-8">
          <StatCards metrics={data?.metrics} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentProjectsTable projects={data?.recentProjects || []} />
            </div>
            
            <div className="bg-slate-900/50 rounded-2xl border border-white/[0.08] backdrop-blur-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">System Health</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">ARGO Network Sync</span>
                    <span className="text-emerald-400">Optimal</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[95%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Legal DB Vector Index</span>
                    <span className="text-cyan-400">Updated</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Ocean GPT Persona</span>
                    <span className="text-emerald-400">Online</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
