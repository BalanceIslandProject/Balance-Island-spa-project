'use client';

import React from 'react';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Building2, 
  Layers, 
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PayoutTab, PayoutWeeklyScheduleConfig, PayoutRun, PayoutTransaction } from '@/types/payouts';
import { formatIDR, formatWitaDate, getUpcomingWeeklyCycles } from '@/lib/payoutScheduler';

interface PayoutsOverviewTabProps {
  partners: any[];
  payouts: any[];
  commissions: any[];
  config: PayoutWeeklyScheduleConfig;
  payoutRuns: PayoutRun[];
  transactions: PayoutTransaction[];
  onChangeTab: (tab: PayoutTab) => void;
  onSelectPartner: (partner: any) => void;
  onOpenCreateBatch: () => void;
}

export default function PayoutsOverviewTab({
  partners,
  payouts,
  commissions,
  config,
  payoutRuns,
  transactions,
  onChangeTab,
  onSelectPartner,
  onOpenCreateBatch
}: PayoutsOverviewTabProps) {
  const minThreshold = config.min_payout_threshold || 100000;

  // 1. Available to Pay: Sum of available balances for partners meeting minimum threshold
  const partnersWithBalance = partners.filter(p => (Number(p.available_balance) || 0) > 0);
  const eligiblePartners = partners.filter(p => (Number(p.available_balance) || 0) >= minThreshold);
  const rolloverPartners = partners.filter(p => (Number(p.available_balance) || 0) > 0 && (Number(p.available_balance) || 0) < minThreshold);

  const totalAvailableToPay = eligiblePartners.reduce((sum, p) => sum + Number(p.available_balance || 0), 0);
  const totalRolloverBalance = rolloverPartners.reduce((sum, p) => sum + Number(p.available_balance || 0), 0);
  const totalAllAvailable = partnersWithBalance.reduce((sum, p) => sum + Number(p.available_balance || 0), 0);

  // 2. Pending Clearance: Commissions awaiting service completion or payment
  const pendingComms = commissions.filter(c => 
    c.status === 'pending' || 
    (!c.service_completed && c.status !== 'cancelled' && c.status !== 'paid') ||
    (!c.payment_verified && c.status !== 'cancelled' && c.status !== 'paid')
  );
  const pendingClearanceAmount = pendingComms.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

  // 3. Paid This Month: Successfully transferred payouts in the current calendar month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const thisMonthPayouts = payouts.filter(p => {
    if (!p.created_at && !p.processed_at) return false;
    const d = new Date(p.processed_at || p.created_at);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const totalPaidThisMonth = thisMonthPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // 4. On Hold: Cancelled bookings, disputed commissions, or pending review
  const onHoldComms = commissions.filter(c => c.status === 'cancelled' || c.status === 'on_hold');
  const onHoldAmount = onHoldComms.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

  // Upcoming cycles (strictly 7 days)
  const upcomingCycles = getUpcomingWeeklyCycles(config, 3);
  const nextCycle = upcomingCycles[0] || {
    reference: 'PR-2026-W45',
    dateStr: config.next_scheduled_date,
    formattedDate: formatWitaDate(config.next_scheduled_date),
    dayOfWeek: 'Thursday',
    cutoffTime: `${config.weekly_cutoff_time || '23:59'} WITA`,
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Available to Pay */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">
              Available to Pay
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2 font-mono">
            {formatIDR(totalAvailableToPay)}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>{eligiblePartners.length} eligible partners (≥ {formatIDR(minThreshold)})</span>
          </div>
          {totalRolloverBalance > 0 && (
            <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-amber-700 font-medium">
              + {formatIDR(totalRolloverBalance)} in rollover balances
            </div>
          )}
        </div>

        {/* 2. Pending Clearance */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
              Pending Clearance
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-950 mt-2 font-mono">
            {formatIDR(pendingClearanceAmount)}
          </div>
          <div className="text-xs text-amber-800/80 mt-1">
            {pendingComms.length} bookings awaiting completion / payment
          </div>
        </div>

        {/* 3. Paid This Month */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800">
              Paid This Month
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2 font-mono">
            {formatIDR(totalPaidThisMonth)}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {thisMonthPayouts.length} disbursements successfully settled
          </div>
        </div>

        {/* 4. On Hold / Review */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">
              On Hold / Disputed
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2 font-mono">
            {formatIDR(onHoldAmount)}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {onHoldComms.length} items requiring review or cancelled
          </div>
        </div>

      </div>

      {/* Next Payout Run Highlight Card (Weekly 7-Day Schedule) */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#0F172A] text-white">
                {nextCycle.reference}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                Weekly Cycle · Every 7 Days Only
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                Cutoff: {nextCycle.cutoffTime}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-neutral-900">
                Next Scheduled Payout Run: {nextCycle.formattedDate}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 max-w-2xl leading-relaxed">
                Eligible commissions automatically accumulate over the fixed 7-day cycle. Balances meeting the {formatIDR(minThreshold)} threshold will be grouped for corporate bank transfer approval.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-stone-600">
                <Building2 size={14} className="text-stone-400" />
                <span>Method: <strong>Indonesian Bank Transfer (BCA)</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-600">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Approval: <strong>Manual Admin Authorization Required</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-100">
            <div className="text-left lg:text-right">
              <span className="text-[11px] font-mono uppercase font-bold text-stone-400">Estimated Batch Amount</span>
              <div className="text-2xl font-extrabold text-neutral-950 font-mono">
                {formatIDR(totalAvailableToPay)}
              </div>
              <span className="text-[11px] text-stone-500">
                {eligiblePartners.length} partners ready for batching
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenCreateBatch}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers size={14} />
                <span>Review Payout Batch</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeTab('settings')}
                className="px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer shrink-0"
              >
                Settings
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Partners Ready for Payout Compact List */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Partners Ready for Payout</h3>
            <p className="text-xs text-stone-500">
              Active partners with accumulated eligible commissions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChangeTab('earnings')}
            className="text-xs font-bold text-neutral-900 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Partner Earnings</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {partnersWithBalance.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No partners currently have an available payout balance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500">
                  <th className="py-2.5 px-3">Partner Name</th>
                  <th className="py-2.5 px-3">Property / Type</th>
                  <th className="py-2.5 px-3">Available Balance</th>
                  <th className="py-2.5 px-3">7-Day Run Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {partnersWithBalance.slice(0, 5).map(p => {
                  const bal = Number(p.available_balance || 0);
                  const ready = bal >= minThreshold;

                  return (
                    <tr 
                      key={p.id}
                      onClick={() => onSelectPartner(p)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900">{p.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{p.partner_code || p.referral_code}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-stone-700">{p.business_name || 'Individual'}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                        {formatIDR(bal)}
                      </td>
                      <td className="py-3 px-3">
                        {ready ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} /> Eligible for Run
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={11} /> Rolls Over (&lt; {formatIDR(minThreshold)})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPartner(p);
                          }}
                          className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-neutral-900 hover:text-white text-stone-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Split Row: Recent Payout Runs & Recent Transactions Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Recent Payout Runs Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-stone-500" />
              <h3 className="text-sm font-bold text-neutral-900">Recent Payout Runs</h3>
            </div>
            <button
              type="button"
              onClick={() => onChangeTab('runs')}
              className="text-xs font-bold text-neutral-900 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {payoutRuns.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No payout runs created yet. Click "Review Payout Batch" to prepare the first run.
            </div>
          ) : (
            <div className="space-y-2">
              {payoutRuns.slice(0, 3).map(run => (
                <div
                  key={run.id}
                  onClick={() => onChangeTab('runs')}
                  className="p-3 bg-stone-50/70 hover:bg-stone-100/70 rounded-xl border border-stone-200/70 transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-neutral-900">{run.run_reference}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Scheduled: {formatWitaDate(run.scheduled_date)} · {run.partner_count} partners
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-neutral-900">{formatIDR(run.total_amount)}</div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.2 rounded-full uppercase bg-emerald-100 text-emerald-800">
                      {run.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-stone-500" />
              <h3 className="text-sm font-bold text-neutral-900">Recent Transactions</h3>
            </div>
            <button
              type="button"
              onClick={() => onChangeTab('transactions')}
              className="text-xs font-bold text-neutral-900 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No financial transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 4).map(txn => (
                <div
                  key={txn.id}
                  onClick={() => onChangeTab('transactions')}
                  className="p-3 bg-stone-50/70 hover:bg-stone-100/70 rounded-xl border border-stone-200/70 transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-900">{txn.id}</span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                        txn.direction === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {txn.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">
                      {txn.partner_name} {txn.booking_reference ? `· #${txn.booking_reference}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-mono font-bold ${
                      txn.direction === 'credit' ? 'text-emerald-700' : 'text-neutral-900'
                    }`}>
                      {txn.direction === 'credit' ? '+' : '-'} {formatIDR(txn.amount)}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {formatWitaDate(txn.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
