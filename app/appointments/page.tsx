'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock4,
  ExternalLink,
  Filter,
  TrendingUp,
  Users
} from 'lucide-react';

interface Appointment {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    locality: string;
    city: string;
    price: number;
    images: string[];
  };
  botUserId?: {
    _id: string;
    name: string;
    mobile: string;
    leadStatus: string;
  };
  agent?: {
    fullName: string;
    mobile: string;
  };
  fullName: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  useEffect(() => {
    fetch('/api/admin/appointments')
      .then(res => res.json())
      .then(data => {
        setAppointments(data.appointments || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.phone.includes(search) ||
      app.propertyId?.title?.toLowerCase().includes(search.toLowerCase()) ||
      app.agent?.fullName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const scheduledCount = appointments.filter(a => a.status === 'Scheduled').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader title="Appointments" />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage property site visits and scheduled meetings</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-indigo-50 rounded-lg sm:rounded-xl">
                  <Calendar className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-amber-50 rounded-lg sm:rounded-xl">
                  <Clock4 className="w-5 sm:w-6 h-5 sm:h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Actions</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg sm:rounded-xl">
                  <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Scheduled Visits</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{scheduledCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-1 w-full">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, phone or property..."
                    className="w-full !pl-10 sm:!pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm sm:text-base"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <select
                    className="w-full !pl-10 sm:!pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm sm:text-base appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Master Table */}
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Calendar className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Details
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property Interest
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Agent
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((app) => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-700">
                                  {app.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{app.fullName}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-gray-400" /> {app.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="max-w-[240px]">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {app.propertyId?.title || 'Unknown Property'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin size={12} /> {app.propertyId?.locality}, {app.propertyId?.city}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {app.agent ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                {app.agent.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{app.agent.fullName}</div>
                                <div className="text-[10px] text-gray-500">{app.agent.mobile}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-600" />
                            {new Date(app.preferredDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <Clock size={14} /> {app.preferredTime}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${getStatusStyle(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
                            <ExternalLink size={14} /> View
                          </button>
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

