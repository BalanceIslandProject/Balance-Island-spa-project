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
  ExternalLink, 
  X, 
  List, 
  LayoutGrid,
  Layers,
  CalendarDays,
  ChevronDown,
  Wallet
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal from '../ScheduleTrackingModal';
import { supabase } from '@/lib/supabase';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Weekdays matching design: Mon, Tues, Wed, Thurs, Fri, Sat, Sun
const WEEKDAY_NAMES = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'paid' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Date filtering and landscape calendar navigation (Start From and End logic)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState<boolean>(false);
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');
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

  const formatDateYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const todayStr = formatDateYMD(today);
    setStartDate(todayStr);
    setEndDate(todayStr);
    setActiveDatePreset('today');
  };

  const handleSetToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const todayStr = formatDateYMD(today);
    setStartDate(todayStr);
    setEndDate(todayStr);
    setActiveDatePreset('today');
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setStartDate(formatDateYMD(firstDay));
    setEndDate(formatDateYMD(lastDay));
    setActiveDatePreset('this_month');
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    setCurrentYear(targetYear);
    setCurrentMonth(targetMonth);
    setStartDate(formatDateYMD(firstDay));
    setEndDate(formatDateYMD(lastDay));
    setActiveDatePreset('last_month');
  };

  const handleSetLast30Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setStartDate(formatDateYMD(past));
    setEndDate(formatDateYMD(now));
    setActiveDatePreset('last_30_days');
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActiveDatePreset('all');
  };

  const handleDayClick = (dateStr: string) => {
    // If clicking the current single selected date, toggle off
    if (startDate === dateStr && endDate === dateStr) {
      handleClearDateFilter();
    } else {
      setStartDate(dateStr);
      setEndDate(dateStr);
      setActiveDatePreset('custom');
    }
  };

  const hasDateFilter = Boolean(startDate || endDate);

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

  // Calendar grid computation
  const calendarDays = useMemo(() => {
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

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Date Range Filter (Start From and End logic)
      if (startDate || endDate) {
        if (!b.date) return false;
        const bDate = b.date.trim();
        if (startDate && bDate < startDate) return false;
        if (endDate && bDate > endDate) return false;
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
  }, [bookings, search, statusFilter, startDate, endDate]);

  return (
    <div className="space-y-6 w-full font-sans antialiased pb-16 pt-1 sm:pt-2">
      
      {/* ─── TOP SECTION: Landscape Calendar (Left) + Payout Card & KPI Metrics (Right) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">

        {/* ─── LANDSCAPE CALENDAR (lg:col-span-7 xl:col-span-8) ─── */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-[#eaecf0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          
          {/* Calendar Header: Month Nav + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl border border-[#eaecf0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1] flex items-center justify-center text-[#334155] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Previous month"
              >
                <ChevronLeft size={15} strokeWidth={2.2} />
              </button>

              <div className="flex items-center gap-2 px-1">
                <CalendarIcon size={16} className="text-[#0f172a]" strokeWidth={2} />
                <span className="font-bold text-base sm:text-lg text-[#0f172a] tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl border border-[#eaecf0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1] flex items-center justify-center text-[#334155] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Next month"
              >
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>

            {/* Right Controls: Today button + Active Filter Badge / Clear */}
            <div className="flex items-center gap-2">
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="h-8 px-2.5 rounded-lg text-xs font-mono font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X size={12} />
                  <span>Clear Filter</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleJumpToday}
                className="h-8 px-3 rounded-lg text-xs font-bold text-[#0f172a] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#e2e8f0] inline-flex items-center cursor-pointer transition-colors active:scale-95"
              >
                Today
              </button>
            </div>
          </div>

          {/* Landscape Weekdays Header */}
          <div className="grid grid-cols-7 text-center py-2 border-b border-[#f8fafc] text-[11px] font-semibold text-[#94a3b8] tracking-tight">
            {WEEKDAY_NAMES.map((name) => (
              <span key={name} className="py-0.5">
                {name}
              </span>
            ))}
          </div>

          {/* Landscape Days Grid (7 columns across wide landscape card) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 my-1.5">
            {calendarDays.map((cell, idx) => {
              const isStart = startDate === cell.dateStr;
              const isEnd = endDate === cell.dateStr;
              const isSelected = isStart || isEnd;
              const inRange = Boolean(startDate && endDate && cell.dateStr > startDate && cell.dateStr < endDate);
              const hasBookings = cell.bookings.length > 0;

              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="h-9 sm:h-10 flex items-center justify-center text-xs text-[#cbd5e1] font-normal select-none"
                  >
                    {cell.dayNumber}
                  </div>
                );
              }

              // Selected Day (Start / End Date)
              if (isSelected) {
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    title={`${formatFriendlyDate(cell.dateStr)} (Selected - Click to clear)`}
                    className="h-9 sm:h-10 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-[13px] flex flex-col items-center justify-center shadow-xs ring-2 ring-blue-500/30 scale-102 transition-all cursor-pointer relative"
                  >
                    <span>{cell.dayNumber}</span>
                    {hasBookings && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
                    )}
                  </button>
                );
              }

              // In-Between Date Range
              if (inRange) {
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    className="h-9 sm:h-10 rounded-xl bg-blue-50 text-blue-900 font-semibold text-xs sm:text-[13px] flex flex-col items-center justify-center hover:bg-blue-100 transition-all cursor-pointer relative"
                  >
                    <span>{cell.dayNumber}</span>
                    {hasBookings && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />
                    )}
                  </button>
                );
              }

              // Status Colored Pills for Bookings
              if (cell.statusStyle === 'paid') {
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    title={`${cell.bookings.length} Paid Out booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                    className={`h-9 sm:h-10 rounded-xl bg-[#e0ecff] text-[#1d4ed8] font-bold text-xs sm:text-[13px] flex flex-col items-center justify-center hover:ring-2 hover:ring-[#2563eb]/30 transition-all cursor-pointer relative ${
                      cell.isToday ? 'ring-2 ring-[#0f172a]' : ''
                    }`}
                  >
                    <span>{cell.dayNumber}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] mt-0.5" />
                  </button>
                );
              }

              if (cell.statusStyle === 'approved') {
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    title={`${cell.bookings.length} Approved booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                    className={`h-9 sm:h-10 rounded-xl bg-[#dcfce7] text-[#15803d] font-bold text-xs sm:text-[13px] flex flex-col items-center justify-center hover:ring-2 hover:ring-[#16a34a]/30 transition-all cursor-pointer relative ${
                      cell.isToday ? 'ring-2 ring-[#0f172a]' : ''
                    }`}
                  >
                    <span>{cell.dayNumber}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-0.5" />
                  </button>
                );
              }

              if (cell.statusStyle === 'pending') {
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    title={`${cell.bookings.length} Pending booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                    className={`h-9 sm:h-10 rounded-xl bg-[#fef3c7] text-[#b45309] font-bold text-xs sm:text-[13px] flex flex-col items-center justify-center hover:ring-2 hover:ring-[#d97706]/30 transition-all cursor-pointer relative ${
                      cell.isToday ? 'ring-2 ring-[#0f172a]' : ''
                    }`}
                  >
                    <span>{cell.dayNumber}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] mt-0.5" />
                  </button>
                );
              }

              if (cell.statusStyle === 'cancelled') {
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    title={`${cell.bookings.length} Cancelled booking(s) on ${formatFriendlyDate(cell.dateStr)}`}
                    className={`h-9 sm:h-10 rounded-xl bg-[#fee2e2] text-[#b91c1c] font-bold text-xs sm:text-[13px] flex flex-col items-center justify-center hover:ring-2 hover:ring-[#ef4444]/30 transition-all cursor-pointer relative ${
                      cell.isToday ? 'ring-2 ring-[#0f172a]' : ''
                    }`}
                  >
                    <span>{cell.dayNumber}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-0.5" />
                  </button>
                );
              }

              // Standard Day Cell
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handleDayClick(cell.dateStr)}
                  className={`h-9 sm:h-10 rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                    cell.isToday
                      ? 'border-2 border-[#0f172a] font-bold text-[#0f172a] bg-[#f8fafc]'
                      : 'text-[#334155] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Landscape Calendar Footer: Status Legend */}
          <div className="pt-3 mt-1.5 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px] text-[#64748b]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                <span className="font-medium text-[#334155]">Paid Out</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0" />
                <span className="font-medium text-[#334155]">Approved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] shrink-0" />
                <span className="font-medium text-[#334155]">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0" />
                <span className="font-medium text-[#334155]">Cancelled</span>
              </div>
            </div>
            <span className="text-[11px] text-[#94a3b8] font-mono hidden sm:inline">
              Click date to filter
            </span>
          </div>

        </div>

        {/* ─── PAYOUT CARD & METRIC CARDS (lg:col-span-5 xl:col-span-4) ─── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-3 sm:gap-3.5">
          
          {/* Top Hero: PAID OUT */}
          <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white border border-indigo-200/90 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-indigo-900 font-bold whitespace-nowrap">
                PAID OUT
              </span>
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/20 shrink-0">
                <Wallet size={15} />
              </span>
            </div>
            <div className="my-2 sm:my-3">
              <span className="font-mono font-extrabold text-2xl sm:text-[32px] text-indigo-950 block tabular-nums tracking-tight leading-none">
                {formatIDR(metrics.paidTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-indigo-100/80">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/90 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                {metrics.paidCount} Payouts Settled
              </span>
              <Link 
                href="/partners/payouts"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
              >
                View Payouts →
              </Link>
            </div>
          </div>

          {/* Middle: TOTAL BOOKINGS */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white border border-blue-200/90 shadow-xs hover:border-blue-300 transition-all flex items-center justify-between gap-3 overflow-hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-mono text-xs uppercase tracking-wider text-blue-900 font-bold">
                  TOTAL BOOKINGS
                </span>
              </div>
              <span className="font-sans font-extrabold text-2xl sm:text-[28px] text-blue-950 block tabular-nums tracking-tight leading-none mt-1.5">
                {metrics.total}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/90 border border-blue-200 px-2.5 py-1 rounded-md inline-block">
                {metrics.approvedCount + metrics.paidCount} Confirmed
              </span>
            </div>
          </div>

          {/* Bottom 2-Col Grid: APPROVED & PENDING */}
          <div className="grid grid-cols-2 gap-3">
            {/* APPROVED */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/90 shadow-xs overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-900 font-bold truncate">
                  APPROVED
                </span>
              </div>
              <span className="font-mono font-extrabold text-base sm:text-lg text-emerald-950 mt-1.5 block tabular-nums tracking-tight leading-none">
                {formatIDR(metrics.approvedTotal)}
              </span>
              <div className="mt-2 pt-1.5 border-t border-emerald-100/80 text-[10px] font-mono text-emerald-700 font-semibold">
                {metrics.approvedCount} Orders
              </div>
            </div>

            {/* PENDING */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border border-amber-200/90 shadow-xs overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-amber-900 font-bold truncate">
                  PENDING
                </span>
              </div>
              <span className="font-mono font-extrabold text-base sm:text-lg text-amber-950 mt-1.5 block tabular-nums tracking-tight leading-none">
                {formatIDR(metrics.pendingTotal)}
              </span>
              <div className="mt-2 pt-1.5 border-t border-amber-100/80 text-[10px] font-mono text-amber-700 font-semibold">
                {metrics.pendingCount} Active
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─── FULL WIDTH BOOKING DESIGN (BELOW LANDSCAPE CALENDAR) ─── */}
      <div className="w-full space-y-4">
        
        {/* Filter Control Bar: Status Tabs + Search + Filter by Date + View Switcher */}
        <div className="bg-white border border-[#eaecf0] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar shrink-0">
              {(['all', 'approved', 'pending', 'paid', 'cancelled'] as const).map((s) => {
                const isSelected = statusFilter === s;
                let activeClass = 'bg-slate-900 text-white shadow-xs';
                if (s === 'approved') activeClass = 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20';
                else if (s === 'pending') activeClass = 'bg-amber-500 text-white shadow-xs shadow-amber-500/20';
                else if (s === 'paid') activeClass = 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20';
                else if (s === 'cancelled') activeClass = 'bg-rose-600 text-white shadow-xs shadow-rose-500/20';

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? activeClass
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {s === 'paid' ? 'PAID OUT' : s}
                  </button>
                );
              })}
            </div>

            {/* Controls: Search + Filter by Date + View Switcher */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Search Input */}
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search guest or invoice..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 shadow-2xs transition-all"
                />
              </div>

              {/* Filter by Date Button (Opens Start From and End Logic) */}
              <button
                type="button"
                onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  hasDateFilter || showDateFilterDropdown
                    ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                    : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-2xs'
                }`}
              >
                <CalendarDays size={13} />
                <span>
                  {hasDateFilter ? `${startDate || 'Start'} → ${endDate || 'End'}` : 'Filter by Date'}
                </span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${showDateFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* View Switcher (Table / Cards) */}
              <div className="hidden sm:flex items-center gap-1 border border-[#e2e8f0] bg-white p-1 rounded-xl shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-[#f1f5f9] text-[#0f172a]' : 'text-[#94a3b8] hover:text-[#0f172a]'
                  }`}
                  title="Data Table View"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'cards' ? 'bg-[#f1f5f9] text-[#0f172a]' : 'text-[#94a3b8] hover:text-[#0f172a]'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Expandable Date Range Panel (Start From & End Logic) */}
          {showDateFilterDropdown && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#f8fafc] border border-[#eaecf0] space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-[#0f172a]" />
                  <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono">
                    Filter by Date Range
                  </span>
                </div>
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={handleClearDateFilter}
                    className="text-xs text-[#dc2626] hover:text-[#b91c1c] hover:underline flex items-center gap-1 cursor-pointer font-medium transition-colors"
                  >
                    <X size={13} />
                    <span>Reset Dates</span>
                  </button>
                )}
              </div>

              {/* Start From & End Logic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Start From */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] font-mono">
                    Start From
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setActiveDatePreset('custom');
                      }}
                      className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono font-medium text-[#0f172a] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] font-mono">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setActiveDatePreset('custom');
                      }}
                      className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono font-medium text-[#0f172a] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Presets Row */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#e2e8f0]">
                <span className="text-[11px] text-[#64748b] font-mono mr-1">Quick Select:</span>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeDatePreset === 'today' && hasDateFilter
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeDatePreset === 'this_month' && hasDateFilter
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLastMonth}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeDatePreset === 'last_month' && hasDateFilter
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLast30Days}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeDatePreset === 'last_30_days' && hasDateFilter
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    !hasDateFilter
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          )}

          {/* Summary Bar */}
          <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b] flex-wrap gap-2">
            <span>
              Showing <strong className="text-[#0f172a]">{filteredBookings.length}</strong> bookings
              {hasDateFilter && (
                <span className="font-mono text-indigo-700 font-semibold ml-1.5">
                  ({startDate || 'Start'} to {endDate || 'Now'})
                </span>
              )}
            </span>
            {hasDateFilter && (
              <button
                type="button"
                onClick={handleClearDateFilter}
                className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
              >
                Reset Date Filter
              </button>
            )}
          </div>

        </div>

          {/* ─── Bookings List / Data Table / Grid ─── */}
          {loading ? (
            <div className="p-16 text-center rounded-2xl bg-white border border-[#eaecf0] space-y-3 shadow-xs">
              <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-[#64748b]">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[#e2e8f0] p-6 space-y-2.5 shadow-xs">
              <CalendarIcon size={28} className="mx-auto text-[#94a3b8]" />
              <p className="text-sm font-bold text-[#0f172a]">No bookings found</p>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto leading-relaxed">
                {hasDateFilter 
                  ? `No referred bookings found for ${startDate === endDate ? formatFriendlyDate(startDate) : `${startDate} to ${endDate}`}.`
                  : search.trim() 
                  ? 'No bookings match your search query.' 
                  : 'Referred guest bookings will appear here automatically when guests book with your link or QR code.'}
              </p>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="mt-2 text-xs font-mono font-bold text-[#2563eb] underline hover:opacity-75 cursor-pointer"
                >
                  View all dates
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <>
              {/* Desktop Professional Data Table (>= 768px) */}
              <div className="hidden md:block bg-white border border-[#eaecf0] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] border-b border-[#eaecf0] font-mono text-[10px] uppercase tracking-wider text-[#64748b]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Date</th>
                        <th className="py-3.5 px-4 font-bold">Invoice #</th>
                        <th className="py-3.5 px-4 font-bold text-right">Treatment Net</th>
                        <th className="py-3.5 px-4 font-bold text-center">Rate</th>
                        <th className="py-3.5 px-4 font-bold text-right">Earned</th>
                        <th className="py-3.5 px-4 font-bold text-center">Status</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredBookings.map((b) => {
                        const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                        const isPaidOut = b.commission_status === 'paid';
                        const isApproved = b.commission_status === 'approved';

                        return (
                          <tr key={b.id || b.booking_id} className="hover:bg-[#f8fafc]/70 transition-colors">
                            {/* Date */}
                            <td className="py-4 px-4 font-mono text-[11px] text-[#475569] whitespace-nowrap font-medium">
                              {formatFriendlyDate(b.date)}
                            </td>

                            {/* Invoice # */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#0f172a]">
                                <Link href={`/invoice/${b.booking_id}`} target="_blank" className="hover:underline">
                                  #{b.booking_id}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(b.booking_id)}
                                  className="text-[#94a3b8] hover:text-[#0f172a] p-0.5 cursor-pointer transition-colors"
                                  title="Copy ID"
                                >
                                  {copiedId === b.booking_id ? <Check size={12} className="text-[#16a34a]" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>

                            {/* Treatment Net */}
                            <td className="py-4 px-4 font-mono text-right text-xs font-semibold text-[#0f172a] whitespace-nowrap tabular-nums">
                              {formatIDR(b.treatment_amount || b.gross_amount)}
                            </td>

                            {/* Rate */}
                            <td className="py-4 px-4 font-mono text-center text-xs text-[#64748b] whitespace-nowrap tabular-nums">
                              {b.commission_rate_pct || 10}%
                            </td>

                            {/* Earned */}
                            <td className="py-4 px-4 font-mono text-right font-bold text-xs whitespace-nowrap tabular-nums">
                              <span className={isCancelled ? 'line-through text-[#94a3b8]' : 'text-[#16a34a]'}>
                                {isCancelled ? 'Rp0' : `+${formatIDR(b.commission_amount)}`}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              {isPaidOut ? (
                                <span className="font-mono text-[10px] font-bold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs shadow-indigo-500/20">
                                  PAID OUT
                                </span>
                              ) : isApproved ? (
                                <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-300">
                                  Approved
                                </span>
                              ) : isCancelled ? (
                                <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-300">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* Actions: Track button + Invoice */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTrackingBooking(b)}
                                  className="h-7.5 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
                                  title="Track schedule & booking details"
                                >
                                  <Clock size={12} className="text-slate-300" />
                                  <span>Track</span>
                                </button>
                                <Link
                                  href={`/invoice/${b.booking_id}`}
                                  target="_blank"
                                  className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 hover:underline px-2 py-1"
                                  title="View invoice"
                                >
                                  <span>Invoice</span>
                                  <ExternalLink size={11} />
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

              {/* Mobile App Booking Cards (< 768px) */}
              <div className="md:hidden space-y-3">
                {filteredBookings.map((b) => {
                  const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                  const isPaidOut = b.commission_status === 'paid';
                  const isApproved = b.commission_status === 'approved';

                  return (
                    <div
                      key={b.id || b.booking_id}
                      className="p-4 rounded-2xl bg-white border border-[#eaecf0] space-y-3 shadow-xs hover:border-[#cbd5e1] transition-all overflow-hidden"
                    >
                      {/* Top Row: Invoice # + Date + Earned */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Link
                            href={`/invoice/${b.booking_id}`}
                            target="_blank"
                            className="font-mono text-xs font-bold text-[#0f172a] hover:underline"
                          >
                            #{b.booking_id}
                          </Link>
                          <span className="text-[#cbd5e1]">·</span>
                          <span className="font-mono text-[11px] text-[#64748b]">
                            {formatFriendlyDate(b.date)}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${isCancelled ? 'line-through text-[#94a3b8]' : 'text-[#16a34a]'}`}>
                            {isCancelled ? 'Rp0' : `+${formatIDR(b.commission_amount)}`}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Net & Rate + Status Badge */}
                      <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                        <div className="font-mono text-[11px] text-[#64748b]">
                          Net {formatIDR(b.treatment_amount || b.gross_amount)} · {b.commission_rate_pct || 10}%
                        </div>
                        <div className="shrink-0">
                          {isPaidOut ? (
                            <span className="font-mono text-[10px] font-bold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs shadow-indigo-500/20">
                              PAID OUT
                            </span>
                          ) : isApproved ? (
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-300">
                              Approved
                            </span>
                          ) : isCancelled ? (
                            <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-300">
                              Cancelled
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Native App Actions Bar: Track CTA + Invoice Button */}
                      <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTrackingBooking(b)}
                          className="flex-1 h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-transform shadow-xs"
                        >
                          <Clock size={13} className="text-slate-300" />
                          <span>Track</span>
                        </button>

                        <Link
                          href={`/invoice/${b.booking_id}`}
                          target="_blank"
                          className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1 active:scale-[0.98] transition-transform shadow-2xs"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} className="text-[#94a3b8]" />
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
                    className="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#eaecf0] space-y-3 hover:border-[#cbd5e1] hover:shadow-xs transition-all shadow-xs overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 shrink-0">
                        {isPaidOut ? (
                          <span className="font-mono text-[9px] font-bold text-white bg-[#0f172a] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                            PAID OUT
                          </span>
                        ) : isApproved ? (
                          <span className="font-mono text-[9px] font-bold text-[#15803d] bg-[#dcfce7] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#bbf7d0]">
                            Approved
                          </span>
                        ) : isCancelled ? (
                          <span className="font-mono text-[9px] font-bold text-[#b91c1c] bg-[#fee2e2] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#fecaca]">
                            Cancelled
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#fde68a]">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${isCancelled ? 'line-through text-[#94a3b8]' : 'text-[#16a34a]'}`}>
                          {isCancelled ? 'Rp0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/invoice/${b.booking_id}`}
                            target="_blank"
                            className="font-mono text-xs font-bold text-[#0f172a] hover:underline"
                          >
                            #{b.booking_id}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(b.booking_id)}
                            className="text-[#94a3b8] hover:text-[#0f172a] p-0.5 cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === b.booking_id ? <Check size={11} className="text-[#16a34a]" /> : <Copy size={11} />}
                          </button>
                        </div>
                        <div className="text-[11px] text-[#64748b] truncate mt-0.5">
                          {b.treatment_name || 'Spa Treatment'}
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-[11px] font-mono text-[#64748b]">
                        <div>{formatFriendlyDate(b.date)}</div>
                        <div className="text-[10px] text-[#94a3b8]">Net {formatIDR(b.treatment_amount || b.gross_amount)}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setTrackingBooking(b)}
                        className="h-8 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
                      >
                        <Clock size={12} className="text-slate-300" />
                        <span>Track</span>
                      </button>

                      <Link
                        href={`/invoice/${b.booking_id}`}
                        target="_blank"
                        className="text-xs font-bold text-[#64748b] hover:text-[#0f172a] inline-flex items-center gap-1 hover:underline px-2 py-1"
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
      </div>

      {/* ─── Schedule Tracking Modal ─── */}
      <ScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

    </div>
  );
}
