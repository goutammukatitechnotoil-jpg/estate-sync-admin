import { Metadata, ResolvingMetadata } from 'next';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;

  try {
    await connectDB();
    const property = await Property.findById(id).lean();

    if (!property) {
      return {
        title: 'Property Not Found',
      };
    }

    const title = `${property.title} | ${property.locality}, ${property.city}`;
    const description = property.propertyDescription 
      || `Premium ${property.category} available in ${property.locality}. ${property.area ? property.area + ' sqft.' : ''}`;
    
    const imageUrl = property.images && property.images.length > 0 
      ? property.images[0] 
      : 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80';

    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: property.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Property Details',
    };
  }
}

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
