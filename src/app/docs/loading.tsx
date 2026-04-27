"use client";

export default function DocsLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#030B0E' }}>
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        {/* Title skeleton */}
        <div className="h-10 w-72 rounded-lg bg-cyan-900/30 animate-pulse" />
        <div className="h-4 w-96 rounded bg-cyan-900/20 animate-pulse" />
        
        {/* Card grid skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-6 space-y-4" style={{ background: 'rgba(7,36,44,0.45)', border: '1px solid rgba(0,240,255,0.15)' }}>
              <div className="h-5 w-32 rounded bg-cyan-900/40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-cyan-900/20 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                <div className="h-3 w-3/4 rounded bg-cyan-900/20 animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
