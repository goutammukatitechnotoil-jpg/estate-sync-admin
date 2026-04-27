import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import MeetingRequest from '@/lib/models/MeetingRequest';
import Property from '@/lib/models/Property';
import BotUser from '@/lib/models/BotUser';
import TeamMember from '@/lib/models/TeamMember';

export async function GET() {
  try {
    await connectDB();
    
    // Ensure models are registered (especially for populate)
    if (!mongoose.models.Property) mongoose.model('Property', Property.schema);
    if (!mongoose.models.BotUser) mongoose.model('BotUser', BotUser.schema);
    if (!mongoose.models.TeamMember) mongoose.model('TeamMember', TeamMember.schema);

    // Fetch all meetings and populate property and bot user details
    const appointments = await MeetingRequest.find()
      .populate('propertyId', 'title locality city images price assignedAgentId')
      .populate('botUserId', 'name mobile leadStatus')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all team members to map them to properties
    const teamMembers = await TeamMember.find({}, 'fullName mobileNumber').lean();
    console.log(`[API/Appointments] Found ${teamMembers.length} team members`);
    
    const teamMap = new Map();
    teamMembers.forEach(m => {
      teamMap.set(m._id.toString(), m);
      // Also index by string representation just in case
      teamMap.set(String(m._id), m);
    });

    // Attach agent info to each appointment
    const enrichedAppointments = appointments.map((app: any) => {
      const agentId = app.propertyId?.assignedAgentId;
      console.log(`[API/Appointments] Property: ${app.propertyId?.title}, AgentID: ${agentId}`);
      
      let agent = null;
      if (agentId) {
        const idStr = agentId.toString();
        agent = teamMap.get(idStr);
      }
      
      console.log(`[API/Appointments] Match Found: ${agent ? agent.fullName : 'NO'}`);
      
      return {
        ...app,
        agent: agent ? { fullName: agent.fullName, mobile: agent.mobileNumber } : null
      };
    });

    return NextResponse.json({ appointments: enrichedAppointments }, { status: 200 });
  } catch (error: any) {
    console.error('[API/Admin/Appointments] Detailed Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch appointments', 
      details: error.message 
    }, { status: 500 });
  }
}
