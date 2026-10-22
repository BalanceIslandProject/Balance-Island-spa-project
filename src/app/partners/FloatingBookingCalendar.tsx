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
  MapPin, 
  ArrowLeft
} from 'lucide-react';

export interface CalendarBooking {
  id: string;
  booking_id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  created_at: string;
  guest_name: string;
  location?: string;
  treatment_name?: string;
  booking_status?: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled' | string;
  payment_status?: 'paid' | 'unpaid' | string;
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
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

        {/* Row 2: Total Bookings rounded card on LEFT, Total Amount on the RIGHT */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Rounded card for total bookings */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="text-xs font-bold text-neutral-900">
              {monthStats.count} {monthStats.count === 1 ? 'booking' : 'bookings'}
            </span>
          </div>

          {/* Total amount on the right of the screen */}
          <div className="text-right flex items-baseline gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total:</span>
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
                      }
                    }}
                    className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-between p-1 transition-all relative ${
                      isSelected
                        ? 'bg-neutral-950 text-white shadow-xs scale-[1.02] z-10'
                        : hasBookings
                        ? 'bg-emerald-50/80 border border-emerald-300 hover:bg-emerald-100 text-neutral-900 font-semibold'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    } ${isToday && !isSelected ? 'ring-1.5 ring-neutral-950 font-bold' : ''}`}
                  >
                    <span className={`text-xs ${isSelected ? 'font-bold text-white' : hasBookings ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                      {dayNum}
                    </span>

                    {/* Booking indicator markers */}
                    {hasBookings && (
                      <div className="flex items-center gap-0.5 mt-auto pb-0.5">
                        {hasApproved && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`} />
                        )}
                        {hasPending && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`} />
                        )}
                        {!hasApproved && !hasPending && hasCancelled && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-neutral-400' : 'bg-neutral-300'}`} />
                        )}
                        {dayBookings.length > 1 && (
                          <span className={`text-[8px] font-bold ${isSelected ? 'text-white/90' : 'text-emerald-800'}`}>
                            {dayBookings.length}
                          </span>
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
        
        {/* Selected Date Header & Status Pills */}
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-950 truncate">
              {selectedDate 
                ? safeFormatDate(selectedDate, { day: 'numeric', month: 'short', year: 'numeric' })
                : `${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </h3>
            <span className="text-[10px] bg-neutral-200/70 text-neutral-800 px-2 py-0.5 rounded-md font-mono font-bold">
              {displayedBookings.length}
            </span>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/60 text-xs overflow-x-auto">
            {(['all', 'approved', 'pending', 'cancelled'] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
                  className={`p-3.5 sm:p-4 rounded-2xl border ${isCancelled ? 'border-neutral-200 bg-neutral-50/70 opacity-80' : 'border-neutral-200/80 bg-white hover:border-neutral-300'} shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all space-y-2.5`}
                >
                  {/* Top Row: Ref & Multiple Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200/70">
                        #{b.booking_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(b.booking_id)}
                        className="text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
                        title="Copy booking reference"
                      >
                        {copiedId === b.booking_id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Rich Status Badges: Payment + Treatment Status + Commission Approval */}
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {/* 1. Payment status label (Paid / Unpaid) */}
                      {isPaid ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Paid
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Unpaid
                        </span>
                      )}

                      {/* 2. Treatment status label (Confirmed / Ongoing / Finish / Cancelled) */}
                      {isCancelled ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Cancelled
                        </span>
                      ) : b.booking_status === 'Ongoing' ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Ongoing Treatment
                        </span>
                      ) : b.booking_status === 'Completed' || b.service_completed ? (
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Finish Treatment
                        </span>
                      ) : b.booking_status === 'Confirmed' ? (
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                          Pending
                        </span>
                      )}

                      {/* 3. Commission status label (Approved / Pending Verification / Paid Out) */}
                      {!isCancelled && (
                        <>
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 size={11} />
                              Approved
                            </span>
                          )}
                          {isPendingCommission && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <Clock size={11} />
                              Pending Verification
                            </span>
                          )}
                          {isPaidCommission && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                              Paid Out
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Guest, Treatment & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-neutral-900 truncate flex items-center gap-1.5">
                        <User size={13} className="text-neutral-400 shrink-0" />
                        <span>{b.guest_name || 'Guest Booking'}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate pl-4">
                        {b.treatment_name || 'Mobile Spa Treatment'}
                      </div>
                    </div>

                    <div className="sm:text-right space-y-0.5">
                      <div className="text-[11px] font-medium text-neutral-600 flex items-center sm:justify-end gap-1">
                        <Clock size={12} className="text-neutral-400" />
                        <span>
                          {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                          {b.time ? ` • ${b.time}` : ''}
                        </span>
                      </div>
                      {b.location && (
                        <div className="text-[11px] text-neutral-400 truncate flex items-center sm:justify-end gap-1">
                          <MapPin size={11} className="text-neutral-300" />
                          <span>{b.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Financial breakdown & Link to Invoice */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Treatment: </span>
                      <span className="text-neutral-900 font-medium font-mono tabular-nums">{formatIDR(b.treatment_amount || b.gross_amount)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {isCancelled ? (
                          <span className="text-xs font-semibold text-rose-600 font-mono">
                            Cancelled (Rp0)
                          </span>
                        ) : (
                          <>
                            <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Earned: </span>
                            <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                              +{formatIDR(b.commission_amount)}
                            </span>
                            <span className="text-[10px] text-neutral-400 ml-1">({b.commission_rate_pct}%)</span>
                          </>
                        )}
                      </div>

                      <Link
                        href={`/invoice/${b.booking_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-950 hover:underline shrink-0"
                        title="View verified booking invoice"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={10} />
                      </Link>
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
        <span className="text-neutral-500 font-medium">
          {displayedBookings.length} {displayedBookings.length === 1 ? 'appointment' : 'appointments'}
        </span>
        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <span className="text-[11px] text-neutral-400">Total:</span>
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

          {/* Full Screen App Container on Mobile, Centered Modal on Desktop */}
          <div className="relative z-10 w-full sm:max-w-2xl bg-white h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-neutral-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {renderCalendarContent()}
          </div>
        </div>
      )}
    </>
  );
}
