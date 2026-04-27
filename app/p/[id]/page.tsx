'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Maximize,
  Calendar,
  Phone,
  ShieldCheck,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Trees,
  Zap,
  Wind,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Layers,
  Star,
  Layout,
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Briefcase,
  Compass,
  Home as HomeIcon,
  PlayCircle,
  X,
  Mail,
  MessageSquare
} from 'lucide-react';

interface Property {
  _id: any;
  title: string;
  category: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  pricingType: string;
  priceType: string;
  city: string;
  locality: string;
  address?: string;
  area?: number;
  plotArea?: number;
  furnishing?: string;
  propertyAge?: string;
  facing?: string;
  highlights: string[];
  amenities: string[];
  images: string[];
  videos?: string[];
  videoLink?: string;
  propertyDescription?: string;
  bhkType?: string;
  bedrooms?: number;
  propertyFloorNumber?: number;
  totalFloorsInBuilding?: number;
  numberOfFloors?: number;
  assignedAgentId?: string;
  commercialType?: string;
  floorNumber?: number;
  siteVisitAllowed?: boolean;
  visitTimings?: string;
  listingPurpose?: string;
  availability?: boolean;
}

interface Agent {
  _id: string;
  fullName: string;
  roleId?: { name: string };
  email?: string;
  phone?: string;
  mobileNumber?: string;
}

