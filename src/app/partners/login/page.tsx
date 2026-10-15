'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, AlertCircle, Lock } from 'lucide-react';

export default function PartnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/affiliates/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      router.push('/partners/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 px-2">
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2.5 pb-2 border-b border-neutral-100">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="BookTherapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              Partner Portal Login
            </h1>
            <p className="text-xs text-neutral-500">
              Access your referral link, bookings, and commission payouts
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/80 text-red-700 text-xs leading-relaxed font-medium flex items-start gap-2 shadow-2xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-800">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Don't have a partner account?{' '}
            <Link href="/partners/register" className="font-semibold text-neutral-900 hover:underline">
              Apply to Join
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
