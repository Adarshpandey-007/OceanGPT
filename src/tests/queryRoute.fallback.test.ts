/** @jest-environment node */
// Simple integration-style test for /api/query fallback (no real LLM call)
import { POST } from '../app/api/query/route';

describe('POST /api/query (fallback)', () => {
  it('returns default message when GEMINI_API_KEY missing', async () => {
    const req = new Request('http://localhost/api/query', { method: 'POST', body: JSON.stringify({ text: 'show map near 10N' }) });
    const res: any = await POST(req as unknown as Request);
    const json = await res.json();
    expect(json.intent).toBe('map');
    expect(json.llmUsed).toBeFalsy();
    expect(typeof json.message).toBe('string');
  });
});
