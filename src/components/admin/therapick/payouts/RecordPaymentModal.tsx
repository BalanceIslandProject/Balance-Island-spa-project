'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Wallet, 
  Calendar, 
  Building2, 
  User, 
  CreditCard, 
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { PartnerPayoutRow, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR } from '@/lib/payoutScheduler';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerPayoutRow | null;
  config: PayoutWeeklyScheduleConfig;
  onRecordPayment: (paymentData: {
    partner_id: string;
    amount: number;
    payment_date: string;
    method: string;
    reference: string;
    notes: string;
    receipt_url?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  partner,
  config,
  onRecordPayment
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '2026-11-05';
    }
  });
  const [method, setMethod] = useState<string>('Bank Transfer (BCA)');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever partner changes or modal opens
  useEffect(() => {
    if (partner) {
      const defaultAmt = partner.unpaid > 0 ? partner.unpaid : 0;
      setAmount(defaultAmt);
      setAmountInput(defaultAmt > 0 ? defaultAmt.toLocaleString('id-ID') : '');
      setReference(`TRX${Date.now().toString().slice(-6)}`);
      setNotes(`Weekly Payout settlement for ${partner.name}`);
      setErrorMessage(null);
    }
  }, [partner, isOpen]);

  if (!isOpen || !partner) return null;

  const maxBalance = Math.max(0, partner.unpaid);

  // Handle Amount Input Change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = Number(rawVal) || 0;
    setAmount(numVal);
    setAmountInput(numVal > 0 ? numVal.toLocaleString('id-ID') : '');
    if (numVal > maxBalance) {
      setErrorMessage(`Payment amount cannot exceed available unpaid balance (${formatIDR(maxBalance)})`);
    } else {
      setErrorMessage(null);
    }
  };

  // Max Button Click
  const handleMaxClick = () => {
    setAmount(maxBalance);
    setAmountInput(maxBalance > 0 ? maxBalance.toLocaleString('id-ID') : '');
    setErrorMessage(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than Rp 0.');
      return;
    }
    if (amount > maxBalance) {
      setErrorMessage(`Payment amount cannot exceed available unpaid balance (${formatIDR(maxBalance)})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await onRecordPayment({
        partner_id: partner.id,
        amount,
        payment_date: paymentDate,
        method,
        reference: reference || `TRX${Date.now().toString().slice(-6)}`,
        notes,
        receipt_url: receiptUrl
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record payment');
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error recording payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/60">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">Record Payment</h3>
            <p className="text-xs text-stone-500">Record a completed manual bank transfer or cash disbursement.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto">
          
          {/* Partner Banner Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                <User size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-neutral-900 text-sm leading-tight">{partner.name}</h4>
                <p className="text-xs text-stone-500 mt-0.5">{partner.business_name || 'Affiliate Partner'}</p>
                {partner.account_number && (
                  <p className="text-[11px] font-mono text-stone-600 mt-0.5">
                    {partner.bank_name || 'BCA'} · {partner.account_number}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 bg-white/90 border border-amber-200 rounded-xl px-3 py-2 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Unpaid Balance</div>
              <div className="text-sm font-extrabold font-mono text-emerald-700 mt-0.5">
                {formatIDR(partner.unpaid)}
              </div>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Field 1: Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Payment Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 font-mono">
                Rp
              </span>
              <input
                type="text"
                required
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full text-sm font-bold font-mono bg-stone-50/70 border border-stone-200 rounded-xl pl-10 pr-16 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Max
              </button>
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">
              Available to disburse: <strong className="text-neutral-700">{formatIDR(maxBalance)}</strong>. Partial payments supported.
            </span>
          </div>

          {/* Field 2 & 3: Payment Date and Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full text-xs font-semibold bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="Bank Transfer (BCA)">Bank Transfer (BCA)</option>
                <option value="Bank Transfer (Mandiri)">Bank Transfer (Mandiri)</option>
                <option value="Bank Transfer (BNI)">Bank Transfer (BNI)</option>
                <option value="Other Bank">Other Bank</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Field 4: Transaction Reference */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Transaction Reference
            </label>
            <input
              type="text"
              placeholder="e.g. TRX123456"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full text-xs font-medium font-mono bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Field 5: Note (Optional) */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Payout Nov 2026"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Field 6: Payment Receipt (Optional) */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Payment Receipt / Transfer Proof (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste transfer receipt URL or filename"
                value={receiptUrl}
                onChange={e => setReceiptUrl(e.target.value)}
                className="flex-1 text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-2xs"
              />
              <label className="px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload size={14} className="text-stone-500" />
                <span className="hidden sm:inline">Attach</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                      setReceiptUrl(e.target.files[0].name);
                    }
                  }}
                />
              </label>
            </div>
            {receiptFile && (
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                Attached: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0 || amount > maxBalance}
              className="px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} className="text-neutral-950" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
