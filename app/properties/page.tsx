'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, MapPin, Trash2, X, Edit,
  Image as ImageIcon, Map as MapIcon, Tag,
  TrendingUp, Users, ArrowLeft,
  CheckCircle2, AlertCircle,
  BarChart3, PieChart as PieChartIcon,
  ChevronRight, Phone, Clock, Filter, SlidersHorizontal,
  Home, Building, Activity, Settings, LogOut, Layers
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

type Property = {
  _id: string;
  title: string;
  category: string;
  price: number;
  city: string;
  locality: string;
  availability: boolean;
  listingPurpose?: string;
  images?: string[];
  highlights?: string[];
};

export default function PropertiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  // Properties state
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('All');

  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load properties and categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [propRes, catRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/categories?status=active')
        ]);
        
        const propData = await propRes.json();
        const catData = await catRes.json();

        if (!propRes.ok) {
          setError(propData.error || 'Failed to load properties');
        } else if (mounted) {
          setProperties(propData.properties || []);
          setCategories(catData.categories || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
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

      const categoryLower = p.category ? String(p.category).toLowerCase() : '';
      const filterLower = categoryFilter.toLowerCase();
      const selectedCat = categories.find(cat => String(cat.name).toLowerCase() === filterLower || String(cat._id) === categoryFilter);

      const matchesSearch = titleMatches || localityMatches || cityMatches || categoryLower.includes(searchLower);
      const matchesCategory = categoryFilter === 'All'
        || categoryLower === filterLower
        || categoryLower === String(selectedCat?.name).toLowerCase()
        || String(p.category) === String(selectedCat?._id)
        || String(p.category) === categoryFilter;
      const purpose = p.listingPurpose || 'For Sale';
      const matchesPurpose = purposeFilter === 'All' || purpose === purposeFilter;
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
  }, [properties, categories, searchTerm, categoryFilter, purposeFilter, locationFilter, priceRangeFilter]);

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
    <DashboardLayout>
      <DashboardHeader title="Properties" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="w-full !pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
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

            {/* 👇 SCROLL CONTAINER */}
            <div className="flex-1 overflow-x-auto pb-2 pt-2">

              {/* 👇 INNER WRAPPER (IMPORTANT) */}
              <div className="flex items-center gap-3 whitespace-nowrap overflow-visible">

                {/* ALL SELECTS HERE */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset transition-all cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset transition-all cursor-pointer"
                >
                  <option value="All">All Purposes</option>
                  <option value="For Sale">For Sale</option>
                  <option value="For Rent">For Rent</option>
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset transition-all cursor-pointer"
                >
                  <option value="All">All Locations</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset transition-all cursor-pointer"
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
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Found {filteredProperties.length} Properties
            </div>
          </div>


          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 animate-in fade-in duration-500">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-pulse flex flex-col h-[380px]">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 sm:py-16 md:py-24 bg-rose-50 rounded-lg sm:rounded-3xl border border-rose-100 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 px-4 sm:px-6">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-sm shadow-rose-100">
                <AlertCircle size={28} className="text-rose-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-rose-900 mb-2">Something went wrong</h3>
              <p className="text-rose-600 max-w-xs sm:max-w-sm mb-4 sm:mb-6 text-sm sm:text-base">{error || 'Failed to load properties. Please try again later.'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-rose-600 text-white font-bold rounded-lg sm:rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 flex items-center gap-2 text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-12 sm:py-16 md:py-24 bg-white rounded-lg sm:rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 px-4 sm:px-6">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-gray-100 shadow-sm shadow-gray-100">
                <Search size={30} className="text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-gray-800 mb-2">No Properties Found</h3>
              <p className="text-gray-500 max-w-xs sm:max-w-sm mb-4 sm:mb-6 text-sm sm:text-base">We couldn't find any properties matching your criteria. Try adjusting your filters or search terms.</p>
              {(categoryFilter !== 'All' || purposeFilter !== 'All' || locationFilter !== 'All' || priceRangeFilter !== 'All' || searchTerm !== '') && (
                <button
                  onClick={clearFilters}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg sm:rounded-xl hover:bg-indigo-100 transition-colors text-sm sm:text-base"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {filteredProperties.map((prop) => (
                <Link
                  href={`/properties/${prop._id}`}
                  key={prop._id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all flex flex-col cursor-pointer group hover:-translate-y-1 block"
                >
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    {(prop.images && prop.images[0]) ? (
                      <img src={prop.images[0]} alt={prop.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={28} strokeWidth={1.5} />
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
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest shrink-0">{prop.category}</span>
                      <span className="text-lg font-bold text-gray-900 shrink-0 whitespace-nowrap">
                        {prop.price ? `₹${(prop.price / 10000000).toFixed(2)} Cr` : '₹0'}
                      </span>
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
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span>0 Interest Matches</span>
                      </div>
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}