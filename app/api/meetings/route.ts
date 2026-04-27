import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MeetingRequest from '@/lib/models/MeetingRequest';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    console.log('[API/Meetings] Incoming Data:', JSON.stringify(data, null, 2));

    if (!data.propertyId || !data.fullName || !data.phone || !data.email || !data.preferredDate || !data.preferredTime) {
      return NextResponse.json({ error: 'Please provide all required fields.' }, { status: 400 });
    }

    // Check if slot is already booked
    const existingMeeting = await MeetingRequest.findOne({
      propertyId: data.propertyId,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      status: { $ne: 'Cancelled' }
    });

    if (existingMeeting) {
      return NextResponse.json({ 
        error: 'This time slot is already booked for this property. Please select another time.' 
      }, { status: 400 });
    }

    const meeting = await MeetingRequest.create({
      propertyId: data.propertyId,
      botUserId: (data.botUserId && mongoose.Types.ObjectId.isValid(data.botUserId)) ? data.botUserId : undefined,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      message: data.message || '',
    });

    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error: any) {
    console.error('Meeting Request Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to schedule meeting.' }, { status: 500 });
  }
}
