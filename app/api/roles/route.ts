import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Role from '@/lib/models/Role';

export const dynamic = 'force-dynamic';

// GET /api/roles - Get all roles
export async function GET() {
  try {
    await connectDB();
    const roles = await Role.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ roles }, { status: 200 });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST /api/roles - Create new role
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, permissions } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Role name must be at least 2 characters' }, { status: 400 });
    }

    // Check for duplicate name
    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }

    // Create role with default permissions if not provided
    const roleData = {
      name: name.trim(),
      permissions: permissions || {
        properties: { view: false, edit: false },
        categories: { view: false, edit: false },
        teamMembers: { view: false, edit: false }
      }
    };

    const role = await Role.create(roleData);
    return NextResponse.json({
      role,
      message: 'Role created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create role error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}