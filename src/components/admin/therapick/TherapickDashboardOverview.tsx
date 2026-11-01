'use client';

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  User, 
  Percent, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  MoreHorizontal, 
  Sparkles, 
  Users, 
  Globe, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Settings as SettingsIcon,
  Search,
  Filter
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { Booking } from '@/components/TherapickBookingManagement';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

export default function TherapickDashboardOverview() {
  const {
    system,
    activeTab,
    setActiveTab,
    websiteMetrics,
    affiliateMetrics,
    websiteBookings,
    affiliateBookings,
    partners,
    treatments,
    dateRange,
    setDatePreset,
    setSelectedBooking,
    setSelectedPartner,
    setIsAddBookingOpen,
    setIsAdvancedCalendarOpen,
    showOnAffiliateCalendars,
    setShowOnAffiliateCalendars,
    loading
  } = useTherapickAdmin();

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Calendar State for Mini Month Calendar
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Date Range Picker Dropdown State
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Subtab State: 'bookings' | 'partners' | 'commission' | 'payouts'
  const [subTab, setSubTab] = useState<'bookings' | 'partners' | 'commission' | 'payouts'>('bookings');

  // Active bookings list based on current system
  const currentBookings = system === 'website' ? websiteBookings : affiliateBookings;

  // Selected date's bookings
  const selectedDateBookings = useMemo(() => {
    return currentBookings.filter(b => {
      const bDate = b.booking_date || b.created_at.split('T')[0];
      return bDate === selectedDateStr;
    });
  }, [currentBookings, selectedDateStr]);

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    // Map bookings by date string in this month
    const bookingCountsByDay: Record<number, number> = {};
    currentBookings.forEach(b => {
      const bDate = b.booking_date || b.created_at.split('T')[0];
      const [bY, bM, bD] = bDate.split('-').map(Number);
      if (bY === year && bM - 1 === month) {
        bookingCountsByDay[bD] = (bookingCountsByDay[bD] || 0) + 1;
      }
    });

    const days: Array<{ dayNumber: number | null; dateStr: string | null; count: number; isSelected: boolean; isToday: boolean }> = [];

    // Empty lead cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dayNumber: null, dateStr: null, count: 0, isSelected: false, isToday: false });
    }

    // Days in current month
    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr: dStr,
        count: bookingCountsByDay[d] || 0,
        isSelected: dStr === selectedDateStr,
        isToday: isCurrentYearMonth && today.getDate() === d
      });
    }

    return days;
  }, [calendarMonth, currentBookings, selectedDateStr]);

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Top Partners ranking (Affiliate)
  const topPartners = useMemo(() => {
    const sorted = [...partners].sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0));
    return sorted.slice(0, 3);
  }, [partners]);

  // Top Services ranking (Website)
  const topServices = useMemo(() => {
    const counts: Record<string, { title: string; revenue: number; count: number }> = {};
    websiteBookings.forEach(b => {
      const name = b.treatment_name || 'Signature Ritual';
      if (!counts[name]) {
        counts[name] = { title: name, revenue: 0, count: 0 };
      }
      counts[name].revenue += Number(b.revenue || 0);
      counts[name].count += 1;
    });

    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  }, [websiteBookings]);

  // Format selected date header
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDateStr]);

  return (
    <div className="space-y-6 pb-20 font-sans antialiased text-neutral-900 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER GREETING & DATE RANGE CONTROLS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 font-sans">
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {system === 'website'
              ? "Here's your direct website performance and booking activity today."
              : "Here's your affiliate performance today."}
          </p>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-neutral-800 hover:bg-stone-50 shadow-2xs transition-all cursor-pointer"
          >
            <CalendarIcon size={14} className="text-stone-500" />
            <span>{dateRange.label || 'Date Range'}</span>
            <ChevronDown size={14} className={`text-stone-400 transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dateDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-2xl p-1.5 shadow-xl z-40 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 border-b border-stone-100">
                Select Date Window
              </div>
              <div className="py-1 space-y-0.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: 'year', label: 'This Year' },
                  { id: 'all', label: 'All Time' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setDatePreset(opt.id as any);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      dateRange.preset === opt.id ? 'bg-[#FACC15] text-neutral-950 font-bold' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PRIMARY FINANCIAL KPI CARDS (MATCHING MOCKUP)
         ───────────────────────────────────────────────────────────── */}
      {system === 'affiliate' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Revenue Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Layers size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Revenue</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(affiliateMetrics.affiliateRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
              <span>▲ +{affiliateMetrics.revChangePct}%</span>
              <span className="text-stone-400 font-normal">vs last period</span>
            </div>
          </div>

          {/* 2. Therapist Fee Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <User size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Therapist Fee</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(affiliateMetrics.therapistFees)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-rose-600">
              <span>▲ +8%</span>
              <span className="text-stone-400 font-normal">vs last period</span>
            </div>
          </div>

          {/* 3. Commission Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Percent size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Commission</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(affiliateMetrics.commission)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
              <span>▲ +10%</span>
              <span className="text-stone-400 font-normal">vs last period</span>
            </div>
          </div>

          {/* 4. Net Profit Card (Light Yellow Highlight Card) */}
          <div className="bg-[#FEF3C7]/70 border border-amber-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-900">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-bold text-amber-900">Net Profit</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(affiliateMetrics.netProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
              <span>▲ +{affiliateMetrics.netChangePct}%</span>
              <span className="text-amber-800/80 font-normal">vs last period</span>
            </div>
          </div>
        </div>
      ) : (
        /* Website 3 Primary KPI Cards */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Layers size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Total Website Revenue</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(websiteMetrics.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
              <span>▲ +{websiteMetrics.revChangePct}%</span>
              <span className="text-stone-400 font-normal">vs last period · {websiteMetrics.bookingCount} bookings</span>
            </div>
          </div>

          {/* Therapist Payments */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <User size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Therapist Payments</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(websiteMetrics.therapistPayments)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-rose-600">
              <span>▲ +7%</span>
              <span className="text-stone-400 font-normal">vs last period</span>
            </div>
          </div>

          {/* Net Profit (Light Yellow Highlight Card) */}
          <div className="bg-[#FEF3C7]/70 border border-amber-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-900">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-bold text-amber-900">Net Profit</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(websiteMetrics.netProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
              <span>▲ +{websiteMetrics.netChangePct}%</span>
              <span className="text-amber-800/80 font-normal">vs last period</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SUBTABS PILL BAR (Bookings, Partners, Commission, Payouts)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {system === 'affiliate' ? (
          <>
            <button
              type="button"
              onClick={() => setSubTab('bookings')}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'bookings'
                  ? 'bg-[#FACC15] text-neutral-950 shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              Bookings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('partners')}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Partners
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('commission')}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Commission
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payouts')}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Payouts
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSubTab('bookings')}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'bookings'
                  ? 'bg-[#FACC15] text-neutral-950 shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              Bookings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('therapists')}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Therapists
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Customers
            </button>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SPLIT LAYOUT: MINI CALENDAR + DAY'S BOOKINGS TABLE
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Booking Calendar (~4 cols / 35%) */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-neutral-900 font-sans tracking-tight">Booking Calendar</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-neutral-900 transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-neutral-800 px-1 font-mono">
                  {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-neutral-900 transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
                <div key={w} className="text-[10px] font-semibold text-stone-500 py-1 font-mono">
                  {w}
                </div>
              ))}

              {calendarDays.map((item, idx) => {
                if (!item.dayNumber) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => item.dateStr && setSelectedDateStr(item.dateStr)}
                    className={`h-8 w-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-semibold relative transition-all cursor-pointer ${
                      item.isSelected
                        ? 'bg-[#FACC15] text-neutral-950 font-bold shadow-xs'
                        : item.isToday
                        ? 'border border-amber-400 font-bold text-neutral-900'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{item.dayNumber}</span>
                    {item.count > 0 && !item.isSelected && (
                      <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility Controls & Advanced Calendar Button */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            {system === 'affiliate' && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-stone-400" />
                  <div>
                    <div className="text-xs font-semibold text-neutral-800">Show on Affiliate Calendars</div>
                    <div className="text-[10px] text-stone-600">Allow partners to see availability</div>
                  </div>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOnAffiliateCalendars(!showOnAffiliateCalendars)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showOnAffiliateCalendars ? 'bg-[#FACC15]' : 'bg-stone-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      showOnAffiliateCalendars ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsAdvancedCalendarOpen(true)}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-neutral-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <SettingsIcon size={13} className="text-stone-500" />
              <span>Advanced Calendar</span>
            </button>
          </div>
        </div>

        {/* Right Column: Selected Date's Bookings Table (~8 cols / 65%) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-neutral-900 font-sans tracking-tight">
                  Bookings — {formattedSelectedDate}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-stone-100 text-stone-700">
                  {selectedDateBookings.length} Bookings
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAddBookingOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FACC15] hover:bg-amber-400 text-xs font-bold text-neutral-950 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus size={14} />
                <span>Add Booking</span>
              </button>
            </div>

            {/* Bookings Table */}
            {selectedDateBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                <CalendarIcon size={24} className="mx-auto mb-2 text-stone-300" />
                No {system} bookings scheduled for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-2">Time</th>
                      <th className="py-2.5 px-2">Service</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Partner</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedDateBookings.map((b) => {
                      const isAffiliate = Boolean(b.affiliate_code || b.commission);
                      const partnerLabel = b.affiliate_code || b.partner_info?.business || (isAffiliate ? 'Affiliate' : 'Website');

                      return (
                        <tr 
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-2 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                            {b.time || '10:00'}
                          </td>
                          <td className="py-3 px-2 font-medium text-neutral-900 max-w-[140px] truncate">
                            {b.treatment_name || 'Balinese Massage'}
                          </td>
                          <td className="py-3 px-2 font-medium text-stone-700 whitespace-nowrap">
                            {b.guest_name || 'Guest'}
                          </td>
                          <td className="py-3 px-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200/80">
                              {isAffiliate ? <Users size={10} className="text-amber-600" /> : <Globe size={10} className="text-blue-600" />}
                              <span className="max-w-[70px] truncate">{partnerLabel}</span>
                            </span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-neutral-900 text-right whitespace-nowrap">
                            {formatIDR(b.revenue)}
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              (b.status || '').toLowerCase() === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : (b.treatment_status || '').toLowerCase().includes('progress')
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : (b.status || '').toLowerCase() === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span className="capitalize">{b.status || 'Pending'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right text-stone-400 group-hover:text-neutral-900">
                            <MoreHorizontal size={14} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick link to full bookings */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Showing {selectedDateBookings.length} bookings for this date</span>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="font-bold text-neutral-950 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All {system} Bookings</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. BOTTOM ROW: PERFORMANCE MICRO-METRICS & RANKINGS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Performance Micro-Stats (~5 cols / 42%) */}
        <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900 font-sans tracking-tight">
              {system === 'affiliate' ? 'Affiliate Performance' : 'Website Performance'}
            </h2>
            <span className="text-xs font-semibold text-stone-500">This period</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {system === 'affiliate' ? (
              <>
                <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3.5">
                  <div className="text-stone-500 mb-1.5">
                    <Users size={16} />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Active Partners</div>
                  <div className="text-xl font-bold text-neutral-950 mt-0.5">{affiliateMetrics.activePartnersCount}</div>
                </div>

                <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3.5">
                  <div className="text-stone-500 mb-1.5">
                    <CalendarIcon size={16} />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Total Bookings</div>
                  <div className="text-xl font-bold text-neutral-950 mt-0.5">{affiliateMetrics.bookingCount}</div>
                </div>

                <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3.5">
                  <div className="text-stone-500 mb-1.5">
                    <Percent size={16} />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Commission</div>
                  <div className="text-base sm:text-lg font-bold text-neutral-950 mt-0.5 truncate">{formatIDR(affiliateMetrics.commission)}</div>
                </div>

                <div className="bg-[#FEF3C7]/60 border border-amber-200/60 rounded-xl p-3.5">
                  <div className="text-amber-800 mb-1.5">
                    <TrendingUp size={16} />
                  </div>
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Net Profit</div>
                  <div className="text-base sm:text-lg font-bold text-neutral-950 mt-0.5 truncate">{formatIDR(affiliateMetrics.netProfit)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3.5">
                  <div className="text-stone-500 mb-1.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Completed Visits</div>
                  <div className="text-xl font-bold text-neutral-950 mt-0.5">{websiteMetrics.bookingCount}</div>
                </div>

                <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3.5">
                  <div className="text-stone-500 mb-1.5">
                    <Sparkles size={16} />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Avg Order Value</div>
                  <div className="text-base sm:text-lg font-bold text-neutral-950 mt-0.5 truncate">{formatIDR(websiteMetrics.avgBookingValue)}</div>
                </div>

                <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3.5">
                  <div className="text-stone-500 mb-1.5">
                    <User size={16} />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Therapist Costs</div>
                  <div className="text-base sm:text-lg font-bold text-neutral-950 mt-0.5 truncate">{formatIDR(websiteMetrics.therapistPayments)}</div>
                </div>

                <div className="bg-[#FEF3C7]/60 border border-amber-200/60 rounded-xl p-3.5">
                  <div className="text-amber-800 mb-1.5">
                    <TrendingUp size={16} />
                  </div>
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Net Profit</div>
                  <div className="text-base sm:text-lg font-bold text-neutral-950 mt-0.5 truncate">{formatIDR(websiteMetrics.netProfit)}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Top Rankings (~7 cols / 58%) */}
        <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900 font-sans tracking-tight">
              {system === 'affiliate' ? 'Top Partners by Revenue' : 'Top Services by Revenue'}
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab(system === 'affiliate' ? 'partners' : 'services')}
              className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {system === 'affiliate' ? (
              topPartners.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">No active partner revenue recorded.</div>
              ) : (
                topPartners.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPartner(p)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer border border-stone-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        idx === 0 ? 'bg-[#FACC15] text-neutral-950' : idx === 1 ? 'bg-stone-300 text-stone-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{p.first_name} {p.last_name || ''}</div>
                        <div className="text-[10px] text-stone-600 font-mono">Code: {p.referral_code} · {p.business_name || 'Partner'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{formatIDR(p.total_revenue || 0)}</span>
                      <ChevronRight size={14} className="text-stone-400" />
                    </div>
                  </div>
                ))
              )
            ) : (
              topServices.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">No service revenue recorded yet.</div>
              ) : (
                topServices.map((s, idx) => (
                  <div
                    key={s.title}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer border border-stone-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        idx === 0 ? 'bg-[#FACC15] text-neutral-950' : idx === 1 ? 'bg-stone-300 text-stone-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{s.title}</div>
                        <div className="text-[10px] text-stone-600">{s.count} total bookings</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{formatIDR(s.revenue)}</span>
                      <ChevronRight size={14} className="text-stone-400" />
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
