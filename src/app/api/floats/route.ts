import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ARGOVIS_KEY = process.env.ARGOVIS_API_KEY || '';
    
    // Default viewport (Arabian Sea near India) to populate the map initially
    // [[lon_min, lat_min], [lon_max, lat_max]] - smaller 5x5 degree box to avoid 413
    const box = "[[70.0,10.0],[75.0,15.0]]";
    
    const headers: Record<string, string> = {};
    if (ARGOVIS_KEY) headers['x-argokey'] = ARGOVIS_KEY;

    // Fetch without data payload just to get metadata and geolocation
    const response = await fetch(`https://argovis-api.colorado.edu/argo?box=${encodeURIComponent(box)}`, {
      headers,
      next: { revalidate: 3600 } // Cache for 1 hour to prevent Argovis spam on page loads
    });

    if (!response.ok) {
      throw new Error(`Argovis returned ${response.status}`);
    }

    const data = await response.json();
    
    // Process into unique floats with their latest coordinates
    const floatsMap = new Map<string, any>();
    
    for (const item of data) {
      const idStr = item._id || "unknown";
      const wmoId = idStr.includes('_') ? idStr.split('_')[0] : idStr;
      
      const geo = item.geolocation?.coordinates || [0, 0];
      const timestamp = item.timestamp || new Date().toISOString();
      
      if (!floatsMap.has(wmoId) || timestamp > floatsMap.get(wmoId).lastObs) {
        floatsMap.set(wmoId, {
          id: wmoId,
          wmoId: wmoId,
          lon: geo[0],
          lat: geo[1],
          lastObs: timestamp
        });
      }
    }

    const floats = Array.from(floatsMap.values());
    return NextResponse.json({ floats });
  } catch (err: any) {
    console.error('GET /api/floats error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to load floats from Argovis', details: err?.message },
      { status: 500 }
    );
  }
}
