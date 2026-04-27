"use client";
import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { VisualizationTabs } from './VisualizationTabs';
import { ChatPanel } from './ChatPanel';
import { ToastProvider } from './ui/ToastProvider';

export default function ChatAppShell() {
  const { activeTab, setActiveTab } = useChatStore();
  const [widthMode, setWidthMode] = useState<'split' | 'stack'>('split');

  return (
    <ToastProvider>
    <div className="flex flex-col h-dvh">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-floatchat-primary/80 backdrop-blur-lg">
        <a href="/" className="font-semibold text-white">FloatChat</a>
        <nav className="flex gap-4 text-sm">
          <a href="/upload" className="text-slate-400 hover:text-cyan-400 transition-colors">Upload Data</a>
          <a href="/about" className="text-slate-400 hover:text-cyan-400 transition-colors">About</a>
          <button onClick={() => setWidthMode(widthMode === 'split' ? 'stack' : 'split')} className="text-slate-400 hover:text-cyan-400 transition-colors">Layout</button>
        </nav>
      </header>
      <div className={`flex-1 ${widthMode === 'split' ? 'grid grid-cols-12' : 'flex flex-col'}`}>
        <div className={`${widthMode === 'split' ? 'col-span-4 border-r border-white/[0.08]' : 'border-b border-white/[0.08]'} flex flex-col h-full bg-floatchat-primary`}>
          <ChatPanel onSwitchTab={setActiveTab} />
        </div>
        <div className={`${widthMode === 'split' ? 'col-span-8' : ''} h-full bg-floatchat-bg`}>
          <VisualizationTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}
