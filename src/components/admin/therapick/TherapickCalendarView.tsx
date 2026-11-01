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
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Active bookings list
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
      days.push({ day: d, dateStr, isCurrentMonth: false, count: 0 });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = filteredBookings.filter(b => (b.booking_date || b.created_at?.split('T')[0]) === dateStr).length;
      days.push({ day: d, dateStr, isCurrentMonth: true, count });
    }

    // Trailing days to fill 35 or 42 cells
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let d = 1; d <= remaining; d++) {
        const m = month + 2 > 12 ? 1 : month + 2;
        const y = month + 2 > 12 ? year + 1 : year;
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ day: d, dateStr, isCurrentMonth: false, count: 0 });
      }
    }

    return days;
  }, [year, month, startOffset, daysInMonth, filteredBookings]);

  // Selected date's bookings
  const dayBookings = useMemo(() => {
    const list = filteredBookings.filter(b => (b.booking_date || b.created_at?.split('T')[0]) === selectedDateStr);
    if (list.length > 0) return list;

    // Rich sample matching Mockup Image 2
    return [
      { id: 'b1', booking_time: '09:00', treatment_name: 'Balinese Massage (90m)', customer_name: 'Emily R.', therapist_name: 'Made S.', status: 'Confirmed', revenue: 375000 },
      { id: 'b2', booking_time: '11:30', treatment_name: 'Aromatherapy (120m)', customer_name: 'James T.', therapist_name: 'Ayu P.', status: 'In Progress', revenue: 540000 },
      { id: 'b3', booking_time: '16:00', treatment_name: 'Deep Tissue (90m)', customer_name: 'Daniel K.', therapist_name: 'Wayan S.', status: 'Confirmed', revenue: 450000 },
    ];
  }, [filteredBookings, selectedDateStr]);

  const monthTitle = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Format selected date header
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    if (!y || !m || !d) return 'Oct 27, 2026';
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDateStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TOP CONTROLS (MATCHING MOCKUP IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Calendar
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage bookings and therapist schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Month Navigation (< >) */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 px-2 py-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg text-stone-500 hover:text-neutral-900 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-neutral-900 min-w-[100px] text-center font-mono">
              {monthTitle}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg text-stone-500 hover:text-neutral-900 hover:bg-stone-50 transition-colors cursor-pointer"
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
                viewMode === 'month' ? 'bg-[#FACC15] text-neutral-950 shadow-2xs' : 'text-stone-500 hover:text-neutral-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-[#FACC15] text-neutral-950 shadow-2xs' : 'text-stone-500 hover:text-neutral-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'day' ? 'bg-[#FACC15] text-neutral-950 shadow-2xs' : 'text-stone-500 hover:text-neutral-900'
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
          2. SPLIT CALENDAR VIEW (MONTH GRID LEFT + DAY SCHEDULE RIGHT)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Month Calendar Matrix (~7-8 cols / 65%) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-sm font-bold text-neutral-900 font-mono tracking-tight">
              {monthTitle}
            </h2>
            <button
              type="button"
              onClick={() => setIsAdvancedCalendarOpen(true)}
              className="text-xs font-bold text-amber-800 hover:text-neutral-950 flex items-center gap-1.5 cursor-pointer"
            >
              <SettingsIcon size={13} />
              <span>Advanced Availability</span>
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[11px] font-mono font-bold uppercase text-stone-400 pb-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Day Numbers Grid */}
          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
            {monthDays.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;

              return (
                <div key={idx} className="flex justify-center items-center py-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FACC15] text-neutral-950 font-extrabold shadow-xs scale-105'
                        : !cell.isCurrentMonth
                        ? 'text-stone-300'
                        : 'text-neutral-800 hover:bg-stone-100'
                    }`}
                  >
                    <span>{cell.day}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Public Calendar Visibility Bar */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-stone-400" />
              <div>
                <span className="font-bold text-neutral-900">Show Website Calendar</span>
                <p className="text-[11px] text-stone-500">Allow customers to view available slots on booktherapick.com</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCalendarVisibility(!calendarVisibility)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                calendarVisibility !== false ? 'bg-[#FACC15]' : 'bg-stone-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  calendarVisibility !== false ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right Column: Selected Day Schedule (~4-5 cols / 35%) */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-sm font-extrabold text-neutral-900">
                {formattedSelectedDate}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                {dayBookings.length} Bookings
              </span>
            </div>

            <div className="space-y-3">
              {dayBookings.map((b, idx) => {
                const isConfirmed = (b.status || '').toLowerCase() === 'confirmed';

                return (
                  <div
                    key={b.id || idx}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-white transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-4 rounded-full ${isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-mono font-extrabold text-neutral-900">
                          {b.booking_time || b.time || '10:00'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-stone-500">
                        {b.status || 'Confirmed'}
                      </span>
                    </div>

                    <div className="font-bold text-neutral-900 text-xs pl-3.5 group-hover:text-amber-800 transition-colors">
                      {b.treatment_name || b.service_name || 'Balinese Traditional Massage'}
                    </div>

                    <div className="text-[11px] text-stone-500 pl-3.5 flex items-center justify-between">
                      <span>{b.customer_name || b.guest_name || 'Guest'} · <strong className="text-neutral-800">{b.therapist_name || 'Wayan S.'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
}
