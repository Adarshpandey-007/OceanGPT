"use client";
import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { classifyIntent, buildAssistantHint } from '../lib/intentRouter';

export function ChatPanel({ onSwitchTab }: { onSwitchTab: (t: 'map' | 'plot' | 'table' | 'none') => void }) {
  const { messages, addMessage, setActiveTab } = useChatStore();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    addMessage({ role: 'user', content: userText });
    setInput('');
    setPending(true);
    try {
      const res = await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: userText }) });
      const data = await res.json();
      addMessage({ role: 'assistant', content: data.message, intent: data.intent });
      const t = data.intent === 'unknown' ? 'none' : data.intent;
      setActiveTab(t);
      onSwitchTab(t);
      if (data.intent === 'map' && data.nearest) {
        // @ts-ignore new store method
        useChatStore.getState().setFocus(data.nearest.id, data.nearest.lat, data.nearest.lon);
      }
    } catch (e) {
      addMessage({ role: 'assistant', content: 'Error processing request.', intent: 'unknown' });
    }
    setPending(false);
  };

  const lastIntent = [...messages].reverse().find(m => m.intent)?.intent || 'unknown';
  const hints = buildAssistantHint((lastIntent as any) || 'unknown');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map(m => (
          <div key={m.id} className={`rounded-xl px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap ${
            m.role === 'user' 
              ? 'bg-cyan-400/10 text-cyan-100 ml-auto border border-cyan-400/20' 
              : 'bg-white/[0.04] border border-white/[0.08] text-slate-300'
          }`}>
            {m.content}
          </div>
        ))}
        {pending && <div className="text-xs text-slate-500 animate-pulse">Thinking...</div>}
      </div>
      <div className="p-3 border-t border-white/[0.08] bg-floatchat-primary/60 backdrop-blur-lg">
        <div className="flex gap-2 mb-2 flex-wrap">
          {hints.map(h => (
            <button key={h} onClick={() => setInput(h)} className="text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white px-2.5 py-1 rounded-full border border-white/[0.08] transition-all">
              {h}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about floats..."
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30 transition-all"
          />
          <button onClick={handleSend} className="bg-cyan-400 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-cyan-300 transition-colors">Send</button>
        </div>
      </div>
    </div>
  );
}