function PropertyPageContent({ params }: { params: Promise<{ id: string }> }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [showMoreDesc, setShowMoreDesc] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const searchParams = useSearchParams();
  const botUserId = searchParams.get('uid');
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, [botUserId]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          propertyId: property._id,
          botUserId: botUserId
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionStatus({ type: 'success', message: 'Meeting scheduled successfully!' });
        setTimeout(() => {
          setIsMeetingModalOpen(false);
          setSubmissionStatus(null);
          setFormData({
            fullName: '',
            phone: '',
            email: '',
            preferredDate: '',
            preferredTime: '',
            message: ''
          });
        }, 2000);
      } else {
        setSubmissionStatus({ type: 'error', message: data.error || 'Failed to schedule meeting' });
      }
    } catch (err) {
      console.error(err);
      setSubmissionStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const id = (await params).id;
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();
        if (data.property) {
          setProperty(data.property);
          if (data.agent) setAgent(data.agent);
          if (data.relatedProperties) setRelatedProperties(data.relatedProperties);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  if (!property) return null;

  const mediaItems: { type: 'image' | 'video' | 'youtube', url: string }[] = [];
  if (property.images && property.images.length > 0) {
    property.images.forEach(img => mediaItems.push({ type: 'image', url: img }));
  }
  if (property.videos && property.videos.length > 0) {
    property.videos.forEach(vid => mediaItems.push({ type: 'video', url: vid }));
  }
  if (property.videoLink) {
    mediaItems.push({ type: 'youtube', url: property.videoLink });
  }

  // Fallback if empty
  if (mediaItems.length === 0) {
    mediaItems.push({ type: 'image', url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80" });
  }

  const formatPrice = (p: any) => {
    if (p.pricingType === 'range') {
      const min = p.priceType === 'Cr' ? p.minPrice : (p.minPrice / 100);
      const max = p.priceType === 'Cr' ? p.maxPrice : (p.maxPrice / 100);
      return `₹${min.toFixed(2)}-${max.toFixed(2)} Cr`;
    }
    if (p.price) {
      return `₹${(p.price / 10000000).toFixed(2)} Cr`;
    }
    return 'Price on Request';
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const generateDynamicDescription = (p: Property) => {
    if (p.propertyDescription) return p.propertyDescription;

    const category = p.category || 'property';
    const type = p.commercialType || p.bhkType || category;
    const location = [p.locality, p.city].filter(Boolean).join(', ');
    const size = p.plotArea || p.area ? `${p.plotArea || p.area} sqft` : '';

    let desc = `Experience premium space in this stunning ${type} located in the prime area of ${location}.`;

    if (size) {
      desc += ` Spanning across a generous ${size}, this ${category.toLowerCase()} features a well-thought-out layout designed for maximum utility and comfort.`;
    }

    if (p.furnishing) {
      desc += ` The property comes ${p.furnishing.toLowerCase()} and is equipped with necessary fittings.`;
    }

    if (p.category === 'Commercial' || p.category === 'Office' || p.category === 'Shop') {
      desc += ` It is ideally suited for businesses looking for an excellent strategic location with top-tier professional surroundings and easy accessibility.`;
    } else {
      desc += ` It offers an exceptional living experience, situated in a highly desirable neighborhood with great connectivity to major landmarks, schools, and hospitals.`;
    }

    if (p.amenities && p.amenities.length > 0) {
      desc += ` Occupants will also benefit from premium amenities including ${p.amenities.slice(0, 3).join(', ')}.`;
    }

    return desc;
  };

  const getSpecs = (p: Property) => {
    const specs = [];

    if (p.category === 'Commercial' || p.category?.toLowerCase().includes('office') || p.category?.toLowerCase().includes('shop')) {
      if (p.commercialType) specs.push({ label: 'Type', value: p.commercialType, icon: Briefcase });
      else specs.push({ label: 'Type', value: p.category, icon: Briefcase });

      if (p.floorNumber) specs.push({ label: 'Floor', value: `${p.floorNumber}${getOrdinal(p.floorNumber)} Floor`, icon: Layers });
    } else {
      if (p.bhkType) specs.push({ label: 'Type', value: p.bhkType, icon: Layout });
      else if (p.bedrooms) specs.push({ label: 'Type', value: `${p.bedrooms} BHK`, icon: Layout });
      else specs.push({ label: 'Category', value: p.category, icon: Layout });

      if (p.propertyFloorNumber) specs.push({ label: 'Floor', value: `${p.propertyFloorNumber}${getOrdinal(p.propertyFloorNumber)} Floor`, icon: Layers });
    }

    if (p.plotArea || p.area) specs.push({ label: 'Area', value: `${p.plotArea || p.area} sqft`, icon: Maximize });
    if (p.facing) specs.push({ label: 'Facing', value: p.facing, icon: Compass });
    if (p.propertyAge) specs.push({ label: 'Age', value: p.propertyAge, icon: Calendar });
    if (p.furnishing) specs.push({ label: 'Furnishing', value: p.furnishing, icon: HomeIcon });
    if (p.listingPurpose) specs.push({ label: 'Purpose', value: p.listingPurpose, icon: Key });
    if (p.visitTimings) specs.push({ label: 'Visits', value: p.visitTimings, icon: Clock });

    return specs.slice(0, 4);
  };

  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wifi')) return Wifi;
    if (n.includes('park')) return Car;
    if (n.includes('gym')) return Dumbbell;
    if (n.includes('security')) return ShieldCheck;
    if (n.includes('pool')) return Waves;
    if (n.includes('garden')) return Trees;
    if (n.includes('power')) return Zap;
    if (n.includes('ac') || n.includes('air')) return Wind;
    if (n.includes('shop') || n.includes('center')) return ShoppingBag;
    return CheckCircle2;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 antialiased font-sans pb-32">
      <main className="max-w-7xl mx-auto px-6 md:px-10 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-4">
              <div className="relative aspect-[16/9] w-full rounded-[1rem] overflow-hidden bg-black shadow-sm border border-gray-100 group">
                {mediaItems[activeImage].type === 'image' && (
                  <Image
                    src={mediaItems[activeImage].url}
                    alt={property.title}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
                {mediaItems[activeImage].type === 'video' && (
                  <video
                    src={mediaItems[activeImage].url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  ></video>
                )}
                {mediaItems[activeImage].type === 'youtube' && (
                  <iframe
                    src={mediaItems[activeImage].url.includes('watch?v=') ? mediaItems[activeImage].url.replace('watch?v=', 'embed/') : mediaItems[activeImage].url}
                    className="w-full h-full border-0"
                    allowFullScreen
                  ></iframe>
                )}

                <div className="absolute top-8 right-8 z-10 bg-black/40 backdrop-blur-md text-white px-5 py-2 rounded-full text-xs font-black pointer-events-none">
                  {activeImage + 1} / {mediaItems.length}
                </div>
                {mediaItems.length > 1 && (
                  <>
                    <button onClick={() => setActiveImage(prev => Math.max(0, prev - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-10">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => setActiveImage(prev => Math.min(mediaItems.length - 1, prev + 1))} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-10">
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-4 overflow-x-auto py-1 px-2 scrollbar-hide">
                {mediaItems.map((media, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-28 h-20 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 border-2 transition-all duration-300 ${activeImage === i ? 'border-[#7c3aed] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    {media.type === 'image' ? (
                      <Image src={media.url} alt="Thumb" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/80">
                        <PlayCircle size={32} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
                <span className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  New
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-3xl">
                {property.title}
              </h1>
              <div className="flex items-center gap-3 text-slate-500 font-bold text-lg">
                <MapPin size={22} className="text-[#7c3aed]" />
                <span>{property.locality}, {property.city}</span>
              </div>

              <div className="pt-1">
                <p className="text-3xl font-black text-[#7c3aed] tracking-tighter">{formatPrice(property)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {getSpecs(property).map((spec, i) => (
                <div key={i} className="bg-gray-100 rounded-[1rem] p-6 border border-slate-100 flex items-center gap-5 shadow-sm">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-[#7c3aed]">
                    <spec.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{spec.label}</p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">About Property</h2>
              <p className={`text-slate-500 text-lg leading-relaxed max-w-4xl font-medium ${showMoreDesc ? '' : 'line-clamp-3 md:line-clamp-4'}`}>
                {generateDynamicDescription(property)}
              </p>
              <button
                onClick={() => setShowMoreDesc(!showMoreDesc)}
                className="text-[#7c3aed] text-sm font-black hover:underline flex items-center gap-1"
              >
                {showMoreDesc ? 'Show less' : 'Show more'}
                {showMoreDesc ? <ChevronLeft size={18} className="rotate-90" /> : <ChevronDown size={18} />}
              </button>
            </div>

            {property.highlights && property.highlights.length > 0 && (
              <div className="space-y-4 pt-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Highlights</h2>
                <div className="flex flex-wrap gap-3">
                  {property.highlights.map((item, idx) => (
                    <div key={`highlight-${idx}`} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg border border-slate-200 w-fit hover:border-[#7c3aed]/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                      <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center text-[#7c3aed] group-hover:scale-110 transition-transform">
                        <Zap size={22} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-5 pt-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {property.amenities.map((item, idx) => {
                    const Icon = getAmenityIcon(item);
                    return (
                      <div
                        key={`amenity-${idx}`}
                        className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg border border-slate-200 w-fit hover:border-[#7c3aed]/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all"
                      >
                        <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center text-[#7c3aed] group-hover:scale-110 transition-transform">
                          <Icon size={18} strokeWidth={2} />
                        </div>

                        <span className="text-sm font-semibold text-slate-800">
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {property.amenities.map((item, idx) => {
                    const Icon = getAmenityIcon(item);
                    return (
                      <div key={`amenity-${idx}`} className="bg-gray-100 rounded-[1rem] p-4 border border-slate-100 flex items-center gap-5 group hover:border-[#7c3aed]/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-[#7c3aed] group-hover:scale-110 transition-transform">
                          <Icon size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-black text-slate-700 capitalize tracking-tight">{item}</span>
                      </div>
                    );
                  })}
                </div> */}
              </div>
            )}

            <div className="space-y-5 pt-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agent Details</h2>
              <div className="bg-gray-100 rounded-[1rem] p-5 border border-slate-100 flex flex-col md:flex-row items-center gap-10 shadow-sm">
                <div className="w-24 h-24 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white">
                  {agent?.fullName?.split(' ').map(n => n[0]).join('') || ''}
                </div>
                <div className="flex-1 text-center md:text-left space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{agent?.fullName || 'Not defined'}</h3>
                    <CheckCircle2 size={24} fill="#3b82f6" className="text-white" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{agent?.roleId?.name || '-'}</p>
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={18} fill="currentColor" />
                      <span className="text-lg font-black text-slate-900">0.0</span>
                    </div>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">(0 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {relatedProperties.length > 0 && (
              <div className="space-y-4 pt-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Related Properties</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {relatedProperties.map((p) => (
                    <Link href={`/p/${p._id}`} key={p._id.toString()} className="group bg-white rounded-[3rem] p-4 border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                      <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-6">
                        <Image src={p.images?.[0] || "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80"} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-3xl font-black text-slate-900">{formatPrice(p)}</p>
                        <h4 className="text-xl font-black text-slate-600 group-hover:text-[#7c3aed] transition-colors line-clamp-1">{p.title}</h4>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                          <MapPin size={18} className="text-[#7c3aed]" /> {p.locality}, {p.city}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest pt-2">
                          <Maximize size={14} /> {p.area} sqft
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="text-center">
                  <h3 className="text-5xl font-black text-[#7c3aed] tracking-tighter">
                    {formatPrice(property)}
                  </h3>
                </div>

                <button
                  onClick={() => setIsMeetingModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl mb-3 mt-8"
                >
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Schedule Meeting
                </button>

                {agent?.mobileNumber && (
                  <a 
                    href={`tel:${agent.mobileNumber}`}
                    className="w-full bg-white border-2 border-purple-600 text-purple-600 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Talk to Agent
                  </a>
                )}

                <div className="pt-10 border-t border-slate-50 space-y-6 mt-8">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-sm">Property Type</span>
                    <span className="text-slate-900 font-black text-sm">{property.commercialType || property.bhkType || property.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-sm">Area</span>
                    <span className="text-slate-900 font-black text-sm">{property.plotArea || property.area} sqft</span>
                  </div>
                  {(property.floorNumber || property.propertyFloorNumber) && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-sm">Floor</span>
                      <span className="text-slate-900 font-black text-sm">{property.floorNumber || property.propertyFloorNumber}{getOrdinal(property.floorNumber || property.propertyFloorNumber || 0)} Floor</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-sm">Status</span>
                    <span className="text-[#10b981] font-black text-sm">{property.availability ? 'Available' : 'Sold'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 z-50 flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <button 
          onClick={() => setIsMeetingModalOpen(true)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-purple-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Calendar size={18} /> Schedule Meeting
        </button>
        {agent?.mobileNumber && (
          <a 
            href={`tel:${agent.mobileNumber}`}
            className="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Phone size={18} /> Call
          </a>
        )}
      </div>
      {/* Schedule Meeting Modal */}
      {isMeetingModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMeetingModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Schedule Meeting</h3>
              <button 
                onClick={() => setIsMeetingModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8 pt-6">
              <form onSubmit={handleScheduleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                    <div className="relative">
                      <input 
                        required
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7c3aed] focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number *</label>
                      <input 
                        required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7c3aed] focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address *</label>
                    <input 
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7c3aed] focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Date *</label>
                    <input 
                      required
                      type="date"
                      name="preferredDate"
                      min={today || undefined}
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7c3aed] focus:bg-white outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Time *</label>
                    <input 
                      required
                      type="time"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7c3aed] focus:bg-white outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Message (Optional)</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Any specific requirements?"
                    rows={3}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7c3aed] focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300 resize-none"
                  />
                </div>
              </div>

              {submissionStatus && (
                <div className={`p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
                  submissionStatus.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-100' 
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  <div className="flex items-center gap-2">
                    {submissionStatus.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                    {submissionStatus.message}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#7c3aed] to-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Calendar size={18} />
                    Schedule Meeting
                  </>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertyPage(props: any) {
  return (
    <Suspense fallback={null}>
      <PropertyPageContent {...props} />
    </Suspense>
  );
}
