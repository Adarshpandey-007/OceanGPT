"use client";
import { useEffect } from 'react';
import Link from 'next/link';

// Root-level global error boundary required by Next.js when using "use client" at root or throwing during layout rendering.
// Provides a themed fallback and reset instructions.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error captured', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-ocean-900 via-ocean-800 to-ocean-900 text-ocean-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-ocean-100/70">Something went wrong</h1>
            <p className="text-ocean-100/70 text-sm leading-relaxed">
              An unexpected error occurred while rendering the application. You can try to recover or return to the start page. If the issue persists, please capture the error digest and share it with the maintainers.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-5 text-left font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60">
            <div className="text-ocean-100/60 mb-1">Message:</div>
            <pre className="whitespace-pre-wrap break-words text-ocean-50/90">{error.message}</pre>
            {error.digest && (
              <div className="mt-3 text-ocean-100/60">
                digest: <span className="text-ocean-50/90">{error.digest}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-6 py-3 rounded-lg bg-floatchat-accent text-white text-sm font-medium shadow-ocean-sm hover:brightness-110 hover:shadow-ocean-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-floatchat-accent/60"
            >
              Attempt Recovery
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-lg bg-white text-ocean-900 text-sm font-medium shadow-ocean-sm hover:bg-ocean-50 hover:shadow-ocean-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-floatchat-accent/60"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}