'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, Mail, Shield, ToggleLeft, ToggleRight, Building, Activity, LogOut, Layers } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';

export default function AddTeamMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    role: 'Agent'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    // Mobile Number validation
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (!/^\+91\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number in format: +91XXXXXXXXXX';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select role.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMobileNumberChange = (value: string) => {
    // Allow free entry of mobile number with country code
    // Accept formats like: +91XXXXXXXXXX, +91 XXXXXXXXXX, +91-XXXXXXXXXX, etc.
    let formatted = value.replace(/[^\d+]/g, ''); // Keep only digits and +

    // Ensure it starts with +91
    if (formatted.startsWith('+91')) {
      formatted = '+91' + formatted.slice(3).replace(/\D/g, '');
    } else if (formatted.startsWith('91')) {
      formatted = '+91' + formatted.slice(2).replace(/\D/g, '');
    } else if (!formatted.startsWith('+')) {
      formatted = '+91' + formatted.replace(/\D/g, '');
    }

    // Limit to +91 + 10 digits
    if (formatted.length > 13) {
      formatted = formatted.slice(0, 13);
    }

    setFormData(prev => ({ ...prev, mobileNumber: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Team member added successfully!');
        router.push('/team-members');
      } else {
        toast.error(data.error || 'Failed to add team member');
        if (data.error && data.error.includes('already exists')) {
          // Highlight the specific field that has duplicate
          if (data.error.includes('Email')) {
            setErrors({ email: data.error });
          } else if (data.error.includes('Mobile')) {
            setErrors({ mobileNumber: data.error });
          }
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/team-members"
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              title="Back to Team Members"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Add Team Member</h1>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="+91XXXXXXXXXX"
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-mono"
                  value={formData.mobileNumber}
                  onChange={(e) => handleMobileNumberChange(e.target.value)}
                  maxLength={13}
                />
                <p className="text-sm text-gray-500">Format: +91XXXXXXXXXX (10 digits after country code)</p>
                {errors.mobileNumber && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-lg"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="Agent">Agent</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Adding...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}