'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Search, Filter, MoreVertical, Shield, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ToggleSwitch from '@/components/ToggleSwitch';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
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
  createdAt: string;
  updatedAt: string;
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchRoles();
  }, [statusFilter]);

  const fetchRoles = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/roles?${params.toString()}`);
      const data = await res.json();
      if (data.roles) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (role: IRole) => {
    const newStatus = role.status === 'Active' ? 'Inactive' : 'Active';
    const action = newStatus === 'Active' ? 'activate' : 'deactivate';

    const result = await Swal.fire({
      title: `Confirm ${action}`,
      text: `Are you sure you want to ${action} "${role.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/roles/${role._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus
          })
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(`Role ${action}d successfully`);
          fetchRoles();
        } else {
          toast.error(data.error || 'Failed to update role');
        }
      } catch (error) {
        toast.error('Failed to update role');
      }
    }
  };

  const handleDelete = async (role: IRole) => {
    const result = await Swal.fire({
      title: 'Confirm Deletion',
      text: `Are you sure you want to permanently delete "${role.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/roles/${role._id}`, {
          method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
          toast.success('Role deleted successfully');
          fetchRoles();
        } else {
          toast.error(data.error || 'Failed to delete role');
        }
      } catch (error) {
        toast.error('Failed to delete role');
      }
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const activeCount = roles.filter(r => r.status === 'Active').length;
  const inactiveCount = roles.filter(r => r.status === 'Inactive').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader title="Role Management" />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage roles and permissions for your team</p>
            </div>
            <Link
              href="/roles/add"
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center text-sm sm:text-base"
            >
              <Plus size={17} />
              Add Role
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl">
                  <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{roles.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl">
                  <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Roles</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-red-50 rounded-lg sm:rounded-xl">
                  <XCircle className="w-5 sm:w-6 h-5 sm:h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Roles</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{inactiveCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by role name..."
                    className="w-full !pl-10 sm:!pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  className="px-3 py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-sm flex-1 sm:flex-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roles List */}
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Shield className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first role.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Link
                      href="/roles/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Role
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role ID
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role Name
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.map((role) => (
                      <tr key={role._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-mono">
                            {role._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              checked={role.status === 'Active'}
                              onChange={() => handleStatusToggle(role)}
                              size="sm"
                            />
                            <span className={`text-xs font-semibold ${
                              role.status === 'Active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {role.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/roles/${role._id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}