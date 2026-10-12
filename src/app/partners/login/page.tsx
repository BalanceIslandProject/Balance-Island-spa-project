'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

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
    <div className="max-w-md mx-auto py-8 sm:py-12 px-2">
      <div className="bg-white border border-black/10 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgb(0,0,0,0.04)] space-y-6">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3 pb-2 border-b border-black/5">
          <div className="flex justify-center items-center gap-2">
            <img
              src="/therapick-logo-2.png"
              alt="BookTherapick"
              className="h-8 w-auto max-w-[160px] object-contain"
            />
          </div>
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-bold text-black tracking-tight">
              Partner Portal Login
            </h1>
            <p className="text-xs text-black/60">
              Access your referral link, bookings, and commissions
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl border border-red-200 bg-red-50/80 text-red-700 text-xs leading-relaxed font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/20 text-xs text-black bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-black">
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
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-black/20 text-xs text-black bg-white focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-black hover:bg-black/85 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-black/10">
          <p className="text-xs text-black/60">
            Don't have a partner account?{' '}
            <Link href="/partners/register" className="font-bold text-black hover:underline">
              Apply to Join
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
