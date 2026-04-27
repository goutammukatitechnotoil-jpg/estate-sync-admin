import mongoose from 'mongoose';
import connectDB from '../lib/db';
import ChatMessage from '../lib/models/ChatMessage';
import BotUser from '../lib/models/BotUser';

async function check() {
  await connectDB();
  const count = await ChatMessage.countDocuments();
  console.log('Total ChatMessages:', count);
  
  const samples = await ChatMessage.find().limit(5).lean();
  console.log('Sample ChatMessages:', JSON.stringify(samples, null, 2));
  
  const users = await BotUser.find().limit(5).lean();
  console.log('Users:', JSON.stringify(users.map(u => ({ id: u._id, mobile: u.mobile, name: u.name })), null, 2));

  process.exit(0);
}

check();
