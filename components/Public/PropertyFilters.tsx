'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

const PropertyFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  const cities = ['Indore', 'Mumbai', 'Bhopal', 'Pune', 'Delhi'];
  const categories = ['Plot', 'Villa', 'Flat', 'Office', 'Shop', 'Commercial'];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/p?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ city: '', category: '', minPrice: '', maxPrice: '' });
    router.push('/p');
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl p-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input Simulation */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search city, locality or project..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <select 
            className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-600 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${isExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {(filters.city || filters.category || filters.minPrice || filters.maxPrice) && (
            <button 
              onClick={clearFilters}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
              title="Clear All"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <div className="flex flex-wrap gap-2">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleFilterChange('city', city)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filters.city === city ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (Lakhs)</label>
            <div className="flex gap-4">
              <input 
                type="number" 
                placeholder="Min"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Max"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyFilters;
