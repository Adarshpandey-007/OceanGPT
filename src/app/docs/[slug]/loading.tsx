"use client";

export default function DocSlugLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#030B0E' }}>
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        {/* Breadcrumb */}
        <div className="h-3 w-40 rounded bg-cyan-900/20 animate-pulse" />
        {/* Title */}
        <div className="h-10 w-80 rounded-lg bg-cyan-900/30 animate-pulse" />
        {/* Content lines */}
        <div className="space-y-4 pt-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-cyan-900/20 animate-pulse"
              style={{
                width: `${60 + Math.random() * 35}%`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
