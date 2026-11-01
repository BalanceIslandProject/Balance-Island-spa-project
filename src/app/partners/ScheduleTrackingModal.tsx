'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  ExternalLink, 
  Clock, 
  MapPin, 
  Check, 
  Copy,
  AlertCircle,
  Timer,
  DoorClosed,
  User,
  Calendar as CalendarIcon,
  Sparkles
} from 'lucide-react';
import { CalendarBooking } from './FloatingBookingCalendar';

interface ScheduleTrackingModalProps {
  booking: CalendarBooking | null;
  onClose: () => void;
}

export function cleanTreatmentName(name?: string | null): string {
  if (!name) return 'Signature Ritual';
  return name.replace(/\s*\(\s*\d+\s*(?:mins?|minutes?|m)?\s*\)/gi, '').trim();
}

export function extractDuration(name?: string | null, fallback?: string | null): string {
  if (fallback && String(fallback).trim()) {
    const s = String(fallback).trim();
    return /mins?|minutes?|hours?|hr/i.test(s) ? s : `${s} Mins`;
  }
  if (!name) return '60 Mins';
  const match = name.match(/\((\d+)\s*(?:mins?|minutes?|m)?\)/i);
  if (match) return `${match[1]} Mins`;
  return '60 Mins';
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
  } else if (isOngoing || isPaid) {
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

  const cleanTreatment = cleanTreatmentName(booking.treatment_name);
  const durationStr = extractDuration(booking.treatment_name, booking.duration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-stone-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[11px] uppercase font-bold text-stone-400 tracking-wider shrink-0">
              TRACK
            </span>
            <span className="text-stone-300">·</span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-neutral-900 min-w-0">
              <span className="truncate">#{booking.booking_id}</span>
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
            {isPaidOut ? (
              <span className="font-mono text-[10px] font-bold text-white bg-neutral-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-2xs">
                PAID OUT
              </span>
            ) : isApproved ? (
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                APPROVED
              </span>
            ) : isCancelled ? (
              <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                CANCELLED
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* 4-Step Stepper */}
          {isCancelled ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="font-semibold truncate">Booking Cancelled · No Commission Disbursed</span>
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
                      {st.isDone || st.isCurrent ? (
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

          {/* Details & Financials Card with Icons: Treatment, Time, Duration, Location, Room */}
          <div className="p-4 sm:p-5 rounded-xl bg-stone-50/90 border border-stone-200/70 space-y-3.5">
            
            {/* 1. Treatment - Fully readable without ellipsis '...' and without '(120)' */}
            <div className="pb-3 border-b border-stone-200/70">
              <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
                <Sparkles size={13} className="text-[#0f172a]" />
                <span>TREATMENT</span>
              </div>
              <div className="font-bold text-sm sm:text-[15px] text-neutral-900 leading-snug break-words uppercase">
                {cleanTreatment}
              </div>
            </div>

            {/* 2. Key Details Grid: Time, Duration, Location, Room, Guest, Date */}
            <div className="grid grid-cols-2 gap-3.5 pt-0.5">
              
              {/* Left Column: Time & Duration, Guest */}
              <div className="space-y-3">
                {/* Time & Duration */}
                <div>
                  <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
                    <Clock size={12} className="text-[#0f172a]" />
                    <span>TIME & DURATION</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-neutral-900 flex items-center flex-wrap gap-1.5">
                    <span>{booking.time || '14:00'}</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-mono text-xs text-stone-600 font-medium inline-flex items-center gap-1">
                      <Timer size={11} className="text-stone-400" />
                      {durationStr}
                    </span>
                  </div>
                </div>

                {/* Guest */}
                <div>
                  <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
                    <User size={12} className="text-[#0f172a]" />
                    <span>GUEST</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                    {booking.guest_name || 'Guest'}
                  </div>
                </div>
              </div>

              {/* Right Column: Location & Room, Date */}
              <div className="space-y-3">
                {/* Location & Room */}
                <div>
                  <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
                    <MapPin size={12} className="text-[#0f172a]" />
                    <span>LOCATION & ROOM</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-neutral-900 break-words leading-tight">
                    {booking.location || 'Ubud Villa'}
                  </div>
                  {booking.room_number && booking.room_number !== '-' && (
                    <div className="font-mono text-xs text-stone-600 flex items-center gap-1 mt-1">
                      <DoorClosed size={11} className="text-stone-400 shrink-0" />
                      <span>Room {booking.room_number}</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[10px] uppercase tracking-wider font-bold mb-1">
                    <CalendarIcon size={12} className="text-[#0f172a]" />
                    <span>DATE</span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-neutral-900">
                    {safeFormatDate(booking.date)}
                  </div>
                </div>
              </div>

            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-stone-200/70 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-stone-500 font-medium">Net Treatment</span>
                <span className="font-mono font-bold text-neutral-900 tabular-nums">
                  {formatIDR(booking.treatment_amount || booking.gross_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-stone-500 font-medium">Earned ({booking.commission_rate_pct || 15}%)</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  +{formatIDR(booking.commission_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                <span className="text-stone-500 font-medium">Status</span>
                <span className="font-semibold text-neutral-900">
                  {isPaidOut 
                    ? 'Disbursed' 
                    : isApproved 
                    ? 'Approved' 
                    : isCancelled 
                    ? 'Cancelled' 
                    : 'Pending'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-100 bg-white flex items-center justify-between shrink-0">
          <Link
            href={`/invoice/${booking.booking_id}`}
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
