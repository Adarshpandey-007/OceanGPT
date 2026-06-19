import { NextResponse } from 'next/server';
import { consume } from '../../../lib/rateLimiter';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

// Global key index for sequential API key rotation
declare global { var __geminiKeyIndex: number; }

const MCP_URL = process.env.MCP_SERVER_URL || "http://127.0.0.1:8000/sse";
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are FloatChat, an expert "Ocean Advisor" that chats with the ocean using real-time data from ARGO floats worldwide.

You have access to live ocean data tools:
- get_ocean_profile: Fetch temperature/salinity depth profiles for a specific float by WMO ID
- search_ocean_area: Find floats and data within a geographic bounding box (use when user mentions a location)
- check_float_health: Get deployment status, battery, and sensor health of a float
- search_erddap: Bulk data query fallback for large-scale filtering
- system_health_check: Verify backend connectivity

CORE BEHAVIORS:
1. Use Layman Terms: Explain scientific data simply. Describe what measurements mean for ecosystems.
2. Human Perspective: Consider social/economic impact alongside environmental data.
3. Actionable Insights: Structure answers as "Finding -> Impact -> Recommendation" when evaluating projects.
4. Proactive Tool Use: If the user asks about a location, always call search_ocean_area. If they mention a float ID, call get_ocean_profile and check_float_health together.
5. Missing Data: If no data is found, provide regional estimates and clearly mark them as estimates.

