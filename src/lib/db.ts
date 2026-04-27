import { Pool } from 'pg';

// Basic singleton pool. In serverless environments you may need pg-bouncer or
// to switch to the 'neon' or 'postgres' client for connection reuse.

let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    const conn = process.env.DATABASE_URL;
    if (!conn) throw new Error('DATABASE_URL not set');
    pool = new Pool({ connectionString: conn });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const p = getPool();
  const res = await p.query(text, params);
  return { rows: res.rows };
}

export async function healthCheck() {
  try {
    const { rows } = await query('SELECT 1 as ok');
    return rows[0]?.ok === 1;
  } catch (e) {
    return false;
  }
}
