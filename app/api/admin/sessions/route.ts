import { NextResponse } from 'next/server';
import { sessions } from '@/lib/chatbot/instances';

export async function GET() {
  try {
    const allSessions = sessions.getAll();
    return NextResponse.json(allSessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
