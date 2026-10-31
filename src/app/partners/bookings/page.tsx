'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Clock, 
  Copy, 
  Check, 
  User, 
  FileText, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight,
  List,
  LayoutGrid
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal from '../ScheduleTrackingModal';
import { supabase } from '@/lib/supabase';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Matching user's reference: Mon, Tues, Wed, Thurs, Fri, Sat, Sun
const WEEKDAY_NAMES = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'paid' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Date filtering and calendar navigation
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
  };

  const formatFriendlyDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/affiliates/stats');
      const data = await res.json();
      if (data.success && data.calendarBookings) {
        setBookings(data.calendarBookings);

        // If current month has 0 bookings, auto-focus to the latest booking's month
        if (data.calendarBookings.length > 0) {
          const dates = (data.calendarBookings as CalendarBooking[])
            .map((b) => b.date)
            .filter(Boolean)
            .sort()
            .reverse();
          if (dates.length > 0) {
            const [y, m] = dates[0].split('-').map(Number);
            if (y && m) {
              setCurrentYear(y);
              setCurrentMonth(m - 1);
            }
          }
        }
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

  // Calendar month navigation
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  };

  // Aggregate metrics summary for affiliate CRM
  const metrics = useMemo(() => {
    const total = bookings.length;
    let approvedTotal = 0;
    let pendingTotal = 0;
    let paidTotal = 0;
    let paidCount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    for (const b of bookings) {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      if (isCancelled) continue;
      const amt = b.commission_amount || 0;
      if (b.commission_status === 'paid') {
        paidTotal += amt;
        paidCount++;
      } else if (b.commission_status === 'approved') {
        approvedTotal += amt;
        approvedCount++;
      } else {
        pendingTotal += amt;
        pendingCount++;
      }
    }

    return { total, approvedTotal, pendingTotal, paidTotal, paidCount, approvedCount, pendingCount };
  }, [bookings]);

  // Calendar grid computation matching reference image
  const calendarDays = useMemo(() => {
    // Week starts on Monday: Monday = 0, ..., Sunday = 6
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Map bookings by date string (YYYY-MM-DD)
    const bookingsByDate: Record<string, CalendarBooking[]> = {};
    for (const b of bookings) {
      if (!b.date) continue;
      const dStr = b.date.trim();
      if (!bookingsByDate[dStr]) {
        bookingsByDate[dStr] = [];
      }
      bookingsByDate[dStr].push(b);
    }

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      bookings: CalendarBooking[];
      statusStyle: 'paid' | 'approved' | 'pending' | 'cancelled' | null;
    }> = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Previous month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        bookings: bookingsByDate[dStr] || [],
        statusStyle: null,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayBookings = bookingsByDate[dStr] || [];

      // Determine pill style based on bookings:
      // blue = paid, green = approved, orange = pending, red = cancelled
      let statusStyle: 'paid' | 'approved' | 'pending' | 'cancelled' | null = null;
      if (dayBookings.length > 0) {
        if (dayBookings.some((b) => b.commission_status === 'paid')) {
          statusStyle = 'paid';
        } else if (dayBookings.some((b) => b.commission_status === 'approved')) {
          statusStyle = 'approved';
        } else if (dayBookings.some((b) => b.commission_status === 'pending' || (!b.commission_status && b.booking_status !== 'Cancelled'))) {
          statusStyle = 'pending';
        } else if (dayBookings.every((b) => b.commission_status === 'cancelled' || b.booking_status === 'Cancelled')) {
          statusStyle = 'cancelled';
        }
      }

      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        bookings: dayBookings,
        statusStyle,
      });
    }

    // Next month padding to fill a complete 35 or 42 grid
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        bookings: bookingsByDate[dStr] || [],
        statusStyle: null,
      });
    }

    return cells;
  }, [currentYear, currentMonth, bookings]);

  // Current month affiliate stats
  const currentMonthStats = useMemo(() => {
    let count = 0;
    let earned = 0;
    for (const b of bookings) {
      if (!b.date) continue;
      const parts = b.date.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (y === currentYear && m === currentMonth + 1) {
          count++;
          const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
          if (!isCancelled) {
            earned += (b.commission_amount || 0);
          }
        }
      }
    }
    return { count, earned };
  }, [bookings, currentYear, currentMonth]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Calendar date filter
      if (selectedDate) {
        if (!b.date || b.date.trim() !== selectedDate) {
          return false;
        }
      }

      // 2. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (b.guest_name || '').toLowerCase().includes(q);
        const matchesId = (b.booking_id || '').toLowerCase().includes(q);
        const matchesTreatment = (b.treatment_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesTreatment) return false;
      }

      // 3. Status filter
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
  }, [bookings, search, statusFilter, selectedDate]);

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
            Appointments, treatments, and commissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[6px] border border-[#ebebeb] bg-[#fafafa] hover:bg-[#f0f0f0] text-xs font-mono text-[#666666] hover:text-[#171717] transition-colors cursor-pointer"
              title="Show all bookings"
            >
              <X size={12} />
              <span>Clear Date</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#ebebeb] bg-white text-xs font-mono text-[#171717] hover:bg-[#fafafa] transition-colors cursor-pointer shadow-2xs"
            title="Refresh bookings"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Main Content Split: Left Corner Calendar + Right Booking Details ─── */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">

        {/* ═══════════════════════════════════════════════════════════════
            LEFT CORNER: Modern Compact Calendar Widget (Matches Ref Image)
           ═══════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[280px] xl:w-[295px] shrink-0 space-y-3.5 lg:sticky lg:top-4 self-start">
          
          {/* Calendar Card Box */}
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            
            {/* Header: Prev chevron | Calendar Icon + Month Year | Next chevron */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-xl border border-[#ebebeb] bg-white hover:bg-[#fafafa] flex items-center justify-center text-[#171717] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Previous month"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>

              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-[#171717]" strokeWidth={2} />
                <span className="font-semibold text-base sm:text-[17px] text-[#171717] tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-xl border border-[#ebebeb] bg-white hover:bg-[#fafafa] flex items-center justify-center text-[#171717] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Next month"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Weekdays Row: Mon, Tues, Wed, Thurs, Fri, Sat, Sun */}
            <div className="grid grid-cols-7 gap-1 text-center py-1.5 border-b border-[#f3f4f6] mb-2.5">
              {WEEKDAY_NAMES.map((name) => (
                <span
                  key={name}
                  className="text-[11px] font-medium text-[#8f8f8f] select-none tracking-tight"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Calendar Day Grid (7 columns with Circular Date Pills) */}
            <div className="grid grid-cols-7 gap-y-2.5 gap-x-1 place-items-center">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDate === cell.dateStr;
                const hasBookings = cell.bookings.length > 0;

                // Non-current month styling
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-xs text-[#c0c0c0] font-normal select-none"
                    >
                      {cell.dayNumber}
                    </div>
                  );
                }

                // Selected Date Style (Deep Indigo / Violet with soft ring, matching day 18 in reference)
                if (isSelected) {
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      title={`${formatFriendlyDate(cell.dateStr)} (Selected - Click to clear)`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#4338ca] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center ring-4 ring-[#4338ca]/20 shadow-xs scale-105 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                // Status Circular Pills (Matching Reference Image)
                if (cell.statusStyle === 'paid') {
                  // Soft Blue (Disbursed)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Paid Out booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#e8f0fe] text-[#1967d2] font-semibold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#1967d2]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                if (cell.statusStyle === 'approved') {
                  // Soft Green (Approved)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Approved booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#e6f4ea] text-[#137333] font-semibold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#137333]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                if (cell.statusStyle === 'pending') {
                  // Soft Orange/Amber (Pending)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Pending booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#fef7e0] text-[#b06000] font-semibold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#b06000]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                if (cell.statusStyle === 'cancelled') {
                  // Soft Rose/Red (Cancelled)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Cancelled booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#fce8e6] text-[#c5221f] font-semibold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#c5221f]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                // Regular Day Number without bookings
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full text-xs sm:text-[13px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                      cell.isToday
                        ? 'border border-[#171717] font-bold text-[#171717]'
                        : 'text-[#171717] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend: 4 Colored Statuses Matching Reference Image */}
            <div className="pt-3.5 mt-3.5 border-t border-[#f3f4f6] grid grid-cols-2 gap-2 text-[11px] text-[#666666]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1967d2] shrink-0" />
                <span className="font-medium text-[#171717]">Paid Out</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#137333] shrink-0" />
                <span className="font-medium text-[#171717]">Approved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b06000] shrink-0" />
                <span className="font-medium text-[#171717]">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c5221f] shrink-0" />
                <span className="font-medium text-[#171717]">Cancelled</span>
              </div>
            </div>

            {/* Jump to Today Button */}
            <div className="mt-3 pt-2.5 border-t border-[#f3f4f6] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#8f8f8f] font-mono">
                Click date to filter
              </span>
              <button
                type="button"
                onClick={handleJumpToday}
                className="text-[11px] font-mono font-medium text-[#171717] hover:underline cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          {/* CRM Monthly Quick Performance Summary */}
          <div className="p-4 rounded-xl bg-white border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
                {MONTH_NAMES[currentMonth]} Overview
              </span>
              <span className="font-mono text-[10px] font-semibold text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                {currentMonthStats.count} {currentMonthStats.count === 1 ? 'Booking' : 'Bookings'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-[#f3f4f6]">
              <span className="text-xs text-[#666666]">Earned</span>
              <span className="font-mono font-bold text-sm text-[#297a3a] tabular-nums">
                +{formatIDR(currentMonthStats.earned)}
              </span>
            </div>

            {selectedDate && (
              <div className="pt-2 border-t border-[#f3f4f6] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#666666] truncate">
                  Filtered: <strong className="text-[#171717]">{formatFriendlyDate(selectedDate)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] font-mono text-[#c5221f] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT AREA: Affiliate CRM Metric Cards + Filters + Booking Cards
           ═══════════════════════════════════════════════════════════════ */}
        <section className="flex-1 min-w-0 space-y-5">
          
          {/* ─── Engaging Professional Affiliate CRM Metric Strip ─── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            
            {/* Total Bookings Card */}
            <div className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#171717]/30 transition-all group overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block font-medium truncate">
                  Total Bookings
                </span>
                <span className="w-6 h-6 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center text-[#171717] text-[11px] group-hover:bg-[#171717] group-hover:text-white transition-colors shrink-0">
                  <Layers size={12} />
                </span>
              </div>
              <span className="font-mono font-bold text-xl sm:text-[24px] text-[#171717] mt-1 block tabular-nums tracking-tight">
                {metrics.total}
              </span>
              <div className="flex items-center justify-between text-[11px] text-[#666666] mt-1 pt-1 border-t border-[#f3f4f6]">
                <span className="text-[#8f8f8f]">Confirmed</span>
                <span className="font-mono text-[10px] text-[#171717] font-semibold bg-[#fafafa] px-1.5 py-0.2 rounded border border-[#ebebeb]">
                  {metrics.approvedCount + metrics.paidCount}
                </span>
              </div>
            </div>

            {/* Approved Card */}
            <div className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#297a3a]/40 transition-all overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a] animate-pulse shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#297a3a] font-semibold truncate">
                    Approved
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase font-semibold text-[#137333] bg-[#e6f4ea] px-1.5 py-0.2 rounded-[4px] border border-[#ceead6] shrink-0">
                  Ready
                </span>
              </div>
              <span className="font-mono font-bold text-xl sm:text-[22px] text-[#171717] mt-1 block tabular-nums tracking-tight truncate">
                {formatIDR(metrics.approvedTotal)}
              </span>
              <div className="flex items-center justify-between text-[11px] text-[#666666] mt-1 pt-1 border-t border-[#f3f4f6]">
                <span className="text-[#8f8f8f]">Clearance</span>
                <span className="font-mono text-[10px] text-[#297a3a] font-semibold">
                  {metrics.approvedCount} orders
                </span>
              </div>
            </div>

            {/* Pending Card */}
            <div className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-amber-400/40 transition-all overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#b06000] font-semibold truncate">
                    Pending
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.2 rounded-[4px] border border-[#feefc3] shrink-0">
                  Escrow
                </span>
              </div>
              <span className="font-mono font-bold text-xl sm:text-[22px] text-[#171717] mt-1 block tabular-nums tracking-tight truncate">
                {formatIDR(metrics.pendingTotal)}
              </span>
              <div className="flex items-center justify-between text-[11px] text-[#666666] mt-1 pt-1 border-t border-[#f3f4f6]">
                <span className="text-[#8f8f8f]">In ritual</span>
                <span className="font-mono text-[10px] text-[#b06000] font-semibold">
                  {metrics.pendingCount} active
                </span>
              </div>
            </div>

            {/* Paid Out Card */}
            <div className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#171717]/40 transition-all overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#171717] block font-bold truncate">
                  PAID OUT
                </span>
                <span className="font-mono text-[9px] uppercase font-semibold text-white bg-[#171717] px-1.5 py-0.2 rounded-[4px] shadow-2xs shrink-0">
                  Disbursed
                </span>
              </div>
              <span className="font-mono font-bold text-xl sm:text-[22px] text-[#171717] mt-1 block tabular-nums tracking-tight truncate">
                {formatIDR(metrics.paidTotal)}
              </span>
              <div className="flex items-center justify-between text-[11px] text-[#666666] mt-1 pt-1 border-t border-[#f3f4f6]">
                <span className="text-[#8f8f8f]">Settled</span>
                <span className="font-mono text-[10px] text-[#171717] font-semibold">
                  {metrics.paidCount} payouts
                </span>
              </div>
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

            {/* View Switcher & Search Input */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 border border-[#ebebeb] bg-[#fafafa] p-0.5 rounded-[6px]">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#8f8f8f] hover:text-[#171717]'
                  }`}
                  title="Data Table View"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#8f8f8f] hover:text-[#171717]'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={13} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 sm:w-60">
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
          </div>

          {/* ─── Active Calendar Date Filter Banner ─── */}
          {selectedDate && (
            <div className="flex items-center justify-between bg-white border border-[#ebebeb] px-4 py-2.5 rounded-[8px] text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-[#4338ca]" />
                <span className="text-[#666666]">Filtered by appointment date:</span>
                <span className="font-semibold text-[#171717] font-mono">
                  {formatFriendlyDate(selectedDate)}
                </span>
                <span className="bg-[#4338ca] text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-full">
                  {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-[#666666] hover:text-[#171717] font-mono text-xs flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Show All Dates</span>
                <X size={12} />
              </button>
            </div>
          )}

          {/* ─── Bookings List / Data Table / Grid ─── */}
          {loading ? (
            <div className="p-16 text-center rounded-[8px] bg-white border border-[#ebebeb] space-y-3">
              <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-[#666666]">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center rounded-[8px] bg-[#fafafa] border border-dashed border-[#ebebeb] p-6 space-y-2">
              <CalendarIcon size={24} className="mx-auto text-[#a8a8a8]" />
              <p className="text-sm font-semibold text-[#171717]">No bookings found</p>
              <p className="text-xs text-[#666666] max-w-sm mx-auto leading-relaxed">
                {selectedDate 
                  ? `No referred bookings found for ${formatFriendlyDate(selectedDate)}.`
                  : search.trim() 
                  ? 'No bookings match your search query.' 
                  : 'Referred guest bookings will appear here automatically when guests book with your link or QR code.'}
              </p>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="mt-2 text-xs font-mono font-semibold text-[#171717] underline hover:opacity-75 cursor-pointer"
                >
                  View all dates
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <>
              {/* Desktop Professional Data Table (>= 768px) matching Commissions layout */}
              <div className="hidden md:block bg-white border border-[#ebebeb] rounded-[8px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
                      <tr>
                        <th className="py-3 px-3.5">Date</th>
                        <th className="py-3 px-3.5">Invoice #</th>
                        <th className="py-3 px-3.5">Guest & Treatment</th>
                        <th className="py-3 px-3.5 text-right">Treatment Net</th>
                        <th className="py-3 px-3.5 text-center">Rate</th>
                        <th className="py-3 px-3.5 text-right">Earned</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebebeb]">
                      {filteredBookings.map((b) => {
                        const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                        const isPaidOut = b.commission_status === 'paid';
                        const isApproved = b.commission_status === 'approved';

                        return (
                          <tr key={b.id || b.booking_id} className="hover:bg-[#fafafa] transition-colors">
                            {/* Date */}
                            <td className="py-3 px-3.5 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                              {formatFriendlyDate(b.date)}
                            </td>

                            {/* Invoice # */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#171717]">
                                <Link href={`/invoice/${b.booking_id}`} target="_blank" className="hover:underline">
                                  #{b.booking_id}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(b.booking_id)}
                                  className="text-[#8f8f8f] hover:text-[#171717] p-0.5 cursor-pointer"
                                  title="Copy code"
                                >
                                  {copiedId === b.booking_id ? <Check size={11} className="text-[#297a3a]" /> : <Copy size={11} />}
                                </button>
                              </div>
                            </td>

                            {/* Guest & Treatment (Stacked like Commissions) */}
                            <td className="py-3 px-3.5 min-w-[150px] max-w-[220px]">
                              <div className="font-semibold text-xs text-[#171717] truncate">
                                {b.guest_name || 'Guest'}
                              </div>
                              <div className="text-[11px] text-[#666666] truncate flex items-center gap-1 mt-0.5">
                                <span className="truncate">{b.treatment_name || 'Spa Treatment'}</span>
                                {b.duration && (
                                  <span className="font-mono text-[10px] text-[#8f8f8f] shrink-0">
                                    ({b.duration})
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Treatment Net */}
                            <td className="py-3 px-3.5 font-mono text-right text-xs text-[#171717] whitespace-nowrap tabular-nums">
                              {formatIDR(b.treatment_amount || b.gross_amount)}
                            </td>

                            {/* Rate */}
                            <td className="py-3 px-3.5 font-mono text-center text-xs text-[#666666] whitespace-nowrap tabular-nums">
                              {b.commission_rate_pct || 10}%
                            </td>

                            {/* Earned */}
                            <td className="py-3 px-3.5 font-mono text-right font-bold text-xs whitespace-nowrap tabular-nums">
                              <span className={isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}>
                                {isCancelled ? 'Rp0' : `+${formatIDR(b.commission_amount)}`}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {isPaidOut ? (
                                <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-2 py-0.5 rounded uppercase">
                                  PAID OUT
                                </span>
                              ) : isApproved ? (
                                <span className="font-mono text-[9px] font-semibold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded uppercase border border-[#ceead6]">
                                  Approved
                                </span>
                              ) : isCancelled ? (
                                <span className="font-mono text-[9px] font-semibold text-[#c5221f] bg-[#fce8e6] px-2 py-0.5 rounded uppercase border border-[#fad2cf]">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] font-semibold text-[#b06000] bg-[#fef7e0] px-2 py-0.5 rounded uppercase border border-[#feefc3]">
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* Actions: Track button + Invoice */}
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setTrackingBooking(b)}
                                  className="h-6 px-2 rounded-[4px] bg-[#fafafa] hover:bg-[#ebebeb] border border-[#ebebeb] text-[11px] font-mono text-[#171717] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="Track schedule"
                                >
                                  <Clock size={10} className="text-[#666666]" />
                                  <span>Track</span>
                                </button>
                                <Link
                                  href={`/invoice/${b.booking_id}`}
                                  target="_blank"
                                  className="text-[11px] font-mono text-[#666666] hover:text-[#171717] inline-flex items-center gap-0.5 hover:underline"
                                  title="View invoice"
                                >
                                  <span>Invoice</span>
                                  <ExternalLink size={10} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Responsive Booking Cards (< 768px) */}
              <div className="md:hidden space-y-2.5">
                {filteredBookings.map((b) => {
                  const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                  const isPaidOut = b.commission_status === 'paid';
                  const isApproved = b.commission_status === 'approved';

                  return (
                    <div
                      key={b.id || b.booking_id}
                      className="p-3.5 rounded-[8px] bg-white border border-[#ebebeb] space-y-2.5 shadow-2xs overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPaidOut ? (
                            <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-1.5 py-0.5 rounded uppercase">
                              PAID OUT
                            </span>
                          ) : isApproved ? (
                            <span className="font-mono text-[9px] font-semibold text-[#137333] bg-[#e6f4ea] px-1.5 py-0.5 rounded uppercase border border-[#ceead6]">
                              Approved
                            </span>
                          ) : isCancelled ? (
                            <span className="font-mono text-[9px] font-semibold text-[#c5221f] bg-[#fce8e6] px-1.5 py-0.5 rounded uppercase border border-[#fad2cf]">
                              Cancelled
                            </span>
                          ) : (
                            <span className="font-mono text-[9px] font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5 rounded uppercase border border-[#feefc3]">
                              Pending
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-[#666666]">
                            {formatFriendlyDate(b.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#171717] shrink-0">
                          <span>#{b.booking_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(b.booking_id)}
                            className="text-[#8f8f8f] hover:text-[#171717] p-0.5 cursor-pointer"
                          >
                            {copiedId === b.booking_id ? <Check size={11} className="text-[#297a3a]" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#f3f4f6] min-w-0">
                        <div className="font-semibold text-xs text-[#171717] truncate">
                          {b.guest_name || 'Guest'}
                        </div>
                        <div className="text-[11px] text-[#666666] truncate mt-0.5">
                          {b.treatment_name || 'Spa Treatment'}{b.duration ? ` · ${b.duration}` : ''}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#f3f4f6] flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <span className="font-mono text-[9px] uppercase text-[#8f8f8f] block">Net</span>
                          <span className="font-mono font-medium text-[#171717] tabular-nums">
                            {formatIDR(b.treatment_amount || b.gross_amount)}
                          </span>
                        </div>
                        <div className="text-right min-w-0">
                          <span className="font-mono text-[9px] uppercase text-[#297a3a] block">
                            Earned ({b.commission_rate_pct || 10}%)
                          </span>
                          <span className={`font-mono font-bold tabular-nums ${isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}`}>
                            {isCancelled ? 'Rp0' : `+${formatIDR(b.commission_amount)}`}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#f3f4f6] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setTrackingBooking(b)}
                          className="h-6.5 px-2.5 rounded-[4px] bg-[#fafafa] hover:bg-[#ebebeb] border border-[#ebebeb] text-xs font-mono text-[#171717] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Clock size={11} className="text-[#666666]" />
                          <span>Track</span>
                        </button>

                        <Link
                          href={`/invoice/${b.booking_id}`}
                          target="_blank"
                          className="text-xs font-mono text-[#666666] hover:text-[#171717] inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
              {filteredBookings.map((b) => {
                const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                const isPaidOut = b.commission_status === 'paid';
                const isApproved = b.commission_status === 'approved';

                return (
                  <div
                    key={b.id || b.booking_id}
                    className="p-3.5 sm:p-4 rounded-[8px] bg-white border border-[#ebebeb] space-y-2.5 hover:border-[#171717]/40 transition-colors shadow-2xs overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPaidOut ? (
                          <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-1.5 py-0.5 rounded uppercase">
                            PAID OUT
                          </span>
                        ) : isApproved ? (
                          <span className="font-mono text-[9px] font-semibold text-[#137333] bg-[#e6f4ea] px-1.5 py-0.5 rounded uppercase border border-[#ceead6]">
                            Approved
                          </span>
                        ) : isCancelled ? (
                          <span className="font-mono text-[9px] font-semibold text-[#c5221f] bg-[#fce8e6] px-1.5 py-0.5 rounded uppercase border border-[#fad2cf]">
                            Cancelled
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5 rounded uppercase border border-[#feefc3]">
                            Pending
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-[#666666]">
                          {formatFriendlyDate(b.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#171717] shrink-0">
                        <span>#{b.booking_id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(b.booking_id)}
                          className="text-[#8f8f8f] hover:text-[#171717] p-0.5 cursor-pointer"
                        >
                          {copiedId === b.booking_id ? <Check size={11} className="text-[#297a3a]" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f3f4f6] min-w-0">
                      <div className="font-semibold text-xs text-[#171717] truncate">
                        {b.guest_name || 'Guest'}
                      </div>
                      <div className="text-[11px] text-[#666666] truncate mt-0.5">
                        {b.treatment_name || 'Spa Treatment'}{b.duration ? ` · ${b.duration}` : ''}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f3f4f6] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[9px] uppercase text-[#8f8f8f] block">Net</span>
                        <span className="font-mono font-medium text-[#171717] tabular-nums">
                          {formatIDR(b.treatment_amount || b.gross_amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] uppercase text-[#297a3a] block">
                          Earned ({b.commission_rate_pct || 10}%)
                        </span>
                        <span className={`font-mono font-bold tabular-nums ${isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}`}>
                          {isCancelled ? 'Rp0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f3f4f6] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setTrackingBooking(b)}
                        className="h-6.5 px-2.5 rounded-[4px] bg-[#fafafa] hover:bg-[#ebebeb] border border-[#ebebeb] text-xs font-mono text-[#171717] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Clock size={11} className="text-[#666666]" />
                        <span>Track</span>
                      </button>

                      <Link
                        href={`/invoice/${b.booking_id}`}
                        target="_blank"
                        className="text-xs font-mono text-[#666666] hover:text-[#171717] inline-flex items-center gap-1 hover:underline"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </section>
      </div>

      {/* ─── Schedule Tracking History Modal ─── */}
      <ScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

    </div>
  );
}
