'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';
import { Users, Phone, Calendar, MessageSquare, TrendingUp, Search, ExternalLink, Filter, MessageCircle, X } from 'lucide-react';

interface BotUser {
  _id: string;
  name: string;
  mobile: string;
  status: string;
  leadStatus: 'cold' | 'warm' | 'hot';
  lastPropertyInterest?: {
    title: string;
    locality: string;
    price: number;
  };
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  message: string;
  response: string;
  timestamp: string;
}

export default function LeadsPage() {
  const [users, setUsers] = useState<BotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BotUser | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter(u =>
    u.mobile.includes(search) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-rose-100 text-rose-800';
      case 'warm': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const activeCount = users.filter(m => m.status === 'active').length;
  const hotCount = users.filter(m => m.leadStatus === 'hot').length;

  const openChatHistory = async (user: BotUser) => {
    setSelectedUser(user);
    setChatHistory([]); // Clear previous user's history to avoid showing stale data
    setIsChatModalOpen(true);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/leads/${user._id}/chat`);
      const data = await res.json();
      setChatHistory(data.chats || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setChatLoading(false);
    }
  };

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
      <DashboardHeader title="Leads" />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your relationship and inbound prospects</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-indigo-50 rounded-lg sm:rounded-xl">
                  <Users className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-rose-50 rounded-lg sm:rounded-xl">
                  <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Hot High-Intent</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{hotCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg sm:rounded-xl">
                  <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Now</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeCount}</p>
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
                    placeholder="Search by name or phone..."
                    className="w-full !pl-10 sm:!pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm sm:text-base"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leads Master Table */}
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Users className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
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
                        Contact Profile
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Status
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Primary Interest
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Seen
                      </th>
                      <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-700">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Inbound Prospect'}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-gray-400" /> {user.mobile}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${getStatusStyle(user.leadStatus || 'cold')}`}>
                            {user.leadStatus || 'cold'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {user.lastPropertyInterest ? (
                            <div className="max-w-[240px]">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.lastPropertyInterest.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {user.lastPropertyInterest.locality} • ₹{user.lastPropertyInterest.price}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Awaiting selection...</p>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(user.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openChatHistory(user)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                          >
                            <MessageCircle size={14} /> Chat
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

      {/* Chat History Modal */}
      {isChatModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-gray-50 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedUser.name || 'Inbound Prospect'}</h2>
                <p className="text-sm text-gray-500">{selectedUser.mobile}</p>
              </div>
              <button
                onClick={() => setIsChatModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f0f2f5]">
              {chatLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>No chat history available for this lead.</p>
                </div>
              ) : (
                (() => {
                  const grouped = chatHistory.reduce((groups: { [key: string]: ChatMessage[] }, chat) => {
                    const dateStr = new Date(chat.timestamp).toDateString();
                    if (!groups[dateStr]) groups[dateStr] = [];
                    groups[dateStr].push(chat);
                    return groups;
                  }, {});

                  const formatChatDate = (date: Date) => {
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    if (date.toDateString() === today.toDateString()) return 'Today';
                    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  };

                  return Object.entries(grouped).map(([dateStr, chats]) => (
                    <div key={dateStr} className="space-y-4">
                      <div className="flex justify-center my-6">
                        <span className="bg-[#e1f3fb] text-[#54656f] text-[11px] font-medium uppercase px-3 py-1 rounded-lg shadow-sm">
                          {formatChatDate(new Date(dateStr))}
                        </span>
                      </div>
                      {chats.map((chat, idx) => (
                        <div key={chat._id || idx} className="space-y-2">
                          {/* User Message */}
                          {chat.message && (
                            <div className="flex justify-end">
                              <div className="bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-none px-3 py-2 max-w-[85%] text-sm shadow-sm relative">
                                <p className="pr-12">{chat.message}</p>
                                <span className="text-[10px] text-[#667781] absolute bottom-1 right-2">
                                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              </div>
                            </div>
                          )}
                          {/* Bot Response */}
                          {chat.response && (
                            <div className="flex justify-start">
                              <div className="bg-white text-[#111b21] rounded-lg rounded-tl-none px-3 py-2 max-w-[85%] text-sm shadow-sm relative">
                                <p className="pr-12 whitespace-pre-wrap">{chat.response}</p>
                                <span className="text-[10px] text-[#667781] absolute bottom-1 right-2">
                                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
