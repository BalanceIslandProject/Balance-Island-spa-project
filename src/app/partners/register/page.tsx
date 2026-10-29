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
  Building2, 
  User, 
  CreditCard,
  MessageCircle,
  Globe,
  Landmark,
  Check
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
    payout_method: 'bank_transfer',
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
    wise_email: '',
    paypal_email: '',
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

  const handleSelectPayout = (method: string) => {
    setFormData((prev) => ({ ...prev, payout_method: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Partner Terms & Conditions.');
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
      const payout_details = {
        bank_name: formData.bank_name || 'BCA',
        account_number: formData.account_number,
        account_holder: formData.account_holder,
      };

      const res = await fetch('/api/affiliates/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          email: formData.email,
          phone: formData.whatsapp, // Synchronize whatsapp to phone for backend database compatibility
          whatsapp: formData.whatsapp,
          partner_type: formData.partner_type,
          custom_code: formData.custom_code,
          password: formData.password,
          payout_method: formData.payout_method,
          payout_details,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Partner account registered and awaiting admin approval
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
      <div className="max-w-md mx-auto py-8 sm:py-16 px-4">
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 sm:p-8 text-center space-y-5">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>

          <div className="w-12 h-12 bg-[#fafafa] rounded-[6px] flex items-center justify-center mx-auto text-[#171717] border border-[#ebebeb]">
            <Clock size={20} />
          </div>

          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] bg-[#fafafa] px-2.5 py-0.5 rounded-[4px] border border-[#ebebeb] inline-block">
              Pending Admin Review
            </span>
            <h2 className="text-xl font-normal text-[#171717] tracking-[-0.03em] pt-1">
              Application Submitted
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed max-w-sm mx-auto">
              Thank you for applying to the Therapick Partner Program. Your account has been registered and is currently under review by our operations team.
            </p>
          </div>

          {submittedPartnerCode && (
            <div className="bg-[#fafafa] border border-[#ebebeb] rounded-[6px] p-4 text-xs">
              <span className="text-[#666666] block font-mono text-[10px] uppercase tracking-[0.071em] mb-1">
                Assigned Partner Code
              </span>
              <span className="font-mono font-medium text-[#171717] text-base tracking-wider">
                #{submittedPartnerCode}
              </span>
            </div>
          )}

          <div className="p-4 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs text-[#666666] text-left space-y-1.5">
            <p className="font-medium text-[#171717]">What happens next?</p>
            <p className="text-[#666666] leading-relaxed text-xs">
              We verify all partner applications within 24 hours. Once activated, you can log in with your email and password to access your custom QR code, booking tracking, and payouts.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/partners/login"
              className="w-full py-2.5 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono text-[11px] uppercase tracking-[0.071em] transition-colors flex items-center justify-center gap-2"
            >
              <span>Go to Partner Login</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/partners"
              className="w-full py-2.5 rounded-[6px] border border-[#ebebeb] text-[#171717] hover:bg-[#fafafa] font-mono text-[11px] uppercase tracking-[0.071em] transition-colors text-center"
            >
              Return to Partner Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 sm:p-8 space-y-6 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        
        {/* Header */}
        <div className="space-y-2 pb-4 border-b border-[#ebebeb] text-center">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-normal text-[#171717] tracking-[-0.03em]">
              Join the Therapick Partner Network
            </h1>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Earn commissions on referred mobile spa bookings across Bali
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-[6px] border border-red-200 bg-red-50 text-red-700 text-xs font-normal flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Partner Profile */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-2">
              <User size={14} className="text-[#171717]" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#171717]">
                1. Partner & Business Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
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
                className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Partner Type</label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors cursor-pointer"
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
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Custom Promo Code (Optional)</label>
                <input
                  type="text"
                  name="custom_code"
                  value={formData.custom_code}
                  onChange={handleChange}
                  placeholder="e.g. MANDALA"
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs uppercase font-mono text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors placeholder:normal-case"
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
              <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                inputMode="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
                  WhatsApp Number *
                </label>
                <span className="font-mono text-[10px] text-[#8f8f8f]">With country code</span>
              </div>
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
                  className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs font-mono text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#666666] mt-1 leading-relaxed">
                Include country code (e.g. +62 for Indonesia). Used exclusively for booking attribution alerts & partner support.
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 pr-9 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
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
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 pr-9 rounded-[6px] border border-[#ebebeb] text-xs text-[#171717] bg-white focus:outline-none focus:border-[#171717] transition-colors"
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

          {/* Section 3: Bank Transfer Payout Destination */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[#ebebeb] pb-2">
              <Landmark size={14} className="text-[#171717]" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#171717]">
                3. Bank Transfer Payout Destination
              </h2>
            </div>
            <p className="text-[11px] text-[#666666]">
              Where you receive your weekly or monthly partner commissions via direct Indonesian bank transfer.
            </p>

            {/* Direct Bank Transfer Inputs */}
            <div className="space-y-3 p-4 rounded-[6px] border border-[#ebebeb] bg-[#fafafa]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="e.g. BCA, Mandiri, BRI, BNI"
                    className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs bg-white text-[#171717] focus:outline-none focus:border-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="e.g. 1234567890"
                    className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs bg-white text-[#171717] font-mono focus:outline-none focus:border-[#171717]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  name="account_holder"
                  value={formData.account_holder}
                  onChange={handleChange}
                  placeholder="As registered in your bank passbook"
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs bg-white text-[#171717] focus:outline-none focus:border-[#171717]"
                />
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded-[3px] mt-0.5 accent-[#171717] cursor-pointer"
              />
              <span className="text-xs text-[#666666] leading-relaxed">
                I agree to the <Link href="/partners/terms" className="underline text-[#171717] font-medium">Partner Policy & Agreement</Link> and understand commissions are automatically attributed on completed & verified wellness rituals.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono text-[11px] uppercase tracking-[0.071em] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Submitting Application...' : 'Submit Partner Application'}</span>
              {!loading && <ArrowRight size={13} />}
            </button>
          </div>

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
