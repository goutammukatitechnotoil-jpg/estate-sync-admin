'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Edit, MapPin, TrendingUp, ChevronRight,
  AlertCircle, Home, Building, Users, Activity, Settings, LogOut, Search
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;

  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!propertyId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/properties/${propertyId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch property');
        if (mounted) setSelectedProperty(data.property);
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [propertyId]);

  const detailImages = useMemo(() => {
    if (!selectedProperty) return [];
    return (selectedProperty.images && selectedProperty.images.length > 0)
      ? selectedProperty.images
      : [];
  }, [selectedProperty]);

  const handleUpdateProperty = async (updates: any) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        setSelectedProperty((prev: any) => ({ ...prev, ...updates }));
        toast.success("Property updated");
      } else {
        toast.error('Failed to update property');
      }
    } catch (err) {
      toast.error('Failed to update property');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium tracking-wide">Loading property details...</p>
      </div>
    );
  }

  if (error || !selectedProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm shadow-rose-100">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h3 className="text-xl font-black text-rose-900 mb-2">Something went wrong</h3>
        <p className="text-rose-600 max-w-sm mb-6 text-center">{error || 'Failed to load property.'}</p>
        <button
          onClick={() => router.push('/properties')}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Properties
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/properties')}
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm group mt-1"
                  title="Back to Property List"
                >
                  <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{selectedProperty.title || "Untitled Property"}</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md border text-indigo-700 bg-indigo-50 border-indigo-200">
                      {selectedProperty.category}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md border text-amber-700 bg-amber-50 border-amber-200">
                      {selectedProperty.listingPurpose || 'For Sale'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${selectedProperty.availability ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                      {selectedProperty.availability ? 'AVAILABLE' : 'SOLD'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedProperty.price ? `₹${(selectedProperty.price / 10000000).toFixed(2)} Cr` : '₹0'}
                    <span className="text-sm text-gray-500 font-normal ml-1">({selectedProperty.priceType || 'Total Price'})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleUpdateProperty({ availability: !selectedProperty.availability })}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 size={16} className={selectedProperty.availability ? 'text-gray-400' : 'text-emerald-500'} />
                  Toggle Availability
                </button>
                <button
                  onClick={() => router.push(`/properties/edit/${propertyId}`)}
                  className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                  title="Edit Property"
                >
                  <Edit size={20} />
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
                         {/* eslint-disable-next-line @next/next/no-img-element */}
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
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt={`${selectedProperty.title} ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-64 flex flex-col items-center justify-center text-gray-300 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-medium mt-2">No Images Available</span>
                      </div>
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
                    <div><p className="text-xs font-bold text-gray-400 uppercase">Price</p><p className="font-semibold text-gray-800">{selectedProperty.price ? `₹${(selectedProperty.price / 10000000).toFixed(2)} Cr` : '₹0'}</p></div>
                    {selectedProperty.dynamicData && Object.entries(selectedProperty.dynamicData).map(([key, value]) => {
                      if (value === undefined || value === null || value === '') return null;
                      return (
                        <div key={key}>
                          <p className="text-xs font-bold text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="font-semibold text-gray-800">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Highlights & Amenities */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Highlights & Amenities</h3>
                  <div className="space-y-6">
                    {selectedProperty.highlights && selectedProperty.highlights.length > 0 ? (
                       <div>
                         <p className="text-sm font-bold text-gray-700 mb-2">Highlights</p>
                         <ul className="list-disc list-inside space-y-1">
                           {selectedProperty.highlights.map((h: string, i: number) => (
                             <li key={i} className="text-sm text-gray-600">{h}</li>
                           ))}
                         </ul>
                       </div>
                    ) : (
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
