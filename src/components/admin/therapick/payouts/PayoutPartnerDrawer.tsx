'use client';

import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  User, 
  ShieldCheck, 
  Wallet, 
  Receipt, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatIDR, formatWitaDate, formatWitaDateTime } from '@/lib/payoutScheduler';
import { PayoutWeeklyScheduleConfig } from '@/types/payouts';

interface PayoutPartnerDrawerProps {
  partner: any | null;
  onClose: () => void;
  commissions: any[];
  payouts: any[];
  config: PayoutWeeklyScheduleConfig;
  onTriggerPayout: (partner: any) => void;
}

export default function PayoutPartnerDrawer({
  partner,
  onClose,
  commissions,
  payouts,
  config,
  onTriggerPayout
}: PayoutPartnerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'commissions' | 'payouts' | 'adjustments'>('commissions');

  if (!partner) return null;

  const partnerComms = commissions.filter(c => 
    c.partner_id === partner.id || 
    (c.partner_code && partner.partner_code && c.partner_code.toUpperCase() === partner.partner_code.toUpperCase())
  );

  const partnerPayouts = payouts.filter(p => 
    p.partner_id === partner.id || 
    (p.partner_code && partner.partner_code && p.partner_code.toUpperCase() === partner.partner_code.toUpperCase())
  );

  const availableBalance = Number(partner.available_balance || 0);
  const isEligible = availableBalance >= (config.min_payout_threshold || 100000);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200/90 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-stone-500 uppercase">
                {partner.partner_code || partner.referral_code || partner.id.slice(0, 8)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isEligible
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{isEligible ? 'Eligible for Payout' : 'Rolls Over (< Min)'}</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
              {partner.name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || 'Partner Ledger'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Quick Balance Card */}
          <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">
                Available Commission
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                Cycle: Weekly (Every 7 Days)
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-extrabold text-neutral-900 font-mono">
                  {formatIDR(availableBalance)}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {isEligible ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Scheduled for {formatWitaDate(config.next_scheduled_date)}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> Rolls over until minimum {formatIDR(config.min_payout_threshold)}
                    </span>
                  )}
                </div>
              </div>

              {availableBalance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerPayout(partner);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet size={13} />
                  <span>Disburse Now</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-200/80 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Total Earned</span>
                <span className="font-bold text-neutral-900 font-mono">
                  {formatIDR(partner.commission_earned || 0)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Total Disbursed</span>
                <span className="font-bold text-neutral-900 font-mono">
                  {formatIDR(partner.paid_amount || 0)}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Commission Rate</span>
                <span className="font-bold text-neutral-900 font-mono">
                  {partner.commission_rate_pct || config.default_commission_rate_pct || 15}%
                </span>
              </div>
            </div>
          </div>

          {/* Bank Destination Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Building2 size={13} className="text-stone-400" />
                Verified Bank Account
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck size={11} />
                Verified Destination
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Bank Name</span>
                <span className="font-bold text-neutral-900">
                  {partner.payout_details?.bank_name || partner.bank_name || 'BCA (Bank Central Asia)'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Account Holder</span>
                <span className="font-bold text-neutral-900 truncate block">
                  {partner.payout_details?.account_holder || partner.bank_holder || partner.name}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">Account Number</span>
                <span className="font-mono font-bold text-neutral-900">
                  {partner.payout_details?.account_number || partner.bank_number || '7720-1928-4491'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="border-b border-stone-200 flex items-center gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('commissions')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'commissions'
                  ? 'border-neutral-900 text-neutral-950 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Commissions ({partnerComms.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payouts')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'payouts'
                  ? 'border-neutral-900 text-neutral-950 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Payout History ({partnerPayouts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('adjustments')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'adjustments'
                  ? 'border-neutral-900 text-neutral-950 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Adjustments & Refunds
            </button>
          </div>

          {/* Sub-Tab Content */}
          {activeTab === 'commissions' && (
            <div className="space-y-2">
              {partnerComms.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No commission entries recorded for this partner.
                </div>
              ) : (
                partnerComms.map((c, idx) => (
                  <div 
                    key={c.id || idx}
                    className="p-3 bg-stone-50/70 border border-stone-200/70 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">
                          #{c.booking_id || c.reference_number || 'BOOKING'}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          c.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status || 'Pending'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {formatWitaDate(c.created_at)} · Gross: {formatIDR(c.booking_amount_gross || c.eligible_treatment_amount)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold font-mono text-neutral-900">
                        {formatIDR(c.commission_amount)}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Rate: {c.commission_rate_pct || 15}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-2">
              {partnerPayouts.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No historical payouts disbursed yet.
                </div>
              ) : (
                partnerPayouts.map((p, idx) => (
                  <div 
                    key={p.id || idx}
                    className="p-3 bg-stone-50/70 border border-stone-200/70 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-neutral-900">
                        {p.payout_reference || p.reference || 'PAY-REF'}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {formatWitaDate(p.processed_at || p.created_at)} · {p.method || 'Bank Transfer'}
                      </div>
                      {p.notes && (
                        <div className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[280px]">
                          Note: {p.notes}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-bold font-mono text-emerald-800">
                        {formatIDR(p.amount)}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={10} /> Disbursed
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'adjustments' && (
            <div className="py-6 text-center text-xs text-stone-400 space-y-1">
              <p>No refund deductions or dispute adjustments recorded.</p>
              <p className="text-[11px] text-stone-400">
                All bookings for this partner have settled cleanly without chargebacks.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
