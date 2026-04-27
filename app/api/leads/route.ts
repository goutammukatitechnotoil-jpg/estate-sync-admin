import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BotUser from '@/lib/models/BotUser';
import Property from '@/lib/models/Property';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    console.log('[Leads API] Querying collection:', BotUser.collection.name);
    
    // Fetch users and populate their last property interest
    const users = await BotUser.find({})
      .sort({ updatedAt: -1 })
      .populate({
        path: 'lastPropertyInterest',
        model: Property,
        select: 'title locality price',
        options: { strictPopulate: false } // Bypass strict schema check for cached models
      })
      .lean();

    console.log(`[Leads API] Found ${users.length} users`);
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
