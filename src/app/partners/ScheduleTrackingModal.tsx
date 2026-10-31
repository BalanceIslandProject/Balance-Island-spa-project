'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MapPin, 
  Check, 
  CheckCircle2, 
  Wallet, 
  CreditCard, 
  Sparkles,
  Copy,
  AlertCircle
} from 'lucide-react';
import { CalendarBooking } from './FloatingBookingCalendar';

interface ScheduleTrackingModalProps {
  booking: CalendarBooking | null;
  onClose: () => void;
}

const safeFormatDate = (rawDate: string | undefined | null, options?: Intl.DateTimeFormatOptions) => {
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
        return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short', year: 'numeric' });
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
  return `IDR ${formatted}`;
};

export default function ScheduleTrackingModal({ booking, onClose }: ScheduleTrackingModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!booking) return null;

  const isCancelled = booking.commission_status === 'cancelled' || booking.booking_status === 'Cancelled';
  const isPaid = booking.payment_status === 'paid' || booking.payment_verified;
  const isPaidOut = booking.commission_status === 'paid';
  const isApproved = booking.commission_status === 'approved';
  const isFinished = booking.treatment_status === 'Finish' || booking.treatment_status === 'Finished' || booking.booking_status === 'Completed' || booking.service_completed;
  const isOngoing = booking.treatment_status === 'Ongoing' || booking.treatment_status === 'In Progress' || booking.booking_status === 'Ongoing';

  // Determine current active milestone index (0 to 3)
  // Step 0: Confirmed (Booked)
  // Step 1: Payment Settled
  // Step 2: Treatment Delivered
  // Step 3: Payout Completed
  let activeStep = 0;
  if (isPaidOut) {
    activeStep = 4; // all done
  } else if (isApproved || isFinished) {
    activeStep = 3; // treatment done, awaiting payout
  } else if (isOngoing) {
    activeStep = 2; // treatment in progress
  } else if (isPaid) {
    activeStep = 2; // payment settled, awaiting appointment
  } else {
    activeStep = 1; // booked, payment pending
  }

  const steps = [
    {
      label: 'Confirmed',
      detail: safeFormatDate(booking.created_at || booking.date),
      isDone: !isCancelled && activeStep >= 1,
      isCurrent: !isCancelled && activeStep === 0,
    },
    {
      label: 'Payment',
      detail: isPaid 
        ? (booking.payment_method === 'cash' ? 'Cash on Arrival' : 'Paid Online') 
        : 'Payment Pending',
      isDone: !isCancelled && (isPaid || activeStep >= 2),
      isCurrent: !isCancelled && activeStep === 1,
    },
    {
      label: 'Treatment',
      detail: isFinished 
        ? 'Delivered' 
        : isOngoing 
        ? 'In Progress' 
        : (booking.time ? `${booking.time}` : 'Scheduled'),
      isDone: !isCancelled && (isFinished || activeStep >= 3),
      isCurrent: !isCancelled && isOngoing,
    },
    {
      label: 'Payout',
      detail: isPaidOut 
        ? 'Disbursed' 
        : isApproved 
        ? 'Ready to Pay' 
        : 'In Escrow',
      isDone: !isCancelled && isPaidOut,
      isCurrent: !isCancelled && (isApproved || activeStep === 3),
    },
  ];

  const handleCopyId = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(booking.booking_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-[10px] border border-[#ebebeb] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-tracking-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] bg-[#fafafa] flex items-center justify-between shrink-0">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block font-medium">
              Booking Tracking Flow
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 id="schedule-tracking-title" className="text-base font-bold text-[#171717] font-mono tracking-tight">
                #{booking.booking_id}
              </h2>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[#8f8f8f] hover:text-[#171717] p-1 rounded transition-colors cursor-pointer"
                title="Copy booking ID"
              >
                {copiedId ? <Check size={12} className="text-[#297a3a]" /> : <Copy size={12} />}
              </button>

              {isPaidOut ? (
                <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-2 py-0.5 rounded uppercase">
                  PAID OUT
                </span>
              ) : isApproved ? (
                <span className="font-mono text-[9px] font-semibold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded uppercase border border-[#ceead6]">
                  Approved
                </span>
              ) : isCancelled ? (
                <span className="font-mono text-[9px] font-semibold text-[#c5221f] bg-[#fce8e6] px-2 py-0.5 rounded uppercase border border-[#fad2cf]">
                  Cancelled
                </span>
              ) : (
                <span className="font-mono text-[9px] font-semibold text-[#b06000] bg-[#fef7e0] px-2 py-0.5 rounded uppercase border border-[#feefc3]">
                  Pending
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#666666] hover:text-[#171717] hover:bg-white border border-transparent hover:border-[#ebebeb] transition-colors cursor-pointer"
            aria-label="Close tracking"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Simple 4-Step Progress Track */}
          {isCancelled ? (
            <div className="p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>This booking was cancelled. No commission attributed.</span>
            </div>
          ) : (
            <div className="pt-2 pb-1">
              <div className="grid grid-cols-4 relative">
                {/* Connecting Bar */}
                <div className="absolute top-3.5 left-[12.5%] right-[12.5%] h-0.5 bg-[#ebebeb] z-0" />
                <div 
                  className="absolute top-3.5 left-[12.5%] h-0.5 bg-[#297a3a] transition-all duration-300 z-0" 
                  style={{ 
                    width: activeStep >= 4 ? '75%' : `${Math.max(0, (activeStep - 1) * 25)}%` 
                  }}
                />

                {steps.map((st, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center relative z-10 px-1">
                    {/* Circle */}
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                        st.isDone
                          ? 'bg-[#297a3a] text-white shadow-xs'
                          : st.isCurrent
                          ? 'bg-white border-2 border-[#171717] text-[#171717] ring-3 ring-[#171717]/10'
                          : 'bg-white border border-[#d1d5db] text-[#9ca3af]'
                      }`}
                    >
                      {st.isDone ? (
                        <Check size={13} strokeWidth={2.5} />
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <span className={`text-[11px] font-semibold mt-2 ${
                      st.isDone || st.isCurrent ? 'text-[#171717]' : 'text-[#8f8f8f]'
                    }`}>
                      {st.label}
                    </span>

                    {/* Sub / Detail */}
                    <span className="text-[10px] font-mono text-[#666666] mt-0.5 line-clamp-1">
                      {st.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Appointment & Guest Summary */}
          <div className="bg-[#fafafa] border border-[#ebebeb] rounded-[8px] p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#ebebeb] pb-2.5">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#666666] block">Guest Name</span>
                <span className="font-semibold text-sm text-[#171717]">
                  {booking.guest_name || 'Guest Booking'}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase text-[#666666] block">Appointment Schedule</span>
                <span className="font-mono font-medium text-[#171717]">
                  {safeFormatDate(booking.date)} {booking.time ? `· ${booking.time}` : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#666666] block">Treatment & Duration</span>
                <span className="font-medium text-[#171717] block">
                  {booking.treatment_name || 'Mobile Spa Treatment'}
                </span>
                <span className="font-mono text-[11px] text-[#666666] flex items-center gap-1 mt-0.5">
                  <Clock size={11} className="text-[#9ca3af]" />
                  <span>{booking.duration || '60 Mins'}</span>
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-[#666666] block">Service Location</span>
                <span className="font-medium text-[#171717] flex items-center gap-1">
                  <MapPin size={11} className="text-[#9ca3af] shrink-0" />
                  <span className="truncate">{booking.location || 'Villa / Hotel in Ubud'}</span>
                </span>
                {booking.room_number && (
                  <span className="font-mono text-[11px] text-[#666666] block mt-0.5">
                    Room: {booking.room_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Financial Breakdown Strip */}
          <div className="p-4 rounded-[8px] bg-white border border-[#ebebeb] shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Eligible Treatment Amount</span>
              <span className="font-mono font-medium text-[#171717] tabular-nums">
                {formatIDR(booking.treatment_amount || booking.gross_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Attributed Partner Commission ({booking.commission_rate_pct || 10}%)</span>
              <span className="font-mono font-bold text-xs text-[#297a3a] tabular-nums">
                +{formatIDR(booking.commission_amount)}
              </span>
            </div>

            {/* Status Callout Banner */}
            <div className="pt-2 border-t border-[#f3f4f6]">
              {isPaidOut ? (
                <div className="flex items-center gap-2 text-xs text-[#171717] font-medium">
                  <CheckCircle2 size={14} className="text-[#297a3a] shrink-0" />
                  <span>Commission disbursed directly to your registered bank account.</span>
                </div>
              ) : isApproved ? (
                <div className="flex items-center gap-2 text-xs text-[#137333] font-medium">
                  <CheckCircle2 size={14} className="text-[#297a3a] shrink-0" />
                  <span>Treatment verified. Commission ready for weekly bank disbursement.</span>
                </div>
              ) : isCancelled ? (
                <div className="flex items-center gap-2 text-xs text-red-700 font-medium">
                  <AlertCircle size={14} className="text-red-600 shrink-0" />
                  <span>Appointment was cancelled.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#b06000] font-medium">
                  <Sparkles size={14} className="text-[#b06000] shrink-0" />
                  <span>Appointment scheduled. Commission safely held in escrow until ritual delivery.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#ebebeb] bg-[#fafafa] flex items-center justify-between gap-3 shrink-0">
          <Link
            href={`/invoice/${booking.booking_id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#171717] hover:underline"
          >
            <span>View Full Treatment Invoice</span>
            <ExternalLink size={12} className="text-[#666666]" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-[6px] bg-[#171717] text-white hover:bg-black font-mono text-xs uppercase tracking-[0.071em] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
