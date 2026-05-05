import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET() {
  try {
    // 1. Total Active Floats
    const floatResult = await query('SELECT COUNT(*) FROM floats');
    const totalFloats = parseInt(floatResult.rows[0].count, 10);

    // 2. Total Planned Projects
    const projectResult = await query('SELECT COUNT(*) FROM planned_projects');
    const totalProjects = parseInt(projectResult.rows[0].count, 10);

    // 3. Total Legal Zones
    const zonesResult = await query('SELECT COUNT(*) FROM legal_zones');
    const totalZones = parseInt(zonesResult.rows[0].count, 10);

    // 4. Recent Projects (Limit 5)
    const recentProjectsQuery = await query(`
      SELECT id, name, project_type, scale_budget_usd, created_at 
      FROM planned_projects 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    const recentProjects = recentProjectsQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.project_type,
      scale: row.scale_budget_usd ? `$${parseFloat(row.scale_budget_usd).toLocaleString()}` : 'N/A',
      date: new Date(row.created_at).toLocaleDateString()
    }));

    return NextResponse.json({
      metrics: {
        totalFloats,
        totalProjects,
        totalZones,
        anomaliesDetected: 3, // Mock metric for now
      },
      recentProjects
    });
  } catch (error: any) {
    console.error('Dashboard Metrics API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
