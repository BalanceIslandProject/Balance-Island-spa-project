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
  AlertCircle
} from 'lucide-react';
import { CalendarBooking } from './FloatingBookingCalendar';

interface ScheduleTrackingModalProps {
  booking: CalendarBooking | null;
  onClose: () => void;
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
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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

export default function ScheduleTrackingModal({ booking, onClose }: ScheduleTrackingModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!booking) return null;

  const isCancelled = booking.commission_status === 'cancelled' || booking.booking_status === 'Cancelled';
  const isPaid = booking.payment_status === 'paid' || booking.payment_verified;
  const isPaidOut = booking.commission_status === 'paid';
  const isApproved = booking.commission_status === 'approved';
  const isFinished = booking.treatment_status === 'Finish' || booking.treatment_status === 'Finished' || booking.booking_status === 'Completed' || booking.service_completed;
  const isOngoing = booking.treatment_status === 'Ongoing' || booking.treatment_status === 'In Progress' || booking.booking_status === 'Ongoing';

  // Determine active milestone (1 to 4)
  let activeStep = 1;
  if (isPaidOut) {
    activeStep = 4;
  } else if (isApproved || isFinished) {
    activeStep = 3;
  } else if (isOngoing) {
    activeStep = 2;
  } else if (isPaid) {
    activeStep = 2;
  } else {
    activeStep = 1;
  }

