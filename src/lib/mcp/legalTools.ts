import { query } from '../db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export async function checkSpatialCompliance(lat: number, lon: number): Promise<string> {
  try {
    // Check if the point intersects any legal zones
    const { rows } = await query(`
      SELECT zone_name, jurisdiction, zone_type, restrictions_summary
      FROM legal_zones
      WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
    `, [lon, lat]);

    if (rows.length === 0) {
      return `No specific spatial legal zones or Marine Protected Areas found intersecting (${lat}, ${lon}).`;
    }

    let result = `Spatial Compliance Alert for (${lat}, ${lon}):\n\n`;
    for (const r of rows) {
      result += `🚨 ZONE: ${r.zone_name} (${r.jurisdiction})\n`;
      result += `Type: ${r.zone_type}\n`;
      result += `Restrictions: ${r.restrictions_summary}\n\n`;
    }

    return result;
  } catch (err: any) {
    console.error('Spatial Compliance Error:', err);
    return `Error checking spatial compliance: ${err.message}`;
  }
}

export async function searchLegalVectors(searchQuery: string, jurisdiction: string = 'All'): Promise<string> {
  try {
    const pythonScript = path.join(process.cwd(), 'scripts', 'query_laws.py');
    const venvPython = path.join(process.cwd(), 'venv', 'Scripts', 'python.exe');
    
    // Execute the python script to query ChromaDB
    const { stdout } = await execAsync(`"${venvPython}" "${pythonScript}" "${searchQuery.replace(/"/g, '\\"')}" "${jurisdiction}"`);
    
    const results = JSON.parse(stdout);
    if (!results || results.length === 0) {
      return `No relevant legal documents found for jurisdiction: ${jurisdiction}`;
    }

    let resultText = `Legal Search Results for "${searchQuery}" (${jurisdiction}):\n\n`;
    for (const item of results) {
      resultText += `📄 ${item.metadata.jurisdiction} - ${item.metadata.act}\n`;
      resultText += `Topic: ${item.metadata.topic}\n`;
      resultText += `Excerpt: ${item.document}\n\n`;
    }

    return resultText;
  } catch (err: any) {
    console.error('Vector Search Error:', err);
    return `Error searching legal texts: ${err.message}`;
  }
}
