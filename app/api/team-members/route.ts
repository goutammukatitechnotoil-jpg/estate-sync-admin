import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TeamMember from '@/lib/models/TeamMember';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');

    let query: any = {};
    if (statusFilter === 'active') {
      query.status = 'Active';
    } else if (statusFilter === 'inactive') {
      query.status = 'Inactive';
    }

    const teamMembers = await TeamMember.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ teamMembers }, { status: 200 });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { fullName, mobileNumber, email, role } = body;

    // Validation
    if (!fullName || fullName.trim() === '') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!mobileNumber || mobileNumber.trim() === '') {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    // Validate mobile number format
    if (!/^\+91\d{10}$/.test(mobileNumber)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit mobile number in format: +91XXXXXXXXXX' }, { status: 400 });
    }

    if (!email || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: 'Please select role' }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await TeamMember.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email address already exists' }, { status: 400 });
    }

    // Check if mobile number already exists
    const existingMobile = await TeamMember.findOne({ mobileNumber: mobileNumber.trim() });
    if (existingMobile) {
      return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 });
    }

    const newTeamMember = await TeamMember.create({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.toLowerCase().trim(),
      role: role,
      status: 'Active' // Default to Active
    });

    return NextResponse.json({
      message: 'Team member added successfully',
      teamMember: newTeamMember
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create team member error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({
        error: `${field === 'email' ? 'Email' : 'Mobile number'} already exists`
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}