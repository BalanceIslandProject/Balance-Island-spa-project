'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Copy, 
  Check, 
  User, 
  MapPin, 
  DoorOpen, 
  FileText, 
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import { supabase } from '@/lib/supabase';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    // safe fallback
  }
  return String(rawDate);
};

export default function PartnerCalendarPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar State
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'cancelled'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const formatIDR = (val: number) => {
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
      console.error('Failed to load calendar bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime synchronization
    const channel = supabase
      .channel('partner_calendar_page_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadData();
      })
      .subscribe();

    // Polling fallback
    const interval = setInterval(loadData, 8000);

    // Revalidate on focus
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

  // Navigation handlers
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToPrev = () => {
    if (viewMode === 'week' && selectedDate && selectedDate.includes('-')) {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) - 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    } else {
      goToPrevMonth();
    }
  };

  const goToNext = () => {
    if (viewMode === 'week' && selectedDate && selectedDate.includes('-')) {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    } else {
      goToNextMonth();
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Turn to week view on mobile when specific date is clicked so user can see booking details without scrolling
  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('week');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, CalendarBooking[]> = {};
    for (const b of bookings) {
      if (!b.date) continue;
      const dateKey = b.date.includes('T') ? b.date.split('T')[0] : b.date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    }
    return map;
  }, [bookings]);

  // Current month stats
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthBookings = useMemo(() => {
    return bookings.filter((b) => b.date && b.date.startsWith(monthPrefix));
  }, [bookings, monthPrefix]);

  const monthStats = useMemo(() => {
    let count = 0;
    let totalCommission = 0;
    let approvedCommission = 0;
    let pendingCommission = 0;

    for (const b of currentMonthBookings) {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      if (isCancelled) continue;
      count++;
      totalCommission += b.commission_amount || 0;
      if (b.commission_status === 'approved') approvedCommission += b.commission_amount || 0;
      if (b.commission_status === 'pending') pendingCommission += b.commission_amount || 0;
    }

    return { count, totalCommission, approvedCommission, pendingCommission };
  }, [currentMonthBookings]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Weekly view days
  const weekDays = useMemo(() => {
    let baseDate: Date;
    if (selectedDate && selectedDate.includes('-')) {
      const parts = selectedDate.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      baseDate = !isNaN(y) && !isNaN(m) && !isNaN(d) ? new Date(y, m, d) : new Date(currentYear, currentMonth, 1);
    } else {
      baseDate = new Date(currentYear, currentMonth, 1);
    }

    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;
      const dayBookings = bookingsByDate[dateString] || [];
      const isSelected = selectedDate === dateString;
      const isToday = 
        today.getFullYear() === d.getFullYear() &&
        today.getMonth() === d.getMonth() &&
        today.getDate() === d.getDate();

      days.push({
        dateString,
        dayNum: d.getDate(),
        dayName: DAYS_OF_WEEK[i],
        isCurrentMonth: d.getMonth() === currentMonth,
        isToday,
        isSelected,
        dayBookings,
      });
    }
    return days;
  }, [selectedDate, currentYear, currentMonth, today, bookingsByDate]);

  // Appointments for the selected day
  const selectedDayBookings = useMemo(() => {
    let list: CalendarBooking[] = [];
    if (selectedDate) {
      list = bookingsByDate[selectedDate] || [];
    } else {
      list = currentMonthBookings;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'cancelled') {
        list = list.filter((b) => b.commission_status === 'cancelled' || b.booking_status === 'Cancelled');
      } else {
        list = list.filter((b) => b.commission_status === statusFilter && b.booking_status !== 'Cancelled');
      }
    }

    return list;
  }, [selectedDate, currentMonthBookings, bookingsByDate, statusFilter]);

  // Statistics for the selected day / filter (Total Bookings & Total Commission)
  const selectedDayStats = useMemo(() => {
    let count = 0;
    let totalCommission = 0;
    let approvedCommission = 0;
    let pendingCommission = 0;

    for (const b of selectedDayBookings) {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      if (isCancelled) continue;
      count++;
      totalCommission += b.commission_amount || 0;
      if (b.commission_status === 'approved') approvedCommission += b.commission_amount || 0;
      if (b.commission_status === 'pending') pendingCommission += b.commission_amount || 0;
    }

    return { count, totalCommission, approvedCommission, pendingCommission };
  }, [selectedDayBookings]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-neutral-500 font-medium">Loading calendar schedule...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16 font-sans antialiased text-neutral-900">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP EXECUTIVE BAR: Title, Controls, KPI Summary
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pb-2 border-b border-neutral-200/80">
        {/* Row 1: Title on left, Live Schedule badge on right */}
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-950 tracking-tight">
              Booking Calendar
            </h1>
            <p className="hidden sm:block text-xs text-neutral-500 mt-0.5">
              Full-screen calendar view for scheduled treatments and commission attribution
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
            Live Schedule
          </span>
        </div>

        {/* Row 2: October 2026 Navigator on Left, Month/Week Toggle on Right */}
        <div className="flex items-center justify-between w-full gap-2 pt-1 lg:pt-0">
          {/* Apple Segmented Month Navigator */}
          <div className="inline-flex items-center bg-white border border-neutral-200/80 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={goToPrev}
              className="p-1.5 sm:p-2 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-neutral-700 hover:text-black"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-2 sm:px-3 text-xs font-bold text-neutral-950 min-w-[105px] sm:min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 sm:p-2 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-neutral-700 hover:text-black"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Today button - hidden on mobile as requested, kept on desktop */}
            <button
              type="button"
              onClick={goToToday}
              className="hidden lg:inline-block px-3.5 py-2 text-xs font-semibold rounded-2xl bg-white border border-neutral-200/80 text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              Today
            </button>

            {/* Month / Week Switcher */}
            <div className="inline-flex p-1 rounded-2xl bg-neutral-100 border border-neutral-200/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  viewMode === 'month' ? 'bg-white text-neutral-950 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  viewMode === 'week' ? 'bg-white text-neutral-950 shadow-2xs font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MONTH FINANCIAL SUMMARY STRIP (APPLE HIG METRICS)
          Visible on desktop only; hidden on mobile so only calendar & booking details show.
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Appointments */}
        <div className="bg-white border border-neutral-200/70 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            Appointments
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono">
            {monthStats.count}
          </div>
          <p className="text-[10px] text-neutral-500 truncate">Scheduled this month</p>
        </div>

        {/* Total Commission */}
        <div className="bg-white border border-neutral-200/70 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
            Month Total
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono tabular-nums truncate">
            {formatIDR(monthStats.totalCommission)}
          </div>
          <p className="text-[10px] text-neutral-500 truncate">All active commissions</p>
        </div>

        {/* Approved Commission */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-900 block">
                Approved
              </span>
            </div>
            <span className="text-[9px] font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded-full">
              Ready
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono tabular-nums truncate">
            {formatIDR(monthStats.approvedCommission)}
          </div>
          <p className="text-[10px] text-neutral-500 truncate">Ready for bank transfer</p>
        </div>

        {/* Pending Commission */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 shadow-md space-y-1 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white block">
                Pending
              </span>
            </div>
            <span className="text-[9px] font-bold text-neutral-300 bg-white/10 border border-white/15 px-1.5 py-0.2 rounded-full">
              Treatment
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums truncate">
            {formatIDR(monthStats.pendingCommission)}
          </div>
          <p className="text-[10px] text-neutral-400 truncate">Awaiting completion</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL SCREEN RESPONSIVE DESKTOP WORKSPACE (12-COL GRID)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ──────── CALENDAR GRID AREA (LEFT / CENTER: 7 or 8 COLS) ──────── */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          
          {/* Filter Bar & Selection Status (Visible on desktop; on mobile, filter is positioned above booking details) */}
          <div className="hidden lg:flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5">
              {(['all', 'approved', 'pending', 'cancelled'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStatusFilter(mode)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === mode
                      ? 'bg-neutral-950 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {selectedDate && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500 font-medium">
                  Showing: <strong className="text-neutral-950">{safeFormatDate(selectedDate, { day: 'numeric', month: 'short' })}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    setViewMode('month');
                  }}
                  className="text-emerald-700 hover:underline font-bold text-xs cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {viewMode === 'month' ? (
            /* ════════ MONTH VIEW GRID (FULL SCREEN RESPONSIVE) ════════ */
            <div className="space-y-1.5 sm:space-y-2">
              {/* Day Name Header Row */}
              <div className="grid grid-cols-7 text-center">
                {DAYS_OF_WEEK.map((d, i) => (
                  <div
                    key={d}
                    className={`py-1 sm:py-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider ${
                      i === 0 ? 'text-rose-500' : 'text-neutral-400'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty leading cells */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[42px] sm:min-h-[96px] rounded-xl sm:rounded-2xl bg-neutral-50/40" />
                ))}

                {/* Actual Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayBookings = bookingsByDate[dateString] || [];
                  const hasBookings = dayBookings.length > 0;
                  const isSelected = selectedDate === dateString;
                  const isToday =
                    today.getFullYear() === currentYear &&
                    today.getMonth() === currentMonth &&
                    today.getDate() === dayNum;

                  const hasApproved = dayBookings.some((b) => b.commission_status === 'approved');
                  const hasPending = dayBookings.some((b) => b.commission_status === 'pending');
                  const hasCancelled = dayBookings.some((b) => b.commission_status === 'cancelled' || b.booking_status === 'Cancelled');

                  const dayTotalComm = dayBookings.reduce((sum, b) => {
                    const isCanc = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                    return isCanc ? sum : sum + (b.commission_amount || 0);
                  }, 0);

                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => handleDateClick(dateString)}
                      className={`min-h-[44px] sm:min-h-[105px] p-1 sm:p-2.5 rounded-xl sm:rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer border relative group ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-md ring-2 ring-neutral-950/20 z-10'
                          : isToday
                          ? 'bg-neutral-50 border-neutral-400 hover:border-neutral-900 text-neutral-950'
                          : hasBookings
                          ? 'bg-[#F2FBF7] border-emerald-200/90 hover:border-emerald-400 text-neutral-900'
                          : 'bg-white border-neutral-200/60 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700'
                      }`}
                    >
                      {/* Top Row: Date Number + Indicators */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isSelected
                              ? 'text-white'
                              : isToday
                              ? 'text-neutral-950 underline underline-offset-2'
                              : hasBookings
                              ? 'text-emerald-950'
                              : 'text-neutral-700'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {hasBookings && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            {hasApproved && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-emerald-300' : 'bg-emerald-600'
                                }`}
                              />
                            )}
                            {hasPending && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-rose-300' : 'bg-rose-500'
                                }`}
                              />
                            )}
                            {!hasApproved && !hasPending && hasCancelled && (
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                            )}
                            <span
                              className={`text-[9px] font-mono font-bold px-1 rounded-full hidden sm:inline-block ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {dayBookings.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Info: Commission Total on Desktop (hidden on mobile for small compact columns) */}
                      {hasBookings && (
                        <div className="hidden sm:block mt-auto pt-1 w-full truncate">
                          <div
                            className={`text-[9px] sm:text-[10px] font-mono font-bold truncate ${
                              isSelected ? 'text-emerald-300' : 'text-emerald-800'
                            }`}
                          >
                            +{formatIDR(dayTotalComm)}
                          </div>
                          <div
                            className={`hidden sm:block text-[9px] truncate ${
                              isSelected ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            {dayBookings[0]?.guest_name || 'Booking'}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ════════ WEEK VIEW (SPACIOUS 7-DAY STRIP) ════════ */
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map((w) => {
                const isSelected = selectedDate === w.dateString;
                return (
                  <button
                    key={w.dateString}
                    type="button"
                    onClick={() => setSelectedDate(w.dateString)}
                    className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer min-h-[52px] sm:min-h-auto ${
                      isSelected
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-md'
                        : w.isToday
                        ? 'bg-neutral-50 border-neutral-400 text-neutral-950'
                        : w.dayBookings.length > 0
                        ? 'bg-[#F2FBF7] border-emerald-200 text-neutral-900'
                        : 'bg-white border-neutral-200/70 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider opacity-70">
                      {w.dayName}
                    </div>
                    <div className="text-sm sm:text-lg font-bold mt-0.5">{w.dayNum}</div>
                    <div className="text-[10px] sm:text-xs font-semibold mt-1 sm:mt-2 truncate">
                      {w.dayBookings.length > 0 ? (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {w.dayBookings.some((b) => b.commission_status === 'approved') && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`} />
                          )}
                          {w.dayBookings.some((b) => b.commission_status === 'pending') && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`} />
                          )}
                          {!w.dayBookings.some((b) => b.commission_status === 'approved' || b.commission_status === 'pending') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                          )}
                          <span className="hidden sm:inline text-xs font-semibold ml-1">
                            {w.dayBookings.length} Bookings
                          </span>
                          <span className={`sm:hidden text-[9px] font-mono font-bold px-1 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {w.dayBookings.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-normal hidden sm:inline">0</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-neutral-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Approved</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Pending</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>Cancelled</span>
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-400 hidden sm:block">
              Click any date to inspect appointment cards
            </div>
          </div>

        </div>

        {/* ──────── APPOINTMENT DETAILS INSPECTOR (RIGHT: 4 COLS) ──────── */}
        <div className="lg:col-span-4 bg-white border border-neutral-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 lg:sticky lg:top-6">
          {/* Executive Header: Big Title with Total Bookings & Commission + Solid Cards */}
          <div className="pb-3 border-b border-neutral-100 space-y-3">
            {/* Big Title: Total Bookings on left & Total Commission on right */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                  Total Bookings
                </span>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight font-mono mt-0.5">
                  {selectedDayStats.count} <span className="text-sm sm:text-base font-bold font-sans text-neutral-600">{selectedDayStats.count === 1 ? 'Booking' : 'Bookings'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block">
                  Commission
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight tabular-nums mt-0.5">
                  +{formatIDR(selectedDayStats.totalCommission)}
                </div>
              </div>
            </div>

            {/* Approved & Pending Compact Chips: White (Green Dot) & Black (Red Dot) */}
            {selectedDayStats.count > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {/* Approved Chip: White background + Green dot */}
                <div className="inline-flex items-center gap-1.5 bg-white text-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-200/90 shadow-2xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-neutral-500 font-medium">Approved:</span>
                  <span className="font-mono font-bold text-neutral-950">{formatIDR(selectedDayStats.approvedCommission)}</span>
                </div>

                {/* Pending Chip: Black background + Red dot */}
                <div className="inline-flex items-center gap-1.5 bg-neutral-950 text-white px-2.5 py-1 rounded-xl border border-neutral-900 shadow-2xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-neutral-300 font-medium">Pending:</span>
                  <span className="font-mono font-bold text-white">{formatIDR(selectedDayStats.pendingCommission)}</span>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE FILTER TABS: All, Approved, Pending, Cancelled (Positioned directly above the booking details) */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'approved', 'pending', 'cancelled'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === mode
                    ? 'bg-neutral-950 text-white shadow-2xs font-bold'
                    : 'bg-neutral-100/90 text-neutral-600 hover:text-black border border-neutral-200/70 font-medium'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-[#FBFBFD] border border-dashed border-neutral-200/80 p-5 space-y-2">
              <CalendarIcon size={28} className="mx-auto text-neutral-300 mb-1" />
              <p className="text-xs font-bold text-neutral-800">No bookings for this date</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xs mx-auto">
                Select dates highlighted with dots on the calendar grid to inspect guest details and commission breakdown.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              {selectedDayBookings.map((b) => {
                const isApproved = b.commission_status === 'approved';
                const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                const isPaid = b.payment_status === 'paid' || b.payment_verified;

                return (
                  <div
                    key={b.id || b.booking_id}
                    className="p-4 rounded-2xl bg-[#F9FAFB] border border-neutral-200/80 space-y-3 hover:border-neutral-300 transition-colors shadow-2xs"
                  >
                    {/* Header: Status Pills & Action */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPaid ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                            Unpaid
                          </span>
                        )}

                        {isCancelled ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                            Cancelled
                          </span>
                        ) : b.booking_status === 'Ongoing' ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Ongoing Treatment
                          </span>
                        ) : b.booking_status === 'Completed' || b.service_completed ? (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                            Finish Treatment
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-200/70 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}

                        {isApproved && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            Approved
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-mono font-bold ${isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    {/* Customer Name, View Treatment Details Link, Invoice Code */}
                    <div className="space-y-1.5 pt-1">
                      <div className="font-bold text-sm text-neutral-950 flex items-center gap-1.5">
                        <User size={14} className="text-neutral-500 shrink-0" />
                        <span className="truncate">{b.guest_name || 'Guest Booking'}</span>
                      </div>

                      {/* View Treatment Details link */}
                      <div>
                        <Link
                          href={`/invoice/${b.booking_id}`}
                          target="_blank"
                          className="group inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors py-0.5 cursor-pointer"
                          title="View treatment details in invoice"
                        >
                          <FileText size={13} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="underline decoration-emerald-400 underline-offset-2 group-hover:decoration-emerald-800">
                            View Treatment Details
                          </span>
                          <ExternalLink size={11} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </Link>
                      </div>

                      {/* Invoice Code below View Treatment Details */}
                      <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-medium pt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Invoice:
                        </span>
                        <span className="font-mono text-[11px] font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/80">
                          #{b.booking_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(b.booking_id)}
                          className="text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded hover:bg-neutral-100 cursor-pointer"
                          title="Copy invoice code"
                        >
                          {copiedId === b.booking_id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Schedule & Place */}
                    <div className="bg-white rounded-xl p-2.5 border border-neutral-200/70 text-xs space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-neutral-700 truncate">
                          <CalendarIcon size={12} className="text-neutral-400 shrink-0" />
                          <span className="font-medium text-[11px] text-neutral-900 truncate">
                            {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-700 justify-end truncate">
                          <Clock size={12} className="text-neutral-400 shrink-0" />
                          <span className="font-medium text-[11px] text-neutral-900 truncate">
                            {b.time || 'Flexible'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                        <div className="flex items-center gap-1.5 text-neutral-700 truncate">
                          <MapPin size={12} className="text-neutral-400 shrink-0" />
                          <span className="text-[11px] text-neutral-800 font-medium truncate" title={b.location}>
                            {b.location || 'Villa / Hotel'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-700 justify-end truncate">
                          <DoorOpen size={12} className="text-neutral-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-neutral-900 truncate">
                            {b.room_number ? `Room ${b.room_number}` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Treatment Amount vs Earned Commission */}
                    <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-400 block">Treatment</span>
                        <span className="font-mono font-bold text-xs text-neutral-900">
                          {formatIDR(b.treatment_amount || b.gross_amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Earned ({b.commission_rate_pct}%)</span>
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          +{formatIDR(b.commission_amount)}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
