'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Layers, Home, Building, Users, Activity, Settings, LogOut, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (e) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateCategoryStatus = async (category: any, status: number) => {
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          fields: category.fields || [],
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category status');

      setCategories((prev) => prev.map((cat) => (cat._id === category._id ? { ...cat, status } : cat)));
      const label = status === 1 ? 'Active' : 'Inactive';
      toast.success(`Category "${category.name}" is now ${label}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update category status');
    }
  };

  const handleCategoryStatusToggle = async (category: any) => {
    const nextStatus = category.status === 1 ? 2 : 1;
    const label = nextStatus === 1 ? 'Active' : 'Inactive';

    const result = await Swal.fire({
      title: 'Confirm status change',
      text: `Set category "${category.name}" to ${label}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, set ${label}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      updateCategoryStatus(category, nextStatus);
    }
  };

  return (
    <DashboardLayout>
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Categories</h1>
              <p className="text-gray-500">Manage categories and their dynamic form fields.</p>
            </div>
            <Link href="/categories/add" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
              <Plus size={18} /> Add Category
            </Link>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full !pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-bold">Category Name</th>
                      <th scope="col" className="px-6 py-4 font-bold">Total Fields</th>
                      <th scope="col" className="px-6 py-4 font-bold">Status</th>
                      <th scope="col" className="px-6 py-4 font-bold">Created Date</th>
                      <th scope="col" className="px-6 py-4 font-bold text-right" style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map(i => (
                      <tr key={i} className="bg-white border-b border-gray-50 animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-14 mx-auto"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
              <Layers size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Categories Found</h3>
              <p className="text-gray-500 mb-6 w-full max-w-sm mx-auto">You haven't added any property categories yet. Create one to dynamically map fields to property listings.</p>
              <Link href="/categories/add" className="px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl inline-flex items-center gap-2 hover:bg-indigo-100 transition-all">
                <Plus size={18} /> Create First Category
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-bold">Category Name</th>
                      <th scope="col" className="px-6 py-4 font-bold">Total Fields</th>
                      <th scope="col" className="px-6 py-4 font-bold">Status</th>
                      <th scope="col" className="px-6 py-4 font-bold">Created Date</th>
                      <th scope="col" className="px-6 py-4 font-bold text-right" style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => (
                      <tr key={cat._id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 inline-block">
                            {cat.fields?.length || 0} Fields
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            onClick={() => handleCategoryStatusToggle(cat)}
                            className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all
                              ${cat.status === 1
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                : 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100'
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cat.status === 1 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                            ></span>

                            {cat.status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-500">
                          {new Date(cat.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/categories/${cat._id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Category">
                              <Edit size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
