'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, AlertCircle, Lock, Mail } from 'lucide-react';

export default function PartnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-8 sm:p-10 shadow-sm space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> BookTherapick Partner Portal
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Partner Login
          </h1>
          <p className="text-xs sm:text-sm text-[#6B645C]">
            Sign in to access your referral stats, link, and commission earnings.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C847B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C847B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-[#1A1A1A] hover:bg-[#333] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-[#F0EBE1]">
          <p className="text-xs text-[#736B63]">
            Don't have a partner account yet?{' '}
            <Link href="/partners/register" className="font-semibold text-amber-900 hover:underline">
              Apply here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
