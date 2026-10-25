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
    <div className={`bg-white border border-[#E5E5E5] rounded-xl overflow-hidden flex flex-col font-sans transition-all ${className}`}>
      
      {/* ─── 1. Header ─── */}
      <div className="p-4 sm:p-5 border-b border-[#E5E5E5] bg-white space-y-3.5">
        
        {/* Row 1: Month/Year Title + Navigation Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] text-black shrink-0">
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-black tracking-tight truncate">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <p className="text-xs text-[#737373] hidden sm:block">
                Appointments & Bookings Schedule
              </p>
            </div>
          </div>

          {/* Quick controls: Today + < > */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E5E5E5] bg-white text-black hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              title="Jump to today"
            >
              Today
            </button>
            <div className="flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 hover:bg-[#F5F5F5] text-[#737373] hover:text-black transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 hover:bg-[#F5F5F5] text-[#737373] hover:text-black transition-colors border-l border-[#E5E5E5] cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Month Booking Counter Badge & Month Commission Total */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E5E5]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F5F5] border border-[#E5E5E5] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-black whitespace-nowrap">
              TOTAL: {monthStats.count} {monthStats.count === 1 ? 'BOOKING' : 'BOOKINGS'}
            </span>
          </div>

          <div className="text-right flex items-baseline gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Month Total:</span>
            <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono tabular-nums">
              {formatIDR(monthStats.totalCommission)}
            </span>
          </div>
        </div>

        {/* Row 3: Segmented View Toggle (Month / Week) & Clear Filter */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="inline-flex p-0.5 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              Week View
            </button>
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs font-semibold text-black hover:underline px-2 py-1 cursor-pointer"
            >
              Clear Date Filter
            </button>
          )}
        </div>

      </div>

      {/* ─── 2. Interactive Calendar Grid Area ─── */}
      <div className="p-4 sm:p-5 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        {viewMode === 'month' ? (
          /* Month Calendar Grid */
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-3 sm:p-4">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {DAYS_OF_WEEK.map((d, i) => (
                <div 
                  key={d} 
                  className={`text-[11px] font-semibold tracking-wider py-1 ${i === 0 ? 'text-red-500' : 'text-[#737373]'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10 rounded-lg" />
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
                    className={`min-h-[42px] sm:min-h-[46px] rounded-lg flex flex-col justify-between p-1.5 transition-all relative cursor-pointer border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-sm z-10'
                        : isToday
                        ? 'bg-[#FAFAFA] border-black text-black'
                        : hasBookings
                        ? 'bg-[#F2FBF7] border-emerald-200 hover:border-emerald-400 text-black'
                        : 'bg-white border-[#E5E5E5] hover:bg-[#F9FAFB] text-black'
                    }`}
                  >
                    {/* Top Row: Date Number on Left, Booking count badge in TOP-RIGHT CORNER */}
                    <div className="flex items-start justify-between w-full leading-none">
                      <span className={`text-xs ${isSelected ? 'font-bold text-white' : 'font-semibold text-black'}`}>
                        {dayNum}
                      </span>

                      {hasBookings && (
                        <span className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded-md leading-tight shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Booking status indicator dots */}
                    {hasBookings && (
                      <div className="flex items-center gap-0.5 mt-auto pt-0.5">
                        {hasApproved && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                        )}
                        {hasPending && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                        )}
                        {!hasApproved && !hasPending && hasCancelled && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#737373]' : 'bg-[#E5E5E5]'}`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#E5E5E5] text-xs">
              <div className="flex items-center gap-3 text-xs text-[#737373] font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Approved</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Pending</span>
                </span>
              </div>
              <span className="text-[10px] text-[#737373]">Click date to filter</span>
            </div>
          </div>
        ) : (
          /* Week Calendar Strip */
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-2.5 sm:p-3 space-y-2">
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
                  className={`h-14 rounded-lg flex flex-col items-center justify-between py-1.5 px-0.5 transition-all relative cursor-pointer border ${
                    d.isSelected
                      ? 'bg-black text-white border-black shadow-sm z-10'
                      : d.isToday
                      ? 'bg-[#FAFAFA] border-black text-black'
                      : d.hasBookings
                      ? 'bg-[#F2FBF7] border-emerald-200 text-black'
                      : 'bg-white border-[#E5E5E5] hover:bg-[#F9FAFB] text-black'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${d.isSelected ? 'text-white/70' : 'text-[#737373]'}`}>
                    {d.dayName}
                  </span>
                  <span className={`text-sm font-bold ${d.isSelected ? 'text-white' : 'text-black'}`}>
                    {d.dayNum}
                  </span>

                  <div className="flex items-center gap-0.5 h-1.5">
                    {d.hasApproved && (
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                    )}
                    {d.hasPending && (
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
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
      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col min-h-0 bg-white">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5] text-xs w-full shrink-0">
          {(['all', 'approved', 'pending', 'cancelled'] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-1.5 px-1.5 rounded-md capitalize font-semibold text-xs transition-all cursor-pointer text-center ${
                statusFilter === s
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Scrollable Bookings Stream */}
        <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 overscroll-contain">
          {displayedBookings.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
              <CalendarIcon size={24} className="mx-auto text-[#737373]/40" />
              <p className="text-xs font-semibold text-black">
                {selectedDate 
                  ? 'No referred appointments for this day.' 
                  : `No appointments found for ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
              </p>
              <p className="text-xs text-[#737373] max-w-xs mx-auto leading-relaxed">
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
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-2.5 ${
                    isCancelled 
                      ? 'border-[#E5E5E5] bg-[#FAFAFA] opacity-80' 
                      : 'border-[#E5E5E5] bg-white hover:border-black/30'
                  }`}
                >
                  {/* Top Status Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-[#E5E5E5]">
                    {/* Payment Status */}
                    {isPaid ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {b.payment_method === 'cash' ? 'Paid (Cash)' : b.payment_method === 'online' ? 'Paid (Online)' : 'Paid'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Unpaid
                      </span>
                    )}

                    {/* Treatment Status */}
                    {isCancelled ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        Cancelled
                      </span>
                    ) : b.booking_status === 'Ongoing' || b.treatment_status === 'Ongoing' || b.treatment_status === 'In Progress' ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Ongoing
                      </span>
                    ) : b.booking_status === 'Completed' || b.treatment_status === 'Finish' || b.treatment_status === 'Finished' || b.service_completed ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Finish
                      </span>
                    ) : b.booking_status === 'Confirmed' ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Awaiting Treatment
                      </span>
                    )}

                    {/* Commission Status */}
                    {!isCancelled && (
                      <>
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Approved
                          </span>
                        )}
                        {isPendingCommission && (b.booking_status === 'Ongoing' || b.booking_status === 'Completed') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock size={11} />
                            Pending
                          </span>
                        )}
                        {isPaidCommission && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-black px-2 py-0.5 rounded-md">
                            ✓ Paid Out
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Customer Name, View Details Link & Invoice Code */}
                  <div className="space-y-1 pt-0.5">
                    <div className="font-semibold text-sm text-black flex items-center gap-1.5">
                      <User size={14} className="text-[#737373] shrink-0" />
                      <span className="truncate">{b.guest_name || 'Guest Booking'}</span>
                    </div>

                    {/* Clickable View Treatment Details */}
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

                    {/* Invoice ID with copy */}
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
                        title="Copy invoice ID"
                      >
                        {copiedId === b.booking_id ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Schedule & Place Box */}
                  <div className="bg-[#FAFAFA] rounded-lg p-2.5 border border-[#E5E5E5] text-xs space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-black min-w-0">
                        <CalendarIcon size={12} className="text-[#737373] shrink-0" />
                        <span className="text-[10px] font-semibold uppercase text-[#737373] shrink-0">Date:</span>
                        <span className="font-semibold text-xs text-black truncate">
                          {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-black min-w-0 sm:justify-end">
                        <Clock size={12} className="text-[#737373] shrink-0" />
                        <span className="text-[10px] font-semibold uppercase text-[#737373] shrink-0">Time:</span>
                        <span className="font-semibold text-xs text-black truncate">
                          {b.time || 'Flexible'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E5E5E5]">
                      <div className="flex items-center gap-1.5 text-black min-w-0">
                        <MapPin size={12} className="text-[#737373] shrink-0" />
                        <span className="text-[10px] font-semibold uppercase text-[#737373] shrink-0">Place:</span>
                        <span className="text-xs text-black font-medium truncate" title={b.location}>
                          {b.location || 'Villa / Hotel'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-black min-w-0 sm:justify-end">
                        <DoorOpen size={12} className="text-[#737373] shrink-0" />
                        <span className="text-[10px] font-semibold uppercase text-[#737373] shrink-0">Room:</span>
                        <span className="text-xs font-semibold text-black truncate">
                          {b.room_number ? b.room_number : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financials Row: Treatment Price & Earned Commission */}
                  <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#737373] uppercase font-semibold tracking-wider">Treatment</span>
                      <span className="text-xs font-bold text-black font-mono tabular-nums">
                        {formatIDR(b.treatment_amount || b.gross_amount)}
                      </span>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold tracking-wider">Earned</span>
                      {isCancelled ? (
                        <span className="text-xs font-bold text-red-600 font-mono tabular-nums">
                          IDR 0
                        </span>
                      ) : (
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                            +{formatIDR(b.commission_amount)}
                          </span>
                          <span className="text-[10px] text-[#737373] font-medium">({b.commission_rate_pct}%)</span>
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

      {/* ─── 4. Footer ─── */}
      <div className="px-5 py-3.5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between text-xs shrink-0">
        <span className="text-[#737373] font-semibold uppercase tracking-wider text-xs">
          {displayedBookings.length} {displayedBookings.length === 1 ? 'APPOINTMENT' : 'APPOINTMENTS'}
        </span>
        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">TOTAL:</span>
          <span className="font-bold text-black text-sm">
            {formatIDR(displayedCommissionTotal)}
          </span>
        </div>
      </div>

    </div>
  );
}
