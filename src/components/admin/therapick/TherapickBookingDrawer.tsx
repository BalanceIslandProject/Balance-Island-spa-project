'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  Users, 
  Globe, 
  CheckCircle2, 
  MessageSquare,
  Trash2,
  Check,
  Copy,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { calculateBookingTherapistFee } from '@/lib/bookingFeeCalculator';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const cleanTreatmentName = (name?: string | null): string => {
  if (!name) return 'Signature Ritual';
  return name.replace(/\s*\(\s*\d+\s*(?:mins?|minutes?|m)?\s*\)/gi, '').trim();
};

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

export default function TherapickBookingDrawer() {
  const { 
    selectedBooking, 
    setSelectedBooking, 
    updateBookingStatus, 
    updateTreatmentStatus, 
    updatePaymentStatus,
    updateTherapistFee,
    deleteBooking,
    therapistFees,
    treatments,
    whatsappAutoStatus,
    defaultBookingStatus,
  } = useTherapickAdmin();

  const [loadingAction, setLoadingAction] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Auto-calculated therapist fee based on database wage tiers and 2-person rules (packages, couple, four hands)
  const autoFeeCalc = useMemo(() => {
    if (!selectedBooking) {
      return { feeTotal: 0, baseFee: 0, multiplier: 1, isDoubleTherapist: false, reason: '' };
    }
    return calculateBookingTherapistFee(selectedBooking, therapistFees, treatments);
  }, [selectedBooking, therapistFees, treatments]);

  if (!selectedBooking) return null;

  const b = selectedBooking;
  const isAffiliate = Boolean(b.affiliate_code || b.commission);
  const revenue = Number(b.revenue || b.total_price || b.total_amount || 0);
  const commAmount = b.commission?.commission_amount 
    ? Number(b.commission.commission_amount) 
    : (isAffiliate ? revenue * 0.15 : 0);

  // If therapist_fee_total in booking record is > 0, use it; otherwise use the auto-calculated fee
  const effectiveTherapistFee = Number(b.therapist_fee_total) > 0 
    ? Number(b.therapist_fee_total) 
    : autoFeeCalc.feeTotal;

  // Real Net Profit
  const netProfit = Math.max(0, revenue - effectiveTherapistFee - commAmount);

  // Customer Data extraction
  const guestName = b.guest_name || (b as any).customer_name || (b as any).name || 'Guest';
  const guestPhone = b.guest_whatsapp || (b as any).customer_phone || (b as any).phone || '';
  const guestEmail = b.guest_email || (b as any).customer_email || (b as any).email || '';
  const location = b.location || (b as any).villa_address || (b as any).address || '';
  const roomNumber = b.room_number || (b as any).villa_number || (b as any).room || '';
  const notes = b.notes || b.special_requests || (b as any).additional_notes || '';

  // WhatsApp quick link & safe booking reference
  const bIdStr = String(b.id || '');
  const bookingRef = b.reference_number || (bIdStr ? bIdStr.slice(0, 8) : 'BK-1');
  const waPhone = guestPhone.replace(/[^0-9]/g, '');
  const cleanPhone = waPhone.startsWith('0') ? '62' + waPhone.slice(1) : waPhone;
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(guestName)}%2C%20regarding%20your%20Therapick%20booking%20%23${bookingRef}...` 
    : null;

  const isCashOnArrival = Boolean(
    (b.payment_method && /cash/i.test(b.payment_method)) ||
    (b.payment_status && /cash/i.test(b.payment_status))
  );

  const isPaid = b.payment_status === 'Paid';
  const currentPaymentVal = isCashOnArrival && isPaid
    ? 'Paid (Cash on Arrival)'
    : isPaid
    ? 'Paid (Online)'
    : 'Unpaid';

  const rawBookingStatus = String(b.status || 'Pending').toLowerCase();
  const rawTreatmentStatus = String(b.treatment_status || '').toLowerCase();
  const isCancelled = rawBookingStatus === 'cancelled' || rawTreatmentStatus === 'cancelled';
  const isFinished = rawBookingStatus === 'completed' || rawTreatmentStatus === 'finished';
  const isOngoing = rawBookingStatus === 'ongoing' || rawBookingStatus === 'in progress' || rawTreatmentStatus === 'in progress' || (isCashOnArrival && isPaid);
  const isConfirmed = rawBookingStatus === 'confirmed';

  const displayStatusLabel = isCancelled
    ? 'Cancelled'
    : isFinished
    ? 'Completed'
    : isOngoing
    ? 'In Progress'
    : isConfirmed
    ? 'Confirmed'
    : 'Pending';

  const handleCopyRef = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(bookingRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // WhatsApp click handler: open chat & automatically set status to 'In Progress' per settings
  const handleWhatsAppDispatch = async () => {
    const targetStatus = whatsappAutoStatus || defaultBookingStatus || 'In Progress';
    if (targetStatus && targetStatus !== 'none') {
      try {
        await updateTreatmentStatus(b.id, 'In Progress');
        if (targetStatus === 'Confirmed') {
          await updateBookingStatus(b.id, 'Confirmed');
        } else {
          await updateBookingStatus(b.id, 'Ongoing');
        }
      } catch (err) {
        console.error('Failed to auto update status on WhatsApp dispatch:', err);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoadingAction(true);
    try {
      await updateBookingStatus(b.id, newStatus);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTreatmentStatusChange = async (newStatus: string) => {
    setLoadingAction(true);
    try {
      if ((!b.therapist_fee_total || Number(b.therapist_fee_total) === 0) && autoFeeCalc.feeTotal > 0) {
        await updateTherapistFee(b.id, autoFeeCalc.feeTotal);
      }
      await updateTreatmentStatus(b.id, newStatus);
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePaymentChange = async (newStatus: string, method?: string) => {
    setLoadingAction(true);
    try {
      if ((!b.therapist_fee_total || Number(b.therapist_fee_total) === 0) && autoFeeCalc.feeTotal > 0) {
        await updateTherapistFee(b.id, autoFeeCalc.feeTotal);
      }
      await updatePaymentStatus(b.id, newStatus, method);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently remove booking #${bookingRef}? This action cannot be undone.`)) {
      return;
    }
    setLoadingAction(true);
    try {
      await deleteBooking(b.id);
    } finally {
      setLoadingAction(false);
    }
  };

  const cleanTreatment = cleanTreatmentName(b.treatment_name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={() => setSelectedBooking(null)}
      />

      {/* Slide-over Drawer Panel (Matching Partner Portal Calm Apple Design) */}
      <div 
        className="relative w-full max-w-md sm:max-w-lg h-full bg-[#F8FAFC] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 font-sans border-l border-[#E2E8F0]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-drawer-title"
      >
        
        {/* Header: Exact Partner Portal Architecture */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-white shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-mono text-sm font-bold text-[#0F172A]">
                #{bookingRef}
              </span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                title="Copy Reference Number"
                aria-label="Copy reference"
              >
                {copiedRef ? <Check size={12} className="text-[#059669]" /> : <Copy size={12} />}
              </button>

              {/* Status Badge */}
              {isCancelled ? (
                <span className="text-[10px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Cancelled
                </span>
              ) : isFinished ? (
                <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Completed
                </span>
              ) : isOngoing ? (
                <span className="text-[10px] font-semibold text-[#0E2319] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  In Progress
                </span>
              ) : isConfirmed ? (
                <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Confirmed
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                  Pending
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="p-1.5 -mr-1 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-colors cursor-pointer shrink-0"
              aria-label="Close booking details"
            >
              <X size={18} />
            </button>
          </div>

          {/* Full-width Title Row */}
          <div className="w-full">
            <h2 
              id="booking-drawer-title" 
              className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug break-words tracking-tight uppercase"
            >
              {cleanTreatment}
            </h2>
          </div>
        </div>

        {/* Content Body: Clean Paper Canvas & Discrete White Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#F8FAFC]">
          
          {/* Card 1: Guest Information */}
          <div className="p-3.5 sm:p-4 rounded-[8px] bg-white border border-[#E2E8F0] shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Guest Information</span>
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#64748B]">Name</span>
              <span className="font-semibold text-[#0F172A] text-right">{guestName}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-[#64748B] shrink-0">Location</span>
              <span className="font-medium text-[#0F172A] text-right break-words max-w-[70%]">
                {location || 'Private Villa / Resort in Bali'}
              </span>
            </div>

            {roomNumber && roomNumber !== '-' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#64748B]">Room</span>
                <span className="font-semibold text-[#0F172A] text-right">{roomNumber}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className="text-[#64748B]">Time</span>
              <span className="font-semibold text-[#0F172A] text-right">{b.time || b.booking_time || 'Scheduled'}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[#64748B]">Date</span>
              <span className="font-medium text-[#0F172A] text-right">{safeFormatDate(b.booking_date || b.created_at)}</span>
            </div>

            {guestPhone && (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9]">
                <span className="text-[#64748B]">WhatsApp</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#0F172A] font-medium">{guestPhone}</span>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleWhatsAppDispatch}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#0E2319] hover:bg-[#163625] text-white text-[11px] font-medium transition-colors cursor-pointer"
                      title="Open WhatsApp chat & set status to In Progress"
                    >
                      <MessageSquare size={11} />
                      <span>Chat</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {guestEmail && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#64748B]">Email</span>
                <span className="font-medium text-[#0F172A]">{guestEmail}</span>
              </div>
            )}
          </div>

          {/* Card 2: Treatment Details */}
          <div className="p-3.5 sm:p-4 rounded-[8px] bg-white border border-[#E2E8F0] shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Treatment Details</span>
              <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-[4px]">
                {b.treatment_status || 'Scheduled'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-[#64748B] shrink-0">Ritual</span>
              <span className="font-semibold text-[#0F172A] text-right break-words max-w-[70%] leading-snug">
                {cleanTreatment}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Duration</span>
              <span className="text-[#0F172A] font-medium">
                {b.duration_minutes ? `${b.duration_minutes} Mins` : '90 Mins'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Service Delivery</span>
              <span className="text-[#059669] font-medium">On-demand Mobile Spa</span>
            </div>

            {notes && (
              <div className="pt-2 border-t border-[#F1F5F9] text-[#64748B] italic text-[11px] leading-relaxed">
                &ldquo;{notes}&rdquo;
              </div>
            )}
          </div>

          {/* Card 3: Referring Partner & Attribution */}
          <div className="p-3.5 sm:p-4 rounded-[8px] bg-white border border-[#E2E8F0] shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Referring Partner</span>
              <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-[4px]">
                {isAffiliate ? 'Affiliate Partner' : 'Direct Booking'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[#64748B]">Partner</span>
              <span className="font-semibold text-[#0F172A] text-right">
                {isAffiliate 
                  ? ((b as any).partner_info?.business || (b as any).partner_name || b.affiliate_code || 'Affiliate Partner') 
                  : 'Direct Website Booking'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[#64748B]">Referral Code</span>
              <span className="font-mono font-medium text-[#0F172A]">
                #{b.affiliate_code || (b as any).partner_info?.code || 'DIRECT'}
              </span>
            </div>
          </div>

          {/* Card 4: Financial Summary (Calm Disciplined Monochrome) */}
          <div className="p-3.5 sm:p-4 rounded-[8px] bg-white border border-[#E2E8F0] shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Financial Summary</span>
              <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-[4px]">
                Auto-Calculated
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Gross Treatment</span>
              <span className="font-mono font-semibold text-[#0F172A] tabular-nums">{formatIDR(revenue)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">
                Therapist Fee {autoFeeCalc.reason ? `(${autoFeeCalc.reason})` : ''}
              </span>
              <span className="font-mono text-[#64748B] tabular-nums">- {formatIDR(effectiveTherapistFee)}</span>
            </div>

            {isAffiliate && (
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Affiliate Commission (15%)</span>
                <span className="font-mono text-[#64748B] tabular-nums">- {formatIDR(commAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="font-semibold text-[#0F172A]">Net Profit</span>
              <span className="font-mono font-bold text-sm text-[#059669] tabular-nums">{formatIDR(netProfit)}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[#64748B]">Payment Method</span>
              <span className={`font-semibold ${isCashOnArrival ? 'text-[#0E2319]' : isPaid ? 'text-[#059669]' : 'text-[#64748B]'}`}>
                {isCashOnArrival 
                  ? 'Paid (Cash on Arrival)' 
                  : isPaid 
                  ? `Paid (${b.payment_method || 'Online'})` 
                  : 'Payment Pending'}
              </span>
            </div>
          </div>

          {/* Card 5: Update Booking State (Streamlined & Clean) */}
          <div className="p-3.5 sm:p-4 rounded-[8px] bg-white border border-[#E2E8F0] shadow-2xs space-y-3 text-xs">
            <div className="text-xs font-semibold text-[#0F172A]">Update Booking State</div>

            {/* Payment Status Dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-[#64748B] mb-1.5">
                Payment Status & Method
              </label>
              <div className="relative">
                <select
                  disabled={loadingAction}
                  value={currentPaymentVal}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Paid (Cash on Arrival)') {
                      handlePaymentChange('Paid', 'Cash on Arrival');
                    } else if (val === 'Paid (Online)') {
                      handlePaymentChange('Paid', 'Online');
                    } else {
                      handlePaymentChange('Unpaid', b.payment_method || 'Online');
                    }
                  }}
                  className="w-full appearance-none px-3 py-2 rounded-[6px] border border-[#CBD5E1] bg-white hover:border-[#0F172A] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A] cursor-pointer transition-colors"
                >
                  <option value="Paid (Cash on Arrival)">Paid (Cash on Arrival)</option>
                  <option value="Paid (Online)">Paid (Online / Card)</option>
                  <option value="Unpaid">Unpaid (Payment Pending)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>

            {/* Streamlined Ongoing & Finish Treatment Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleTreatmentStatusChange('In Progress')}
                className={`py-2 px-3 rounded-[6px] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  (b.treatment_status || '').toLowerCase() === 'in progress'
                    ? 'bg-[#0F172A] text-white shadow-2xs'
                    : 'bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                <Clock size={13} />
                <span>Ongoing Treatment</span>
              </button>

              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleTreatmentStatusChange('Finished')}
                className={`py-2 px-3 rounded-[6px] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  (b.treatment_status || '').toLowerCase() === 'finished'
                    ? 'bg-[#059669] text-white shadow-2xs'
                    : 'bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Finish Treatment</span>
              </button>
            </div>

            {/* Discreet Secondary Actions (Cancel / Remove) */}
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleStatusChange('Cancelled')}
                className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>

              <button
                type="button"
                disabled={loadingAction}
                onClick={handleDelete}
                className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={11} />
                <span>Remove Booking</span>
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer with Actions (Matching Partner Portal exactly) */}
        <div className="p-4 border-t border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
          <Link
            href={`/invoice/${bookingRef}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0E2319] hover:underline"
          >
            <span>View Official Invoice</span>
            <ExternalLink size={12} />
          </Link>

          <button
            type="button"
            onClick={() => setSelectedBooking(null)}
            className="px-4 py-2 rounded-[6px] bg-[#0E2319] hover:bg-[#163625] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
