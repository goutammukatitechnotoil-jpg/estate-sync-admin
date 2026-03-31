'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';
import RoleForm from '@/components/RoleForm';

export default function AddRolePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/roles');
  };

  const handleCancel = () => {
    router.push('/roles');
  };

  return (
    <DashboardLayout>
      <DashboardHeader title="Add Role" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => router.push('/roles')}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
              title="Back to Roles"
            >
              <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-all duration-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Role</h1>
              <p className="text-gray-600 text-sm">Create a new role with specific permissions</p>
            </div>
          </div>

          <RoleForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </DashboardLayout>
  );
}