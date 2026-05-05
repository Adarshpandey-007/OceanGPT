import { NextResponse } from 'next/server';

export async function GET() {
  const hasLLM = typeof process.env.NEXT_PUBLIC_GEMINI_PRESENT !== 'undefined' || !!process.env.GEMINI_API_KEY;
  const realProfileSource = process.env.NEXT_PUBLIC_REAL_PROFILE_SOURCE || process.env.REAL_PROFILE_SOURCE || 'cache';

  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasLLM,
      realProfileSource
    }
  });
}
