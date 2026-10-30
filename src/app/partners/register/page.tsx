'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  MessageCircle, 
  CheckCircle2
} from 'lucide-react';

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

  if (isSubmitted) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 sm:py-16 px-4">
        <div className="bg-white border border-[#ebebeb] rounded-[6px] p-6 sm:p-8 text-center space-y-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>

          <div className="w-11 h-11 bg-[#fafafa] rounded-[6px] flex items-center justify-center mx-auto text-[#171717] border border-[#ebebeb]">
            <Clock size={20} />
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
            <div className="bg-[#fafafa] border border-[#ebebeb] rounded-[6px] p-3.5 text-xs text-center">
              <span className="text-[#666666] block font-mono text-[10px] uppercase tracking-[0.071em] mb-1">
                Assigned Partner Code
              </span>
              <span className="font-mono font-medium text-[#171717] text-base tracking-wider">
                #{submittedPartnerCode}
              </span>
            </div>
          )}

          <div className="p-4 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs text-left space-y-1.5">
            <div className="flex items-center gap-2 text-[#171717] font-medium font-sans">
              <CheckCircle2 size={14} className="text-[#297a3a]" />
              <span>Next Steps</span>
            </div>
            <p className="text-[#666666] leading-relaxed text-[12px]">
              Once approved, log in to connect your bank account, download printable QR assets, and track booking attributions in real time.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/partners/login"
              className="w-full h-10 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono text-xs uppercase tracking-[0.071em] transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Go to Partner Login</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/partners"
              className="w-full h-10 rounded-[6px] border border-[#ebebeb] text-[#171717] hover:bg-[#fafafa] font-mono text-xs uppercase tracking-[0.071em] transition-colors flex items-center justify-center text-center"
            >
              Return to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto py-4 sm:py-8 md:py-12 px-3 sm:px-6">
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 sm:p-7 md:p-8 space-y-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
        
        {/* Form Header */}
        <div className="pb-4 border-b border-[#ebebeb] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666]">
              Partner Application
            </span>
            <span className="font-mono text-[10px] text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/25">
              Free Registration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#171717] tracking-[-0.03em]">
            Join the Partner Network
          </h1>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-[6px] border border-red-200 bg-red-50 text-red-700 text-xs font-normal flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Partner & Business Profile */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-2">
              <User size={14} className="text-[#171717]" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#171717]">
                1. Partner Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                Villa, Hotel, or Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Villa Mandala Ubud"
                className="w-full h-10 px-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                  Partner Type
                </label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors cursor-pointer"
                >
                  <option value="hotel_villa">Villa or Hotel Host</option>
                  <option value="tour_driver">Tour Driver / Guide</option>
                  <option value="content_creator">Content Creator / Influencer</option>
                  <option value="wellness_influencer">Yoga / Wellness Professional</option>
                  <option value="local_business">Local Travel Agency / Business</option>
                  <option value="other">Other Partner</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                  Custom Promo Code (Optional)
                </label>
                <input
                  type="text"
                  name="custom_code"
                  value={formData.custom_code}
                  onChange={handleChange}
                  placeholder="e.g. MANDALA"
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] uppercase font-mono text-[#171717] bg-white placeholder:text-[#a8a8a8] placeholder:normal-case focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Account & WhatsApp */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-2">
              <ShieldCheck size={14} className="text-[#171717]" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#171717]">
                2. Account & WhatsApp Contact
              </h2>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                inputMode="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full h-10 px-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                WhatsApp Number *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none">
                  <MessageCircle size={15} />
                </div>
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  inputMode="tel"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+62 812 3456 7890"
                  className="w-full h-10 pl-9 pr-3.5 rounded-[6px] border border-[#ebebeb] text-[13px] font-mono text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
                />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full h-10 px-3.5 pr-9 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#171717] p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full h-10 px-3.5 pr-9 rounded-[6px] border border-[#ebebeb] text-[13px] text-[#171717] bg-white placeholder:text-[#a8a8a8] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#171717] p-1 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
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

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[6px] bg-[#171717] hover:bg-black active:scale-[0.99] text-white font-mono text-xs uppercase tracking-[0.071em] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{loading ? 'Submitting Application...' : 'Submit Partner Application'}</span>
              {!loading && <ArrowRight size={13} />}
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
