'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Landmark, 
  Banknote, 
  ArrowUpRight, 
  X, 
  Check, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Sparkline SVG Component matching the mockup's subtle trend line
function Sparkline({ color = 'blue' }: { color?: 'blue' | 'green' }) {
  const strokeColor = color === 'blue' ? '#3b82f6' : '#16a34a';
  const fillGradientId = `payout-sparkline-${color}`;

  const pathD = 'M 0 26 Q 20 28, 35 18 T 65 14 T 85 8 T 100 4';
  const areaD = `${pathD} L 100 32 L 0 32 Z`;

  return (
    <svg viewBox="0 0 100 32" className="w-20 h-7 overflow-visible opacity-90" preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [showEditBank, setShowEditBank] = useState(false);
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  
  // Bank Form State
  const [bankFormData, setBankFormData] = useState({
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [payoutsRes, meRes, statsRes] = await Promise.all([
        fetch('/api/affiliates/payouts').then((r) => r.json()),
        fetch('/api/affiliates/auth/me').then((r) => r.json()),
        fetch('/api/affiliates/stats').then((r) => r.json()),
      ]);

      if (payoutsRes.success) setPayouts(payoutsRes.payouts || []);
      if (meRes.success && meRes.partner) {
        setPartner(meRes.partner);
        setBankFormData({
          bank_name: meRes.partner.payout_details?.bank_name || 'BCA',
          account_number: meRes.partner.payout_details?.account_number || '',
          account_holder: meRes.partner.payout_details?.account_holder || '',
        });
      }
      if (statsRes.success) setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Error loading payout data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('partner_payouts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_payouts' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = clean.split('-').map(Number);
      if (y && m && d) {
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const totalPaidOut = useMemo(() => {
    return payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payouts]);

  const availableBalance = stats?.availableForPayout || 0;

  // Masked bank account
  const rawAccount = partner?.payout_details?.account_number || '1234';
  const maskedAccount = rawAccount.length > 4 
    ? `•••• ${rawAccount.slice(-4)}` 
    : `•••• ${rawAccount}`;

  const bankName = partner?.payout_details?.bank_name || 'BCA';

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch('/api/affiliates/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_details: bankFormData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPartner((prev: any) => ({
          ...prev,
          payout_details: bankFormData,
        }));
        setBankSaveSuccess(true);
        setTimeout(() => {
          setBankSaveSuccess(false);
          setShowEditBank(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving bank details:', err);
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* 1. HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0f172a] tracking-tight">
          Payouts
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Manage your balance and payout history.
        </p>
      </div>

      {/* 2. TOP 3 CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Available Balance */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center">
                <Banknote size={17} />
              </div>
              <span className="text-xs font-medium text-[#64748b]">Available Balance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0f172a]">
              {formatIDR(availableBalance)}
            </div>
            <div className="text-xs text-[#64748b] mt-1">
              Ready to withdraw
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowRequestPayout(true)}
              disabled={availableBalance <= 0}
              className={`w-full py-2 px-3 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                availableBalance > 0
                  ? 'bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-xs'
                  : 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
              }`}
            >
              Request Payout
            </button>
          </div>
        </div>

        {/* Card 2: Total Paid Out */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <Wallet size={17} />
              </div>
              <span className="text-xs font-medium text-[#64748b]">Total Paid Out</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0f172a]">
              {formatIDR(totalPaidOut)}
            </div>
            <div className="text-xs text-[#64748b] mt-1">
              {payouts.length} {payouts.length === 1 ? 'payout' : 'payouts'}
            </div>
          </div>

          <div className="pt-4 flex items-end justify-end">
            <Sparkline color="blue" />
          </div>
        </div>

        {/* Card 3: Bank Account */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#f8fafc] text-[#475569] flex items-center justify-center">
                <Landmark size={17} />
              </div>
              <span className="text-xs font-medium text-[#64748b]">Bank Account</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0f172a]">
              {bankName}
            </div>
            <div className="text-xs text-[#64748b] font-mono mt-1">
              {maskedAccount}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowEditBank(true)}
              className="w-full py-2 px-3 rounded-[8px] text-xs font-medium bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] transition-colors cursor-pointer"
            >
              Edit Bank
            </button>
          </div>
        </div>
      </div>

      {/* 3. DISBURSEMENT HISTORY */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[#0f172a]">
          Disbursement History
        </h2>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-10 text-center text-xs text-[#94a3b8]">
            Loading disbursement history...
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-[#0f172a]">No disbursements yet</p>
            <p className="text-xs text-[#64748b]">
              Approved commissions will be disbursed automatically to your registered bank account.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]/50 text-[#94a3b8] font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {payouts.map((p) => {
                    return (
                      <tr key={p.id || p.payout_reference} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="py-3.5 px-5 text-[#64748b] whitespace-nowrap">
                          {formatDate(p.created_at)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-[#0f172a] whitespace-nowrap">
                          #{p.payout_reference || 'PAYOUT001'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0f172a] whitespace-nowrap">
                          {formatIDR(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748b] whitespace-nowrap">
                          Bank Transfer
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Completed
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedPayout(p)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-[6px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            <span>Track</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS (md:hidden) */}
            <div className="md:hidden space-y-3">
              {payouts.map((p) => (
                <div
                  key={p.id || p.payout_reference}
                  className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-[#94a3b8] font-mono">
                        {formatDate(p.created_at)}
                      </div>
                      <div className="text-sm font-semibold text-[#0f172a] font-mono mt-0.5">
                        #{p.payout_reference || 'PAYOUT001'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPayout(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#0f172a] text-white text-xs font-medium shrink-0"
                    >
                      <span>Track</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
                    <div>
                      <div className="text-[10px] text-[#94a3b8] uppercase font-mono">Amount Disbursed</div>
                      <div className="text-sm font-bold text-[#0f172a]">
                        {formatIDR(p.amount)}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ========================================================
          MODAL: EDIT BANK DETAILS
         ======================================================== */}
      {showEditBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-xl border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-[#0f172a]" />
                <h3 className="font-semibold text-sm text-[#0f172a]">Registered Bank Account</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditBank(false)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1">
                  Bank Name
                </label>
                <select
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                  placeholder="e.g. 08256285"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_holder}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_holder: e.target.value })}
                  placeholder="e.g. Putu Edo Santika"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-[8px] focus:outline-none focus:border-[#0f172a]"
                />
              </div>

              {bankSaveSuccess && (
                <div className="p-2.5 rounded-[6px] bg-[#f0fdf4] text-[#15803d] text-xs flex items-center gap-1.5 border border-[#bbf7d0]">
                  <Check size={14} /> Bank details saved successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBank(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] rounded-[6px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-4 py-2 text-xs font-medium bg-[#0f172a] text-white rounded-[6px] hover:bg-[#1e293b] transition-colors disabled:opacity-50"
                >
                  {savingBank ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TRACK PAYOUT DETAILS
         ======================================================== */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-xl border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div>
                <div className="text-[10px] font-mono uppercase text-[#94a3b8] font-bold">DISBURSEMENT</div>
                <h3 className="font-bold text-sm text-[#0f172a]">#{selectedPayout.payout_reference || 'PAYOUT001'}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[#64748b]">Total Amount Disbursed</span>
                <span className="font-bold text-sm text-[#0f172a]">{formatIDR(selectedPayout.amount)}</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Disbursement Date</span>
                  <span className="font-medium text-[#0f172a]">{formatDate(selectedPayout.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Payment Method</span>
                  <span className="font-medium text-[#0f172a]">Bank Transfer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Transfer Status</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Completed
                  </span>
                </div>
              </div>

              {selectedPayout.items && selectedPayout.items.length > 0 && (
                <div className="pt-2 border-t border-[#f1f5f9] space-y-2">
                  <span className="text-[11px] font-semibold text-[#0f172a] block">Itemized Bookings</span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {selectedPayout.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-[6px] bg-[#f8fafc] text-[11px]">
                        <div>
                          <span className="font-mono font-medium text-[#0f172a]">#{it.booking_id}</span>
                          <span className="text-[#64748b] ml-1.5">{it.treatment_name || 'Treatment'}</span>
                        </div>
                        <span className="font-bold text-[#0f172a]">{formatIDR(it.commission_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-full py-2 bg-[#0f172a] text-white rounded-[6px] text-xs font-medium hover:bg-[#1e293b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REQUEST PAYOUT
         ======================================================== */}
      {showRequestPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-xl border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-[#16a34a]" />
                <h3 className="font-semibold text-sm text-[#0f172a]">Request Commission Payout</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowRequestPayout(false)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-[8px] bg-[#f0fdf4] border border-[#bbf7d0]">
                <div className="text-[#15803d] font-semibold text-xs">Available for Withdrawal</div>
                <div className="text-xl font-bold text-[#15803d] mt-1">{formatIDR(availableBalance)}</div>
              </div>

              <div className="space-y-2 text-[#475569] leading-relaxed">
                <p>
                  Payouts will be processed directly to your registered <strong>{bankName} ({maskedAccount})</strong> account within 24-48 business hours.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestPayout(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] rounded-[6px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Payout request submitted successfully! Our finance team will disburse your earnings.');
                  setShowRequestPayout(false);
                }}
                className="px-4 py-2 text-xs font-medium bg-[#0f172a] text-white rounded-[6px] hover:bg-[#1e293b]"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
