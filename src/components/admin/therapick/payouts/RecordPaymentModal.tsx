'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  AlertCircle,
  Paperclip,
  Check,
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';
import { PartnerPayoutRow, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR } from '@/lib/payoutScheduler';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerPayoutRow | null;
  config: PayoutWeeklyScheduleConfig;
  commissions?: any[];
  bookings?: any[];
  onRecordPayment: (paymentData: {
    partner_id: string;
    amount: number;
    payment_date: string;
    method: string;
    reference: string;
    notes: string;
    receipt_url?: string;
    commission_ids?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  partner,
  commissions: propCommissions,
  bookings: propBookings,
  onRecordPayment
}: RecordPaymentModalProps) {
  // Access admin context as reliable fallback if props not directly passed
  const adminContext = useTherapickAdmin();
  const rawComms = propCommissions || adminContext?.commissions || [];
  const rawBookings = propBookings || adminContext?.bookings || [];

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  // Compute eligible commissions for this partner with booking date and treatment details
  const eligibleComms = useMemo(() => {
    if (!partner) return [];

    const pComms = rawComms.filter((c: any) => {
      const matchId = c.partner_id && partner.id && String(c.partner_id).toLowerCase() === String(partner.id).toLowerCase();
      const matchCode = (c.partner_code && partner.partner_code && c.partner_code.toUpperCase() === partner.partner_code.toUpperCase()) ||
                        (c.partner_code && partner.referral_code && c.partner_code.toUpperCase() === partner.referral_code.toUpperCase());
      const matchName = c.partner_name && partner.name && c.partner_name.toLowerCase() === partner.name.toLowerCase();

      const bKey = String(c.booking_id || '').toUpperCase().replace(/^#/, '');
      const b = rawBookings.find((bk: any) => {
        const bkRef = String(bk.reference_number || bk.id || '').toUpperCase().replace(/^#/, '');
        return bkRef === bKey || bk.id === c.booking_id;
      });

      const matchBookingAffiliate = b && (
        (b.affiliate_id && partner.id && String(b.affiliate_id).toLowerCase() === String(partner.id).toLowerCase()) ||
        (b.affiliate_code && partner.partner_code && String(b.affiliate_code).toUpperCase() === String(partner.partner_code).toUpperCase()) ||
        (b.affiliate_code && partner.referral_code && String(b.affiliate_code).toUpperCase() === String(partner.referral_code).toUpperCase())
      );

      const belongsToPartner = matchId || matchCode || matchName || matchBookingAffiliate;
      if (!belongsToPartner) return false;

      const status = String(c.status || '').toLowerCase();
      if (status === 'paid' || status === 'cancelled' || c.payout_id || c.is_settled) return false;

      // ELIGIBILITY RULE:
      // 1. Commission is explicitly marked 'approved', OR
      // 2. The linked booking is Finished/Completed and Paid
      const isBookingDoneAndPaid = b &&
        (b.treatment_status === 'Finished' || String(b.status || '').toLowerCase() === 'completed') &&
        (String(b.payment_status || '').toLowerCase() === 'paid' || String(b.payment_status || '').toLowerCase().includes('paid'));

      return status === 'approved' || isBookingDoneAndPaid;
    });

    return pComms.map((c: any) => {
      const bKey = String(c.booking_id || '').toUpperCase().replace(/^#/, '');
      const b = rawBookings.find((bk: any) => {
        const bkRef = String(bk.reference_number || bk.id || '').toUpperCase().replace(/^#/, '');
        return bkRef === bKey || bk.id === c.booking_id;
      });

      const bookingDate = b?.booking_date || c.booking_date || (c.created_at ? c.created_at.split('T')[0] : '');
      const treatmentName = b?.treatment_name || b?.service_name || c.treatment_name || 'Balinese Traditional Massage';
      const guestName = b?.guest_name || b?.customer_name || c.guest_name || 'Guest';
      const commissionAmount = Number(c.commission_amount || 0);

      return {
        id: c.id,
        booking_id: c.booking_id || 'BK-DIRECT',
        booking_date: bookingDate,
        treatment_name: treatmentName,
        guest_name: guestName,
        commission_amount: commissionAmount,
        status: 'approved'
      };
    });
  }, [partner, rawComms, rawBookings]);

  // Sync state whenever partner changes or modal opens
  useEffect(() => {
    if (partner && isOpen) {
      // By default, select all eligible bookings
      if (eligibleComms.length > 0) {
        const allIds = eligibleComms.map(c => c.id);
        setSelectedIds(allIds);
        const sum = eligibleComms.reduce((acc, c) => acc + c.commission_amount, 0);
        setAmount(sum);
        setAmountInput(sum > 0 ? sum.toLocaleString('id-ID') : '');
      } else {
        setSelectedIds([]);
        const defaultAmt = partner.unpaid > 0 ? partner.unpaid : 0;
        setAmount(defaultAmt);
        setAmountInput(defaultAmt > 0 ? defaultAmt.toLocaleString('id-ID') : '');
      }

      const codePart = (partner.partner_code || partner.referral_code || 'REF').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      setReference(`TRX${codePart}${Date.now().toString().slice(-4)}`);
      setNotes('');
      setReceiptFile(null);
      setReceiptUrl('');
      setErrorMessage(null);
    }
  }, [partner, isOpen, eligibleComms]);

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

  const eligibleTotal = eligibleComms.reduce((sum, c) => sum + c.commission_amount, 0);
  const maxBalance = eligibleComms.length > 0 ? eligibleTotal : Math.max(0, partner.unpaid);

  // Toggle booking selection
  const handleToggleBooking = (commId: string) => {
    let nextIds: string[];
    if (selectedIds.includes(commId)) {
      nextIds = selectedIds.filter(id => id !== commId);
    } else {
      nextIds = [...selectedIds, commId];
    }
    setSelectedIds(nextIds);

    // Recalculate amount based on selected bookings
    const newSum = eligibleComms
      .filter(c => nextIds.includes(c.id))
      .reduce((acc, c) => acc + c.commission_amount, 0);

    setAmount(newSum);
    setAmountInput(newSum > 0 ? newSum.toLocaleString('id-ID') : '');
    setErrorMessage(null);
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    if (selectedIds.length === eligibleComms.length) {
      setSelectedIds([]);
      setAmount(0);
      setAmountInput('');
    } else {
      const allIds = eligibleComms.map(c => c.id);
      setSelectedIds(allIds);
      const total = eligibleComms.reduce((acc, c) => acc + c.commission_amount, 0);
      setAmount(total);
      setAmountInput(total > 0 ? total.toLocaleString('id-ID') : '');
    }
    setErrorMessage(null);
  };

  // Handle Manual Amount Input Change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = Number(rawVal) || 0;
    setAmount(numVal);
    setAmountInput(numVal > 0 ? numVal.toLocaleString('id-ID') : '');
    if (numVal > maxBalance) {
      setErrorMessage(`Amount exceeds available balance (${formatIDR(maxBalance)})`);
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

  // Format date helper
  const formatBookingDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = clean.split('-').map(Number);
      if (y && m && d) {
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eligibleComms.length === 0) {
      setErrorMessage('No approved or completed bookings are eligible for payout.');
      return;
    }
    if (selectedIds.length === 0) {
      setErrorMessage('Select at least one booking to settle.');
      return;
    }
    if (amount <= 0) {
      setErrorMessage('Enter an amount greater than Rp 0.');
      return;
    }
    if (amount > maxBalance) {
      setErrorMessage(`Amount exceeds available balance (${formatIDR(maxBalance)})`);
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
        receipt_url: receiptUrl.trim(),
        commission_ids: selectedIds
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={() => !isSubmitting && onClose()} 
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 font-bold block leading-none mb-1">
              PAYOUT SETTLEMENT
            </span>
            <h3 className="text-base font-extrabold text-neutral-900 tracking-tight leading-tight">
              Record Payment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl border border-stone-200/80 hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          
          {/* Partner & Unpaid Balance Banner Card */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-neutral-900 truncate leading-tight">
                {partner.name}
              </h4>
              <p className="font-mono text-[11px] text-stone-600 mt-0.5 truncate">
                {partner.bank_name || 'BCA'} {partner.account_number ? `· ${partner.account_number}` : ''}
                {partner.business_name ? ` (${partner.business_name})` : ''}
              </p>
            </div>

            <div className="text-right shrink-0 bg-white/90 border border-amber-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block leading-none">
                UNPAID
              </span>
              <span className="font-mono text-sm font-extrabold text-emerald-700 tabular-nums mt-0.5 block leading-tight">
                {formatIDR(partner.unpaid)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Section: Select Bookings & Treatments (User Requirement) */}
          {eligibleComms.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <span>Select Bookings to Settle</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-stone-100 border border-stone-200 text-stone-600 text-[10px] font-mono">
                    {selectedIds.length}/{eligibleComms.length}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                >
                  {selectedIds.length === eligibleComms.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Scrollable Bookings List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-stone-200/90 rounded-xl p-2 bg-stone-50/50">
                {eligibleComms.map((comm) => {
                  const isChecked = selectedIds.includes(comm.id);
                  return (
                    <div
                      key={comm.id}
                      onClick={() => handleToggleBooking(comm.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked 
                          ? 'bg-white border-amber-300 shadow-2xs' 
                          : 'bg-white/60 border-stone-200/70 hover:bg-white text-stone-500 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox Icon */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isChecked 
                            ? 'bg-amber-400 text-neutral-950 font-bold' 
                            : 'border border-stone-300 bg-white'
                        }`}>
                          {isChecked ? <Check size={13} strokeWidth={3} /> : null}
                        </div>

                        {/* Booking Details: Treatment Name, Date, Booking ID */}
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-neutral-900 truncate">
                            {comm.treatment_name}
                          </div>
                          <div className="font-mono text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                            <span className="text-stone-700 font-medium">
                              {formatBookingDate(comm.booking_date)}
                            </span>
                            {comm.booking_id && comm.booking_id !== 'BK-DIRECT' && (
                              <>
                                <span className="text-stone-300">·</span>
                                <span className="text-stone-500">#{comm.booking_id.replace(/^#/, '')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Commission Amount */}
                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-xs text-emerald-700 tabular-nums">
                          +{formatIDR(comm.commission_amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Clock size={13} className="text-amber-700" />
                <span>No Approved Commissions Eligible for Payout</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Commissions only become eligible for payout once the treatment is completed and approved by admin. Bookings with pending or cancelled treatments cannot be processed.
              </p>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-900">
                Payment Amount <span className="text-rose-500">*</span>
              </label>
              <span className="font-mono text-[11px] text-stone-500">
                Available: <strong className="text-neutral-900">{formatIDR(maxBalance)}</strong>
              </span>
            </div>

            <div className="relative flex items-center h-10 px-3 bg-stone-50/70 border border-stone-200 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-400 transition-all shadow-2xs">
              <span className="font-mono text-xs font-bold text-stone-400 mr-2 select-none">
                Rp
              </span>
              <input
                type="text"
                required
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full bg-transparent text-sm font-bold font-mono text-neutral-900 outline-none tabular-nums"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="h-6 px-2.5 text-[10px] font-mono uppercase font-bold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer shrink-0 ml-2"
              >
                Max
              </button>
            </div>
          </div>

          {/* Date & Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="h-10 w-full text-xs font-semibold bg-stone-50/70 border border-stone-200 rounded-xl px-3 text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-2xs cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="h-10 w-full text-xs font-semibold bg-stone-50/70 border border-stone-200 rounded-xl px-3 pr-8 text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="Bank Transfer (BCA)">Bank Transfer (BCA)</option>
                  <option value="Bank Transfer (Mandiri)">Bank Transfer (Mandiri)</option>
                  <option value="Bank Transfer (BNI)">Bank Transfer (BNI)</option>
                  <option value="Bank Transfer (BRI)">Bank Transfer (BRI)</option>
                  <option value="Other Bank">Other Bank</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Reference & Note Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1">
                Transaction Reference
              </label>
              <input
                type="text"
                placeholder="e.g. TRX123456"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="h-10 w-full text-xs font-mono font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 text-neutral-900 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1">
                Note <span className="text-stone-400 font-normal text-[11px]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly settlement"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-10 w-full text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 text-neutral-900 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Receipt / Transfer Proof */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Payment Receipt / Transfer Proof <span className="text-stone-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste receipt URL or filename"
                value={receiptUrl}
                onChange={e => setReceiptUrl(e.target.value)}
                className="flex-1 h-10 text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 text-neutral-900 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-2xs"
              />
              <label className="h-10 px-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs transition-colors">
                <Paperclip size={14} className="text-stone-500" />
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
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 font-semibold mt-1.5 px-1">
                <span className="truncate">
                  Attached: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptUrl('');
                  }}
                  className="text-stone-400 hover:text-rose-600 ml-2 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
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
              disabled={isSubmitting || eligibleComms.length === 0 || selectedIds.length === 0 || amount <= 0 || amount > maxBalance}
              className="px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-neutral-950" />
                  <span>Recording...</span>
                </>
              ) : eligibleComms.length === 0 ? (
                <span>No Eligible Bookings to Pay</span>
              ) : (
                <>
                  <Check size={15} strokeWidth={2.5} className="text-neutral-950" />
                  <span>
                    Record Payment ({selectedIds.length} Booking{selectedIds.length > 1 ? 's' : ''})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
