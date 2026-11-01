'use client';

import React, { useState } from 'react';
import { 
  Wallet, Building2, CheckCircle2, Clock, ShieldCheck, 
  Plus, Download, ExternalLink, ChevronRight, FileText, ArrowUpRight 
} from 'lucide-react';
import { useTherapickAdmin, AffiliatePartner, AffiliatePayout } from '@/context/TherapickAdminContext';

export default function TherapickPayoutsView() {
  const { 
    partners, 
    payouts, 
    setSelectedPartner, 
    setIsCreatePayoutOpen 
  } = useTherapickAdmin();

  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | 'completed' | 'processing'>('all');

  const filteredPayouts = payouts.filter(p => {
    if (payoutStatusFilter !== 'all' && p.status !== payoutStatusFilter) return false;
    return true;
  });

  const totalPaidOut = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPendingPayout = partners.reduce((sum, p) => sum + (p.available_balance || 0), 0);

  const handleExportCSV = () => {
    const headers = ['Payout ID', 'Date', 'Partner', 'Amount', 'Method', 'Reference', 'Status', 'Notes'];
    const rows = filteredPayouts.map(p => [
      p.id,
      new Date(p.created_at).toLocaleDateString(),
      `"${p.partner_name}"`,
      p.amount,
      p.method || 'Bank Transfer',
      `"${p.reference || ''}"`,
      p.status,
      `"${p.notes || ''}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `therapick_payouts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Partner Payouts & Disbursals
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Process bank transfers, track settlements, and review historical commission disbursements.
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
            <Plus size={15} />
            <span>Record New Payout</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700">Total Paid Out</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
            Rp {totalPaidOut.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-stone-400 mt-1">Disbursed successfully to partners</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">Pending Payable Balances</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1 font-mono">
            Rp {totalPendingPayout.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-amber-700 mt-1">Accumulated across active partners</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500">Payout Records</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1 font-mono">
            {payouts.length} Disbursements
          </div>
          <div className="text-xs text-stone-400 mt-1">Audit log of corporate settlements</div>
        </div>
      </div>

      {/* Partners with Ready Balances Row */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Partners Ready for Payout</h3>
            <p className="text-xs text-stone-500">Partners with an accumulated available balance greater than Rp 0.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {partners
            .filter(p => (p.available_balance || 0) > 0)
            .map(p => (
              <div 
                key={p.id}
                onClick={() => {
                  setSelectedPartner(p);
                  setIsCreatePayoutOpen(true);
                }}
                className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/40 hover:bg-white transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-stone-500">{p.business_name || 'Individual'}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Ready
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-stone-100">
                  <span className="text-[11px] text-stone-400">Available:</span>
                  <span className="text-sm font-bold font-mono text-neutral-900">
                    Rp {(p.available_balance || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-full py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wallet size={12} />
                  <span>Process Payout</span>
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Historical Payout Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="text-sm font-bold text-neutral-900">Historical Disbursals</h3>
          <span className="text-xs text-stone-500">{filteredPayouts.length} completed transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Payout ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Amount Disbursed</th>
                <th className="py-3 px-4">Bank Ref</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No historical payouts found.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-700">{p.id.slice(0, 10)}...</td>
                    <td className="py-3.5 px-4 text-stone-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900">{p.partner_name}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-emerald-800">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-700">{p.reference || 'Manual Transfer'}</td>
                    <td className="py-3.5 px-4 text-stone-500 max-w-[200px] truncate">{p.notes || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={11} />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
