import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatMessage from '@/lib/models/ChatMessage';
import BotUser from '@/lib/models/BotUser';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const params = await props.params;
    const id = params.id;
    
    const user = await BotUser.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Normalize mobile for matching
    const cleanMobile = user.mobile.replace(/\D/g, '');
    let mobileVars = [user.mobile, cleanMobile];
    
    // Add variations with and without +
    mobileVars.forEach(m => {
      if (m.startsWith('+')) mobileVars.push(m.substring(1));
      else mobileVars.push('+' + m);
    });
    // Add variations with and without country code if 10 digits
    if (cleanMobile.length === 10) {
      mobileVars.push('91' + cleanMobile);
      mobileVars.push('+91' + cleanMobile);
    }
    
    // Deduplicate
    mobileVars = Array.from(new Set(mobileVars));
    
    // 1. Get from MongoDB
    const mongoChats = await ChatMessage.find({
      $or: [
        { userId: id },
        { mobile: { $in: mobileVars } }
      ]
    })
      .sort({ timestamp: 1 })
      .lean();

    // 2. Get from sessions.json
    let fileChats: any[] = [];
    try {
      const storagePath = path.join(process.cwd(), 'storage', 'sessions.json');
      if (fs.existsSync(storagePath)) {
        const fileData = fs.readFileSync(storagePath, 'utf8');
        const sessions = JSON.parse(fileData);
        
        // Find match in sessions.json
        for (const m of mobileVars) {
          if (sessions[m]?.history) {
            fileChats = sessions[m].history.map((h: any) => ({
              message: h.role === 'user' ? h.text : '',
              response: h.role === 'assistant' ? h.text : '',
              timestamp: h.at || new Date().toISOString()
            }));
            break;
          }
        }
      }
    } catch (e) {
      console.error('Error reading sessions.json:', e);
    }

    // 3. Merge and Sort
    const allChats = [...mongoChats, ...fileChats].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json({ chats: allChats }, { status: 200 });
  } catch (error) {
    console.error('[Leads Chat API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
