import fs from 'fs';
import path from 'path';

export interface FloatFileMeta {
  id: string;
  filename: string;
  fullPath: string;
  size: number;
  mtime: string;
}

let cache: { at: number; data: FloatFileMeta[] } | null = null;
const CACHE_MS = 60_000; // 1 minute

export function getArgoDataDir(): string {
  return process.env.ARGO_DATA_DIR || path.resolve(process.cwd(), 'ARGO-DATA');
}

export function listFloatFiles(force = false): FloatFileMeta[] {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const dir = getArgoDataDir();
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out: FloatFileMeta[] = [];
  for (const name of entries) {
    if (!name.endsWith('.nc')) continue;
    const match = name.match(/argo-profiles-(\d+)\.nc$/);
    if (!match) continue;
    const id = match[1];
    const fullPath = path.join(dir, name);
    try {
      const stat = fs.statSync(fullPath);
      out.push({ id, filename: name, fullPath, size: stat.size, mtime: stat.mtime.toISOString() });
    } catch {
      /* ignore */
    }
  }
  cache = { at: Date.now(), data: out };
  return out;
}

export function getFloatFile(id: string): FloatFileMeta | null {
  const list = listFloatFiles();
  return list.find(f => f.id === id) || null;
}
