'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, LogOut, Settings, Users, Building, TrendingUp, Activity, BarChart3, Clock, Layers } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Sample data for dashboard
  const stats = [
    { label: 'NEW LEADS', value: '0', change: '+12% ↑', subtext: '0 added today', icon: Users, color: 'from-indigo-50 to-indigo-100', textColor: 'text-indigo-600', iconBg: 'bg-indigo-500', changeColor: 'text-green-600' },
    { label: 'ACTIVE APPOINTMENTS', value: '0', change: '+5% ↑', subtext: 'Next 24h: 3', icon: Activity, color: 'from-emerald-50 to-emerald-100', textColor: 'text-emerald-600', iconBg: 'bg-emerald-500', changeColor: 'text-green-600' },
    { label: 'HOT OPPORTUNITIES', value: '0', change: '+8% ↑', subtext: 'Conversion: 24%', icon: TrendingUp, color: 'from-rose-50 to-rose-100', textColor: 'text-rose-600', iconBg: 'bg-rose-500', changeColor: 'text-green-600' },
    { label: 'HANDOVER PENDING', value: '0', change: '-2% ↓', subtext: 'Avg. wait: 14m', icon: Clock, color: 'from-slate-50 to-slate-100', textColor: 'text-slate-600', iconBg: 'bg-slate-400', changeColor: 'text-red-600' },
  ];

  const statusData = [
    { label: 'HOT Status', value: 0, color: 'bg-red-500' },
    { label: 'WARM Status', value: 0, color: 'bg-yellow-500' },
    { label: 'COLD Status', value: 0, color: 'bg-blue-500' },
  ];

  return (
    <DashboardLayout>
      {/* Main Content */}
      <main className="flex flex-col h-full">
        <DashboardHeader />

        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
            {stats.map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 border border-opacity-20 border-gray-300 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.iconBg} w-14 h-14 rounded-xl flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${stat.changeColor}`}>{stat.change}</p>
                    <p className="text-xs text-gray-600">{stat.subtext}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lead Health & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Lead Health</h2>
                  <p className="text-sm text-gray-500 mt-1">Quality score distribution</p>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                <BarChart3 className="w-12 h-12 text-indigo-300 mb-2" />
                <p className="text-gray-400 text-sm font-medium">No lead data available</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Status Breakdown</h2>
              <div className="space-y-4">
                {statusData.map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${status.color} shadow-sm`}></div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{status.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{status.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity & Demand */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500 mt-1">Latest lead interactions</p>
                </div>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-40 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                <Activity className="w-12 h-12 text-amber-300 mb-2" />
                <p className="text-gray-400 text-sm font-medium">No activity data yet</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Demand by Type</h2>
                  <p className="text-sm text-gray-500 mt-1">Popular property categories</p>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-40 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <BarChart3 className="w-12 h-12 text-purple-300 mb-2" />
                <p className="text-gray-400 text-sm font-medium">No demand data yet</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
