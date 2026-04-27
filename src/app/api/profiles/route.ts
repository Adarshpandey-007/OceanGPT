import profiles from '../../../data/mock/profiles.json';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(profiles);
}
