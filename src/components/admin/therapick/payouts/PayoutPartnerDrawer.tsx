'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  CheckCircle2, 
  Wallet, 
  Receipt, 
  Calendar, 
  Clock, 
  CreditCard,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { PartnerPayoutRow, PaymentRecord, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate } from '@/lib/payoutScheduler';

interface PayoutPartnerDrawerProps {
  partner: PartnerPayoutRow | null;
  isOpen: boolean;
  onClose: () => void;
  commissions: any[];
  payments: PaymentRecord[];
  config: PayoutWeeklyScheduleConfig;
  onOpenRecordPayment: (partner: PartnerPayoutRow) => void;
}

export default function PayoutPartnerDrawer({
  partner,
  isOpen,
  onClose,
  commissions,
  payments,
  config,
  onOpenRecordPayment
}: PayoutPartnerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'payments'>('overview');

  if (!isOpen || !partner) return null;

  // Filter commissions & payments for this partner
  const partnerCommissions = commissions.filter(c => 
    c.partner_id === partner.id || 
    (c.partner_code && partner.partner_code && c.partner_code.toUpperCase() === partner.partner_code.toUpperCase()) ||
    (c.partner_name && partner.name && c.partner_name.toLowerCase() === partner.name.toLowerCase())
  );

  const partnerPayments = payments.filter(p => 
    p.partner_id === partner.id ||
    (p.partner_name && partner.name && p.partner_name.toLowerCase() === partner.name.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header (Matching Mockup) */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
              <User size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-950 text-base leading-tight">{partner.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">{partner.business_name || 'Affiliate Partner'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenRecordPayment(partner)}
              disabled={partner.unpaid <= 0}
              className="px-3.5 py-2 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={13} className="text-neutral-950" />
              <span>Record Payment</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3 Sub-Tabs Bar */}
        <div className="px-5 pt-3 border-b border-stone-100 flex items-center gap-2 bg-stone-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-neutral-950'
                : 'border-transparent text-stone-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'commissions'
                ? 'border-amber-400 text-neutral-950'
                : 'border-transparent text-stone-500 hover:text-neutral-900'
            }`}
          >
            <span>Commission History</span>
            <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono">
              {partnerCommissions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-amber-400 text-neutral-950'
                : 'border-transparent text-stone-500 hover:text-neutral-900'
            }`}
          >
            <span>Payment History</span>
            <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono">
              {partnerPayments.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* 3 Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block font-mono">Total Earned</span>
                  <span className="font-extrabold font-mono text-neutral-900 text-sm mt-0.5 block">
                    {formatIDR(partner.earned)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block font-mono">Total Paid</span>
                  <span className="font-extrabold font-mono text-neutral-900 text-sm mt-0.5 block">
                    {formatIDR(partner.paid)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block font-mono">Unpaid Balance</span>
                  <span className="font-extrabold font-mono text-emerald-700 text-sm mt-0.5 block">
                    {formatIDR(partner.unpaid)}
                  </span>
                </div>
              </div>

              {/* Information Rows */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200/80 space-y-3 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-stone-400" />
                    Next Payout
                  </span>
                  <span className="font-bold text-neutral-900">{formatWitaDate(partner.next_payout_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Clock size={13} className="text-stone-400" />
                    Payout Cycle
                  </span>
                  <span className="font-semibold text-neutral-900">Every 7 Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <User size={13} className="text-stone-400" />
                    Joined
                  </span>
                  <span className="font-semibold text-neutral-900">{partner.joined_date || '12 Sep 2026'}</span>
                </div>
                {partner.account_number && (
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-stone-500 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-stone-400" />
                      Disbursement Account
                    </span>
                    <span className="font-mono font-bold text-neutral-900">
                      {partner.bank_name || 'BCA'} · {partner.account_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Recent Commissions Card */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-neutral-900 text-xs">Recent Commissions</h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('commissions')}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {partnerCommissions.slice(0, 3).map(comm => (
                    <div key={comm.id} className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-neutral-900">{comm.booking_reference || `#${String(comm.id || '').slice(0, 6)}`}</div>
                        <div className="text-[10px] text-stone-400">{comm.service_name || 'Spa Package'} · {formatWitaDate(comm.created_at)}</div>
                      </div>
                      <span className="font-bold font-mono text-emerald-700">
                        {formatIDR(comm.commission_amount)}
                      </span>
                    </div>
                  ))}
                  {partnerCommissions.length === 0 && (
                    <p className="text-xs text-stone-400 py-3 text-center">No recent commissions recorded.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COMMISSION HISTORY */}
          {activeTab === 'commissions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                <span>Showing <strong>{partnerCommissions.length}</strong> attributed treatments</span>
                <span className="font-mono font-bold text-neutral-900">Total: {formatIDR(partner.earned)}</span>
              </div>

              <div className="space-y-2">
                {partnerCommissions.map(comm => {
                  const isPaid = comm.status === 'paid' || !!comm.payout_id;
                  const isApproved = String(comm.status).toLowerCase() === 'approved';
                  const isCancelled = String(comm.status).toLowerCase() === 'cancelled';
                  const badgeLabel = isPaid 
                    ? 'Settled' 
                    : isApproved 
                    ? 'Eligible (Approved)' 
                    : isCancelled 
                    ? 'Cancelled' 
                    : 'Pending Treatment';
                  const badgeStyle = isPaid 
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : isApproved 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                    : isCancelled 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200';

                  return (
                    <div key={comm.id} className="p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-neutral-950">
                          {comm.booking_reference || (comm.booking_id ? `#${String(comm.booking_id).replace(/^#/, '')}` : `#${String(comm.id || '').slice(0, 8)}`)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-stone-600">{comm.service_name || 'Balinese Traditional Ritual'}</span>
                        <span className="font-mono font-extrabold text-emerald-700 text-sm">
                          {formatIDR(comm.commission_amount)}
                        </span>
                      </div>

                      <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-100">
                        Attributed on {formatWitaDate(comm.created_at)}
                      </div>
                    </div>
                  );
                })}

                {partnerCommissions.length === 0 && (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    No commission history recorded for this partner yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                <span>Showing <strong>{partnerPayments.length}</strong> recorded manual disbursements</span>
                <span className="font-mono font-bold text-neutral-900">Total Paid: {formatIDR(partner.paid)}</span>
              </div>

              <div className="space-y-2">
                {partnerPayments.map(p => (
                  <div key={p.id} className="p-3.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-neutral-950">{p.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Recorded
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-stone-600 font-medium">{p.method} · {p.reference || 'Manual Ref'}</span>
                      <span className="font-mono font-extrabold text-neutral-900 text-sm">
                        {formatIDR(p.amount)}
                      </span>
                    </div>

                    <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-100 flex items-center justify-between">
                      <span>Transferred on {formatWitaDate(p.date)}</span>
                      {p.notes && <span className="text-stone-500 truncate max-w-[150px]">{p.notes}</span>}
                    </div>
                  </div>
                ))}

                {partnerPayments.length === 0 && (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    No payment history recorded for this partner yet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
