"use client";

export default function AppLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#030B0E' }}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search bar skeleton */}
        <div className="h-12 w-full max-w-2xl mx-auto rounded-xl bg-cyan-900/30 animate-pulse" />
        
        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map panel skeleton */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(7,36,44,0.45)', border: '1px solid rgba(0,240,255,0.15)', height: '480px' }}>
            <div className="h-full w-full bg-cyan-900/20 animate-pulse flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-12 h-12 text-cyan-400/30">
                <path fill="currentColor" d="M6 22c8 4 20 4 28 0v4c-8 4-20 4-28 0v-4Zm0-8c8 4 20 4 28 0v4c-8 4-20 4-28 0v-4Zm0-8c8 4 20 4 28 0v4C26 14 14 14 6 10V6Z"/>
              </svg>
            </div>
          </div>
          
          {/* Side panel skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(7,36,44,0.45)', border: '1px solid rgba(0,240,255,0.15)' }}>
                <div className="h-4 w-24 rounded bg-cyan-900/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                <div className="h-8 w-16 rounded bg-cyan-900/30 animate-pulse" style={{ animationDelay: `${i * 150 + 50}ms` }} />
                <div className="h-3 w-full rounded bg-cyan-900/20 animate-pulse" style={{ animationDelay: `${i * 150 + 100}ms` }} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,36,44,0.45)', border: '1px solid rgba(0,240,255,0.15)' }}>
          <div className="p-4 space-y-3">
            <div className="h-4 w-32 rounded bg-cyan-900/40 animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-3 flex-1 rounded bg-cyan-900/20 animate-pulse" style={{ animationDelay: `${(i * 5 + j) * 30}ms` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
