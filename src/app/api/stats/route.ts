import { NextResponse } from 'next/server';

// Temporary in-memory counters (could later read from DB / cache)
let bootTime = Date.now();

export async function GET() {
  // Placeholder logic; later can aggregate from Postgres or cache JSON metadata
  const floatsIndexed = 1280; // derive from discovery cache length in future
  const profilesCached = 3421; // derive from parsed profile count
  const plannedFeatures = 42; // roadmap items
  const avgRespMs = 120; // sample metric

  return NextResponse.json({
    floatsIndexed,
    profilesCached,
    plannedFeatures,
    avgRespMs,
    since: bootTime,
    generatedAt: new Date().toISOString()
  }, { headers: { 'Cache-Control': 'no-store' } });
}
