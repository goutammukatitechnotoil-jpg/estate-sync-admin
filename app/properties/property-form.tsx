'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { X, Upload, Tag, MapPin, Home, ListChecks, Settings, Plus, AlertCircle, CheckCircle, ArrowLeft, Building, Users, Activity, LogOut, Layers, Video, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardLayout from '@/components/DashboardLayout';

interface FormErrors {
  [key: string]: string;
}

interface PropertyFormProps {
  // Removed propertyId prop since we use useParams
}

const normalizeFurnishingStatus = (value: any): string | undefined => {
  if (!value && value !== 0) return undefined;
  const raw = String(value).trim();
  const x = raw.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  if (['furnished', 'fullyfurnished', 'fully-furnished'].includes(x)) return 'Furnished';
  if (['semifurnished', 'semifurnished', 'semifurnished', 'semi-furnished'].includes(x)) return 'Semi-Furnished';
  if (['unfurnished', 'un-furnished'].includes(x)) return 'Unfurnished';
  return undefined;
};

const normalizePropertyAge = (value: any): string | undefined => {
  if (!value && value !== 0) return undefined;
  const raw = String(value).trim();
  const x = raw.toLowerCase().replace(/\s+/g, '').replace(/[–—]/g, '-');
  if (['underconstruction', 'under-construction', 'underconstruction'].includes(x)) return 'Under Construction';
  if (['new(0-1years)', 'new(0–1years)', 'new', '0-1years', '0–1years', '0to1years'].includes(x)) return 'New (0–1 years)';
  if (['1-5years', '1–5years', '1to5years', '1to5'].includes(x)) return '1–5 years';
  if (['5-10years', '5–10years', '5to10years', '5to10'].includes(x)) return '5–10 years';
  if (['10+years', '10years', '10plusyears', '10+'].includes(x)) return '10+ years';
  return undefined;
};

const normalizeFacingDirection = (value: any): string | undefined => {
  if (!value && value !== 0) return undefined;
  const raw = String(value).trim();
  const x = raw.toLowerCase().replace(/\s+/g, '').replace(/[–—]/g, '-');
  if (['north', 'n'].includes(x)) return 'North';
  if (['south', 's'].includes(x)) return 'South';
  if (['east', 'e'].includes(x)) return 'East';
  if (['west', 'w'].includes(x)) return 'West';
  if (['north-east', 'northeast', 'ne'].includes(x)) return 'North-East';
  if (['north-west', 'northwest', 'nw'].includes(x)) return 'North-West';
  if (['south-east', 'southeast', 'se'].includes(x)) return 'South-East';
  if (['south-west', 'southwest', 'sw'].includes(x)) return 'South-West';
  return undefined;
};

