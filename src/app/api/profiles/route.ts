import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const ARGOVIS_KEY = process.env.ARGOVIS_API_KEY || '';
    const headers: Record<string, string> = {};
    if (ARGOVIS_KEY) headers['x-argokey'] = ARGOVIS_KEY;

    // Fetch recent profiles in a smaller default box to avoid 413
    const box = "[[70.0,10.0],[75.0,15.0]]";
    const url = `https://argovis-api.colorado.edu/argo?box=${encodeURIComponent(box)}&data=temperature,salinity`;
    
    const response = await fetch(url, { headers, next: { revalidate: 3600 } });

    if (!response.ok) {
      throw new Error(`Argovis returned ${response.status}`);
    }

    const data = await response.json();
    
    const profiles = data.slice(0, 100).map((item: any) => {
      const idStr = item._id || '';
      const parts = idStr.split('_');
      const floatId = parts[0] || 'unknown';
      const cycle = parseInt(parts[1] || '0', 10);
      const geo = item.geolocation?.coordinates || [0, 0];
      
      // Calculate simple means
      let meanTemp = undefined;
      let meanSalinity = undefined;
      
      if (item.data_info && item.data && item.data_info.length > 0 && item.data.length > 0) {
        const varNames = Array.isArray(item.data_info[0]) ? item.data_info[0] : [];
        const tempIdx = varNames.indexOf('temperature');
        const salIdx = varNames.indexOf('salinity');
        
        if (tempIdx >= 0 && item.data[tempIdx]) {
          const validTemps = item.data[tempIdx].filter((v: number | null) => v !== null);
          if (validTemps.length > 0) {
            meanTemp = validTemps.reduce((a: number, b: number) => a + b, 0) / validTemps.length;
          }
        }
        
        if (salIdx >= 0 && item.data[salIdx]) {
          const validSals = item.data[salIdx].filter((v: number | null) => v !== null);
          if (validSals.length > 0) {
            meanSalinity = validSals.reduce((a: number, b: number) => a + b, 0) / validSals.length;
          }
        }
      }

      return {
        id: idStr,
        floatId,
        cycle,
        timestamp: item.timestamp || new Date().toISOString(),
        lon: geo[0],
        lat: geo[1],
        stats: { meanTemp, meanSalinity }
      };
    });

    return NextResponse.json({ profiles });
  } catch (err: any) {
    console.error('GET /api/profiles error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to load profiles from Argovis', details: err?.message },
      { status: 500 }
    );
  }
}
