import { NextRequest, NextResponse } from 'next/server';
import { FloatProfilesPayload, RealProfile, Measurement } from '../../../../types/argo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const floatId = searchParams.get('floatId');
  
  if (!floatId) {
    return NextResponse.json({ error: 'floatId is required' }, { status: 400 });
  }

  try {
    const ARGOVIS_KEY = process.env.ARGOVIS_API_KEY || '';
    const headers: Record<string, string> = {};
    if (ARGOVIS_KEY) headers['x-argokey'] = ARGOVIS_KEY;

    // Fetch the 10 most recent profiles for the float with temperature, salinity, and pressure
    const url = `https://argovis-api.colorado.edu/argo?platform=${encodeURIComponent(floatId)}&data=temperature,salinity,pressure`;
    const response = await fetch(url, { headers, next: { revalidate: 60 } });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Float not found on Argovis', floatId }, { status: 404 });
      }
      throw new Error(`Argovis returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      const emptyPayload: FloatProfilesPayload = { 
        floatId, 
        generatedAt: new Date().toISOString(),
        profiles: [] 
      };
      return NextResponse.json(emptyPayload);
    }

    // Map Argovis array format to frontend FloatProfilesPayload
    const profiles: RealProfile[] = [];

    // Process up to 15 recent profiles to keep payload size reasonable
    for (const item of data.slice(0, 15)) {
      const idStr = item._id || '';
      const cycleStr = idStr.includes('_') ? idStr.split('_')[1] : '0';
      const cycle = parseInt(cycleStr, 10);
      const geo = item.geolocation?.coordinates || [null, null];
      
      const measurements: Measurement[] = [];
      const dataInfo = item.data_info || [];
      const dataArrays = item.data || [];
      
      let minDepth = Infinity;
      let maxDepth = -Infinity;
      
      if (dataInfo.length >= 1 && dataArrays.length > 0) {
        const varNames = Array.isArray(dataInfo[0]) ? dataInfo[0] : [];
        
        const tempIdx = varNames.indexOf('temperature');
        const salIdx = varNames.indexOf('salinity');
        const presIdx = varNames.indexOf('pressure');
        
        // Find the length of the arrays (usually the first array determines length)
        const levels = dataArrays.length > 0 ? (dataArrays[0] || []).length : 0;
        
        for (let i = 0; i < levels; i++) {
          // Argovis depth is usually pressure, use pressure as depth
          const pressure = presIdx >= 0 && presIdx < dataArrays.length ? dataArrays[presIdx][i] : null;
          const temp = tempIdx >= 0 && tempIdx < dataArrays.length ? dataArrays[tempIdx][i] : null;
          const sal = salIdx >= 0 && salIdx < dataArrays.length ? dataArrays[salIdx][i] : null;
          
          if (pressure !== null) {
            minDepth = Math.min(minDepth, pressure);
            maxDepth = Math.max(maxDepth, pressure);
            measurements.push({
              depth: pressure,
              temperature: temp,
              salinity: sal
            });
          }
        }
      }
      
      profiles.push({
        cycle: isNaN(cycle) ? 0 : cycle,
        timestamp: item.timestamp || new Date().toISOString(),
        latitude: geo[1],
        longitude: geo[0],
        minDepth: minDepth === Infinity ? 0 : minDepth,
        maxDepth: maxDepth === -Infinity ? 0 : maxDepth,
        measurements
      });
    }

    const payload: FloatProfilesPayload = {
      floatId,
      generatedAt: new Date().toISOString(),
      profiles: profiles.sort((a, b) => b.cycle - a.cycle) // sort descending
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error('Real profiles fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch real profile data', detail: String(e) }, { status: 500 });
  }
}
