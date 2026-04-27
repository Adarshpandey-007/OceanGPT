import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { FloatProfilesPayload } from '../../../../types/argo';

// Reads parsed profile JSON files produced by the offline ingestion script.
// GET /api/real/profiles?floatId=5900001
// If floatId omitted returns summary list of available floats (ids only) up to a soft cap.

const PROFILE_CACHE_DIR = process.env.PROFILE_CACHE_DIR || path.join(process.cwd(), 'data', 'derived', 'profiles');

async function listAvailable(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PROFILE_CACHE_DIR, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && e.name.endsWith('.json'))
      .map(e => e.name.replace(/\.json$/, ''));
  } catch (e) {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const floatId = searchParams.get('floatId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(500, parseInt(limitParam, 10))) : undefined;

  if (!floatId) {
    const ids = await listAvailable();
    const trimmed = limit ? ids.slice(0, limit) : ids;
    return NextResponse.json({ floats: trimmed, total: ids.length, cacheDir: PROFILE_CACHE_DIR });
  }

  const filePath = path.join(PROFILE_CACHE_DIR, `${floatId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data: FloatProfilesPayload = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return NextResponse.json({ error: 'Not found', floatId }, { status: 404 });
    }
    return NextResponse.json({ error: 'Read error', detail: String(e) }, { status: 500 });
  }
}
