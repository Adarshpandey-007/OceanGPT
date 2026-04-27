import { expect, describe, it } from '@jest/globals';
import { haversineKm } from '../lib/geo';

describe('haversine', () => {
  it('distance zero for identical points', () => {
    expect(haversineKm(0,0,0,0)).toBeCloseTo(0, 5);
  });
  it('rough distance between (0,0) and (0,1) ~111 km', () => {
    expect(haversineKm(0,0,0,1)).toBeGreaterThan(110);
    expect(haversineKm(0,0,0,1)).toBeLessThan(112);
  });
});
