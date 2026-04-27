import { NextRequest } from 'next/server';
import { GET as getProfiles } from '../../app/api/real/profiles/route';
import path from 'path';

// Mock process.env for test
const originalEnv = { ...process.env };

function buildRequest(url: string) {
  return new NextRequest(url);
}

describe('/api/real/profiles', () => {
  beforeAll(() => {
    process.env.PROFILE_CACHE_DIR = path.join(process.cwd(), 'data', 'derived', 'profiles');
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  it('lists available floats when no floatId provided', async () => {
    const req = buildRequest('http://localhost/api/real/profiles');
    const res = await getProfiles(req);
    const json: any = await res.json();
    expect(json.floats).toBeDefined();
    expect(Array.isArray(json.floats)).toBe(true);
    expect(json.total).toBeGreaterThanOrEqual(json.floats.length);
  });

  it('returns specific float profiles when floatId provided', async () => {
    const req = buildRequest('http://localhost/api/real/profiles?floatId=5900001');
    const res = await getProfiles(req);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.floatId).toBe('5900001');
    expect(Array.isArray(json.profiles)).toBe(true);
  });

  it('404s for unknown floatId', async () => {
    const req = buildRequest('http://localhost/api/real/profiles?floatId=NOPE9999');
    const res = await getProfiles(req);
    expect(res.status).toBe(404);
  });
});
