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
  ChevronRight as ArrowRight,
  RotateCw
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
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);
  
  // Date State
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/affiliates/stats?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && data.calendarBookings) {
        const cleanBookings = (data.calendarBookings as CalendarBooking[]).filter((b) => {
          const tName = (b.treatment_name || '').toLowerCase();
          return !tName.includes('jaens') && !tName.includes('center ubud') && !tName.includes('partner spa');
        });
        setBookings(cleanBookings);

        // Auto-focus to the latest booking's month if bookings exist
        if (cleanBookings.length > 0) {
          const dates = cleanBookings
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

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => {
    loadData();

    const onGlobalRefresh = () => {
      loadData();
    };
    const onWindowFocus = () => {
      loadData();
    };
    window.addEventListener('partner:refresh', onGlobalRefresh);
    window.addEventListener('focus', onWindowFocus);

    const channel = supabase
      .channel('partner_bookings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload: any) => {
        if (payload?.new) {
          const updated = payload.new;
          const refOrId = String(updated.reference_number || updated.id || '').toUpperCase().replace(/^#/, '');
          setBookings((prev) =>
            prev.map((b) => {
              const bRef = String(b.booking_id || b.id || '').toUpperCase().replace(/^#/, '');
              if (bRef === refOrId || b.id === updated.id) {
                const isCompleted = updated.treatment_status === 'Finished' || updated.status === 'Completed';
                const isCancelled = updated.status === 'Cancelled' || updated.treatment_status === 'Cancelled';
                return {
                  ...b,
                  booking_status: isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : (updated.status || b.booking_status),
                  treatment_status: updated.treatment_status || (isCompleted ? 'Finished' : b.treatment_status),
                  payment_status: updated.payment_status || b.payment_status,
                };
              }
              return b;
            })
          );
        }
        loadData();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Partner Bookings] Realtime live subscribed');
        }
      });

    return () => {
      window.removeEventListener('partner:refresh', onGlobalRefresh);
      window.removeEventListener('focus', onWindowFocus);
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

  // Map of date string -> status counts
  const dayStatusMap = useMemo(() => {
    const map: Record<string, { completed: boolean; upcoming: boolean; cancelled: boolean }> = {};

    bookings.forEach((b) => {
      const d = b.date || (b.created_at ? b.created_at.split('T')[0] : '');
      if (!d) return;

      if (!map[d]) {
        map[d] = { completed: false, upcoming: false, cancelled: false };
      }

      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const isCompleted = b.booking_status === 'Completed' || b.service_completed || b.commission_status === 'paid';

      if (isCancelled) map[d].cancelled = true;
      else if (isCompleted) map[d].completed = true;
      else map[d].upcoming = true;
    });

    return map;
  }, [bookings]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let up = 0;
    let comp = 0;
    let canc = 0;

    bookings.forEach((b) => {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const isCompleted = b.booking_status === 'Completed' || b.service_completed || b.commission_status === 'paid';

      if (isCancelled) canc++;
      else if (isCompleted) comp++;
      else up++;
    });

    return {
      all: bookings.length,
      upcoming: up,
      completed: comp,
      cancelled: canc,
    };
  }, [bookings]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = b.date || (b.created_at ? b.created_at.split('T')[0] : '');
      
      if (selectedDate) {
        if (bDate !== selectedDate) return false;
      }

      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const isCompleted = b.booking_status === 'Completed' || b.service_completed || b.commission_status === 'paid';
      const isUpcoming = !isCancelled && !isCompleted;

      if (statusFilter === 'upcoming' && !isUpcoming) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;
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
  }, [bookings, selectedDate, statusFilter, search]);

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

  const parseBookingDate = (dateStr?: string) => {
    if (!dateStr) return { day: '27', monthShort: 'OCT' };
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = clean.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return {
          day: String(d.getDate()).padStart(2, '0'),
          monthShort: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        };
      }
    } catch {
      // fallback
    }
    return { day: '27', monthShort: 'OCT' };
  };

  return (
    <div className="space-y-6 w-full font-sans max-w-[1400px] mx-auto pb-8">
      
      {/* ========================================================
          1. APP CONTROLS BAR (CLEAN APP-STYLE ACTION BAR)
         ======================================================== */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium font-mono">
            {counts.all} Total Bookings
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[12px] sm:text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh bookings data"
            aria-label="Refresh bookings data"
          >
            <RotateCw size={13} className={`text-[#64748B] ${refreshing ? 'animate-spin text-[#0E2319]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Month Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[12px] sm:text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
            >
              <CalendarIcon size={13} className="text-[#64748B]" />
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <ChevronDown size={13} className="text-[#94A3B8]" />
            </button>

          {showMonthDropdown && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg py-1 z-30 max-h-60 overflow-y-auto text-xs">
              {MONTH_NAMES.map((mName, mIdx) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(mIdx);
                    setShowMonthDropdown(false);
                    setSelectedDate(null);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] transition-colors ${currentMonth === mIdx ? 'text-[#0E2319] font-semibold bg-[#F1F5F9]' : 'text-[#475569]'}`}
                >
                  {mName} {currentYear}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. TWO-COLUMN LAYOUT (DESKTOP)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: COMPACT MONTHLY CALENDAR */}
        <div className="lg:col-span-4 bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          
          {/* Calendar Header with Navigation Arrows */}
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#0F172A]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[6px] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[6px] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAY_NAMES_SHORT.map((w) => (
              <span key={w} className="text-[11px] font-medium text-[#94A3B8] py-1">
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dObj, idx) => {
              const isSelected = selectedDate === dObj.dateStr;
              const dots = dayStatusMap[dObj.dateStr];
              const isDim = !dObj.isCurrentMonth;
              const hasActivity = dots?.completed || dots?.upcoming || dots?.cancelled;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dObj.dateStr)}
                  className={`relative flex flex-col items-center justify-center h-9 sm:h-10 rounded-[8px] text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E2319] text-white font-semibold shadow-xs'
                      : hasActivity
                      ? 'text-[#0E2319] font-semibold hover:bg-[#F1F5F9]'
                      : isDim
                      ? 'text-[#CBD5E1] hover:bg-[#F8FAFC]'
                      : 'text-[#0F172A] hover:bg-[#F8FAFC] font-medium'
                  }`}
                >
                  <span>{dObj.dayNumber}</span>
                  {hasActivity && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5 h-1">
                      {dots?.completed && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#059669]'}`} />}
                      {dots?.upcoming && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#2563EB]'}`} />}
                      {dots?.cancelled && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#DC2626]'}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend at Bottom */}
          <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669]" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Upcoming
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Cancelled
            </span>
          </div>

          {selectedDate && (
            <div className="pt-1 flex items-center justify-between text-xs bg-[#EFF6FF] text-[#2563EB] px-3 py-1.5 rounded-[6px] border border-[#DBEAFE]">
              <span>Selected: {selectedDate}</span>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="font-semibold underline hover:text-[#1D4ED8] cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BOOKINGS LIST & FILTERS */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filter Pills & Search */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                { key: 'completed', label: 'Completed', count: counts.completed },
                { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
              ].map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key as any)}
                    className={`px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#0E2319] text-white shadow-2xs font-semibold'
                        : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[11px] font-mono ${isActive ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference or treatment..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#E2E8F0] rounded-[8px] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0E2319] transition-colors shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bookings Card List */}
          {loading ? (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-10 text-center text-xs text-[#94A3B8]">
              Loading partner bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-[#0F172A]">No bookings found</p>
              <p className="text-xs text-[#64748B]">
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
                  className="mt-2 inline-flex px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#0E2319] text-white cursor-pointer"
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
                const isCompleted = b.booking_status === 'Completed' || b.service_completed || b.commission_status === 'paid';
                const isUpcoming = !isCancelled && !isCompleted;

                const cleanTreatment = cleanTreatmentName(b.treatment_name);
                const durationStr = extractDuration(b.treatment_name, b.duration);

                return (
                  <div
                    key={b.id || b.booking_id}
                    className="bg-white rounded-[12px] border border-[#E2E8F0] p-4 sm:p-5 shadow-2xs hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Date Box & Details */}
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      {/* Date Block */}
                      <div className="w-12 sm:w-14 text-center shrink-0 border-r border-[#F1F5F9] pr-3">
                        <div className="text-lg sm:text-xl font-bold text-[#0F172A] leading-none">
                          {day}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] uppercase mt-1">
                          {monthShort}
                        </div>
                      </div>

                      {/* Details (Strict Privacy: Treatment, Reference & Duration only) */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-[#0F172A] leading-snug truncate">
                          {cleanTreatment}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1 font-mono">
                          <span className="font-semibold text-[#0F172A]">
                            #{b.booking_id}
                          </span>
                          <span>•</span>
                          <span>{durationStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Commission, Status Indicator, and Track Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-sm font-bold text-[#0F172A] tabular-nums">
                          {formatIDR(b.commission_amount)}
                        </div>

                        {/* Status Indicator */}
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#059669]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Completed
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#DC2626]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" /> Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#2563EB]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" /> Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Track Button */}
                      <button
                        type="button"
                        onClick={() => setTrackingBooking(b)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-[6px] bg-[#0E2319] hover:bg-[#163625] text-white text-xs font-medium transition-all shadow-2xs cursor-pointer shrink-0"
                      >
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

      {/* ========================================================
          3. TRACK BOOKING DRAWER / MODAL
         ======================================================== */}
      {trackingBooking && (
        <ScheduleTrackingModal
          booking={trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}

    </div>
  );
}
