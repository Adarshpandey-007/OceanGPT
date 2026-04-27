import { fetchRealProfiles } from '../lib/real/fetchRealProfile';

// Simple mock using global fetch
const originalFetch = global.fetch;

describe('fetchRealProfiles', () => {
  beforeAll(() => {
    // @ts-ignore
    global.fetch = jest.fn(async (url: string) => {
      if (url.includes('5900001')) {
        return {
          ok: true,
          json: async () => ({ floatId: '5900001', profiles: [{ cycle: 1, measurements: [{ depth: 0, temperature: 27, salinity: 35 }] }] })
        } as any;
      }
      return { ok: false, status: 404 } as any;
    });
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns data for known float', async () => {
    const data = await fetchRealProfiles('5900001');
    expect(data.floatId).toBe('5900001');
    expect(data.profiles.length).toBeGreaterThan(0);
  });

  it('throws on 404', async () => {
    await expect(fetchRealProfiles('NOPE')).rejects.toThrow('Failed to load profiles');
  });
});
