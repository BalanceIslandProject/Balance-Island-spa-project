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
  Calendar
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { Booking } from '@/components/TherapickBookingManagement';

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
    updatePaymentStatus 
  } = useTherapickAdmin();

  const [loadingAction, setLoadingAction] = useState(false);

  if (!selectedBooking) return null;

  const b = selectedBooking;
  const isAffiliate = Boolean(b.affiliate_code || b.commission);
  const commAmount = b.commission?.commission_amount ? Number(b.commission.commission_amount) : (isAffiliate ? Number(b.revenue || 0) * 0.15 : 0);
  const therapistFee = Number(b.therapist_fee_total || 0);
  const netProfit = Number(b.revenue || 0) - therapistFee - commAmount;

  // WhatsApp quick link
  const waPhone = (b.guest_whatsapp || '').replace(/[^0-9]/g, '');
  const cleanPhone = waPhone.startsWith('0') ? '62' + waPhone.slice(1) : waPhone;
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(b.guest_name || 'Guest')}%2C%20regarding%20your%20Therapick%20booking%20%23${b.reference_number || b.id.slice(0, 8)}...` : null;

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
        <div className="p-6 space-y-6">
          
          {/* Guest Information Card */}
          <div className="bg-stone-50/80 border border-stone-200/70 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Guest Information</div>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare size={12} />
                  <span>WhatsApp Guest</span>
                </a>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Name</span>
                <span className="font-bold text-neutral-900">{b.guest_name || 'Guest'}</span>
              </div>
              {b.guest_whatsapp && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">WhatsApp / Phone</span>
                  <span className="font-mono text-neutral-900">{b.guest_whatsapp}</span>
                </div>
              )}
              {b.location && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-stone-500 shrink-0">Villa / Location</span>
                  <span className="font-medium text-neutral-900 text-right">{b.location}</span>
                </div>
              )}
              {b.room_number && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Room Number</span>
                  <span className="font-mono text-neutral-900">{b.room_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Treatment & Schedule Details */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600">Treatment & Schedule</div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Service</span>
                <span className="font-bold text-neutral-900">{b.treatment_name || 'Treatment'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Date & Time</span>
                <span className="font-semibold text-neutral-900">{b.booking_date} at {b.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Party Size</span>
                <span className="font-medium text-neutral-800">{b.pax || 1} guest(s) · {b.therapists_count || 1} therapist(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Treatment Status</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200/60">
                  {b.treatment_status || 'Scheduled'}
                </span>
              </div>
            </div>
          </div>

          {/* Attribution Source */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4.5 space-y-2.5 shadow-2xs">
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
          </div>

        </div>
      </div>
    </div>
  );
}
