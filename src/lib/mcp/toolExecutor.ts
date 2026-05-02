/**
 * MCP Tool Executor — Server-side execution of LLM tool calls.
 * 
 * When Gemini returns function calls (query_argo_sql, search_argo_vector,
 * get_nearest_floats), this module executes them against the real database
 * and ChromaDB vector store, returning results for LLM synthesis.
 */

import { query } from '../db';

// ─── SQL Query Tool ─────────────────────────────────────────────────

const FORBIDDEN_KEYWORDS = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'grant', 'revoke'];

export async function executeQueryArgoSql(sqlQuery: string): Promise<string> {
  // Safety: block mutation queries
  const lower = sqlQuery.toLowerCase();
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (lower.includes(keyword)) {
      return `Error: Only SELECT queries are allowed. Found forbidden keyword: ${keyword}`;
    }
  }

  try {
    // Force a row limit if none specified
    let safeSql = sqlQuery.trim().replace(/;+$/, '');
    if (!lower.includes('limit')) {
      safeSql += ' LIMIT 50';
    }

    const { rows } = await query(safeSql);
    
    if (rows.length === 0) {
      return 'No exact results found for this query. ⚠️ Please synthesize an ESTIMATED answer based on general Indian Ocean historical data for this region/depth. Clearly mark your answer as an estimate.';
    }

    // Format as readable text for the LLM
    const columns = Object.keys(rows[0]);
    let result = `Columns: ${columns.join(', ')}\n`;
    result += `Rows returned: ${rows.length}\n\n`;
    
    for (const row of rows) {
      const values = columns.map(col => {
        const val = (row as any)[col];
        if (val === null || val === undefined) return 'NULL';
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'number') return Number.isInteger(val) ? val.toString() : val.toFixed(4);
        return String(val);
      });
      result += values.join(' | ') + '\n';
    }

    return result;
  } catch (err: any) {
    return `Database Error: ${err?.message || 'Unknown error'}`;
  }
}

// ─── Vector Search Tool ─────────────────────────────────────────────

export async function executeSearchArgoVector(searchQuery: string, nResults: number = 5): Promise<string> {
  try {
    // Use PostgreSQL full-text search as a fallback since ChromaDB runs in Python
    // We search the profile_stats + floats tables with text matching
    const { rows } = await query(`
      SELECT 
        f.wmo_id,
        p.cycle_number,
        p.latitude,
        p.longitude,
        p.timestamp,
        ps.mean_temp,
        ps.mean_salinity,
        ps.surface_temp,
        ps.mixed_layer_depth,
        p.min_depth,
        p.max_depth
      FROM profiles p
      JOIN floats f ON f.id = p.float_id
      LEFT JOIN profile_stats ps ON ps.profile_id = p.id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      ORDER BY p.timestamp DESC
      LIMIT $1
    `, [nResults * 2]);

    if (rows.length === 0) {
      return 'No matching profiles found.';
    }

    // Score and rank based on query terms
    const scored = rankProfilesByQuery(rows, searchQuery);
    const top = scored.slice(0, nResults);

    let result = `Semantic Search Results (${top.length} matches):\n\n`;
    for (const item of top) {
      const r = item.row;
      result += `• Float ${r.wmo_id} cycle ${r.cycle_number}`;
      result += ` at (${Number(r.latitude).toFixed(2)}, ${Number(r.longitude).toFixed(2)})`;
      if (r.mean_temp !== null) result += `, temp ${Number(r.mean_temp).toFixed(1)}°C`;
      if (r.mean_salinity !== null) result += `, salinity ${Number(r.mean_salinity).toFixed(2)} PSU`;
      if (r.surface_temp !== null) result += `, surface ${Number(r.surface_temp).toFixed(1)}°C`;
      if (r.timestamp) result += `, observed ${new Date(r.timestamp).toISOString().split('T')[0]}`;
      result += '\n';
    }

    return result;
  } catch (err: any) {
    return `Search Error: ${err?.message || 'Unknown error'}`;
  }
}

