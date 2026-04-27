import { NextRequest, NextResponse } from 'next/server';
import { sessions, whatsapp } from '@/lib/chatbot/instances';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params;
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Message text required' }, { status: 400 });
    }

    console.log(`Admin sending manual message to ${chatId}: ${text}`);
    
    // 1. Send via WhatsApp
    await whatsapp.sendMessage(chatId, text);
    
    // 2. Record in history
    sessions.pushHistory(chatId, 'admin', text);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
