import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const property = await Property.findById(id).lean();
    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }
    return NextResponse.json({ property }, { status: 200 });
  } catch (error) {
    console.error('Get property error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const rawUpdates = await req.json();
    
    // Map frontend aliases to DB schema names
    const updates: any = { ...rawUpdates };
    if (updates.propertyArea !== undefined) {
      if (updates.propertyArea !== null) updates.area = Number(updates.propertyArea);
      delete updates.propertyArea;
    }
    if (updates.furnishingStatus !== undefined) {
      updates.furnishing = updates.furnishingStatus;
      delete updates.furnishingStatus;
    }
    if (updates.facingDirection !== undefined) {
      updates.facing = updates.facingDirection;
      delete updates.facingDirection;
    }
    if (updates.googleMapsLink !== undefined) {
      updates.mapLink = updates.googleMapsLink;
      delete updates.googleMapsLink;
    }
    if (updates.videoTourLink !== undefined) {
      updates.videoLink = updates.videoTourLink;
      delete updates.videoTourLink;
    }
    if (updates.images !== undefined) {
      updates.images = Array.isArray(updates.images) ? updates.images.slice(0, 10) : [];
    }
    if (updates.videos !== undefined) {
      updates.videos = Array.isArray(updates.videos) ? updates.videos.slice(0, 5) : [];
    }
    if (updates.documents !== undefined) {
      updates.documents = Array.isArray(updates.documents) ? updates.documents.slice(0, 10) : [];
    }

    // Prevent invalid updates
    const forbidden = ['_id', 'createdAt', 'updatedAt'];
    forbidden.forEach((key) => delete updates[key]);

    const updated = await Property.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Property updated successfully.', property: updated }, { status: 200 });
  } catch (error) {
    console.error('Update property error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Soft delete: set status to 0 instead of removing the document
    const updated = await Property.findByIdAndUpdate(id, { status: 0 }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Property deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Delete property error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
