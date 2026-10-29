'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="max-w-md mx-auto py-8 sm:py-16 px-4">
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 space-y-5 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2 pb-4 border-b border-[#ebebeb]">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-normal text-[#171717] tracking-[-0.03em]">
              Partner Portal Login
            </h1>
            <p className="text-xs text-[#666666]">
              Access your referral link, bookings, and commission payouts
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-[6px] border border-red-200 bg-red-50 text-red-700 text-xs leading-relaxed font-normal flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666]">
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
                className="w-full px-3 py-2 pr-10 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#171717] transition-colors p-1"
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
              className="w-full py-2.5 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono text-[11px] uppercase tracking-[0.071em] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>

        <div className="text-center pt-3 border-t border-[#ebebeb]">
          <p className="text-xs text-[#666666]">
            Don't have a partner account?{' '}
            <Link href="/partners/register" className="font-medium text-[#171717] hover:underline">
              Apply to Join
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
