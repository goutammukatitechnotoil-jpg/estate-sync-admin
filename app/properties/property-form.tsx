'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { X, Upload, Tag, MapPin, Home, ListChecks, Settings, Plus, AlertCircle, CheckCircle, ArrowLeft, Building, Users, Activity, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FormErrors {
  [key: string]: string;
}

interface PropertyFormProps {
  // Removed propertyId prop since we use useParams
}

export default function PropertyForm({}: PropertyFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get id from URL params
  const propertyId = params?.id as string;
  const isEditMode = !!propertyId;

  // Property Form State Interface
  interface PropertyFormState {
    title: string; category: string; listingPurpose: string; price: number; priceType: string; city: string; locality: string; highlights: string[]; amenities: string[]; imageUrls: string[]; isAvailable: boolean;
    bhkType?: string; propertyFloorNumber?: number; totalFloorsInBuilding?: number; bedrooms?: number; numberOfFloors?: number; plotArea?: number; commercialType?: string; floorNumber?: number; propertyDescription?: string; address?: string; googleMapsLink?: string; propertyArea?: number; furnishingStatus?: string; propertyAge?: string; facingDirection?: string; videoTourLink?: string;
    [key: string]: any;
  }

  // Form States
  const [newProp, setNewProp] = useState<PropertyFormState>({
    title: '',
    category: 'Flat/Apartment',
    listingPurpose: 'For Sale',
    price: 0,
    priceType: 'Total Price',
    city: '',
    locality: '',
    highlights: [] as string[],
    amenities: [] as string[],
    imageUrls: [] as string[],
    isAvailable: true,
  });

  // UI States
  const [highlightInput, setHighlightInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        const data = await res.json();
        if (res.ok && data.property) {
          const prop = data.property;
          setNewProp({
            title: prop.title || '',
            category: prop.category || 'Flat/Apartment',
            listingPurpose: prop.listingPurpose || 'For Sale',
            price: prop.price ?? 0,
            priceType: prop.priceType || 'Total Price',
            city: prop.city || '',
            locality: prop.locality || '',
            highlights: Array.isArray(prop.highlights) ? prop.highlights : [],
            amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
            imageUrls: Array.isArray(prop.images) ? prop.images : [],
            isAvailable: prop.availability ?? true,
            // Conditional fields based on category - these need to be stored separately or derived
            bhkType: prop.bhkType || undefined,
            propertyFloorNumber: prop.propertyFloorNumber || undefined,
            totalFloorsInBuilding: prop.totalFloorsInBuilding || undefined,
            bedrooms: prop.bedrooms || undefined,
            numberOfFloors: prop.numberOfFloors || undefined,
            plotArea: prop.plotArea || undefined,
            commercialType: prop.commercialType || undefined,
            floorNumber: prop.floorNumber || undefined,
            propertyDescription: prop.propertyDescription || undefined,
            address: prop.address || undefined,
            googleMapsLink: prop.mapLink || undefined,
            propertyArea: prop.area || undefined,
            furnishingStatus: prop.furnishing || undefined,
            propertyAge: prop.propertyAge || undefined,
            facingDirection: prop.facing || undefined,
            videoTourLink: prop.videoLink || undefined,
          });
          setImagePreview(Array.isArray(prop.images) ? prop.images : []);
        } else {
          console.error('Failed to fetch property:', data.error);
        }
      } catch (err) {
        console.error('Error loading property for edit:', err);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Validation Logic
  const getTabErrors = (tabIndex: number): FormErrors => {
    const errs: FormErrors = {};
    if (tabIndex === 0) {
      if (!newProp.title.trim()) errs.title = 'Property title is required.';
      if (!newProp.category) errs.category = 'Please select property category.';
      if (!newProp.listingPurpose) errs.listingPurpose = 'Please select listing purpose.';
      if (newProp.price <= 0) errs.price = 'Enter a valid price greater than 0.';
      if (!newProp.priceType) errs.priceType = 'Please select price type.';

      if (newProp.category === 'Flat/Apartment' && !newProp.bhkType) errs.bhkType = 'This field is required.';
      if (newProp.category === 'Villa/House' && (!newProp.bedrooms || newProp.bedrooms <= 0)) errs.bedrooms = 'This field is required.';
      if (newProp.category === 'Plot/Land' && (!newProp.plotArea || newProp.plotArea <= 0)) errs.plotArea = 'This field is required.';
      if (newProp.category === 'Commercial' && !newProp.commercialType) errs.commercialType = 'This field is required.';
      if (newProp.category === 'Other' && !newProp.propertyDescription?.trim()) errs.propertyDescription = 'This field is required.';
    }
    if (tabIndex === 1) {
      if (!newProp.city.trim()) errs.city = 'City is required.';
      if (!newProp.locality.trim()) errs.locality = 'Locality is required.';
      if (newProp.googleMapsLink && !isValidUrl(newProp.googleMapsLink)) errs.googleMapsLink = 'Enter a valid URL.';
    }
    if (tabIndex === 4) {
      if (newProp.imageUrls.length === 0) errs.imageUrls = 'At least one property image is required.';
      if (newProp.videoTourLink && !isValidUrl(newProp.videoTourLink)) errs.videoTourLink = 'Enter a valid URL.';
    }
    return errs;
  };

  const getTabFields = (tabIndex: number): string[] => {
    if (tabIndex === 0) return ['title', 'category', 'listingPurpose', 'price', 'priceType', 'bhkType', 'bedrooms', 'plotArea', 'commercialType', 'propertyDescription'];
    if (tabIndex === 1) return ['city', 'locality', 'googleMapsLink'];
    if (tabIndex === 4) return ['imageUrls', 'videoTourLink'];
    return [];
  };

  const validateTab = (tabIndex: number): boolean => {
    const errs = getTabErrors(tabIndex);
    const fields = getTabFields(tabIndex);
    setErrors(prev => {
      const updated = { ...prev };
      fields.forEach(f => delete updated[f]);
      return { ...updated, ...errs };
    });
    return Object.keys(errs).length === 0;
  };

  const validateForm = (): boolean => {
    let allErrors = {};
    for (let i = 0; i <= 5; i++) {
      allErrors = { ...allErrors, ...getTabErrors(i) };
    }
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleTabClick = (targetIdx: number) => {
    if (targetIdx < activeTab) {
      setActiveTab(targetIdx);
    } else if (targetIdx > activeTab) {
      let canProceed = true;
      for (let i = activeTab; i < targetIdx; i++) {
        if (!validateTab(i)) {
          canProceed = false;
          setActiveTab(i);
          // toast.error('Please fill the required fields before proceeding.');
          setTimeout(() => {
            const errorElement = document.querySelector('.text-red-500');
            const container = errorElement?.closest('div');
            const input = container?.querySelector('input, select, textarea') as HTMLElement;
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          break;
        }
      }
      if (canProceed) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveTab(targetIdx);
      }
    }
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Image Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray: File[] = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        const validType = ['image/jpeg', 'image/png'].includes(file.type);
        if (!validType) {
          toast.error('Only JPG and PNG images are supported.');
        }
        return validType;
      });

      if (newProp.imageUrls.length + validFiles.length > 10) {
        toast.error('Maximum 10 images allowed.');
        return;
      }

      let loadedCount = 0;
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setNewProp((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, base64String],
          }));
          setImagePreview((prev) => [...prev, base64String]);
          loadedCount++;
          setUploadedCount(loadedCount);
        };
        reader.readAsDataURL(file);
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setNewProp((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Highlights Management
  const addHighlight = () => {
    if (highlightInput.trim() && !newProp.highlights.includes(highlightInput.trim())) {
      setNewProp((prev) => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()],
      }));
      setHighlightInput('');
    }
  };

  const removeHighlight = (tag: string) => {
    setNewProp((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h !== tag),
    }));
  };

  // Amenities Management
  const addAmenity = () => {
    if (amenityInput.trim() && !newProp.amenities.includes(amenityInput.trim())) {
      setNewProp((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setNewProp((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  // Category Change Handler (resets dependent fields)
  const handleCategoryChange = (category: string) => {
    setNewProp((prev) => ({
      ...prev,
      category,
      bhkType: undefined,
      propertyFloorNumber: undefined,
      totalFloorsInBuilding: undefined,
      bedrooms: undefined,
      numberOfFloors: undefined,
      plotArea: undefined,
      commercialType: undefined,
      floorNumber: undefined,
      propertyDescription: undefined,
    }));
    setErrors({});
  };

  // Form Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const { imageUrls, isAvailable, ...restData } = newProp;
        const payload = {
          ...restData,
          images: imageUrls,
          availability: isAvailable,
        };
        const targetUrl = isEditMode && propertyId ? `/api/properties/${propertyId}` : '/api/properties';
        const method = isEditMode && propertyId ? 'PUT' : 'POST';

        const response = await fetch(targetUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success(isEditMode ? 'Property updated successfully.' : 'Property added successfully.');
          setTimeout(() => {
            router.push('/properties');
          }, 1500);
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        toast.error('Something went wrong. Please try again.');
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please complete all required fields.');
      for (let i = 0; i <= 5; i++) {
        if (Object.keys(getTabErrors(i)).length > 0) {
          setActiveTab(i);
          setTimeout(() => {
            const errorElement = document.querySelector('.text-red-500');
            const container = errorElement?.closest('div');
            const input = container?.querySelector('input, select, textarea') as HTMLElement;
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          break;
        }
      }
    }
  };

  const renderConditionalFields = () => {
    switch (newProp.category) {
      case 'Flat/Apartment':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                BHK Type <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                value={newProp.bhkType || ''}
                onChange={(e) =>
                  setNewProp({ ...newProp, bhkType: e.target.value as any })
                }
              >
                <option value="">Select BHK Type</option>
                <option value="Studio">Studio</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="5+ BHK">5+ BHK</option>
              </select>
              {errors.bhkType && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.bhkType}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Property Floor Number
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.propertyFloorNumber ?? ''}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      propertyFloorNumber: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Total Floors in Building
                </label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.totalFloorsInBuilding ?? ''}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      totalFloorsInBuilding: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </>
        );

      case 'Villa/House':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                Bedrooms <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 3"
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                value={newProp.bedrooms || ''}
                onChange={(e) =>
                  setNewProp({
                    ...newProp,
                    bedrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              {errors.bedrooms && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.bedrooms}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Number of Floors
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.numberOfFloors ?? ''}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      numberOfFloors: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Plot Area (sq ft)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.plotArea ?? ''}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      plotArea: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </>
        );

      case 'Commercial':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                Commercial Type <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                value={newProp.commercialType || ''}
                onChange={(e) =>
                  setNewProp({
                    ...newProp,
                    commercialType: e.target.value as any,
                  })
                }
              >
                <option value="">Select Commercial Type</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
                <option value="Showroom">Showroom</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Other">Other</option>
              </select>
              {errors.commercialType && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.commercialType}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Floor Number
              </label>
              <input
                type="number"
                placeholder="e.g. 3"
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                value={newProp.floorNumber ?? ''}
                onChange={(e) =>
                  setNewProp({
                    ...newProp,
                    floorNumber: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </>
        );

      case 'Plot/Land':
        return (
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              Plot Area (sq ft) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 5000"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
              value={newProp.plotArea ?? ''}
              onChange={(e) =>
                setNewProp({
                  ...newProp,
                  plotArea: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            {errors.plotArea && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.plotArea}
              </p>
            )}
          </div>
        );

      case 'Other':
        return (
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              Property Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              placeholder="Describe your property..."
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-gray-900"
              value={newProp.propertyDescription || ''}
              onChange={(e) =>
                setNewProp({ ...newProp, propertyDescription: e.target.value })
              }
            />
            {errors.propertyDescription && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.propertyDescription}
              </p>
            )}
          </div>
        );

      default:
        return null;
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
          {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.push('/properties')}
            className="p-2 mt-1 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group shrink-0"
            title="Back to Properties List"
          >
             <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
            <p className="text-gray-600">{isEditMode ? 'Update property details and save changes' : 'Create a structured property listing for inventory management'}</p>
          </div>
        </div>

        {/* Notification Messages (Now using react-hot-toast) */}

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { title: 'Basic Info', icon: <Tag size={16} /> },
            { title: 'Location', icon: <MapPin size={16} /> },
            { title: 'Details', icon: <Home size={16} /> },
            { title: 'Amenities', icon: <ListChecks size={16} /> },
            { title: 'Media', icon: <Upload size={16} /> },
            { title: 'Settings', icon: <Settings size={16} /> }
          ].map((tab, idx) => (
            <button
              key={tab.title}
              type="button"
              onClick={() => handleTabClick(idx)}
              className={`flex-1 min-w-[150px] px-6 py-4 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
                activeTab === idx
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10'
                  : 'bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-100 shadow-sm'
              }`}
            >
              {tab.icon}
              {tab.title}
            </button>
          ))}
        </div>

        <form
          className="relative"
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
        >
          {/* SECTION 1: Basic Information */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 0 ? 'hidden' : 'block'}`}>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                Basic Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">Property title, category, and pricing</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Property Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  Property Title <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. Skyline Luxury Apartment"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  value={newProp.title}
                  onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.title}
                  </p>
                )}
              </div>

              {/* Category and Listing Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Property Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                    value={newProp.category}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value)
                    }
                  >
                    <option value="Flat/Apartment">Flat / Apartment</option>
                    <option value="Villa/House">Villa / House</option>
                    <option value="Plot/Land">Plot / Land</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Listing Purpose <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-4 mt-3">
                    {(['For Sale', 'For Rent'] as const).map((purpose) => (
                      <label key={purpose} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="listingPurpose"
                          value={purpose}
                          checked={newProp.listingPurpose === purpose}
                          onChange={(e) =>
                            setNewProp({
                              ...newProp,
                              listingPurpose: e.target.value as any,
                            })
                          }
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-sm font-medium text-gray-700">{purpose}</span>
                      </label>
                    ))}
                  </div>
                  {errors.listingPurpose && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.listingPurpose}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Configuration Fields */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6">
                <h3 className="text-sm font-bold text-indigo-900 mb-4">
                  Configuration Fields for {newProp.category}
                </h3>
                <div className="space-y-4">{renderConditionalFields()}</div>
              </div>

              {/* Price Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Price (INR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000000"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                    value={newProp.price ?? ''}
                    onChange={(e) =>
                      setNewProp({
                        ...newProp,
                        price: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                  />
                  {errors.price && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.price}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Price Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                    value={newProp.priceType}
                    onChange={(e) =>
                      setNewProp({ ...newProp, priceType: e.target.value as any })
                    }
                    disabled={newProp.listingPurpose === 'For Sale'}
                  >
                    <option value="Total Price">Total Price</option>
                    {newProp.listingPurpose === 'For Rent' && (
                      <option value="Monthly Rent">Monthly Rent</option>
                    )}
                  </select>
                  {errors.priceType && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.priceType}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Location Details */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 1 ? 'hidden' : 'block'}`}>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                Location Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">City, area, and address information</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    placeholder="e.g. Mumbai"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                    value={newProp.city}
                    onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.city}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Locality / Area <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    placeholder="e.g. Worli"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                    value={newProp.locality}
                    onChange={(e) => setNewProp({ ...newProp, locality: e.target.value })}
                  />
                  {errors.locality && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.locality}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Address</label>
                <textarea
                  placeholder="Enter complete address..."
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-gray-900"
                  value={newProp.address || ''}
                  onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.googleMapsLink || ''}
                  onChange={(e) =>
                    setNewProp({ ...newProp, googleMapsLink: e.target.value })
                  }
                />
                {errors.googleMapsLink && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.googleMapsLink}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Property Details */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 2 ? 'hidden' : 'block'}`}>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                Property Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">Area, furnishing, age, and facing direction</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Property Area (sq ft)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.propertyArea ?? ''}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      propertyArea: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              {(['Flat/Apartment', 'Villa/House', 'Commercial'] as const).includes(
                newProp.category as any
              ) && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Furnishing Status
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                    value={newProp.furnishingStatus || ''}
                    onChange={(e) =>
                      setNewProp({
                        ...newProp,
                        furnishingStatus: e.target.value as any,
                      })
                    }
                  >
                    <option value="">Select Furnishing Status</option>
                    <option value="Furnished">Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Property Age
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                    value={newProp.propertyAge || ''}
                    onChange={(e) =>
                      setNewProp({
                        ...newProp,
                        propertyAge: e.target.value as any,
                      })
                    }
                  >
                    <option value="">Select Property Age</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="New (0–1 years)">New (0–1 years)</option>
                    <option value="1–5 years">1–5 years</option>
                    <option value="5–10 years">5–10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Facing Direction
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                    value={newProp.facingDirection || ''}
                    onChange={(e) =>
                      setNewProp({
                        ...newProp,
                        facingDirection: e.target.value as any,
                      })
                    }
                  >
                    <option value="">Select Facing Direction</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Highlights & Amenities */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 3 ? 'hidden' : 'block'}`}>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                Highlights & Amenities
              </h2>
              <p className="text-sm text-gray-500 mt-1">Add features and amenities</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Highlights */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <Tag size={14} /> Highlights / Features (Recommended)
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Sea View, Parking, Gym"
                    className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addHighlight())
                    }
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {newProp.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium border border-indigo-200"
                    >
                      {h}
                      <button
                        type="button"
                        onClick={() => removeHighlight(h)}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                  {newProp.highlights.length === 0 && (
                    <span className="text-sm text-gray-400 italic">
                      No highlights added yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3 border-t border-gray-100 pt-6">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                  <Tag size={14} /> Amenities (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Parking, Lift, Security, Swimming Pool"
                    className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addAmenity())
                    }
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {newProp.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                  {newProp.amenities.length === 0 && (
                    <span className="text-sm text-gray-400 italic">
                      No amenities added yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Media */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 4 ? 'hidden' : 'block'}`}>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                Media
              </h2>
              <p className="text-sm text-gray-500 mt-1">Upload images and video tour link</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Images Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  Property Images <span className="text-red-400">*</span>
                  <span className="text-[10px] font-normal text-gray-400 ml-2">
                    ({newProp.imageUrls.length}/10)
                  </span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-indigo-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="p-4 bg-indigo-50 text-indigo-400 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
                    <Upload size={32} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Click to upload property images</span>
                  <span className="text-xs text-gray-500 mt-2">PNG, JPG (Max 10 images)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleImageUpload}
                  />
                </div>

                {errors.imageUrls && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.imageUrls}
                  </p>
                )}

                {/* Image Previews */}
                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {imagePreview.map((preview, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Tour Link */}
              <div className="space-y-1 border-t border-gray-100 pt-6">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Video Tour Link
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/... or https://youtu.be/..."
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                  value={newProp.videoTourLink || ''}
                  onChange={(e) =>
                    setNewProp({ ...newProp, videoTourLink: e.target.value })
                  }
                />
                {errors.videoTourLink && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.videoTourLink}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 6: Availability & Controls */}
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 5 ? 'hidden' : 'block'}`}>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                Availability Controls
              </h2>
              <p className="text-sm text-gray-500 mt-1">Set property availability status</p>
            </div>

            <div className="p-6">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newProp.isAvailable}
                    onChange={(e) =>
                      setNewProp({ ...newProp, isAvailable: e.target.checked })
                    }
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-700">
                    {newProp.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                  <p className="text-xs text-gray-500">
                    {newProp.isAvailable
                      ? 'This property is available for booking'
                      : 'This property is not available'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 gap-4">
            <button
              type="button"
              onClick={() => activeTab > 0 ? setActiveTab(prev => prev - 1) : router.push('/properties')}
              className="w-full sm:w-auto px-8 py-4 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold transition-all border border-gray-200 flex justify-center items-center gap-2"
            >
              {activeTab > 0 ? '← Previous Step' : 'Cancel & Discard'}
            </button>

            {activeTab < 5 ? (
              <button
                type="button"
                onClick={() => handleTabClick(activeTab + 1)}
                className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => handleSubmit(e)}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                <CheckCircle size={20} />
                {isEditMode ? 'Update Property' : 'Publish Property'}
              </button>
            )}
          </div>
        </form>
      </div>
      </main>
    </div>
  );
}

