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
  FileText, 
  ExternalLink,
  CheckCircle2,
  CalendarDays
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
    <div className={`bg-white border border-[#ebebeb] rounded-[6px] overflow-hidden flex flex-col font-sans transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.04)] ${className}`}>
      
      {/* ─── 1. Header ─── */}
      <div className="p-4 sm:p-5 border-b border-[#ebebeb] bg-white space-y-3.5">
        
        {/* Row 1: Month/Year Title + Navigation Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-[#171717] shrink-0">
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight truncate">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <p className="font-mono text-xs text-[#666666] hidden sm:block">
                Appointments & Bookings Schedule
              </p>
            </div>
          </div>

          {/* Quick controls: Today + < > */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#ebebeb] bg-white text-[#171717] hover:bg-[#fafafa] transition-colors cursor-pointer"
              title="Jump to today"
            >
              Today
            </button>
            <div className="flex items-center border border-[#ebebeb] rounded-[6px] overflow-hidden bg-white">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 hover:bg-[#fafafa] text-[#666666] hover:text-[#171717] transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 hover:bg-[#fafafa] text-[#666666] hover:text-[#171717] transition-colors border-l border-[#ebebeb] cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Month Booking Counter Badge & Month Commission Total */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ebebeb]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#fafafa] border border-[#ebebeb] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a] shrink-0" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.071em] text-[#171717] whitespace-nowrap">
              TOTAL: {monthStats.count} {monthStats.count === 1 ? 'BOOKING' : 'BOOKINGS'}
            </span>
          </div>

          <div className="text-right flex items-baseline gap-1.5 shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">Month Total:</span>
            <span className="text-sm sm:text-base font-bold text-[#297a3a] font-mono tabular-nums">
              {formatIDR(monthStats.totalCommission)}
            </span>
          </div>
        </div>

        {/* Row 3: Segmented View Toggle (Month / Week) & Clear Filter */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="inline-flex p-0.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-[4px] font-medium transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-[4px] font-medium transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              Week View
            </button>
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="font-mono text-xs font-medium text-[#171717] hover:underline px-2 py-1 cursor-pointer"
            >
              Clear Date Filter
            </button>
          )}
        </div>

      </div>

      {/* ─── 2. Interactive Calendar Grid Area ─── */}
      <div className="p-4 sm:p-5 border-b border-[#ebebeb] bg-[#fafafa]">
        {viewMode === 'month' ? (
          /* Month Calendar Grid */
          <div className="bg-white rounded-[6px] border border-[#ebebeb] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {DAYS_OF_WEEK.map((d, i) => (
                <div 
                  key={d} 
                  className={`font-mono text-[11px] font-medium uppercase tracking-[0.071em] py-1 ${i === 0 ? 'text-red-500' : 'text-[#666666]'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10 rounded-[6px]" />
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
                    className={`min-h-[42px] sm:min-h-[46px] rounded-[6px] flex flex-col justify-between p-1.5 transition-all relative cursor-pointer border ${
                      isSelected
                        ? 'bg-[#171717] text-white border-[#171717] shadow-sm z-10'
                        : isToday
                        ? 'bg-[#fafafa] border-[#171717] text-[#171717]'
                        : hasBookings
                        ? 'bg-[#297a3a]/5 border-[#297a3a]/30 hover:border-[#297a3a] text-[#171717]'
                        : 'bg-white border-[#ebebeb] hover:bg-[#fafafa] text-[#171717]'
                    }`}
                  >
                    {/* Top Row: Date Number on Left, Booking count badge in TOP-RIGHT CORNER */}
                    <div className="flex items-start justify-between w-full leading-none">
                      <span className={`text-xs ${isSelected ? 'font-bold text-white' : 'font-semibold text-[#171717]'}`}>
                        {dayNum}
                      </span>

                      {hasBookings && (
                        <span className={`text-[8px] sm:text-[9px] font-mono font-medium px-1 rounded-[4px] leading-tight shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#297a3a]/15 text-[#297a3a] border border-[#297a3a]/25'
                        }`}>
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Booking status indicator dots */}
                    {hasBookings && (
                      <div className="flex items-center gap-0.5 mt-auto pt-0.5">
                        {hasApproved && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-[#297a3a]'}`} />
                        )}
                        {hasPending && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                        )}
                        {!hasApproved && !hasPending && hasCancelled && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#666666]' : 'bg-[#ebebeb]'}`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#ebebeb] text-xs">
              <div className="flex items-center gap-3 font-mono text-[11px] text-[#666666] font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a]" />
                  <span>Approved</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Pending</span>
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#666666]">Click date to filter</span>
            </div>
          </div>
        ) : (
          /* Week Calendar Strip */
          <div className="bg-white rounded-[6px] border border-[#ebebeb] p-2.5 sm:p-3 space-y-2 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
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
                  className={`h-14 rounded-[6px] flex flex-col items-center justify-between py-1.5 px-0.5 transition-all relative cursor-pointer border ${
                    d.isSelected
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm z-10'
                      : d.isToday
                      ? 'bg-[#fafafa] border-[#171717] text-[#171717]'
                      : d.hasBookings
                      ? 'bg-[#297a3a]/5 border-[#297a3a]/30 text-[#171717]'
                      : 'bg-white border-[#ebebeb] hover:bg-[#fafafa] text-[#171717]'
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase font-medium tracking-[0.071em] ${d.isSelected ? 'text-white/70' : 'text-[#666666]'}`}>
                    {d.dayName}
                  </span>
                  <span className={`text-sm font-bold ${d.isSelected ? 'text-white' : 'text-[#171717]'}`}>
                    {d.dayNum}
                  </span>

                  <div className="flex items-center gap-0.5 h-1.5">
                    {d.hasApproved && (
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isSelected ? 'bg-emerald-300' : 'bg-[#297a3a]'}`} />
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
        <div className="flex items-center gap-1 bg-[#fafafa] p-1 rounded-[6px] border border-[#ebebeb] text-xs w-full shrink-0">
          {(['all', 'approved', 'pending', 'cancelled'] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-1.5 px-1.5 rounded-[4px] capitalize font-medium text-xs transition-all cursor-pointer text-center ${
                statusFilter === s
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#171717]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Scrollable Bookings Stream */}
        <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 overscroll-contain">
          {displayedBookings.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-[6px] border border-[#ebebeb] bg-[#fafafa] space-y-2">
              <CalendarIcon size={24} className="mx-auto text-[#a8a8a8]" />
              <p className="text-xs font-semibold text-[#171717]">
                {selectedDate 
                  ? 'No referred appointments for this day.' 
                  : `No appointments found for ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
              </p>
              <p className="text-xs text-[#666666] max-w-xs mx-auto leading-relaxed">
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
                  className={`p-3.5 sm:p-4 rounded-[6px] border transition-all space-y-3 ${
                    isCancelled 
                      ? 'border-[#ebebeb] bg-[#fafafa] opacity-80' 
                      : 'border-[#ebebeb] bg-white hover:border-[#171717]/40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  {/* Top Row: Status Badges & Invoice ID */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPaid ? (
                        <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                          {b.payment_method === 'cash' ? 'Paid (Cash)' : 'Paid'}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                          Unpaid
                        </span>
                      )}

                      {isCancelled ? (
                        <span className="font-mono text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-[4px] border border-red-200">
                          Cancelled
                        </span>
                      ) : b.booking_status === 'Ongoing' || b.treatment_status === 'Ongoing' || b.treatment_status === 'In Progress' ? (
                        <span className="font-mono text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-[4px] border border-indigo-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Ongoing
                        </span>
                      ) : b.booking_status === 'Completed' || b.treatment_status === 'Finish' || b.treatment_status === 'Finished' || b.service_completed ? (
                        <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                          Finish
                        </span>
                      ) : b.booking_status === 'Confirmed' ? (
                        <span className="font-mono text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                          Confirmed
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                          Awaiting Treatment
                        </span>
                      )}

                      {isPaidCommission ? (
                        <span className="font-mono text-[10px] font-medium text-white bg-[#171717] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                          ✓ Paid Out
                        </span>
                      ) : isApproved ? (
                        <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                          Approved
                        </span>
                      ) : null}
                    </div>

                    {/* Invoice Code with copy */}
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
                        title="Copy invoice ID"
                      >
                        {copiedId === b.booking_id ? <Check size={12} className="text-[#297a3a]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Customer Name & View Treatment Details link */}
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

                  {/* Financials Row: Treatment Price & Earned Commission */}
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
            })
          )}
        </div>

      </div>

      {/* ─── 4. Footer ─── */}
      <div className="px-5 py-3.5 border-t border-[#ebebeb] bg-[#fafafa] flex items-center justify-between text-xs shrink-0">
        <span className="font-mono text-[#666666] font-medium uppercase tracking-[0.071em] text-xs">
          {displayedBookings.length} {displayedBookings.length === 1 ? 'APPOINTMENT' : 'APPOINTMENTS'}
        </span>
        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">TOTAL:</span>
          <span className="font-bold text-[#171717] text-sm">
            {formatIDR(displayedCommissionTotal)}
          </span>
        </div>
      </div>

    </div>
  );
}
