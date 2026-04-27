import { NextResponse } from 'next/server';
const { indexProperties } = require('@/lib/chatbot/indexProperties');

export async function POST() {
  try {
    const result = await indexProperties();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Reindex error:', error);
    return NextResponse.json({ error: 'Indexing failed' }, { status: 500 });
  }
}
