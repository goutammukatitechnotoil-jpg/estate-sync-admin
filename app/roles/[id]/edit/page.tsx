'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';
import RoleForm from '@/components/RoleForm';
import { toast } from 'react-hot-toast';

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

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const [returnTo, setReturnTo] = useState('/roles');

  const [role, setRole] = useState<IRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnToParam = params.get('returnTo');
    if (returnToParam) {
      setReturnTo(returnToParam);
    }
    fetchRole();
  }, [roleId]);

  const fetchRole = async () => {
    try {
      const res = await fetch(`/api/roles/${roleId}`);
      const data = await res.json();

      if (res.ok && data.role) {
        setRole(data.role);
      } else {
        toast.error('Role not found');
        router.push(returnTo);
      }
    } catch (error) {
      toast.error('Failed to load role');
      router.push(returnTo);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(returnTo);
  };

  const handleCancel = () => {
    router.push(returnTo);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!role) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Role not found</h2>
            <p className="text-gray-600 mt-2">The role you're looking for doesn't exist.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader title="Edit Role" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => router.push(returnTo)}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
              title="Back"
            >
              <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-all duration-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
              <p className="text-gray-600 text-sm">Update role permissions and settings</p>
            </div>
          </div>

          <RoleForm
            role={role}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </DashboardLayout>
  );
}