'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, Building2, User, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickCreatePayoutModal() {
  const {
    isCreatePayoutOpen,
    setIsCreatePayoutOpen,
    createPayout,
    partners,
    selectedPartner,
    setSelectedPartner
  } = useTherapickAdmin();

  const [partnerId, setPartnerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync default selected partner if passed
  useEffect(() => {
    if (selectedPartner) {
      setPartnerId(selectedPartner.id);
      setAmount(selectedPartner.available_balance || 0);
    } else if (partners.length > 0 && !partnerId) {
      setPartnerId(partners[0].id);
      setAmount(partners[0].available_balance || 0);
    }
  }, [selectedPartner, partners]);

  const activePartner = partners.find(p => p.id === partnerId) || partners[0];

  useEffect(() => {
    if (activePartner && !selectedPartner) {
      setAmount(activePartner.available_balance || 0);
    }
  }, [activePartner]);

  if (!isCreatePayoutOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner) return;
    if (amount <= 0) {
      alert('Payout amount must be greater than Rp 0.');
      return;
    }

    setIsSubmitting(true);
    const res = await createPayout(
      activePartner.id,
      amount,
      reference.trim() || `BCA-${Date.now().toString().slice(-6)}`,
      notes.trim() || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Payout of Rp ${amount.toLocaleString('id-ID')} processed successfully!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsCreatePayoutOpen(false);
      }, 1200);
    } else {
      alert(res.error || 'Failed to record payout.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Wallet size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Record Partner Payout</h3>
              <p className="text-xs text-stone-500">
                Disburse partner commission earnings and update balance ledger.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsCreatePayoutOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Partner Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase font-mono tracking-wider">
              Select Partner
            </label>
            <select
              value={partnerId}
              onChange={e => {
                setPartnerId(e.target.value);
                const found = partners.find(p => p.id === e.target.value);
                if (found) setAmount(found.available_balance || 0);
              }}
              className="w-full text-xs font-semibold bg-white border border-stone-200 rounded-xl p-3 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.business_name ? `(${p.business_name})` : ''} — Available: Rp {(p.available_balance || 0).toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Account Verification Card */}
          {activePartner && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-stone-500" />
                  Bank Account Details
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={11} />
                  Verified Destination
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-mono">Bank Name</span>
                  <span className="font-bold text-neutral-900">{activePartner.bank_name || 'BCA (Bank Central Asia)'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-mono">Account Holder</span>
                  <span className="font-bold text-neutral-900">{activePartner.bank_holder || activePartner.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-stone-400 block text-[10px] uppercase font-mono">Account Number</span>
                  <span className="font-mono font-bold text-neutral-900">{activePartner.bank_number || '7720-1928-4491'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Available vs Payout Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">
                Available Balance
              </label>
              <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-neutral-900 font-bold text-sm">
                Rp {(activePartner?.available_balance || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1">
                Disbursement Amount (IDR) *
              </label>
              <input
                type="number"
                step="1000"
                max={activePartner?.available_balance || 0}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full text-sm font-bold bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Bank Transfer Reference / Transaction ID
              </label>
              <input
                type="text"
                placeholder="e.g. BCA-TRX-948102"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Internal Payout Note
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Bi-weekly settlement Oct 16 - Oct 31."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs bg-white border border-stone-200 rounded-xl p-3 text-neutral-900 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-600" />
            <span>
              Bank transfers must be executed manually or through your verified corporate banking portal. Submitting records this payment in the partner’s ledger and reduces their available balance.
            </span>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreatePayoutOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Confirm Payout</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
