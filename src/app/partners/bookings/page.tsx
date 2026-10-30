'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Search, 
  Clock, 
  Copy, 
  Check, 
  User, 
  FileText, 
  ExternalLink, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal from '../ScheduleTrackingModal';
import { supabase } from '@/lib/supabase';

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'paid' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/affiliates/stats');
      const data = await res.json();
      if (data.success && data.calendarBookings) {
        setBookings(data.calendarBookings);
      }
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime synchronization
    const channel = supabase
      .channel('partner_bookings_page_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadData();
      })
      .subscribe();

    const interval = setInterval(loadData, 8000);

    const onFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadData();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const handleCopy = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = bookings.length;
    let approvedTotal = 0;
    let pendingTotal = 0;
    let paidTotal = 0;

    for (const b of bookings) {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      if (isCancelled) continue;
      const amt = b.commission_amount || 0;
      if (b.commission_status === 'paid') {
        paidTotal += amt;
      } else if (b.commission_status === 'approved') {
        approvedTotal += amt;
      } else {
        pendingTotal += amt;
      }
    }

    return { total, approvedTotal, pendingTotal, paidTotal };
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (b.guest_name || '').toLowerCase().includes(q);
        const matchesId = (b.booking_id || '').toLowerCase().includes(q);
        const matchesTreatment = (b.treatment_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesTreatment) return false;
      }

      // 2. Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'cancelled') {
        return b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      }
      if (statusFilter === 'paid') {
        return b.commission_status === 'paid';
      }
      if (statusFilter === 'approved') {
        return b.commission_status === 'approved';
      }
      if (statusFilter === 'pending') {
        return b.commission_status === 'pending' || (!b.commission_status && b.booking_status !== 'Cancelled');
      }
      return true;
    });
  }, [bookings, search, statusFilter]);

  return (
    <div className="space-y-6 w-full font-sans antialiased pb-16">
      
      {/* ─── Top Header Toolbar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ebebeb]">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
            Partner Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#171717] tracking-tight">
            Bookings
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Track guest appointments, treatments, and commissions in real time
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            loadData();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#ebebeb] bg-white text-xs font-mono text-[#171717] hover:bg-[#fafafa] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
          title="Refresh bookings"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-[6px] bg-white border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">
            Total Bookings
          </span>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums">
            {metrics.total}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            All referred appointments
          </span>
        </div>

        <div className="p-4 rounded-[6px] bg-white border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
              Approved
            </span>
          </div>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums">
            {formatIDR(metrics.approvedTotal)}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            Ready for bank transfer
          </span>
        </div>

        <div className="p-4 rounded-[6px] bg-white border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
              Pending
            </span>
          </div>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums">
            {formatIDR(metrics.pendingTotal)}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            Awaiting ritual completion
          </span>
        </div>

        <div className="p-4 rounded-[6px] bg-white border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#171717] block font-semibold">
            PAID OUT
          </span>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums">
            {formatIDR(metrics.paidTotal)}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            Disbursed to bank account
          </span>
        </div>
      </div>

      {/* ─── Search and Filter Tabs ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#fafafa] p-1 rounded-[6px] border border-[#ebebeb] overflow-x-auto no-scrollbar shrink-0">
          {(['all', 'approved', 'pending', 'paid', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-medium uppercase tracking-[0.071em] font-mono transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              {s === 'paid' ? 'PAID OUT' : s}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8f8f]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest or invoice..."
            className="w-full h-8 pl-9 pr-3 rounded-[6px] bg-white border border-[#ebebeb] text-xs text-[#171717] placeholder:text-[#8f8f8f] focus:outline-none focus:border-[#171717] transition-colors"
          />
        </div>
      </div>

      {/* ─── Bookings List / Grid ─── */}
      {loading ? (
        <div className="p-16 text-center rounded-[6px] bg-white border border-[#ebebeb] space-y-3">
          <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-[#666666]">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 text-center rounded-[6px] bg-[#fafafa] border border-dashed border-[#ebebeb] p-6 space-y-2">
          <Calendar size={24} className="mx-auto text-[#a8a8a8]" />
          <p className="text-sm font-semibold text-[#171717]">No bookings found</p>
          <p className="text-xs text-[#666666] max-w-sm mx-auto leading-relaxed">
            {search.trim() 
              ? 'No bookings match your search query.' 
              : 'Referred guest bookings will appear here automatically when guests book with your link or QR code.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
            const isPaidOut = b.commission_status === 'paid';

            return (
              <div
                key={b.id || b.booking_id}
                className="p-4 rounded-[6px] bg-white border border-[#ebebeb] space-y-3 hover:border-[#171717]/40 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                {/* Top Row: PAID OUT label + Track Schedule button + Invoice ID */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* ONLY commission paid out has a label in capital letters */}
                    {isPaidOut && (
                      <span className="font-mono text-[10px] font-semibold text-white bg-[#171717] px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                        PAID OUT
                      </span>
                    )}

                    {/* Single-click button to track book schedule */}
                    <button
                      type="button"
                      onClick={() => setTrackingBooking(b)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#171717] bg-[#fafafa] hover:bg-[#f0f0f0] border border-[#ebebeb] rounded-[6px] transition-colors cursor-pointer shadow-2xs"
                      title="Track appointment schedule and status history"
                    >
                      <Clock size={12} className="text-[#666666]" />
                      <span>Track Schedule</span>
                    </button>
                  </div>

                  {/* Invoice Code with Copy */}
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.071em] text-[#666666]">
                      Invoice:
                    </span>
                    <span className="font-mono text-xs font-bold text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                      #{b.booking_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(b.booking_id)}
                      className="text-[#666666] hover:text-[#171717] transition-colors p-1 rounded hover:bg-[#fafafa] cursor-pointer"
                      title="Copy invoice code"
                    >
                      {copiedId === b.booking_id ? <Check size={12} className="text-[#297a3a]" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Middle Row: Customer Name & Treatment Details link */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="font-medium text-sm text-[#171717] flex items-center gap-1.5 min-w-0">
                    <User size={14} className="text-[#666666] shrink-0" />
                    <span className="truncate">{b.guest_name || 'Guest Booking'}</span>
                  </div>

                  <Link
                    href={`/invoice/${b.booking_id}`}
                    target="_blank"
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#171717] hover:text-black py-0.5 cursor-pointer shrink-0"
                    title="View treatment details in invoice"
                  >
                    <FileText size={12} className="text-[#666666] group-hover:text-[#171717] transition-colors shrink-0" />
                    <span className="underline decoration-[#ebebeb] group-hover:decoration-[#171717] underline-offset-2 transition-colors">
                      View Treatment Details
                    </span>
                    <ExternalLink size={10} className="text-[#666666] group-hover:text-[#171717] transition-colors shrink-0" />
                  </Link>
                </div>

                {/* Bottom Row: Treatment Amount vs Earned Commission */}
                <div className="pt-2.5 border-t border-[#ebebeb] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-medium text-[#666666] block">
                      Treatment
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-[13px] text-[#171717] tabular-nums">
                      {formatIDR(b.treatment_amount || b.gross_amount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase font-medium text-[#297a3a] block">
                      Earned
                    </span>
                    <span className={`font-mono font-bold text-xs sm:text-[13px] tabular-nums ${isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}`}>
                      {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Schedule Tracking History Modal ─── */}
      <ScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

    </div>
  );
}
