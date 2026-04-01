import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';

const normalizeValue = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
};

const normalizeFurnishingStatus = (value: any): string | undefined => {
  const v = normalizeValue(value);
  if (!v) return undefined;
  const str = v.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  if (['furnished', 'fullyfurnished'].includes(str)) return 'Furnished';
  if (['semifurnished', 'semifurnished'].includes(str)) return 'Semi-Furnished';
  if (['unfurnished'].includes(str)) return 'Unfurnished';
  return undefined;
};

const normalizePropertyAge = (value: any): string | undefined => {
  const v = normalizeValue(value);
  if (!v) return undefined;
  const str = v.toLowerCase().replace(/\s+/g, '').replace(/[–—]/g, '-');
  if (['underconstruction', 'under-construction'].includes(str)) return 'Under Construction';
  if (['new(0-1years)', 'new(0–1years)', '0-1years', '0–1years', '0to1years'].includes(str)) return 'New (0–1 years)';
  if (['1-5years', '1–5years', '1to5years', '1to5'].includes(str)) return '1–5 years';
  if (['5-10years', '5–10years', '5to10years', '5to10'].includes(str)) return '5–10 years';
  if (['10+years', '10years', '10plusyears', '10+'].includes(str)) return '10+ years';
  return undefined;
};

const normalizeFacingDirection = (value: any): string | undefined => {
  const v = normalizeValue(value);
  if (!v) return undefined;
  const str = v.toLowerCase().replace(/\s+/g, '').replace(/[–—]/g, '-');
  if (['north', 'n'].includes(str)) return 'North';
  if (['south', 's'].includes(str)) return 'South';
  if (['east', 'e'].includes(str)) return 'East';
  if (['west', 'w'].includes(str)) return 'West';
  if (['north-east', 'northeast', 'ne'].includes(str)) return 'North-East';
  if (['north-west', 'northwest', 'nw'].includes(str)) return 'North-West';
  if (['south-east', 'southeast', 'se'].includes(str)) return 'South-East';
  if (['south-west', 'southwest', 'sw'].includes(str)) return 'South-West';
  return undefined;
};

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
      const normalized = normalizeFurnishingStatus(updates.furnishingStatus);
      if (normalized) {
        updates.furnishing = normalized;
      } else {
        updates.furnishing = String(updates.furnishingStatus).trim();
      }
      delete updates.furnishingStatus;
    }
    if (updates.facingDirection !== undefined) {
      const normalized = normalizeFacingDirection(updates.facingDirection);
      if (normalized) {
        updates.facing = normalized;
      } else {
        updates.facing = String(updates.facingDirection).trim();
      }
      delete updates.facingDirection;
    }
    if (updates.propertyAge !== undefined) {
      const normalized = normalizePropertyAge(updates.propertyAge);
      if (normalized) {
        updates.propertyAge = normalized;
      } else {
        updates.propertyAge = String(updates.propertyAge).trim();
      }
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
