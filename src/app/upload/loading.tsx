"use client";

export default function UploadLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#030B0E' }}>
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="h-10 w-64 rounded-lg bg-cyan-900/30 animate-pulse" />
        <div className="h-4 w-96 rounded bg-cyan-900/20 animate-pulse" />
        {/* Upload zone skeleton */}
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4" style={{ background: 'rgba(7,36,44,0.45)', border: '2px dashed rgba(0,240,255,0.25)' }}>
          <div className="w-16 h-16 rounded-full bg-cyan-900/30 animate-pulse" />
          <div className="h-4 w-48 rounded bg-cyan-900/20 animate-pulse" />
          <div className="h-3 w-32 rounded bg-cyan-900/15 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
