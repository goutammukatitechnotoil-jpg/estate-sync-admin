'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LogOut, Settings, Users, Building, Activity, Layers, Menu, X, Shield } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
        // Don't redirect on error - let middleware handle authentication
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []); // Remove router dependency to avoid re-fetching

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 w-64 bg-white border-r border-gray-200 flex flex-col max-h-screen z-50 overflow-hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>

            <span className="text-xl font-bold text-gray-900 tracking-wide">
              DesiProperty
            </span>
          </div>

          <button
            onClick={closeSidebar}
            className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${pathname === '/dashboard'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Home className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Dashboard</span>
          </Link>
          <Link
            href="/properties"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/properties')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Building className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Properties</span>
          </Link>
          <Link
            href="/categories"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/categories')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Layers className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Categories</span>
          </Link>
          <Link
            href="/roles"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/roles')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Shield className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Roles</span>
          </Link>
          <Link
            href="/team-members"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/team-members')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Users className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Team Members</span>
          </Link>
          <Link
            href="/leads"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-colors ${pathname.startsWith('/leads')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Users className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Leads</span>
          </Link>
          <a
            onClick={closeSidebar}
            className="flex items-center gap-3 px-3 md:px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors cursor-pointer"
            href="#"
          >
            <Activity className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Appointments</span>
          </a>
          <a
            onClick={closeSidebar}
            className="flex items-center gap-3 px-3 md:px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors cursor-pointer"
            href="#"
          >
            <Settings className="w-5 h-5 shrink-0" /> <span className="text-sm md:text-base">Settings</span>
          </a>
        </nav>

        <div className="p-3 md:p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-indigo-600">
                {userLoading ? 'A' : (user?.name?.charAt(0)?.toUpperCase() || 'A')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                {userLoading ? 'Loading...' : (user?.name || 'Admin')}
              </p>
              <p className="text-xs text-gray-500 truncate">ADMIN</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="flex items-center gap-3 px-3 md:px-4 py-2 w-full text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-xs md:text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col max-h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900 text-sm md:text-base">DesiProperty</span>
          <div className="w-8"></div>
        </div>
        {children}
      </div>
    </div>
  );
}
