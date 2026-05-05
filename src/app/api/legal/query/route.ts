import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkSpatialCompliance, searchLegalVectors } from '../../../../lib/mcp/legalTools';

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are FloatChat's "Legal Expert", a specialized AI trained in multi-jurisdictional environmental law.
Your role is to help government officials, project managers, and advocates understand the legal constraints of coastal development.

You have access to two tools:
1. check_spatial_compliance: Given a latitude and longitude, checks if the location falls inside any legally protected zones (e.g., Marine Protected Areas, CRZ zones).
2. search_legal_vectors: Searches a database of environmental laws (e.g., CRZ, UNCLOS) for specific text or concepts.

CORE BEHAVIORS:
1. Always cite specific laws or zones when answering.
2. If asked about a specific location, ALWAYS use check_spatial_compliance first to understand the zoning.
3. If asked about a rule or regulation, use search_legal_vectors to find the exact text.
4. Provide clear, structured answers using Markdown. Use bullet points for checklists.
5. Remind users that this is an AI advisory service and does not replace formal legal counsel.`;

const toolDeclarations = [
  {
    name: 'check_spatial_compliance',
    description: 'Check if a specific latitude and longitude fall inside any legally protected zones (e.g., Marine Protected Areas, CRZ zones).',
    parameters: {
      type: 'OBJECT',
      properties: {
        lat: { type: 'NUMBER', description: 'Latitude' },
        lon: { type: 'NUMBER', description: 'Longitude' }
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'search_legal_vectors',
    description: 'Search a database of environmental laws for specific text or concepts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'The search query (e.g., "brine discharge regulations")' },
        jurisdiction: { type: 'STRING', description: 'Optional jurisdiction to filter by (e.g., "India", "International", "All"). Default is "All".' }
      },
      required: ['query'],
    },
  }
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, history, jurisdictionContext } = body;

    const client = getClient();
    if (!client) {
      return NextResponse.json({ message: 'LLM API Key missing.' }, { status: 500 });
    }

    const model = client.getGenerativeModel({
      model: MODEL,
      tools: [{ functionDeclarations: toolDeclarations as any }],
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history: history || [] });
    
    // Inject jurisdiction context if provided by the UI selector
    const fullPrompt = jurisdictionContext 
      ? `[User explicitly selected Jurisdiction: ${jurisdictionContext}]\n\nUser Question: ${text}`
      : `User Question: ${text}`;

    let result = await chat.sendMessage(fullPrompt);
    let response = result.response;

    let iterations = 0;
    const MAX_ITERATIONS = 3;
    let toolsUsed: string[] = [];

    while (iterations < MAX_ITERATIONS) {
      const calls = response.functionCalls?.() || [];
      if (calls.length === 0) break;
      
      iterations++;
      const toolResults = [];

      for (const call of calls) {
        toolsUsed.push(call.name);
        let tr = '';
        if (call.name === 'check_spatial_compliance') {
          tr = await checkSpatialCompliance(call.args.lat as number, call.args.lon as number);
        } else if (call.name === 'search_legal_vectors') {
          tr = await searchLegalVectors(call.args.query as string, (call.args.jurisdiction as string) || jurisdictionContext || 'All');
        } else {
          tr = `Unknown tool: ${call.name}`;
        }
        
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { result: tr },
          }
        });
      }

      result = await chat.sendMessage(toolResults as any);
      response = result.response;
    }

    return NextResponse.json({
      message: response.text(),
      toolsUsed: [...new Set(toolsUsed)]
    });

  } catch (error: any) {
    console.error('Legal Query API Error:', error);
    return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
  }
}
