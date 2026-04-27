import { NextRequest, NextResponse } from 'next/server';
import { processWhatsAppMessage } from '@/lib/chatbot/mongoBotService';

/**
 * AiSensy Webhook Handler (MongoDB Integrated)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[AiSensy Webhook] Incoming:', JSON.stringify(body));

    // Extraction based on actual AiSensy payload structure
    const messageData = body.data?.message || body.message || body;
    
    // Handle Status Updates (Resolved/Intervened)
    if (body.topic === 'chat.resolved' || body.topic === 'chat.intervened') {
      const mobile = body.data?.phone_number || body.data?.waId;
      if (mobile) {
        const BotUser = (await import('@/lib/models/BotUser')).default;
        await BotUser.updateOne({ mobile }, { isIntervened: body.topic === 'chat.intervened' });
        console.log(`[AiSensy Webhook] Chat ${body.topic} for ${mobile}`);
      }
    }

    // Check if it's a message from the user
    if (messageData && (messageData.sender === 'USER' || !messageData.sender)) {
      const mobile = messageData.phone_number || messageData.from || messageData.waId;
      const text = messageData.message_content?.text || messageData.text?.body || messageData.body || '';
      const messageId = messageData.messageId || messageData.id;

      if (mobile) {
        // Run in background but handle errors
        processWhatsAppMessage(mobile, text, messageId).catch(err => 
          console.error('[AiSensy Webhook] Error processing message:', err)
        );
      }
    }

    const response = NextResponse.json({ status: 'ok' }, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error('[AiSensy Webhook] Global Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active' });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-AiSensy-Project-API-Pwd',
    },
  });
}
