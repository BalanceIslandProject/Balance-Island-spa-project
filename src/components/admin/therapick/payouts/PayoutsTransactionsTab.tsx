'use client';

import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { PayoutTransaction, TransactionType, TransactionStatus } from '@/types/payouts';
import { formatIDR, formatWitaDate, formatWitaDateTime } from '@/lib/payoutScheduler';

interface PayoutsTransactionsTabProps {
  transactions: PayoutTransaction[];
}

export default function PayoutsTransactionsTab({ transactions }: PayoutsTransactionsTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [selectedTxn, setSelectedTxn] = useState<PayoutTransaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        t.id.toLowerCase().includes(q) ||
        t.partner_name.toLowerCase().includes(q) ||
        (t.partner_code && t.partner_code.toLowerCase().includes(q)) ||
        (t.booking_reference && t.booking_reference.toLowerCase().includes(q)) ||
        (t.bank_reference && t.bank_reference.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      return true;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Timestamp',
      'Partner',
      'Partner Code',
      'Booking Reference',
      'Type',
      'Direction',
      'Amount',
      'Status',
      'Bank Ref / Notes'
    ];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.timestamp,
      `"${t.partner_name}"`,
      t.partner_code || '',
      t.booking_reference || '',
      t.type,
      t.direction,
      t.amount,
      t.status,
      `"${t.bank_reference || t.notes || ''}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `therapick_transactions_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header & Search / Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search transaction ID, partner, booking ref, or bank ref..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Download size={14} className="text-stone-500" />
            <span>Export Ledger CSV</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
          <span className="text-[11px] font-mono uppercase text-stone-400 font-bold mr-1 shrink-0">Type:</span>
          
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'commission_earned', label: 'Commissions' },
            { id: 'payout_disbursed', label: 'Payouts' },
            { id: 'refund_adjustment', label: 'Refunds' },
            { id: 'manual_adjustment', label: 'Adjustments' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                typeFilter === f.id
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-stone-500" />
            <h3 className="text-sm font-bold text-neutral-900">Immutable Financial Ledger</h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            {filteredTransactions.length} recorded entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-3.5">Txn ID</th>
                <th className="py-3 px-3.5">Date & Time (WITA)</th>
                <th className="py-3 px-3.5">Partner Profile</th>
                <th className="py-3 px-3.5">Booking Ref</th>
                <th className="py-3 px-3.5">Ledger Type</th>
                <th className="py-3 px-3.5">Amount</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isCredit = t.direction === 'credit';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-neutral-900 group-hover:text-amber-600">
                        {t.id}
                      </td>

                      <td className="py-3 px-3.5 text-stone-500 font-mono text-[11px]">
                        {formatWitaDateTime(t.timestamp)}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-neutral-900">{t.partner_name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{t.partner_code}</div>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-stone-600">
                        {t.booking_reference ? `#${t.booking_reference}` : '—'}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          t.type === 'commission_earned'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.type === 'payout_disbursed'
                            ? 'bg-blue-100 text-blue-800'
                            : t.type === 'refund_adjustment'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {isCredit ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          <span>{t.type.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className={`py-3 px-3.5 font-mono font-bold ${
                        isCredit ? 'text-emerald-700' : 'text-neutral-950'
                      }`}>
                        {isCredit ? '+' : '-'} {formatIDR(t.amount)}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 size={11} /> Cleared
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(t);
                          }}
                          className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-stone-600" />
                <h3 className="text-base font-bold text-neutral-900">Transaction Details</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-400">Transaction ID:</span>
                  <span className="font-mono font-bold text-neutral-900">{selectedTxn.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Timestamp:</span>
                  <span className="font-medium text-neutral-900">{formatWitaDateTime(selectedTxn.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Type:</span>
                  <span className="font-mono font-bold uppercase">{selectedTxn.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Amount:</span>
                  <span className="font-mono font-bold text-base text-neutral-950">{formatIDR(selectedTxn.amount)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="flex justify-between">
                  <span className="text-stone-500">Partner:</span>
                  <span className="font-bold text-neutral-900">{selectedTxn.partner_name} ({selectedTxn.partner_code})</span>
                </div>
                {selectedTxn.booking_reference && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Booking Reference:</span>
                    <span className="font-mono font-bold text-neutral-900">#{selectedTxn.booking_reference}</span>
                  </div>
                )}
                {selectedTxn.bank_reference && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Bank Reference:</span>
                    <span className="font-mono font-bold text-blue-800">{selectedTxn.bank_reference}</span>
                  </div>
                )}
                {selectedTxn.notes && (
                  <div className="pt-1">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">Ledger Memo:</span>
                    <p className="text-neutral-700 bg-stone-50 rounded p-2 text-[11px] mt-0.5">{selectedTxn.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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
