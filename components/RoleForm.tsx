'use client';

import React, { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface IRole {
  _id?: string;
  name: string;
  status?: 'Active' | 'Inactive';
  permissions: {
    properties: { view: boolean; edit: boolean };
    categories: { view: boolean; edit: boolean };
    teamMembers: { view: boolean; edit: boolean };
  };
}

interface RoleFormProps {
  role?: IRole;
  onSuccess: (newRoleId?: string) => void;
  onCancel: () => void;
}

export default function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    permissions: {
      properties: { view: false, edit: false },
      categories: { view: false, edit: false },
      teamMembers: { view: false, edit: false }
    }
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill form data when editing
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        permissions: role.permissions
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      toast.error('Role name must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      const url = role ? `/api/roles/${role._id}` : '/api/roles';
      const method = role ? 'PUT' : 'POST';

      // For new roles, default status to Active
      const submitData = role ? formData : { ...formData, status: 'Active' };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(role ? 'Role updated successfully!' : 'Role created successfully!');
        // Pass the new role ID for auto-selection if creating new role
        if (!role && data.role) {
          onSuccess(data.role._id);
        } else {
          onSuccess();
        }
      } else {
        toast.error(data.error || `Failed to ${role ? 'update' : 'create'} role`);
      }
    } catch (error) {
      toast.error(`Failed to ${role ? 'update' : 'create'} role`);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module as keyof typeof prev.permissions],
          [permission]: value
        }
      }
    }));
  };

  const isEdit = !!role;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="max-w-md">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Role Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Enter role name"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Role name must be unique and at least 2 characters</p>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h2>
        <p className="text-sm text-gray-600 mb-6">Configure module-based permissions for this role</p>

        <div className="space-y-6">
          {/* Properties Module */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-md font-medium text-gray-900">Properties</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="properties-view"
                  checked={formData.permissions.properties.view}
                  onChange={(e) => handlePermissionChange('properties', 'view', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="properties-view" className="ml-2 text-sm text-gray-700">
                  View Properties
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="properties-edit"
                  checked={formData.permissions.properties.edit}
                  onChange={(e) => handlePermissionChange('properties', 'edit', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="properties-edit" className="ml-2 text-sm text-gray-700">
                  Edit Properties
                </label>
              </div>
            </div>
          </div>

          {/* Categories Module */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="text-md font-medium text-gray-900">Categories</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="categories-view"
                  checked={formData.permissions.categories.view}
                  onChange={(e) => handlePermissionChange('categories', 'view', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="categories-view" className="ml-2 text-sm text-gray-700">
                  View Categories
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="categories-edit"
                  checked={formData.permissions.categories.edit}
                  onChange={(e) => handlePermissionChange('categories', 'edit', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="categories-edit" className="ml-2 text-sm text-gray-700">
                  Edit Categories
                </label>
              </div>
            </div>
          </div>

          {/* Team Members Module */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="text-md font-medium text-gray-900">Team Members</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="teamMembers-view"
                  checked={formData.permissions.teamMembers.view}
                  onChange={(e) => handlePermissionChange('teamMembers', 'view', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="teamMembers-view" className="ml-2 text-sm text-gray-700">
                  View Team Members
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="teamMembers-edit"
                  checked={formData.permissions.teamMembers.edit}
                  onChange={(e) => handlePermissionChange('teamMembers', 'edit', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="teamMembers-edit" className="ml-2 text-sm text-gray-700">
                  Edit Team Members
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEdit ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
}