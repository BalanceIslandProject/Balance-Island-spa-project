'use client';

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MapPin, 
  DoorOpen, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Wallet,
  Receipt
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
  if (!booking) return null;

  const isCancelled = booking.commission_status === 'cancelled' || booking.booking_status === 'Cancelled';
  const isPaid = booking.payment_status === 'paid' || booking.payment_verified;
  const isPaidOut = booking.commission_status === 'paid';
  const isApproved = booking.commission_status === 'approved';
  const isFinished = booking.treatment_status === 'Finish' || booking.treatment_status === 'Finished' || booking.booking_status === 'Completed' || booking.service_completed;
  const isOngoing = booking.treatment_status === 'Ongoing' || booking.treatment_status === 'In Progress' || booking.booking_status === 'Ongoing';

  // Construct events timeline matching Admin Dashboard History style
  const events = [
    {
      title: `Booking #${booking.booking_id} referred`,
      detail: `${booking.guest_name || 'Guest Booking'} · ${booking.treatment_name || 'Luxury Spa Ritual'}`,
      date: safeFormatDate(booking.created_at || booking.date),
      status: isCancelled ? 'Cancelled' : 'Confirmed',
      statusClass: isCancelled 
        ? 'text-red-700 bg-red-50 border-red-200' 
        : 'text-[#171717] bg-[#fafafa] border-[#ebebeb]',
      icon: Receipt
    },
    {
      title: `Appointment Schedule`,
      detail: `${safeFormatDate(booking.date)} at ${booking.time || 'Flexible'}${booking.location ? ` · ${booking.location}` : ''}${booking.room_number ? ` (Room ${booking.room_number})` : ''}`,
      date: safeFormatDate(booking.date),
      status: booking.time ? `${booking.time}` : 'Scheduled',
      statusClass: 'text-[#171717] bg-[#fafafa] border-[#ebebeb]',
      icon: Calendar
    },
    {
      title: `Payment Settlement`,
      detail: `${isPaid ? (booking.payment_method === 'cash' ? 'Paid in Cash upon Therapist Arrival' : 'Paid Online (Verified)') : 'Pending Payment'} · ${formatIDR(booking.treatment_amount || booking.gross_amount)}`,
      date: safeFormatDate(booking.created_at || booking.date),
      status: isPaid ? 'Paid' : 'Unpaid',
      statusClass: isPaid 
        ? 'text-[#297a3a] bg-[#297a3a]/10 border-[#297a3a]/20' 
        : 'text-amber-700 bg-amber-50 border-amber-200',
      icon: CreditCard
    },
    {
      title: `Treatment Delivery`,
      detail: isFinished
        ? 'Therapist completed ritual in guest room / villa'
        : isOngoing
        ? 'Therapist on-site delivering ritual'
        : 'Scheduled for in-villa mobile delivery',
      date: safeFormatDate(booking.date),
      status: isCancelled 
        ? 'Cancelled' 
        : isFinished 
        ? 'Finished' 
        : isOngoing 
        ? 'Ongoing' 
        : 'Scheduled',
      statusClass: isFinished 
        ? 'text-[#297a3a] bg-[#297a3a]/10 border-[#297a3a]/20' 
        : isOngoing 
        ? 'text-indigo-700 bg-indigo-50 border-indigo-200' 
        : 'text-[#666666] bg-[#fafafa] border-[#ebebeb]',
      icon: Sparkles
    },
    {
      title: `Partner Commission`,
      detail: `Attributed commission rate: ${booking.commission_rate_pct || 10}% · Amount: ${formatIDR(booking.commission_amount)}`,
      date: booking.approved_at ? safeFormatDate(booking.approved_at) : safeFormatDate(booking.date),
      status: isPaidOut ? 'PAID OUT' : isApproved ? 'Approved' : 'Pending',
      statusClass: isPaidOut 
        ? 'text-white bg-[#171717] border-[#171717]' 
        : isApproved 
        ? 'text-[#297a3a] bg-[#297a3a]/10 border-[#297a3a]/20' 
        : 'text-amber-700 bg-amber-50 border-amber-200',
      icon: Wallet
    }
  ];

  if (isPaidOut) {
    events.push({
      title: `Payout Completed`,
      detail: `Commission transferred to partner account${booking.payout_reference ? ` · Ref: ${booking.payout_reference}` : ''}`,
      date: booking.paid_at ? safeFormatDate(booking.paid_at) : safeFormatDate(booking.date),
      status: 'PAID OUT',
      statusClass: 'text-white bg-[#171717] border-[#171717]',
      icon: CheckCircle2
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-[8px] border border-[#ebebeb] shadow-[0_16px_40px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-tracking-title"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] flex items-center justify-between shrink-0 bg-[#fafafa]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
                Schedule History
              </span>
              {isPaidOut && (
                <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                  PAID OUT
                </span>
              )}
            </div>
            <h2 id="schedule-tracking-title" className="text-base font-semibold text-[#171717] mt-0.5 tracking-tight flex items-center gap-2">
              <span>Booking #{booking.booking_id}</span>
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              {booking.guest_name || 'Guest Booking'}{booking.treatment_name ? ` · ${booking.treatment_name}` : ''}
            </p>
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

        {/* Schedule Summary Strip */}
        <div className="px-5 py-3 border-b border-[#ebebeb] bg-white grid grid-cols-2 gap-3 text-xs shrink-0">
          <div>
            <span className="font-mono text-[10px] uppercase font-medium text-[#666666] block">Treatment Amount</span>
            <span className="font-mono font-bold text-sm text-[#171717] tabular-nums">
              {formatIDR(booking.treatment_amount || booking.gross_amount)}
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase font-medium text-[#297a3a] block">Commission Earned</span>
            <span className="font-mono font-bold text-sm text-[#297a3a] tabular-nums">
              +{formatIDR(booking.commission_amount)}
            </span>
          </div>
        </div>

        {/* Timeline (Identical to Admin Dashboard History Style) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          <ol className="relative border-l border-[#ebebeb] ml-2 space-y-6">
            {events.map((ev, i) => (
              <li key={i} className="pl-6 relative">
                {/* Node Bullet Circle */}
                <span 
                  className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 ${
                    ev.status === 'PAID OUT' 
                      ? 'border-[#171717] bg-[#171717]' 
                      : ev.status === 'Paid' || ev.status === 'Finished' || ev.status === 'Approved'
                      ? 'border-[#297a3a]'
                      : 'border-[#a8a8a8]'
                  }`} 
                  aria-hidden="true" 
                />
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-[#171717]">{ev.title}</span>
                  {ev.status && (
                    <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-[4px] border ${ev.statusClass}`}>
                      {ev.status}
                    </span>
                  )}
                </div>

                {ev.detail && (
                  <div className="text-xs text-[#666666] mt-1 leading-relaxed">
                    {ev.detail}
                  </div>
                )}

                {ev.date && (
                  <div className="text-[11px] font-mono text-[#8f8f8f] mt-1">
                    {ev.date}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Modal Footer */}
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
