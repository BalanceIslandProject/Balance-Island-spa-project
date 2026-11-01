'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Clock,
  Timer,
  MapPin,
  DoorClosed,
  User,
  Activity,
  Sparkles
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal, { cleanTreatmentName, extractDuration } from '../ScheduleTrackingModal';
import { supabase } from '@/lib/supabase';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);
  
  // Date State
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [timeframePreset, setTimeframePreset] = useState<'this-month' | 'all' | 'last-month'>('this-month');

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/affiliates/stats');
      const data = await res.json();
      if (data.success && data.calendarBookings) {
        setBookings(data.calendarBookings);

        // Auto-focus to the latest booking's month if bookings exist
        if (data.calendarBookings.length > 0) {
          const dates = (data.calendarBookings as CalendarBooking[])
            .map((b) => b.date)
            .filter(Boolean)
            .sort()
            .reverse();
          if (dates.length > 0) {
            const [y, m] = dates[0].split('-').map(Number);
            if (y && m) {
              setCurrentYear(y);
              setCurrentMonth(m - 1);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('partner_bookings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calendar Day Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
    }

    // Next month padding to make full weeks
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map of date string -> status dots
  const dayStatusMap = useMemo(() => {
    const map: Record<string, { paid: boolean; approved: boolean; pending: boolean; cancelled: boolean }> = {};

    bookings.forEach((b) => {
      const d = b.date || (b.created_at ? b.created_at.split('T')[0] : '');
      if (!d) return;

      if (!map[d]) {
        map[d] = { paid: false, approved: false, pending: false, cancelled: false };
      }

      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const isPaid = b.commission_status === 'paid' || b.payment_status === 'paid';
      const isApproved = b.commission_status === 'approved';

      if (isCancelled) map[d].cancelled = true;
      else if (isPaid) map[d].paid = true;
      else if (isApproved) map[d].approved = true;
      else map[d].pending = true;
    });

    return map;
  }, [bookings]);

  // Mobile Week Strip (Active week around selectedDate or 15th)
  const mobileWeekDays = useMemo(() => {
    let baseDate: Date;
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      baseDate = new Date(y, m - 1, d);
    } else {
      baseDate = new Date(currentYear, currentMonth, 15);
    }

    const dayOfWeek = baseDate.getDay();
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      week.push({
        dayName: WEEKDAY_NAMES_SHORT[i],
        dayNumber: d.getDate(),
        dateStr,
      });
    }
    return week;
  }, [currentYear, currentMonth, selectedDate]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = b.date || (b.created_at ? b.created_at.split('T')[0] : '');
      
      if (selectedDate) {
        if (bDate !== selectedDate) return false;
      } else if (timeframePreset === 'this-month') {
        const [y, m] = bDate.split('-').map(Number);
        if (y !== currentYear || m !== currentMonth + 1) return false;
      }

      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const isPaid = b.commission_status === 'paid';
      const isCompleted = b.booking_status === 'Completed' || b.service_completed;
      const isUpcoming = !isCancelled && !isCompleted && !isPaid;

      if (statusFilter === 'upcoming' && !isUpcoming) return false;
      if (statusFilter === 'completed' && !(isCompleted || isPaid)) return false;
      if (statusFilter === 'cancelled' && !isCancelled) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = (b.booking_id || '').toLowerCase().includes(q);
        const matchGuest = (b.guest_name || '').toLowerCase().includes(q);
        const matchTreat = (b.treatment_name || '').toLowerCase().includes(q);
        if (!matchId && !matchGuest && !matchTreat) return false;
      }

      return true;
    });
  }, [bookings, selectedDate, timeframePreset, currentYear, currentMonth, statusFilter, search]);

  const filteredTotalCommission = useMemo(() => {
    return filteredBookings.reduce((sum, b) => {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      if (isCancelled) return sum;
      return sum + Number(b.commission_amount || 0);
    }, 0);
  }, [filteredBookings]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const parseBookingDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        const dt = new Date(y, m - 1, d);
        const day = dt.getDate();
        const monthShort = dt.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        return { day, monthShort };
      }
    } catch {
      // fallback
    }
    return { day: '01', monthShort: 'OCT' };
  };

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0f172a] tracking-tight">
            Bookings
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            View and track all your bookings.
          </p>
        </div>

        {/* Timeframe Dropdown (e.g. This Month) */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-white border border-[#e2e8f0] text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] shadow-xs transition-colors cursor-pointer"
          >
            <CalendarIcon size={14} className="text-[#64748b]" />
            <span>
              {timeframePreset === 'this-month' 
                ? `${MONTH_NAMES[currentMonth]} ${currentYear}` 
                : timeframePreset === 'last-month' 
                ? 'Last Month' 
                : 'All Time'}
            </span>
            <ChevronDown size={14} className="text-[#94a3b8]" />
          </button>

          {showTimeframeMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg p-1.5 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTimeframePreset('this-month');
                  setSelectedDate(null);
                  setShowTimeframeMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-[6px] ${
                  timeframePreset === 'this-month' ? 'bg-[#0f172a] text-white' : 'text-[#0f172a] hover:bg-[#f8fafc]'
                }`}
              >
                {MONTH_NAMES[currentMonth]} {currentYear}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeframePreset('all');
                  setSelectedDate(null);
                  setShowTimeframeMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-[6px] ${
                  timeframePreset === 'all' ? 'bg-[#0f172a] text-white' : 'text-[#0f172a] hover:bg-[#f8fafc]'
                }`}
              >
                All Time Bookings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MOBILE ONLY: HORIZONTAL WEEK STRIP (md:hidden)
         ======================================================== */}
      <div className="md:hidden bg-white rounded-xl border border-[#e2e8f0] p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#0f172a]">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9]"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9]"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {mobileWeekDays.map((wd) => {
            const isSelected = selectedDate === wd.dateStr;
            const dots = dayStatusMap[wd.dateStr];
            return (
              <button
                key={wd.dateStr}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : wd.dateStr)}
                className={`flex flex-col items-center py-2 rounded-[8px] transition-all cursor-pointer ${
                  isSelected ? 'bg-[#2563eb] text-white' : 'hover:bg-[#f8fafc] text-[#0f172a]'
                }`}
              >
                <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-[#94a3b8]'}`}>
                  {wd.dayName}
                </span>
                <span className="text-xs font-semibold mt-0.5">
                  {wd.dayNumber}
                </span>
                <div className="flex items-center justify-center gap-0.5 mt-1 h-1.5">
                  {dots?.paid && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />}
                  {dots?.approved && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                  {dots?.pending && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />}
                  {dots?.cancelled && <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dot Legend */}
        <div className="flex items-center justify-center gap-3 pt-1 border-t border-[#f1f5f9] text-[10px] text-[#64748b]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Paid
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Approved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Cancelled
          </span>
        </div>
      </div>

      {/* ========================================================
          DESKTOP 2-COLUMN VIEW & SHARED FEED
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: DESKTOP CALENDAR CARD */}
        <div className="hidden md:block md:col-span-5 lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-[6px] transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-[#0f172a] min-w-[120px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-[6px] transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-medium text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-full hover:bg-[#f1f5f9] transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {WEEKDAY_NAMES_SHORT.map((w) => (
              <span key={w} className="text-[11px] font-medium text-[#94a3b8] py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dObj, idx) => {
              const isSelected = selectedDate === dObj.dateStr;
              const dots = dayStatusMap[dObj.dateStr];
              const isDim = !dObj.isCurrentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dObj.dateStr)}
                  className={`relative flex flex-col items-center justify-center h-10 rounded-[8px] text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2563eb] text-white font-semibold shadow-xs'
                      : isDim
                      ? 'text-[#cbd5e1] hover:bg-[#f8fafc]'
                      : 'text-[#0f172a] hover:bg-[#f8fafc] font-medium'
                  }`}
                >
                  <span>{dObj.dayNumber}</span>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 h-1.5">
                    {dots?.paid && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />}
                    {dots?.approved && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                    {dots?.pending && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />}
                    {dots?.cancelled && <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748b]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Paid Out
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Cancelled
            </span>
          </div>

          {selectedDate && (
            <div className="pt-1 flex items-center justify-between text-xs bg-[#eff6ff] text-[#2563eb] px-3 py-1.5 rounded-[6px] border border-[#dbeafe]">
              <span>Filtered by date: {selectedDate}</span>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="font-semibold underline hover:text-[#1d4ed8]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BOOKINGS FEED */}
        <div className="col-span-1 md:col-span-7 lg:col-span-8 space-y-4">
          
          {/* Filter Pills & Search */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((tab) => {
                  const isActive = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStatusFilter(tab.key as any)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0f172a] text-white shadow-xs'
                          : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-[#2563eb] hover:underline"
                >
                  Show all days
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking, guest or treatment..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Summary Counter Bar */}
            <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
              <span>
                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                {filteredBookings.length > 0 && ` • ${formatIDR(filteredTotalCommission)}`}
              </span>
            </div>
          </div>

          {/* Bookings Card List */}
          {loading ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-10 text-center text-xs text-[#94a3b8]">
              Loading partner bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-[#0f172a]">No bookings found</p>
              <p className="text-xs text-[#64748b]">
                {search || selectedDate || statusFilter !== 'all' 
                  ? 'Try clearing filters or search term.'
                  : 'Guests who book through your referral link will appear here automatically.'}
              </p>
              {(selectedDate || search || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    setSearch('');
                    setStatusFilter('all');
                  }}
                  className="mt-2 inline-flex px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#0f172a] text-white cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const bDateStr = b.date || (b.created_at ? b.created_at.split('T')[0] : '2026-10-31');
                const { day, monthShort } = parseBookingDate(bDateStr);

                const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                const isPaidOut = b.commission_status === 'paid';
                const isApproved = b.commission_status === 'approved';

                // Treatment & Duration formatted cleanly without (120)
                const cleanTreatment = cleanTreatmentName(b.treatment_name);
                const durationStr = extractDuration(b.treatment_name, b.duration);

                return (
                  <div
                    key={b.id || b.booking_id}
                    className="bg-white rounded-xl border border-[#e2e8f0] p-4 sm:p-5 shadow-xs hover:border-[#cbd5e1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Date Box & Details */}
                    <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      {/* Date Block */}
                      <div className="w-12 sm:w-14 text-center shrink-0 border-r border-[#f1f5f9] pr-3 pt-0.5 sm:pt-0">
                        <div className="text-lg sm:text-xl font-bold text-[#0f172a] leading-none">
                          {day}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-semibold text-[#94a3b8] uppercase mt-1">
                          {monthShort}
                        </div>
                      </div>

                      {/* Details with Clean Treatment Name and Metadata Icons */}
                      <div className="min-w-0 flex-1">
                        {/* Only the clean treatment name without (120) */}
                        <h3 className="text-sm sm:text-[15px] font-semibold text-[#0f172a] leading-snug">
                          {cleanTreatment}
                        </h3>

                        {/* Metadata Row with Icons: Booking ID, Guest, Time, Duration, Location, Room */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b] mt-1.5">
                          <span className="font-mono text-[11px] text-[#0f172a] font-medium">
                            #{b.booking_id}
                          </span>
                          
                          {/* Guest */}
                          <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                            <User size={11} className="text-[#94a3b8] shrink-0" />
                            <span>{b.guest_name || 'Guest'}</span>
                          </span>

                          {/* Time */}
                          {b.time && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <Clock size={11} className="text-[#94a3b8] shrink-0" />
                              <span>{b.time}</span>
                            </span>
                          )}

                          {/* Duration */}
                          {durationStr && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <Timer size={11} className="text-[#94a3b8] shrink-0" />
                              <span>{durationStr}</span>
                            </span>
                          )}

                          {/* Location */}
                          {b.location && (
                            <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                              <MapPin size={11} className="text-[#94a3b8] shrink-0" />
                              <span className="truncate">{b.location}</span>
                            </span>
                          )}

                          {/* Room */}
                          {b.room_number && b.room_number !== '-' && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <DoorClosed size={11} className="text-[#94a3b8] shrink-0" />
                              <span>Room {b.room_number}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Commission & Status & Track Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f1f5f9]">
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-sm font-bold text-[#0f172a]">
                          {formatIDR(b.commission_amount)}
                        </div>

                        {/* Status Pill */}
                        <div className="mt-0.5">
                          {isPaidOut ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Paid Out
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" /> Cancelled
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" /> Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Track Dark Button with Icon */}
                      <button
                        type="button"
                        onClick={() => setTrackingBooking(b)}
                        className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-[8px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Activity size={12} className="text-white/80" />
                        <span>Track</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Tracking Modal */}
      {trackingBooking && (
        <ScheduleTrackingModal
          booking={trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}
    </div>
  );
}
