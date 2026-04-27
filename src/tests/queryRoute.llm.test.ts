/** @jest-environment node */
import * as gemini from '../lib/llm/gemini';
import { POST } from '../app/api/query/route';

jest.spyOn(gemini, 'generateLLMResponse').mockImplementation(async () => 'LLM ANSWER MOCK');

// Simulate env presence
process.env.GEMINI_API_KEY = 'test-key';

describe('POST /api/query with LLM', () => {
  it('returns llmUsed true when key present and LLM returns text', async () => {
    const req = new Request('http://localhost/api/query', { method: 'POST', body: JSON.stringify({ text: 'show temperature profile' }), headers: { 'content-type': 'application/json' } });
    const res: any = await POST(req as unknown as Request);
    const json = await res.json();
    expect(json.llmUsed).toBe(true);
    expect(json.message).toBe('LLM ANSWER MOCK');
    expect(json.intent).toBe('plot');
  });
});
