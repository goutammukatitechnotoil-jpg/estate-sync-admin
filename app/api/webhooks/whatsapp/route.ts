import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const challenge = searchParams.get('hub.challenge');
  const token = searchParams.get('hub.verify_token');

  console.log('Webhook GET request params:', { mode, challenge, token, url: req.url });

  // For Sensy AI, accept verification if mode is subscribe
  if (mode === 'subscribe' && challenge) {
    console.log('WEBHOOK_VERIFIED');
    const response = new Response(challenge, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

    // Check if the webhook request contains a message
    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach((entry: any, entryIndex: number) => {
        console.log(`\n📬 Entry ${entryIndex}:`, entry.id);
        
        entry.changes.forEach((change: any, changeIndex: number) => {
          console.log(`  📌 Change ${changeIndex} - Field: ${change.field}`);
          
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            console.log(`  💬 Messages count: ${messages.length}`);
            
            messages.forEach((message: any, msgIndex: number) => {
              console.log(`\n    Message ${msgIndex}:`);
              console.log(`    - ID: ${message.id}`);
              console.log(`    - From: ${message.from}`);
              console.log(`    - Type: ${message.type}`);
              console.log(`    - Timestamp: ${message.timestamp}`);
              console.log(`    - Full Message:`, JSON.stringify(message, null, 2));
            });
          }
        });
      });
    }

    // Return a '200 OK' response to all requests
    const response = NextResponse.json({ status: 'ok' }, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}