'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Layers, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Wallet,
  ArrowRight,
  CheckCircle2,
  Ban
} from 'lucide-react';
import { PayoutRun, PayoutRunItem, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate, getUpcomingWeeklyCycles } from '@/lib/payoutScheduler';

interface PayoutBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: any[];
  config: PayoutWeeklyScheduleConfig;
  onCreateBatch: (batch: PayoutRun) => void;
}

export default function PayoutBatchModal({
  isOpen,
  onClose,
  partners,
  config,
  onCreateBatch
}: PayoutBatchModalProps) {
  const minThreshold = config.min_payout_threshold || 100000;
  
  // Find all partners with balance >= threshold
  const eligiblePartners = partners.filter(p => (Number(p.available_balance) || 0) >= minThreshold);
  const rolloverPartners = partners.filter(p => (Number(p.available_balance) || 0) > 0 && (Number(p.available_balance) || 0) < minThreshold);

  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>(() => eligiblePartners.map(p => p.id));
  const [scheduledDate, setScheduledDate] = useState<string>(config.next_scheduled_date || '2026-11-05');
  const [notes, setNotes] = useState<string>('Standard 7-Day Weekly Settlement');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  if (!isOpen) return null;

  const upcoming = getUpcomingWeeklyCycles(config, 1);
  const batchRef = upcoming[0]?.reference || 'PR-2026-W45';

  const selectedPartners = eligiblePartners.filter(p => selectedPartnerIds.includes(p.id));
  const totalAmount = selectedPartners.reduce((sum, p) => sum + Number(p.available_balance || 0), 0);

  const toggleSelectAll = () => {
    if (selectedPartnerIds.length === eligiblePartners.length) {
      setSelectedPartnerIds([]);
    } else {
      setSelectedPartnerIds(eligiblePartners.map(p => p.id));
    }
  };

  const togglePartner = (id: string) => {
    if (selectedPartnerIds.includes(id)) {
      setSelectedPartnerIds(prev => prev.filter(pId => pId !== id));
    } else {
      setSelectedPartnerIds(prev => [...prev, id]);
    }
  };

  const handleCreate = () => {
    if (selectedPartners.length === 0 || totalAmount <= 0) {
      alert('Please select at least one partner with an available balance.');
      return;
    }

    const items: PayoutRunItem[] = selectedPartners.map(p => ({
      id: `ITEM-${p.id.slice(0, 8)}-${Date.now().toString().slice(-4)}`,
      partner_id: p.id,
      partner_name: p.name,
      partner_code: p.partner_code || p.referral_code || 'PARTNER',
      business_name: p.business_name,
      bank_name: p.payout_details?.bank_name || p.bank_name || 'BCA',
      account_number: p.payout_details?.account_number || p.bank_number || '7720-1928-4491',
      account_holder: p.payout_details?.account_holder || p.bank_holder || p.name,
      amount: Number(p.available_balance || 0),
      commission_ids: [],
      booking_count: p.total_bookings || 1,
      status: 'pending',
    }));

    const newBatch: PayoutRun = {
      id: `BATCH-${Date.now().toString().slice(-6)}`,
      run_reference: batchRef,
      created_at: new Date().toISOString(),
      scheduled_date: scheduledDate,
      cycle_interval: '7_days',
      total_amount: totalAmount,
      partner_count: selectedPartners.length,
      payment_method: 'bank_transfer',
      status: config.manual_approval_required ? 'pending_approval' : 'approved',
      notes,
      items,
    };

    onCreateBatch(newBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">Prepare Weekly Payout Batch</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {batchRef}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Weekly 7-Day Cycle · Target Run: {formatWitaDate(scheduledDate)}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {step === 'select' ? (
            <>
              {/* Batch Configuration Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-stone-500 mb-1">
                    Scheduled Execution Date (7-Day Cycle)
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-stone-500 mb-1">
                    Batch Memo / Settlement Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Selection Summary Header */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedPartnerIds.length === eligiblePartners.length && eligiblePartners.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400 cursor-pointer"
                  />
                  <label htmlFor="select-all" className="text-xs font-bold text-neutral-900 cursor-pointer">
                    Eligible Partners ({selectedPartners.length}/{eligiblePartners.length} selected)
                  </label>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 mr-2">Batch Total:</span>
                  <span className="text-sm font-bold font-mono text-emerald-800">
                    {formatIDR(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Eligible Partners List */}
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-60 overflow-y-auto">
                {eligiblePartners.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    No partners currently meet the minimum threshold of {formatIDR(minThreshold)}.
                  </div>
                ) : (
                  eligiblePartners.map(p => {
                    const isChecked = selectedPartnerIds.includes(p.id);
                    const bal = Number(p.available_balance || 0);

                    return (
                      <div 
                        key={p.id}
                        onClick={() => togglePartner(p.id)}
                        className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isChecked ? 'bg-amber-50/40' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePartner(p.id)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded text-neutral-900 focus:ring-amber-400 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-neutral-900">{p.name}</div>
                            <div className="text-[11px] text-stone-500">
                              {p.business_name || 'Individual'} · {p.payout_details?.bank_name || 'BCA'} {p.payout_details?.account_number || ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono font-bold text-neutral-900">
                          {formatIDR(bal)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rollover Balances Notice */}
              {rolloverPartners.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                  <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>{rolloverPartners.length} partner(s) below threshold (&lt; {formatIDR(minThreshold)}):</strong>{' '}
                    Their balances roll over automatically to the subsequent 7-day cycle without forfeiture.
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Step 2: Confirmation & Approval Details */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>Batch Reference: <strong>{batchRef}</strong></span>
                  <span>Execution Date: <strong>{formatWitaDate(scheduledDate)}</strong></span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-stone-400 block font-mono uppercase">Total Disbursement</span>
                    <span className="text-2xl font-extrabold font-mono text-[#facc15]">{formatIDR(totalAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-400 block font-mono uppercase">Included Partners</span>
                    <span className="text-lg font-bold">{selectedPartners.length} Recipients</span>
                  </div>
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-56 overflow-y-auto text-xs">
                {selectedPartners.map((p, idx) => (
                  <div key={p.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-neutral-900">{idx + 1}. {p.name}</span>
                      <div className="text-[11px] text-stone-500">
                        {p.payout_details?.bank_name || 'BCA'} • {p.payout_details?.account_number || '7720-1928-4491'} ({p.payout_details?.account_holder || p.name})
                      </div>
                    </div>
                    <span className="font-mono font-bold text-neutral-900">{formatIDR(p.available_balance)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2 text-xs text-blue-900">
                <ShieldCheck size={16} className="text-blue-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Corporate Banking Protocol:</strong> Submitting this batch schedules the weekly run. Transfers are executed manually or via corporate banking upload, and transfer reference numbers are logged during execution.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
          {step === 'confirm' ? (
            <button
              type="button"
              onClick={() => setStep('select')}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Back to Selection
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step === 'select' ? (
            <button
              type="button"
              disabled={selectedPartners.length === 0 || totalAmount <= 0}
              onClick={() => setStep('confirm')}
              className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <span>Review Batch Summary</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Check size={14} />
              <span>Submit & Create Batch</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
