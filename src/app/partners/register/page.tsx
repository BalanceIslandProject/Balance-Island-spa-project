'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Clock, ArrowRight, ShieldCheck, AlertCircle, Building2, User, CreditCard } from 'lucide-react';

export default function PartnerRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    email: '',
    phone: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Partner Terms & Conditions.');
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
      let payout_details: any = {};
      if (formData.payout_method === 'bank_transfer') {
        payout_details = {
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_holder: formData.account_holder,
        };
      } else if (formData.payout_method === 'wise') {
        payout_details = {
          wise_email: formData.wise_email || formData.email,
        };
      } else if (formData.payout_method === 'paypal') {
        payout_details = {
          paypal_email: formData.paypal_email || formData.email,
        };
      }

      const res = await fetch('/api/affiliates/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp || formData.phone,
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
      <div className="max-w-md mx-auto py-8 sm:py-12 px-2">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs text-center space-y-5">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="BookTherapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>

          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-800">
            <Clock size={24} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
              Pending Admin Review
            </span>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Application Submitted
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
              Thank you for applying to the BookTherapick Partner Program! Your account has been registered and is currently awaiting administrator verification.
            </p>
          </div>

          {submittedPartnerCode && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-xs">
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold mb-0.5">Assigned Partner Code</span>
              <span className="font-mono font-bold text-neutral-950 text-sm tracking-wider">#{submittedPartnerCode}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-600 text-left space-y-1">
            <p className="font-semibold text-neutral-900">What happens next?</p>
            <p className="text-neutral-500 leading-relaxed">Our operations team verifies all partner accounts. Once approved, you can log in with your email and password to access your dashboard, referral links, and payouts.</p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/partners/login"
              className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Go to Partner Login</span>
              <ArrowRight size={13} />
            </Link>
            <a
              href="https://www.booktherapick.com"
              className="w-full py-2.5 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-50 font-semibold text-xs transition-colors shadow-2xs text-center"
            >
              Return to BookTherapick
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-6">
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 shadow-2xs space-y-6">
        
        {/* Header */}
        <div className="space-y-2.5 pb-2 border-b border-neutral-100 text-center">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="BookTherapick"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/60">
              Partner Application
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight pt-1">
              Join the BookTherapick Partner Network
            </h1>
            <p className="text-xs text-neutral-500">
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
          
          {/* Section 1: Contact */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-1.5">
              <User size={14} className="text-neutral-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                1. Contact & Business Profile
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
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
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
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Villa, Hotel, or Business Name</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Villa Mandala Ubud"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Partner Type</label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
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
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Custom Code (Optional)</label>
                <input
                  type="text"
                  name="custom_code"
                  value={formData.custom_code}
                  onChange={handleChange}
                  placeholder="e.g. MANDALA15"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs uppercase font-mono text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Credentials & WhatsApp */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-1.5">
              <ShieldCheck size={14} className="text-neutral-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                2. Login Credentials & WhatsApp
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+62 812..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+62 812..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
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
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
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

          {/* Section 3: Payout Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-1.5">
              <CreditCard size={14} className="text-neutral-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                3. Payout Method
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Preferred Payout Method</label>
              <select
                name="payout_method"
                value={formData.payout_method}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
              >
                <option value="bank_transfer">Indonesian Bank Transfer (IDR)</option>
                <option value="wise">Wise Account (International)</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {formData.payout_method === 'bank_transfer' && (
              <div className="space-y-2.5 p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="BCA, Mandiri, BRI..."
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-900 font-mono focus:outline-none focus:border-neutral-950"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Account Holder Full Name</label>
                  <input
                    type="text"
                    name="account_holder"
                    value={formData.account_holder}
                    onChange={handleChange}
                    placeholder="As registered in your bank account"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-950"
                  />
                </div>
              </div>
            )}

            {formData.payout_method === 'wise' && (
              <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Wise Registered Email</label>
                <input
                  type="email"
                  name="wise_email"
                  value={formData.wise_email}
                  onChange={handleChange}
                  placeholder="wise-account@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-950"
                />
              </div>
            )}

            {formData.payout_method === 'paypal' && (
              <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">PayPal Email</label>
                <input
                  type="email"
                  name="paypal_email"
                  value={formData.paypal_email}
                  onChange={handleChange}
                  placeholder="paypal@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-900 focus:outline-none focus:border-neutral-950"
                />
              </div>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-neutral-950"
              />
              <span className="text-xs text-neutral-600 leading-tight">
                I agree to the <Link href="/terms" className="underline text-neutral-950 font-semibold">Partner Terms</Link> and understand commissions are eligible on completed & verified treatments.
              </span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide transition-all active:scale-98 disabled:opacity-50 shadow-xs"
            >
              {loading ? 'Submitting Application...' : 'Submit Partner Application'}
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
