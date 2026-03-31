import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Role from '@/lib/models/Role';

export const dynamic = 'force-dynamic';

// GET /api/roles/[id] - Get single role
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const role = await Role.findById(id).lean();
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ role }, { status: 200 });
  } catch (error) {
    console.error('Get role error:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, status, permissions } = body;

    // Validation
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ error: 'Role name cannot be empty' }, { status: 400 });
    }

    if (name !== undefined && name.trim().length < 2) {
      return NextResponse.json({ error: 'Role name must be at least 2 characters' }, { status: 400 });
    }

    if (status && !['Active', 'Inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Check for duplicate name (excluding current role)
    if (name) {
      const existingRole = await Role.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingRole) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status;
    if (permissions !== undefined) updateData.permissions = permissions;

    const role = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({
      role,
      message: 'Role updated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update role error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete role (soft delete by setting status to inactive)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if role is being used by any team members
    const TeamMember = (await import('@/lib/models/TeamMember')).default;
    const teamMemberCount = await TeamMember.countDocuments({ roleId: id });

    if (teamMemberCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete role as it is assigned to team members. Deactivate it instead.'
      }, { status: 400 });
    }

    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Role deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}