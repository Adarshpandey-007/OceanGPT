import { notFound } from 'next/navigation';
import { getDocBySlug, discoverDocs } from '@/lib/docs';
import { marked } from 'marked';
import TocSidebar from '@/components/ui/TocSidebar';
import Link from 'next/link';

interface Params { slug: string }

export function generateStaticParams() {
  return discoverDocs().map(d => ({ slug: d.slug }));
}

function extractHeadings(html: string) {
  const headings: { text: string, level: number, id: string }[] = [];
  const regex = /<h([1-6]) id="([^"]+)">([^<]+)<\/h[1-6]>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({ level: parseInt(match[1]), id: match[2], text: match[3] });
  }
  return headings;
}

export default function DocPage({ params }: { params: Params }) {
  const { slug } = params;
  const { meta, content } = getDocBySlug(slug);
  if (!meta || !content) return notFound();
  
  const renderer = new marked.Renderer();
  renderer.heading = function(rawText: any, level: any) {
    // Handle both old-style (string, number) and new-style ({text, depth}) signatures
    let text: string;
    let lvl: number;
    if (typeof rawText === 'object' && rawText !== null) {
      text = String(rawText.text || rawText.raw || rawText);
      lvl = rawText.depth || level || 1;
    } else {
      text = String(rawText);
      lvl = typeof level === 'number' ? level : 1;
    }
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `<h${lvl} id="${escapedText}">${text}</h${lvl}>`;
  };
  
  const html = marked.parse(content, { renderer }) as string;
  const headings = extractHeadings(html);

  return (
    <main id="main" className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16 flex gap-12 items-start relative">
        <div className="flex-1 max-w-4xl">
          <Link href="/docs" className="text-sm font-medium text-slate-500 hover:text-cyan-400 inline-flex items-center gap-2 mb-8 transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Docs
          </Link>
          <article className="glass-panel p-8 md:p-14 prose prose-invert max-w-none 
                              prose-headings:tracking-tight prose-headings:text-white
                              prose-h1:text-4xl prose-h1:mb-8 prose-h1:font-bold
                              prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-cyan-400 prose-h2:border-b prose-h2:border-white/[0.08] prose-h2:pb-2
                              prose-h3:text-white prose-h3:mt-8 prose-h3:mb-3
                              prose-p:leading-relaxed prose-p:text-slate-300
                              prose-li:text-slate-300
                              prose-strong:text-white prose-strong:font-semibold
                              prose-a:text-cyan-400 hover:prose-a:text-cyan-300
                              prose-code:text-cyan-300 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                              prose-pre:bg-floatchat-primary prose-pre:border prose-pre:border-white/[0.08]
                              prose-blockquote:border-cyan-400/30 prose-blockquote:text-slate-400
                              prose-hr:border-white/[0.08]">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        </div>
        <TocSidebar headings={headings} />
      </div>
    </main>
  );
}
