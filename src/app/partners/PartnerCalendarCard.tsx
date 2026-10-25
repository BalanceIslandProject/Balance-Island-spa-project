'use client';

import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  CalendarDays,
  ArrowUpRight
} from 'lucide-react';
import { CalendarBooking } from './FloatingBookingCalendar';

interface PartnerCalendarCardProps {
  bookings: CalendarBooking[];
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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

export default function PartnerCalendarCard({ bookings = [], className = '' }: PartnerCalendarCardProps) {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'cancelled'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

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

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Group bookings by date string YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map: Record<string, CalendarBooking[]> = {};
    for (const b of bookings) {
      if (!b.date) continue;
      const dateKey = b.date.includes('T') ? b.date.split('T')[0] : b.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(b);
    }
    return map;
  }, [bookings]);

  // Bookings for current month
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthBookings = useMemo(() => {
    return bookings.filter((b) => b.date && b.date.startsWith(monthPrefix));
  }, [bookings, monthPrefix]);

  // Month financial stats
  const monthStats = useMemo(() => {
    let count = 0;
    let totalCommission = 0;
    let approvedCommission = 0;
    let pendingCommission = 0;

    for (const b of currentMonthBookings) {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      if (isCancelled) continue;
      count++;
      totalCommission += b.commission_amount;
      if (b.commission_status === 'approved') approvedCommission += b.commission_amount;
      if (b.commission_status === 'pending') pendingCommission += b.commission_amount;
    }

    return { count, totalCommission, approvedCommission, pendingCommission };
  }, [currentMonthBookings]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Week days calculation
  const weekDays = useMemo(() => {
    let baseDate: Date;
    if (selectedDate && selectedDate.includes('-')) {
      const parts = selectedDate.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        baseDate = new Date(y, m, d);
      } else {
        baseDate = new Date(currentYear, currentMonth, 1);
      }
    } else if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
      baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
      const hasApproved = dayBookings.some((b) => b.commission_status === 'approved');
      const hasPending = dayBookings.some((b) => b.commission_status === 'pending');

      days.push({
        dateString,
        dayNum: d.getDate(),
        dayName: DAYS_OF_WEEK[i],
        isCurrentMonth: d.getMonth() === currentMonth,
        isToday,
        isSelected,
        hasBookings: dayBookings.length > 0,
        dayBookings,
        hasApproved,
        hasPending,
      });
    }
    return days;
  }, [selectedDate, currentYear, currentMonth, today, bookingsByDate]);

  // Displayed bookings (selected date or all in month)
  const displayedBookings = useMemo(() => {
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedCommissionTotal = useMemo(() => {
    return displayedBookings.reduce((sum, b) => {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      return isCancelled ? sum : sum + (b.commission_amount || 0);
    }, 0);
  }, [displayedBookings]);

  return (
    <div className={`bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.04)] rounded-[28px] overflow-hidden ring-1 ring-black/[0.03] flex flex-col transition-all ${className}`}>
      
      {/* ─── 1. Apple-Style Frosted Header ─── */}
      <div className="p-5 sm:p-6 border-b border-neutral-200/60 bg-gradient-to-b from-white/95 to-white/70 space-y-4">
        
        {/* Row 1: Month/Year Title + Navigation Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-neutral-100/90 border border-neutral-200/70 text-neutral-900 shadow-2xs shrink-0">
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-neutral-950 tracking-tight truncate">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium hidden sm:block">
                Appointments & Bookings Schedule
              </p>
            </div>
          </div>

          {/* Quick controls: Today + < > */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-neutral-200/80 bg-white/90 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="Jump to today"
            >
              Today
            </button>
            <div className="flex items-center border border-neutral-200/80 rounded-xl overflow-hidden bg-white/90 shadow-2xs">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 transition-colors border-l border-neutral-200/80 cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Month Booking Counter Badge & Month Commission Total */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100/80">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/90 border border-neutral-200/80 shadow-2xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900 whitespace-nowrap">
              TOTAL: {monthStats.count} {monthStats.count === 1 ? 'BOOKING' : 'BOOKINGS'}
            </span>
          </div>

          <div className="text-right flex items-baseline gap-1.5 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Month Total:</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono tabular-nums">
              {formatIDR(monthStats.totalCommission)}
            </span>
          </div>
        </div>

        {/* Row 3: Apple Segmented View Toggle (Month / Week) & Clear Filter */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="inline-flex p-0.5 rounded-xl bg-neutral-100/90 border border-neutral-200/70 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Week View
            </button>
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs font-semibold text-neutral-900 hover:underline px-2 py-1 cursor-pointer"
            >
              Clear Date Filter
            </button>
          )}
        </div>

      </div>

      {/* ─── 2. Interactive Calendar Grid Area ─── */}
      <div className="p-4 sm:p-5 border-b border-neutral-200/60 bg-neutral-50/50">
        {viewMode === 'month' ? (
          /* Month Calendar Grid */
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {DAYS_OF_WEEK.map((d, i) => (
                <div 
                  key={d} 
                  className={`text-[11px] font-bold tracking-wider py-1 ${i === 0 ? 'text-rose-500' : 'text-neutral-400'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10 rounded-xl" />
              ))}

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
                    type="button"
                    key={dateString}
                    onClick={() => {
                      if (selectedDate === dateString) {
                        setSelectedDate(null);
                      } else {
                        setSelectedDate(dateString);
                      }
                    }}
                    className={`min-h-[42px] sm:min-h-[46px] rounded-xl flex flex-col justify-between p-1.5 transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-950 text-white shadow-md scale-[1.04] z-10'
                        : hasBookings
                        ? 'bg-emerald-500/10 border border-emerald-400/60 hover:bg-emerald-500/20 text-neutral-900 font-semibold'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    } ${isToday && !isSelected ? 'ring-1.5 ring-neutral-950 font-bold' : ''}`}
                  >
                    {/* Top Row: Date Number on Left, Booking count badge in TOP-RIGHT CORNER */}
                    <div className="flex items-start justify-between w-full leading-none">
                      <span className={`text-xs ${isSelected ? 'font-bold text-white' : hasBookings ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                        {dayNum}
                      </span>

                      {hasBookings && (
                        <span className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded-full leading-tight shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-200/80 shadow-2xs'
                        }`}>
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Booking status indicator dots */}
                    {hasBookings && (
                      <div className="flex items-center gap-0.5 mt-auto pt-0.5">
                        {hasApproved && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`} />
                        )}
                        {hasPending && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`} />
                        )}
                        {!hasApproved && !hasPending && hasCancelled && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-neutral-400' : 'bg-neutral-300'}`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-neutral-200/60 text-xs">
              <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Approved</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Pending</span>
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">Click date to filter</span>
            </div>
          </div>
        ) : (
          /* Week Calendar Strip */
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200/80 p-2.5 sm:p-3 shadow-2xs space-y-2">
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {weekDays.map((d) => (
                <button
                  type="button"
                  key={d.dateString}
                  onClick={() => {
                    if (selectedDate === d.dateString) {
                      setSelectedDate(null);
                    } else {
                      setSelectedDate(d.dateString);
                    }
                  }}
                  className={`h-14 rounded-xl flex flex-col items-center justify-between py-1.5 px-0.5 transition-all relative cursor-pointer ${
                    d.isSelected
                      ? 'bg-neutral-950 text-white shadow-md scale-[1.04] z-10'
                      : d.hasBookings
                      ? 'bg-emerald-500/10 border border-emerald-400/60 hover:bg-emerald-500/20 text-neutral-900'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  } ${d.isToday && !d.isSelected ? 'ring-1.5 ring-neutral-950 font-bold' : ''}`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${d.isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {d.dayName}
                  </span>
                  <span className={`text-sm font-bold ${d.isSelected ? 'text-white' : d.hasBookings ? 'text-emerald-950' : 'text-neutral-800'}`}>
                    {d.dayNum}
                  </span>

                  <div className="flex items-center gap-0.5 h-1.5">
                    {d.hasApproved && (
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`} />
                    )}
                    {d.hasPending && (
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isSelected ? 'bg-rose-300' : 'bg-rose-500'}`} />
                    )}
                    {!d.hasBookings && <span className="w-1.5 h-1.5" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Booking Details List ─── */}
      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col min-h-0">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/70 text-xs w-full shrink-0">
          {(['all', 'approved', 'pending', 'cancelled'] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-1.5 px-1.5 rounded-lg capitalize font-bold text-xs transition-all cursor-pointer text-center ${
                statusFilter === s
                  ? 'bg-neutral-950 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Scrollable Bookings Stream */}
        <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 overscroll-contain">
          {displayedBookings.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-neutral-200/90 bg-white/60 space-y-2">
              <CalendarIcon size={24} className="mx-auto text-neutral-400" />
              <p className="text-xs font-semibold text-neutral-900">
                {selectedDate 
                  ? 'No referred appointments for this day.' 
                  : `No appointments found for ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
              </p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Referred bookings from your QR code or referral link appear here automatically.
              </p>
            </div>
          ) : (
            displayedBookings.map((b, idx) => {
              const isApproved = b.commission_status === 'approved';
              const isPaidCommission = b.commission_status === 'paid';
              const isPendingCommission = b.commission_status === 'pending';
              const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
              const isPaid = b.payment_status === 'paid' || b.payment_verified;
              const itemKey = b.id || b.booking_id || `cal-booking-${idx}`;

              return (
                <div
                  key={itemKey}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isCancelled 
                      ? 'border-neutral-200 bg-neutral-50/70 opacity-80' 
                      : 'border-neutral-200/80 bg-white/90 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Status Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-neutral-100">
                    {/* Payment Status */}
                    {isPaid ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/90 shadow-2xs">
                        Paid
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/90 shadow-2xs">
                        Unpaid
                      </span>
                    )}

                    {/* Treatment Status */}
                    {isCancelled ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/90 shadow-2xs">
                        Cancelled
                      </span>
                    ) : b.booking_status === 'Ongoing' ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/90 shadow-2xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Ongoing Treatment
                      </span>
                    ) : b.booking_status === 'Completed' || b.service_completed ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/90 shadow-2xs">
                        Finish Treatment
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/90 shadow-2xs">
                        Pending
                      </span>
                    )}

                    {/* Commission Status */}
                    {!isCancelled && (
                      <>
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/90 shadow-2xs">
                            <CheckCircle2 size={11} />
                            Approved
                          </span>
                        )}
                        {isPendingCommission && (b.booking_status === 'Ongoing' || b.booking_status === 'Completed') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/90 shadow-2xs">
                            <Clock size={11} />
                            Pending
                          </span>
                        )}
                        {isPaidCommission && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black px-2.5 py-0.5 rounded-full border border-black shadow-2xs">
                            ✓ Paid Out
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Customer Name, View Details Link & Invoice Code */}
                  <div className="space-y-1 pt-0.5">
                    <div className="font-bold text-sm text-neutral-950 flex items-center gap-1.5">
                      <User size={14} className="text-neutral-500 shrink-0" />
                      <span className="truncate">{b.guest_name || 'Guest Booking'}</span>
                    </div>

                    {/* Clickable View Treatment Details */}
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

                    {/* Invoice ID with copy */}
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
                        title="Copy invoice ID"
                      >
                        {copiedId === b.booking_id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Schedule & Place Box */}
                  <div className="bg-neutral-50/90 rounded-xl p-2.5 border border-neutral-100 text-xs space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-neutral-700 min-w-0">
                        <CalendarIcon size={12} className="text-neutral-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">Date:</span>
                        <span className="font-semibold text-[11px] text-neutral-900 truncate">
                          {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-700 min-w-0 sm:justify-end">
                        <Clock size={12} className="text-neutral-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">Time:</span>
                        <span className="font-semibold text-[11px] text-neutral-900 truncate">
                          {b.time || 'Flexible'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200/50">
                      <div className="flex items-center gap-1.5 text-neutral-700 min-w-0">
                        <MapPin size={12} className="text-neutral-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">Place:</span>
                        <span className="text-[11px] text-neutral-800 font-medium truncate" title={b.location}>
                          {b.location || 'Villa / Hotel'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-700 min-w-0 sm:justify-end">
                        <DoorOpen size={12} className="text-neutral-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">Room:</span>
                        <span className="text-[11px] font-semibold text-neutral-900 truncate">
                          {b.room_number ? b.room_number : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financials Row: Treatment Price & Earned Commission */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-neutral-400 uppercase font-extrabold tracking-wider">Treatment</span>
                      <span className="text-xs font-bold text-neutral-900 font-mono tabular-nums">
                        {formatIDR(b.treatment_amount || b.gross_amount)}
                      </span>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-emerald-700 uppercase font-extrabold tracking-wider">Earned</span>
                      {isCancelled ? (
                        <span className="text-xs font-bold text-rose-600 font-mono tabular-nums">
                          IDR 0
                        </span>
                      ) : (
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                            +{formatIDR(b.commission_amount)}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-medium">({b.commission_rate_pct}%)</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ─── 4. Apple-Style Native Footer ─── */}
      <div className="px-5 py-3.5 border-t border-neutral-200/70 bg-gradient-to-t from-white/95 to-white/70 flex items-center justify-between text-xs shrink-0">
        <span className="text-neutral-600 font-extrabold uppercase tracking-wider text-[11px]">
          {displayedBookings.length} {displayedBookings.length === 1 ? 'APPOINTMENT' : 'APPOINTMENTS'}
        </span>
        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">TOTAL:</span>
          <span className="font-extrabold text-neutral-950 text-sm">
            {formatIDR(displayedCommissionTotal)}
          </span>
        </div>
      </div>

    </div>
  );
}
