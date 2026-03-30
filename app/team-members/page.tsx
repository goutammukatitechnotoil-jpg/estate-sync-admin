'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Users, UserCheck, UserX, Edit, Trash2, Search, Filter, MoreVertical, Phone, Mail, Building, Activity, LogOut, Layers, Eye } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ToggleSwitch from '@/components/ToggleSwitch';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import DashboardHeader from '@/components/DashboardHeader';

interface ITeamMember {
  _id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export default function TeamMembersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [teamMembers, setTeamMembers] = useState<ITeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchTeamMembers();
  }, [statusFilter]);

  const fetchTeamMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/team-members?${params.toString()}`);
      const data = await res.json();
      if (data.teamMembers) {
        setTeamMembers(data.teamMembers);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (member: ITeamMember) => {
    const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    const action = newStatus === 'Active' ? 'activate' : 'deactivate';

    const result = await Swal.fire({
      title: `Confirm ${action}`,
      text: `Are you sure you want to ${action} ${member.fullName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/team-members/${member._id}`, {
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
          toast.success(`Team member ${action}d successfully`);
          fetchTeamMembers();
        } else {
          toast.error(data.error || 'Failed to update team member');
        }
      } catch (error) {
        toast.error('Failed to update team member');
      }
    }
  };

  const handleDelete = async (member: ITeamMember) => {
    const result = await Swal.fire({
      title: 'Confirm Deletion',
      text: `Are you sure you want to deactivate ${member.fullName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/team-members/${member._id}`, {
          method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
          toast.success('Team member deactivated successfully');
          fetchTeamMembers();
        } else {
          toast.error(data.error || 'Failed to deactivate team member');
        }
      } catch (error) {
        toast.error('Failed to deactivate team member');
      }
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.mobileNumber.includes(searchTerm);
    return matchesSearch;
  });

  const activeCount = teamMembers.filter(m => m.status === 'Active').length;
  const inactiveCount = teamMembers.filter(m => m.status === 'Inactive').length;

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
      <DashboardHeader title="Team Members" />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Members</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your team of agents and staff</p>
            </div>
            <Link
              href="/team-members/add"
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center text-sm sm:text-base"
            >
              <Plus size={17} />
              Add Team member
            </Link>
          </div>

          {/* Stats Cards */}          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl">
                  <Users className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl">
                  <UserCheck className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-red-50 rounded-lg sm:rounded-xl">
                  <UserX className="w-5 sm:w-6 h-5 sm:h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Members</p>
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
                    placeholder="Search by name, email, phone..."
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

          {/* Team Members List */}
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Users className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first team member.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Link
                      href="/team-members/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Team Member
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
                        Full Name
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
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
                    {filteredMembers.map((member) => (
                      <tr key={member._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-700">
                                  {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                              <div className="text-sm text-gray-500">
                                Added {new Date(member.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {member.mobileNumber}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {member.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              checked={member.status === 'Active'}
                              onChange={() => handleStatusToggle(member)}
                              size="sm"
                            />
                            <span className={`text-xs font-semibold ${
                              member.status === 'Active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/team-members/${member._id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/team-members/${member._id}/edit`)}
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