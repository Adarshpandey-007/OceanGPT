export function CtaBand() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-floatchat-primary via-floatchat-secondary to-floatchat-primary text-white overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,rgba(0,240,255,0.12),transparent_60%)]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_70%,rgba(0,240,255,0.08),transparent_65%)]" />
      <div className="relative max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h3 className="text-3xl font-bold tracking-tight text-white">Ready to Explore Live?</h3>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl mx-auto md:mx-0">Jump into the conversational workspace or inspect the ingestion pipeline roadmap before plugging in real-time sources.</p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <a href="/app" className="px-6 py-3 rounded-full bg-cyan-400 text-slate-900 text-sm font-semibold hover:bg-cyan-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">Launch App</a>
          <a href="/upload" className="px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 hover:bg-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">Upload Data</a>
          <a href="/docs" className="px-6 py-3 rounded-full border border-white/15 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">Docs</a>
        </div>
      </div>
    </section>
  );
}