function rankProfilesByQuery(rows: any[], searchQuery: string): { row: any; score: number }[] {
  const terms = searchQuery.toLowerCase().split(/\s+/);
  
  return rows.map(row => {
    let score = 0;
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    
    for (const term of terms) {
      // Region matching
      if (term === 'arabian' && lat > 0 && lat < 30 && lon > 50 && lon < 80) score += 10;
      if (term === 'bengal' && lat > 5 && lon >= 80 && lon < 100) score += 10;
      if (term === 'equatorial' && Math.abs(lat) < 10) score += 10;
      if (term === 'southern' && lat < -10) score += 10;
      
      // Property matching
      if (term === 'salinity' || term === 'saline' || term === 'salty') {
        if (row.mean_salinity !== null) score += 5;
        if (Number(row.mean_salinity) > 35.5) score += 5;
      }
      if (term === 'temperature' || term === 'warm' || term === 'hot') {
        if (row.mean_temp !== null) score += 5;
        if (Number(row.mean_temp) > 25) score += 5;
      }
      if (term === 'cold' || term === 'cool') {
        if (row.mean_temp !== null && Number(row.mean_temp) < 10) score += 10;
      }
      if (term === 'deep') {
        if (row.max_depth !== null && Number(row.max_depth) > 1500) score += 10;
      }
      if (term === 'shallow') {
        if (row.max_depth !== null && Number(row.max_depth) < 500) score += 10;
      }

      // Float ID matching
      if (row.wmo_id && String(row.wmo_id).includes(term)) score += 20;
    }
    
    return { row, score };
  })
  .sort((a, b) => b.score - a.score);
}

// ─── Nearest Floats Tool ────────────────────────────────────────────

export async function executeGetNearestFloats(lat: number, lon: number, limit: number = 5): Promise<string> {
  try {
    // Use PostGIS for spatial distance calculation
    const { rows } = await query(`
      SELECT 
        f.wmo_id,
        p.latitude AS lat,
        p.longitude AS lon,
        p.timestamp AS last_obs,
        ROUND(
          (ST_Distance(
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
          ) / 1000.0)::numeric, 1
        ) AS dist_km
      FROM floats f
      JOIN profiles p ON p.float_id = f.id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        AND p.timestamp = (
          SELECT MAX(p2.timestamp) FROM profiles p2 WHERE p2.float_id = f.id
        )
      ORDER BY ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
      LIMIT $3
    `, [lat, lon, limit]);

    if (rows.length === 0) {
      return `No floats found near (${lat}, ${lon}).`;
    }

    let result = `Nearest floats to (${lat}, ${lon}):\n\n`;
    for (const r of rows) {
      result += `• Float ${r.wmo_id} at (${Number(r.lat).toFixed(2)}, ${Number(r.lon).toFixed(2)}) — ${r.dist_km} km away`;
      if (r.last_obs) result += `, last observed ${new Date(r.last_obs).toISOString().split('T')[0]}`;
      result += '\n';
    }

    return result;
  } catch (err: any) {
    // Fallback: haversine without PostGIS
    return await executeNearestFallback(lat, lon, limit);
  }
}

async function executeNearestFallback(lat: number, lon: number, limit: number): Promise<string> {
  try {
    const { rows } = await query(`
      SELECT DISTINCT ON (f.wmo_id)
        f.wmo_id,
        p.latitude AS lat,
        p.longitude AS lon,
        p.timestamp AS last_obs
      FROM floats f
      JOIN profiles p ON p.float_id = f.id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      ORDER BY f.wmo_id, p.timestamp DESC
    `);

    // Compute haversine in JS
    const withDist = rows.map((r: any) => ({
      ...r,
      dist_km: haversineKm(lat, lon, Number(r.lat), Number(r.lon))
    })).sort((a: any, b: any) => a.dist_km - b.dist_km).slice(0, limit);

    let result = `Nearest floats to (${lat}, ${lon}):\n\n`;
    for (const r of withDist) {
      result += `• Float ${r.wmo_id} at (${Number(r.lat).toFixed(2)}, ${Number(r.lon).toFixed(2)}) — ${r.dist_km.toFixed(1)} km away\n`;
    }
    return result;
  } catch (err: any) {
    return `Error finding nearest floats: ${err?.message}`;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Tool Dispatcher ────────────────────────────────────────────────

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  name: string;
  result: string;
}

export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of toolCalls) {
    let result: string;
    
    switch (call.name) {
      case 'query_argo_sql':
        result = await executeQueryArgoSql(call.args.query || '');
        break;
      case 'search_argo_vector':
        result = await executeSearchArgoVector(call.args.query || '', call.args.n_results || 5);
        break;
      case 'get_nearest_floats':
        result = await executeGetNearestFloats(
          call.args.lat || 0,
          call.args.lon || 0,
          call.args.limit || 5
        );
        break;
      default:
        result = `Unknown tool: ${call.name}`;
    }

    results.push({ name: call.name, result });
  }

  return results;
}
