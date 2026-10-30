'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, AlertCircle, LayoutDashboard, LogOut } from 'lucide-react';
import { VercelSpinner } from '@/components/therapick/TherapickUI';

export default function PartnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Existing session detection
  const [activePartner, setActivePartner] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const res = await fetch('/api/affiliates/auth/me');
        const data = await res.json();
        if (data.success && data.partner) {
          setActivePartner(data.partner);
        }
      } catch {
        // Not logged in
      } finally {
        setCheckingAuth(false);
      }
    }
    checkExistingAuth();
  }, []);

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

  // State A: Already signed in partner
  if (!checkingAuth && activePartner) {
    return (
      <div className="w-full max-w-[420px] mx-auto py-12 sm:py-20 px-4">
        <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 space-y-5 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/25 inline-block font-medium">
              Active Session
            </span>
            <h1 className="text-xl font-normal text-[#171717] tracking-[-0.03em] pt-1">
              Currently Logged In
            </h1>
            <p className="text-xs text-[#666666] leading-relaxed max-w-xs mx-auto">
              You are signed in as <span className="font-medium text-[#171717]">{activePartner.first_name} {activePartner.last_name}</span> (#{activePartner.partner_code}).
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/partners/dashboard"
              className="w-full h-10 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono text-xs uppercase tracking-[0.071em] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <LayoutDashboard size={14} />
              <span>Go to Partner Dashboard</span>
              <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/affiliates/auth/logout', { method: 'POST' });
                window.location.reload();
              }}
              className="w-full h-10 rounded-[6px] border border-[#ebebeb] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] font-mono text-xs uppercase tracking-[0.071em] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State B: Partner Login Form
  return (
    <div className="w-full max-w-[420px] mx-auto py-8 sm:py-16 px-4">
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        
        {/* Brand Logo & Header */}
        <div className="space-y-2 pb-4 border-b border-[#ebebeb]">
          <div className="flex items-center justify-between">
            <Link href="/partners" className="flex items-center gap-2">
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-6 w-auto object-contain"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] bg-[#fafafa] border border-[#ebebeb] px-1.5 py-0.5 rounded-[4px]">
                Partner
              </span>
            </Link>
          </div>
          <div className="space-y-0.5 pt-1">
            <h1 className="text-xl font-normal text-[#171717] tracking-[-0.03em]">
              Partner Portal Login
            </h1>
            <p className="text-xs text-[#666666]">
              Access your referral tracking, QR assets, and commissions.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-[6px] border border-red-200 bg-red-50 text-red-700 text-xs font-normal flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#171717] mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-10 px-3 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#171717]">
                Password <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 px-3 pr-9 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8f8f8f] hover:text-[#171717] transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Sign In Button with Instant Loading UI */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-[6px] bg-[#171717] hover:bg-black active:scale-[0.99] text-white font-mono text-xs uppercase tracking-[0.071em] transition-all disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <VercelSpinner className="w-3.5 h-3.5 text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={13} />
                </>
              )}
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
