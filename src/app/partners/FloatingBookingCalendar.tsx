'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  User, 
  ArrowLeft,
  FileText
} from 'lucide-react';

export interface CalendarBooking {
  id: string;
  booking_id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  created_at: string;
  guest_name: string;
  location?: string;
  room_number?: string;
  treatment_name?: string;
  booking_status?: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled' | string;
  treatment_status?: 'Scheduled' | 'In Progress' | 'Ongoing' | 'Finished' | 'Finish' | 'No Show' | string;
  payment_status?: 'paid' | 'unpaid' | string;
  payment_method?: string;
  payment_verified?: boolean;
  service_completed?: boolean;
  gross_amount: number;
  treatment_amount: number;
  commission_rate_pct: number;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'declined' | 'cancelled' | string;
}

interface FloatingBookingCalendarProps {
  bookings: CalendarBooking[];
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  showFloatingButton?: boolean;
  inline?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Rock-solid safe date formatting that never crashes on malformed or ISO date strings
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

export default function FloatingBookingCalendar({
  bookings = [],
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
  showFloatingButton = false,
  inline = false,
}: FloatingBookingCalendarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleOpen = () => {
    if (controlledOnOpen) controlledOnOpen();
    else setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (controlledOnClose) controlledOnClose();
    else setInternalIsOpen(false);
  };

  // Calendar month state
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Apple-style View Mode Control: 'month' | 'week'
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

  // Month navigation
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

  // Map bookings by date string (YYYY-MM-DD)
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

  // Bookings for the current month
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthBookings = useMemo(() => {
    return bookings.filter((b) => b.date && b.date.startsWith(monthPrefix));
  }, [bookings, monthPrefix]);

  // Month financial totals (strictly excludes cancelled bookings)
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

  // Calendar grid calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Weekly calendar days (computed for the week containing selectedDate or active date)
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

    const dayOfWeek = baseDate.getDay(); // 0 is Sunday
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

  // Filtered displayed bookings (either for selectedDate or all in current month)
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

  // Calendar Content Layout
  const renderCalendarContent = () => (
    <div className="flex flex-col h-full bg-[#FBFBFD] text-neutral-900 font-sans select-none">
      
      {/* 1. Apple-Style Native Mobile App Header Bar */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-200/70 bg-white sticky top-0 z-20 space-y-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] pt-[max(0.75rem,env(safe-area-inset-top))]">
        
        {/* Row 1: Back/Close button + Month Title + Navigation Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {!inline && (
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 -ml-1 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-all active:scale-95"
                aria-label="Back / Close"
              >
                <ArrowLeft size={20} className="sm:hidden" />
                <X size={18} className="hidden sm:block" />
              </button>
            )}

            <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight truncate">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
          </div>

          {/* Quick controls: Today + < > */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-neutral-200/80 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all shadow-2xs"
              title="Jump to today"
            >
              Today
            </button>
            <div className="flex items-center border border-neutral-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 transition-colors border-l border-neutral-200/80"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: TOTAL rounded card on LEFT, Total Amount on the RIGHT */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Refined compact rounded card without duplicating booking word */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 shadow-2xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900 whitespace-nowrap">
              TOTAL : {monthStats.count} {monthStats.count === 1 ? 'BOOKING' : 'BOOKINGS'}
            </span>
          </div>

          {/* Total amount on the right of the screen */}
          <div className="text-right flex items-baseline gap-1.5 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">TOTAL:</span>
            <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono tabular-nums">
              {formatIDR(monthStats.totalCommission)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Apple Segmented View Toggle & Calendar Area */}
      <div className="border-b border-neutral-200/70 bg-white p-3 sm:p-4 shrink-0 space-y-2.5">
        
        {/* Apple Segmented Control (Month / Week) */}
        <div className="flex items-center justify-between">
          <div className="inline-flex p-0.5 rounded-xl bg-neutral-100 border border-neutral-200/80 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
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
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
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
              className="text-xs font-semibold text-neutral-900 hover:underline px-2 py-1"
            >
              Clear Filter
            </button>
          )}
        </div>

        {viewMode === 'month' ? (
          /* ========================================================
             A. MONTH CALENDAR VIEW (Apple Calendar Grid)
             ======================================================== */
          <div className="bg-[#FAFAFC] rounded-2xl border border-neutral-200/80 p-3 sm:p-4 shadow-2xs">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
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
              {/* Blank leading days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10 rounded-xl" />
              ))}

              {/* Month days */}
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
                        setViewMode('week');
                      }
                    }}
                    className={`min-h-[42px] sm:min-h-[46px] rounded-xl flex flex-col justify-between p-1.5 transition-all relative ${
                      isSelected
                        ? 'bg-neutral-950 text-white shadow-xs scale-[1.02] z-10'
                        : hasBookings
                        ? 'bg-emerald-50/80 border border-emerald-300 hover:bg-emerald-100 text-neutral-900 font-semibold'
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

                    {/* Bottom Row: Booking indicator markers */}
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
            </div>
          </div>
        ) : (
          /* ========================================================
             B. COMPACT WEEKLY CALENDAR STRIP
             ======================================================== */
          <div className="bg-[#FAFAFC] rounded-2xl border border-neutral-200/80 p-2.5 sm:p-3 shadow-2xs space-y-2">
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
                  className={`h-14 rounded-xl flex flex-col items-center justify-between py-1.5 px-0.5 transition-all relative ${
                    d.isSelected
                      ? 'bg-neutral-950 text-white shadow-xs scale-[1.02] z-10'
                      : d.hasBookings
                      ? 'bg-emerald-50/80 border border-emerald-300 hover:bg-emerald-100 text-neutral-900'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  } ${d.isToday && !d.isSelected ? 'ring-1.5 ring-neutral-950 font-bold' : ''}`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${d.isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {d.dayName}
                  </span>
                  <span className={`text-sm font-bold ${d.isSelected ? 'text-white' : d.hasBookings ? 'text-emerald-950' : 'text-neutral-800'}`}>
                    {d.dayNum}
                  </span>

                  {/* Indicator dots */}
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

      {/* 3. Booking Details List (Scrollable Area, Rock-Solid without erratic resize) */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        
        {/* Professional Apple-Style Filter Tabs Bar */}
        <div className="pb-1">
          <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/70 text-xs w-full">
            {(['all', 'approved', 'pending', 'cancelled'] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 py-1.5 px-2 rounded-lg capitalize font-bold text-xs transition-all cursor-pointer text-center ${
                  statusFilter === s
                    ? 'bg-neutral-950 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Cards List */}
        {displayedBookings.length === 0 ? (
          <div className="py-12 px-6 text-center rounded-2xl border border-dashed border-neutral-200 bg-white space-y-2">
            <CalendarIcon size={24} className="mx-auto text-neutral-400" />
            <p className="text-xs font-semibold text-neutral-900">
              {selectedDate 
                ? 'No referred appointments recorded for this day.' 
                : `No referred appointments found for ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
            </p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
              When guests complete bookings through your link or QR code, their appointments and commissions appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-6">
            {displayedBookings.map((b, idx) => {
              const isApproved = b.commission_status === 'approved';
              const isPaidCommission = b.commission_status === 'paid';
              const isPendingCommission = b.commission_status === 'pending';
              const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
              const isPaid = b.payment_status === 'paid' || b.payment_verified;
              const itemKey = b.id || b.booking_id || `booking-item-${idx}`;

              return (
                <div
                  key={itemKey}
                  className={`p-3.5 sm:p-4 rounded-[6px] border ${isCancelled ? 'border-[#ebebeb] bg-[#fafafa] opacity-80' : 'border-[#ebebeb] bg-white hover:border-[#171717]/40'} shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all space-y-3`}
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

                      {!isCancelled && (
                        <>
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                              <CheckCircle2 size={11} />
                              Approved
                            </span>
                          )}
                          {isPendingCommission && (b.booking_status === 'Ongoing' || b.booking_status === 'Completed') && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              <Clock size={11} />
                              Pending
                            </span>
                          )}
                          {isPaidCommission && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-white bg-[#171717] px-2 py-0.5 rounded-[4px]">
                              ✓ Paid Out
                            </span>
                          )}
                        </>
                      )}
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
                        title="Copy invoice code"
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
            })}
          </div>
        )}

      </div>

      {/* 4. Native Footer Summary Bar */}
      <div className="px-4 py-3 sm:px-6 border-t border-neutral-200/80 bg-white flex items-center justify-between text-xs pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        <span className="text-neutral-600 font-extrabold uppercase tracking-wider text-[11px]">
          {displayedBookings.length} {displayedBookings.length === 1 ? 'APPOINTMENT' : 'APPOINTMENTS'}
        </span>
        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">TOTAL:</span>
          <span className="font-bold text-neutral-950 text-sm">
            {formatIDR(
              displayedBookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0)
            )}
          </span>
        </div>
      </div>

    </div>
  );

  // If used inline inside a dashboard section
  if (inline) {
    return (
      <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-2xs">
        {renderCalendarContent()}
      </div>
    );
  }

  // Full Screen on Mobile like an App, Centered Modal on Desktop
  return (
    <>
      {/* Floating Action Trigger Button (FAB) */}
      {showFloatingButton && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open Bookings Calendar"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-neutral-950 text-white hover:bg-neutral-800 active:scale-95 shadow-md border border-neutral-800 px-3.5 py-2.5 rounded-full flex items-center gap-2 transition-all group backdrop-blur-md"
        >
          <div className="relative">
            <CalendarIcon size={15} className="text-white" />
            {monthStats.count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-neutral-950" />
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide">Calendar</span>
          {bookings.length > 0 && (
            <span className="bg-neutral-800 text-neutral-200 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
              {bookings.length}
            </span>
          )}
        </button>
      )}

      {/* Full-Screen Native Mobile Calendar App / Desktop Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-white sm:bg-black/50 sm:backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop dismiss for desktop */}
          <div className="hidden sm:block fixed inset-0" onClick={handleClose} />

          {/* Full Screen App Container on Mobile, Spacious Responsive Modal on Desktop */}
          <div className="relative z-10 w-full sm:max-w-4xl lg:max-w-5xl bg-white h-[100dvh] sm:h-[88vh] sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-neutral-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {renderCalendarContent()}
          </div>
        </div>
      )}
    </>
  );
}
