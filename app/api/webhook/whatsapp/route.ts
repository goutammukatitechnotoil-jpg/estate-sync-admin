import { NextRequest, NextResponse } from 'next/server';
import { processWhatsAppMessage } from '@/lib/chatbot/mongoBotService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // AiSensy standard payload extraction
    const message = body.message || body;
    const mobile = message.from || message.wa_id || (body.contacts && body.contacts[0]?.wa_id);
    const text = message.text?.body || message.body || '';
    const messageId = message.messageId || message.id;
    const contextId = message.context?.id || message.context?.message_id;

    console.log(`[Webhook] Received from ${mobile}: "${text}" (Context: ${contextId})`);
    
    if (!mobile) {
      console.error('[Webhook] Missing mobile in payload:', JSON.stringify(body));
      return NextResponse.json({ error: 'Missing mobile' }, { status: 400 });
    }

    // Background processing to prevent webhook timeout
    processWhatsAppMessage(mobile, text, messageId, contextId).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active' });
}
