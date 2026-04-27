"use client";
import { useEffect, useState } from 'react';

export default function TocSidebar({ headings }: { headings: { text: string, level: number, id: string }[] }) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 w-64 p-6 glass-panel hidden lg:block">
      <h3 className="text-cyan-400 font-bold mb-4 uppercase tracking-widest text-xs">On this page</h3>
      <ul className="space-y-3 text-sm">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 0.5}rem` }}>
            <button
              onClick={() => scrollTo(h.id)}
              className={`text-left transition-colors hover:text-white ${activeId === h.id ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="mt-8 text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-all"
      >
        ↑ Back to top
      </button>
    </nav>
  );
}
