import { classifyIntent, extractLatLon } from '../lib/intentRouter';

describe('classifyIntent', () => {
  it('detects map intent', () => {
    expect(classifyIntent('nearest floats please')).toBe('map');
  });
  it('detects plot intent', () => {
    expect(classifyIntent('show salinity profile')).toBe('plot');
  });
  it('detects table intent', () => {
    expect(classifyIntent('give me a summary table')).toBe('table');
  });
  it('falls back to unknown', () => {
    expect(classifyIntent('hello world')).toBe('unknown');
  });
  it('prioritizes map when mixed terms', () => {
    expect(classifyIntent('nearest salinity profile')).toBe('map');
  });
});

describe('extractLatLon', () => {
  it('parses simple formatted coordinates', () => {
    expect(extractLatLon('Show nearest floats to 10N 75E')).toEqual({ lat: 10, lon: 75 });
  });
  it('parses degrees symbol and south/west', () => {
    expect(extractLatLon('Plot profile at 12.5°S, 44.2°W')).toEqual({ lat: -12.5, lon: -44.2 });
  });
  it('returns empty object when not present', () => {
    expect(extractLatLon('no coords here')).toEqual({});
  });
});
