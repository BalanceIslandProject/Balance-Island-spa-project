'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, ShieldCheck, CreditCard, Building2, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PartnerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-neutral-500 font-medium">Loading partner profile...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-1">
        <Link 
          href="/partners/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-0.5"
        >
          <ArrowLeft size={13} />
          <span>Dashboard</span>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">
          Partner Profile
        </h1>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-2xs ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-red-600 shrink-0" />
          )}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Account Info Badge Card */}
      <div className="border border-neutral-200/80 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Account Overview
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
            {partner?.status || 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60">
            <span className="text-neutral-500 text-[10px] uppercase font-medium block">Code</span>
            <span className="font-mono font-bold text-neutral-900 text-sm">#{partner?.partner_code}</span>
          </div>
          <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60">
            <span className="text-neutral-500 text-[10px] uppercase font-medium block">Rate</span>
            <span className="font-bold text-neutral-900 text-sm">{partner?.commission_rate_pct}%</span>
          </div>
          <div className="col-span-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60">
            <span className="text-neutral-500 text-[10px] uppercase font-medium block">Email</span>
            <span className="font-medium text-neutral-900 truncate block text-xs">{partner?.email}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="border border-neutral-200/80 rounded-2xl p-4 sm:p-6 bg-white shadow-2xs space-y-6">
        
        {/* Section 1: Contact Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
            <User size={15} className="text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Personal & Business Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
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
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+62 812..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+62 812..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Payout Method */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
            <CreditCard size={15} className="text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Payout & Disbursement Details
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

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide transition-all active:scale-98 disabled:opacity-50 shadow-xs"
          >
            {saving ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
