const phases = [
  { code: 'MVP', title: 'Chat + Mock Viz', done: true, desc: 'Initial conversational & placeholder rendering.' },
  { code: 'P1', title: 'NetCDF Cache', done: true, desc: 'Basic ingestion & caching of float NetCDF assets.' },
  { code: 'P2', title: 'DB + PostGIS', done: true, desc: 'Spatial indexing & geospatial query acceleration.' },
  { code: 'P3', title: 'Embeddings', done: false, desc: 'Vector representation for semantic float/context retrieval.' },
  { code: 'P4', title: 'NL2SQL', done: false, desc: 'Guarded SQL synthesis for structured statistics output.' },
  { code: 'P5', title: 'RAG Synthesis', done: false, desc: 'Compose narrative answers from vector + relational context.' },
  { code: 'P6', title: 'Analytics', done: false, desc: 'Advanced cross-float temporal & spatial analyses.' }
];

export function RoadmapTimeline() {
  const completed = phases.filter(p => p.done).length;
  const progressPct = (completed / phases.length) * 100;
  return (
    <section className="relative py-24 bg-floatchat-bgAlt overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_30%_60%,rgba(0,240,255,0.08),transparent_65%)]" />
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-12 flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Roadmap</h2>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">Incremental evolution from basic conversation to retrieval-augmented, analytics-rich ocean intelligence.</p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide font-medium text-slate-500 mb-1">
              <span>{completed} / {phases.length} Completed</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </header>
        <ol className="grid gap-4 md:grid-cols-7">
          {phases.map(p => (
            <li key={p.code} className={`group relative flex flex-col rounded-lg border p-4 backdrop-blur-sm transition-all duration-300
              ${p.done
                ? 'border-cyan-400/20 bg-cyan-400/[0.05] hover:border-cyan-400/40'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full tracking-wide ${p.done ? 'bg-cyan-400 text-slate-900 font-semibold' : 'bg-white/10 text-slate-400'}`}>{p.code}</span>
                <span className="text-sm font-semibold text-white tracking-tight">{p.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400 flex-1">{p.desc}</p>
              <div className={`mt-3 text-[10px] font-medium uppercase tracking-wide ${p.done ? 'text-cyan-400' : 'text-slate-600'}`}>{p.done ? '✓ Completed' : 'Planned'}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
