'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
      // Assemble payout details
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
        headers: {
          'Content-Type': 'application/json',
        },
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

      setSuccessMsg(data.message || 'Registration successful!');
      setTimeout(() => {
        router.push('/partners/dashboard');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> BookTherapick Partner Program
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Apply for Partner Access
          </h1>
          <p className="text-sm text-[#6B645C]">
            Start earning 15% commission on referred BookTherapick spa bookings across Bali.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Partner Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#736B63] border-b border-[#F0EBE1] pb-2">
              1. Personal & Business Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Wayan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Sutarjana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Villa, Hotel, or Business Name</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Villa Mandala Ubud / Bali Tour Guide"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Partner Type *</label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  <option value="hotel_villa">Villa, Hotel or Resort Host</option>
                  <option value="tour_driver">Tour Driver / Private Chauffeur</option>
                  <option value="content_creator">Content Creator / Influencer</option>
                  <option value="wellness_influencer">Yoga / Wellness Practitioner</option>
                  <option value="local_business">Local Travel Agency / Business</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Preferred Referral Code (Optional)
                </label>
                <input
                  type="text"
                  name="custom_code"
                  value={formData.custom_code}
                  onChange={handleChange}
                  placeholder="e.g. MANDALA15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm uppercase text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#736B63] border-b border-[#F0EBE1] pb-2">
              2. Contact & Credentials
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Portal Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payout Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#736B63] border-b border-[#F0EBE1] pb-2">
              3. Payout Method (Can be updated anytime)
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Payout Method</label>
              <select
                name="payout_method"
                value={formData.payout_method}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="bank_transfer">Indonesian Bank Transfer (IDR)</option>
                <option value="wise">Wise Account</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {formData.payout_method === 'bank_transfer' && (
              <div className="space-y-3 p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE4DA]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A443D] mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="BCA, Mandiri, BRI, BNI..."
                      className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A443D] mb-1">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A443D] mb-1">Account Holder Full Name</label>
                  <input
                    type="text"
                    name="account_holder"
                    value={formData.account_holder}
                    onChange={handleChange}
                    placeholder="As registered in the bank"
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                  />
                </div>
              </div>
            )}

            {formData.payout_method === 'wise' && (
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE4DA]">
                <label className="block text-xs font-medium text-[#4A443D] mb-1">Wise Email or Account Details</label>
                <input
                  type="email"
                  name="wise_email"
                  value={formData.wise_email}
                  onChange={handleChange}
                  placeholder="wise-account@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                />
              </div>
            )}

            {formData.payout_method === 'paypal' && (
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE4DA]">
                <label className="block text-xs font-medium text-[#4A443D] mb-1">PayPal Email</label>
                <input
                  type="email"
                  name="paypal_email"
                  value={formData.paypal_email}
                  onChange={handleChange}
                  placeholder="paypal@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                />
              </div>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 mt-0.5 border-[#D9D1C7]"
              />
              <span className="text-xs text-[#6B645C] leading-normal">
                I agree to the <Link href="/terms" className="underline text-[#1A1A1A]">Partner Terms of Service</Link> and understand commissions (15%) are eligible on completed treatments.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1A1A1A] hover:bg-[#333] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <span>Submit Partner Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-[#736B63]">
              Already have a partner account?{' '}
              <Link href="/partners/login" className="font-semibold text-[#1A1A1A] hover:underline">
                Log in here
              </Link>
            </span>
          </div>

        </form>
      </div>
    </div>
  );
}
