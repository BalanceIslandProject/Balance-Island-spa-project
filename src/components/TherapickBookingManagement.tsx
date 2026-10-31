'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, 
  Search, 
  ChevronRight, 
  ChevronDown,
  X, 
  Plus,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';
import AdminScheduleTrackingModal from '@/components/admin/AdminScheduleTrackingModal';

export interface Booking {
  id: string;
  reference_number?: string;
  guest_name?: string;
  brand?: string;
  created_at: string;
  booking_date: string; // YYYY-MM-DD
  time: string;
  treatment_name: string;
  pax: number;
  therapists_count: number;
  revenue: number;
  therapist_fee_total: number;
  net_profit: number;
  status?: string; // 'Pending' | 'Approved' | 'Confirmed' | 'Cancelled' | 'Ongoing' | 'Completed'
  treatment_status?: string; // 'Scheduled' | 'Therapist Assigned' | 'On the Way' | 'Arrived' | 'In Progress' | 'Finished' | 'No Show'
  payment_status?: string; // 'Unpaid' | 'Partially Paid' | 'Paid' | 'Refunded' | 'Payment Failed'
  payment_method?: string; // 'Cash' | 'Online'
  source?: string; // 'Direct' or partner code
  affiliate_code?: string;
  items?: any[];
  commission?: any;
  location?: string;
  room_number?: string;
  guest_whatsapp?: string;
  guest_email?: string;
}

export type BookingDisplayStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

// Classify any booking into the 4 standard display statuses from design
export const getBookingDisplayStatus = (b: Booking): BookingDisplayStatus => {
  const bStat = (b.status || '').toLowerCase().trim();
  const tStat = (b.treatment_status || '').toLowerCase().trim();

  if (bStat === 'cancelled' || tStat === 'no show') {
    return 'cancelled';
  }
  if (tStat === 'finished' || bStat === 'completed') {
    return 'completed';
  }
  if (
    tStat === 'in progress' || 
    tStat === 'arrived' || 
    tStat === 'on the way' || 
    bStat === 'ongoing'
  ) {
    return 'in_progress';
  }
  return 'upcoming';
};

// Safe date formatting helper
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
  } catch {
    // fallback
  }
  return String(rawDate);
};

const formatDateShort = (rawDate: string | undefined | null) => {
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
  } catch {
    // fallback
  }
  return String(rawDate);
};

// Extract duration string from treatment title or item
const extractDuration = (booking: Booking): string => {
  if (booking.items && Array.isArray(booking.items) && booking.items[0]?.duration) {
    const d = booking.items[0].duration;
    return String(d).includes('min') || String(d).includes('hour') ? d : `${d} min`;
  }
  const match = (booking.treatment_name || '').match(/\(([^)]+)\)/);
  if (match) {
    return match[1];
  }
  return '90 min';
};

