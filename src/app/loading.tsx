"use client";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#030B0E' }}>
      {/* Animated ocean rings */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-cyan-400/70 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-10 h-10 text-cyan-400 animate-pulse">
            <path fill="currentColor" d="M6 22c8 4 20 4 28 0v4c-8 4-20 4-28 0v-4Zm0-8c8 4 20 4 28 0v4c-8 4-20 4-28 0v-4Zm0-8c8 4 20 4 28 0v4C26 14 14 14 6 10V6Z"/>
          </svg>
        </div>
      </div>
      <div className="text-cyan-400/80 text-sm font-medium tracking-widest uppercase animate-pulse">
        Loading FloatChat...
      </div>
    </div>
  );
}
