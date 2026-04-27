"use client";
import { useEffect, useState } from 'react';

interface Stat { label: string; value: number; target: number; }

export function LiveStats() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Floats Indexed', value: 0, target: 0 },
    { label: 'Profiles Cached', value: 0, target: 0 },
    { label: 'Avg Resp (ms)', value: 0, target: 0 },
    { label: 'Features Planned', value: 0, target: 0 }
  ]);

  useEffect(() => {
    setStats([
      { label: 'Floats Indexed', value: 0, target: 1280 },
      { label: 'Profiles Cached', value: 0, target: 3421 },
      { label: 'Avg Resp (ms)', value: 0, target: 120 },
      { label: 'Features Planned', value: 0, target: 42 }
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    const start = performance.now();
    let raf: number;
    const step = () => {
      const progress = Math.min(1, (performance.now() - start) / 1200);
      const eased = 1 - Math.pow(1 - progress, 3);
      setStats(prev => prev.map(s => ({ ...s, value: Math.round(s.target * eased) })));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [loading]);

  if (loading) {
    return (
      <section className="py-16 bg-floatchat-secondary relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center border border-white/[0.08] rounded-xl p-6 bg-white/[0.03]">
              <div className="h-10 w-20 mx-auto mb-3 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-24 mx-auto rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-floatchat-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_65%_35%,rgba(0,240,255,0.1),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-4 relative">
        {stats.map(s => (
          <div key={s.label} className="text-center border border-white/[0.08] rounded-xl p-6 bg-white/[0.03] hover:border-cyan-400/20 transition-all duration-300">
            <div className="text-3xl font-bold text-cyan-400 tabular-nums">{s.value.toLocaleString()}</div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-2 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
