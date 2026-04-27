import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatMessage from '@/lib/models/ChatMessage';
import BotUser from '@/lib/models/BotUser';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    await connectDB();
    if (!mongoose.connection.db) {
      throw new Error("Database not connected");
    }
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    const dbNames = dbs.databases.map((d: any) => d.name);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const users = await BotUser.find().lean();
    const stats: any[] = [];
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      stats.push({ name: coll.name, count });
    }
    
    const chats = await ChatMessage.find().sort({ timestamp: -1 }).limit(100).lean();
    const chatsessions = await mongoose.connection.db.collection('chatsessions').find().limit(5).toArray();

    let sessionKeys: string[] = [];
    let sessionFound = false;
    try {
      const storagePath = path.join(process.cwd(), 'storage', 'sessions.json');
      sessionFound = fs.existsSync(storagePath);
      if (sessionFound) {
        const fileData = fs.readFileSync(storagePath, 'utf8');
        const sessions = JSON.parse(fileData);
        sessionKeys = Object.keys(sessions);
      }
    } catch (e: any) {
      console.error('Debug session read error:', e.message);
    }

    return NextResponse.json({
      dbNames,
      sessionFound,
      sessionKeys,
      collectionStats: stats,
      users: users.map(u => ({ id: u._id, mobile: u.mobile, name: u.name, clean: u.mobile.replace(/\D/g, '') })),
      recentChats: chats.map(c => ({
        mobile: c.mobile,
        message: c.message,
        timestamp: c.timestamp
      })),
      chatsessions: chatsessions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
