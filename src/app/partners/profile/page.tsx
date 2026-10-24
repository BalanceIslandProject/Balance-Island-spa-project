'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Lock,
  Wallet,
  Landmark,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function PartnerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [partner, setPartner] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    phone: '',
    whatsapp: '',
    payout_method: 'bank_transfer',
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
    wise_email: '',
    paypal_email: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/affiliates/auth/me');
        const data = await res.json();
        if (data.success && data.partner) {
          const p = data.partner;
          setPartner(p);
          setFormData({
            first_name: p.first_name || '',
            last_name: p.last_name || '',
            business_name: p.business_name || '',
            phone: p.phone || '',
            whatsapp: p.whatsapp || '',
            payout_method: p.payout_method || 'bank_transfer',
            bank_name: p.payout_details?.bank_name || 'BCA',
            account_number: p.payout_details?.account_number || '',
            account_holder: p.payout_details?.account_holder || '',
            wise_email: p.payout_details?.wise_email || '',
            paypal_email: p.payout_details?.paypal_email || '',
          });
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyCode = () => {
    if (!partner?.partner_code) return;
    navigator.clipboard.writeText(partner.partner_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!partner?.partner_code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.booktherapick.com';
    const mainOrigin = origin.includes('partners.') 
      ? origin.replace('partners.', 'www.') 
      : 'https://www.booktherapick.com';
    const link = `${mainOrigin}/?ref=${partner.partner_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/affiliates/auth/logout', { method: 'POST' });
      router.push('/partners/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

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
          wise_email: formData.wise_email,
        };
      } else if (formData.payout_method === 'paypal') {
        payout_details = {
          paypal_email: formData.paypal_email,
        };
      }

      const res = await fetch('/api/affiliates/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          business_name: formData.business_name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          payout_method: formData.payout_method,
          payout_details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to save changes.' });
      } else {
        setStatusMsg({ type: 'success', text: 'Profile updated successfully.' });
        setPartner(data.partner);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-neutral-500 font-medium">Loading partner profile...</div>
      </div>
    );
  }

  const initials = `${formData.first_name?.[0] || partner?.first_name?.[0] || 'P'}${formData.last_name?.[0] || partner?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12">
      
      {/* Top App Header / Back Bar */}
      <div className="flex items-center justify-between pt-1">
        <Link 
          href="/partners/dashboard" 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-2xs text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={13} />
          <span>Dashboard</span>
        </Link>

        {/* Mobile Header Logout Quick Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50/80 border border-red-200/60 text-xs font-bold text-red-600 active:scale-95 transition-all"
        >
          <LogOut size={12} />
          <span>{loggingOut ? 'Signing out...' : 'Log Out'}</span>
        </button>
      </div>

      {/* Hero Profile Identity Card (Native App Style) */}
      <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-emerald-100/40 via-teal-100/20 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar with Initials */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-sm ring-4 ring-neutral-100/80">
                {initials || 'P'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white shadow-xs" title="Verified Partner">
                <Check size={12} strokeWidth={3} />
              </div>
            </div>

            {/* Partner Details */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight truncate">
                  {formData.first_name || 'Partner'} {formData.last_name || ''}
                </h1>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {partner?.status || 'Active'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate font-medium">
                <Building2 size={13} className="text-neutral-400 shrink-0" />
                <span className="truncate">{formData.business_name || 'Hospitality Partner'}</span>
              </div>

              <div className="text-[11px] text-neutral-400 font-mono truncate">
                {partner?.email}
              </div>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-neutral-100 pt-3 sm:pt-0">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/80 text-[11px] font-mono font-bold text-neutral-900 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title="Click to copy partner code"
            >
              <span>#{partner?.partner_code}</span>
              {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-neutral-500" />}
            </button>

            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200/60 uppercase tracking-wider">
              <Sparkles size={11} className="text-amber-500" />
              {partner?.commission_rate_pct || 10}% Commission
            </span>
          </div>
        </div>

        {/* One-Tap Referral Link Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
            <span>Referral Link</span>
            <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-bold uppercase">30-Day Cookie</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200/80 text-xs font-mono text-neutral-800 transition-all active:scale-98 cursor-pointer"
          >
            <span className="truncate">?ref={partner?.partner_code}</span>
            {copiedLink ? (
              <span className="text-[10px] font-sans font-bold text-emerald-600 flex items-center gap-1">
                <Check size={12} /> Copied!
              </span>
            ) : (
              <span className="text-[10px] font-sans font-semibold text-neutral-400 flex items-center gap-1">
                <Copy size={12} /> Copy Full Link
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 shadow-2xs animate-in fade-in-50 duration-200 ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border-red-200 bg-red-50 text-red-950'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Main Form: App Grouped Card Structure */}
      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        
        {/* Section 1: Personal & Business Contact Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                <User size={15} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-neutral-950 uppercase tracking-wider">
                  Contact Information
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Your identity and primary hospitality business details
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-neutral-400" />
              Villa, Hotel, or Business Name
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Villa Mandala Ubud or Luxury Tours Bali"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-neutral-400" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+62 812 3456 7890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageCircle size={13} className="text-emerald-500" />
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+62 812 3456 7890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-neutral-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Payout Destination Card (App Segmented Selector) */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                <Wallet size={15} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-neutral-950 uppercase tracking-wider">
                  Payout & Disbursement Destination
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Where you receive your weekly or monthly partner commissions
                </p>
              </div>
            </div>
          </div>

          {/* App-Style Segmented Control Pills */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-2">
              Select Payout Method
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100/90 rounded-2xl border border-neutral-200/70">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, payout_method: 'bank_transfer' }))}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  formData.payout_method === 'bank_transfer'
                    ? 'bg-white text-neutral-950 shadow-xs ring-1 ring-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Landmark size={14} className={formData.payout_method === 'bank_transfer' ? 'text-neutral-950' : 'text-neutral-400'} />
                <span className="truncate">Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, payout_method: 'wise' }))}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  formData.payout_method === 'wise'
                    ? 'bg-white text-neutral-950 shadow-xs ring-1 ring-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <CreditCard size={14} className={formData.payout_method === 'wise' ? 'text-neutral-950' : 'text-neutral-400'} />
                <span className="truncate">Wise (Intl)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, payout_method: 'paypal' }))}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  formData.payout_method === 'paypal'
                    ? 'bg-white text-neutral-950 shadow-xs ring-1 ring-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Wallet size={14} className={formData.payout_method === 'paypal' ? 'text-neutral-950' : 'text-neutral-400'} />
                <span className="truncate">PayPal</span>
              </button>
            </div>
          </div>

          {/* Conditional Inputs based on Method */}
          {formData.payout_method === 'bank_transfer' && (
            <div className="space-y-3 p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="BCA, Mandiri, BNI, BRI, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="e.g. 1234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-mono font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Account Holder Full Name
                </label>
                <input
                  type="text"
                  name="account_holder"
                  value={formData.account_holder}
                  onChange={handleChange}
                  placeholder="Exact name registered in your bank account"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                />
              </div>
            </div>
          )}

          {formData.payout_method === 'wise' && (
            <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 animate-in fade-in-50 duration-200 space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Wise Registered Email Address
              </label>
              <input
                type="email"
                name="wise_email"
                value={formData.wise_email}
                onChange={handleChange}
                placeholder="your-wise-email@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
              />
              <p className="text-[10px] text-neutral-500">
                Disbursements will be routed via Wise direct transfer in your local currency.
              </p>
            </div>
          )}

          {formData.payout_method === 'paypal' && (
            <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 animate-in fade-in-50 duration-200 space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                PayPal Registered Email
              </label>
              <input
                type="email"
                name="paypal_email"
                value={formData.paypal_email}
                onChange={handleChange}
                placeholder="your-paypal-email@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
              />
              <p className="text-[10px] text-neutral-500">
                Commissions will be transferred directly to your PayPal balance.
              </p>
            </div>
          )}
        </div>

        {/* Save Changes Primary Action */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile Changes...</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </div>
      </form>

      {/* Section 3: App Actions & Security (Prominent Mobile Logout Section) */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <ShieldCheck size={16} className="text-neutral-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Account Security & Actions
          </h2>
        </div>

        <div className="space-y-3">
          {/* Dedicated WhatsApp Partner Concierge */}
          <a
            href="https://wa.me/6285174119423"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 text-xs font-semibold text-neutral-800 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageCircle size={15} />
              </div>
              <div className="text-left">
                <span className="font-bold text-neutral-950 block">WhatsApp Partner Support</span>
                <span className="text-[11px] text-neutral-500">Need help updating bank info or tracking?</span>
              </div>
            </div>
            <ExternalLink size={14} className="text-neutral-400 shrink-0" />
          </a>

          {/* Prominent Red Sign Out Button (Specially on Mobile) */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100/90 active:scale-[0.98] text-red-600 font-bold text-xs tracking-wider uppercase border border-red-200/80 transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            {loggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Signing out of portal...</span>
              </>
            ) : (
              <>
                <LogOut size={15} strokeWidth={2.2} />
                <span>Sign Out of Partner Account</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
            <Lock size={10} className="text-neutral-400" />
            <span>End-to-end encrypted session • partners.booktherapick.com</span>
          </p>
        </div>
      </div>

    </div>
  );
}
