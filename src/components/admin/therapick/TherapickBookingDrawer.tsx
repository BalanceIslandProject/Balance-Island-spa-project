'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  Users, 
  Globe, 
  CreditCard, 
  CheckCircle2, 
  MessageSquare,
  Trash2,
  Check,
  ChevronDown,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { calculateBookingTherapistFee } from '@/lib/bookingFeeCalculator';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
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
    system
  } = useTherapickAdmin();

  const [loadingAction, setLoadingAction] = useState(false);

  if (!selectedBooking) return null;

  const b = selectedBooking;
  const isAffiliate = Boolean(b.affiliate_code || b.commission);
  const revenue = Number(b.revenue || b.total_price || b.total_amount || 0);
  const commAmount = b.commission?.commission_amount 
    ? Number(b.commission.commission_amount) 
    : (isAffiliate ? revenue * 0.15 : 0);

  // Auto-calculated therapist fee based on database wage tiers and 2-person rules (packages, couple, four hands)
  const autoFeeCalc = useMemo(() => {
    return calculateBookingTherapistFee(b, therapistFees, treatments);
  }, [b, therapistFees, treatments]);

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

  // Payment select value computation
  const currentPaymentVal = b.payment_status === 'Paid'
    ? (String(b.payment_method || '').toLowerCase() === 'cash' ? 'Paid (Cash)' : 'Paid (Online)')
    : 'Unpaid';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity" 
        onClick={() => setSelectedBooking(null)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-stone-200/80 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-stone-500 uppercase">
                #{bookingRef}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'ongoing'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : (b.status || '').toLowerCase() === 'cancelled'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{b.status || 'Pending'}</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-950 font-sans mt-0.5">Booking Details</h2>
          </div>

          <button
            type="button"
            onClick={() => setSelectedBooking(null)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close booking details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Card 1: Treatment & Customer Information */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">
                Treatment & Schedule
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                (b.treatment_status || '').toLowerCase() === 'finished'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : (b.treatment_status || '').toLowerCase() === 'in progress'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : (b.treatment_status || '').toLowerCase() === 'cancelled'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}>
                {b.treatment_status || 'Scheduled'}
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Service</span>
                <span className="font-bold text-neutral-900 text-right">{b.treatment_name || 'Signature Ritual'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Duration</span>
                <span className="font-medium text-neutral-900">{b.duration_minutes ? `${b.duration_minutes} min` : '90 min'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Date & Time</span>
                <span className="font-semibold text-neutral-900">{b.booking_date || (b.created_at ? b.created_at.split('T')[0] : 'Today')} at {b.time || b.booking_time || '14:00'}</span>
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="pt-3 border-t border-stone-100 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <User size={13} className="text-stone-400" />
                  Guest Name
                </span>
                <span className="font-bold text-neutral-900">{guestName}</span>
              </div>

              {guestPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Phone size={13} className="text-stone-400" />
                    WhatsApp
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-900">{guestPhone}</span>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleWhatsAppDispatch}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
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
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Mail size={13} className="text-stone-400" />
                    Email
                  </span>
                  <span className="text-neutral-900 font-medium">{guestEmail}</span>
                </div>
              )}

              {location && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                    <MapPin size={13} className="text-stone-400" />
                    Villa / Location
                  </span>
                  <span className="font-medium text-neutral-900 text-right">{location}</span>
                </div>
              )}

              {roomNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Room / Villa No.</span>
                  <span className="font-mono font-bold text-neutral-900">{roomNumber}</span>
                </div>
              )}

              {notes && (
                <div className="pt-2 border-t border-dashed border-stone-200">
                  <span className="text-stone-400 block text-[10px] uppercase font-mono mb-1">Notes / Requests</span>
                  <p className="text-neutral-700 bg-stone-50 rounded-lg p-2 text-[11px] leading-relaxed">{notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Partner Attribution Source */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Referring Partner & Attribution</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isAffiliate ? (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                    <Users size={15} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                    <Globe size={15} />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    {isAffiliate ? ((b as any).partner_info?.business || (b as any).partner_name || b.affiliate_code || 'Affiliate Partner') : 'Direct Website Booking'}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    {isAffiliate ? `Referral Code: ${b.affiliate_code || (b as any).partner_info?.code || 'DIRECT'}` : 'booktherapick.com'}
                  </div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isAffiliate ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
              }`}>
                {isAffiliate ? 'Affiliate Attributed' : 'Website Direct'}
              </span>
            </div>
          </div>

          {/* Card 3: Financial Breakdown & Commission (Auto-calculated Therapist Fee) */}
          <div className="bg-stone-50/90 border border-stone-200/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">
                Financial Breakdown & Commission
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Auto-Calculated
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Booking Amount</span>
                <span className="font-bold text-neutral-900 font-mono">{formatIDR(revenue)}</span>
              </div>

              <div className="flex items-center justify-between text-rose-600">
                <div className="flex items-center gap-1.5">
                  <span>Therapist Fee Total</span>
                  <span className="text-[10px] font-medium text-stone-500 bg-white border border-stone-200 px-1.5 py-0.2 rounded">
                    {autoFeeCalc.reason}
                  </span>
                </div>
                <span className="font-mono font-semibold">- {formatIDR(effectiveTherapistFee)}</span>
              </div>

              {isAffiliate && (
                <div className="flex items-center justify-between text-amber-800 font-medium">
                  <span>Affiliate Commission (15%)</span>
                  <span className="font-bold font-mono">- {formatIDR(commAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-neutral-950">
                <span>Net Profit</span>
                <span className="text-emerald-700 font-mono">{formatIDR(netProfit)}</span>
              </div>
            </div>

            {isAffiliate && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 leading-tight">
                <strong>Commission Policy:</strong> Weekly 7-day payout cycle once treatment is completed & customer payment verified.
              </div>
            )}

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">Current Payment</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-stone-200 text-stone-800'
              }`}>
                {b.payment_status || 'Unpaid'} ({b.payment_method || 'Online'})
              </span>
            </div>
          </div>

          {/* Card 4: Streamlined UPDATE BOOKING STATE */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">
              Update Booking State
            </div>

            {/* Payment Dropdown (Cash or Online or Unpaid) */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">
                Payment Status & Method
              </label>
              <div className="relative">
                <select
                  disabled={loadingAction}
                  value={currentPaymentVal}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Paid (Cash)') {
                      handlePaymentChange('Paid', 'Cash');
                    } else if (val === 'Paid (Online)') {
                      handlePaymentChange('Paid', 'Online');
                    } else {
                      handlePaymentChange('Unpaid', b.payment_method || 'Online');
                    }
                  }}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer transition-all"
                >
                  <option value="Paid (Cash)">Paid (Cash on Arrival)</option>
                  <option value="Paid (Online)">Paid (Online / Transfer / Card)</option>
                  <option value="Unpaid">Unpaid (Payment Pending)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Streamlined Ongoing & Finish Treatment Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleTreatmentStatusChange('In Progress')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  (b.treatment_status || '').toLowerCase() === 'in progress'
                    ? 'bg-amber-400 text-neutral-950 ring-2 ring-amber-400 ring-offset-1 shadow-xs'
                    : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Clock size={13} />
                <span>Ongoing Treatment</span>
              </button>

              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleTreatmentStatusChange('Finished')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  (b.treatment_status || '').toLowerCase() === 'finished'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-1 shadow-xs'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Finish Treatment</span>
              </button>
            </div>

            {/* Discreet Secondary Actions (Cancel / Remove) */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => handleStatusChange('Cancelled')}
                className="text-stone-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>

              <button
                type="button"
                disabled={loadingAction}
                onClick={handleDelete}
                className="text-stone-400 hover:text-rose-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={12} />
                <span>Remove Booking</span>
              </button>
            </div>
          </div>

          {/* Card 5: Booking Activity History */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Booking Activity History</div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-900">Booking Created & Attributed</div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {b.created_at ? new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Initial creation'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${(b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'completed' || (b.status || '').toLowerCase() === 'ongoing' ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                <div>
                  <div className="font-semibold text-neutral-900">Admin Confirmation</div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {(b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'completed' || (b.status || '').toLowerCase() === 'ongoing' ? 'Confirmed by admin' : 'Awaiting confirmation'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${(b.treatment_status || '').toLowerCase() === 'finished' ? 'bg-emerald-500' : (b.treatment_status || '').toLowerCase() === 'in progress' ? 'bg-amber-400' : 'bg-stone-300'}`} />
                <div>
                  <div className="font-semibold text-neutral-900">Treatment Execution</div>
                  <div className="text-[10px] text-stone-400 font-mono">{b.treatment_status || 'Scheduled'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${b.payment_status === 'Paid' ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                <div>
                  <div className="font-semibold text-neutral-900">Payment & Settlement</div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {b.payment_status === 'Paid' ? `Paid via ${b.payment_method || 'Online'}` : 'Unsettled'}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