  const steps = [
    {
      label: 'Confirmed',
      sub: safeFormatDate(booking.created_at || booking.date) || 'Booked',
      isDone: !isCancelled && activeStep >= 1,
      isCurrent: !isCancelled && activeStep === 1 && !isPaid,
    },
    {
      label: 'Payment',
      sub: isPaid ? 'Paid' : 'Pending',
      isDone: !isCancelled && (isPaid || activeStep >= 2),
      isCurrent: !isCancelled && activeStep === 1 && !isPaid,
    },
    {
      label: 'Treatment',
      sub: isFinished 
        ? 'Finished' 
        : isOngoing 
        ? 'In Progress' 
        : (booking.time || 'Scheduled'),
      isDone: !isCancelled && (isFinished || activeStep >= 3),
      isCurrent: !isCancelled && isOngoing,
    },
    {
      label: 'Payout',
      sub: isPaidOut 
        ? 'Disbursed' 
        : isApproved 
        ? 'Approved' 
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
        className="w-full max-w-sm sm:max-w-md bg-white rounded-[10px] border border-[#ebebeb] shadow-[0_16px_40px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-title"
      >
        {/* Header - Compact Web App Style */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#ebebeb] bg-[#fafafa] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-mono text-[10px] uppercase font-semibold text-[#8f8f8f] shrink-0">
              Track
            </span>
            <span className="text-[#ebebeb]">·</span>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#171717] min-w-0">
              <span className="truncate">#{booking.booking_id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[#8f8f8f] hover:text-[#171717] p-0.5 cursor-pointer shrink-0"
                title="Copy ID"
              >
                {copiedId ? <Check size={11} className="text-[#297a3a]" /> : <Copy size={11} />}
              </button>
            </div>
            {isPaidOut ? (
              <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-1.5 py-0.5 rounded uppercase shrink-0">
                PAID OUT
              </span>
            ) : isApproved ? (
              <span className="font-mono text-[9px] font-semibold text-[#137333] bg-[#e6f4ea] px-1.5 py-0.5 rounded uppercase border border-[#ceead6] shrink-0">
                Approved
              </span>
            ) : isCancelled ? (
              <span className="font-mono text-[9px] font-semibold text-[#c5221f] bg-[#fce8e6] px-1.5 py-0.5 rounded uppercase border border-[#fad2cf] shrink-0">
                Cancelled
              </span>
            ) : (
              <span className="font-mono text-[9px] font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5 rounded uppercase border border-[#feefc3] shrink-0">
                Pending
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8f8f8f] hover:text-[#171717] hover:bg-white rounded transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          
          {/* 4-Step Stepper */}
          {isCancelled ? (
            <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-600 shrink-0" />
              <span className="font-medium truncate">Cancelled · Rp0</span>
            </div>
          ) : (
            <div className="pt-1 pb-1">
              <div className="grid grid-cols-4 relative">
                {/* Connecting Bar */}
                <div className="absolute top-3 left-[12.5%] right-[12.5%] h-0.5 bg-[#ebebeb] z-0" />
                <div 
                  className="absolute top-3 left-[12.5%] h-0.5 bg-[#297a3a] transition-all duration-300 z-0" 
                  style={{ 
                    width: activeStep >= 4 ? '75%' : `${Math.max(0, (activeStep - 1) * 25)}%` 
                  }}
                />

                {steps.map((st, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center relative z-10 px-0.5 min-w-0">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all shrink-0 ${
                        st.isDone
                          ? 'bg-[#297a3a] text-white'
                          : st.isCurrent
                          ? 'bg-white border-2 border-[#171717] text-[#171717] ring-2 ring-[#171717]/10 font-bold'
                          : 'bg-white border border-[#d1d5db] text-[#9ca3af]'
                      }`}
                    >
                      {st.isDone ? (
                        <Check size={11} strokeWidth={2.5} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-medium mt-1 truncate max-w-full ${
                      st.isDone || st.isCurrent ? 'text-[#171717]' : 'text-[#8f8f8f]'
                    }`}>
                      {st.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#8f8f8f] truncate max-w-full">
                      {st.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details Card - Compact 2-Column Grid */}
          <div className="p-3 rounded-[8px] bg-[#fafafa] border border-[#ebebeb] space-y-2 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#ebebeb]">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase text-[#8f8f8f] block">Guest</span>
                <span className="font-semibold text-xs text-[#171717] truncate block">
                  {booking.guest_name || 'Guest'}
                </span>
              </div>
              <div className="min-w-0 text-right">
                <span className="font-mono text-[10px] uppercase text-[#8f8f8f] block">Date</span>
                <span className="font-mono font-medium text-xs text-[#171717] truncate block">
                  {safeFormatDate(booking.date)} {booking.time ? `· ${booking.time}` : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase text-[#8f8f8f] block">Treatment</span>
                <span className="font-medium text-xs text-[#171717] truncate block">
                  {booking.treatment_name || 'Spa Ritual'}
                </span>
                <span className="font-mono text-[10px] text-[#8f8f8f] truncate block">
                  {booking.duration || '60 Mins'}
                </span>
              </div>
              <div className="min-w-0 text-right">
                <span className="font-mono text-[10px] uppercase text-[#8f8f8f] block">Location</span>
                <span className="font-medium text-xs text-[#171717] truncate block">
                  {booking.location || 'Ubud'}
                </span>
                {booking.room_number && (
                  <span className="font-mono text-[10px] text-[#8f8f8f] truncate block">
                    Room {booking.room_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Financials & Status Strip */}
          <div className="p-3 rounded-[8px] bg-white border border-[#ebebeb] space-y-1.5 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Net</span>
              <span className="font-mono font-semibold text-[#171717] tabular-nums">
                {formatIDR(booking.treatment_amount || booking.gross_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Earned ({booking.commission_rate_pct || 10}%)</span>
              <span className="font-mono font-bold text-xs text-[#297a3a] tabular-nums">
                +{formatIDR(booking.commission_amount)}
              </span>
            </div>

            <div className="pt-1.5 border-t border-[#f3f4f6] flex items-center justify-between text-[11px]">
              <span className="text-[#8f8f8f]">Status</span>
              <span className="font-medium text-[#171717]">
                {isPaidOut 
                  ? 'Disbursed' 
                  : isApproved 
                  ? 'Approved' 
                  : isCancelled 
                  ? 'Cancelled' 
                  : 'In Escrow'}
              </span>
            </div>
          </div>

        </div>

        {/* Footer - Clean, Compact Web App */}
        <div className="px-4 py-2.5 border-t border-[#ebebeb] bg-[#fafafa] flex items-center justify-between shrink-0">
          <Link
            href={`/invoice/${booking.booking_id}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#171717] hover:underline"
          >
            <span>Invoice</span>
            <ExternalLink size={11} className="text-[#8f8f8f]" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="h-7 px-3 rounded-[6px] bg-[#171717] text-white hover:bg-black font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
