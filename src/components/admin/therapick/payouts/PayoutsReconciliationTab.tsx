'use client';

import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  X,
  FileCheck,
  Search
} from 'lucide-react';
import { ReconciliationItem } from '@/types/payouts';
import { formatIDR, formatWitaDate, formatWitaDateTime } from '@/lib/payoutScheduler';

interface PayoutsReconciliationTabProps {
  reconciliationItems: ReconciliationItem[];
  onReconcileItem: (itemId: string, bankRef: string) => Promise<void>;
  onMarkFailed: (itemId: string, reason: string) => Promise<void>;
  onRetryItem: (itemId: string) => Promise<void>;
}

export default function PayoutsReconciliationTab({
  reconciliationItems,
  onReconcileItem,
  onMarkFailed,
  onRetryItem
}: PayoutsReconciliationTabProps) {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<ReconciliationItem | null>(null);
  const [bankRefInput, setBankRefInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items
  const filteredItems = reconciliationItems.filter(item => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.payout_reference.toLowerCase().includes(q) ||
      item.partner_name.toLowerCase().includes(q) ||
      item.bank_reference.toLowerCase().includes(q) ||
      item.account_number.toLowerCase().includes(q)
    );
  });

  // Calculate metrics
  const totalExpected = reconciliationItems.reduce((sum, i) => sum + i.amount, 0);
  const reconciledItems = reconciliationItems.filter(i => i.is_reconciled);
  const totalConfirmed = reconciledItems.reduce((sum, i) => sum + i.amount, 0);
  const pendingItems = reconciliationItems.filter(i => !i.is_reconciled && i.status !== 'failed');
  const totalPending = pendingItems.reduce((sum, i) => sum + i.amount, 0);
  const failedItems = reconciliationItems.filter(i => i.status === 'failed');
  const totalFailed = failedItems.reduce((sum, i) => sum + i.amount, 0);

  const isFullyBalanced = pendingItems.length === 0 && failedItems.length === 0 && reconciliationItems.length > 0;

  const handleOpenReconcile = (item: ReconciliationItem) => {
    setEditingItem(item);
    setBankRefInput(item.bank_reference || `BCA-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmReconciliation = async () => {
    if (!editingItem || !bankRefInput.trim()) return;
    setIsSubmitting(true);
    try {
      await onReconcileItem(editingItem.id, bankRefInput.trim());
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Financial Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Expected Payout */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block">
            Expected Disbursement
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2 font-mono">
            {formatIDR(totalExpected)}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {reconciliationItems.length} total payout transactions
          </div>
        </div>

        {/* 2. Confirmed Bank Settled */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
              Confirmed Bank Settled
            </span>
            <CheckCircle2 size={14} className="text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-2 font-mono">
            {formatIDR(totalConfirmed)}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            {reconciledItems.length} verified against bank statement
          </div>
        </div>

        {/* 3. Awaiting Bank Ref */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-800 block">
              Pending Verification
            </span>
            <Clock size={14} className="text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold text-amber-950 mt-2 font-mono">
            {formatIDR(totalPending)}
          </div>
          <div className="text-xs text-amber-800 mt-1">
            {pendingItems.length} transfers awaiting bank statement matching
          </div>
        </div>

        {/* 4. Discrepancy / Balance Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block">
            Reconciliation Health
          </span>
          <div className="mt-2">
            {isFullyBalanced ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck size={14} /> 100% Balanced
              </span>
            ) : totalFailed > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                <AlertCircle size={14} /> {failedItems.length} Failed (Action Req.)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                <Clock size={14} /> {pendingItems.length} Pending Matching
              </span>
            )}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            Corporate banking audit verification
          </div>
        </div>

      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Bank Transfer Reconciliation Audit</h3>
            <p className="text-xs text-stone-500">
              Match individual bank transfer references against partner disbursements.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search ref or partner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-3.5">Payout Ref</th>
                <th className="py-3 px-3.5">Disbursed Date</th>
                <th className="py-3 px-3.5">Partner Profile</th>
                <th className="py-3 px-3.5">Bank Destination</th>
                <th className="py-3 px-3.5">Amount</th>
                <th className="py-3 px-3.5">Bank Transfer Ref</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No reconciliation items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isRec = item.is_reconciled;
                  const isFailed = item.status === 'failed';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-3.5 font-mono font-bold text-neutral-900">
                        {item.payout_reference}
                      </td>

                      <td className="py-3.5 px-3.5 text-stone-500 text-[11px]">
                        {formatWitaDate(item.disbursed_at)}
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-neutral-900">{item.partner_name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{item.partner_code}</div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="font-medium text-stone-800">{item.bank_name} • {item.account_number}</div>
                        <div className="text-[10px] text-stone-400 truncate max-w-[150px]">{item.account_holder}</div>
                      </td>

                      <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800">
                        {formatIDR(item.amount)}
                      </td>

                      <td className="py-3.5 px-3.5 font-mono">
                        {item.bank_reference ? (
                          <span className="text-blue-800 font-bold">{item.bank_reference}</span>
                        ) : (
                          <span className="text-amber-700 italic text-[11px]">Pending Bank Ref</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5">
                        {isRec ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} /> Reconciled
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle size={11} /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            <Clock size={11} /> Awaiting Match
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isRec && !isFailed && (
                            <button
                              type="button"
                              onClick={() => handleOpenReconcile(item)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <FileCheck size={12} />
                              <span>Reconcile</span>
                            </button>
                          )}

                          {isRec && (
                            <button
                              type="button"
                              onClick={() => handleOpenReconcile(item)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                            >
                              Edit Ref
                            </button>
                          )}

                          {isFailed && (
                            <button
                              type="button"
                              onClick={() => onRetryItem(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw size={11} />
                              <span>Retry</span>
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

      {/* Reconcile Item Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-700" />
                <h3 className="text-base font-bold text-neutral-900">Log Bank Transfer Reference</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Partner:</span>
                  <span className="font-bold text-neutral-900">{editingItem.partner_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Bank Destination:</span>
                  <span className="font-mono text-neutral-900">{editingItem.bank_name} • {editingItem.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Disbursed Amount:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatIDR(editingItem.amount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Bank Transfer Reference / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  value={bankRefInput}
                  onChange={e => setBankRefInput(e.target.value)}
                  placeholder="e.g. BCA-TRX-884912"
                  className="w-full text-xs font-bold font-mono bg-white border border-stone-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Confirms the actual transfer from corporate banking statement to reconcile ledger.
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onMarkFailed(editingItem.id, 'Bank transfer rejected by receiving bank');
                  setEditingItem(null);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Mark as Failed
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !bankRefInput.trim()}
                  onClick={handleConfirmReconciliation}
                  className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Confirm & Reconcile</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
