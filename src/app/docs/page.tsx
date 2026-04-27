import Link from 'next/link';
import { discoverDocs } from '@/lib/docs';

export const metadata = { title: 'Documentation | FloatChat' };

export default function DocsIndexPage() {
  const docs = discoverDocs();
  return (
    <main id="main" className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-6 pt-16">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Documentation</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">Technical and design references for the FloatChat system.</p>
        </header>
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map(doc => (
            <Link key={doc.slug} href={`/docs/${doc.slug}`} className="group rounded-2xl p-5 bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/30 hover:bg-white/[0.06] transition-all duration-300">
              <h2 className="font-semibold text-lg mb-2 text-white group-hover:text-cyan-400 transition-colors">{doc.title}</h2>
              <p className="text-xs text-slate-500">{doc.slug}.md</p>
            </Link>
          ))}
          {docs.length === 0 && (
            <div className="text-slate-500 text-sm">No documentation files found in /docs.</div>
          )}
        </section>
      </div>
    </main>
  );
}
