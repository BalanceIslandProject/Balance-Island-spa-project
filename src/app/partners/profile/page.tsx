'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
    return <div className="p-8 text-center text-xs text-black/50">Loading profile...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-2">
      <div className="space-y-1">
        <Link href="/partners/dashboard" className="text-xs text-black/50 hover:text-black">
          &larr; Back to Dashboard
        </Link>
        <h1 className="font-serif text-2xl font-bold text-black">
          Partner Profile
        </h1>
        <p className="text-xs text-black/60">
          Manage contact info and payout method
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg border text-xs ${
            statusMsg.type === 'success'
              ? 'border-black/20 bg-black/[0.02] text-black'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Account Info Card */}
      <div className="border border-black/10 rounded-2xl p-5 bg-white space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/50">
          Account Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-black/50 block">Code</span>
            <span className="font-mono font-bold text-black">{partner?.partner_code}</span>
          </div>
          <div>
            <span className="text-black/50 block">Status</span>
            <span className="font-semibold capitalize text-black">{partner?.status}</span>
          </div>
          <div>
            <span className="text-black/50 block">Rate</span>
            <span className="font-bold text-black">{partner?.commission_rate_pct}%</span>
          </div>
          <div>
            <span className="text-black/50 block">Email</span>
            <span className="font-medium text-black truncate block">{partner?.email}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="border border-black/10 rounded-2xl p-6 bg-white space-y-5">
        
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1.5">
            Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
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
                className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">Business / Villa Name</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-black/20 text-xs text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Payout Details */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1.5">
            Payout Method
          </h2>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">Method</label>
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
                    className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-black mb-1">Account Holder Name</label>
                <input
                  type="text"
                  name="account_holder"
                  value={formData.account_holder}
                  onChange={handleChange}
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
                className="w-full px-2.5 py-1.5 rounded border border-black/20 text-xs bg-white"
              />
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-black hover:bg-black/80 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
