import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/lib/models/Category';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Added to explicitly bypass cache

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    const fieldsParam = url.searchParams.get('fields');

    let query: any = { status: { $ne: 0 } }; // Default: all non-deleted
    if (statusFilter === 'active') {
      query = { status: 1 };
    }

    let dbQuery = Category.find(query).sort({ createdAt: -1 });

    // If specific fields are requested, select only those
    if (fieldsParam) {
      const fields = fieldsParam.split(',').map(f => f.trim());
      dbQuery = dbQuery.select(fields.join(' '));
    }

    const categories = await dbQuery.lean();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, fields, status } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Check if category exists
    const existing = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i'), status: 1 });
    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const newCategory = await Category.create({ name: name.trim(), fields: fields || [], status: status !== undefined ? status : 1 });
    return NextResponse.json({ message: 'Category created', category: newCategory }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
