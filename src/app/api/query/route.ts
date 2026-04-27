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
  let toolCalls: any[] = [];
  
  if (process.env.GEMINI_API_KEY && text.trim()) {
    const context = `UI Intent: ${intent}\nExtracted Lat: ${lat}\nExtracted Lon: ${lon}`;
    const response = await generateLLMResponse(text, context);
    llmMessage = response.text;
    toolCalls = response.toolCalls;
  } else {
    llmMessage = `No API key present. Fallback route: ${intent}`;
  }

  // Format the response mimicking an MCP coordination step
  if (toolCalls.length > 0) {
    llmMessage += `\n\n[MCP Action Requested] AI wants to use tools: ${toolCalls.map(c => c.name).join(', ')}. In a full deployment, this would trigger the Python MCP Server over stdio to execute the SQL/Vector query.`;
  }

  return NextResponse.json({ 
    intent, 
    lat, 
    lon, 
    nearest, 
    message: llmMessage, 
    llmUsed: !!process.env.GEMINI_API_KEY, 
    mcpTools: toolCalls,
    relatedIds: { floats: nearest ? [nearest.id] : [], profiles: [] } 
  });
}
