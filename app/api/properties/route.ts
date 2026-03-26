import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';
import Admin from '@/lib/models/Admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    // Basic server-side validation
    const required = ['title', 'category', 'listingPurpose', 'priceType', 'city', 'locality'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || String(body[key]).trim() === '') {
        return NextResponse.json({ error: `Field ${key} is required.` }, { status: 400 });
      }
    }

    // Pricing validation
    if (body.pricingType === 'fixed') {
      if (!body.price || Number(body.price) <= 0) {
        return NextResponse.json({ error: 'Enter a valid price greater than 0.' }, { status: 400 });
      }
    } else if (body.pricingType === 'range') {
      if (!body.minPrice || Number(body.minPrice) <= 0) {
        return NextResponse.json({ error: 'Enter a valid minimum price greater than 0.' }, { status: 400 });
      }
      if (!body.maxPrice || Number(body.maxPrice) <= 0) {
        return NextResponse.json({ error: 'Enter a valid maximum price greater than 0.' }, { status: 400 });
      }
      if (Number(body.minPrice) >= Number(body.maxPrice)) {
        return NextResponse.json({ error: 'Minimum price must be less than maximum price.' }, { status: 400 });
      }
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
      pricingType: body.pricingType || 'fixed',
      price: body.pricingType === 'fixed' ? Number(body.price) : undefined,
      minPrice: body.pricingType === 'range' ? Number(body.minPrice) : undefined,
      maxPrice: body.pricingType === 'range' ? Number(body.maxPrice) : undefined,
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
      videos: Array.isArray(body.videos) ? body.videos.slice(0, 5) : [],
      documents: Array.isArray(body.documents) ? body.documents.slice(0, 10) : [],
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
      dynamicData: body.dynamicData || {},
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
    
    // Performance Optimization: 
    // Fetch only required fields for list view and slice massive base64 image arrays 
    // to strictly extract only the very first index (cover image) to eliminate ~95% of payload size
    const properties = await Property.find(
      { status: { $ne: 0 } },
      {
        title: 1,
        category: 1,
        listingPurpose: 1,
        price: 1,
        city: 1,
        locality: 1,
        availability: 1,
        highlights: 1,
        images: { $slice: 1 }
      }
    ).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ properties }, { status: 200 });
  } catch (err: any) {
    console.error('Fetch properties error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
