'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error State
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const messages: string[] = [];

    // Email Validation
    if (!email) {
      newErrors.email = 'Email is required.';
      messages.push(newErrors.email);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
      messages.push(newErrors.email);
    }

    // Password Validation
    if (!password) {
      newErrors.password = 'Password is required.';
      messages.push(newErrors.password);
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
      messages.push(newErrors.password);
    } else if (password.length > 32) {
      newErrors.password = 'Password must be under 32 characters.';
      messages.push(newErrors.password);
    }

    setErrors(newErrors);
    if (messages.length > 0) {
      setAuthError(messages.join(' '));
      return false;
    }
    setAuthError(null);
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
      } else {
        setAuthSuccess('Login successful. Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setAuthError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen w-screen bg-gray-100 flex items-stretch">
      <div className="w-full h-full flex">
        {/* Left purple panel */}
        <div className="flex-1 bg-gradient-to-b from-indigo-600 to-violet-600 p-12 text-white flex flex-col justify-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold mb-4">DesiProperty Admin</h1>
            <p className="text-gray-100/90 mb-10">Empowering real estate teams with AI-driven lead management and property matching.</p>

            <div className="mt-10">
              <div className="border-t border-white/20 pt-6 text-sm text-white/80">
                <div className="mb-2">— PHASE 1 MVP</div>
                <div className="text-xs">© 2024 DesiProperty Technology Pvt Ltd.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right white card */}
        <div className="flex-1 bg-white p-10 flex items-center">
          <div className="max-w-md mx-auto w-full">
            {authError && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                {authSuccess}
              </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Login to your account</h2>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Work Email */}
              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-600 block mb-2">Work Email</label>
                <div className="relative">
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="admin@estate.com"
                    className={`w-full pl-4 pr-4 py-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.email ? 'ring-red-400' : 'ring-indigo-300/30'}`}
                  />
                </div>
                {/* validation messages shown in top banner */}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-600 block mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-4 pr-12 py-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.password ? 'ring-red-400' : 'ring-indigo-300/30'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* validation messages shown in top banner */}
              </div>


              <button
                type="submit"
                disabled={isLoading || !!authSuccess}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
{/* 
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 text-center">
              Demo Emails: <div className="mt-2 text-xs text-gray-600">admin@estate.com or sarah@estate.com</div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
