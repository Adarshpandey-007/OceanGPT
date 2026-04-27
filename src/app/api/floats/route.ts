import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get each float with its latest profile position
    const { rows } = await query(`
      SELECT DISTINCT ON (f.wmo_id)
        f.wmo_id AS id,
        f.wmo_id AS "wmoId",
        p.latitude AS lat,
        p.longitude AS lon,
        p.timestamp AS "lastObs"
      FROM floats f
      JOIN profiles p ON p.float_id = f.id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      ORDER BY f.wmo_id, p.timestamp DESC
    `);

    return NextResponse.json({ floats: rows });
  } catch (err: any) {
    console.error('GET /api/floats error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to load floats', details: err?.message },
      { status: 500 }
    );
  }
}
