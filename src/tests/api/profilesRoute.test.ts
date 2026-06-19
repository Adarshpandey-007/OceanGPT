import { NextRequest } from 'next/server';
import { GET as getProfiles } from '../../app/api/real/profiles/route';

const originalFetch = global.fetch;

function buildRequest(url: string) {
  return new NextRequest(url);
}

describe('/api/real/profiles', () => {
  beforeAll(() => {
    // @ts-ignore
    global.fetch = jest.fn(async (url: string) => {
      if (url.includes('platform=5900001')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              _id: "5900001_1",
              timestamp: "2026-06-19T12:00:00Z",
              geolocation: { coordinates: [70.0, 12.0] },
              data_info: [["temperature", "salinity", "pressure"]],
              data: [[25.5], [35.2], [10.0]]
            }
          ]
        } as any;
      }
      if (url.includes('platform=NOPE9999')) {
        return {
          ok: false,
          status: 404
        } as any;
      }
      return { ok: false, status: 500 } as any;
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns 400 when no floatId provided', async () => {
    const req = buildRequest('http://localhost/api/real/profiles');
    const res = await getProfiles(req);
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.error).toBe('floatId is required');
  });

  it('returns specific float profiles when floatId provided', async () => {
    const req = buildRequest('http://localhost/api/real/profiles?floatId=5900001');
    const res = await getProfiles(req);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.floatId).toBe('5900001');
    expect(Array.isArray(json.profiles)).toBe(true);
    expect(json.profiles[0].cycle).toBe(1);
    expect(json.profiles[0].latitude).toBe(12.0);
    expect(json.profiles[0].longitude).toBe(70.0);
  });

  it('404s for unknown floatId', async () => {
    const req = buildRequest('http://localhost/api/real/profiles?floatId=NOPE9999');
    const res = await getProfiles(req);
    expect(res.status).toBe(404);
  });
});
