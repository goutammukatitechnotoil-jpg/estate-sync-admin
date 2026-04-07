'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, Mail, Shield, ToggleLeft, ToggleRight, Building, Activity, LogOut, Layers, Plus, Edit2, X, Check } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';

interface IRole {
  _id: string;
  name: string;
  status: 'Active' | 'Inactive';
  permissions: {
    properties: { view: boolean; edit: boolean };
    categories: { view: boolean; edit: boolean };
    teamMembers: { view: boolean; edit: boolean };
  };
}

interface TeamMemberFormProps {
  isEdit?: boolean;
  teamMemberId?: string;
}

export default function TeamMemberForm({ isEdit = false, teamMemberId = '' }: TeamMemberFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    roleId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRoleDetails, setSelectedRoleDetails] = useState<IRole | null>(null);

  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch roles first
        await fetchRoles();
        
        // Then fetch team member data if editing
        if (isEdit && teamMemberId) {
          await fetchTeamMember();
        } else if (!isEdit) {
          // Check if returning from role creation
          const params = new URLSearchParams(window.location.search);
          const newRoleId = params.get('newRoleId');
          if (newRoleId) {
            // Auto-select the newly created role
            await handleRoleSelect(newRoleId);
            toast.success('Role created! It has been auto-selected for this team member.');
            // Clean up URL
            window.history.replaceState({}, '', '/team-members/add');
          }
        }
      } catch (error) {
        console.error('Failed to initialize form:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [isEdit, teamMemberId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      if (response.ok) {
        // Only show active roles for assignment
        setRoles(data.roles.filter((role: IRole) => role.status === 'Active'));
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchRoleDetails = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`);
      const data = await response.json();
      if (response.ok && data.role) {
        setSelectedRoleDetails(data.role);
      }
    } catch (error) {
      console.error('Failed to fetch role details:', error);
    }
  };

  const handleRoleSelect = async (roleId: string) => {
    setFormData(prev => ({ ...prev, roleId }));
    if (roleId) {
      await fetchRoleDetails(roleId);
    } else {
      setSelectedRoleDetails(null);
    }
  };

  const fetchTeamMember = async () => {
    try {
      const response = await fetch(`/api/team-members/${teamMemberId}`);
      const data = await response.json();

      if (response.ok && data.teamMember) {
        setFormData({
          fullName: data.teamMember.fullName,
          mobileNumber: data.teamMember.mobileNumber,
          email: data.teamMember.email,
          roleId: data.teamMember.roleId
        });

        // Automatically fetch and display permissions for the pre-selected role
        if (data.teamMember.roleId) {
          await fetchRoleDetails(data.teamMember.roleId);
        }
      } else {
        toast.error('Failed to load team member');
        router.push('/team-members');
      }
    } catch (error) {
      toast.error('Failed to load team member');
      router.push('/team-members');
    }
  };

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
    if (!formData.roleId) {
      newErrors.roleId = 'Please select a role.';
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
      const url = isEdit ? `/api/team-members/${teamMemberId}` : '/api/team-members';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEdit ? 'Team member updated successfully!' : 'Team member added successfully!');
        router.push('/team-members');
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'add'} team member`);
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

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardHeader title="Team Members" />
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader title="Team Members" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => router.push('/team-members')}
              className="p-2 mt-1 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group shrink-0"
              title="Back to Team Members List"
            >
              <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Team Member' : 'Add Team Member'}</h1>
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
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-lg"
                    value={formData.roleId}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => router.push(`/roles/add?returnTo=/team-members/add`)}
                    className="px-4 py-4 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                    title="Add new role"
                  >
                    <Plus className="w-5 h-5" />
                    Add Role
                  </button>
                </div>
                {errors.roleId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    {errors.roleId}
                  </p>
                )}
              </div>

              {/* Role Permissions Display */}
              {selectedRoleDetails && formData.roleId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700 uppercase">
                      <Shield className="w-4 h-4 inline mr-2" />
                      {selectedRoleDetails.name} - Permissions
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push(`/roles/${selectedRoleDetails._id}/edit?returnTo=${encodeURIComponent(isEdit ? `/team-members/${teamMemberId}/edit` : '/team-members/add')}`)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-medium transition-colors flex items-center gap-1"
                      title="Edit role permissions"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 space-y-4">
                    {/* Properties */}
                    <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-800">Properties</span>
                        </div>
                        <div className="flex gap-4 ml-6">
                          <div className="flex items-center gap-1">
                            {selectedRoleDetails.permissions.properties.view ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm text-gray-700">View</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {selectedRoleDetails.permissions.properties.edit ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm text-gray-700">Edit</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-800">Categories</span>
                        </div>
                        <div className="flex gap-4 ml-6">
                          <div className="flex items-center gap-1">
                            {selectedRoleDetails.permissions.categories.view ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm text-gray-700">View</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {selectedRoleDetails.permissions.categories.edit ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm text-gray-700">Edit</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-800">Team Members</span>
                        </div>
                        <div className="flex gap-4 ml-6">
                          <div className="flex items-center gap-1">
                            {selectedRoleDetails.permissions.teamMembers.view ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm text-gray-700">View</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {selectedRoleDetails.permissions.teamMembers.edit ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm text-gray-700">Edit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">💡 Changes to role permissions will affect all team members with this role</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
                >
                  <Save className="w-5 h-5" />
                  {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Team Member' : 'Save Team Member')}
                </button>
              </div>
            </form>
          </div>


        </div>
      </main>
    </DashboardLayout>
  );
}