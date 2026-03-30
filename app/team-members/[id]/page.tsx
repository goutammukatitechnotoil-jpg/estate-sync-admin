'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Eye, MapPin, Calendar, Phone, Mail, User, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';
import { toast } from 'react-hot-toast';

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

interface IProperty {
    _id: string;
    title: string;
    category: string;
    listingPurpose: string;
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    pricingType: 'fixed' | 'range';
    city: string;
    locality: string;
    availability: boolean;
    highlights: string[];
    images: string[];
}

export default function TeamMemberDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.id as string;

    const [member, setMember] = useState<ITeamMember | null>(null);
    const [properties, setProperties] = useState<IProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (memberId) {
            fetchMemberDetails();
            fetchAssignedProperties();
        }
    }, [memberId]);

    const fetchMemberDetails = async () => {
        try {
            const res = await fetch(`/api/team-members/${memberId}`);
            const data = await res.json();
            if (res.ok) {
                setMember(data.teamMember);
            } else {
                setError(data.error || 'Failed to load team member details');
                toast.error('Unable to load team member details. Please try again.');
            }
        } catch (error) {
            console.error('Failed to fetch team member:', error);
            setError('Failed to load team member details');
            toast.error('Unable to load team member details. Please try again.');
        }
    };

    const fetchAssignedProperties = async () => {
        try {
            const res = await fetch('/api/properties');
            const data = await res.json();
            if (res.ok) {
                // Filter properties assigned to this member
                const assignedProperties = data.properties.filter((prop: any) => prop.assignedAgentId === memberId);
                setProperties(assignedProperties);
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !member) {
        return (
            <DashboardLayout>
                <DashboardHeader title="Team Member Details" />
                <main className="flex-1 p-3 sm:p-4 md:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <XCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {error || 'Team member not found'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Link
                                href="/team-members"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Team Members
                            </Link>
                        </div>
                    </div>
                </main>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader title="Team Member Details" />
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Member Profile Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.push('/team-members')}
                                    className="p-2 mt-1 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group shrink-0"
                                    title="Back to Team Members List"
                                >
                                    <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
                                </button>
                                <h2 className="text-xl font-semibold text-gray-900">Member Profile</h2>
                            </div>
                            <Link
                                href={`/team-members/${member._id}/edit`}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Team Member
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <div className="mt-1 flex items-center">
                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{member.fullName}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                    <div className="mt-1 flex items-center">
                                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{member.mobileNumber}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email ID</label>
                                    <div className="mt-1 flex items-center">
                                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{member.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <div className="mt-1 flex items-center">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1 flex items-center">
                                        {member.status === 'Active' ? (
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500 mr-2" />
                                        )}
                                        <span className={`text-sm font-semibold ${member.status === 'Active' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </div>
                                </div>
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700">Created/Updated Date & Time</label>
                                    <div className="mt-1 flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">
                                            Created: {new Date(member.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">
                                            Updated: {new Date(member.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* Assigned Properties Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Assigned Properties</h2>

                        {properties.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-gray-900">No properties assigned</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    No properties assigned to this team member.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {properties.map((property) => (
                                    <div key={property._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4">
                                                    {property.images && property.images.length > 0 && (
                                                        <img
                                                            src={property.images[0]}
                                                            alt={property.title}
                                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate">{property.title}</h3>
                                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            {property.locality}, {property.city}
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-4 text-sm">
                                                            <span className="text-gray-600">{property.category}</span>
                                                            <span className="text-gray-600">{property.listingPurpose}</span>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${property.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {property.availability ? 'Available' : 'Not Available'}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-sm font-medium text-gray-900">
                                                            {property.pricingType === 'fixed'
                                                                ? `₹${property.price?.toLocaleString()}`
                                                                : `₹${property.minPrice?.toLocaleString()} - ₹${property.maxPrice?.toLocaleString()}`
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <Link
                                                    href={`/properties/${property._id}`}
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View Property
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}