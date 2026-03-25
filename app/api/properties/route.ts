import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';
import Admin from '@/lib/models/Admin';

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    // Basic server-side validation
    const required = ['title', 'category', 'listingPurpose', 'price', 'priceType', 'city', 'locality'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || String(body[key]).trim() === '') {
        return NextResponse.json({ error: `Field ${key} is required.` }, { status: 400 });
      }
    }

    if (Number(body.price) <= 0) {
      return NextResponse.json({ error: 'Enter a valid price greater than 0.' }, { status: 400 });
    }

    // images validation (array of data URLs)
    const images = Array.isArray(body.images) ? body.images.slice(0, 10) : [];
    if (images.length < 1) {
      return NextResponse.json({ error: 'At least one property image is required.' }, { status: 400 });
    }

    const propertyData: any = {
      title: body.title,
      category: body.category,
      listingPurpose: body.listingPurpose,
      price: Number(body.price),
      priceType: body.priceType,
      city: body.city,
      locality: body.locality,
      address: body.address || '',
      mapLink: body.mapLink || body.googleMapsLink || '',
      area: (body.area !== undefined && body.area !== '') ? Number(body.area) : ((body.propertyArea !== undefined && body.propertyArea !== '') ? Number(body.propertyArea) : undefined),
      furnishing: body.furnishing || body.furnishingStatus || undefined,
      propertyAge: body.propertyAge || undefined,
      facing: body.facing || body.facingDirection || undefined,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      images,
      videoLink: body.videoLink || body.videoTourLink || undefined,
      availability: body.availability === false ? false : true,
      status: 1, // active by default
      bhkType: body.bhkType || undefined,
      propertyFloorNumber: body.propertyFloorNumber !== undefined && body.propertyFloorNumber !== '' ? Number(body.propertyFloorNumber) : undefined,
      totalFloorsInBuilding: body.totalFloorsInBuilding !== undefined && body.totalFloorsInBuilding !== '' ? Number(body.totalFloorsInBuilding) : undefined,
      bedrooms: body.bedrooms !== undefined && body.bedrooms !== '' ? Number(body.bedrooms) : undefined,
      numberOfFloors: body.numberOfFloors !== undefined && body.numberOfFloors !== '' ? Number(body.numberOfFloors) : undefined,
      plotArea: body.plotArea !== undefined && body.plotArea !== '' ? Number(body.plotArea) : undefined,
      commercialType: body.commercialType || undefined,
      floorNumber: body.floorNumber !== undefined && body.floorNumber !== '' ? Number(body.floorNumber) : undefined,
      propertyDescription: body.propertyDescription || undefined,
    };

    const created = await Property.create(propertyData);

    return NextResponse.json({ message: 'Property added successfully.', property: created }, { status: 201 });
  } catch (err: any) {
    console.error('Create property error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const properties = await Property.find({ status: { $ne: 0 } }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ properties }, { status: 200 });
  } catch (err: any) {
    console.error('Fetch properties error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
