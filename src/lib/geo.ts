// Geospatial utilities
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function nearestPoint<T extends { lat: number; lon: number }>(lat: number, lon: number, pts: T[]): { point: T; distanceKm: number } | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const p of pts) {
    const d = haversineKm(lat, lon, p.lat, p.lon);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best ? { point: best, distanceKm: bestD } : null;
}
