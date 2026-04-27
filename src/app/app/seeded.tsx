"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import ChatAppShell from '../../components/ChatAppShell';
import { useChatStore } from '../../store/chatStore';

export default function SeededShell() {
  const params = useSearchParams();
  const seed = params.get('seed');
  const seededRef = useRef(false);
  const addMessage = useChatStore(s => s.addMessage);

  useEffect(() => {
    if (seed && !seededRef.current) {
      seededRef.current = true;
      // Inject user message; ChatPanel logic will process when user sends; optionally auto-send by POST /api/query
      addMessage({ role: 'user', content: seed });
      // Auto-fire classification for immediate response
      fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: seed }) })
        .then(r => r.json())
        .then(d => {
          addMessage({ role: 'assistant', content: d.message, intent: d.intent });
        })
        .catch(() => {
          addMessage({ role: 'assistant', content: 'Failed to process seeded query.', intent: 'unknown' });
        });
    }
  }, [seed, addMessage]);

  return <ChatAppShell />;
}
