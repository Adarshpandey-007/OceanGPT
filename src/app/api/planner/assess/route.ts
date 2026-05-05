import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NATURE_ADVOCATE_CHAT_PROMPT } from '../../../../lib/planner/prompts';
import { executeGetNearestFloats } from '../../../../lib/mcp/toolExecutor';
import { checkSpatialCompliance } from '../../../../lib/mcp/legalTools';
import { geocodeLocation } from '../../../../lib/mcp/geocoding';
import { query } from '../../../../lib/db';

const MODEL = 'gemini-2.5-flash';

const toolDeclarations = [
  {
    name: 'geocode_location',
    description: 'Convert a natural language location name (like "Mumbai" or "Gulf of Kutch") into precise Latitude and Longitude coordinates.',
    parameters: {
      type: 'OBJECT',
      properties: {
        locationName: { type: 'STRING', description: 'Name of the place' }
      },
      required: ['locationName'],
    },
  },
  {
    name: 'check_spatial_compliance',
    description: 'Check if coordinates fall inside legally protected zones (CRZ, MPA).',
    parameters: {
      type: 'OBJECT',
      properties: {
        lat: { type: 'NUMBER' },
        lon: { type: 'NUMBER' }
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'execute_get_nearest_floats',
    description: 'Fetch nearest ARGO floats and their recent oceanographic data (temperature, salinity).',
    parameters: {
      type: 'OBJECT',
      properties: {
        lat: { type: 'NUMBER' },
        lon: { type: 'NUMBER' }
      },
      required: ['lat', 'lon'],
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
    const { text, history, fileData, mimeType } = body;

    const client = getClient();
    if (!client) {
      return NextResponse.json({ message: 'LLM API Key missing.' }, { status: 500 });
    }

    const model = client.getGenerativeModel({
      model: MODEL,
      tools: [{ functionDeclarations: toolDeclarations as any }],
      systemInstruction: NATURE_ADVOCATE_CHAT_PROMPT,
    });

    const chat = model.startChat({ history: history || [] });
    
    // Construct the message parts
    const msgParts: any[] = [{ text: text }];
    if (fileData && mimeType) {
      msgParts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      });
    }

    let result = await chat.sendMessage(msgParts);
    let response = result.response;

    let iterations = 0;
    const MAX_ITERATIONS = 4;
    let toolsUsed: string[] = [];
    let discoveredLat: number | null = null;
    let discoveredLon: number | null = null;

    while (iterations < MAX_ITERATIONS) {
      const calls = response.functionCalls?.() || [];
      if (calls.length === 0) break;
      
      iterations++;
      const toolResults = [];

      for (const call of calls) {
        toolsUsed.push(call.name);
        let tr = '';
        
        if (call.name === 'geocode_location') {
          const res = await geocodeLocation(call.args.locationName as string);
          if (res) {
            discoveredLat = res.lat;
            discoveredLon = res.lon;
            tr = `Geocoded ${call.args.locationName} to Lat: ${res.lat}, Lon: ${res.lon}`;
          } else {
            tr = `Failed to geocode location ${call.args.locationName}.`;
          }
        } 
        else if (call.name === 'check_spatial_compliance') {
          discoveredLat = call.args.lat as number;
          discoveredLon = call.args.lon as number;
          tr = await checkSpatialCompliance(call.args.lat as number, call.args.lon as number);
        } 
        else if (call.name === 'execute_get_nearest_floats') {
          tr = await executeGetNearestFloats(call.args.lat as number, call.args.lon as number, 3);
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

    const finalMessage = response.text();

    // Check if the AI generated an assessment
    let assessment = null;
    const match = finalMessage.match(/```json_assessment\n([\s\S]*?)\n```/);
    if (match) {
      try {
        assessment = JSON.parse(match[1]);
        
        // Save the project to DB behind the scenes if we have coordinates
        if (discoveredLat !== null && discoveredLon !== null) {
          query(
            `INSERT INTO planned_projects (name, project_type, description, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5)`,
            ["Conversational Project", "Custom", "Extracted from chat", discoveredLat, discoveredLon]
          ).catch(e => console.error("Error saving conversational project", e));
        }
      } catch (e) {
        console.error("Failed to parse JSON assessment from chat", e);
      }
    }

    return NextResponse.json({
      message: finalMessage,
      assessment: assessment,
      toolsUsed: [...new Set(toolsUsed)]
    });

  } catch (error: any) {
    console.error('Planner Chat API Error:', error);
    return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
  }
}
