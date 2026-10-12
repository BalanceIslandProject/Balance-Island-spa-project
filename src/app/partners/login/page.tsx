'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    <div className="max-w-sm mx-auto py-12">
      <div className="bg-white border border-black/10 rounded-2xl p-6 sm:p-8 space-y-6">
        
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Partner Access</span>
          <h1 className="font-serif text-2xl font-bold text-black">
            Log In
          </h1>
          <p className="text-xs text-black/60">
            Access your referral links, QR code, and earnings.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-black hover:bg-black/80 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-black/10">
          <p className="text-xs text-black/60">
            Don't have an account?{' '}
            <Link href="/partners/register" className="font-semibold text-black hover:underline">
              Apply here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
