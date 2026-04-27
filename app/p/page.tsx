import React from 'react';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';
import { MapPin, Home, Layers, Building, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import PropertyFilters from '@/components/Public/PropertyFilters';

export const metadata = {
  title: 'Explore Luxury Properties | DesiProperty',
  description: 'Discover your dream home from our curated list of premium properties.',
};

export default async function PublicPropertyListingPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    ids?: string; 
    city?: string; 
    category?: string; 
    purpose?: string;
    minPrice?: string;
    maxPrice?: string;
  }> 
}) {
  const params = await searchParams;
  await connectDB();
  
  let query: any = { status: 1, availability: true };
  
  // 1. Filter by specific IDs (from Chatbot)
  if (params.ids) {
    query._id = { $in: params.ids.split(',') };
  } else {
    // 2. Location Filter
    if (params.city) {
      query.$or = [
        { city: { $regex: params.city, $options: 'i' } },
        { locality: { $regex: params.city, $options: 'i' } }
      ];
    }
    
    // 3. Category Filter
    if (params.category) {
      query.category = { $regex: params.category, $options: 'i' };
    }
    
    // 4. Purpose Filter (Sale/Rent)
    if (params.purpose) {
      query.listingPurpose = params.purpose;
    }
    
    // 5. Price Filter (Converting Lakhs to raw Rupees)
    if (params.minPrice || params.maxPrice) {
      query.price = {};
      if (params.minPrice) query.price.$gte = Number(params.minPrice) * 100000;
      if (params.maxPrice) query.price.$lte = Number(params.maxPrice) * 100000;
    }
  }

  const properties = await Property.find(query).sort({ createdAt: -1 }).lean();

  const formatPrice = (p: any) => {
    if (p.pricingType === 'range') {
      const min = p.priceType === 'Cr' ? p.minPrice : (p.minPrice / 100);
      const max = p.priceType === 'Cr' ? p.maxPrice : (p.maxPrice / 100);
      return `₹${min.toFixed(2)}-${max.toFixed(2)} Cr`;
    }
    if (p.price) {
      return `₹${(p.price / 10000000).toFixed(2)} Cr`;
    }
    return 'Price on request';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 antialiased pb-20">
      
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white pt-12 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/p" className="flex items-center gap-2 mb-10 group inline-flex">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">DP</div>
            <span className="font-extrabold text-2xl tracking-tighter">DesiProperty</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
             <div className="px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full flex items-center gap-2 backdrop-blur-md">
                <Sparkles size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-light">
                  {params.ids ? 'Tailored Selections' : 'Premium Market'}
                </span>
             </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9]">
            {params.ids ? 'Handpicked \nCollections' : 'Find Your \nPerfect Home'}
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-xl font-bold leading-relaxed">
            {params.ids 
              ? `We have curated ${properties.length} exclusive listings that match your conversation perfectly.`
              : 'Discover the most sought-after properties in the region, hand-selected for quality and value.'}
          </p>
          
          {/* Integrated Filter Component */}
          <PropertyFilters />
        </div>
      </header>

      {/* Results Section */}
      <main className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 mb-16 flex items-center justify-between">
          <p className="font-black text-slate-900 text-lg">
            {properties.length} <span className="text-slate-400 ml-1 font-bold">Properties Found</span>
          </p>
          <div className="hidden md:flex gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary-light px-4 py-2 rounded-xl border border-primary/10">Most Recent First</span>
          </div>
        </div>

        {/* Property Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {properties.map((p: any, i: number) => (
            <Link 
              key={i} 
              href={`/p/${p._id}`} 
              className="group bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 flex flex-col h-full"
            >
              <div className="relative h-72 overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.title} />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <Building size={64} strokeWidth={1} />
                  </div>
                )}
                
                {/* Status Tags */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase rounded-xl shadow-lg border border-white/50 tracking-[0.1em]">{p.category}</span>
                   <span className="px-4 py-1.5 bg-success-bg text-success-text text-[10px] font-black uppercase rounded-xl shadow-lg tracking-[0.1em] flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> VERIFIED
                   </span>
                </div>
                
                <div className="absolute bottom-6 left-6">
                   <span className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl shadow-xl tracking-[0.2em]">{p.listingPurpose === 'sale' ? 'FOR SALE' : 'FOR RENT'}</span>
                </div>
              </div>

              <div className="p-10 flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors mb-2 leading-tight tracking-tight">
                    {p.title}
                  </h3>
                  <div className="flex items-center text-slate-400 text-sm font-bold">
                    <MapPin size={16} className="mr-2 text-primary" /> {p.locality}, {p.city}
                  </div>
                </div>

                <div className="flex items-center gap-6 py-6 border-y border-gray-50 my-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary">
                       <Home size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{p.bhkType || p.bedrooms || 'N/A'} BHK</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center text-warning-text">
                       <Layers size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{p.area ? `${p.area} sqft` : 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Investment</p>
                    <p className="text-3xl font-black text-primary tracking-tighter">{formatPrice(p)}</p>
                  </div>
                  <div className="w-14 h-14 bg-primary-light rounded-[20px] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm active:scale-90">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {properties.length === 0 && (
          <div className="text-center py-40 bg-white rounded-[40px] border-4 border-dashed border-gray-100">
            <Building size={80} className="mx-auto text-gray-200 mb-8" />
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">No properties match your filters</h3>
            <p className="text-slate-400 mt-3 text-lg font-bold">Try adjusting your search criteria or explore all listings.</p>
            <Link href="/p" className="mt-10 inline-block px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 transition-all">
               Show All Listings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
