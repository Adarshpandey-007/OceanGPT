"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BubbleBackground from '../decor/BubbleBackground';
import WaveDivider from '../decor/WaveDivider';

export function Hero() {
  const [query, setQuery] = useState('nearest float 12N 70W');
  const router = useRouter();
  function submit() {
    if (!query.trim()) return;
    router.push(`/app?seed=${encodeURIComponent(query.trim())}`);
  }

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return (
    <section className="relative pt-32 pb-32 md:pt-40 md:pb-40 px-6 text-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-floatchat-primary via-floatchat-secondary to-floatchat-primary" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_60%_20%,rgba(0,240,255,0.08),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_70%,rgba(0,240,255,0.04),transparent_70%)]" />

      <BubbleBackground disableAnimation={reducedMotion} />

      <div className="max-w-5xl mx-auto space-y-10 relative">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
          Converse with the Ocean&apos;s Data
        </h1>
        <p className="text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light text-slate-300">
          Ask natural-language questions across ARGO float observations and get structured, explorable answers—profiles, sections, maps & stats.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
          <label className="sr-only" htmlFor="hero-query">Seed query</label>
          <input
            id="hero-query"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="flex-1 rounded-xl px-4 py-3 text-sm md:text-base bg-white/[0.08] backdrop-blur-md border border-white/[0.15] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/40 text-white placeholder-slate-500 transition-all"
            placeholder="e.g. salinity profile near 10N 60W"
            aria-describedby="hero-example"
          />
          <button
            onClick={submit}
            className="rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-6 py-3 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Run Query
          </button>
        </div>
        <div id="hero-example" className="text-xs md:text-sm text-slate-500 font-mono tracking-wide">
          Example: &quot;nearest float 12N 70W last 30 days&quot;
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => router.push('/upload')}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white backdrop-blur border border-white/[0.15] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Upload Your NetCDF
          </button>
          <button
            onClick={() => router.push('/docs')}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Read the Docs
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0">
        <WaveDivider variant="dark" height={120} animate={!reducedMotion} />
      </div>
    </section>
  );
}
