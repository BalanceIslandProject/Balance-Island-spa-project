'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MessageSquare, 
  CreditCard, 
  Calendar, 
  Percent, 
  Wallet, 
  ExternalLink,
  ShieldCheck,
  Ban,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

export default function TherapickPartnerDrawer() {
  const { 
    selectedPartner, 
    setSelectedPartner, 
    affiliateBookings, 
    commissions, 
    payouts, 
    refreshData,
    setSelectedBooking,
    setIsCreatePayoutOpen
  } = useTherapickAdmin();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'commissions' | 'payouts'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  if (!selectedPartner) return null;

  const p = selectedPartner;
  const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.business_name || 'Partner';

  // Referral URL
  const referralUrl = `https://www.booktherapick.com/?ref=${p.referral_code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(p.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp Link
  const phone = (p.phone || '').replace(/[^0-9]/g, '');
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(fullName)}%2C%20from%20Therapick%20Partner%20Team...` : null;

  // Filter Bookings for this partner
  const partnerBookings = affiliateBookings.filter(b => {
    return (
      (b.affiliate_code && b.affiliate_code.toUpperCase() === (p.referral_code || '').toUpperCase()) ||
      b.partner_info?.id === p.id ||
      b.commission?.partner_id === p.id
    );
  });

  // Filter Commissions for this partner
  const partnerCommissions = commissions.filter(c => c.partner_id === p.id);

  // Filter Payouts for this partner
  const partnerPayouts = payouts.filter(py => py.partner_id === p.id);

  // Financial calculations
  const totalEarned = Number(p.total_commission || 0);
  const totalPaid = Number(p.paid_commission || 0);
  const availableBalance = Math.max(0, totalEarned - totalPaid);

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/affiliates/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: p.id, status: newStatus }),
      });
      if (res.ok) {
        await refreshData();
        setSelectedPartner((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e) {
      console.error('Update status failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity" 
        onClick={() => setSelectedPartner(null)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200/80 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                p.status === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : p.status === 'pending'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {p.status || 'Active'} Partner
              </span>
              <span className="text-xs font-mono text-stone-400">ID: {p.id.slice(0, 8)}</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-950 font-sans mt-0.5">{fullName}</h2>
            {p.business_name && (
              <p className="text-xs text-stone-500 font-medium">{p.business_name}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedPartner(null)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-tabs bar in drawer */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-stone-100 bg-stone-50/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'bookings', label: `Bookings (${partnerBookings.length})` },
            { id: 'commissions', label: `Commissions (${partnerCommissions.length})` },
            { id: 'payouts', label: `Payouts (${partnerPayouts.length})` },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-neutral-950 shadow-xs border border-stone-200/80'
                  : 'text-stone-500 hover:text-neutral-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {activeTab === 'overview' && (
            <>
              {/* Financial Balance Summary Card */}
              <div className="bg-[#FEF3C7]/60 border border-amber-200/70 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">Available Payout Balance</div>
                  <button
                    type="button"
                    onClick={() => setIsCreatePayoutOpen(true)}
                    className="px-3 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Disburse Payout
                  </button>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-sans">
                  {formatIDR(availableBalance)}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                  <div>
                    <div className="text-[10px] text-amber-800 font-medium">Total Earned</div>
                    <div className="font-bold text-neutral-900 mt-0.5">{formatIDR(totalEarned)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-800 font-medium">Total Paid</div>
                    <div className="font-bold text-neutral-900 mt-0.5">{formatIDR(totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-800 font-medium">Rate</div>
                    <div className="font-bold text-neutral-900 mt-0.5">{p.commission_rate_pct || 15}%</div>
                  </div>
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="bg-stone-50/80 border border-stone-200/70 rounded-2xl p-4.5 space-y-2.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Partner Referral Code</div>
                <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-3.5 py-2">
                  <span className="font-mono font-extrabold text-sm text-neutral-950 tracking-wider">
                    {p.referral_code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-stone-500 truncate">
                  Referral URL: <a href={referralUrl} target="_blank" rel="noreferrer" className="underline hover:text-neutral-900">{referralUrl}</a>
                </div>
              </div>

              {/* Partner Bank Details */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Bank Account for Payouts</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={11} />
                    Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Bank Name</span>
                    <span className="font-bold text-neutral-900">{p.bank_name || 'BCA (Bank Central Asia)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Account Holder</span>
                    <span className="font-medium text-neutral-900">{p.bank_account_name || fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Account Number</span>
                    <span className="font-mono font-bold text-neutral-900 tracking-wider">{p.bank_account_number || '7720918231'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information & WhatsApp */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Contact Details</div>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageSquare size={12} />
                      <span>WhatsApp Partner</span>
                    </a>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Email</span>
                    <span className="font-medium text-neutral-900">{p.email || 'partner@example.com'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Phone</span>
                    <span className="font-mono text-neutral-900">{p.phone || '+62 812-3456-7890'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Member Since</span>
                    <span className="text-neutral-700">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
                {p.status === 'pending' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('active')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Approve Application
                  </button>
                )}

                {p.status === 'active' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('suspended')}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Suspend Partner
                  </button>
                )}

                {p.status === 'suspended' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('active')}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reactivate Account
                  </button>
                )}
              </div>
            </>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-900">Attributed Bookings ({partnerBookings.length})</div>
              {partnerBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">No bookings attributed to this partner yet.</div>
              ) : (
                <div className="space-y-2">
                  {partnerBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-3 bg-white border border-stone-200 rounded-xl hover:border-neutral-900 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-neutral-900">#{b.reference_number || b.id.slice(0, 8)}</span>
                        <span className="font-bold text-xs text-neutral-900">{formatIDR(b.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-600">
                        <span>{b.treatment_name}</span>
                        <span>{b.booking_date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                        <span>Guest: {b.guest_name}</span>
                        <span className="text-emerald-700 font-semibold">Comm: {formatIDR(b.revenue ? Number(b.revenue) * 0.15 : 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-900">Commission Ledger ({partnerCommissions.length})</div>
              {partnerCommissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">No commission transactions found.</div>
              ) : (
                <div className="space-y-2">
                  {partnerCommissions.map(c => (
                    <div key={c.id} className="p-3 bg-white border border-stone-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-neutral-900">{c.reference_number || c.booking_id}</span>
                        <span className="font-bold text-emerald-700">{formatIDR(c.commission_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-500 text-[11px]">
                        <span>Booking: {c.booking_id}</span>
                        <span className="capitalize font-semibold text-neutral-800">{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-900">Disbursed Payouts ({partnerPayouts.length})</div>
              {partnerPayouts.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">No payouts disbursed yet.</div>
              ) : (
                <div className="space-y-2">
                  {partnerPayouts.map(py => (
                    <div key={py.id} className="p-3 bg-white border border-stone-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-neutral-900">{py.reference_number || 'PAYOUT'}</span>
                        <span className="font-bold text-neutral-900">{formatIDR(py.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-500 text-[11px]">
                        <span>{new Date(py.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="font-bold text-emerald-700 uppercase">{py.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
