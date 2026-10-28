'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, AlertCircle, Lock } from 'lucide-react';

import { SignIn } from '@clerk/nextjs';
import PartnerAuthProvider from '@/components/partner/PartnerAuthProvider';

export default function PartnerLoginPage() {
  const router = useRouter();

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const isClerkAvailable = Boolean(publishableKey && (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')));

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
    <PartnerAuthProvider>
      <div className="max-w-md mx-auto py-8 sm:py-16 px-4">
        {isClerkAvailable ? (
          <div className="flex flex-col items-center space-y-4">
            <SignIn
              path="/partners/login"
              routing="path"
              signUpUrl="/onboarding"
              fallbackRedirectUrl="/partners/dashboard"
            />
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 space-y-5">
          
          {/* Brand Logo & Header */}
          <div className="text-center space-y-2 pb-4 border-b border-[#E5E5E5]">
            <div className="flex justify-center items-center">
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-7 w-auto max-w-[150px] object-contain mix-blend-multiply"
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold text-black tracking-tight">
                Partner Portal Login
              </h1>
              <p className="text-xs text-[#737373]">
                Access your referral link, bookings, and commission payouts
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs leading-relaxed font-medium flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs text-black bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
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
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-[#E5E5E5] text-xs text-black bg-white focus:outline-none focus:border-black transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-black transition-colors p-1"
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
                className="w-full py-2.5 rounded-lg bg-black hover:bg-[#262626] text-white font-medium text-xs tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </form>

          <div className="text-center pt-3 border-t border-[#E5E5E5]">
            <p className="text-xs text-[#737373]">
              Don't have a partner account?{' '}
              <Link href="/partners/register" className="font-semibold text-black hover:underline">
                Apply to Join
              </Link>
            </p>
          </div>

        </div>
        )}
      </div>
    </PartnerAuthProvider>
  );
}
