import fs from 'fs';
import path from 'path';

export interface DocMeta { slug: string; title: string; file: string; description?: string }

const rootDocs = path.join(process.cwd(), 'docs');

// Manual mapping with simple title extraction (first markdown heading)
export function discoverDocs(): DocMeta[] {
  if (!fs.existsSync(rootDocs)) return [];
  const entries = fs.readdirSync(rootDocs).filter(f => f.endsWith('.md'));
  return entries.map(file => {
    const full = path.join(rootDocs, file);
    let title = file.replace(/\.md$/, '');
    try {
      const firstLine = fs.readFileSync(full, 'utf-8').split(/\r?\n/).find(l => l.startsWith('# '));
      if (firstLine) title = firstLine.replace(/^#\s+/, '').trim();
    } catch { /* ignore */ }
    const slug = file.replace(/\.md$/, '');
    return { slug, title, file: full };
  });
}

export function getDocBySlug(slug: string): { meta: DocMeta | null; content: string | null } {
  const docs = discoverDocs();
  const meta = docs.find(d => d.slug === slug) || null;
  if (!meta) return { meta: null, content: null };
  const content = fs.readFileSync(meta.file, 'utf-8');
  return { meta, content };
}
