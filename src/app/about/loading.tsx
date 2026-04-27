"use client";

export default function AboutLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#030B0E' }}>
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <div className="h-10 w-48 rounded-lg bg-cyan-900/30 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-cyan-900/20 animate-pulse" style={{ width: `${55 + Math.random() * 40}%`, animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
