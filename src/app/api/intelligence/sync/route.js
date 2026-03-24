import { NextResponse } from 'next/server';
import { syncIntelligence } from '../../../../lib/intelligence/core';

export async function POST() {
  try {
    const insight = await syncIntelligence();
    return NextResponse.json(insight);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Allow GET for quick manual refresh if needed
  try {
    const insight = await syncIntelligence();
    return NextResponse.json(insight);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
