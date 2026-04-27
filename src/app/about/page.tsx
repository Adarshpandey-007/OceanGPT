import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-floatchat-primary via-floatchat-secondary to-floatchat-primary" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_30%,rgba(0,240,255,0.08),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">About FloatChat</h1>
            <p className="max-w-2xl mx-auto text-slate-400 text-base md:text-lg leading-relaxed">
              Conversational ocean data exploration built on ARGO float observations. This project combines spatial search, profile analytics, and natural language interaction to make subsurface ocean structure more intuitive.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-8">
        {/* Overview */}
        <section className="rounded-2xl p-8 bg-white/[0.03] backdrop-blur border border-white/[0.08]">
          <h2 className="text-2xl font-semibold tracking-tight text-white mb-5">Project Overview</h2>
          <p className="text-slate-400 leading-relaxed text-base">
            FloatChat is an experimental interface for exploring ARGO profiling float observations through conversation and guided analytical panels. The aim is to reduce friction between raw NetCDF profile data and interpretable ocean structure: density stratification, mixed layer depth cues, thermocline sharpness, and temporal evolution. This MVP focuses on robust data ingestion, profile visualization, and multi-cycle comparison flows that set the foundation for more advanced semantic and vector search layers.
          </p>
        </section>

        {/* Feature + Stack Grid */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur border border-white/[0.08] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Current Features</h3>
            <ul className="space-y-2.5 text-sm leading-relaxed flex-1">
              {[
                'Interactive map with float markers & spatial filtering',
                'Real ARGO profile extraction & rendering',
                'Multi-cycle overlay plots with color legends',
                'Profile statistics + CSV export tooling',
                'Upload pipeline for NetCDF → CSV conversion',
                'Feedback & toast notification system'
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span className="text-slate-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur border border-white/[0.08] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Technology Stack</h3>
            <ul className="space-y-2.5 text-sm leading-relaxed flex-1">
              {[
                'Next.js 14 (App Router) + TypeScript',
                'React 18 + Zustand state orchestration',
                'React-Leaflet for geospatial interaction',
                'Plotly.js profile + time-series charts',
                'Tailwind CSS with semantic ocean tokens'
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-slate-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Data Sources */}
        <section className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur border border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white mb-5 tracking-tight">Data Sources</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-cyan-400 mb-2 text-sm">Current</h4>
              <ul className="text-sm space-y-1.5 text-slate-400">
                <li>• ARGO float profile NetCDF ingestion</li>
                <li>• Real-time profile extraction & parsing</li>
                <li>• Derived measurement panels</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-cyan-400 mb-2 text-sm">Planned</h4>
              <ul className="text-sm space-y-1.5 text-slate-400">
                <li>• Ifremer Global Repository sync</li>
                <li>• INCOIS regional integration</li>
                <li>• Temporal archive analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur border border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white mb-5 tracking-tight">Development Roadmap</h3>
          <div className="grid md:grid-cols-3 gap-8 text-sm leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-400 text-sm">Phase 1 (Current)</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>✓ Interactive visualization</li>
                <li>✓ Real data integration</li>
                <li>✓ Multi-cycle analysis</li>
                <li>• Enhanced testing suite</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-400 text-sm">Phase 2</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>✓ PostgreSQL/PostGIS backend</li>
                <li>• Advanced geospatial queries</li>
                <li>• Vector summaries + RAG</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-400 text-sm">Phase 3</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>• Natural language to SQL</li>
                <li>• AI-assisted exploration</li>
                <li>• Advanced analytics dashboard</li>
                <li>• Collaborative features</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 text-slate-900 px-7 py-3 text-sm font-semibold hover:bg-cyan-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Explore Ocean Data
          </Link>
        </section>
      </div>
    </main>
  );
}
