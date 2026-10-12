'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, ArrowLeft, CheckCircle2, AlertCircle, Save } from 'lucide-react';

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
        setStatusMsg({ type: 'success', text: 'Profile and payout details updated successfully!' });
        setPartner(data.partner);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#736B63]">Loading profile details...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link href="/partners/dashboard" className="text-xs text-[#736B63] hover:text-[#1A1A1A] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
          Partner Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B645C]">
          Manage your personal details, contact information, and payout methods
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Account Info Read-Only Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#736B63]">
          Account Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#8C847B] block">Partner Code</span>
            <span className="font-mono font-bold text-amber-900 text-sm">{partner?.partner_code}</span>
          </div>
          <div>
            <span className="text-[#8C847B] block">Status</span>
            <span className="font-semibold capitalize text-[#1A1A1A]">{partner?.status}</span>
          </div>
          <div>
            <span className="text-[#8C847B] block">Commission Rate</span>
            <span className="font-semibold text-emerald-700">{partner?.commission_rate_pct}%</span>
          </div>
          <div>
            <span className="text-[#8C847B] block">Account Email</span>
            <span className="font-medium text-[#1A1A1A] truncate block">{partner?.email}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#736B63] border-b border-[#F0EBE1] pb-2">
            Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Business or Villa Name</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A]"
              />
            </div>
          </div>
        </div>

        {/* Payout Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#736B63] border-b border-[#F0EBE1] pb-2">
            Payout Method
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Selected Method</label>
            <select
              name="payout_method"
              value={formData.payout_method}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C7] text-sm text-[#1A1A1A] bg-white"
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
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443D] mb-1">Account Holder Name</label>
                <input
                  type="text"
                  name="account_holder"
                  value={formData.account_holder}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
                />
              </div>
            </div>
          )}

          {formData.payout_method === 'wise' && (
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE4DA]">
              <label className="block text-xs font-medium text-[#4A443D] mb-1">Wise Email</label>
              <input
                type="email"
                name="wise_email"
                value={formData.wise_email}
                onChange={handleChange}
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
                className="w-full px-3 py-2 rounded-lg border border-[#D9D1C7] text-sm bg-white"
              />
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
