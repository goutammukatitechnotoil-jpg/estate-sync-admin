'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LogOut, Settings, Users, Building, Activity, Layers } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-screen z-50 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3 sticky top-0 bg-white z-10">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0">
            <Building className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-wide">DesiProperty</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Home className="w-5 h-5 shrink-0" /> Dashboard
          </Link>
          <Link
            href="/properties"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/properties') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Building className="w-5 h-5 shrink-0" /> Properties
          </Link>
          <Link
            href="/categories"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/categories') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Layers className="w-5 h-5 shrink-0" /> Categories
          </Link>
          <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors" href="#">
            <Users className="w-5 h-5 shrink-0" /> Leads
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors" href="#">
            <Activity className="w-5 h-5 shrink-0" /> Appointments
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors" href="#">
            <Settings className="w-5 h-5 shrink-0" /> Settings
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-indigo-600">J</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John</p>
              <p className="text-xs text-gray-500 truncate">ADMIN</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
