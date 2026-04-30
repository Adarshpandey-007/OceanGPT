import { NextResponse } from 'next/server';
import { classifyIntent, extractLatLon } from '../../../lib/intentRouter';
import { haversineKm } from '../../../lib/geo';
import { generateLLMResponse } from '../../../lib/llm/gemini';
import { consume } from '../../../lib/rateLimiter';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text: string = body.text || '';
  
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const rate = consume(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded', retryAfterMs: rate.resetMs }, { status: 429 });
  }

  // Still use intent routing for UI panel mapping (map, plot, table)
  const intent = classifyIntent(text);
  const { lat, lon } = extractLatLon(text);
  
  let nearest: { id: string; lat: number; lon: number; distanceKm: number } | null = null;
  if (intent === 'map' && lat !== undefined && lon !== undefined) {
    const floatsData = (await import('../../../data/mock/floats.json')).default as any;
    const list: any[] = floatsData.floats || [];
    let best = Infinity;
    for (const f of list) {
      const d = haversineKm(lat, lon, f.lat, f.lon);
      if (d < best) {
        best = d;
        nearest = { id: f.id, lat: f.lat, lon: f.lon, distanceKm: d };
      }
    }
  }

  let llmMessage = '';
  let toolsUsed: string[] = [];
  let usedLLM = false;
  
  if (process.env.GEMINI_API_KEY && text.trim()) {
    const context = `UI Intent: ${intent}${lat !== undefined ? `\nExtracted Lat: ${lat}` : ''}${lon !== undefined ? `\nExtracted Lon: ${lon}` : ''}`;
    
    const response = await generateLLMResponse(text, context);
    llmMessage = response.text;
    usedLLM = true;
    
    // Track which tools were used for the UI
    if (response.usedTools) {
      toolsUsed = [...new Set(response.toolCalls.map(c => c.name))];
    }
    
    // If Gemini found nearest floats via tool, try to extract for map focus
    if (intent === 'map' && response.usedTools && !nearest) {
      const nearestResult = response.toolResults.find(r => r.name === 'get_nearest_floats');
      if (nearestResult) {
        const match = nearestResult.result.match(/Float (\S+) at \(([-\d.]+),\s*([-\d.]+)\)/);
        if (match) {
          nearest = { 
            id: match[1], 
            lat: parseFloat(match[2]), 
            lon: parseFloat(match[3]), 
            distanceKm: 0 
          };
        }
      }
    }
  } else {
    llmMessage = `No API key present. Fallback route: ${intent}`;
  }

  return NextResponse.json({ 
    intent, 
    lat, 
    lon, 
    nearest, 
    message: llmMessage, 
    llmUsed: usedLLM, 
    toolsUsed,
    relatedIds: { floats: nearest ? [nearest.id] : [], profiles: [] } 
  });
}
