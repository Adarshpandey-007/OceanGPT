/** @jest-environment node */
import { POST } from '../app/api/query/route';

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            startChat: jest.fn().mockImplementation(() => {
              return {
                sendMessage: jest.fn().mockImplementation(async () => {
                  return {
                    response: {
                      text: () => 'LLM ANSWER MOCK',
                      functionCalls: () => []
                    }
                  };
                })
              };
            })
          };
        })
      };
    })
  };
});

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
