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
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TOP CONTROLS (MATCHING MOCKUP IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FACC15]/20 text-neutral-900 border border-amber-300">
              {system === 'website' ? 'Website Direct' : 'Affiliate Portal'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage bookings, daily schedules, and therapist availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-200 bg-white text-neutral-800 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
          >
            Today
          </button>

          {/* Month / Period Navigation (< >) */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 px-2 py-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg text-stone-500 hover:text-neutral-900 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-neutral-900 min-w-[110px] text-center font-mono">
              {viewMode === 'day' ? formattedSelectedDate : monthTitle}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg text-stone-500 hover:text-neutral-900 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Next period"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View Mode Toggle: Month | Week | Day */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-[#FACC15] text-neutral-950 shadow-2xs font-extrabold' : 'text-stone-500 hover:text-neutral-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-[#FACC15] text-neutral-950 shadow-2xs font-extrabold' : 'text-stone-500 hover:text-neutral-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'day' ? 'bg-[#FACC15] text-neutral-950 shadow-2xs font-extrabold' : 'text-stone-500 hover:text-neutral-900'
              }`}
            >
              Day
            </button>
          </div>

          {/* Therapist Filter */}
          <select
            value={therapistFilter}
            onChange={e => setTherapistFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
          >
            <option value="all">All Therapists</option>
            {therapistsList.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CALENDAR VIEW MAIN BODY
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Month Calendar Matrix (~7-8 cols / 65%) */}
          <div className="lg:col-span-8 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            
            {/* Month Header Banner with Total Count Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-neutral-900 font-mono tracking-tight">
                  {monthTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                  {currentMonthBookingsCount} {currentMonthBookingsCount === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsAdvancedCalendarOpen(true)}
                className="text-xs font-bold text-amber-800 hover:text-neutral-950 flex items-center gap-1.5 cursor-pointer"
              >
                <SettingsIcon size={13} />
                <span>Advanced Availability</span>
              </button>
            </div>

            {/* Weekday Labels (Mon to Sun) */}
            <div className="grid grid-cols-7 text-center text-[11px] font-mono font-bold uppercase text-stone-400 pb-2">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Day Numbers Grid with Booking Count Numbers */}
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 sm:gap-x-2 text-center">
              {monthDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const hasBookings = cell.count > 0;
                const isToday = todayStr === cell.dateStr;

                return (
                  <div key={idx} className="flex flex-col items-center justify-center py-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`relative group w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-semibold font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FACC15] text-neutral-950 font-extrabold shadow-sm ring-2 ring-[#FACC15]/40 scale-105 z-10'
                          : hasBookings
                          ? 'bg-amber-50/80 border border-amber-300 hover:bg-amber-100/90 text-neutral-950 font-bold shadow-2xs'
                          : !cell.isCurrentMonth
                          ? 'text-stone-300 hover:text-stone-500 hover:bg-stone-50 border border-transparent'
                          : 'text-neutral-800 hover:bg-stone-100 border border-transparent'
                      } ${isToday && !isSelected ? 'ring-1.5 ring-neutral-900' : ''}`}
                      title={hasBookings ? `${cell.count} ${cell.count === 1 ? 'booking' : 'bookings'} on ${cell.dateStr}` : cell.dateStr}
                    >
                      <span>{cell.day}</span>

                      {/* Prominent Booking Number Badge on the Date */}
                      {hasBookings && (
                        <span
                          className={`absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-mono font-black flex items-center justify-center leading-none shadow-xs transition-transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-neutral-950 text-[#FACC15] ring-2 ring-white'
                              : 'bg-[#FACC15] text-neutral-950 border border-amber-400 ring-2 ring-white'
                          }`}
                        >
                          {cell.count}
                        </span>
                      )}
                    </button>

                    {/* Subtitle Count Label Underneath Date */}
                    {hasBookings ? (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold mt-1 tracking-tight leading-none transition-colors ${
                          isSelected ? 'text-amber-900 font-black' : 'text-stone-600'
                        }`}
                      >
                        <span className="hidden sm:inline">{cell.count} {cell.count === 1 ? 'booking' : 'bookings'}</span>
                        <span className="sm:hidden">{cell.count} {cell.count === 1 ? 'bk' : 'bks'}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] font-mono mt-1 leading-none text-transparent select-none pointer-events-none">
                        ·
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* System Calendar Visibility Bar */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-stone-400" />
                <div>
                  <span className="font-bold text-neutral-900">
                    {system === 'website' ? 'Show Website Calendar' : 'Show Affiliate Calendar'}
                  </span>
                  <p className="text-[11px] text-stone-500">
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
                    ? 'bg-[#FACC15]' 
                    : 'bg-stone-200'
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
          <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-extrabold text-neutral-900">
                    {formattedSelectedDate}
                  </h2>
                  <p className="text-[11px] text-stone-400 font-mono">
                    {system === 'website' ? 'Website Direct Bookings' : 'Affiliate Attributed Bookings'}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  dayBookings.length > 0 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>

              {dayBookings.length === 0 ? (
                <div className="p-8 rounded-xl bg-stone-50/70 border border-dashed border-stone-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <CalendarIcon size={18} />
                  </div>
                  <div className="text-xs font-bold text-neutral-800">No Bookings Scheduled</div>
                  <p className="text-[11px] text-stone-500 max-w-[220px] mx-auto leading-relaxed">
                    There are no {system === 'website' ? 'direct website' : 'affiliate'} bookings for this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar pr-0.5">
                  {dayBookings.map((b, idx) => {
                    const statusStr = (b.status || '').toLowerCase();
                    const isConfirmed = statusStr === 'confirmed';
                    const isCompleted = statusStr === 'completed';
                    const isCancelled = statusStr === 'cancelled';
                    const isOngoing = statusStr === 'ongoing' || statusStr === 'in progress';

                    return (
                      <div
                        key={b.id || idx}
                        onClick={() => setSelectedBooking(b)}
                        className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-white transition-all cursor-pointer space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-4 rounded-full ${
                              isConfirmed ? 'bg-emerald-500' :
                              isCompleted ? 'bg-blue-500' :
                              isCancelled ? 'bg-rose-500' :
                              isOngoing ? 'bg-amber-500' : 'bg-stone-400'
                            }`} />
                            <span className="text-xs font-mono font-extrabold text-neutral-900">
                              {b.booking_time || b.time || '10:00'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                            isCompleted ? 'bg-blue-100 text-blue-800' :
                            isCancelled ? 'bg-rose-100 text-rose-800 line-through' :
                            isOngoing ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {b.status || 'Confirmed'}
                          </span>
                        </div>

                        <div className="font-bold text-neutral-900 text-xs pl-3.5 group-hover:text-amber-800 transition-colors">
                          {b.treatment_name || b.service_name || 'Balinese Traditional Massage'}
                        </div>

                        <div className="text-[11px] text-stone-500 pl-3.5 flex items-center justify-between flex-wrap gap-1">
                          <span>
                            {b.customer_name || b.guest_name || 'Guest'} · <strong className="text-neutral-800">{b.therapist_name || 'Wayan S.'}</strong>
                          </span>
                          {b.affiliate_code && (
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {b.affiliate_code}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 mt-4">
              <button
                type="button"
                onClick={() => setIsAddBookingOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FACC15] hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Book Treatment for this Day</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. WEEK VIEW (7-DAY CARDS WITH DAILY BOOKING NUMBERS)
         ───────────────────────────────────────────────────────────── */}
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
                  className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-300 shadow-sm'
                      : hasBookings
                      ? 'border-amber-200/80 bg-amber-50/20 hover:border-amber-400'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Header: Day Name + Date + Booking Count Badge */}
                    <div className="flex items-start justify-between pb-2 border-b border-stone-100">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase text-stone-400 block">
                          {day.dayName}
                        </span>
                        <span className={`text-base font-extrabold font-mono ${
                          isToday ? 'text-amber-600 underline' : 'text-neutral-900'
                        }`}>
                          {day.dayNum}
                        </span>
                      </div>
                      
                      {/* Daily Number of Bookings Badge */}
                      <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                        hasBookings
                          ? 'bg-[#FACC15] text-neutral-950 border border-amber-400 shadow-2xs'
                          : 'bg-stone-100 text-stone-400'
                      }`}>
                        {day.count} {day.count === 1 ? 'bking' : 'bkings'}
                      </span>
                    </div>

                    {/* Bookings List inside Day Card */}
                    <div className="mt-3 space-y-1.5">
                      {day.bookings.length === 0 ? (
                        <p className="text-[11px] text-stone-400 font-mono text-center py-4">
                          No bookings
                        </p>
                      ) : (
                        day.bookings.slice(0, 3).map((b: any, idx: number) => (
                          <div
                            key={b.id || idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                            className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-100 text-left transition-colors"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold text-neutral-900">{b.booking_time || b.time || '10:00'}</span>
                              <span className="text-stone-500 font-medium truncate max-w-[65px]">{b.status || 'Confirmed'}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-neutral-800 truncate mt-0.5">
                              {b.treatment_name || b.service_name || 'Massage'}
                            </div>
                          </div>
                        ))
                      )}
                      {day.bookings.length > 3 && (
                        <p className="text-[10px] font-mono font-bold text-amber-800 text-center">
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
                    className="mt-3 w-full py-1 text-[10px] font-bold rounded-lg border border-dashed border-stone-200 text-stone-500 hover:text-neutral-900 hover:border-stone-400 hover:bg-stone-50 transition-colors"
                  >
                    + Add Slot
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DAY VIEW (HOURLY TIMELINE SCHEDULE)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                {formattedSelectedDate}
              </h2>
              <p className="text-xs text-stone-500">
                Hourly therapist schedule &amp; appointment slots
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-[#FACC15] text-neutral-950 border border-amber-400 shadow-2xs">
                {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'} Today
              </span>
              <button
                type="button"
                onClick={() => setIsAddBookingOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={13} />
                <span>Add Booking</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(hourSlot => {
              const hourPrefix = hourSlot.split(':')[0];
              const slotBookings = dayBookings.filter(b => {
                const bTime = b.booking_time || b.time || '';
                return bTime.startsWith(hourPrefix);
              });

              return (
                <div key={hourSlot} className="py-3 flex items-start gap-4">
                  <span className="w-14 text-xs font-mono font-bold text-stone-400 pt-1 shrink-0">
                    {hourSlot}
                  </span>
                  <div className="flex-1 min-h-[38px]">
                    {slotBookings.length === 0 ? (
                      <div className="h-full rounded-xl border border-dashed border-stone-100 p-2 text-[11px] text-stone-300 font-mono">
                        Available slot
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {slotBookings.map((b: any, idx: number) => (
                          <div
                            key={b.id || idx}
                            onClick={() => setSelectedBooking(b)}
                            className="p-3 rounded-xl border border-stone-200 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-400 transition-all cursor-pointer space-y-1 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-extrabold text-neutral-900">
                                {b.booking_time || b.time || hourSlot}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200">
                                {b.status || 'Confirmed'}
                              </span>
                            </div>
                            <div className="font-bold text-neutral-900 text-xs truncate">
                              {b.treatment_name || b.service_name || 'Massage'}
                            </div>
                            <div className="text-[11px] text-stone-600 flex items-center justify-between">
                              <span>{b.customer_name || b.guest_name}</span>
                              <strong className="text-neutral-900">{b.therapist_name || 'Wayan S.'}</strong>
                            </div>
                          </div>
                        ))}
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
