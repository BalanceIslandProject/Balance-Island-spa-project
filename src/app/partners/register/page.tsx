'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

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
      <div className="max-w-md mx-auto py-12 px-2">
        <div className="bg-white border border-black/10 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgb(0,0,0,0.04)] text-center space-y-6">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="BookTherapick"
              className="h-8 w-auto max-w-[160px] object-contain"
            />
          </div>

          <div className="w-14 h-14 bg-black/[0.04] rounded-full flex items-center justify-center mx-auto text-black">
            <Clock size={28} />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 bg-black/[0.04] px-2.5 py-0.5 rounded-full border border-black/5">
              Pending Admin Approval
            </span>
            <h2 className="font-serif text-2xl font-bold text-black tracking-tight">
              Application Submitted
            </h2>
            <p className="text-xs text-black/70 leading-relaxed max-w-sm mx-auto">
              Thank you for applying to the BookTherapick Partner Program! Your account has been registered and is currently awaiting administrator approval.
            </p>
          </div>

          {submittedPartnerCode && (
            <div className="bg-black/[0.02] border border-black/10 rounded-2xl p-4 text-xs">
              <span className="text-black/50 block text-[11px] mb-0.5">Assigned Partner Code</span>
              <span className="font-mono font-bold text-black text-sm tracking-wider">#{submittedPartnerCode}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 text-xs text-black/60 text-left space-y-1">
            <p className="font-semibold text-black">What happens next?</p>
            <p>Our team verifies all partner accounts. Once approved, you will be able to log in with your email and password to access your dashboard, referral links, and payouts.</p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/partners/login"
              className="w-full py-3 rounded-xl bg-black hover:bg-black/85 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>Go to Partner Login</span>
              <ArrowRight size={14} />
            </Link>
            <a
              href="https://www.booktherapick.com"
              className="w-full py-2.5 rounded-xl border border-black/20 text-black hover:bg-black/5 font-semibold text-xs transition-colors"
            >
              Return to BookTherapick
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="bg-white border border-black/10 rounded-3xl p-6 sm:p-10 shadow-[0_4px_25px_rgb(0,0,0,0.04)] space-y-6">
        
        {/* Header */}
        <div className="space-y-3 pb-2 border-b border-black/5">
          <div className="flex justify-center items-center">
            <img
              src="/therapick-logo-2.png"
              alt="BookTherapick"
              className="h-8 w-auto max-w-[160px] object-contain"
            />
          </div>
          <div className="space-y-1 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Partner Application</span>
            <h1 className="font-serif text-2xl font-bold text-black">
              Join the Partner Program
            </h1>
            <p className="text-xs text-black/60">
              Earn 15% commission on referred BookTherapick treatments in Bali.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1.5">
              1. Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1">Villa, Hotel, or Business Name</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Villa Mandala Ubud"
                className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Partner Type</label>
                <select
                  name="partner_type"
                  value={formData.partner_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black bg-white focus:outline-none focus:border-black"
                >
                  <option value="hotel_villa">Villa or Hotel Host</option>
                  <option value="tour_driver">Tour Driver / Guide</option>
                  <option value="content_creator">Content Creator / Influencer</option>
                  <option value="wellness_influencer">Yoga / Wellness</option>
                  <option value="local_business">Local Agency / Business</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Custom Referral Code (Optional)</label>
                <input
                  type="text"
                  name="custom_code"
                  value={formData.custom_code}
                  onChange={handleChange}
                  placeholder="e.g. MANDALA15"
                  className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs uppercase text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1.5">
              2. Credentials & WhatsApp
            </h2>

            <div>
              <label className="block text-xs font-semibold text-black mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black p-1 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1.5">
              3. Payout Method
            </h2>

            <div>
              <label className="block text-xs font-semibold text-black mb-1">Payout Method</label>
              <select
                name="payout_method"
                value={formData.payout_method}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black bg-white focus:outline-none focus:border-black"
              >
                <option value="bank_transfer">Indonesian Bank Transfer (IDR)</option>
                <option value="wise">Wise Account</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {formData.payout_method === 'bank_transfer' && (
              <div className="space-y-2 p-3 rounded-lg border border-black/10 bg-black/[0.02]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="BCA, Mandiri, BRI..."
                      className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-black mb-1">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      placeholder="e.g. 1234567890"
                      className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-black mb-1">Account Holder Full Name</label>
                  <input
                    type="text"
                    name="account_holder"
                    value={formData.account_holder}
                    onChange={handleChange}
                    placeholder="As registered in the bank"
                    className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {formData.payout_method === 'wise' && (
              <div className="p-3 rounded-lg border border-black/10 bg-black/[0.02]">
                <label className="block text-[11px] font-semibold text-black mb-1">Wise Email</label>
                <input
                  type="email"
                  name="wise_email"
                  value={formData.wise_email}
                  onChange={handleChange}
                  placeholder="wise-account@example.com"
                  className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
                />
              </div>
            )}

            {formData.payout_method === 'paypal' && (
              <div className="p-3 rounded-lg border border-black/10 bg-black/[0.02]">
                <label className="block text-[11px] font-semibold text-black mb-1">PayPal Email</label>
                <input
                  type="email"
                  name="paypal_email"
                  value={formData.paypal_email}
                  onChange={handleChange}
                  placeholder="paypal@example.com"
                  className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
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
                className="w-4 h-4 rounded mt-0.5"
              />
              <span className="text-xs text-black/70 leading-tight">
                I agree to the <Link href="/terms" className="underline text-black font-semibold">Partner Terms</Link> and understand commissions (15%) are eligible on completed treatments.
              </span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-black hover:bg-black/80 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Submit Partner Application'}
            </button>
          </div>

          <div className="text-center pt-1">
            <span className="text-xs text-black/60">
              Already registered?{' '}
              <Link href="/partners/login" className="font-semibold text-black hover:underline">
                Log in here
              </Link>
            </span>
          </div>

        </form>
      </div>
    </div>
  );
}
