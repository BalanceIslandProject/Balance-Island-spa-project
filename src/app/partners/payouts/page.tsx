'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Landmark, 
  X, 
  Check, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RotateCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [showEditBank, setShowEditBank] = useState(false);
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState(false);
  
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

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => {
    loadData();

    const onGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('partner:refresh', onGlobalRefresh);

    const channel = supabase
      .channel('partner_payouts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_payouts' }, () => loadData())
      .subscribe();

    return () => {
      window.removeEventListener('partner:refresh', onGlobalRefresh);
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
  const minPayout = 500000;

  // Masked bank account
  const rawAccount = partner?.payout_details?.account_number || '••••';
  const maskedAccount = rawAccount.length > 4 
    ? `•••• ${rawAccount.slice(-4)}` 
    : rawAccount;

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

  const handleConfirmPayoutRequest = async () => {
    setPayoutSuccessMsg(true);
    setTimeout(() => {
      setPayoutSuccessMsg(false);
      setShowRequestPayout(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 w-full font-sans max-w-[1400px] mx-auto pb-8">
      
      {/* ========================================================
          1. APP CONTROLS BAR (CLEAN APP-STYLE ACTION BAR)
         ======================================================== */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
            Settlement Hub
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[12px] sm:text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh payouts data"
            aria-label="Refresh payouts data"
          >
            <RotateCw size={13} className={`text-[#64748B] ${refreshing ? 'animate-spin text-[#0E2319]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. FINANCIAL SUMMARY CARDS (4 METRICS)
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* AVAILABLE BALANCE */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Available Balance
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(availableBalance)}
          </div>
          <div className="text-[12px] text-[#059669] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Ready to withdraw
          </div>
        </div>

        {/* TOTAL WITHDRAWN */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Total Withdrawn
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(totalPaidOut)}
          </div>
          <div className="text-[12px] text-[#64748B]">
            Lifetime transfers
          </div>
        </div>

        {/* PENDING REQUEST */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Pending Request
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            Rp0
          </div>
          <div className="text-[12px] text-[#94A3B8]">
            No pending transfers
          </div>
        </div>

        {/* MIN. PAYOUT */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Min. Payout
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(minPayout)}
          </div>
          <div className="text-[12px] text-[#94A3B8]">
            Bank transfer threshold
          </div>
        </div>

      </div>

      {/* ========================================================
          3. PRIMARY ACTION: REQUEST PAYOUT BUTTON
         ======================================================== */}
      <div>
        <button
          type="button"
          onClick={() => setShowRequestPayout(true)}
          disabled={availableBalance < minPayout}
          className={`w-full py-3.5 px-4 rounded-[8px] text-sm font-semibold transition-all shadow-xs cursor-pointer ${
            availableBalance >= minPayout
              ? 'bg-[#0E2319] hover:bg-[#163625] text-white'
              : 'bg-[#0E2319]/80 hover:bg-[#0E2319] text-white'
          }`}
        >
          Request Payout
        </button>
      </div>

      {/* ========================================================
          4. PAYOUT HISTORY TABLE
         ======================================================== */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">
            Payout History
          </h2>
          <button
            type="button"
            onClick={() => setShowEditBank(true)}
            className="text-xs font-semibold text-[#0E2319] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Bank: {bankName} ({maskedAccount})</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Request Date</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#94A3B8]">
                    Loading payout history...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#94A3B8]">
                    No payouts disbursed yet. Your balance will be displayed when bookings complete.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const ref = p.payout_reference || `WD-${p.id?.slice(0, 4) || '0045'}`;
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedPayout(p)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-4 font-mono font-semibold text-[#0F172A]">
                        {ref}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A] tabular-nums">
                        {formatIDR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#ECFDF5] text-[#059669]">
                          Paid
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL: REQUEST PAYOUT
         ======================================================== */}
      {showRequestPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-[#0E2319]" />
                <h3 className="font-semibold text-sm text-[#0F172A]">Request Commission Payout</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowRequestPayout(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-[8px] bg-[#ECFDF5] border border-[#A7F3D0]">
                <div className="text-[#059669] font-medium text-xs">Available for Withdrawal</div>
                <div className="text-2xl font-bold text-[#059669] mt-1 tabular-nums">{formatIDR(availableBalance)}</div>
              </div>

              <div className="space-y-2 text-[#475569] leading-relaxed">
                <p>
                  Funds will be transferred directly to your verified bank account:
                </p>
                <div className="p-3 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 font-mono text-[11px]">
                  <div>Bank: <strong className="text-[#0F172A]">{bankName}</strong></div>
                  <div>Account: <strong className="text-[#0F172A]">{partner?.payout_details?.account_number || 'Not Set'}</strong></div>
                  <div>Name: <strong className="text-[#0F172A]">{partner?.payout_details?.account_holder || partner?.first_name || 'Partner'}</strong></div>
                </div>
              </div>

              {payoutSuccessMsg && (
                <div className="p-3 rounded-[6px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#059669] shrink-0" />
                  <span>Payout request submitted! Transfer will disburse shortly.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestPayout(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-[6px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayoutRequest}
                className="px-4 py-2 text-xs font-semibold bg-[#0E2319] text-white rounded-[6px] hover:bg-[#163625] cursor-pointer shadow-xs"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT BANK DETAILS
         ======================================================== */}
      {showEditBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-[#0E2319]" />
                <h3 className="font-semibold text-sm text-[#0F172A]">Destination Bank Account</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditBank(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#475569] block mb-1">
                  Bank Name
                </label>
                <select
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                  placeholder="e.g. 08256285"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319] font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-[#475569] block mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_holder}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_holder: e.target.value })}
                  placeholder="e.g. Putu Edo Santika"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-[6px] focus:outline-none focus:border-[#0E2319]"
                />
              </div>

              {bankSaveSuccess && (
                <div className="p-2.5 rounded-[6px] bg-[#ECFDF5] text-[#059669] text-xs flex items-center gap-1.5 border border-[#A7F3D0]">
                  <Check size={14} /> Bank details saved successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBank(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-[6px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-4 py-2 text-xs font-semibold bg-[#0E2319] text-white rounded-[6px] hover:bg-[#163625] cursor-pointer shadow-xs disabled:opacity-50"
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
          <div className="w-full max-w-md bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <div className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">DISBURSEMENT</div>
                <h3 className="font-bold text-sm text-[#0F172A]">#{selectedPayout.payout_reference || 'PAYOUT001'}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Total Amount Disbursed</span>
                <span className="font-bold text-base text-[#0F172A] tabular-nums">{formatIDR(selectedPayout.amount)}</span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Disbursement Date</span>
                  <span className="font-medium text-[#0F172A]">{formatDate(selectedPayout.paid_at || selectedPayout.created_at)}</span>
                </div>
                {selectedPayout.notes && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Settlement Note</span>
                    <span className="font-medium text-[#0F172A] text-right max-w-[220px] truncate">{selectedPayout.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Payment Method</span>
                  <span className="font-medium text-[#0F172A]">Bank Transfer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#ECFDF5] text-[#059669]">
                    Completed
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-full py-2 bg-[#0E2319] text-white rounded-[6px] text-xs font-semibold hover:bg-[#163625] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
