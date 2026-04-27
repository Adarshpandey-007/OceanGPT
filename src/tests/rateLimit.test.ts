/** @jest-environment node */
import { POST } from '../app/api/query/route';

async function call(text: string, hdrs: Record<string,string> = {}) {
  const req = new Request('http://localhost/api/query', { method: 'POST', body: JSON.stringify({ text }), headers: { 'content-type': 'application/json', ...hdrs } });
  return POST(req as unknown as Request);
}

describe('Rate Limiter', () => {
  it('blocks after capacity is exceeded', async () => {
    const hdrs = { 'x-forwarded-for': '1.2.3.4' };
    // capacity = 30, send 31
    for (let i = 0; i < 30; i++) {
      const res: any = await call('map please', hdrs);
      expect(res.status).toBe(200);
    }
    const blocked: any = await call('one more', hdrs);
    expect(blocked.status).toBe(429);
    const json = await blocked.json();
    expect(json.error).toMatch(/Rate limit/);
  });
});
