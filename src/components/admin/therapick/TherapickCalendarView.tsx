'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  User, MapPin, Eye, EyeOff, Settings as SettingsIcon, Plus, Users, Filter, CheckCircle2 
} from 'lucide-react';
import { useTherapickAdmin, TherapickBooking } from '@/context/TherapickAdminContext';

export default function TherapickCalendarView() {
  const { 
    system, 
    bookings, 
    websiteBookings,
    affiliateBookings,
    therapistsList, 
    setSelectedBooking, 
    setIsAddBookingOpen, 
    setIsAdvancedCalendarOpen,
    calendarVisibility,
    setCalendarVisibility,
    showOnAffiliateCalendars,
    setShowOnAffiliateCalendars
  } = useTherapickAdmin();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
      setSelectedDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
      setSelectedDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Helper to extract clean YYYY-MM-DD from booking
  const getBookingDateString = (b: any): string => {
    const raw = b?.booking_date || b?.date || (b?.created_at ? b.created_at.split('T')[0] : '');
    if (!raw) return '';
    return String(raw).split('T')[0].trim();
  };

  // Safe Currency Formatter
  const formatIDR = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return `IDR ${num.toLocaleString('id-ID')}`;
  };

  // Booking Data Helpers
  const getBookingPrice = (b: any): number => {
    return Number(b.revenue || b.total_amount || b.total_price || 0);
  };

  const getBookingCommission = (b: any): number => {
    if (b.commission?.commission_amount != null) {
      return Number(b.commission.commission_amount);
    }
    if (b.commission_amount != null) {
      return Number(b.commission_amount);
    }
    if (b.affiliate_code) {
      return Math.round(getBookingPrice(b) * 0.15);
    }
    return 0;
  };

  const getBookingId = (b: any): string => {
    if (b.reference_number) return `#${String(b.reference_number).trim().toUpperCase()}`;
    if (b.booking_id) return `#${String(b.booking_id).trim().toUpperCase()}`;
    if (b.id) return `#${String(b.id).slice(0, 8).toUpperCase()}`;
    return '#BK-000';
  };

  // Active bookings list strictly scoped to Website vs Affiliate system
  const currentSystemBookings = system === 'website' ? websiteBookings : affiliateBookings;

  // Filter bookings by therapist
  const filteredBookings = useMemo(() => {
    return currentSystemBookings.filter(b => {
      if (therapistFilter !== 'all') {
        const tName = b.therapist_name || b.assigned_therapist_name || '';
        if (!tName.toLowerCase().includes(therapistFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [currentSystemBookings, therapistFilter]);

  // Calendar matrix for month view
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const monthDays = useMemo(() => {
    const days: { day: number; dateStr: string; isCurrentMonth: boolean; count: number }[] = [];
    
    // Prev month trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = filteredBookings.filter(b => getBookingDateString(b) === dateStr).length;
      days.push({ day: d, dateStr, isCurrentMonth: false, count });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = filteredBookings.filter(b => getBookingDateString(b) === dateStr).length;
      days.push({ day: d, dateStr, isCurrentMonth: true, count });
    }

    // Trailing days to fill 35 or 42 cells
    const targetTotal = days.length > 35 ? 42 : 35;
    const remaining = targetTotal - days.length;
    if (remaining > 0) {
      for (let d = 1; d <= remaining; d++) {
        const m = month + 2 > 12 ? 1 : month + 2;
        const y = month + 2 > 12 ? year + 1 : year;
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = filteredBookings.filter(b => getBookingDateString(b) === dateStr).length;
        days.push({ day: d, dateStr, isCurrentMonth: false, count });
      }
    }

    return days;
  }, [year, month, startOffset, daysInMonth, filteredBookings]);

  // Total bookings in current visible month
  const currentMonthBookingsCount = useMemo(() => {
    return monthDays.filter(d => d.isCurrentMonth).reduce((acc, d) => acc + d.count, 0);
  }, [monthDays]);

  // Selected date's bookings
  const dayBookings = useMemo(() => {
    return filteredBookings.filter(b => getBookingDateString(b) === selectedDateStr);
  }, [filteredBookings, selectedDateStr]);

  const monthTitle = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Today string for highlighting today
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Format selected date header
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    if (!y || !m || !d) return 'Today';
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDateStr]);

  // 7 days for Week View
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const base = (!isNaN(y) && !isNaN(m) && !isNaN(d)) ? new Date(y, m - 1, d) : new Date(year, month, 1);
    const dayOfWeek = base.getDay(); // 0 is Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const dayBookingsList = filteredBookings.filter(b => getBookingDateString(b) === dateStr);
      days.push({
        date: dt,
        dateStr,
        dayNum: dt.getDate(),
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        bookings: dayBookingsList,
        count: dayBookingsList.length,
        isSelected: dateStr === selectedDateStr,
      });
    }
    return days;
  }, [selectedDateStr, year, month, filteredBookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. FITLO PAGE HEADER & TOP CONTROLS */}
      <div className="fitlo-page-head">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="fitlo-page-title">
              Calendar & Schedule
            </h1>
            <span className="fitlo-badge">
              <CalendarIcon size={12} className="text-[#0b7a73]" />
              <span>{system === 'website' ? 'Direct Schedule' : 'Affiliate Portal'}</span>
            </span>
          </div>
          <p className="fitlo-page-subtitle">
            Manage live therapists, daily booking queues, and synchronized availability slots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="fitlo-btn fitlo-btn--ghost !h-9 !px-3"
          >
            Today
          </button>

          {/* Month / Period Navigation (< >) */}
          <div className="flex items-center gap-2 bg-[var(--fitlo-card)] border border-[var(--fitlo-line)] px-2 py-1 rounded-xl shadow-[var(--fitlo-shadow)]">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-[var(--fitlo-ink)] min-w-[110px] text-center font-mono">
              {viewMode === 'day' ? formattedSelectedDate : monthTitle}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] transition-colors cursor-pointer"
              title="Next period"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View Mode Toggle Pill: Month | Week | Day */}
          <div className="fitlo-sides !p-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`!h-8 !px-3 text-xs ${viewMode === 'month' ? 'is-active !font-bold' : ''}`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`!h-8 !px-3 text-xs ${viewMode === 'week' ? 'is-active !font-bold' : ''}`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`!h-8 !px-3 text-xs ${viewMode === 'day' ? 'is-active !font-bold' : ''}`}
            >
              Day
            </button>
          </div>

          {/* Therapist Filter */}
          <select
            value={therapistFilter}
            onChange={e => setTherapistFilter(e.target.value)}
            className="fitlo-select !h-9 !py-0 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Therapists</option>
            {therapistsList.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CALENDAR VIEW MAIN BODY */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Month Calendar Matrix (~7-8 cols / 65%) */}
          <div className="lg:col-span-8 fitlo-card space-y-4">
            
            {/* Month Header Banner with Total Count Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)] flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-[var(--fitlo-ink)] font-mono tracking-tight">
                  {monthTitle}
                </h2>
                <span className="fitlo-badge">
                  {currentMonthBookingsCount} {currentMonthBookingsCount === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsAdvancedCalendarOpen(true)}
                className="text-xs font-bold text-[var(--fitlo-accent)] hover:text-[var(--fitlo-accent-hi)] flex items-center gap-1.5 cursor-pointer"
              >
                <SettingsIcon size={13} />
                <span>Advanced Availability</span>
              </button>
            </div>

            {/* Weekday Labels (Mon to Sun) */}
            <div className="grid grid-cols-7 text-center text-[11px] font-mono font-bold uppercase text-[var(--fitlo-muted)] pb-2">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Day Numbers Grid */}
            <div className="grid grid-cols-7 gap-y-3.5 gap-x-1 sm:gap-x-2 text-center">
              {monthDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const hasBookings = cell.count > 0;
                const isToday = todayStr === cell.dateStr;

                return (
                  <div key={idx} className="flex justify-center items-center py-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`relative group w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-semibold font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0b7a73] text-white font-extrabold shadow-sm ring-2 ring-[rgba(11,122,115,0.3)] scale-105 z-10'
                          : hasBookings
                          ? 'bg-[var(--fitlo-accent-soft)] border border-[rgba(11,122,115,0.25)] hover:bg-[rgba(11,122,115,0.18)] text-[var(--fitlo-ink)] font-bold'
                          : !cell.isCurrentMonth
                          ? 'text-[var(--fitlo-muted)] opacity-40 hover:opacity-100 hover:bg-[var(--fitlo-card-2)] border border-transparent'
                          : 'text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)] border border-transparent'
                      } ${isToday && !isSelected ? 'ring-1.5 ring-[var(--fitlo-ink)]' : ''}`}
                      title={hasBookings ? `${cell.count} ${cell.count === 1 ? 'booking' : 'bookings'} on ${cell.dateStr}` : cell.dateStr}
                    >
                      <span>{cell.day}</span>

                      {/* Prominent Booking Number Badge */}
                      {hasBookings && (
                        <span
                          className={`absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center leading-none shadow-xs transition-transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-[var(--fitlo-card)] text-[#0b7a73] ring-2 ring-[#0b7a73]'
                              : 'bg-[#0b7a73] text-white ring-2 ring-[var(--fitlo-card)]'
                          }`}
                        >
                          {cell.count}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* System Calendar Visibility Bar */}
            <div className="pt-4 border-t border-[var(--fitlo-line)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-[var(--fitlo-muted)]" />
                <div>
                  <span className="font-bold text-[var(--fitlo-ink)]">
                    {system === 'website' ? 'Show Website Calendar' : 'Show Affiliate Calendar'}
                  </span>
                  <p className="text-[11px] text-[var(--fitlo-muted)]">
                    {system === 'website' 
                      ? 'Allow customers to view available slots on booktherapick.com' 
                      : 'Allow affiliate partners to view available slots on partner portal'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (system === 'website') {
                    setCalendarVisibility(!calendarVisibility);
                  } else {
                    setShowOnAffiliateCalendars(!showOnAffiliateCalendars);
                  }
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  (system === 'website' ? calendarVisibility !== false : showOnAffiliateCalendars !== false)
                    ? 'bg-[#0b7a73]' 
                    : 'bg-[var(--fitlo-card-3)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    (system === 'website' ? calendarVisibility !== false : showOnAffiliateCalendars !== false)
                      ? 'translate-x-4' 
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Selected Day Schedule (~4-5 cols / 35%) */}
          <div className="lg:col-span-4 fitlo-card flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
                <div>
                  <h2 className="text-sm font-bold text-[var(--fitlo-ink)]">
                    {formattedSelectedDate}
                  </h2>
                  <p className="text-[11px] text-[var(--fitlo-muted)] font-mono">
                    {system === 'website' ? 'Website Direct Bookings' : 'Affiliate Attributed Bookings'}
                  </p>
                </div>
                <span className={`fitlo-badge ${
                  dayBookings.length > 0 ? '!bg-[var(--fitlo-accent-soft)] !text-[var(--fitlo-accent-text)]' : ''
                }`}>
                  {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>

              {dayBookings.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[var(--fitlo-card-2)] border border-dashed border-[var(--fitlo-line-2)] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--fitlo-card-3)] text-[var(--fitlo-muted)] flex items-center justify-center mx-auto">
                    <CalendarIcon size={18} />
                  </div>
                  <div className="text-xs font-bold text-[var(--fitlo-ink)]">No Bookings Scheduled</div>
                  <p className="text-[11px] text-[var(--fitlo-muted)] max-w-[220px] mx-auto leading-relaxed">
                    There are no {system === 'website' ? 'direct website' : 'affiliate'} bookings for this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar pr-0.5">
                  {dayBookings.map((b, idx) => {
                    const statusStr = (b.status || '').toLowerCase();
                    const isConfirmed = statusStr === 'confirmed';
                    const isCompleted = statusStr === 'completed';
                    const isCancelled = statusStr === 'cancelled';
                    const isOngoing = statusStr === 'ongoing' || statusStr === 'in progress';
                    const bId = getBookingId(b);
                    const price = getBookingPrice(b);
                    const commFee = getBookingCommission(b);
                    const isAff = Boolean(b.affiliate_code || b.commission);

                    return (
                      <div
                        key={b.id || idx}
                        onClick={() => setSelectedBooking(b)}
                        className="p-3.5 rounded-xl border border-[var(--fitlo-line)] hover:border-[var(--fitlo-accent)] bg-[var(--fitlo-card-2)] hover:bg-[var(--fitlo-card)] transition-all cursor-pointer space-y-2 group shadow-[var(--fitlo-shadow)]"
                      >
                        {/* Top: Time + Booking ID + Status Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-4 rounded-full ${
                              isConfirmed ? 'bg-[var(--fitlo-good)]' :
                              isCompleted ? 'bg-[var(--fitlo-info)]' :
                              isCancelled ? 'bg-[var(--fitlo-bad)]' :
                              isOngoing ? 'bg-[#f08a5d]' : 'bg-[var(--fitlo-muted)]'
                            }`} />
                            <span className="text-xs font-mono font-bold text-[var(--fitlo-ink)]">
                              {b.booking_time || b.time || '10:00'}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--fitlo-card)] text-[var(--fitlo-ink)] border border-[var(--fitlo-line)]">
                              {bId}
                            </span>
                          </div>
                          <span className={`fitlo-pill ${
                            isConfirmed || isCompleted ? 'fitlo-pill--good' :
                            isCancelled ? 'fitlo-pill--bad' :
                            isOngoing ? 'fitlo-pill--warn' : 'fitlo-pill--info'
                          }`}>
                            {b.status || 'Confirmed'}
                          </span>
                        </div>

                        {/* Middle: Treatment Name & Guest */}
                        <div className="pl-3.5 space-y-0.5">
                          <div className="font-bold text-[var(--fitlo-ink)] text-xs group-hover:text-[var(--fitlo-accent)] transition-colors leading-snug">
                            {b.treatment_name || b.service_name || 'Balinese Traditional Massage'}
                          </div>
                          <div className="text-[11px] text-[var(--fitlo-muted)] truncate">
                            {b.customer_name || b.guest_name || 'Guest'}
                          </div>
                        </div>

                        {/* Bottom: Treatment Price & Commission */}
                        <div className="pl-3.5 pt-2 border-t border-[var(--fitlo-line)] flex items-center justify-between text-xs">
                          <div className="flex items-baseline gap-1 font-mono">
                            <span className="text-[10px] text-[var(--fitlo-muted)] uppercase font-semibold">Price:</span>
                            <span className="font-bold fitlo-num text-[var(--fitlo-ink)] text-xs">
                              {formatIDR(price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isAff ? (
                              <div className="flex items-baseline gap-1 font-mono bg-[var(--fitlo-good-soft)] text-[var(--fitlo-good)] px-2 py-0.5 rounded-md">
                                <span className="text-[9px] uppercase font-bold">Comm:</span>
                                <span className="text-[11px] font-bold fitlo-num">
                                  {formatIDR(commFee)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono font-semibold text-[var(--fitlo-muted)] bg-[var(--fitlo-card-3)] px-2 py-0.5 rounded-md">
                                Direct · No Comm
                              </span>
                            )}

                            {b.affiliate_code && (
                              <span className="text-[10px] font-mono font-bold text-[var(--fitlo-accent-text)] bg-[var(--fitlo-accent-soft)] px-1.5 py-0.5 rounded border border-[var(--fitlo-line)]">
                                {b.affiliate_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--fitlo-line)] mt-4">
              <button
                type="button"
                onClick={() => setIsAddBookingOpen(true)}
                className="w-full fitlo-btn fitlo-btn--primary justify-center"
              >
                <Plus size={14} />
                <span>Book Treatment for this Day</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. WEEK VIEW (7-DAY CARDS WITH DAILY BOOKING NUMBERS) */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {weekDays.map(day => {
              const isSelected = day.isSelected;
              const hasBookings = day.count > 0;
              const isToday = todayStr === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`fitlo-card !p-3.5 flex flex-col justify-between cursor-pointer transition-all min-h-[220px] ${
                    isSelected
                      ? '!border-[#0b7a73] ring-2 ring-[rgba(11,122,115,0.2)]'
                      : hasBookings
                      ? 'border-[rgba(11,122,115,0.2)] bg-[var(--fitlo-accent-soft)]'
                      : 'border-[var(--fitlo-line)] hover:border-[var(--fitlo-line-2)]'
                  }`}
                >
                  <div>
                    {/* Header: Day Name + Date + Booking Count Badge */}
                    <div className="flex items-start justify-between pb-2 border-b border-[var(--fitlo-line)]">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase text-[var(--fitlo-muted)] block">
                          {day.dayName}
                        </span>
                        <span className={`text-base font-bold font-mono ${
                          isToday ? 'text-[#0b7a73] underline' : 'text-[var(--fitlo-ink)]'
                        }`}>
                          {day.dayNum}
                        </span>
                      </div>
                      
                      {/* Daily Number of Bookings Badge */}
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        hasBookings
                          ? 'bg-[#0b7a73] text-white shadow-xs'
                          : 'bg-[var(--fitlo-card-2)] text-[var(--fitlo-muted)]'
                      }`}>
                        {day.count} {day.count === 1 ? 'bking' : 'bkings'}
                      </span>
                    </div>

                    {/* Bookings List inside Day Card */}
                    <div className="mt-3 space-y-2">
                      {day.bookings.length === 0 ? (
                        <p className="text-[11px] text-[var(--fitlo-muted)] font-mono text-center py-4">
                          No bookings
                        </p>
                      ) : (
                        day.bookings.slice(0, 3).map((b: any, idx: number) => {
                          const bId = getBookingId(b);
                          const price = getBookingPrice(b);
                          const commFee = getBookingCommission(b);
                          const isAff = Boolean(b.affiliate_code || b.commission);

                          return (
                            <div
                              key={b.id || idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                              }}
                              className="p-2.5 rounded-xl bg-[var(--fitlo-card)] hover:bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] text-left transition-colors space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[var(--fitlo-ink)]">{b.booking_time || b.time || '10:00'}</span>
                                  <span className="text-[var(--fitlo-muted)] bg-[var(--fitlo-card-2)] px-1 py-0.2 rounded border border-[var(--fitlo-line)] text-[9px] font-bold">{bId}</span>
                                </div>
                                <span className="text-[var(--fitlo-muted)] font-medium truncate max-w-[65px]">{b.status || 'Confirmed'}</span>
                              </div>
                              <div className="text-[11px] font-bold text-[var(--fitlo-ink)] truncate">
                                {b.treatment_name || b.service_name || 'Massage'}
                              </div>
                              <div className="pt-1 border-t border-[var(--fitlo-line)] flex items-center justify-between text-[10px] font-mono">
                                <span className="font-bold fitlo-num text-[var(--fitlo-ink)]">{formatIDR(price)}</span>
                                {isAff ? (
                                  <span className="text-[var(--fitlo-good)] font-bold bg-[var(--fitlo-good-soft)] px-1 rounded">Comm: {formatIDR(commFee)}</span>
                                ) : (
                                  <span className="text-[var(--fitlo-muted)]">Direct</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      {day.bookings.length > 3 && (
                        <p className="text-[10px] font-mono font-bold text-[var(--fitlo-accent-text)] text-center">
                          +{day.bookings.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDateStr(day.dateStr);
                      setIsAddBookingOpen(true);
                    }}
                    className="mt-3 w-full py-1 text-[10px] font-bold rounded-lg border border-dashed border-[var(--fitlo-line-2)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] hover:border-[var(--fitlo-accent)] transition-colors"
                  >
                    + Add Slot
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DAY VIEW (HOURLY TIMELINE SCHEDULE) */}
      {viewMode === 'day' && (
        <div className="fitlo-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--fitlo-line)]">
            <div>
              <h2 className="text-base font-bold text-[var(--fitlo-ink)]">
                {formattedSelectedDate}
              </h2>
              <p className="text-xs text-[var(--fitlo-muted)]">
                Hourly schedule &amp; appointment details
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="fitlo-badge !bg-[var(--fitlo-accent-soft)] !text-[var(--fitlo-accent-text)]">
                {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'} Today
              </span>
              <button
                type="button"
                onClick={() => setIsAddBookingOpen(true)}
                className="fitlo-btn fitlo-btn--primary !h-8 !px-3"
              >
                <Plus size={13} />
                <span>Add Booking</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-[var(--fitlo-line)]">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(hourSlot => {
              const hourPrefix = hourSlot.split(':')[0];
              const slotBookings = dayBookings.filter(b => {
                const bTime = b.booking_time || b.time || '';
                return bTime.startsWith(hourPrefix);
              });

              return (
                <div key={hourSlot} className="py-3 flex items-start gap-4">
                  <span className="w-14 text-xs font-mono font-bold text-[var(--fitlo-muted)] pt-1 shrink-0">
                    {hourSlot}
                  </span>
                  <div className="flex-1 min-h-[38px]">
                    {slotBookings.length === 0 ? (
                      <div className="h-full rounded-xl border border-dashed border-[var(--fitlo-line)] p-2 text-[11px] text-[var(--fitlo-muted)] opacity-60 font-mono">
                        Available slot
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {slotBookings.map((b: any, idx: number) => {
                          const bId = getBookingId(b);
                          const price = getBookingPrice(b);
                          const commFee = getBookingCommission(b);
                          const isAff = Boolean(b.affiliate_code || b.commission);

                          return (
                            <div
                              key={b.id || idx}
                              onClick={() => setSelectedBooking(b)}
                              className="p-3 rounded-xl border border-[var(--fitlo-line)] bg-[var(--fitlo-card-2)] hover:bg-[var(--fitlo-card)] hover:border-[var(--fitlo-accent)] transition-all cursor-pointer space-y-1.5 group shadow-[var(--fitlo-shadow)]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-[var(--fitlo-ink)]">
                                    {b.booking_time || b.time || hourSlot}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--fitlo-card)] text-[var(--fitlo-muted)] border border-[var(--fitlo-line)]">
                                    {bId}
                                  </span>
                                </div>
                                <span className="fitlo-pill fitlo-pill--good">
                                  {b.status || 'Confirmed'}
                                </span>
                              </div>
                              <div className="font-bold text-[var(--fitlo-ink)] text-xs truncate">
                                {b.treatment_name || b.service_name || 'Massage'}
                              </div>
                              <div className="text-[11px] text-[var(--fitlo-muted)] truncate">
                                {b.customer_name || b.guest_name}
                              </div>
                              <div className="pt-1.5 border-t border-[var(--fitlo-line)] flex items-center justify-between text-xs font-mono">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[10px] text-[var(--fitlo-muted)] uppercase">Price:</span>
                                  <span className="font-bold fitlo-num text-[var(--fitlo-ink)] text-xs">{formatIDR(price)}</span>
                                </div>
                                {isAff ? (
                                  <div className="flex items-baseline gap-1 text-[var(--fitlo-good)] bg-[var(--fitlo-good-soft)] px-1.5 py-0.5 rounded">
                                    <span className="text-[9px] uppercase font-bold">Comm:</span>
                                    <span className="font-bold fitlo-num text-[11px]">{formatIDR(commFee)}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[var(--fitlo-muted)]">Direct</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
