'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  User, MapPin, Eye, EyeOff, Settings, Plus, Users, Filter, CheckCircle2 
} from 'lucide-react';
import { useTherapickAdmin, TherapickBooking } from '@/context/TherapickAdminContext';

export default function TherapickCalendarView() {
  const { 
    system, 
    bookings, 
    partners, 
    setSelectedBooking, 
    setIsAddBookingOpen, 
    setIsAdvancedCalendarOpen,
    showOnAffiliateCalendars,
    setShowOnAffiliateCalendars
  } = useTherapickAdmin();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 86400000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 86400000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter bookings
  const relevantBookings = useMemo(() => {
    return bookings.filter(b => {
      // System scope check
      if (system === 'website') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        if (isAff) return false;
      } else if (system === 'affiliate') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        if (!isAff) return false;
      }

      // Partner filter
      if (partnerFilter !== 'all') {
        if (b.partner_id !== partnerFilter && b.affiliate_code !== partnerFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      return true;
    });
  }, [bookings, system, partnerFilter, statusFilter]);

  // Calendar matrix for month view
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday

  // Align with Monday as first day
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const monthDays = useMemo(() => {
    const days: { day: number; dateStr: string; isCurrentMonth: boolean; bookings: TherapickBooking[] }[] = [];
    
    // Prev month trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: false, bookings: [] });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayBookings = relevantBookings.filter(b => b.booking_date === dateStr);
      days.push({ day: d, dateStr, isCurrentMonth: true, bookings: dayBookings });
    }

    // Trailing next month days to complete grid of 35 or 42
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: false, bookings: [] });
    }

    return days;
  }, [year, month, startOffset, daysInMonth, relevantBookings]);

  const monthTitle = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {system === 'website' ? 'Website Booking Calendar' : 'Affiliate Partner Calendars'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {system === 'website'
              ? 'Schedule, therapist assignments, and capacity for direct bookings.'
              : 'Individual partner referral schedules, slots, and availability sharing.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAdvancedCalendarOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Settings size={14} className="text-stone-500" />
            <span>Advanced Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddBookingOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Date Nav + Views + Partner Filter + Visibility Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-stone-600 hover:text-neutral-900 hover:bg-white transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-stone-700 hover:text-neutral-900 rounded-lg hover:bg-white transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-stone-600 hover:text-neutral-900 hover:bg-white transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-base font-extrabold text-neutral-900 min-w-[160px]">
            {monthTitle}
          </h2>
        </div>

        {/* Center / Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Partner Filter if Affiliate */}
          {system === 'affiliate' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-400 font-mono">Partner:</span>
              <select
                value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">All Partners</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.referral_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-xs font-semibold text-stone-600 hidden sm:inline">
              Partner Visibility
            </span>
            <button
              type="button"
              onClick={() => setShowOnAffiliateCalendars(!showOnAffiliateCalendars)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showOnAffiliateCalendars ? 'bg-[#facc15]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showOnAffiliateCalendars ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-stone-500 hover:text-neutral-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar Matrix Grid */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/70 text-center text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500 py-2.5">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 text-xs">
          {monthDays.map((cell, idx) => {
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={idx}
                className={`min-h-[105px] sm:min-h-[120px] p-2 transition-colors flex flex-col justify-between ${
                  !cell.isCurrentMonth 
                    ? 'bg-stone-50/40 text-stone-300' 
                    : isToday 
                    ? 'bg-amber-50/30 text-neutral-900' 
                    : 'text-neutral-900 hover:bg-stone-50/50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                    isToday ? 'bg-[#facc15] text-neutral-950 font-extrabold' : ''
                  }`}>
                    {cell.day}
                  </span>

                  {cell.bookings.length > 0 && (
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      {cell.bookings.length} bk
                    </span>
                  )}
                </div>

                {/* Day Booking Chips */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {cell.bookings.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-all cursor-pointer shadow-2xs border ${
                        b.status === 'confirmed' 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          : b.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          : 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200'
                      }`}
                      title={`${b.booking_time} - ${b.customer_name} (${b.service_name})`}
                    >
                      <span className="font-mono mr-1">{b.booking_time}</span>
                      <span>{b.customer_name}</span>
                    </div>
                  ))}

                  {cell.bookings.length > 3 && (
                    <div className="text-[10px] font-bold text-stone-500 text-center">
                      +{cell.bookings.length - 3} more
                    </div>
                  )}
                </div>

                <div className="h-1" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