export default function TherapickBookingManagement({ 
  treatments = [], 
  therapistFees = [] 
}: { 
  treatments?: Treatment[], 
  therapistFees?: TherapistFee[] 
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);

  // Date Range Filter (Start From & End Logic)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePreset, setDatePreset] = useState<string>('all');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, commissionsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('brand', 'therapick')
          .order('booking_date', { ascending: false }),
        supabase
          .from('affiliate_commissions')
          .select('*'),
      ]);

      const data = bookingsRes.data || [];
      const comms = commissionsRes.data || [];

      // Map commissions by uppercase booking ID
      const commMap = new Map<string, any>();
      comms.forEach((c: any) => {
        if (c.booking_id) {
          commMap.set(String(c.booking_id).trim().toUpperCase(), c);
        }
      });

      const merged: Booking[] = data.map((b: any) => {
        const ref = String(b.reference_number || b.id || '').trim().toUpperCase();
        const c = commMap.get(ref);

        let paymentStatus = b.payment_status || (c?.payment_verified ? 'Paid' : 'Unpaid');
        if (c?.payment_verified && paymentStatus === 'Unpaid') {
          paymentStatus = 'Paid';
        }
        let paymentMethod = b.payment_method || (c?.notes?.toLowerCase().includes('online') ? 'Online' : 'Cash');
        let treatmentStatus = b.treatment_status || (c?.service_completed ? 'Finished' : (b.status === 'Ongoing' ? 'In Progress' : 'Scheduled'));
        let bookingStatus = b.status || 'Pending';

        return {
          ...b,
          status: bookingStatus,
          treatment_status: treatmentStatus,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          commission: c,
        };
      });

      setBookings(merged);

      if (trackingBooking) {
        const updated = merged.find(x => x.id === trackingBooking.id);
        if (updated) setTrackingBooking(updated);
      }
    } catch (e) {
      console.error('Error loading Therapick bookings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('admin_bookings_realtime_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update Booking Status
  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, booking_status: newStatus }),
      });
    } catch (e) {
      console.error('API update failed:', e);
    }
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    if (trackingBooking && trackingBooking.id === id) {
      setTrackingBooking(prev => prev ? { ...prev, status: newStatus } : null);
    }
    fetchBookings();
  };

  // Update Treatment Progress Status
  const updateTreatmentStatus = async (id: string, newStatus: string) => {
    const booking = bookings.find(b => b.id === id);
    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, treatment_status: newStatus }),
      });
    } catch (e) {
      console.error('API treatment update failed:', e);
    }
    await supabase.from('bookings').update({ treatment_status: newStatus }).eq('id', id);
    const ref = booking?.reference_number || booking?.id;
    if (ref) {
      await supabase.from('affiliate_commissions').update({
        service_completed: newStatus === 'Finished',
        updated_at: new Date().toISOString(),
      }).ilike('booking_id', ref);
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, treatment_status: newStatus } : b));
    if (trackingBooking && trackingBooking.id === id) {
      setTrackingBooking(prev => prev ? { ...prev, treatment_status: newStatus } : null);
    }
    fetchBookings();
  };

  // Update Payment Status
  const updatePaymentStatus = async (id: string, newStatus: string, method?: string) => {
    const booking = bookings.find(b => b.id === id);
    const chosenMethod = method || booking?.payment_method || 'Cash';
    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          booking_id: id, 
          payment_status: newStatus, 
          payment_method: chosenMethod 
        }),
      });
    } catch (e) {
      console.error('API payment update failed:', e);
    }
    await supabase.from('bookings').update({ 
      payment_status: newStatus, 
      payment_method: chosenMethod 
    }).eq('id', id);
    const ref = booking?.reference_number || booking?.id;
    if (ref) {
      await supabase.from('affiliate_commissions').update({
        payment_verified: newStatus === 'Paid',
        notes: newStatus === 'Paid' ? `Paid via ${chosenMethod}` : newStatus,
        updated_at: new Date().toISOString(),
      }).ilike('booking_id', ref);
    }
    setBookings(prev => prev.map(b => b.id === id ? { 
      ...b, 
      payment_status: newStatus, 
      payment_method: chosenMethod 
    } : b));
    if (trackingBooking && trackingBooking.id === id) {
      setTrackingBooking(prev => prev ? { ...prev, payment_status: newStatus, payment_method: chosenMethod } : null);
    }
    fetchBookings();
  };

  // Preset Date Handlers
  const formatDateYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSetToday = () => {
    const today = formatDateYMD(new Date());
    setStartDate(today);
    setEndDate(today);
    setDatePreset('today');
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateYMD(firstDay));
    setEndDate(formatDateYMD(lastDay));
    setDatePreset('this_month');
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  };

  const hasDateFilter = Boolean(startDate || endDate);

  // Status Counts
  const counts = useMemo(() => {
    let upcoming = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    for (const b of bookings) {
      const s = getBookingDisplayStatus(b);
      if (s === 'upcoming') upcoming++;
      else if (s === 'in_progress') inProgress++;
      else if (s === 'completed') completed++;
      else if (s === 'cancelled') cancelled++;
    }

    return {
      all: bookings.length,
      upcoming,
      in_progress: inProgress,
      completed,
      cancelled,
    };
  }, [bookings]);

  // Combined Filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const s = getBookingDisplayStatus(b);
        if (s !== statusFilter) return false;
      }

      // 2. Search Query (Guest, booking ID, or treatment)
      if (search.trim()) {
        const q = search.toLowerCase();
        const guest = (b.guest_name || '').toLowerCase();
        const ref = (b.reference_number || b.id || '').toLowerCase();
        const treatment = (b.treatment_name || '').toLowerCase();
        if (!guest.includes(q) && !ref.includes(q) && !treatment.includes(q)) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (startDate || endDate) {
        if (!b.booking_date) return false;
        const bDate = b.booking_date.trim();
        if (startDate && bDate < startDate) return false;
        if (endDate && bDate > endDate) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, search, startDate, endDate]);

  // Render Status Pill
  const renderStatusPill = (status: BookingDisplayStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Progress
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Upcoming
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 w-full font-sans antialiased">
      
      {/* ═══════════════════════════════════════════════════════════════
          TOP CONTROLS: COMPACT STATUS FILTERS + SEARCH & DATE
         ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        
        {/* Status Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {[
            { key: 'all' as const, label: 'All', count: counts.all },
            { key: 'upcoming' as const, label: 'Upcoming', count: counts.upcoming },
            { key: 'in_progress' as const, label: 'In Progress', count: counts.in_progress },
            { key: 'completed' as const, label: 'Completed', count: counts.completed },
            { key: 'cancelled' as const, label: 'Cancelled', count: counts.cancelled },
          ].map(({ key, label, count }) => {
            const isSelected = statusFilter === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                  isSelected
                    ? 'bg-[#fed700] text-slate-900 font-bold shadow-xs'
                    : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-700'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[11px] font-mono ${isSelected ? 'opacity-90 font-bold' : 'opacity-60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Compact Search + Date Filter */}
        <div className="flex items-center gap-2 relative">
          
          {/* Search Field */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest, code, treatment..."
              className="w-full h-9.5 pl-9 pr-3 rounded-xl bg-white border border-stone-200 text-xs text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 shadow-2xs transition-all"
            />
          </div>

          {/* Date Filter Button */}
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`h-9.5 px-3.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              hasDateFilter || showDatePicker
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <CalendarIcon size={13} />
            <span>
              {hasDateFilter 
                ? (startDate === endDate ? safeFormatDate(startDate) : `${startDate} → ${endDate}`) 
                : 'All dates'}
            </span>
          </button>

          {/* Date Picker Dropdown Panel (Start From and End Logic) */}
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-[#eaecf0] rounded-2xl p-4 shadow-xl z-30 space-y-3.5 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 uppercase font-mono tracking-wider">
                  Filter by Date
                </span>
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={handleClearDateFilter}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <X size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Start From & End Logic Inputs */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-500 font-mono mb-1">
                    Start From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full h-9 px-3 bg-stone-50/50 border border-stone-200 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-500 font-mono mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full h-9 px-3 bg-stone-50/50 border border-stone-200 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer ${
                    datePreset === 'today' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer ${
                    datePreset === 'this_month' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer ${
                    !hasDateFilter ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  All dates
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOOKINGS LIST: DESKTOP TABLE & MOBILE CARDS
         ═══════════════════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-[#eaecf0] space-y-3 shadow-2xs">
          <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-stone-500">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-stone-200 p-6 space-y-2.5 shadow-2xs">
          <CalendarIcon size={28} className="mx-auto text-stone-400" />
          <p className="text-sm font-bold text-neutral-900">No bookings found</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            {search.trim() || hasDateFilter || statusFilter !== 'all'
              ? 'No bookings match your current filter criteria.'
              : 'Bookings will appear here automatically when guests book appointments.'}
          </p>
          {(hasDateFilter || statusFilter !== 'all' || search.trim()) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearch('');
                handleClearDateFilter();
              }}
              className="mt-2 text-xs font-mono font-bold text-neutral-900 underline hover:opacity-75 cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ─── DESKTOP BOOKINGS TABLE (>= 768px) ─── */}
          <div className="hidden md:block bg-white border border-[#eaecf0] rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fcfbf9] border-b border-[#eaecf0] text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Guest</th>
                  <th className="py-3.5 px-5 font-bold">Treatment</th>
                  <th className="py-3.5 px-5 font-bold">Date & Time</th>
                  <th className="py-3.5 px-5 font-bold">Status</th>
                  <th className="py-3.5 px-5 text-right w-12" aria-label="Action" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBookings.map((b) => {
                  const displayStatus = getBookingDisplayStatus(b);
                  const duration = extractDuration(b);
                  const refId = b.reference_number || (b.id ? `#${b.id.slice(0, 8).toUpperCase()}` : '#TRP');

                  return (
                    <tr 
                      key={b.id}
                      onClick={() => setTrackingBooking(b)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Guest Column: Name & Booking ID */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-sm text-neutral-900 group-hover:text-black">
                          {b.guest_name || 'Guest'}
                        </div>
                        <div className="text-xs text-stone-600 font-mono mt-0.5">
                          {refId}
                        </div>
                      </td>

                      {/* Treatment Column: Name & Duration */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-sm text-neutral-900">
                          {b.treatment_name || 'Spa Ritual'}
                        </div>
                        <div className="text-xs text-stone-600 mt-0.5">
                          {duration}
                        </div>
                      </td>

                      {/* Date & Time Column */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="font-medium text-sm text-neutral-900">
                          {safeFormatDate(b.booking_date)}
                        </div>
                        <div className="text-xs text-stone-600 font-mono mt-0.5">
                          {b.time || '10:00'}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {renderStatusPill(displayStatus)}
                      </td>

                      {/* Action: Chevron Right */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <ChevronRight 
                          size={16} 
                          className="text-stone-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all inline-block" 
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── MOBILE BOOKING CARDS (< 768px) ─── */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((b) => {
              const displayStatus = getBookingDisplayStatus(b);
              const duration = extractDuration(b);
              const refId = b.reference_number || (b.id ? `#${b.id.slice(0, 8).toUpperCase()}` : '#TRP');

              return (
                <div
                  key={b.id}
                  onClick={() => setTrackingBooking(b)}
                  className="bg-white border border-[#eaecf0] rounded-2xl p-4 shadow-2xs space-y-2.5 transition-all cursor-pointer active:scale-[0.99] hover:border-stone-300"
                >
                  {/* Top Row: Guest Name + Date Time + Chevron */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-neutral-900 truncate">
                      {b.guest_name || 'Guest'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 text-xs text-stone-600 font-medium">
                      <span>{formatDateShort(b.booking_date)} {b.time || ''}</span>
                      <ChevronRight size={14} className="text-stone-400" />
                    </div>
                  </div>

                  {/* Middle: Booking ID */}
                  <div className="text-xs text-stone-600 font-mono -mt-1">
                    {refId}
                  </div>

                  {/* Bottom Row: Treatment & Duration + Status Pill */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-50">
                    <span className="text-xs text-stone-600 truncate max-w-[190px]">
                      {b.treatment_name || 'Spa Ritual'} · {duration}
                    </span>
                    <div className="shrink-0">
                      {renderStatusPill(displayStatus)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── Admin Schedule Tracking & Status Modal ─── */}
      <AdminScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
        onUpdateBookingStatus={updateBookingStatus}
        onUpdateTreatmentStatus={updateTreatmentStatus}
        onUpdatePaymentStatus={updatePaymentStatus}
      />

    </div>
  );
}
