'use client';

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  Layers, 
  Users, 
  Globe, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Calendar,
  Trash2,
  Check,
  Ban
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

export default function TherapickBookingDrawer() {
  const { 
    selectedBooking, 
    setSelectedBooking, 
    updateBookingStatus, 
    updateTreatmentStatus, 
    updatePaymentStatus,
    deleteBooking,
    system
  } = useTherapickAdmin();

  const [loadingAction, setLoadingAction] = useState(false);

  if (!selectedBooking) return null;

  const b = selectedBooking;
  const isAffiliate = Boolean(b.affiliate_code || b.commission);
  const commAmount = b.commission?.commission_amount ? Number(b.commission.commission_amount) : (isAffiliate ? Number(b.revenue || 0) * 0.15 : 0);
  const therapistFee = Number(b.therapist_fee_total || 0);
  const netProfit = Number(b.revenue || 0) - therapistFee - commAmount;

  // Customer Data extraction
  const guestName = b.guest_name || (b as any).customer_name || (b as any).name || 'Guest';
  const guestPhone = b.guest_whatsapp || (b as any).customer_phone || (b as any).phone || '';
  const guestEmail = b.guest_email || (b as any).customer_email || (b as any).email || '';
  const location = b.location || (b as any).villa_address || (b as any).address || '';
  const roomNumber = b.room_number || (b as any).villa_number || (b as any).room || '';
  const notes = b.notes || b.special_requests || (b as any).additional_notes || '';

  // WhatsApp quick link
  const waPhone = guestPhone.replace(/[^0-9]/g, '');
  const cleanPhone = waPhone.startsWith('0') ? '62' + waPhone.slice(1) : waPhone;
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(guestName)}%2C%20regarding%20your%20Therapick%20booking%20%23${b.reference_number || b.id.slice(0, 8)}...` : null;

  const isWebsiteSystem = system === 'website';

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
      await updateTreatmentStatus(b.id, newStatus);
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePaymentChange = async (newStatus: string) => {
    setLoadingAction(true);
    try {
      await updatePaymentStatus(b.id, newStatus);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently remove booking #${b.reference_number || b.id.slice(0, 8)}? This action cannot be undone.`)) {
      return;
    }
    setLoadingAction(true);
    try {
      await deleteBooking(b.id);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity" 
        onClick={() => setSelectedBooking(null)}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200/80 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-stone-500 uppercase">
                #{b.reference_number || b.id.slice(0, 8)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                (b.status || '').toLowerCase() === 'confirmed'
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
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Treatment & Schedule + Full Customer Data Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-4 shadow-2xs">
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
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Service</span>
                <span className="font-bold text-neutral-900 text-right">{b.treatment_name || 'Signature Ritual'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Date & Time</span>
                <span className="font-semibold text-neutral-900">{b.booking_date} at {b.time}</span>
              </div>
            </div>

            {/* Fully Integrated Customer Data */}
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
                    WhatsApp / Phone
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-900">{guestPhone}</span>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition-colors"
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
                  <span className="text-stone-400 block text-[10px] uppercase font-mono mb-1">Notes / Special Requests</span>
                  <p className="text-neutral-700 bg-stone-50 rounded-lg p-2 text-[11px] leading-relaxed">{notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attribution Source */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Booking Source</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAffiliate ? (
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Users size={14} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Globe size={14} />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    {isAffiliate ? ((b as any).partner_info?.business || (b as any).partner_name || b.affiliate_code || 'Affiliate Partner') : 'Direct Website Booking'}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {isAffiliate ? `Referral Code: ${b.affiliate_code || 'YES'}` : 'booktherapick.com'}
                  </div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isAffiliate ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
              }`}>
                {isAffiliate ? 'Affiliate Attributed' : 'Website Direct'}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-stone-50/80 border border-stone-200/70 rounded-2xl p-4.5 space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Financial Breakdown</div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Booking Revenue</span>
                <span className="font-bold text-neutral-900">{formatIDR(b.revenue)}</span>
              </div>
              <div className="flex items-center justify-between text-rose-600">
                <span>Therapist Fee Total</span>
                <span>- {formatIDR(therapistFee)}</span>
              </div>
              {isAffiliate && (
                <div className="flex items-center justify-between text-amber-700">
                  <span>Partner Commission (15%)</span>
                  <span>- {formatIDR(commAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-neutral-950">
                <span>Net Profit</span>
                <span className="text-emerald-700">{formatIDR(netProfit)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">Payment Status</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800'
              }`}>
                {b.payment_status || 'Unpaid'} ({b.payment_method || 'Online'})
              </span>
            </div>
          </div>

          {/* Operational Actions */}
          {isWebsiteSystem ? (
            /* WEBSITE SYSTEM: ONLY Confirmed, Cancel, and Remove */
            <div className="pt-3 border-t border-stone-200 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleStatusChange('Confirmed')}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Confirm Booking</span>
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleStatusChange('Cancelled')}
                  className="py-2.5 px-3 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  <span>Cancel Booking</span>
                </button>
              </div>

              <button
                type="button"
                disabled={loadingAction}
                onClick={handleDelete}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Remove Booking</span>
              </button>
            </div>
          ) : (
            /* AFFILIATE SYSTEM: Full Live UPDATE BOOKING STATE */
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Update Booking State</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleStatusChange('Confirmed')}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark Confirmed
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleTreatmentStatusChange('In Progress')}
                  className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleTreatmentStatusChange('Finished')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleStatusChange('Cancelled')}
                  className="py-2.5 px-3 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel Booking
                </button>
              </div>

              {b.payment_status !== 'Paid' && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handlePaymentChange('Paid')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Verify Payment as Paid
                </button>
              )}

              <button
                type="button"
                disabled={loadingAction}
                onClick={handleDelete}
                className="w-full py-2 text-stone-400 hover:text-rose-600 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={12} />
                <span>Remove Booking</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
