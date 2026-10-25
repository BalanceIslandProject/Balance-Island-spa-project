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
    <div className="w-full max-w-[1600px] mx-auto space-y-4 lg:space-y-3.5 pb-16 lg:pb-0 font-sans antialiased text-black lg:h-[calc(100vh-5rem)] lg:flex lg:flex-col lg:overflow-hidden">
      
      {/* Mobile Top Calendar Controls (hidden on desktop where controls are integrated into the calendar card) */}
      <div className="flex lg:hidden items-center justify-between w-full gap-2 pb-2 border-b border-[#E5E5E5] shrink-0">
        <div className="inline-flex items-center bg-white border border-[#E5E5E5] rounded-lg p-0.5">
          <button
            type="button"
            onClick={goToPrev}
            className="p-1.5 hover:bg-[#F5F5F5] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-black"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-2 sm:px-3 text-xs font-bold text-black min-w-[105px] sm:min-w-[130px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>
          <button
            type="button"
            onClick={goToNext}
            className="p-1.5 hover:bg-[#F5F5F5] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-black"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-black text-white shadow-xs' : 'text-[#737373] hover:text-black'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-black text-white shadow-xs' : 'text-[#737373] hover:text-black'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MONTH FINANCIAL SUMMARY STRIP
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {/* Total Appointments */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
            Appointments
          </span>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono">
            {monthStats.count}
          </div>
          <p className="text-[10px] text-[#737373] truncate">Scheduled this month</p>
        </div>

        {/* Total Commission */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
            Month Total
          </span>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono tabular-nums truncate">
            {formatIDR(monthStats.totalCommission)}
          </div>
          <p className="text-[10px] text-[#737373] truncate">All active commissions</p>
        </div>

        {/* Approved Commission */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
                Approved
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
              Ready
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums truncate">
            {formatIDR(monthStats.approvedCommission)}
          </div>
          <p className="text-[10px] text-[#737373] truncate">Ready for bank transfer</p>
        </div>

        {/* Pending Commission */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 space-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
                Pending
              </span>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
              Treatment
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 font-mono tabular-nums truncate">
            {formatIDR(monthStats.pendingCommission)}
          </div>
          <p className="text-[10px] text-[#737373] truncate">Awaiting treatment completion</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL SCREEN RESPONSIVE DESKTOP WORKSPACE (12-COL GRID)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start lg:items-stretch lg:flex-1 lg:min-h-0">
        
        {/* ──────── CALENDAR GRID AREA (LEFT / CENTER: 7 COLS) ──────── */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-xl p-4 sm:p-5 space-y-3 lg:h-full lg:flex lg:flex-col lg:justify-between lg:overflow-hidden">
          
          {/* DESKTOP CALENDAR HEADER: < October 2026 > Navigator on Left, Today & Month/Week on Right */}
          <div className="hidden lg:flex items-center justify-between gap-3 pb-2.5 border-b border-[#E5E5E5] shrink-0">
            {/* Month pagination: < October 2026 > */}
            <div className="inline-flex items-center bg-white border border-[#E5E5E5] rounded-lg p-0.5">
              <button
                type="button"
                onClick={goToPrev}
                className="p-1.5 hover:bg-[#F5F5F5] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-black"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 text-xs font-bold text-black min-w-[115px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={goToNext}
                className="p-1.5 hover:bg-[#F5F5F5] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-black"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Right side: Today + Month/Week Switcher + Clear Selection */}
            <div className="flex items-center gap-2">
              {selectedDate && (
                <div className="flex items-center gap-2 text-xs mr-1">
                  <span className="text-[#737373] font-medium">
                    Showing: <strong className="text-black">{safeFormatDate(selectedDate, { day: 'numeric', month: 'short' })}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(null);
                      setViewMode('month');
                    }}
                    className="text-black hover:underline font-semibold text-xs cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#E5E5E5] text-black hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              >
                Today
              </button>

              <div className="inline-flex p-0.5 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'month' ? 'bg-black text-white shadow-xs' : 'text-[#737373] hover:text-black'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'week' ? 'bg-black text-white shadow-xs' : 'text-[#737373] hover:text-black'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'month' ? (
            /* ════════ MONTH VIEW GRID ════════ */
            <div className="space-y-1 sm:space-y-1.5 flex-1 min-h-0 flex flex-col justify-around">
              {/* Day Name Header Row */}
              <div className="grid grid-cols-7 text-center shrink-0">
                {DAYS_OF_WEEK.map((d, i) => (
                  <div
                    key={d}
                    className={`py-1 text-[11px] font-semibold uppercase tracking-wider ${
                      i === 0 ? 'text-red-500' : 'text-[#737373]'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 min-h-0">
                {/* Empty leading cells */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[46px] sm:min-h-[50px] lg:min-h-0 lg:h-[50px] xl:h-[54px] rounded-lg bg-[#FAFAFA]" />
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

                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => handleDateClick(dateString)}
                      className={`min-h-[46px] sm:min-h-[50px] lg:min-h-0 lg:h-[50px] xl:h-[54px] p-1.5 sm:p-2 rounded-lg flex flex-col justify-between text-left transition-all cursor-pointer border relative group ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-sm z-10'
                          : isToday
                          ? 'bg-[#FAFAFA] border-black text-black'
                          : hasBookings
                          ? 'bg-[#F2FBF7] border-emerald-200 hover:border-emerald-400 text-black'
                          : 'bg-white border-[#E5E5E5] hover:bg-[#F9FAFB] text-black'
                      }`}
                    >
                      {/* Top Row: Date Number & Number of Bookings */}
                      <div className="flex items-start justify-between w-full leading-none">
                        <span
                          className={`text-xs font-semibold ${
                            isSelected
                              ? 'text-white'
                              : isToday
                              ? 'text-black underline underline-offset-2'
                              : 'text-black'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {hasBookings && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md leading-none shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                            title={`${dayBookings.length} bookings`}
                          >
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Status dots */}
                      {hasBookings && (
                        <div className="flex items-center gap-1 mt-auto pt-0.5">
                          {hasApproved && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                              }`}
                              title="Approved Booking"
                            />
                          )}
                          {hasPending && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-amber-300' : 'bg-amber-500'
                              }`}
                              title="Pending Booking"
                            />
                          )}
                          {!hasApproved && !hasPending && hasCancelled && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#737373]" title="Cancelled" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ════════ WEEK VIEW ════════ */
            <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-0">
              {weekDays.map((w) => {
                const isSelected = selectedDate === w.dateString;
                return (
                  <button
                    key={w.dateString}
                    type="button"
                    onClick={() => setSelectedDate(w.dateString)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer min-h-[50px] sm:min-h-[90px] lg:min-h-0 lg:h-[80px] xl:h-[90px] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-sm'
                        : w.isToday
                        ? 'bg-[#FAFAFA] border-black text-black'
                        : w.dayBookings.length > 0
                        ? 'bg-[#F2FBF7] border-emerald-200 text-black'
                        : 'bg-white border-[#E5E5E5] hover:bg-[#F9FAFB] text-black'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold tracking-wider opacity-70">
                      {w.dayName}
                    </div>
                    <div className="text-sm sm:text-base font-bold mt-0.5">{w.dayNum}</div>
                    <div className="text-xs font-semibold mt-1 truncate">
                      {w.dayBookings.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {w.dayBookings.some((b) => b.commission_status === 'approved') && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`} />
                          )}
                          {w.dayBookings.some((b) => b.commission_status === 'pending') && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                          )}
                          {!w.dayBookings.some((b) => b.commission_status === 'approved' || b.commission_status === 'pending') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#737373]" />
                          )}
                          <span className="text-xs font-semibold">
                            {w.dayBookings.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#737373]/60 font-normal">0</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E5E5E5] text-xs shrink-0">
            <div className="flex items-center gap-4 text-xs text-[#737373] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Approved</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#737373]" />
                <span>Cancelled</span>
              </span>
            </div>
            <div className="text-xs text-[#737373] hidden sm:block">
              Click any date to inspect appointment details
            </div>
          </div>

        </div>

        {/* ──────── APPOINTMENT DETAILS INSPECTOR (RIGHT: 5 COLS) ──────── */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E5] rounded-xl p-4 sm:p-5 space-y-3.5 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
          {/* Executive Header on Desktop:
              Side-by-side Approved and Pending cards */}
          {(selectedDate ? selectedDayStats.count > 0 : true) && (
            <div className="hidden lg:grid grid-cols-2 gap-2.5 text-xs pb-3 border-b border-[#E5E5E5] shrink-0">
              {/* Approved Card */}
              <div className="flex items-center justify-between gap-2 bg-white text-black px-3.5 py-2.5 rounded-lg border border-[#E5E5E5] font-semibold">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[#737373] font-medium text-xs">Approved</span>
                </div>
                <span className="font-mono font-bold text-black text-xs sm:text-sm tabular-nums whitespace-nowrap shrink-0">
                  {formatIDR(selectedDate ? selectedDayStats.approvedCommission : monthStats.approvedCommission)}
                </span>
              </div>

              {/* Pending Card */}
              <div className="flex items-center justify-between gap-2 bg-white text-black px-3.5 py-2.5 rounded-lg border border-[#E5E5E5] font-semibold">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[#737373] font-medium text-xs">Pending</span>
                </div>
                <span className="font-mono font-bold text-black text-xs sm:text-sm tabular-nums whitespace-nowrap shrink-0">
                  {formatIDR(selectedDate ? selectedDayStats.pendingCommission : monthStats.pendingCommission)}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Header: Big Title with Total Bookings & Commission */}
          <div className="lg:hidden pb-3 border-b border-[#E5E5E5] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
                  Total Bookings
                </span>
                <div className="text-xl font-bold text-black font-mono mt-0.5">
                  {selectedDayStats.count} <span className="text-xs font-semibold font-sans text-[#737373]">{selectedDayStats.count === 1 ? 'Booking' : 'Bookings'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                  Commission
                </span>
                <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                  +{formatIDR(selectedDayStats.totalCommission)}
                </div>
              </div>
            </div>

            {selectedDayStats.count > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 bg-white text-black px-2.5 py-1 rounded-md border border-[#E5E5E5] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[#737373] font-medium">Approved:</span>
                  <span className="font-mono font-bold text-black">{formatIDR(selectedDayStats.approvedCommission)}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-white text-black px-2.5 py-1 rounded-md border border-[#E5E5E5] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[#737373] font-medium">Pending:</span>
                  <span className="font-mono font-bold text-black">{formatIDR(selectedDayStats.pendingCommission)}</span>
                </div>
              </div>
            )}
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
            {(['all', 'approved', 'pending', 'cancelled'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer border ${
                  statusFilter === mode
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-[#737373] border-[#E5E5E5] hover:text-black hover:border-black'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] p-5 space-y-2 shrink-0">
              <CalendarIcon size={24} className="mx-auto text-[#737373]/40 mb-1" />
              <p className="text-xs font-bold text-black">No bookings for this date</p>
              <p className="text-xs text-[#737373] leading-relaxed max-w-xs mx-auto">
                Select dates highlighted with dots on the calendar grid to inspect guest details and commission breakdown.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto lg:flex-1 lg:min-h-0 pr-1 max-h-[75vh] lg:max-h-none">
              {selectedDayBookings.map((b) => {
                const isApproved = b.commission_status === 'approved';
                const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                const isPaid = b.payment_status === 'paid' || b.payment_verified;

                return (
                  <div
                    key={b.id || b.booking_id}
                    className="p-4 rounded-xl bg-white border border-[#E5E5E5] space-y-3 hover:border-black/30 transition-colors"
                  >
                    {/* Header: Status Pills & Action */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPaid ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {b.payment_method === 'cash' ? 'Paid (Cash)' : b.payment_method === 'online' ? 'Paid (Online)' : 'Paid'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Unpaid
                          </span>
                        )}

                        {isCancelled ? (
                          <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            Cancelled
                          </span>
                        ) : b.booking_status === 'Ongoing' ? (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Ongoing
                          </span>
                        ) : b.booking_status === 'Completed' || b.service_completed ? (
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            Finish
                          </span>
                        ) : b.booking_status === 'Confirmed' ? (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Awaiting Treatment
                          </span>
                        )}

                        {b.commission_status === 'paid' ? (
                          <span className="text-[10px] font-semibold text-white bg-black px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            ✓ Paid Out
                          </span>
                        ) : isApproved ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Approved
                          </span>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-mono font-bold ${isCancelled ? 'line-through text-[#737373]' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    {/* Customer Name, View Treatment Details Link, Invoice Code */}
                    <div className="space-y-1.5 pt-1">
                      <div className="font-semibold text-sm text-black flex items-center gap-1.5">
                        <User size={14} className="text-[#737373] shrink-0" />
                        <span className="truncate">{b.guest_name || 'Guest Booking'}</span>
                      </div>

                      {/* View Treatment Details link */}
                      <div>
                        <Link
                          href={`/invoice/${b.booking_id}`}
                          target="_blank"
                          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-black hover:underline py-0.5 cursor-pointer"
                          title="View treatment details in invoice"
                        >
                          <FileText size={13} className="text-[#737373] shrink-0" />
                          <span>View Treatment Details</span>
                          <ExternalLink size={11} className="text-[#737373] shrink-0" />
                        </Link>
                      </div>

                      {/* Invoice Code below View Treatment Details */}
                      <div className="flex items-center gap-1.5 text-[#737373] text-xs font-medium pt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                          Invoice:
                        </span>
                        <span className="font-mono text-xs font-bold text-black bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                          #{b.booking_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(b.booking_id)}
                          className="text-[#737373] hover:text-black transition-colors p-1 rounded hover:bg-[#F5F5F5] cursor-pointer"
                          title="Copy invoice code"
                        >
                          {copiedId === b.booking_id ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Schedule & Place */}
                    <div className="bg-[#FAFAFA] rounded-lg p-2.5 border border-[#E5E5E5] text-xs space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-black truncate">
                          <CalendarIcon size={12} className="text-[#737373] shrink-0" />
                          <span className="font-medium text-xs text-black truncate">
                            {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-black justify-end truncate">
                          <Clock size={12} className="text-[#737373] shrink-0" />
                          <span className="font-medium text-xs text-black truncate">
                            {b.time || 'Flexible'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E5E5E5]">
                        <div className="flex items-center gap-1.5 text-black truncate">
                          <MapPin size={12} className="text-[#737373] shrink-0" />
                          <span className="text-xs text-black font-medium truncate" title={b.location}>
                            {b.location || 'Villa / Hotel'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-black justify-end truncate">
                          <DoorOpen size={12} className="text-[#737373] shrink-0" />
                          <span className="text-xs font-semibold text-black truncate">
                            {b.room_number ? `Room ${b.room_number}` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Treatment Amount vs Earned Commission */}
                    <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#737373] block">Treatment</span>
                        <span className="font-mono font-bold text-xs text-black">
                          {formatIDR(b.treatment_amount || b.gross_amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Earned ({b.commission_rate_pct}%)</span>
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
