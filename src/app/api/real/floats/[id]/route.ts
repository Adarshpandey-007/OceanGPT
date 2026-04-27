import { NextResponse } from 'next/server';
import { getFloatFile } from '../../../../../lib/argo/discovery';

interface Params { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
  const meta = getFloatFile(params.id);
  if (!meta) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: meta.id, filename: meta.filename, size: meta.size, mtime: meta.mtime });
}
