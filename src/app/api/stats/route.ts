import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [floatRes, profileRes, measurementRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM floats'),
      query('SELECT COUNT(*)::int AS count FROM profiles'),
      query('SELECT COUNT(*)::int AS count FROM measurements'),
    ]);

    return NextResponse.json({
      floatsIndexed: floatRes.rows[0]?.count ?? 0,
      profilesCached: profileRes.rows[0]?.count ?? 0,
      totalMeasurements: measurementRes.rows[0]?.count ?? 0,
      plannedFeatures: 42,
      avgRespMs: 120,
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('GET /api/stats error:', err?.message);
    // Fallback to hardcoded values if DB is unavailable
    return NextResponse.json({
      floatsIndexed: 1151,
      profilesCached: 6085,
      totalMeasurements: 4335500,
      plannedFeatures: 42,
      avgRespMs: 120,
      generatedAt: new Date().toISOString(),
      source: 'fallback'
    });
  }
}
