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
      <div className="max-w-md mx-auto py-8 sm:py-14 px-2">
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-9 shadow-2xs text-center space-y-6">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-7 w-auto max-w-[150px] object-contain mix-blend-multiply"
            />
          </div>

          <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-800">
            <Clock size={26} />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              Pending Admin Review
            </span>
            <h2 className="font-serif text-2xl font-medium text-neutral-950 tracking-tight pt-1">
              Application Submitted
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
              Thank you for applying to the Therapick Partner Program. Your account has been registered and is currently under review by our operations team.
            </p>
          </div>

          {submittedPartnerCode && (
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 text-xs">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                Assigned Partner Code
              </span>
              <span className="font-mono font-bold text-neutral-950 text-base tracking-wider">
                #{submittedPartnerCode}
              </span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-600 text-left space-y-1.5">
            <p className="font-bold text-neutral-900">What happens next?</p>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
              We verify all partner applications within 24 hours. Once activated, you can log in with your email and password to access your custom QR code, booking tracking, and payouts.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/partners/login"
              className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Go to Partner Login</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/partners"
              className="w-full py-3 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-50 font-semibold text-xs transition-colors shadow-2xs text-center"
            >
              Return to Partner Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 px-1 sm:px-2">
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-9 shadow-2xs space-y-7">
        
        {/* Header */}
        <div className="space-y-3 pb-3 border-b border-neutral-100 text-center">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="Therapick"
              className="h-8 w-auto max-w-[160px] object-contain mix-blend-multiply"
            />
          </div>
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-3 py-0.5 rounded-full border border-neutral-200/60">
              Partner Application
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-neutral-950 tracking-tight pt-1">
              Join the Therapick Partner Network
            </h1>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-light">
              Earn commissions on referred mobile spa bookings across Bali
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-start gap-2 shadow-2xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Partner Profile */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <User size={14} className="text-neutral-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                1. Partner & Business Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                Villa, Hotel, or Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Villa Mandala Ubud"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Partner Type</label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all cursor-pointer"
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
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Custom Promo Code (Optional)</label>
                <input
                  type="text"
                  name="custom_code"
                  value={formData.custom_code}
                  onChange={handleChange}
                  placeholder="e.g. MANDALA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs uppercase font-mono text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400 placeholder:normal-case"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Account & WhatsApp */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <ShieldCheck size={14} className="text-neutral-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                2. Account & WhatsApp Contact
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                inputMode="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* WhatsApp ONLY (Phone Number Removed) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-800">
                  WhatsApp Number *
                </label>
                <span className="text-[10px] text-neutral-400 font-medium">With country code</span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                Include country code (e.g. +62 for Indonesia). Used exclusively for booking attribution alerts & partner support.
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-1 transition-colors"
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
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Landmark size={14} className="text-neutral-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                3. Bank Transfer Payout Destination
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500">
              Where you receive your weekly or monthly partner commissions via direct Indonesian bank transfer.
            </p>

            {/* Direct Bank Transfer Inputs */}
            <div className="space-y-3 p-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/70">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-800 mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="e.g. BCA, Mandiri, BRI, BNI"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-800 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="e.g. 1234567890"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white text-neutral-900 font-mono focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-800 mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  name="account_holder"
                  value={formData.account_holder}
                  onChange={handleChange}
                  placeholder="As registered in your bank passbook"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950"
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
                className="w-4 h-4 rounded mt-0.5 accent-neutral-950 cursor-pointer"
              />
              <span className="text-xs text-neutral-600 leading-relaxed">
                I agree to the <Link href="/terms" className="underline text-neutral-950 font-semibold">Partner Terms</Link> and understand commissions are automatically attributed on completed & verified wellness rituals.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide transition-all active:scale-98 disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Submitting Application...' : 'Submit Partner Application'}</span>
              {!loading && <ArrowRight size={13} />}
            </button>
          </div>

          <div className="text-center pt-1">
            <span className="text-xs text-neutral-500">
              Already registered?{' '}
              <Link href="/partners/login" className="font-semibold text-neutral-900 hover:underline">
                Log in here
              </Link>
            </span>
          </div>

        </form>
      </div>
    </div>
  );
}
