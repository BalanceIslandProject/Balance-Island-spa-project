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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Receipt,
  Activity,
  CreditCard
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

  // Accordion state (all open by default or collapsible)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    guest: true,
    treatment: true,
    location: true,
    timeline: true,
    commission: true,
  });

  if (!booking) return null;

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer (Matching Mockup Screen 3) */}
      <div 
        className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 font-sans border-l border-[#E2E8F0]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-title"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#F1F5F9] bg-white flex items-start justify-between shrink-0">
          <div className="space-y-1 min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-[#0F172A]">
                #{booking.booking_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                title="Copy Reference"
              >
                {copiedId ? <Check size={12} className="text-[#059669]" /> : <Copy size={12} />}
              </button>
              
              {isPaidOut ? (
                <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Paid Out
                </span>
              ) : isApproved ? (
                <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Approved
                </span>
              ) : isCancelled ? (
                <span className="text-[10px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Cancelled
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  {booking.booking_status || 'Upcoming'}
                </span>
              )}
            </div>

            <h2 id="tracking-title" className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug break-words">
              {cleanTreatment}
            </h2>
            <p className="text-xs text-[#64748B]">
              {safeFormatDate(booking.date)} • {durationStr}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body: 5 Grouped Sections */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-[#F1F5F9]">
          
          {/* SECTION 1: GUEST INFORMATION (3-COLUMN LAYOUT) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('guest')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User size={15} className="text-[#0E2319]" />
                <span>Guest Information</span>
              </div>
              {openSections.guest ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
            </button>

            {openSections.guest && (
              <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-3 gap-2 text-xs">
                {/* Col 1: Name & Date */}
                <div className="space-y-2 min-w-0">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Name</span>
                    <span className="font-semibold text-[#0F172A] truncate block mt-0.5">{booking.guest_name || 'Guest'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Date</span>
                    <span className="text-[#475569] block mt-0.5">{safeFormatDate(booking.date)}</span>
                  </div>
                </div>

                {/* Col 2: Time & Duration */}
                <div className="space-y-2 border-x border-[#E2E8F0] px-2 text-center min-w-0">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Time</span>
                    <span className="font-bold text-[#0F172A] block mt-0.5">{booking.time || 'Scheduled'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Duration</span>
                    <span className="text-[#475569] block mt-0.5">{durationStr}</span>
                  </div>
                </div>

                {/* Col 3: Location & Room */}
                <div className="space-y-2 pl-1 min-w-0">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Location</span>
                    <span className="font-medium text-[#0F172A] truncate block mt-0.5">{booking.location || 'Private Villa'}</span>
                  </div>
                  {booking.room_number && booking.room_number !== '-' && (
                    <div>
                      <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Room</span>
                      <span className="text-[#475569] block mt-0.5">{booking.room_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: TREATMENT DETAILS */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('treatment')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#0E2319]" />
                <span>Treatment Details</span>
              </div>
              {openSections.treatment ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
            </button>

            {openSections.treatment && (
              <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Ritual</span>
                  <span className="font-semibold text-[#0F172A]">{cleanTreatment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Duration</span>
                  <span className="text-[#0F172A]">{durationStr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Service Delivery</span>
                  <span className="text-[#059669] font-medium">On-demand Mobile Spa</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SERVICE LOCATION */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('location')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#0E2319]" />
                <span>Service Location</span>
              </div>
              {openSections.location ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
            </button>

            {openSections.location && (
              <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Accommodation Address:</span>
                  <p className="font-medium text-[#0F172A] mt-0.5 leading-relaxed">
                    {booking.location || 'Private Villa / Resort in Bali'}
                  </p>
                </div>
                {booking.room_number && booking.room_number !== '-' && (
                  <div className="pt-1 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#64748B]">Room / Villa Unit:</span>
                    <span className="font-semibold text-[#0F172A]">{booking.room_number}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: STATUS & TIMELINE */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('timeline')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#0E2319]" />
                <span>Status & Timeline</span>
              </div>
              {openSections.timeline ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
            </button>

            {openSections.timeline && (
              <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
                {isCancelled ? (
                  <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle size={15} className="text-red-600 shrink-0" />
                    <span>Booking Cancelled</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 relative py-2">
                    {/* Connecting line */}
                    <div className="absolute top-3 left-[12.5%] right-[12.5%] h-0.5 bg-[#E2E8F0] z-0" />
                    <div 
                      className="absolute top-3 left-[12.5%] h-0.5 bg-[#059669] transition-all duration-300 z-0"
                      style={{ width: activeStep >= 4 ? '75%' : `${Math.max(0, (activeStep - 1) * 25)}%` }}
                    />

                    {steps.map((st, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center relative z-10 px-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          st.isDone
                            ? 'bg-[#059669] text-white'
                            : st.isCurrent
                            ? 'bg-[#0E2319] text-white ring-2 ring-[#0E2319]/20'
                            : 'bg-white border border-[#CBD5E1] text-[#94A3B8]'
                        }`}>
                          {st.isDone ? <Check size={12} /> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-medium mt-1 truncate max-w-full ${st.isDone || st.isCurrent ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: COMMISSION INFORMATION */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('commission')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-[#0E2319]" />
                <span>Commission Information</span>
              </div>
              {openSections.commission ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
            </button>

            {openSections.commission && (
              <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Gross Treatment</span>
                  <span className="font-medium text-[#0F172A] tabular-nums">
                    {formatIDR(booking.treatment_amount || booking.gross_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Commission Rate</span>
                  <span className="font-medium text-[#0F172A]">
                    {booking.commission_rate_pct || 15}%
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
                  <span className="font-semibold text-[#0F172A]">Earned Commission</span>
                  <span className="font-bold text-[#059669] text-sm tabular-nums">
                    +{formatIDR(booking.commission_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Payout Status</span>
                  <span className="font-semibold text-[#0F172A] capitalize">
                    {isPaidOut ? 'Disbursed' : isApproved ? 'Approved' : isCancelled ? 'Cancelled' : 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer with Actions */}
        <div className="p-4 border-t border-[#F1F5F9] bg-white flex items-center justify-between shrink-0">
          <Link
            href={`/invoice/${booking.booking_id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0E2319] hover:underline"
          >
            <span>View Official Invoice</span>
            <ExternalLink size={12} />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] bg-[#0E2319] hover:bg-[#163625] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>

    </div>
  );
}
