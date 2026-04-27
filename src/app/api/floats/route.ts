import floats from '../../../data/mock/floats.json';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(floats);
}
