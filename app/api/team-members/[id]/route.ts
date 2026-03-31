import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TeamMember from '@/lib/models/TeamMember';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const teamMember = await TeamMember.findById(id)
      .populate('roleId', 'name status permissions')
      .lean();
    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }
    
    // Ensure roleId is returned as string for form compatibility
    const responseData = {
      ...teamMember,
      roleId: teamMember.roleId && typeof teamMember.roleId === 'object' 
        ? (teamMember.roleId as any)._id?.toString() || teamMember.roleId.toString()
        : teamMember.roleId?.toString() || teamMember.roleId
    };
    
    return NextResponse.json({ teamMember: responseData }, { status: 200 });
  } catch (error) {
    console.error('Get team member error:', error);
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { fullName, mobileNumber, email, roleId, status } = body;

    // For status-only updates (from toggle), we don't need other validations
    if (status && !fullName) {
      // Status toggle request - only validate status
      if (!['Active', 'Inactive'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    } else {
      // Full update request - validate all fields
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

      if (!roleId) {
        return NextResponse.json({ error: 'Please select a role' }, { status: 400 });
      }

      // Check if role exists and is active
      const Role = (await import('@/lib/models/Role')).default;
      const role = await Role.findById(roleId);
      if (!role || role.status !== 'Active') {
        return NextResponse.json({ error: 'Selected role is not available' }, { status: 400 });
      }

      // Check if email already exists (excluding current user)
      const existingEmail = await TeamMember.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email address already exists' }, { status: 400 });
      }

      // Check if mobile number already exists (excluding current user)
      const existingMobile = await TeamMember.findOne({
        mobileNumber: mobileNumber.trim(),
        _id: { $ne: id }
      });
      if (existingMobile) {
        return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (mobileNumber) updateData.mobileNumber = mobileNumber.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (roleId) updateData.roleId = roleId;
    if (status) updateData.status = status;

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('roleId', 'name status permissions');

    if (!updatedTeamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Team member updated successfully',
      teamMember: updatedTeamMember
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update team member error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({
        error: `${field === 'email' ? 'Email' : 'Mobile number'} already exists`
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedTeamMember = await TeamMember.findByIdAndUpdate(
      id,
      { status: 'Inactive' },
      { new: true }
    );

    if (!deletedTeamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Team member deactivated successfully',
      teamMember: deletedTeamMember
    }, { status: 200 });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: 'Failed to deactivate team member' }, { status: 500 });
  }
}