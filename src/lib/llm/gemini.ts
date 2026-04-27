import { GoogleGenerativeAI, FunctionDeclaration, Type } from '@google/generative-ai';

const MODEL = 'gemini-1.5-flash';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

const queryArgoSqlDeclaration: FunctionDeclaration = {
  name: 'query_argo_sql',
  description: 'Execute a read-only SQL query against the ARGO PostgreSQL database to find measurements or stats.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The SQL query to execute.' },
    },
    required: ['query'],
  },
};

const searchArgoVectorDeclaration: FunctionDeclaration = {
  name: 'search_argo_vector',
  description: 'Perform a semantic search over ARGO float summaries using ChromaDB to answer conceptual questions.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The natural language search query.' },
      n_results: { type: Type.NUMBER, description: 'Number of results to return (default 5).' },
    },
    required: ['query'],
  },
};

const getNearestFloatsDeclaration: FunctionDeclaration = {
  name: 'get_nearest_floats',
  description: 'Find the nearest ARGO floats to a specific latitude and longitude.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      lat: { type: Type.NUMBER, description: 'Latitude' },
      lon: { type: Type.NUMBER, description: 'Longitude' },
      limit: { type: Type.NUMBER, description: 'Max number of floats to return.' },
    },
    required: ['lat', 'lon'],
  },
};

export async function generateLLMResponse(userPrompt: string, context?: string): Promise<{text: string, toolCalls: any[]}> {
  const client = getClient();
  if (!client) return { text: "LLM API Key missing.", toolCalls: [] };
  
  try {
    const model = client.getGenerativeModel({ 
      model: MODEL,
      tools: [{
        functionDeclarations: [queryArgoSqlDeclaration, searchArgoVectorDeclaration, getNearestFloatsDeclaration],
      }]
    });
    
    const systemPreamble = `You are FloatChat, an assistant helping users explore ARGO ocean data. You have access to database tools. Use them to answer questions.`;
    const fullPrompt = [systemPreamble, context ? `Context:\n${context}` : '', `User:\n${userPrompt}`].filter(Boolean).join('\n\n');
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    
    const calls = response.functionCalls();
    
    return {
      text: response.text() || "I need to check the database.",
      toolCalls: calls ? calls.map(c => ({ name: c.name, args: c.args })) : []
    };
  } catch (err: any) {
    console.error('Gemini invocation failed', err?.message || err);
    return { text: "Error connecting to AI service.", toolCalls: [] };
  }
}
