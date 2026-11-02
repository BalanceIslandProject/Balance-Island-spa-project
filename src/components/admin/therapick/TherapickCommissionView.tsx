'use client';

import React, { useState } from 'react';
import { 
  Receipt, Wallet, ArrowUpRight, CheckCircle2, AlertCircle, 
  Clock, ShieldAlert, ChevronRight, DollarSign, Download, Filter 
} from 'lucide-react';
import { useTherapickAdmin, AffiliatePartner, CommissionLedgerItem } from '@/context/TherapickAdminContext';

export default function TherapickCommissionView() {
  const { 
    partners, 
    commissions, 
    affiliateMetrics, 
    setSelectedPartner, 
    setIsCreatePayoutOpen,
    updateCommissionStatus
  } = useTherapickAdmin();

  const [activeTab, setActiveTab] = useState<'summary' | 'ledger'>('summary');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<string>('all');

  const filteredLedger = commissions.filter(c => {
    if (ledgerStatusFilter !== 'all' && c.status !== ledgerStatusFilter) return false;
    return true;
  });

  const handleExportCSV = () => {
    if (activeTab === 'summary') {
      const headers = ['Partner', 'Code', 'Affiliate Revenue', 'Therapist Fees', 'Commission Earned', 'Commission Paid', 'Available Balance'];
      const rows = partners.map(p => {
        const fees = Math.round(p.affiliate_revenue * 0.45);
        return [
          `"${p.name}"`,
          p.referral_code,
          p.affiliate_revenue,
          fees,
          p.commission_earned,
          p.paid_amount || 0,
          p.available_balance || 0
        ];
      });
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `therapick_commission_summary_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = ['Transaction ID', 'Date', 'Partner', 'Booking ID', 'Amount', 'Rate', 'Status'];
      const rows = filteredLedger.map(c => [
        c.id,
        c.created_at,
        `"${c.partner_name}"`,
        c.booking_id,
        c.commission_amount,
        `${c.commission_rate}%`,
        c.status
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `therapick_commission_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Commission Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Audit partner commission earnings, payable balances, and immutable transaction ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-stone-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreatePayoutOpen(true)}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Wallet size={15} />
            <span>Record Payout</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Total Affiliate Revenue</div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
            Rp {affiliateMetrics.revenue.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-1">From completed referrals</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Therapist Fees (45-55%)</div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-700 mt-1 font-mono">
            Rp {affiliateMetrics.therapist_fee.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-1">Direct therapist payout costs</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600">Total Commissions (15%)</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1 font-mono">
            Rp {affiliateMetrics.commission.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-1">Earned by partners to date</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700">Available Balance Payable</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1 font-mono">
            Rp {affiliateMetrics.available_balance.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Ready for bank disbursement</div>
        </div>
      </div>

      {/* Regulatory Rule Banner */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
        <ShieldAlert size={18} className="text-stone-500 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 space-y-1">
          <p className="font-bold text-neutral-900">Financial Integrity Rules</p>
          <p className="leading-relaxed">
            Commissions are credited strictly at 15% of the completed treatment value. Cancelled or refunded reservations automatically reverse commissions. Historical ledger records cannot be edited or silently removed.
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Partner Summary vs Transaction Ledger */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[#facc15] text-neutral-950 shadow-xs'
              : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-100'
          }`}
        >
          Partner Financial Breakdown
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-[#facc15] text-neutral-950 shadow-xs'
              : 'text-stone-600 hover:text-neutral-900 hover:bg-stone-100'
          }`}
        >
          Commission Transaction Ledger ({commissions.length})
        </button>
      </div>

      {/* TAB 1: PARTNER FINANCIAL BREAKDOWN */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4">Affiliate Revenue</th>
                  <th className="py-3 px-4">Est. Therapist Fees</th>
                  <th className="py-3 px-4">Commission Earned</th>
                  <th className="py-3 px-4">Commission Paid</th>
                  <th className="py-3 px-4">Available Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {partners.map(p => {
                  const estTherapistFee = Math.round(p.affiliate_revenue * 0.45);
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedPartner(p)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900">{p.name}</div>
                        <div className="text-[11px] text-stone-500">{p.business_name || 'Individual'}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-700">
                        {p.referral_code}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        Rp {(Number(p.affiliate_revenue) || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        Rp {estTherapistFee.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        Rp {(Number(p.commission_earned) || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-stone-500">
                        Rp {(p.paid_amount || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        Rp {(p.available_balance || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedPartner(p)}
                          className="px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
              {(['all', 'available', 'paid', 'pending', 'reversed'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setLedgerStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    ledgerStatusFilter === status ? 'bg-white text-neutral-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <span className="text-xs text-stone-500">{filteredLedger.length} transaction entries</span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Commission Amount</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        No commission entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(c => (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-700">{String(c.id || '').slice(0, 10)}...</td>
                        <td className="py-3.5 px-4 text-stone-500">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-bold text-neutral-900">{c.partner_name}</td>
                        <td className="py-3.5 px-4 font-mono text-stone-600">{String(c.booking_id || '').slice(0, 8)}...</td>
                        <td className="py-3.5 px-4 font-bold font-mono text-neutral-900">
                          Rp {c.commission_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-500">{c.commission_rate}%</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            c.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                            c.status === 'approved' || c.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {c.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Approve commission for booking #${c.booking_id}? This makes it eligible for payouts.`)) {
                                  await updateCommissionStatus(c.id, 'approved');
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          ) : c.status === 'approved' || c.status === 'available' ? (
                            <span className="text-[11px] font-semibold text-emerald-700">Eligible</span>
                          ) : c.status === 'paid' ? (
                            <span className="text-[11px] font-semibold text-blue-700">Settled</span>
                          ) : (
                            <span className="text-[11px] text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
