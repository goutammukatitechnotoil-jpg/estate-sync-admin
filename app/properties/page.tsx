'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, MapPin, Trash2, X, Edit,
  Image as ImageIcon, Map as MapIcon, Tag,
  TrendingUp, Users, ArrowLeft,
  CheckCircle2, AlertCircle,
  BarChart3, PieChart as PieChartIcon,
  ChevronRight, Phone, Clock, Filter, SlidersHorizontal,
  Home, Building, Activity, Settings, LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

type Property = {
  _id: string;
  title: string;
  category: string;
  price: number;
  city: string;
  locality: string;
  availability: boolean;
  images?: string[];
  highlights?: string[];
};

export default function PropertiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('All');

  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-Image Gallery State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedProperty = useMemo(() =>
    properties.find(p => p._id === selectedPropertyId),
    [properties, selectedPropertyId]
  );

  const detailImages = useMemo(() => {
    if (!selectedProperty) return [];
    return (selectedProperty.images && selectedProperty.images.length > 0)
      ? selectedProperty.images
      : [];
  }, [selectedProperty]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedPropertyId]);

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = new Set(properties.map(p => p.locality).filter(Boolean) as string[]);
    return Array.from(locations).sort();
  }, [properties]);

  // Price ranges helper
  const priceRanges = [
    { label: 'Under 50 Lakh', min: 0, max: 5000000 },
    { label: '50 Lakh - 1 Crore', min: 5000000, max: 10000000 },
    { label: '1 Crore - 2 Crore', min: 10000000, max: 20000000 },
    { label: 'Above 2 Crore', min: 20000000, max: Infinity },
  ];

  // Load properties
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load properties');
        } else if (mounted) {
          setProperties(data.properties || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load properties');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Combined Filtering Logic
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatches = p.title ? p.title.toLowerCase().includes(searchLower) : false;
      const localityMatches = p.locality ? p.locality.toLowerCase().includes(searchLower) : false;
      const cityMatches = p.city ? p.city.toLowerCase().includes(searchLower) : false;

      const matchesSearch = titleMatches || localityMatches || cityMatches;
      const matchesCategory = categoryFilter === 'All' || p.category === (categoryFilter as any);
      const matchesPurpose = purposeFilter === 'All';
      const matchesLocation = locationFilter === 'All' || p.locality === locationFilter;

      let matchesPrice = true;
      if (priceRangeFilter !== 'All') {
        const range = priceRanges.find(r => r.label === priceRangeFilter);
        if (range) {
          matchesPrice = p.price >= range.min && p.price < range.max;
        }
      }

      return matchesSearch && matchesCategory && matchesPurpose && matchesLocation && matchesPrice;
    });
  }, [properties, searchTerm, categoryFilter, purposeFilter, locationFilter, priceRangeFilter]);

  const clearFilters = () => {
    setCategoryFilter('All');
    setPurposeFilter('All');
    setLocationFilter('All');
    setPriceRangeFilter('All');
    setSearchTerm('');
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        const response = await fetch(`/api/properties/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setProperties(prev => prev.filter(p => p._id !== id));
          setSelectedPropertyId(null);
        } else {
          alert('Failed to delete property');
        }
      } catch (error) {
        alert('Failed to delete property');
      }
    }
  };

  const handleUpdateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        setProperties(prev => prev.map(p => p._id === id ? { ...p, ...updates } : p));
      } else {
        alert('Failed to update property');
      }
    } catch (error) {
      alert('Failed to update property');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-screen">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Building className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-wide">DesiProperty </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Home className="w-5 h-5" /> Dashboard
          </Link>
          <Link
            href="/properties"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/properties') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Building className="w-5 h-5" /> Properties
          </Link>
          <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors" href="#">
            <Users className="w-5 h-5" /> Leads
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors" href="#">
            <Activity className="w-5 h-5" /> Appointments
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors" href="#">
            <Settings className="w-5 h-5" /> Settings
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-600">J</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John</p>
              <p className="text-xs text-gray-500 truncate">ADMIN</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {!selectedPropertyId || !selectedProperty ? (
        <>
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link
                href="/properties/add"
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 shrink-0"
              >
                <Plus size={18} />
                Add Property
              </Link>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500 mr-2">
              <SlidersHorizontal size={18} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
            </div>

            <div className="flex items-center gap-3 flex-1 overflow-x-auto whitespace-nowrap pb-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Flat/Apartment">Flat / Apartment</option>
                <option value="Villa/House">Villa / House</option>
                <option value="Plot/Land">Plot / Land</option>
                <option value="Commercial">Commercial</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="All">All Purposes</option>
                <option value="For Sale">For Sale</option>
                <option value="For Rent">For Rent</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="All">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <select
                value={priceRangeFilter}
                onChange={(e) => setPriceRangeFilter(e.target.value)}
                className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="All">All Prices</option>
                {priceRanges.map(range => (
                  <option key={range.label} value={range.label}>{range.label}</option>
                ))}
              </select>

              {(categoryFilter !== 'All' || purposeFilter !== 'All' || locationFilter !== 'All' || priceRangeFilter !== 'All' || searchTerm !== '') && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 px-2 py-1 flex items-center gap-1"
                >
                  <X size={12} /> Clear Filters
                </button>
              )}
            </div>

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Found {filteredProperties.length} Properties
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <div
                key={prop._id}
                onClick={() => setSelectedPropertyId(prop._id)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all flex flex-col cursor-pointer group hover:-translate-y-1"
              >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {(prop.images && prop.images[0]) ? (
                    <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} strokeWidth={1.5} />
                      <span className="text-xs mt-2 uppercase tracking-wider font-semibold">No Preview</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full shadow-sm border ${prop.availability ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                      {prop.availability ? 'AVAILABLE' : 'SOLD'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{prop.category}</span>
                    <span className="text-lg font-bold text-gray-900">₹{(prop.price/100000).toFixed(1)}L</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{prop.title}</h4>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{prop.locality ? `${prop.locality}, ${prop.city}` : prop.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {prop.highlights && prop.highlights.slice(0, 3).map((h, i) => (
                      <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">{h}</span>
                    ))}
                    {prop.highlights && prop.highlights.length > 3 && <span className="text-[9px] text-slate-400 font-bold">+{prop.highlights.length - 3}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <TrendingUp size={12} className="text-emerald-500" />
                      0 Interest Matches
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
            {filteredProperties.length === 0 && (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                <Filter size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-400">No properties match your filters</h3>
                <button onClick={clearFilters} className="mt-4 text-indigo-600 font-bold hover:underline">Clear all filters</button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Property Detail View */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPropertyId(null)}
                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm group mt-1"
                title="Back to Property List"
              >
                <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{selectedProperty.title || "Untitled Property"}</h2>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border text-indigo-700 bg-indigo-50 border-indigo-200`}>
                    {selectedProperty.category}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border text-amber-700 bg-amber-50 border-amber-200`}>
                    For Sale
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${selectedProperty.availability ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                    {selectedProperty.availability ? 'AVAILABLE' : 'SOLD'}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ₹{selectedProperty.price?.toLocaleString('en-IN') || '0'}
                  <span className="text-sm text-gray-500 font-normal ml-1">(Total Price)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateProperty(selectedPropertyId, { availability: !selectedProperty.availability })}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 size={16} className={selectedProperty.availability ? 'text-gray-400' : 'text-emerald-500'} />
                Toggle Availability
              </button>
              <button
                onClick={() => router.push(`/properties/edit/${selectedPropertyId}`)}
                className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                title="Edit Property"
              >
                <Edit size={20} />
              </button>
              <button
                onClick={() => handleDeleteProperty(selectedPropertyId)}
                className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

              {/* Media Gallery */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Media Gallery</h3>
                {detailImages.length > 0 ? (
                  <div className="space-y-3">
                    <div className="h-96 w-full rounded-xl overflow-hidden bg-gray-50">
                      <img src={detailImages[selectedImageIndex] || detailImages[0]} alt={selectedProperty.title} className="w-full h-full object-cover" />
                    </div>
                    {detailImages.length > 1 && (
                      <div className="flex flex-wrap items-center gap-3">
                        {detailImages.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ease-in-out cursor-pointer ${
                              selectedImageIndex === idx ? 'border-indigo-600 shadow-md scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={`${selectedProperty.title} ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-gray-300 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <ImageIcon size={48} strokeWidth={1} />
                    <span className="text-sm font-medium mt-2">No Images Available</span>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Property Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div><p className="text-xs font-bold text-gray-400 uppercase">Category</p><p className="font-semibold text-gray-800">{selectedProperty.category}</p></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase">City</p><p className="font-semibold text-gray-800">{selectedProperty.city}</p></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase">Locality</p><p className="font-semibold text-gray-800">{selectedProperty.locality}</p></div>
                  <div><p className="text-xs font-bold text-gray-400 uppercase">Price</p><p className="font-semibold text-gray-800">₹{selectedProperty.price?.toLocaleString('en-IN')}</p></div>
                </div>
              </div>

              {/* Highlights & Amenities */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Highlights & Amenities</h3>

                <div className="space-y-6">
                  {selectedProperty.highlights && selectedProperty.highlights.length > 0 && (
                     <div>
                       <p className="text-sm font-bold text-gray-700 mb-2">Highlights</p>
                       <ul className="list-disc list-inside space-y-1">
                         {selectedProperty.highlights.map((h: string, i: number) => (
                           <li key={i} className="text-sm text-gray-600">{h}</li>
                         ))}
                       </ul>
                     </div>
                  )}

                  {(!selectedProperty.highlights || selectedProperty.highlights.length === 0) && (
                    <p className="text-sm text-gray-400 italic">No highlights provided.</p>
                  )}
                </div>
              </div>

            </div>

             {/* Right column */}
             <div className="space-y-6">

               {/* Location Details */}
               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Location</h3>
                  <div className="space-y-4">
                    {selectedProperty.city && <div><p className="text-xs font-bold text-gray-400 uppercase">City</p><p className="font-semibold text-gray-800">{selectedProperty.city}</p></div>}
                    {selectedProperty.locality && <div><p className="text-xs font-bold text-gray-400 uppercase">Locality / Area</p><p className="font-semibold text-gray-800">{selectedProperty.locality}</p></div>}
                  </div>
               </div>

               {/* System Information */}
               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">System Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Created By</p>
                      <p className="font-semibold text-gray-800">Admin</p>
                    </div>
                  </div>
               </div>

              {/* <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">AI Performance</h3>
                  <p className="text-xs text-indigo-100 mb-6 font-medium">This property has a <span className="font-bold underline decoration-indigo-300">92% match accuracy</span> with incoming inquiries.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Next Recommended Action</p>
                      <p className="text-sm font-bold">Follow up with HOT leads</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl"></div>
              </div> */}

            </div>
          </div>
        </div>
      )}

        </div>
      </main>
    </div>
  );
}