'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ChevronRight,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate } from '@/lib/payoutScheduler';

interface PayoutsEarningsTabProps {
  partners: any[];
  commissions: any[];
  payouts: any[];
  config: PayoutWeeklyScheduleConfig;
  onSelectPartner: (partner: any) => void;
  onTriggerPayout: (partner: any) => void;
}

type FilterType = 'all' | 'ready' | 'rollover' | 'pending' | 'paid';

export default function PayoutsEarningsTab({
  partners,
  commissions,
  payouts,
  config,
  onSelectPartner,
  onTriggerPayout
}: PayoutsEarningsTabProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const minThreshold = config.min_payout_threshold || 100000;

  // Filter partners
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.business_name && p.business_name.toLowerCase().includes(q)) ||
        (p.partner_code && p.partner_code.toLowerCase().includes(q)) ||
        (p.referral_code && p.referral_code.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const avail = Number(p.available_balance || 0);
      const paid = Number(p.paid_amount || 0);

      if (filter === 'ready') return avail >= minThreshold;
      if (filter === 'rollover') return avail > 0 && avail < minThreshold;
      if (filter === 'pending') {
        const hasPending = commissions.some(c => 
          (c.partner_id === p.id || c.partner_code === p.partner_code) && 
          (c.status === 'pending' || !c.service_completed || !c.payment_verified)
        );
        return hasPending;
      }
      if (filter === 'paid') return paid > 0;

      return true;
    });
  }, [partners, search, filter, minThreshold, commissions]);

  // Aggregate metrics
  const totalEarnedAll = partners.reduce((sum, p) => sum + Number(p.commission_earned || 0), 0);
  const totalPayableAll = partners.reduce((sum, p) => sum + Number(p.available_balance || 0), 0);
  const totalPaidAll = partners.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

  const handleExportCSV = () => {
    const headers = [
      'Partner ID',
      'Name',
      'Business',
      'Type',
      'Total Earned',
      'Available Balance',
      'Previously Paid',
      'Cycle Eligibility'
    ];
    const rows = filteredPartners.map(p => {
      const avail = Number(p.available_balance || 0);
      return [
        p.partner_code || p.id,
        `"${p.name}"`,
        `"${p.business_name || ''}"`,
        p.partner_type || 'individual',
        p.commission_earned || 0,
        avail,
        p.paid_amount || 0,
        avail >= minThreshold ? 'Ready for Next Cycle' : 'Rolls Over (< Min)'
      ];
    });
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `therapick_partner_earnings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Controls: Search, Filters, Export */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search partner by name, property, or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
          </div>

          {/* Export Action */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Download size={14} className="text-stone-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold mr-1 shrink-0">Filter:</span>
          
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            All Partners ({partners.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('ready')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filter === 'ready'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60'
            }`}
          >
            Ready for Next Cycle (≥ {formatIDR(minThreshold)})
          </button>

          <button
            type="button"
            onClick={() => setFilter('rollover')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filter === 'rollover'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60'
            }`}
          >
            Rollover (&lt; {formatIDR(minThreshold)})
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filter === 'pending'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            Has Pending
          </button>

          <button
            type="button"
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filter === 'paid'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            Disbursed
          </button>
        </div>
      </div>

      {/* Aggregate Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">Total Partner Earnings</span>
          <span className="text-lg font-bold font-mono text-neutral-900">{formatIDR(totalEarnedAll)}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-stone-200/90 shadow-2xs bg-emerald-50/20">
          <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">Current Net Payable</span>
          <span className="text-lg font-bold font-mono text-emerald-900">{formatIDR(totalPayableAll)}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">Historical Disbursals</span>
          <span className="text-lg font-bold font-mono text-neutral-900">{formatIDR(totalPaidAll)}</span>
        </div>
      </div>

      {/* Partner Earnings Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Partner Commission Ledger</h3>
            <p className="text-xs text-stone-500">
              Showing {filteredPartners.length} partner records.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-3.5">Partner Profile</th>
                <th className="py-3 px-3.5">Property / Type</th>
                <th className="py-3 px-3.5">Total Earned</th>
                <th className="py-3 px-3.5">Available Balance</th>
                <th className="py-3 px-3.5">Previously Paid</th>
                <th className="py-3 px-3.5">Refund Adj.</th>
                <th className="py-3 px-3.5">Next 7-Day Cycle</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No partners matching the selected filter or search query.
                  </td>
                </tr>
              ) : (
                filteredPartners.map(p => {
                  const avail = Number(p.available_balance || 0);
                  const ready = avail >= minThreshold;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPartner(p)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-stone-400">
                          {p.partner_code || p.referral_code || p.id.slice(0, 8)} · Rate: {p.commission_rate_pct || 15}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="font-medium text-stone-800">{p.business_name || 'Individual'}</div>
                        <div className="text-[10px] text-stone-400 uppercase font-mono">{p.partner_type || 'partner'}</div>
                      </td>

                      <td className="py-3.5 px-3.5 font-mono font-bold text-neutral-900">
                        {formatIDR(p.commission_earned)}
                      </td>

                      <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800">
                        {formatIDR(avail)}
                      </td>

                      <td className="py-3.5 px-3.5 font-mono text-stone-600">
                        {formatIDR(p.paid_amount)}
                      </td>

                      <td className="py-3.5 px-3.5 font-mono text-stone-400">
                        Rp 0
                      </td>

                      <td className="py-3.5 px-3.5">
                        {ready ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            <span>Eligible for Run</span>
                          </span>
                        ) : avail > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={11} />
                            <span>Rolls Over (&lt; {formatIDR(minThreshold)})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-mono">
                            Zero Balance
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onSelectPartner(p)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Ledger
                          </button>
                          {avail > 0 && (
                            <button
                              type="button"
                              onClick={() => onTriggerPayout(p)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Wallet size={11} />
                              <span>Disburse</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
