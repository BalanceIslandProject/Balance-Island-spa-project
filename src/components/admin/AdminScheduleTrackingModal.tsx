'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  ExternalLink, 
  Clock, 
  MapPin, 
  Check, 
  CheckCircle2, 
  Copy,
  AlertCircle,
  CreditCard,
  Sparkles,
  Phone,
  RefreshCw,
  User,
  CheckCheck
} from 'lucide-react';
import { Booking } from '../TherapickBookingManagement';

interface AdminScheduleTrackingModalProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateBookingStatus: (id: string, status: string) => Promise<void>;
  onUpdateTreatmentStatus: (id: string, status: string) => Promise<void>;
  onUpdatePaymentStatus: (id: string, status: string, method?: string) => Promise<void>;
}

const safeFormatDate = (rawDate: string | undefined | null) => {
  if (!rawDate) return '';
  try {
    const cleanStr = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return String(rawDate);
};

const formatIDR = (val: number | undefined | null) => {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(val || 0);
  return `Rp${formatted}`;
};

export default function AdminScheduleTrackingModal({
  booking,
  onClose,
  onUpdateBookingStatus,
  onUpdateTreatmentStatus,
  onUpdatePaymentStatus,
}: AdminScheduleTrackingModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  if (!booking) return null;

  const refNumber = booking.reference_number || booking.id.substring(0, 8).toUpperCase();
  const bookingStatus = booking.status || 'Pending';
  const isCancelled = bookingStatus.toLowerCase() === 'cancelled';
  const isConfirmed = bookingStatus.toLowerCase() === 'confirmed' || bookingStatus.toLowerCase() === 'approved';

  const paymentStatus = booking.payment_status || (booking.commission?.payment_verified ? 'Paid' : 'Unpaid');
  const isPaid = paymentStatus.toLowerCase() === 'paid';
  const paymentMethod = booking.payment_method || 'Cash';

  const treatmentStatus = booking.treatment_status || (booking.commission?.service_completed ? 'Finished' : 'Scheduled');
  const isFinished = treatmentStatus.toLowerCase() === 'finished';
  const isOngoing = treatmentStatus.toLowerCase() === 'in progress' || treatmentStatus.toLowerCase() === 'ongoing';

  const isCommissionPaid = booking.commission?.status === 'paid';
  const isCommissionApproved = booking.commission?.status === 'approved';

  // Determine active milestone (1 to 4)
  let activeStep = 1;
  if (isCommissionPaid || (isFinished && isPaid)) {
    activeStep = 4;
  } else if (isFinished) {
    activeStep = 3;
  } else if (isOngoing) {
    activeStep = 3;
  } else if (isPaid) {
    activeStep = 2;
  } else if (isConfirmed) {
    activeStep = 1;
  } else {
    activeStep = 1;
  }

  const steps = [
    {
      label: 'Confirmed',
      sub: isConfirmed ? 'Confirmed' : isCancelled ? 'Cancelled' : 'Pending',
      isDone: !isCancelled && (isConfirmed || activeStep >= 2),
      isCurrent: !isCancelled && activeStep === 1 && !isConfirmed,
    },
    {
      label: 'Payment',
      sub: isPaid ? `Paid (${paymentMethod})` : 'Unpaid',
      isDone: !isCancelled && isPaid,
      isCurrent: !isCancelled && isConfirmed && !isPaid,
    },
    {
      label: 'Treatment',
      sub: isFinished 
        ? 'Finished' 
        : isOngoing 
        ? 'In Ritual' 
        : (booking.time && booking.time !== '-' ? booking.time : 'Scheduled'),
      isDone: !isCancelled && isFinished,
      isCurrent: !isCancelled && isOngoing,
    },
    {
      label: 'Payout',
      sub: isCommissionPaid 
        ? 'Disbursed' 
        : isCommissionApproved 
        ? 'Approved' 
        : (booking.commission ? 'In Escrow' : 'Direct Profit'),
      isDone: !isCancelled && (isCommissionPaid || (isFinished && isPaid && !booking.commission)),
      isCurrent: !isCancelled && isFinished && (isCommissionApproved || !isCommissionPaid),
    },
  ];

  const handleCopyId = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(refNumber);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSetBookingStatus = async (status: string) => {
    setUpdatingField('booking');
    try {
      await onUpdateBookingStatus(booking.id, status);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleSetPaymentStatus = async (status: string, method?: string) => {
    setUpdatingField('payment');
    try {
      await onUpdatePaymentStatus(booking.id, status, method || paymentMethod);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleSetTreatmentStatus = async (status: string) => {
    setUpdatingField('treatment');
    try {
      await onUpdateTreatmentStatus(booking.id, status);
    } finally {
      setUpdatingField(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm sm:max-w-lg bg-white rounded-3xl border border-stone-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-tracking-title"
      >
        {/* ─── Header: TRACK · #REF + Badges + Close X ─── */}
        <div className="px-5 py-4 border-b border-stone-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[11px] uppercase font-bold text-stone-400 tracking-wider shrink-0">
              TRACK
            </span>
            <span className="text-stone-300">·</span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-neutral-900 min-w-0">
              <span className="truncate">#{refNumber}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-stone-400 hover:text-neutral-900 p-1 rounded-md hover:bg-stone-100 cursor-pointer shrink-0 transition-colors"
                title="Copy reference ID"
                aria-label="Copy booking reference"
              >
                {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
            </div>

            {isCancelled ? (
              <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                CANCELLED
              </span>
            ) : isFinished ? (
              <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                FINISHED
              </span>
            ) : isOngoing ? (
              <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                IN RITUAL
              </span>
            ) : isConfirmed ? (
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                CONFIRMED
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                PENDING
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-neutral-900 hover:bg-stone-100 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Scrollable Body ─── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* ─── 4-Step Milestone Stepper (Eye-Catching Emerald Glow) ─── */}
          {isCancelled ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="font-semibold truncate">Booking Cancelled · No Treatment Execution</span>
            </div>
          ) : (
            <div className="py-2">
              <div className="grid grid-cols-4 relative">
                {/* Connecting Track Line */}
                <div className="absolute top-3.5 left-[12.5%] right-[12.5%] h-[2.5px] bg-stone-200 z-0" />
                <div 
                  className="absolute top-3.5 left-[12.5%] h-[2.5px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-300 z-0" 
                  style={{ 
                    width: activeStep >= 4 ? '75%' : `${Math.max(0, (activeStep - 1) * 25)}%` 
                  }}
                />

                {steps.map((st, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center relative z-10 px-0.5 min-w-0">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all shrink-0 ${
                        st.isDone
                          ? 'bg-emerald-500 text-white shadow-xs ring-4 ring-emerald-50'
                          : st.isCurrent
                          ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 shadow-sm animate-pulse'
                          : 'bg-white border-2 border-stone-300 text-stone-400'
                      }`}
                    >
                      {st.isDone ? (
                        <Check size={14} strokeWidth={3} />
                      ) : st.isCurrent ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <span className="font-bold text-[11px]">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs font-bold mt-2 truncate max-w-full ${
                      st.isDone || st.isCurrent ? 'text-neutral-900' : 'text-stone-400'
                    }`}>
                      {st.label}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500 truncate max-w-full mt-0.5">
                      {st.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── ADMIN ONE-CLICK MILESTONE UPDATE CONTROLS ─── */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-950 font-bold flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-600" />
                ADMIN MILESTONE CONTROLS
              </span>
              {updatingField && (
                <span className="text-[11px] font-mono text-amber-800 flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" /> Saving...
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Row 1: Treatment Execution Milestone */}
              <div>
                <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                  1. Treatment Progress
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetTreatmentStatus('Scheduled')}
                    disabled={updatingField !== null}
                    className={`py-2 px-2 rounded-xl font-bold font-mono text-xs uppercase tracking-tight transition-all cursor-pointer ${
                      treatmentStatus.toLowerCase() === 'scheduled'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    Scheduled
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTreatmentStatus('In Progress')}
                    disabled={updatingField !== null}
                    className={`py-2 px-2 rounded-xl font-bold font-mono text-xs uppercase tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      treatmentStatus.toLowerCase() === 'in progress'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                    In Ritual
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTreatmentStatus('Finished')}
                    disabled={updatingField !== null}
                    className={`py-2 px-2 rounded-xl font-bold font-mono text-xs uppercase tracking-tight transition-all cursor-pointer ${
                      treatmentStatus.toLowerCase() === 'finished'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    Finished ✓
                  </button>
                </div>
              </div>

              {/* Row 2: Payment Status & Method */}
              <div>
                <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                  2. Payment Status & Method
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="grid grid-cols-2 gap-1.5 flex-1 w-full">
                    <button
                      type="button"
                      onClick={() => handleSetPaymentStatus('Paid')}
                      disabled={updatingField !== null}
                      className={`py-2 px-3 rounded-xl font-bold font-mono text-xs uppercase tracking-tight transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      Mark Paid ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPaymentStatus('Unpaid')}
                      disabled={updatingField !== null}
                      className={`py-2 px-3 rounded-xl font-bold font-mono text-xs uppercase tracking-tight transition-all cursor-pointer ${
                        !isPaid
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Mark Unpaid
                    </button>
                  </div>

                  {/* Method Toggle: Cash vs Online */}
                  <div className="flex items-center gap-1 bg-white border border-stone-200 p-1 rounded-xl shrink-0 w-full sm:w-auto justify-center">
                    <button
                      type="button"
                      onClick={() => handleSetPaymentStatus(paymentStatus, 'Cash')}
                      disabled={updatingField !== null}
                      className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                        paymentMethod.toLowerCase() === 'cash'
                          ? 'bg-neutral-900 text-white'
                          : 'text-stone-500 hover:text-neutral-900'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPaymentStatus(paymentStatus, 'Online')}
                      disabled={updatingField !== null}
                      className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                        paymentMethod.toLowerCase() === 'online'
                          ? 'bg-neutral-900 text-white'
                          : 'text-stone-500 hover:text-neutral-900'
                      }`}
                    >
                      Online
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Booking Status Confirmation */}
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-stone-600">
                  3. Booking:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetBookingStatus('Confirmed')}
                    disabled={updatingField !== null || isConfirmed}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      isConfirmed
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBookingStatus('Pending')}
                    disabled={updatingField !== null || (!isConfirmed && !isCancelled)}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      !isConfirmed && !isCancelled
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this booking?')) {
                        handleSetBookingStatus('Cancelled');
                      }
                    }}
                    disabled={updatingField !== null || isCancelled}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      isCancelled
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Unified Details & Financials Card (Matching Partner Portal Track Modal) ─── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/90 border border-stone-200/70 space-y-3.5 overflow-hidden">
            {/* Top Row: Guest & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block font-bold">
                  GUEST
                </span>
                <span className="font-bold text-sm text-neutral-900 truncate block mt-0.5">
                  {booking.guest_name || 'Guest'}
                  {booking.pax > 1 && <span className="text-stone-400 text-xs font-normal ml-1">({booking.pax} pax)</span>}
                </span>
                {booking.guest_whatsapp && (
                  <a
                    href={`https://wa.me/${booking.guest_whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone size={10} />
                    <span>{booking.guest_whatsapp}</span>
                  </a>
                )}
              </div>
              <div className="min-w-0 text-right">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block font-bold">
                  DATE & TIME
                </span>
                <span className="font-bold text-sm text-neutral-900 truncate block mt-0.5">
                  {safeFormatDate(booking.booking_date)}
                </span>
                <span className="font-mono text-xs text-stone-500 truncate block mt-0.5">
                  {booking.time || '10:00'}
                </span>
              </div>
            </div>

            {/* Middle Row: Treatment & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block font-bold">
                  TREATMENT
                </span>
                <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate block mt-0.5 uppercase">
                  {booking.treatment_name || 'Treatment'}
                </span>
                <span className="font-mono text-xs text-stone-500 truncate block mt-0.5">
                  {booking.therapists_count || 1} Therapist{booking.therapists_count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="min-w-0 text-right">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block font-bold">
                  LOCATION
                </span>
                <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate block mt-0.5">
                  {booking.location || 'Ubud'}
                </span>
                {booking.room_number && (
                  <span className="font-mono text-xs text-stone-500 truncate block mt-0.5">
                    Room {booking.room_number}
                  </span>
                )}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-stone-200/70 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-stone-500 font-medium">Gross Revenue</span>
                <span className="font-mono font-bold text-neutral-900 tabular-nums">
                  {formatIDR(booking.revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-stone-500 font-medium">Therapist Fee</span>
                <span className="font-mono font-semibold text-stone-600 tabular-nums">
                  -{formatIDR(booking.therapist_fee_total)}
                </span>
              </div>
              {booking.commission && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-stone-500 font-medium">
                    Partner Commission (#{booking.commission.partner_code})
                  </span>
                  <span className="font-mono font-bold text-indigo-600 tabular-nums">
                    -{formatIDR(booking.commission.commission_amount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-1 border-t border-stone-200/50">
                <span className="text-stone-700 font-bold">Net Profit</span>
                <span className="font-mono font-extrabold text-emerald-600 tabular-nums">
                  +{formatIDR(booking.net_profit)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Footer: Invoice Link + Close Pill Button ─── */}
        <div className="px-5 py-3.5 border-t border-stone-100 bg-white flex items-center justify-between shrink-0">
          <Link
            href={`/invoice/${refNumber}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 hover:text-black hover:underline cursor-pointer"
          >
            <span>Invoice</span>
            <ExternalLink size={13} className="text-stone-400" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="h-9 px-6 rounded-xl bg-neutral-900 text-white hover:bg-black font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
