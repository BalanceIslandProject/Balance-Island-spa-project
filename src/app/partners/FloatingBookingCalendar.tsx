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
  Sparkles,
  DollarSign,
  User,
  MapPin,
  CalendarDays
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
  booking_status?: string;
  gross_amount: number;
  treatment_amount: number;
  commission_rate_pct: number;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'declined' | string;
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

export default function FloatingBookingCalendar({
  bookings = [],
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
  showFloatingButton = true,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'paid'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      // Extract YYYY-MM-DD
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

  // Month financial totals
  const monthStats = useMemo(() => {
    let count = 0;
    let totalCommission = 0;
    let approvedCommission = 0;
    let pendingCommission = 0;

    for (const b of currentMonthBookings) {
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

  // Filtered displayed bookings (either for selectedDate or all in current month)
  const displayedBookings = useMemo(() => {
    let list: CalendarBooking[] = [];
    if (selectedDate) {
      list = bookingsByDate[selectedDate] || [];
    } else {
      list = currentMonthBookings;
    }

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.commission_status === statusFilter);
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
    <div className="flex flex-col h-full bg-white text-black font-sans">
      
      {/* Month & Navigation Header */}
      <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between gap-2 bg-black/[0.01]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <CalendarDays size={16} />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-black leading-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-black/60 font-medium">
              <span>{monthStats.count} {monthStats.count === 1 ? 'booking' : 'bookings'} this month</span>
              <span>•</span>
              <span className="font-bold text-emerald-800">{formatIDR(monthStats.totalCommission)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-black/15 text-black hover:bg-black/5 active:scale-95 transition-all"
            title="Jump to current date"
          >
            Today
          </button>
          <div className="flex items-center border border-black/15 rounded-lg overflow-hidden bg-white">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 hover:bg-black/5 text-black transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-black/5 text-black transition-colors border-l border-black/10"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {!inline && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-black/10 text-black/60 hover:text-black transition-colors ml-1"
              aria-label="Close calendar"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid & Bookings split view */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* Month Calendar Grid */}
        <div className="bg-white rounded-2xl border border-black/10 p-3 sm:p-4 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <div 
                key={d} 
                className={`text-[11px] font-bold tracking-wider py-1 ${i === 0 ? 'text-red-600/70' : 'text-black/50'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-xl" />
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

              return (
                <button
                  key={dateString}
                  onClick={() => {
                    if (selectedDate === dateString) {
                      setSelectedDate(null); // toggle off
                    } else {
                      setSelectedDate(dateString);
                    }
                  }}
                  className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all relative group ${
                    isSelected
                      ? 'bg-black text-white shadow-md scale-[1.03] z-10'
                      : hasBookings
                      ? 'bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 text-black'
                      : 'hover:bg-black/5 text-black/80'
                  } ${isToday && !isSelected ? 'ring-2 ring-black/80 font-bold' : ''}`}
                >
                  <span className={`text-xs ${isSelected ? 'font-bold text-white' : hasBookings ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                    {dayNum}
                  </span>

                  {/* Booking indicator markers */}
                  {hasBookings && (
                    <div className="flex items-center gap-1 mt-auto pb-0.5">
                      {hasApproved && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                      )}
                      {hasPending && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                      )}
                      {dayBookings.length > 1 && (
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-white/80' : 'text-emerald-800'}`}>
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Filter / Reset bar */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/10 text-xs">
            <div className="flex items-center gap-3 text-[11px] text-black/60">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Approved</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending</span>
              </span>
            </div>

            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[11px] font-bold text-black hover:underline"
              >
                Clear Day (Show All {MONTH_NAMES[currentMonth]})
              </button>
            )}
          </div>
        </div>

        {/* Selected Date Header & Status Pills */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-base font-bold text-black flex items-center gap-2">
                <span>
                  {selectedDate 
                    ? `Bookings on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `All Bookings in ${MONTH_NAMES[currentMonth]} ${currentYear}`}
                </span>
                <span className="text-xs bg-black/5 text-black px-2 py-0.5 rounded-full font-mono font-bold">
                  {displayedBookings.length}
                </span>
              </h3>
              <p className="text-xs text-black/60">
                {selectedDate 
                  ? 'Showing attributed guest appointments on this specific date'
                  : 'Appointments scheduled or attributed during this month'}
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-xl self-start sm:self-auto border border-black/5 text-[11px]">
              {(['all', 'approved', 'pending'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-black text-white shadow-xs'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Booking Cards List */}
          {displayedBookings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-black/20 bg-black/[0.01] space-y-2">
              <CalendarIcon size={24} className="mx-auto text-black/30" />
              <p className="text-xs font-semibold text-black/70">
                {selectedDate 
                  ? 'No referred bookings recorded for this day.' 
                  : `No referred bookings found for ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
              </p>
              <p className="text-[11px] text-black/50 max-w-sm mx-auto">
                Share your partner referral link or QR code with villa guests and clients to track upcoming bookings!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedBookings.map((b) => {
                const isApproved = b.commission_status === 'approved';
                const isPaid = b.commission_status === 'paid';
                const isPending = b.commission_status === 'pending';

                return (
                  <div
                    key={b.id || b.booking_id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-black/10 bg-white hover:border-black/20 shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-all space-y-2.5"
                  >
                    {/* Top Row: Ref & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-black bg-black/[0.04] px-2 py-0.5 rounded-md border border-black/5">
                          #{b.booking_id}
                        </span>
                        <button
                          onClick={() => handleCopy(b.booking_id)}
                          className="text-black/40 hover:text-black transition-colors"
                          title="Copy booking reference"
                        >
                          {copiedId === b.booking_id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock size={11} />
                            Pending Verification
                          </span>
                        )}
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            Paid Out
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Guest, Treatment & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-black truncate flex items-center gap-1.5">
                          <User size={13} className="text-black/40 shrink-0" />
                          <span>{b.guest_name || 'Guest Booking'}</span>
                        </div>
                        <div className="text-[11px] text-black/60 truncate pl-4">
                          {b.treatment_name || 'Mobile Spa Treatment'}
                        </div>
                      </div>

                      <div className="sm:text-right space-y-0.5">
                        <div className="text-[11px] font-medium text-black/70 flex items-center sm:justify-end gap-1">
                          <Clock size={12} className="text-black/40" />
                          <span>
                            {new Date(b.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {b.time ? ` • ${b.time}` : ''}
                          </span>
                        </div>
                        {b.location && (
                          <div className="text-[11px] text-black/50 truncate flex items-center sm:justify-end gap-1">
                            <MapPin size={11} className="text-black/30" />
                            <span>{b.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Financial breakdown & Link to Invoice */}
                    <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-black/50 uppercase font-semibold">Treatment: </span>
                        <span className="text-black font-medium">{formatIDR(b.treatment_amount || b.gross_amount)}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">Earned: </span>
                          <span className="text-xs font-bold text-emerald-800">
                            +{formatIDR(b.commission_amount)}
                          </span>
                          <span className="text-[10px] text-black/50 ml-1">({b.commission_rate_pct}%)</span>
                        </div>

                        <Link
                          href={`/invoice/${b.booking_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-black hover:text-black/70 hover:underline shrink-0"
                          title="View verified booking invoice"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Footer Summary Bar */}
      <div className="p-3 sm:p-4 border-t border-black/10 bg-black/[0.02] flex items-center justify-between text-xs">
        <div className="text-black/60">
          Domain: <span className="font-mono font-bold text-black">www.booktherapick.com</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-black/60">Total Commission:</span>
          <span className="font-bold text-black text-sm">
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
      <div className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        {renderCalendarContent()}
      </div>
    );
  }

  // Floating trigger button + Floating Sheet / Modal
  return (
    <>
      {/* Floating Action Trigger Button (FAB) */}
      {showFloatingButton && (
        <button
          onClick={handleOpen}
          aria-label="Open Bookings Calendar"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-white/20 px-4 py-3 rounded-full flex items-center gap-2.5 transition-all group backdrop-blur-md"
        >
          <div className="relative">
            <CalendarIcon size={17} className="text-white group-hover:scale-110 transition-transform" />
            {monthStats.count > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">Calendar</span>
          {bookings.length > 0 && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {bookings.length}
            </span>
          )}
        </button>
      )}

      {/* Floating Calendar Overlay Modal (App Bottom-Sheet on mobile, centered card on desktop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop dismiss */}
          <div className="fixed inset-0" onClick={handleClose} />

          {/* Calendar Container */}
          <div className="relative z-10 w-full sm:max-w-2xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-black/10 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
            {/* Mobile swipe / pull indicator */}
            <div className="w-12 h-1.5 bg-black/20 rounded-full mx-auto my-2.5 sm:hidden" />
            {renderCalendarContent()}
          </div>
        </div>
      )}
    </>
  );
}
