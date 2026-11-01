'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Check, 
  X, 
  AlertCircle, 
  ChevronRight, 
  ExternalLink,
  RotateCw,
  Wallet
} from 'lucide-react';
import { PayoutRun, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate, formatWitaDateTime } from '@/lib/payoutScheduler';

interface PayoutsRunsTabProps {
  payoutRuns: PayoutRun[];
  config: PayoutWeeklyScheduleConfig;
  onOpenCreateBatch: () => void;
  onApproveBatch: (runId: string) => Promise<void>;
  onExecuteBatch: (runId: string, bankRef: string) => Promise<void>;
  onRejectBatch: (runId: string) => Promise<void>;
}

export default function PayoutsRunsTab({
  payoutRuns,
  config,
  onOpenCreateBatch,
  onApproveBatch,
  onExecuteBatch,
  onRejectBatch,
}: PayoutsRunsTabProps) {
  const [selectedRun, setSelectedRun] = useState<PayoutRun | null>(null);
  const [executingRun, setExecutingRun] = useState<PayoutRun | null>(null);
  const [bankRefInput, setBankRefInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenExecute = (run: PayoutRun) => {
    setExecutingRun(run);
    setBankRefInput(`BCA-BATCH-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmExecution = async () => {
    if (!executingRun) return;
    setIsSubmitting(true);
    try {
      await onExecuteBatch(executingRun.id, bankRefInput.trim());
      setExecutingRun(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
            Weekly Payout Runs & Batches
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Strict 7-day cyclical settlement batches. Review, approve, and log corporate bank transfers.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateBatch}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Prepare Weekly Batch</span>
        </button>
      </div>

      {/* Payout Runs Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-stone-500" />
            <h3 className="text-sm font-bold text-neutral-900">Historical & Active Batches</h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            Cycle: Fixed 7 Calendar Days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-3.5">Run Reference</th>
                <th className="py-3 px-3.5">Scheduled Date</th>
                <th className="py-3 px-3.5">Partners</th>
                <th className="py-3 px-3.5">Total Amount</th>
                <th className="py-3 px-3.5">Method</th>
                <th className="py-3 px-3.5">Approval Status</th>
                <th className="py-3 px-3.5">Execution Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {payoutRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No weekly payout runs on record yet. Click "Prepare Weekly Batch" to create the first batch.
                  </td>
                </tr>
              ) : (
                payoutRuns.map(run => {
                  const isApproved = run.status === 'approved';
                  const isPendingApproval = run.status === 'pending_approval';
                  const isCompleted = run.status === 'completed';

                  return (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3.5 font-mono font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                        {run.run_reference}
                      </td>

                      <td className="py-3.5 px-3.5 text-stone-600">
                        {formatWitaDate(run.scheduled_date)}
                      </td>

                      <td className="py-3.5 px-3.5 font-bold text-neutral-900">
                        {run.partner_count} partners
                      </td>

                      <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800">
                        {formatIDR(run.total_amount)}
                      </td>

                      <td className="py-3.5 px-3.5 text-stone-600">
                        Bank Transfer
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved || isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isPendingApproval
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{run.status.replace('_', ' ').toUpperCase()}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 font-mono text-stone-600 text-[11px]">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 size={12} /> Settled
                          </span>
                        ) : run.bank_batch_reference ? (
                          <span className="text-blue-700 font-medium">Ref: {run.bank_batch_reference}</span>
                        ) : (
                          <span className="text-stone-400">Awaiting Transfer</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPendingApproval && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveBatch(run.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onRejectBatch(run.id)}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handleOpenExecute(run)}
                              className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Wallet size={12} />
                              <span>Execute Transfer</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRun(run)}
                            className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
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

      {/* Batch Details Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 text-white">
                  {selectedRun.run_reference}
                </span>
                <h3 className="text-base font-bold text-neutral-900">Batch Inspection</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedRun(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Total Amount</span>
                  <span className="font-bold text-neutral-900 font-mono text-sm">{formatIDR(selectedRun.total_amount)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Partners</span>
                  <span className="font-bold text-neutral-900 text-sm">{selectedRun.partner_count} Recipients</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Scheduled Date</span>
                  <span className="font-bold text-neutral-900 text-sm">{formatWitaDate(selectedRun.scheduled_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-400 block font-bold">Cycle</span>
                  <span className="font-bold text-neutral-900 text-sm">Weekly (7 Days)</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-900 mb-2">Itemized Partner Disbursals</h4>
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-60 overflow-y-auto">
                  {selectedRun.items?.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-neutral-900">{idx + 1}. {item.partner_name}</div>
                        <div className="text-[11px] text-stone-500">
                          {item.bank_name} • {item.account_number} ({item.account_holder})
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-neutral-900">
                        {formatIDR(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Bank Transfers Dialog */}
      {executingRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-emerald-700" />
                <h3 className="text-base font-bold text-neutral-900">Execute Batch Transfers</h3>
              </div>
              <button 
                type="button"
                onClick={() => setExecutingRun(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Batch:</span>
                  <span className="font-mono font-bold text-neutral-900">{executingRun.run_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Disbursement:</span>
                  <span className="font-mono font-bold text-emerald-800">{formatIDR(executingRun.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Recipients:</span>
                  <span className="font-bold text-neutral-900">{executingRun.partner_count} Partners</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Bank Transfer Reference / Batch Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  value={bankRefInput}
                  onChange={e => setBankRefInput(e.target.value)}
                  placeholder="e.g. BCA-BATCH-994102"
                  className="w-full text-xs font-bold font-mono bg-white border border-stone-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Logs this corporate transfer reference on all partner payout receipts.
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setExecutingRun(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !bankRefInput.trim()}
                onClick={handleConfirmExecution}
                className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm & Mark Completed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