Always answer clearly using markdown formatting.`;

// SchemaType enum for @google/generative-ai
const SchemaType = {
  STRING: 'STRING' as const,
  NUMBER: 'NUMBER' as const,
  OBJECT: 'OBJECT' as const,
};

/**
 * Convert MCP tool schemas (JSON Schema) to Gemini function declarations.
 */
function mcpToolsToGeminiDeclarations(mcpTools: any[]) {
  return mcpTools.map(tool => {
    const props: Record<string, any> = {};
    const required: string[] = [];
    const schema = tool.inputSchema || {};
    const schemaProps = schema.properties || {};

    for (const [key, val] of Object.entries(schemaProps)) {
      const v = val as any;
      let type: any = SchemaType.STRING;
      if (v.type === 'number' || v.type === 'integer') type = SchemaType.NUMBER;
      props[key] = { type, description: v.description || '' };
    }
    if (schema.required) {
      required.push(...schema.required);
    }

    return {
      name: tool.name,
      description: tool.description || '',
      parameters: {
        type: SchemaType.OBJECT,
        properties: props,
        required,
      },
    };
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text: string = body.text || '';
  const history: any[] = body.history || [];
  
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const rate = consume(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded', retryAfterMs: rate.resetMs }, { status: 429 });
  }

  let llmMessage = '';
  let toolsUsed: string[] = [];
  let usedLLM = false;
  let visualizationCommands: any[] = [];

  // ── Step 1: Connect to MCP Server ──────────────────────────────────────
  let mcpClient: Client | null = null;
  let transport: SSEClientTransport | null = null;
  let mcpTools: any[] = [];

  try {
    transport = new SSEClientTransport(new URL(MCP_URL));
    mcpClient = new Client({ name: "floatchat-nextjs", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(transport);
    const toolsResp = await mcpClient.listTools();
    mcpTools = toolsResp.tools || [];
  } catch (err: any) {
    console.error("[MCP] Connection failed:", err.message);
    // Continue without MCP — Gemini can still answer from knowledge
  }

  // ── Step 2: Call Gemini with MCP tools as function declarations ────────
  // Sequential key rotation: use one key until it hits 429, then try the next
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ].filter(Boolean) as string[];

  // Track which key to use across requests (round-robin starting point)
  if (typeof globalThis.__geminiKeyIndex === 'undefined') {
    globalThis.__geminiKeyIndex = 0;
  }

  if (apiKeys.length > 0 && text.trim()) {
    let lastError: any = null;

    // Try each key starting from the current index
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      const keyIndex = (globalThis.__geminiKeyIndex + attempt) % apiKeys.length;
      const apiKey = apiKeys[keyIndex];

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiDeclarations = mcpTools.length > 0 ? mcpToolsToGeminiDeclarations(mcpTools) : [];
        
        const modelConfig: any = {
          model: MODEL,
          systemInstruction: SYSTEM_PROMPT,
        };
        if (geminiDeclarations.length > 0) {
          modelConfig.tools = [{ functionDeclarations: geminiDeclarations }];
        }

        const model = genAI.getGenerativeModel(modelConfig);
        const chat = model.startChat({ history });

        const timeContext = `Current System Time: ${new Date().toISOString()}`;
        const fullPrompt = `${timeContext}\n\nUser question: ${text}`;

        // First turn
        let result = await chat.sendMessage(fullPrompt);
        let response = result.response;

      // ── Step 3: Tool execution loop ──────────────────────────────────
      let iterations = 0;
      const MAX_ITERATIONS = 3;
      const allToolResults: { name: string; text: string }[] = [];

      while (iterations < MAX_ITERATIONS && mcpClient) {
        const calls = response.functionCalls?.() || [];
        if (calls.length === 0) break;

        iterations++;
        console.log(`[Gemini] Tool calls (iter ${iterations}):`, calls.map((c: any) => c.name).join(', '));

        // Execute each tool via MCP
        const functionResponses: any[] = [];
        for (const call of calls) {
          toolsUsed.push(call.name);
          try {
            const mcpResult = await mcpClient.callTool(
              {
                name: call.name,
                arguments: (call.args || {}) as Record<string, unknown>,
              },
              undefined,
              { timeout: 120000 }
            );
            // Extract text from MCP content array
            const resultText = (mcpResult.content as any[])
              ?.map((c: any) => c.text || '')
              .join('') || 'No result';
            
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: resultText },
              },
            });
            allToolResults.push({ name: call.name, text: resultText });
          } catch (toolErr: any) {
            console.error(`[MCP] Tool ${call.name} failed:`, toolErr.message);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: `Tool error: ${toolErr.message}` },
              },
            });
          }
        }

        // Feed tool results back to Gemini
        result = await chat.sendMessage(functionResponses);
        response = result.response;
      }

      // ── Step 4: Extract final response ─────────────────────────────
      try {
        llmMessage = response.text() || '';
      } catch {
        llmMessage = toolsUsed.length > 0
          ? "I retrieved data but couldn't generate a summary."
          : "No response generated.";
      }
      usedLLM = true;
      toolsUsed = [...new Set(toolsUsed)]; // Deduplicate

      // ── Step 5: Extract coordinates from tool results for map ──────
      for (const tr of allToolResults) {
        try {
          const parsed = JSON.parse(tr.text);
          // From search_ocean_area: use bounding box center
          if (parsed.bounding_box) {
            const bb = parsed.bounding_box;
            const centerLat = (bb.lat_min + bb.lat_max) / 2;
            const centerLon = (bb.lon_min + bb.lon_max) / 2;
            visualizationCommands.push({ action: 'center_map', lat: centerLat, lon: centerLon });
            visualizationCommands.push({ action: 'switch_tab', tab: 'map' });
          }
          // From get_ocean_profile: use first profile's coordinates
          if (parsed.profiles && parsed.profiles.length > 0) {
            const p = parsed.profiles[0];
            if (p.latitude && p.longitude) {
              visualizationCommands.push({ action: 'center_map', lat: p.latitude, lon: p.longitude });
              visualizationCommands.push({ action: 'switch_tab', tab: 'map' });
            }
          }
          // From check_float_health: use deployment coordinates
          if (parsed.deployment_lat && parsed.deployment_lon) {
            visualizationCommands.push({ action: 'center_map', lat: parsed.deployment_lat, lon: parsed.deployment_lon });
          }
        } catch { /* not JSON, skip */ }
      }

        // Success! Stay on this key for next request
        break;

      } catch (err: any) {
        const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests');
        if (is429 && attempt < apiKeys.length - 1) {
          // This key is exhausted — rotate to the next one
          console.warn(`[Gemini] Key #${keyIndex + 1} hit 429, rotating to next key...`);
          globalThis.__geminiKeyIndex = (keyIndex + 1) % apiKeys.length;
          lastError = err;
          continue; // Try the next key
        }

        // Non-429 error or all keys exhausted
        console.error("[Gemini] Error:", err.message);
        llmMessage = `Error connecting to AI: ${err.message}. Query: ${text}`;
        break;
      }
    } // end for-loop over keys
  } else if (apiKeys.length === 0) {
    llmMessage = `LLM API key not configured. Your query: "${text}"`;
  }

  // ── Cleanup ────────────────────────────────────────────────────────────
  try { if (transport) await transport.close(); } catch { /* ignore */ }

  // ── Step 6: Infer visualization intent ────────────────
  const { classifyIntent } = require('../../../lib/intentRouter');
  let intent: string = classifyIntent(text);
  if (intent === 'unknown') {
    intent = 'chat';
  }
  if (toolsUsed.includes('search_ocean_area') || toolsUsed.includes('get_ocean_profile')) {
    intent = 'map';
  }

  return NextResponse.json({ 
    intent, 
    lat: undefined, 
    lon: undefined, 
    nearest: null, 
    message: llmMessage, 
    llmUsed: usedLLM, 
    toolsUsed,
    visualizationCommands,
    relatedIds: { floats: [], profiles: [] } 
  });
}