export default function PropertyForm({ }: PropertyFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Get id from URL params
  const propertyId = params?.id as string;
  const isEditMode = !!propertyId;

  // Property Form State Interface
  interface PropertyFormState {
    title: string; category: string; listingPurpose: string; pricingType: 'fixed' | 'range'; price?: number; minPrice?: number; maxPrice?: number; priceType: string; city: string; locality: string; highlights: string[]; amenities: string[]; imageUrls: string[]; videoUrls: string[]; documentUrls: string[]; isAvailable: boolean; existingVideos?: string[]; existingDocuments?: string[];
    bhkType?: string; propertyFloorNumber?: number; totalFloorsInBuilding?: number; bedrooms?: number; numberOfFloors?: number; plotArea?: number; commercialType?: string; floorNumber?: number; propertyDescription?: string; address?: string; googleMapsLink?: string; propertyArea?: number; furnishingStatus?: string; propertyAge?: string; facingDirection?: string; videoTourLink?: string; vastuComplaint?: number;
    assignedAgentId?: string; siteVisitAllowed?: boolean; visitTimings?: string;
    dynamicData?: { [key: string]: any };
    [key: string]: any;
  }

  // Form States
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(isEditMode); // Show loader during edit form load
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(true);
  const [newProp, setNewProp] = useState<PropertyFormState>({
    title: '',
    category: '',
    listingPurpose: 'For Sale',
    pricingType: 'fixed',
    price: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    priceType: 'Total Price',
    city: '',
    locality: '',
    highlights: [] as string[],
    amenities: [] as string[],
    imageUrls: [] as string[],
    videoUrls: [] as string[],
    documentUrls: [] as string[],
    isAvailable: true,
    existingVideos: [],
    existingDocuments: [],
    assignedAgentId: '',
    siteVisitAllowed: undefined,
    visitTimings: '',
    vastuComplaint: undefined,
    dynamicData: {},
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check localStorage cache first
        const cachedRaw = localStorage.getItem('categories_cache');
        const cached = cachedRaw ? cachedRaw : '';
        if (cached && false) { // Temporarily disable cache
          const cachedData = JSON.parse(cached);
          setCategories(cachedData);
          setNewProp(prev => ({ ...prev, category: prev.category || cachedData[0]?.name }));
          setIsCategoriesLoading(false);
          return;
        }

        const res = await fetch('/api/categories?fields=_id,name,fields');
        const data = await res.json();
        console.log('Fetched categories:', data.categories);
        if (data.categories && data.categories.length > 0) {
          const cats = data.categories;
          setCategories(cats);
          // Cache for 5 minutes
          localStorage.setItem('categories_cache', JSON.stringify(cats));
          setNewProp(prev => ({ ...prev, category: prev.category || cats[0].name }));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();

        if (res.ok && Array.isArray(data.properties)) {
          const uniqueCitiesArray = Array.from(
            new Set(
              data.properties
                .map((p: any) => String(p.city || '').trim())
                .filter((city: string) => city !== '')
            )
          );

          const uniqueCities = (uniqueCitiesArray as string[]).sort((a, b) => a.localeCompare(b));
          setCities(uniqueCities);
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
        setCities([]);
      } finally {
        setIsCitiesLoading(false);
      }
    };

    const fetchTeamMembers = async () => {
      try {
        const res = await fetch('/api/team-members');
        const data = await res.json();
        if (res.ok && data.teamMembers && Array.isArray(data.teamMembers)) {
          const activeMembers = data.teamMembers.filter((member: any) => member.status === 'Active');
          setTeamMembers(activeMembers);
          console.log('Loaded team members:', activeMembers);
        } else {
          console.error('No team members data received:', data);
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Failed to load team members:', error);
        setTeamMembers([]);
      } finally {
        setIsTeamMembersLoading(false);
      }
    };

    fetchCities();
    fetchTeamMembers();
  }, []);

  // UI States
  const [highlightInput, setHighlightInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string[]>([]);
  const [documentPreview, setDocumentPreview] = useState<{ name: string, url: string }[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
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
            pricingType: prop.pricingType || 'fixed',
            price: prop.price || undefined,
            minPrice: prop.minPrice || undefined,
            maxPrice: prop.maxPrice || undefined,
            priceType: prop.priceType || 'Total Price',
            city: prop.city || '',
            locality: prop.locality || '',
            highlights: Array.isArray(prop.highlights) ? prop.highlights : [],
            amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
            imageUrls: Array.isArray(prop.images) ? prop.images : [],
            videoUrls: [], // New uploads only
            documentUrls: [], // New uploads only
            isAvailable: prop.availability ?? true,
            existingVideos: Array.isArray(prop.videos) ? prop.videos : [],
            existingDocuments: Array.isArray(prop.documents) ? prop.documents : [],
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
            furnishingStatus: normalizeFurnishingStatus(prop.furnishing) || (prop.furnishing ? String(prop.furnishing).trim() : undefined),
            propertyAge: normalizePropertyAge(prop.propertyAge) || (prop.propertyAge ? String(prop.propertyAge).trim() : undefined),
            facingDirection: normalizeFacingDirection(prop.facing) || (prop.facing ? String(prop.facing).trim() : undefined),
            videoTourLink: prop.videoLink || undefined,
            vastuComplaint: prop.vastuComplaint ?? undefined,
            assignedAgentId:
              typeof prop.assignedAgentId === 'object'
                ? prop.assignedAgentId?._id || ''
                : prop.assignedAgentId || '',
            siteVisitAllowed: prop.siteVisitAllowed ?? undefined,
            visitTimings: prop.visitTimings || '',
            dynamicData: prop.dynamicData || {},
          });
          setImagePreview(Array.isArray(prop.images) ? prop.images : []);
          setIsLoadingForm(false); // Hide loading after data is loaded
        } else {
          console.error('Failed to fetch property:', data.error);
          setIsLoadingForm(false); // Hide loading even on error
        }
      } catch (err) {
        console.error('Error loading property for edit:', err);
        setIsLoadingForm(false); // Hide loading on error
      }
    };

    fetchProperty();
  }, [propertyId]);
  const getTabErrors = (tabIndex: number): FormErrors => {
    const errs: FormErrors = {};
    if (tabIndex === 0) {
      if (!newProp.title.trim()) errs.title = 'Property title is required.';
      if (!newProp.category) errs.category = 'Please select property category.';
      if (!newProp.listingPurpose) errs.listingPurpose = 'Please select listing purpose.';

      // Pricing validation
      if (newProp.pricingType === 'fixed') {
        if (!newProp.price || newProp.price <= 0) errs.price = 'Enter a valid price greater than 0.';
      } else if (newProp.pricingType === 'range') {
        if (!newProp.minPrice || newProp.minPrice <= 0) errs.minPrice = 'Enter a valid minimum price greater than 0.';
        if (!newProp.maxPrice || newProp.maxPrice <= 0) errs.maxPrice = 'Enter a valid maximum price greater than 0.';
        if (newProp.minPrice && newProp.maxPrice && newProp.minPrice > newProp.maxPrice) {
          errs.minPrice = 'Minimum price cannot be greater than maximum price.';
        }
      }

      if (!newProp.priceType) errs.priceType = 'Please select price type.';

      const cat = categories.find(c => c.name === newProp.category);
      if (cat && cat.fields) {
        cat.fields.forEach((field: any) => {
          if (field.required) {
            const val = newProp.dynamicData?.[field.name];
            if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
              errs[`dynamic_${field.name}`] = 'This field is required.';
            }
          }
        });
      }
    }
    if (tabIndex === 1) {
      if (!newProp.city.trim()) errs.city = 'City is required.';
      if (!newProp.locality.trim()) errs.locality = 'Locality is required.';
      if (newProp.googleMapsLink && !isValidUrl(newProp.googleMapsLink)) errs.googleMapsLink = 'Enter a valid URL.';
    }
    if (tabIndex === 4) {
      if (newProp.imageUrls.length === 0) errs.imageUrls = 'At least one property image is required.';
      if (((newProp.existingVideos?.length || 0) + videoPreview.length) > 5) errs.videoUrls = 'Maximum 5 videos allowed.';
      if (((newProp.existingDocuments?.length || 0) + documentPreview.length) > 10) errs.documentUrls = 'Maximum 10 documents allowed.';
      if (newProp.videoTourLink && !isValidUrl(newProp.videoTourLink)) errs.videoTourLink = 'Enter a valid URL.';
    }
    if (tabIndex === 5) {
      if (!newProp.assignedAgentId) errs.assignedAgentId = 'Please select an assigned agent.';
      if (newProp.siteVisitAllowed === undefined || newProp.siteVisitAllowed === null) errs.siteVisitAllowed = 'Please select site visit availability.';
    }
    return errs;
  };

  const getTabFields = (tabIndex: number): string[] => {
    if (tabIndex === 0) {
      const base = ['title', 'category', 'listingPurpose'];
      if (newProp.pricingType === 'fixed') {
        base.push('price');
      } else if (newProp.pricingType === 'range') {
        base.push('minPrice', 'maxPrice');
      }
      base.push('priceType');
      const cat = categories.find(c => c.name === newProp.category);
      const dynamics = cat?.fields?.map((f: any) => `dynamic_${f.name}`) || [];
      return [...base, ...dynamics];
    }
    if (tabIndex === 1) return ['city', 'locality', 'googleMapsLink'];
    if (tabIndex === 4) return ['imageUrls', 'videoUrls', 'documentUrls', 'videoTourLink'];
    if (tabIndex === 5) return ['assignedAgentId', 'siteVisitAllowed'];
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray: File[] = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        const validType = ['video/mp4', 'video/quicktime'].includes(file.type);
        if (!validType) {
          toast.error('Only MP4 and MOV videos are supported.');
        }
        return validType;
      });

      if (((newProp.existingVideos?.length || 0) + validFiles.length) > 5) {
        toast.error('Maximum 5 videos allowed.');
        return;
      }

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setNewProp((prev) => ({
            ...prev,
            videoUrls: [...prev.videoUrls, base64String],
          }));
          setVideoPreview((prev) => [...prev, base64String]);
        };
        reader.readAsDataURL(file);
      });
      // Reset input
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray: File[] = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        const validType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
        if (!validType) {
          toast.error('Only PDF, DOC, and DOCX documents are supported.');
        }
        return validType;
      });

      if (((newProp.existingDocuments?.length || 0) + validFiles.length) > 10) {
        toast.error('Maximum 10 documents allowed.');
        return;
      }

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setNewProp((prev) => ({
            ...prev,
            documentUrls: [...prev.documentUrls, base64String],
          }));
          setDocumentPreview((prev) => [...prev, { name: file.name, url: base64String }]);
        };
        reader.readAsDataURL(file);
      });
      // Reset input
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
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

  const removeVideo = (index: number) => {
    setNewProp((prev) => ({
      ...prev,
      videoUrls: prev.videoUrls.filter((_, i) => i !== index),
    }));
    setVideoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setNewProp((prev) => ({
      ...prev,
      documentUrls: prev.documentUrls.filter((_, i) => i !== index),
    }));
    setDocumentPreview((prev) => prev.filter((_, i) => i !== index));
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
      dynamicData: {},
    }));
    setErrors({});
  };

  // Form Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const { imageUrls, videoUrls, documentUrls, existingVideos, existingDocuments, isAvailable, ...restData } = newProp;
        const payload = {
          ...restData,
          images: imageUrls,
          videos: [...(existingVideos || []), ...videoUrls],
          documents: [...(existingDocuments || []), ...documentUrls],
          availability: isAvailable,
          assignedAgentId: newProp.assignedAgentId,
          siteVisitAllowed: newProp.siteVisitAllowed,
          visitTimings: newProp.siteVisitAllowed ? newProp.visitTimings : undefined,
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
          toast.success(isEditMode ? 'Property updated successfully!' : 'Property added successfully!');
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

  const normalizeSelectValue = (value: any, options: string[]) => {
    if (value === undefined || value === null) return '';
    const str = String(value).trim();
    if (!str) return '';

    const exactMatch = options.find(opt => opt === str);
    if (exactMatch !== undefined) return exactMatch;

    const normalized = options.find(opt => String(opt).trim().toLowerCase() === str.toLowerCase());
    return normalized !== undefined ? normalized : str;
  };

  const renderConditionalFields = () => {
    const selectedCategory = categories.find(c => c.name === newProp.category);
    if (!selectedCategory || !Array.isArray(selectedCategory.fields) || selectedCategory.fields.length === 0) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedCategory.fields.map((field: any, idx: number) => {
          const fieldType = (field.type || '').toLowerCase();
          const options: string[] = Array.isArray(field.options) ? field.options : [];
          let val = newProp.dynamicData?.[field.name] !== undefined ? newProp.dynamicData[field.name] : '';

          if (fieldType === 'select' || fieldType === 'radio') {
            val = normalizeSelectValue(val, options);
          }

          const handleChange = (newVal: any) => {
            setNewProp(prev => ({ ...prev, dynamicData: { ...prev.dynamicData, [field.name]: newVal } }));
          };
          return (
            <div key={idx} className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>

              {field.type === 'text' && (
                <input type="text" placeholder={field.placeholder || ''} value={val} onChange={(e) => handleChange(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
              )}

              {field.type === 'number' && (
                <input type="number" placeholder={field.placeholder || ''} value={val} onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
              )}

              {field.type === 'select' && (
                <select value={val} onChange={(e) => handleChange(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900">
                  <option value="">Select Option</option>
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'multiselect' && (
                <select multiple value={Array.isArray(val) ? val : []} onChange={(e) => handleChange(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-h-[100px] text-gray-900">
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {fieldType === 'radio' && (
                <div className="flex flex-col gap-2 mt-2">
                  {options.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {options.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer text-gray-900">
                          <input
                            type="radio"
                            name={field.name}
                            value={opt}
                            checked={val === opt}
                            onChange={(e) => handleChange(e.target.value)}
                            className="w-4 h-4 accent-indigo-600"
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-red-500">No values defined for radio field "{field.label}" yet.</p>
                  )}
                </div>
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer mt-3 text-gray-900">
                  <input type="checkbox" checked={val === true} onChange={(e) => handleChange(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                  <span className="text-sm font-medium">Yes</span>
                </label>
              )}
              {field.helpText && <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>}

              {errors[`dynamic_${field.name}`] && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> {errors[`dynamic_${field.name}`]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardHeader title="Properties" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/properties')}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group shrink-0"
              title="Back to Properties List"
            >
              <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
              <p className="text-gray-600 text-sm">{isEditMode ? 'Update property details and save changes' : 'Create a structured property listing for inventory management'}</p>
            </div>
          </div>

          {/* Notification Messages (Now using react-hot-toast) */}

          {/* Loading Skeleton */}
          {isLoadingForm && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs Navigation */}
          {!isLoadingForm && (
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
                  className={`flex-1 min-w-[150px] px-6 py-4 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center justify-center gap-2 ${activeTab === idx
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10'
                    : 'bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-100 shadow-sm'
                    }`}
                >
                  {tab.icon}
                  {tab.title}
                </button>
              ))}
            </div>
          )}

          {!isLoadingForm && (
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
                        className={`w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900 ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={newProp.category || ''}
                        disabled={isEditMode}
                        onChange={(e) =>
                          !isEditMode && handleCategoryChange(e.target.value)
                        }
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map((cat: any) => (
                          <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                        ))}
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
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        Pricing Type <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-4 mt-3">
                        {(['fixed', 'range'] as const).map((type) => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pricingType"
                              value={type}
                              checked={newProp.pricingType === type}
                              onChange={(e) =>
                                setNewProp({
                                  ...newProp,
                                  pricingType: e.target.value as 'fixed' | 'range',
                                })
                              }
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-sm font-medium text-gray-700 capitalize">{type} Price</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {newProp.pricingType === 'fixed' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                          Price (INR) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1"
                          placeholder="e.g. 5000000"
                          className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                          value={newProp.price || ''}
                          onChange={(e) =>
                            setNewProp({
                              ...newProp,
                              price: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                        {errors.price && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> {errors.price}
                          </p>
                        )}
                      </div>
                    )}

                    {newProp.pricingType === 'range' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            Minimum Price (INR) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="1"
                            placeholder="e.g. 4000000"
                            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                            value={newProp.minPrice || ''}
                            onChange={(e) =>
                              setNewProp({
                                ...newProp,
                                minPrice: e.target.value === '' ? undefined : Number(e.target.value),
                              })
                            }
                          />
                          {errors.minPrice && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.minPrice}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            Maximum Price (INR) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="1"
                            placeholder="e.g. 6000000"
                            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                            value={newProp.maxPrice || ''}
                            onChange={(e) =>
                              setNewProp({
                                ...newProp,
                                maxPrice: e.target.value === '' ? undefined : Number(e.target.value),
                              })
                            }
                          />
                          {errors.maxPrice && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.maxPrice}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Vastu Complaint
                      </label>
                      <div className="flex gap-4 mt-3">
                        {[
                          { value: 1, label: 'Yes' },
                          { value: 0, label: 'No' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="vastuComplaint"
                              value={option.value}
                              checked={newProp.vastuComplaint === option.value}
                              onChange={(e) =>
                                setNewProp({
                                  ...newProp,
                                  vastuComplaint: Number(e.target.value),
                                })
                              }
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-sm font-medium text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
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
                  <p className="text-sm text-gray-500 mt-1">Upload images, videos, and documents</p>
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

                  {/* Videos Upload */}
                  <div className="space-y-3 border-t border-gray-100 pt-6">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Property Videos
                      <span className="text-[10px] font-normal text-gray-400 ml-2">
                        ({(newProp.existingVideos?.length || 0) + videoPreview.length}/5)
                      </span>
                    </label>

                    {/* Upload New Videos */}
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="border-3 border-dashed border-green-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all group"
                    >
                      <div className="p-4 bg-green-50 text-green-400 rounded-full mb-3 group-hover:bg-green-100 transition-colors">
                        <Video size={32} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Click to upload videos</span>
                      <span className="text-xs text-gray-500 mt-2">MP4, MOV (Max 5 videos)</span>
                      <input
                        type="file"
                        ref={videoInputRef}
                        className="hidden"
                        accept="video/mp4,video/quicktime"
                        multiple
                        onChange={handleVideoUpload}
                      />
                    </div>

                    {/* Existing Videos */}
                    {(newProp.existingVideos?.length || 0) > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {newProp.existingVideos?.map((videoUrl, idx) => (
                          <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                            <video
                              src={videoUrl}
                              className="w-full h-32 object-cover"
                              controls
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => window.open(videoUrl, '_blank')}
                                className="bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="View in new tab"
                              >
                                <ExternalLink size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewProp((prev) => ({
                                    ...prev,
                                    existingVideos: prev.existingVideos?.filter((_, i) => i !== idx),
                                  }));
                                }}
                                className="bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove video"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Video Previews */}
                    {videoPreview.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {videoPreview.map((preview, idx) => (
                          <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden border border-gray-200">
                            <video
                              src={preview}
                              className="w-full h-32 object-cover"
                              controls
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Documents Upload */}
                  <div className="space-y-3 border-t border-gray-100 pt-6">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Property Documents
                      <span className="text-[10px] font-normal text-gray-400 ml-2">
                        ({(newProp.existingDocuments?.length || 0) + documentPreview.length}/10)
                      </span>
                    </label>

                    {/* Upload New Documents */}
                    <div
                      onClick={() => documentInputRef.current?.click()}
                      className="border-3 border-dashed border-orange-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-all group"
                    >
                      <div className="p-4 bg-orange-50 text-orange-400 rounded-full mb-3 group-hover:bg-orange-100 transition-colors">
                        <FileText size={32} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Click to upload documents</span>
                      <span className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX (Max 10 documents)</span>
                      <input
                        type="file"
                        ref={documentInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        multiple
                        onChange={handleDocumentUpload}
                      />
                    </div>

                    {/* Existing Documents */}
                    {(newProp.existingDocuments?.length || 0) > 0 && (
                      <div className="space-y-2 mt-6">
                        {newProp.existingDocuments?.map((docUrl, idx) => (
                          <div key={`existing-doc-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-gray-500" />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Document {idx + 1}</span>
                                <div className="flex gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => window.open(docUrl, '_blank')}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = docUrl;
                                      link.download = `document-${idx + 1}`;
                                      link.click();
                                    }}
                                    className="text-xs text-green-600 hover:text-green-800 underline"
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNewProp((prev) => ({
                                  ...prev,
                                  existingDocuments: prev.existingDocuments?.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Remove document"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Document List */}
                    {documentPreview.length > 0 && (
                      <div className="space-y-2 mt-6">
                        {documentPreview.map((doc, idx) => (
                          <div key={`new-doc-${idx}`} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-orange-500" />
                              <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(idx)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
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

              {/* SECTION 6: Settings */}
              <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300 ${activeTab !== 5 ? 'hidden' : 'block'}`}>
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-xl font-bold text-gray-800">
                    Property Settings
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Configure agent assignment and site visit controls</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Property Availability */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Property Availability
                    </label>
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

                  {/* Assigned Agent */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      Assigned Agent <span className="text-red-400">*</span>
                    </label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all text-gray-900"
                      value={newProp.assignedAgentId || ''}
                      onChange={(e) =>
                        setNewProp({ ...newProp, assignedAgentId: e.target.value })
                      }
                    >
                      <option value="" disabled>Select Agent</option>
                      {isTeamMembersLoading ? (
                        <option disabled>Loading agents...</option>
                      ) : teamMembers.length === 0 ? (
                        <option disabled>No active agents available</option>
                      ) : (
                        teamMembers.map((agent: any) => {
                          const roleName =
                            agent.role?.name ||
                            agent.roleId?.name ||
                            'No Role';

                          return (
                            <option key={agent._id} value={agent._id}>
                              {agent.fullName} - {roleName}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {errors.assignedAgentId && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.assignedAgentId}
                      </p>
                    )}
                  </div>

                  {/* Site Visit Controls */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        Site Visit Allowed <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-4 mt-3">
                        {([true, false] as const).map((option) => (
                          <label key={option.toString()} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="siteVisitAllowed"
                              value={option.toString()}
                              checked={newProp.siteVisitAllowed === option}
                              onChange={(e) =>
                                setNewProp({
                                  ...newProp,
                                  siteVisitAllowed: e.target.value === 'true',
                                  visitTimings: e.target.value === 'false' ? '' : newProp.visitTimings,
                                })
                              }
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-sm font-medium text-gray-800">{option ? 'Yes' : 'No'}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Visit Timings - Only show if site visit is allowed */}
                    {newProp.siteVisitAllowed && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Visit Timings
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mon-Fri 10AM-6PM, Sat 10AM-4PM"
                          className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900"
                          value={newProp.visitTimings || ''}
                          onChange={(e) =>
                            setNewProp({ ...newProp, visitTimings: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>
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
          )}
        </div>
      </main>
    </DashboardLayout>
  );

}

