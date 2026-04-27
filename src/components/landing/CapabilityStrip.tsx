export function CapabilityStrip() {
  const rows = [
    { title: 'Conversational Geospatial', desc: 'Ask for nearest floats, bounding boxes, regions & coordinate proximity in natural language.', icon: '🗺️' },
    { title: 'Profile Analytics', desc: 'Visualize vertical sections & depth profiles for temperature, salinity and derived metrics.', icon: '📈' },
    { title: 'Pipeline Ready', desc: 'Designed to flow NetCDF → xarray → PostGIS → embeddings (roadmap execution).', icon: '🔗' },
    { title: 'Retrieval & NL2SQL', desc: 'Planned vector retrieval + guarded SQL synthesis enabling richer, auditable answers.', icon: '🧠' }
  ];
  return (
    <section className="relative py-20 bg-floatchat-primary">
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_70%_30%,rgba(0,240,255,0.06),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-6">
        <header className="text-center mb-12 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Core Capabilities</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">A focused feature set today with a clear, oceanic expansion roadmap for data interrogation and retrieval augmented analysis.</p>
        </header>
        <div className="grid gap-6 md:gap-8 md:grid-cols-4">
          {rows.map(r => (
            <div
              key={r.title}
              className="group relative rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 hover:border-cyan-400/30 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl" aria-hidden>{r.icon}</div>
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-400/40 group-hover:bg-cyan-400 transition" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white mb-2 tracking-tight text-sm md:text-base">{r.title}</h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed flex-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
