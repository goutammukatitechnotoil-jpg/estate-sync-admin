import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/lib/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await Category.findById(id).lean();
    if (!category || category.status === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, fields, status } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const existing = await Category.findOne({ _id: { $ne: id }, name: new RegExp(`^${name.trim()}$`, 'i'), status: { $ne: 0 } });
    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { name: name.trim(), fields: fields || [], status: status !== undefined ? status : 1 },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category updated', category: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Category.findByIdAndUpdate(id, { status: 0 }, { new: true });
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
