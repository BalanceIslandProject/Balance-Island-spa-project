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
    <div className="fitlo-modal-backdrop fixed inset-0 z-50 flex justify-end p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={() => setSelectedPartner(null)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xl bg-[var(--fitlo-bg)] h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-[var(--fitlo-line)]">
        
        {/* Header */}
        <div className="sticky top-0 bg-[var(--fitlo-card)] px-6 py-4 border-b border-[var(--fitlo-line)] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`fitlo-pill ${
                p.status === 'active'
                  ? 'fitlo-pill--good'
                  : p.status === 'pending'
                  ? 'fitlo-pill--warn'
                  : 'fitlo-pill--bad'
              }`}>
                {p.status || 'Active'} Partner
              </span>
              <span className="text-xs fitlo-num text-[var(--fitlo-muted)]">ID: {String(p.id || '').slice(0, 8)}</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--fitlo-ink)] font-sans mt-0.5">{fullName}</h2>
            {p.business_name && (
              <p className="text-xs text-[var(--fitlo-muted)] font-medium">{p.business_name}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedPartner(null)}
            className="p-1.5 rounded-xl text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-tabs bar in drawer */}
        <div className="flex items-center px-6 py-3 border-b border-[var(--fitlo-line)] bg-[var(--fitlo-card-2)] overflow-x-auto no-scrollbar">
          <div className="fitlo-sides">
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
                className={`fitlo-sides__btn ${activeTab === t.id ? 'is-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {activeTab === 'overview' && (
            <>
              {/* Financial Balance Summary Card */}
              <div className="fitlo-kpi fitlo-kpi--lemon p-5 space-y-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="fitlo-kpi__lbl">Available Payout Balance</div>
                  <button
                    type="button"
                    onClick={() => setIsCreatePayoutOpen(true)}
                    className="fitlo-btn fitlo-btn--primary text-xs py-1.5 px-3"
                  >
                    Disburse Payout
                  </button>
                </div>
                <div className="text-2xl sm:text-3xl font-bold fitlo-num text-[var(--fitlo-ink)]">
                  {formatIDR(availableBalance)}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(22,26,25,0.08)] text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--fitlo-muted)] font-medium">Total Earned</div>
                    <div className="font-bold fitlo-num text-[var(--fitlo-ink)] mt-0.5">{formatIDR(totalEarned)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--fitlo-muted)] font-medium">Total Paid</div>
                    <div className="font-bold fitlo-num text-[var(--fitlo-ink)] mt-0.5">{formatIDR(totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--fitlo-muted)] font-medium">Rate</div>
                    <div className="font-bold fitlo-num text-[var(--fitlo-ink)] mt-0.5">{p.commission_rate_pct || 15}%</div>
                  </div>
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="fitlo-card p-4.5 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">Partner Referral Code</div>
                <div className="flex items-center justify-between bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] rounded-xl px-3.5 py-2">
                  <span className="fitlo-num font-bold text-sm text-[var(--fitlo-ink)] tracking-wider">
                    {p.referral_code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card)] transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-[var(--fitlo-accent)]" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-[var(--fitlo-muted)] truncate">
                  Referral URL: <a href={referralUrl} target="_blank" rel="noreferrer" className="underline hover:text-[var(--fitlo-ink)]">{referralUrl}</a>
                </div>
              </div>

              {/* Partner Bank Details */}
              <div className="fitlo-card p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">Bank Account for Payouts</div>
                  <span className="fitlo-pill fitlo-pill--good">
                    <ShieldCheck size={11} />
                    Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Bank Name</span>
                    <span className="font-bold text-[var(--fitlo-ink)]">{p.bank_name || 'BCA (Bank Central Asia)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Account Holder</span>
                    <span className="font-medium text-[var(--fitlo-ink)]">{p.bank_account_name || fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Account Number</span>
                    <span className="fitlo-num font-bold text-[var(--fitlo-ink)] tracking-wider">{p.bank_account_number || '7720918231'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information & WhatsApp */}
              <div className="fitlo-card p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fitlo-muted)]">Contact Details</div>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--fitlo-accent)] hover:bg-[#08625c] text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageSquare size={12} />
                      <span>WhatsApp Partner</span>
                    </a>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Email</span>
                    <span className="font-medium text-[var(--fitlo-ink)]">{p.email || 'partner@example.com'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Phone</span>
                    <span className="fitlo-num text-[var(--fitlo-ink)]">{p.phone || '+62 812-3456-7890'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--fitlo-muted)]">Member Since</span>
                    <span className="text-[var(--fitlo-ink)]">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="pt-2 border-t border-[var(--fitlo-line)] flex items-center justify-between gap-3">
                {p.status === 'pending' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('active')}
                    className="fitlo-btn fitlo-btn--primary flex-1"
                  >
                    Approve Application
                  </button>
                )}

                {p.status === 'active' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('suspended')}
                    className="fitlo-btn fitlo-btn--ghost flex-1 text-[var(--fitlo-bad)] border-[var(--fitlo-bad-soft)] hover:bg-[var(--fitlo-bad-soft)]"
                  >
                    Suspend Partner
                  </button>
                )}

                {p.status === 'suspended' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('active')}
                    className="fitlo-btn fitlo-btn--primary flex-1"
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
              <div className="text-xs font-bold text-[var(--fitlo-ink)]">Attributed Bookings ({partnerBookings.length})</div>
              {partnerBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--fitlo-muted)]">No bookings attributed to this partner yet.</div>
              ) : (
                <div className="space-y-2">
                  {partnerBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-3 bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] rounded-xl hover:border-[rgba(22,26,25,0.2)] transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="fitlo-num text-xs font-bold text-[var(--fitlo-ink)]">#{b.reference_number || String(b.id || '').slice(0, 8)}</span>
                        <span className="font-bold text-xs fitlo-num text-[var(--fitlo-ink)]">{formatIDR(b.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--fitlo-muted)]">
                        <span>{b.treatment_name}</span>
                        <span className="fitlo-num">{b.booking_date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--fitlo-muted)] pt-1 border-t border-[var(--fitlo-line)]">
                        <span>Guest: {b.guest_name}</span>
                        <span className="text-[var(--fitlo-accent)] font-semibold fitlo-num">Comm: {formatIDR(b.revenue ? Number(b.revenue) * 0.15 : 0)}</span>
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
              <div className="text-xs font-bold text-[var(--fitlo-ink)]">Commission Ledger ({partnerCommissions.length})</div>
              {partnerCommissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--fitlo-muted)]">No commission transactions found.</div>
              ) : (
                <div className="space-y-2">
                  {partnerCommissions.map(c => (
                    <div key={c.id} className="p-3 bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="fitlo-num font-bold text-[var(--fitlo-ink)]">{c.reference_number || c.booking_id}</span>
                        <span className="font-bold text-[var(--fitlo-accent)] fitlo-num">{formatIDR(c.commission_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--fitlo-muted)] text-[11px]">
                        <span>Booking: {c.booking_id}</span>
                        <span className="capitalize font-semibold text-[var(--fitlo-ink)]">{c.status}</span>
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
              <div className="text-xs font-bold text-[var(--fitlo-ink)]">Disbursed Payouts ({partnerPayouts.length})</div>
              {partnerPayouts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--fitlo-muted)]">No payouts disbursed yet.</div>
              ) : (
                <div className="space-y-2">
                  {partnerPayouts.map(py => (
                    <div key={py.id} className="p-3 bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="fitlo-num font-bold text-[var(--fitlo-ink)]">{py.reference_number || 'PAYOUT'}</span>
                        <span className="font-bold text-[var(--fitlo-ink)] fitlo-num">{formatIDR(py.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--fitlo-muted)] text-[11px]">
                        <span>{new Date(py.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="fitlo-pill fitlo-pill--good">{py.status}</span>
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
