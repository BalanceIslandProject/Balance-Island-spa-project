'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, User, Phone, Globe, FileText, Loader2 } from 'lucide-react';
import PartnerAuthProvider from '@/components/partner/PartnerAuthProvider';

export default function PartnerOnboardingPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    business_name: '',
    partner_type: 'villa_concierge',
    whatsapp_number: '',
    operating_region: 'Bali, Indonesia',
    business_website: '',
    notes: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    fetch('/api/partner/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.status) {
          if (data.isApproved) {
            router.push('/partner');
          } else {
            router.push('/pending-approval');
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/partner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit application.');
      }

      router.push('/pending-approval');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PartnerAuthProvider>
      <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white py-8 sm:py-14 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <Link href="/partners" className="inline-block">
              <img
                src="/therapick-logo-2.png"
                alt="Therapick"
                className="h-10 sm:h-12 w-auto mx-auto object-contain"
              />
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] font-semibold text-neutral-600 tracking-wide uppercase">
              <Sparkles size={12} className="text-neutral-900" />
              <span>Partner Application</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-medium text-neutral-950 tracking-tight">
              Join the Therapick Partner Network
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
              Partner with Bali's leading in-villa mobile wellness service. Earn 15% commission on every verified treatment booked by your guests.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-10 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {errorMsg && (
                <div className="p-4 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
                  <span className="font-semibold">Notice:</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider pb-1 border-b border-neutral-100">
                  Primary Contact
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="Wayan Sudarta"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Verified Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="partner@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    WhatsApp Number (with Country Code) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+62 812 3456 7890"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Used for booking dispatch notices and commission confirmations.
                  </span>
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider pb-1 border-b border-neutral-100">
                  Business & Partnership Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Business or Villa Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="Villa Sunset Ubud"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Partner Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.partner_type}
                      onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                    >
                      <option value="villa_concierge">Villa Concierge / Manager</option>
                      <option value="hotel_partner">Hotel or Accommodation Partner</option>
                      <option value="private_driver">Private Driver</option>
                      <option value="tour_guide">Tour Guide / Activity Host</option>
                      <option value="travel_agency">Travel Agency / Tour Operator</option>
                      <option value="other_partner">Other Business Partner</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Operating Region
                    </label>
                    <input
                      type="text"
                      placeholder="Ubud, Canggu, Seminyak, Uluwatu..."
                      value={formData.operating_region}
                      onChange={(e) => setFormData({ ...formData, operating_region: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Website or Instagram (Optional)
                    </label>
                    <div className="relative">
                      <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="https://... or @instagram"
                        value={formData.business_website}
                        onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    Additional Information or Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your guests, typical villa occupancy, or any special requests..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    Account Password (for direct portal login)
                  </label>
                  <input
                    type="password"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                  <span className="text-[11px] text-neutral-400">
                    Used to sign into the portal once your application is approved.
                  </span>
                </div>
              </div>

              {/* Commission Terms Summary */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Program Standard Terms</span>
                </div>
                <ul className="text-[11px] text-neutral-500 space-y-1 leading-relaxed pl-5 list-disc">
                  <li>Standard 15% partner commission on eligible treatment revenue.</li>
                  <li>30-day cookie window on all referred guest bookings.</li>
                  <li>Disbursements processed via Indonesian Bank Transfer, Wise, or PayPal.</li>
                  <li>Applications are reviewed by Therapick management within 24 hours.</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-neutral-950 text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Partner Application</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-neutral-400">
            <span>Questions? Contact Therapick Partner Concierge on WhatsApp at +62 851 7411 9423</span>
          </div>
        </div>
      </div>
    </PartnerAuthProvider>
  );
}
