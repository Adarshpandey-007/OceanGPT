import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const floatId = searchParams.get('floatId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    if (floatId) {
      // Get profiles for a specific float
      const { rows } = await query(`
        SELECT 
          p.id, p.cycle_number AS cycle, p.timestamp,
          p.latitude AS lat, p.longitude AS lon,
          p.min_depth AS "minDepth", p.max_depth AS "maxDepth",
          p.qc_status AS "qcStatus",
          f.wmo_id AS "floatId"
        FROM profiles p
        JOIN floats f ON f.id = p.float_id
        WHERE f.wmo_id = $1
        ORDER BY p.cycle_number DESC
        LIMIT $2
      `, [floatId, limit]);

      return NextResponse.json({ profiles: rows });
    }

    // Return latest profiles across all floats
    const { rows } = await query(`
      SELECT 
        p.id, p.cycle_number AS cycle, p.timestamp,
        p.latitude AS lat, p.longitude AS lon,
        p.min_depth AS "minDepth", p.max_depth AS "maxDepth",
        p.qc_status AS "qcStatus",
        f.wmo_id AS "floatId"
      FROM profiles p
      JOIN floats f ON f.id = p.float_id
      WHERE p.latitude IS NOT NULL
      ORDER BY p.timestamp DESC
      LIMIT $1
    `, [limit]);

    return NextResponse.json({ profiles: rows });
  } catch (err: any) {
    console.error('GET /api/profiles error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to load profiles', details: err?.message },
      { status: 500 }
    );
  }
}
