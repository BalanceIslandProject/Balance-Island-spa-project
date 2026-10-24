'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink,
  RotateCcw,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { CalendarBooking } from './FloatingBookingCalendar';

interface PartnerCommissionFilterCardProps {
  bookings: CalendarBooking[];
  className?: string;
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
        return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' });
    }
  } catch {
    // fallback
  }
  return String(rawDate);
};

export default function PartnerCommissionFilterCard({
  bookings = [],
  className = '',
}: PartnerCommissionFilterCardProps) {
  // Determine default date range: This month (e.g., 2026-10-01 to 2026-10-31)
  const defaultDates = useMemo(() => {
    // Check if there are bookings to infer active month, otherwise current calendar month
    let refDate = new Date();
    if (bookings.length > 0) {
      const validDateBookings = bookings
        .map((b) => (b.date ? (b.date.includes('T') ? b.date.split('T')[0] : b.date) : ''))
        .filter(Boolean);
      if (validDateBookings.length > 0) {
        const latest = validDateBookings.sort().reverse()[0];
        const [y, m] = latest.split('-').map(Number);
        if (y && m) {
          refDate = new Date(y, m - 1, 1);
        }
      }
    }

    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }, [bookings]);

  const [startDate, setStartDate] = useState<string>(defaultDates.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.end);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'cancelled'>('all');

  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

  const handleCopyBooking = (bId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bId);
      setCopiedId(bId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter bookings by date range
  const dateFilteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const raw = b.date ? (b.date.includes('T') ? b.date.split('T')[0] : b.date) : '';
      if (!raw) return false;
      if (startDate && raw < startDate) return false;
      if (endDate && raw > endDate) return false;
      return true;
    });
  }, [bookings, startDate, endDate]);

  // Apply optional status pill filter
  const displayedBookings = useMemo(() => {
    if (statusFilter === 'all') return dateFilteredBookings;
    return dateFilteredBookings.filter((b) => {
      if (statusFilter === 'approved') return b.commission_status === 'approved';
      if (statusFilter === 'pending') return b.commission_status === 'pending';
      if (statusFilter === 'cancelled') {
        return b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      }
      return true;
    });
  }, [dateFilteredBookings, statusFilter]);

  // Aggregate stats for the selected date range
  const periodStats = useMemo(() => {
    let totalComm = 0;
    let approvedComm = 0;
    let pendingComm = 0;

    for (const b of dateFilteredBookings) {
      const isCanc = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const comm = Number(b.commission_amount || 0);

      if (!isCanc) {
        totalComm += comm;
      }
      if (b.commission_status === 'approved') {
        approvedComm += comm;
      } else if (b.commission_status === 'pending') {
        pendingComm += comm;
      }
    }

    return {
      count: dateFilteredBookings.length,
      totalCommission: totalComm,
      approvedCommission: approvedComm,
      pendingCommission: pendingComm,
    };
  }, [dateFilteredBookings]);

  // Quick preset handlers
  const handleSetThisMonth = () => {
    setStartDate(defaultDates.start);
    setEndDate(defaultDates.end);
  };

  const handleSetLast7Days = () => {
    const today = new Date();
    const past7 = new Date();
    past7.setDate(today.getDate() - 6);
    const formatYMD = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(formatYMD(past7));
    setEndDate(formatYMD(today));
  };

  const handleSetLast30Days = () => {
    const today = new Date();
    const past30 = new Date();
    past30.setDate(today.getDate() - 29);
    const formatYMD = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(formatYMD(past30));
    setEndDate(formatYMD(today));
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasCustomRange = Boolean(startDate || endDate);

  return (
    <div
      className={`bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[28px] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] space-y-4 ${className}`}
    >
      {/* 1. Header with Commission Section Title & Link to Ledger */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100/80">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-neutral-950 text-white flex items-center justify-center shadow-2xs">
              <Receipt size={14} />
            </div>
            <h3 className="font-extrabold text-neutral-950 text-base tracking-tight">
              Commission Ledger
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Filter commissions and attributed earnings by date range
          </p>
        </div>

        <Link
          href="/partners/commissions"
          className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:underline flex items-center gap-0.5 transition-colors"
        >
          <span>Ledger</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* 2. Calendar Date Range Filter Controls */}
      <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-2xl p-3.5 space-y-3 shadow-2xs">
        {/* Preset Range Pills */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSetThisMonth}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                startDate === defaultDates.start && endDate === defaultDates.end
                  ? 'bg-neutral-950 text-white shadow-2xs'
                  : 'bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200/80'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={handleSetLast7Days}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200/80 transition-all cursor-pointer"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={handleSetLast30Days}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200/80 transition-all cursor-pointer"
            >
              Last 30 Days
            </button>
          </div>

          {hasCustomRange && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
              title="Show all bookings"
            >
              <RotateCcw size={11} />
              <span>All Time</span>
            </button>
          )}
        </div>

        {/* Date Inputs: From & To */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 block">
              From Date
            </label>
            <div className="relative flex items-center">
              <CalendarIcon size={13} className="absolute left-2.5 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-mono font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 focus:border-neutral-950 shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 block">
              To Date
            </label>
            <div className="relative flex items-center">
              <CalendarIcon size={13} className="absolute left-2.5 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-mono font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 focus:border-neutral-950 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Active Range Period Summary Label */}
        <div className="flex items-center justify-between text-[11px] pt-0.5 text-neutral-500 font-medium">
          <span className="truncate">
            {startDate && endDate ? (
              <>
                Period: <strong className="text-neutral-900">{safeFormatDate(startDate)}</strong> –{' '}
                <strong className="text-neutral-900">{safeFormatDate(endDate)}</strong>
              </>
            ) : startDate ? (
              <>
                From <strong className="text-neutral-900">{safeFormatDate(startDate)}</strong> onwards
              </>
            ) : endDate ? (
              <>
                Up to <strong className="text-neutral-900">{safeFormatDate(endDate)}</strong>
              </>
            ) : (
              <span>Showing all recorded commissions</span>
            )}
          </span>

          <span className="font-mono font-bold text-neutral-900 shrink-0 ml-2">
            {periodStats.count} {periodStats.count === 1 ? 'Booking' : 'Bookings'}
          </span>
        </div>
      </div>

      {/* 3. Aggregated Commission Cards for the Range */}
      <div className="space-y-2.5">
        {/* Big Total in Range */}
        <div className="p-4 rounded-2xl bg-neutral-950 text-white flex items-center justify-between gap-3 shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
              Period Commission
            </span>
            <div className="text-2xl font-black font-mono tracking-tight tabular-nums mt-0.5 text-white">
              +{formatIDR(periodStats.totalCommission)}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 block">Attributed</span>
            <span className="text-xs font-mono font-bold text-neutral-200">
              {periodStats.count} Total
            </span>
          </div>
        </div>

        {/* Side-by-side Approved & Pending in Range */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Approved Card */}
          <div className="flex items-center justify-between gap-2 bg-white text-neutral-950 px-3.5 py-2.5 rounded-xl border border-neutral-200/90 shadow-2xs font-semibold">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-neutral-500 font-medium text-xs">Approved</span>
            </div>
            <span className="font-mono font-bold text-neutral-950 text-xs sm:text-sm tabular-nums whitespace-nowrap shrink-0">
              {formatIDR(periodStats.approvedCommission)}
            </span>
          </div>

          {/* Pending Card */}
          <div className="flex items-center justify-between gap-2 bg-neutral-900 text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 shadow-2xs font-semibold">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-neutral-300 font-medium text-xs">Pending</span>
            </div>
            <span className="font-mono font-bold text-white text-xs sm:text-sm tabular-nums whitespace-nowrap shrink-0">
              {formatIDR(periodStats.pendingCommission)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Filter Pills & Booking Cards List */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {(['all', 'approved', 'pending', 'cancelled'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === mode
                    ? 'bg-neutral-950 text-white shadow-2xs font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200/70 font-medium'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-neutral-400 font-mono">
            {displayedBookings.length} {displayedBookings.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Scrollable list of bookings for the selected range */}
        {displayedBookings.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-[#FBFBFD] border border-dashed border-neutral-200/80 p-4 space-y-1.5">
            <CalendarIcon size={24} className="mx-auto text-neutral-300 mb-0.5" />
            <p className="text-xs font-bold text-neutral-800">No commissions in this range</p>
            <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Select a broader date range or click &ldquo;This Month&rdquo; to view your active commissions.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {displayedBookings.map((b) => {
              const isApproved = b.commission_status === 'approved';
              const isCancelled =
                b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
              const isPaid = b.payment_status === 'paid' || b.payment_verified;

              return (
                <div
                  key={b.id || b.booking_id}
                  className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-neutral-200/80 space-y-2 hover:border-neutral-300 transition-colors shadow-2xs"
                >
                  {/* Row 1: Invoice Code + Status Pills + Commission */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyBooking(b.booking_id)}
                        className="font-mono text-xs font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 hover:bg-neutral-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Copy booking ID"
                      >
                        <span>#{b.booking_id}</span>
                        {copiedId === b.booking_id ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} className="text-neutral-400" />
                        )}
                      </button>

                      {isPaid ? (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-200">
                          Paid
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200">
                          Unpaid
                        </span>
                      )}

                      {isApproved ? (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                          Approved
                        </span>
                      ) : isCancelled ? (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Cancelled
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-200/70 px-1.5 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'
                        }`}
                      >
                        {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Guest Name, Treatment, Date */}
                  <div className="flex items-center justify-between text-xs pt-0.5 gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-neutral-900 flex items-center gap-1 truncate">
                        <User size={12} className="text-neutral-400 shrink-0" />
                        <span className="truncate">{b.guest_name || 'Guest Booking'}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {b.treatment_name || 'Spa Treatment'}
                      </p>
                    </div>

                    <div className="text-right shrink-0 text-[11px] text-neutral-500 font-medium">
                      <div>{safeFormatDate(b.date, { day: 'numeric', month: 'short' })}</div>
                      {b.time && <div className="text-[10px] text-neutral-400">{b.time}</div>}
                    </div>
                  </div>

                  {/* Row 3: Link to Invoice */}
                  <div className="pt-1 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">
                      Earned: {b.commission_rate_pct || 15}%
                    </span>
                    <Link
                      href={`/invoice/${b.booking_id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                    >
                      <span>View Invoice</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
