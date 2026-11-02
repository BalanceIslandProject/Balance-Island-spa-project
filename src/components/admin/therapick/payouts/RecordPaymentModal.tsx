'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  AlertCircle,
  Paperclip,
  Check,
  ChevronDown,
  Loader2
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
  onRecordPayment
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '2026-11-02';
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
    if (partner && isOpen) {
      const defaultAmt = partner.unpaid > 0 ? partner.unpaid : 0;
      setAmount(defaultAmt);
      setAmountInput(defaultAmt > 0 ? defaultAmt.toLocaleString('id-ID') : '');
      const codePart = (partner.partner_code || partner.referral_code || 'REF').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      setReference(`TRX${codePart}${Date.now().toString().slice(-4)}`);
      setNotes('');
      setReceiptFile(null);
      setReceiptUrl('');
      setErrorMessage(null);
    }
  }, [partner, isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !partner) return null;

  const maxBalance = Math.max(0, partner.unpaid);

  // Handle Amount Input Change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = Number(rawVal) || 0;
    setAmount(numVal);
    setAmountInput(numVal > 0 ? numVal.toLocaleString('id-ID') : '');
    if (numVal > maxBalance) {
      setErrorMessage(`Amount exceeds unpaid balance (${formatIDR(maxBalance)})`);
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
      setErrorMessage('Enter an amount greater than Rp 0.');
      return;
    }
    if (amount > maxBalance) {
      setErrorMessage(`Amount exceeds unpaid balance (${formatIDR(maxBalance)})`);
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
        reference: reference.trim() || `TRX${Date.now().toString().slice(-6)}`,
        notes: notes.trim(),
        receipt_url: receiptUrl.trim()
      });

      if (!res.success) {
        throw new Error(res.error || 'Payment recording failed.');
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={() => !isSubmitting && onClose()} 
      />

      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-[8px] border border-[#ebebeb] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#ebebeb] flex items-center justify-between bg-white">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block leading-none mb-1">
              Disbursement
            </span>
            <h3 className="text-sm sm:text-base font-semibold tracking-[-0.03em] text-[#171717] leading-tight">
              Record Payment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-[6px] border border-transparent hover:border-[#ebebeb] hover:bg-[#fafafa] flex items-center justify-center text-[#666666] hover:text-[#171717] transition-all cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          
          {/* Partner & Balance Summary Card */}
          <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-[6px] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm text-[#171717] truncate leading-tight">
                {partner.name}
              </h4>
              <p className="font-mono text-[11px] text-[#666666] mt-0.5 truncate">
                {partner.bank_name || 'BCA'} {partner.account_number ? `· ${partner.account_number}` : ''}
                {partner.business_name ? ` (${partner.business_name})` : ''}
              </p>
            </div>

            <div className="text-right shrink-0 pl-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block leading-none">
                Unpaid
              </span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-[#297a3a] tabular-nums mt-0.5 block leading-tight">
                {formatIDR(partner.unpaid)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 text-red-600 mt-0.5" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#171717]">
                Amount <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-[11px] text-[#666666]">
                Balance: <strong className="text-[#171717] font-semibold">{formatIDR(maxBalance)}</strong>
              </span>
            </div>

            <div className="relative flex items-center h-10 px-3 bg-[#fafafa] border border-[#ebebeb] rounded-[6px] focus-within:bg-white focus-within:border-[#171717] transition-all">
              <span className="font-mono text-xs font-semibold text-[#666666] mr-2 select-none">
                Rp
              </span>
              <input
                type="text"
                required
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full bg-transparent text-sm font-semibold font-mono text-[#171717] outline-none placeholder:text-[#a8a8a8] tabular-nums"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="h-6 px-2 text-[10px] font-mono uppercase font-semibold rounded-[4px] bg-white border border-[#ebebeb] text-[#171717] hover:border-[#171717] hover:bg-[#171717] hover:text-white transition-all cursor-pointer shrink-0 ml-2"
              >
                Max
              </button>
            </div>
          </div>

          {/* Date & Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="h-9 sm:h-10 w-full text-xs font-mono bg-[#fafafa] border border-[#ebebeb] rounded-[6px] px-3 text-[#171717] focus:bg-white focus:border-[#171717] outline-none transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1">
                Method <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="h-9 sm:h-10 w-full text-xs bg-[#fafafa] border border-[#ebebeb] rounded-[6px] px-3 pr-8 text-[#171717] focus:bg-white focus:border-[#171717] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Bank Transfer (BCA)">Bank Transfer (BCA)</option>
                  <option value="Bank Transfer (Mandiri)">Bank Transfer (Mandiri)</option>
                  <option value="Bank Transfer (BNI)">Bank Transfer (BNI)</option>
                  <option value="Bank Transfer (BRI)">Bank Transfer (BRI)</option>
                  <option value="Other Bank">Other Bank</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Reference & Note Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1">
                Reference
              </label>
              <input
                type="text"
                placeholder="e.g. TRX123456"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="h-9 sm:h-10 w-full text-xs font-mono bg-[#fafafa] border border-[#ebebeb] rounded-[6px] px-3 text-[#171717] placeholder:text-[#a8a8a8] focus:bg-white focus:border-[#171717] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1">
                Note <span className="text-[#a8a8a8] font-normal text-[11px]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly settlement"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-9 sm:h-10 w-full text-xs bg-[#fafafa] border border-[#ebebeb] rounded-[6px] px-3 text-[#171717] placeholder:text-[#a8a8a8] focus:bg-white focus:border-[#171717] outline-none transition-all"
              />
            </div>
          </div>

          {/* Receipt / Transfer Proof */}
          <div>
            <label className="block text-xs font-medium text-[#171717] mb-1">
              Receipt / Proof <span className="text-[#a8a8a8] font-normal text-[11px]">(Optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste receipt URL or filename"
                value={receiptUrl}
                onChange={e => setReceiptUrl(e.target.value)}
                className="flex-1 h-9 sm:h-10 text-xs bg-[#fafafa] border border-[#ebebeb] rounded-[6px] px-3 text-[#171717] placeholder:text-[#a8a8a8] focus:bg-white focus:border-[#171717] outline-none transition-all"
              />
              <label className="h-9 sm:h-10 px-3 rounded-[6px] border border-[#ebebeb] bg-white hover:border-[#171717] hover:bg-[#fafafa] text-xs font-medium text-[#171717] flex items-center gap-1.5 cursor-pointer shrink-0 transition-all">
                <Paperclip size={13} className="text-[#666666]" />
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
              <div className="flex items-center justify-between text-[11px] font-mono text-[#297a3a] mt-1.5 px-1">
                <span className="truncate">
                  Attached: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptUrl('');
                  }}
                  className="text-[#666666] hover:text-red-600 ml-2"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#ebebeb] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-[6px] border border-[#ebebeb] bg-white hover:border-[#171717] hover:text-[#171717] text-xs font-medium text-[#4d4d4d] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0 || amount > maxBalance}
              className="h-9 px-4 rounded-[6px] bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
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
