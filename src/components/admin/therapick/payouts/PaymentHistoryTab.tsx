'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Calendar, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  FileText,
  X,
  CreditCard,
  Building2,
  ExternalLink
} from 'lucide-react';
import { PaymentRecord, PartnerPayoutRow } from '@/types/payouts';
import { formatIDR, formatWitaDate, formatWitaDateTime } from '@/lib/payoutScheduler';

interface PaymentHistoryTabProps {
  payments: PaymentRecord[];
  partners: PartnerPayoutRow[];
}

export default function PaymentHistoryTab({
  payments,
  partners
}: PaymentHistoryTabProps) {
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Summary Metrics
  const totalAmountPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const thisMonthPaid = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    return payments
      .filter(p => {
        const d = new Date(p.date || p.created_at);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesPartner = p.partner_name.toLowerCase().includes(q);
        const matchesRef = (p.reference || '').toLowerCase().includes(q);
        const matchesNote = (p.notes || '').toLowerCase().includes(q);
        if (!matchesId && !matchesPartner && !matchesRef && !matchesNote) return false;
      }

      // Partner Filter
      if (partnerFilter !== 'all' && p.partner_id !== partnerFilter) {
        return false;
      }

      // Method Filter
      if (methodFilter !== 'all') {
        const m = (p.method || '').toLowerCase();
        if (!m.includes(methodFilter.toLowerCase())) return false;
      }

      // Date Preset Filter
      if (datePreset !== 'all') {
        const d = new Date(p.date || p.created_at);
        const now = new Date();
        if (datePreset === 'this_month') {
          if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return false;
        } else if (datePreset === 'last_month') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const yearOfLast = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (d.getFullYear() !== yearOfLast || d.getMonth() !== lastMonth) return false;
        }
      }

      return true;
    });
  }, [payments, search, partnerFilter, methodFilter, datePreset]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Payment ID', 'Date', 'Partner', 'Amount', 'Method', 'Reference', 'Status', 'Notes'];
    const rows = filteredPayments.map(p => [
      `"${p.id}"`,
      formatWitaDate(p.date),
      `"${p.partner_name}"`,
      p.amount,
      `"${p.method}"`,
      `"${p.reference}"`,
      p.status,
      `"${p.notes || ''}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `therapick_payment_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/90 shadow-2xs">
          <div className="text-xs font-bold text-stone-500">Total Payments Recorded</div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">
            {payments.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Auditable disburse log</div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/90 shadow-2xs">
          <div className="text-xs font-bold text-stone-500">Total Amount Disbursed</div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">
            {formatIDR(totalAmountPaid)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Cumulative partner payments</div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/90 shadow-2xs">
          <div className="text-xs font-bold text-stone-500">Payments This Month</div>
          <div className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">
            {formatIDR(thisMonthPaid)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Current calendar cycle</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        
        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-50/40">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search payment ID, partner, or reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-2xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* All Partners Dropdown */}
            <select
              value={partnerFilter}
              onChange={e => setPartnerFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Date Preset */}
            <select
              value={datePreset}
              onChange={e => setDatePreset(e.target.value as any)}
              className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>

            {/* Payment Method */}
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Methods</option>
              <option value="bca">BCA</option>
              <option value="mandiri">Mandiri</option>
              <option value="bni">BNI</option>
              <option value="cash">Cash</option>
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={13} className="text-stone-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-5">Payment ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Partner</th>
                <th className="py-3.5 px-4 font-mono">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 font-mono">Reference</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No payment history records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr 
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
                      {p.id}
                    </td>
                    <td className="py-4 px-4 text-stone-600 font-medium">
                      {formatWitaDate(p.date)}
                    </td>
                    <td className="py-4 px-4 font-bold text-neutral-900">
                      {p.partner_name}
                    </td>
                    <td className="py-4 px-4 font-mono font-extrabold text-neutral-950 text-sm">
                      {formatIDR(p.amount)}
                    </td>
                    <td className="py-4 px-4 text-stone-700 font-medium">
                      {p.method.replace('Bank Transfer', '').replace(/[()]/g, '').trim() || 'Bank Transfer'}
                    </td>
                    <td className="py-4 px-4 font-mono text-stone-600 text-[11px]">
                      {p.reference || '—'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Recorded</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(p);
                        }}
                        className="text-xs font-bold text-stone-500 hover:text-neutral-900 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight size={13} />
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
          {filteredPayments.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs">
              No payment history records found.
            </div>
          ) : (
            filteredPayments.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedPayment(p)}
                className="p-4 space-y-2.5 hover:bg-stone-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-neutral-900">{p.id}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                    <span>Recorded</span>
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900">{p.partner_name}</span>
                  <span className="font-mono font-extrabold text-sm text-neutral-950">
                    {formatIDR(p.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                  <span>{formatWitaDate(p.date)} · {p.method}</span>
                  <span className="font-mono text-[11px] text-stone-400">{p.reference || 'No ref'}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Payment Inspection Drawer / Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setSelectedPayment(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-stone-400">Payment Inspection</span>
                <h4 className="text-base font-extrabold text-neutral-900 font-mono">{selectedPayment.id}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Amount Disbursed</span>
                  <div className="text-xl font-extrabold font-mono text-emerald-950 mt-0.5">
                    {formatIDR(selectedPayment.amount)}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  Manual Transfer
                </span>
              </div>

              <div className="space-y-2.5 divide-y divide-stone-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-500">Beneficiary Partner</span>
                  <span className="font-bold text-neutral-900">{selectedPayment.partner_name}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-stone-500">Payment Date</span>
                  <span className="font-semibold text-neutral-900">{formatWitaDate(selectedPayment.date)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-stone-500">Payment Method</span>
                  <span className="font-medium text-neutral-900">{selectedPayment.method}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-stone-500">Transaction Reference</span>
                  <span className="font-mono font-bold text-neutral-900">{selectedPayment.reference || '—'}</span>
                </div>
                {selectedPayment.notes && (
                  <div className="pt-2">
                    <span className="text-stone-500 block mb-1">Admin Notes</span>
                    <p className="bg-stone-50 p-2.5 rounded-xl text-stone-700 font-medium leading-relaxed">
                      {selectedPayment.notes}
                    </p>
                  </div>
                )}
                {selectedPayment.receipt_url && (
                  <div className="pt-2">
                    <span className="text-stone-500 block mb-1">Receipt Attachment</span>
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-stone-700 truncate max-w-[200px]">
                        {selectedPayment.receipt_url}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Attached</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
