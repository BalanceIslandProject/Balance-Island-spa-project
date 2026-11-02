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
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Card 1: Total Unpaid */}
        <div className="bg-white rounded-[6px] p-4 sm:p-5 border border-[#ebebeb] flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.071em] text-[#666666] block leading-none">
              Total Unpaid
            </span>
            <div className="text-xl sm:text-2xl font-medium text-[#171717] font-mono tabular-nums mt-1.5">
              {formatIDR(totalUnpaid)}
            </div>
            <div className="text-[11px] text-[#666666] mt-1">Eligible balance</div>
          </div>
          <div className="w-10 h-10 rounded-[6px] bg-[#297a3a]/10 text-[#297a3a] border border-[#297a3a]/20 flex items-center justify-center shrink-0">
            <Wallet size={18} />
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div className="bg-white rounded-[6px] p-4 sm:p-5 border border-[#ebebeb] flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.071em] text-[#666666] block leading-none">
              Total Paid
            </span>
            <div className="text-xl sm:text-2xl font-medium text-[#171717] font-mono tabular-nums mt-1.5">
              {formatIDR(totalPaid)}
            </div>
            <div className="text-[11px] text-[#666666] mt-1">Completed payouts</div>
          </div>
          <div className="w-10 h-10 rounded-[6px] bg-[#fafafa] text-[#171717] border border-[#ebebeb] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Card 3: Partners Awaiting Payment */}
        <div className="bg-white rounded-[6px] p-4 sm:p-5 border border-[#ebebeb] flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.071em] text-[#666666] block leading-none">
              Awaiting Settlement
            </span>
            <div className="text-xl sm:text-2xl font-medium text-[#171717] font-mono tabular-nums mt-1.5">
              {partnersAwaitingCount}
            </div>
            <div className="text-[11px] text-[#666666] mt-1">Partners with balance</div>
          </div>
          <div className="w-10 h-10 rounded-[6px] bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>

      </div>

      {/* Partner Payouts Table Card */}
      <div className="bg-white rounded-[6px] border border-[#ebebeb] overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-[#ebebeb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block leading-none mb-0.5">
              Queue
            </span>
            <h3 className="text-sm sm:text-base font-semibold tracking-[-0.03em] text-[#171717]">
              Partner Balances
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-52">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="text"
                placeholder="Search partner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs font-normal bg-[#fafafa] border border-[#ebebeb] rounded-[6px] pl-7 pr-3 h-8 text-[#171717] placeholder:text-[#a8a8a8] focus:bg-white focus:border-[#171717] outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs font-medium bg-[#fafafa] border border-[#ebebeb] rounded-[6px] px-2.5 h-8 text-[#171717] focus:bg-white focus:border-[#171717] outline-none cursor-pointer transition-all shrink-0"
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
              <tr className="border-b border-[#ebebeb] bg-[#fafafa] text-[10px] font-mono uppercase tracking-[0.071em] text-[#666666]">
                <th className="py-2.5 px-4 font-normal">Partner</th>
                <th className="py-2.5 px-3 font-normal">Earned</th>
                <th className="py-2.5 px-3 font-normal">Paid</th>
                <th className="py-2.5 px-3 font-normal">Unpaid</th>
                <th className="py-2.5 px-3 font-normal">Next Date</th>
                <th className="py-2.5 px-3 text-center font-normal">Status</th>
                <th className="py-2.5 px-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#666666]">
                    No partners found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map(p => (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectPartnerForDrawer(p)}
                    className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                  >
                    {/* Partner Name & Business */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#171717] group-hover:text-black transition-colors">
                        {p.name}
                      </div>
                      <div className="font-mono text-[11px] text-[#666666]">
                        {p.business_name || 'Individual Partner'}
                      </div>
                    </td>

                    {/* Earned */}
                    <td className="py-3 px-3 font-mono text-[#4d4d4d] tabular-nums">
                      {formatIDR(p.earned)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-3 font-mono text-[#666666] tabular-nums">
                      {formatIDR(p.paid)}
                    </td>

                    {/* Unpaid */}
                    <td className="py-3 px-3 font-mono font-semibold text-[#297a3a] tabular-nums">
                      {formatIDR(p.unpaid)}
                    </td>

                    {/* Next Payout */}
                    <td className="py-3 px-3 font-mono text-[11px] text-[#4d4d4d]">
                      {formatWitaDate(p.next_payout_date)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.04em] ${
                        p.status === 'Paid'
                          ? 'bg-[#297a3a]/10 text-[#297a3a] border border-[#297a3a]/25'
                          : p.status === 'Partially Paid'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'Paid' ? 'bg-[#297a3a]' :
                          p.status === 'Partially Paid' ? 'bg-sky-600' : 'bg-amber-600'
                        }`} />
                        <span>{p.status}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRecordPayment(p);
                        }}
                        disabled={p.unpaid <= 0}
                        className="h-7 px-3 rounded-[6px] bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Layout */}
        <div className="block md:hidden divide-y divide-[#ebebeb]">
          {filteredRows.length === 0 ? (
            <div className="py-8 text-center text-[#666666] text-xs">
              No partners found.
            </div>
          ) : (
            filteredRows.map(p => (
              <div 
                key={p.id}
                onClick={() => onSelectPartnerForDrawer(p)}
                className="p-3.5 space-y-2.5 hover:bg-[#fafafa] active:bg-[#ebebeb]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-[#171717] truncate">{p.name}</h4>
                    <p className="font-mono text-[11px] text-[#666666] truncate">{p.business_name || 'Individual'}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.04em] ${
                    p.status === 'Paid' 
                      ? 'bg-[#297a3a]/10 text-[#297a3a] border border-[#297a3a]/25' 
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#ebebeb]">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block leading-none">
                      Unpaid
                    </span>
                    <span className="font-mono font-semibold text-[#297a3a] text-xs mt-0.5 block tabular-nums">
                      {formatIDR(p.unpaid)}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block leading-none">
                      Next Date
                    </span>
                    <span className="font-mono text-[11px] text-[#4d4d4d] mt-0.5 block">
                      {formatWitaDate(p.next_payout_date)}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#666666] tabular-nums">
                    Paid: {formatIDR(p.paid)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRecordPayment(p);
                    }}
                    disabled={p.unpaid <= 0}
                    className="h-7 px-3 rounded-[6px] bg-[#171717] text-white text-xs font-medium disabled:opacity-30 cursor-pointer"
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
