import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center space-y-8">
      <div className="space-y-4 max-w-xl">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-cyan-400">404</h1>
        <p className="text-slate-400 leading-relaxed text-sm md:text-base">
          The page you were looking for drifted off the current. It may have been renamed, moved deeper, or never existed.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-cyan-400 text-slate-900 text-sm font-semibold hover:bg-cyan-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          Return Home
        </Link>
        <Link
          href="/app"
          className="px-6 py-3 rounded-full bg-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.12] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 border border-white/[0.15]"
        >
          Open Explorer
        </Link>
      </div>
    </div>
  );
}