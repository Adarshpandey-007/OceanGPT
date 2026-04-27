// Intent classification & helpers (deduplicated)
export type Intent = 'map' | 'plot' | 'table' | 'unknown';

const MAP_REGEX = /(nearest|closest|map|location|where)/i;
const PLOT_REGEX = /(salinity|temperature|profile|depth|section)/i;
const TABLE_REGEX = /(summary|table|list|stats|statistics)/i;

export function classifyIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (MAP_REGEX.test(t)) return 'map';
  if (PLOT_REGEX.test(t)) return 'plot';
  if (TABLE_REGEX.test(t)) return 'table';
  return 'unknown';
}

export function extractLatLon(text: string): { lat?: number; lon?: number } {
  const regex = /(\d{1,2}(?:\.\d+)?)[°\s]?([NS])[,\s]+(\d{1,3}(?:\.\d+)?)[°\s]?([EW])/i;
  const match = text.match(regex);
  if (!match) return {};
  let lat = parseFloat(match[1]);
  let lon = parseFloat(match[3]);
  if (match[2].toUpperCase() === 'S') lat = -lat;
  if (match[4].toUpperCase() === 'W') lon = -lon;
  return { lat, lon };
}

export function buildAssistantHint(intent: Intent): string[] {
  switch (intent) {
    case 'map':
      return ['zoom map', 'list floats', 'show profile'];
    case 'plot':
      return ['add salinity', 'compare temperature', 'show deeper'];
    case 'table':
      return ['sort by date', 'filter last week'];
    default:
      return ['nearest floats', 'salinity profile', 'summary table'];
  }
}
