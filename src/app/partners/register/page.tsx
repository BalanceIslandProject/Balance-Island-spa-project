'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  MessageCircle, 
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import { VercelSpinner } from '@/components/therapick/TherapickUI';

export default function PartnerRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    email: '',
    whatsapp: '',
    partner_type: 'hotel_villa',
    custom_code: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedPartnerCode, setSubmittedPartnerCode] = useState('');
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Partner Policy & Agreement.');
      return;
    }

    if (!formData.whatsapp.trim()) {
      setErrorMsg('Please enter your WhatsApp number with country code.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/affiliates/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          email: formData.email,
          phone: formData.whatsapp,
          whatsapp: formData.whatsapp,
          partner_type: formData.partner_type,
          custom_code: formData.custom_code,
          password: formData.password,
          payout_method: 'bank_transfer',
          payout_details: {},
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setSubmittedPartnerCode(data.partner?.partner_code || '');
      setIsSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  // State A: Already signed in partner
  if (!checkingAuth && activePartner) {
    return (
      <div className="w-full max-w-[460px] mx-auto py-12 sm:py-20 px-4">
        <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 space-y-5 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/25 inline-block">
              Currently Logged In
            </span>
            <h1 className="text-xl font-normal text-[#171717] tracking-[-0.03em] pt-1">
              Active Partner Session
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

  // State B: Registration Submitted Success Card
  if (isSubmitted) {
    return (
      <div className="w-full max-w-[460px] mx-auto py-8 sm:py-16 px-4">
        <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 text-center space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>

          <div className="w-10 h-10 bg-[#fafafa] rounded-[6px] flex items-center justify-center mx-auto text-[#171717] border border-[#ebebeb]">
            <Clock size={18} />
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-block font-medium">
              Pending Admin Review
            </span>
            <h1 className="text-xl sm:text-2xl font-normal text-[#171717] tracking-[-0.03em] pt-1">
              Application Submitted
            </h1>
            <p className="text-xs text-[#666666] leading-relaxed max-w-sm mx-auto">
              Your partner registration is received and under review. Our operations team verifies applications within 24 hours.
            </p>
          </div>

          {submittedPartnerCode && (
            <div className="bg-[#fafafa] border border-[#ebebeb] rounded-[6px] p-3 text-xs text-center">
              <span className="text-[#666666] block font-mono text-[10px] uppercase tracking-[0.071em] mb-0.5">
                Assigned Partner Code
              </span>
              <span className="font-mono font-medium text-[#171717] text-base tracking-wider">
                #{submittedPartnerCode}
              </span>
            </div>
          )}

          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs text-left space-y-1">
            <div className="flex items-center gap-1.5 text-[#171717] font-medium font-sans">
              <CheckCircle2 size={13} className="text-[#297a3a]" />
              <span>Next Steps</span>
            </div>
            <p className="text-[#666666] leading-relaxed text-[11px]">
              Once approved, log in with your credentials to connect your bank account and retrieve your custom QR codes & live attribution tracking.
            </p>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <Link
              href="/partners/login"
              className="w-full h-10 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono text-xs uppercase tracking-[0.071em] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Go to Partner Login</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/partners"
              className="w-full h-10 rounded-[6px] border border-[#ebebeb] text-[#171717] hover:bg-[#fafafa] font-mono text-xs uppercase tracking-[0.071em] transition-all flex items-center justify-center text-center"
            >
              Return to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State C: Registration Form (Refined Vercel Light Design)
  return (
    <div className="w-full max-w-[480px] mx-auto py-6 sm:py-12 px-3 sm:px-4">
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        
        {/* Card Header */}
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
            <span className="font-mono text-[10px] text-[#297a3a] bg-[#297a3a]/10 border border-[#297a3a]/25 px-2 py-0.5 rounded-[4px] font-medium">
              Free Application
            </span>
          </div>
          <div className="space-y-0.5 pt-1">
            <h1 className="text-xl sm:text-[22px] font-normal text-[#171717] tracking-[-0.03em]">
              Partner Application
            </h1>
            <p className="text-xs text-[#666666]">
              Register your accommodation or travel business in Bali.
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
          
          {/* Profile Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full h-10 px-3 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full h-10 px-3 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#171717] mb-1.5">
              Villa, Hotel, or Business Name
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Villa Mandala Ubud"
              className="w-full h-10 px-3 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                Partner Type
              </label>
              <div className="relative">
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full h-10 pl-3 pr-8 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="hotel_villa">Villa or Hotel Host</option>
                  <option value="tour_driver">Tour Driver / Guide</option>
                  <option value="content_creator">Content Creator / Influencer</option>
                  <option value="wellness_influencer">Yoga / Wellness Professional</option>
                  <option value="local_business">Local Travel Agency / Business</option>
                  <option value="other">Other Partner</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none text-[#666666] absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#171717] mb-1.5 flex items-center justify-between">
                <span>Custom Promo Code</span>
                <span className="text-[11px] text-[#8f8f8f] font-normal">Optional</span>
              </label>
              <input
                type="text"
                name="custom_code"
                value={formData.custom_code}
                onChange={handleChange}
                placeholder="e.g. MANDALA"
                className="w-full h-10 px-3 text-[13px] uppercase font-mono text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] placeholder:normal-case hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#ebebeb]">
            <label className="block text-xs font-medium text-[#171717] mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              inputMode="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full h-10 px-3 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#171717] mb-1.5">
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8f8f] pointer-events-none">
                <MessageCircle size={14} />
              </div>
              <input
                type="tel"
                name="whatsapp"
                required
                inputMode="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+62 812 3456 7890"
                className="w-full h-10 pl-9 pr-3 text-[13px] font-mono text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 chars"
                  className="w-full h-10 px-3 pr-8 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8f8f8f] hover:text-[#171717] p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5">
                Confirm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat pass"
                  className="w-full h-10 px-3 pr-8 text-[13px] text-[#171717] bg-white rounded-[6px] border border-[#ebebeb] placeholder:text-[#a8a8a8] hover:border-[#c9c9c9] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8f8f8f] hover:text-[#171717] p-1 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded-[3px] mt-0.5 accent-[#171717] cursor-pointer"
              />
              <span className="text-xs text-[#666666] leading-relaxed">
                I agree to the{' '}
                <Link href="/partners/terms" className="underline text-[#171717] font-medium">
                  Partner Policy & Agreement
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Submit Button with Instant Loading UI */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-[6px] bg-[#171717] hover:bg-black active:scale-[0.99] text-white font-mono text-xs uppercase tracking-[0.071em] transition-all disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <VercelSpinner className="w-3.5 h-3.5 text-white" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Partner Application</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t border-[#ebebeb]">
            <span className="text-xs text-[#666666]">
              Already registered?{' '}
              <Link href="/partners/login" className="font-medium text-[#171717] hover:underline">
                Log in here
              </Link>
            </span>
          </div>

        </form>
      </div>
    </div>
  );
}
