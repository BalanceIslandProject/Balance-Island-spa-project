'use client';

import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  Users, 
  Search, 
  ChevronRight, 
  Building2, 
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { PartnerPayoutRow, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate } from '@/lib/payoutScheduler';

interface PayoutsOverviewTabProps {
  partnerRows: PartnerPayoutRow[];
  config: PayoutWeeklyScheduleConfig;
  onSelectPartnerForDrawer: (partner: PartnerPayoutRow) => void;
  onOpenRecordPayment: (partner: PartnerPayoutRow) => void;
}

export default function PayoutsOverviewTab({
  partnerRows,
  config,
  onSelectPartnerForDrawer,
  onOpenRecordPayment
}: PayoutsOverviewTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partially Paid' | 'Paid'>('all');

  // Summary Metrics
  const totalUnpaid = useMemo(() => {
    return partnerRows.reduce((sum, p) => sum + (p.unpaid || 0), 0);
  }, [partnerRows]);

  const totalPaid = useMemo(() => {
    return partnerRows.reduce((sum, p) => sum + (p.paid || 0), 0);
  }, [partnerRows]);

  const partnersAwaitingCount = useMemo(() => {
    return partnerRows.filter(p => p.unpaid > 0).length;
  }, [partnerRows]);

  // Filtered Partner Rows
  const filteredRows = useMemo(() => {
    return partnerRows.filter(p => {
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBiz = (p.business_name || '').toLowerCase().includes(q);
        const matchesCode = (p.referral_code || p.partner_code || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBiz && !matchesCode) return false;
      }

      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [partnerRows, search, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Unpaid */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-500">Total Unpaid</div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono mt-1">
              {formatIDR(totalUnpaid)}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">Outstanding eligible commission</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet size={22} />
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-500">Total Paid</div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono mt-1">
              {formatIDR(totalPaid)}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">Recorded manual disbursements</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 3: Partners Awaiting Payment */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-500">Partners Awaiting Payment</div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono mt-1">
              {partnersAwaitingCount}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">With unpaid eligible commission</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
        </div>

      </div>

      {/* Partner Payouts Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/40">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">Partner Payouts</h3>
            <p className="text-xs text-stone-500 mt-0.5">Eligible commission balances and expected weekly disbursement schedules.</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search partner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-2xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-5">Partner</th>
                <th className="py-3.5 px-4 font-mono">Earned</th>
                <th className="py-3.5 px-4 font-mono">Paid</th>
                <th className="py-3.5 px-4 font-mono">Unpaid</th>
                <th className="py-3.5 px-4">Next Payout</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No partners matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map(p => (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectPartnerForDrawer(p)}
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                  >
                    {/* Partner Name & Business */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-neutral-950 text-sm group-hover:text-amber-800 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {p.business_name || 'Individual Partner'}
                      </div>
                    </td>

                    {/* Earned */}
                    <td className="py-4 px-4 font-mono font-bold text-neutral-900">
                      {formatIDR(p.earned)}
                    </td>

                    {/* Paid */}
                    <td className="py-4 px-4 font-mono text-stone-600">
                      {formatIDR(p.paid)}
                    </td>

                    {/* Unpaid (Bold Green) */}
                    <td className="py-4 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                      {formatIDR(p.unpaid)}
                    </td>

                    {/* Next Payout */}
                    <td className="py-4 px-4 font-medium text-stone-700">
                      {formatWitaDate(p.next_payout_date)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : p.status === 'Partially Paid'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'Paid' ? 'bg-emerald-500' :
                          p.status === 'Partially Paid' ? 'bg-sky-500' : 'bg-amber-500'
                        }`} />
                        <span>{p.status}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRecordPayment(p);
                        }}
                        disabled={p.unpaid <= 0}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dedicated Mobile Cards Layout */}
        <div className="block md:hidden divide-y divide-stone-100">
          {filteredRows.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs">
              No partners matching search criteria.
            </div>
          ) : (
            filteredRows.map(p => (
              <div 
                key={p.id}
                onClick={() => onSelectPartnerForDrawer(p)}
                className="p-4 space-y-3 hover:bg-stone-50/60 active:bg-amber-50/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-sm">{p.name}</h4>
                    <p className="text-xs text-stone-500">{p.business_name || 'Individual Partner'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">Unpaid Balance</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">
                      {formatIDR(p.unpaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">Next Payout</span>
                    <span className="font-semibold text-neutral-800">
                      {formatWitaDate(p.next_payout_date)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400 font-mono">
                    Paid: {formatIDR(p.paid)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRecordPayment(p);
                    }}
                    disabled={p.unpaid <= 0}
                    className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
