"use client";
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center space-y-6">
      <div className="space-y-3 max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-ocean-900">Page Rendering Failed</h1>
        <p className="text-ocean-700/80 text-sm leading-relaxed">An issue occurred while loading this section. You can retry the render or return to a stable view. If this keeps happening, the underlying data or network may be the cause.</p>
      </div>
      <div className="rounded-lg border border-ocean-200/60 bg-white/70 backdrop-blur p-4 max-w-xl w-full text-left font-mono text-xs text-ocean-800 overflow-x-auto">
        {error.message}
        {error.digest && <div className="mt-2 opacity-70">digest: {error.digest}</div>}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-md bg-floatchat-accent text-white text-sm font-medium shadow-ocean-sm hover:brightness-110 hover:shadow-ocean-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-floatchat-accent/60"
        >
          Retry Render
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-md bg-ocean-900 text-white text-sm font-medium shadow-ocean-sm hover:bg-ocean-800 hover:shadow-ocean-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-floatchat-accent/60"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}