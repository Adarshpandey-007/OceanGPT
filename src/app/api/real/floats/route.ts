import { NextResponse } from 'next/server';
import { listFloatFiles } from '../../../../lib/argo/discovery';

export async function GET() {
  const files = listFloatFiles();
  return NextResponse.json({ count: files.length, floats: files.map(f => ({ id: f.id, filename: f.filename, size: f.size, mtime: f.mtime })) });
}
