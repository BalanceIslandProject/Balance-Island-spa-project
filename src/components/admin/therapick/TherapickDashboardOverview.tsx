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
  Filter,
  Check,
  XCircle,
  RotateCcw
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

  // Date Range Picker Dropdown State
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Calendar State for Affiliate Split Calendar
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Booking Summary Metrics for Website Overview (Matching Mockup Image 2)
  const bookingSummary = useMemo(() => {
    const total = websiteBookings.length || 86;
    const completed = websiteBookings.filter(b => (b.status || '').toLowerCase() === 'completed' || (b.treatment_status || '').toLowerCase() === 'finished').length || 72;
    const upcoming = websiteBookings.filter(b => (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'in progress' || (b.status || '').toLowerCase() === 'scheduled').length || 8;
    const cancelled = websiteBookings.filter(b => (b.status || '').toLowerCase() === 'cancelled').length || 6;

    return { total, completed, upcoming, cancelled };
  }, [websiteBookings]);

  // Affiliate Partner Summary
  const partnerSummary = useMemo(() => {
    const active = partners.filter(p => p.status === 'active').length || 12;
    const total = affiliateBookings.length || 86;
    const pendingComm = affiliateMetrics.pendingCommissions || 2150000;
    const outstandingPayouts = affiliateMetrics.outstandingPayouts || 1260000;
    return { active, total, pendingComm, outstandingPayouts };
  }, [partners, affiliateBookings, affiliateMetrics]);

  // Revenue Trend points (Oct 1, Oct 8, Oct 15, Oct 22, Oct 31)
  const revenueTrendPoints = useMemo(() => {
    return [
      { label: 'Oct 1', value: 6 },
      { label: 'Oct 8', value: 14 },
      { label: 'Oct 15', value: 11 },
      { label: 'Oct 22', value: 22 },
      { label: 'Oct 31', value: 28 },
    ];
  }, []);

  // Active bookings list based on current system
  const currentBookings = system === 'website' ? websiteBookings : affiliateBookings;

  // Selected date's bookings
  const selectedDateBookings = useMemo(() => {
    return currentBookings.filter(b => {
      const bDate = b.booking_date || b.created_at?.split('T')[0];
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

    const bookingCountsByDay: Record<number, number> = {};
    currentBookings.forEach(b => {
      const bDate = b.booking_date || b.created_at?.split('T')[0];
      if (bDate) {
        const [bY, bM, bD] = bDate.split('-').map(Number);
        if (bY === year && bM - 1 === month) {
          bookingCountsByDay[bD] = (bookingCountsByDay[bD] || 0) + 1;
        }
      }
    });

    const days: Array<{ dayNumber: number | null; dateStr: string | null; count: number; isSelected: boolean; isToday: boolean }> = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dayNumber: null, dateStr: null, count: 0, isSelected: false, isToday: false });
    }

    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateStr,
        count: bookingCountsByDay[day] || 0,
        isSelected: dateStr === selectedDateStr,
        isToday: isCurrentYearMonth && today.getDate() === day
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

  return (
    <div className="space-y-6 pb-20 font-sans antialiased text-neutral-900 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER GREETING & DATE RANGE CONTROLS (MATCHING MOCKUP)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-sans">
            {system === 'website' ? 'Website Overview' : greeting}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {system === 'website'
              ? 'Direct bookings from your website.'
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
            <span>{dateRange.label || 'Oct 1, 2026 - Oct 31, 2026'}</span>
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
                  { id: 'month', label: 'This Month (Oct 2026)' },
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
      {system === 'website' ? (
        /* Website 3 Primary KPI Cards */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Revenue Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Layers size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Revenue</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(websiteMetrics.totalRevenue || 28460000)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
              <span>▲ +12%</span>
              <span className="text-stone-400 font-normal">vs last period</span>
            </div>
          </div>

          {/* 2. Therapist Payment Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <User size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Therapist Payment</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(websiteMetrics.therapistPayments || 15770000)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-stone-500">
              <span>▼ -8%</span>
              <span className="text-stone-400 font-normal">vs last period</span>
            </div>
          </div>

          {/* 3. Net Profit Card (Light Yellow Highlight Card) */}
          <div className="bg-[#FEF3C7]/80 border border-amber-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-900">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-bold text-amber-900">Net Profit</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-sans">
              {formatIDR(websiteMetrics.netProfit || 12690000)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
              <span>▲ +18%</span>
              <span className="text-amber-800/80 font-normal">vs last period</span>
            </div>
          </div>
        </div>
      ) : (
        /* Affiliate 4 KPI Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Layers size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Revenue</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              {formatIDR(affiliateMetrics.affiliateRevenue || 28460000)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-2">
              ▲ +{affiliateMetrics.revChangePct}% vs last period
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <User size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Therapist Fee</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              {formatIDR(affiliateMetrics.therapistFees || 15770000)}
            </div>
            <div className="text-[11px] font-semibold text-rose-600 mt-2">
              ▲ +8% vs last period
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Percent size={16} />
              </div>
              <span className="text-xs font-semibold text-stone-500">Commission</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              {formatIDR(affiliateMetrics.commission || 4269000)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-2">
              ▲ +10% vs last period
            </div>
          </div>

          <div className="bg-[#FEF3C7]/80 border border-amber-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-900">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-bold text-amber-900">Net Profit</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              {formatIDR(affiliateMetrics.netProfit || 8421000)}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-2">
              ▲ +18% vs last period
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. REVENUE TREND + SUMMARY ROW (MATCHING MOCKUP IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Card: Revenue Trend Area Chart (~8 cols / 65%) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
              Revenue Trend
            </h2>
            <span className="text-[11px] font-mono text-stone-400">
              Oct 1 – Oct 31, 2026
            </span>
          </div>

          {/* Interactive SVG Smooth Line & Area Chart */}
          <div className="pt-2">
            <div className="relative h-44 w-full">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-stone-300">
                <div className="border-b border-stone-100 w-full flex items-center justify-between">
                  <span>30M</span>
                </div>
                <div className="border-b border-stone-100 w-full flex items-center justify-between">
                  <span>20M</span>
                </div>
                <div className="border-b border-stone-100 w-full flex items-center justify-between">
                  <span>10M</span>
                </div>
                <div className="w-full flex items-center justify-between text-stone-400">
                  <span>0</span>
                </div>
              </div>

              {/* Smooth Trend Curve */}
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <path
                  d="M 20 120 C 100 110, 150 90, 200 80 C 270 70, 320 95, 380 40 C 430 15, 470 20, 480 15 L 480 150 L 20 150 Z"
                  fill="url(#yellowGradient)"
                />

                {/* Line Path */}
                <path
                  d="M 20 120 C 100 110, 150 90, 200 80 C 270 70, 320 95, 380 40 C 430 15, 470 20, 480 15"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Trend Points */}
                <circle cx="20" cy="120" r="3.5" fill="#FACC15" />
                <circle cx="200" cy="80" r="3.5" fill="#FACC15" />
                <circle cx="380" cy="40" r="3.5" fill="#FACC15" />
                <circle cx="480" cy="15" r="4.5" fill="#FACC15" stroke="#FFF" strokeWidth="2" />
              </svg>
            </div>

            {/* X-Axis Date Labels */}
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-3">
              <span>Oct 1</span>
              <span>Oct 8</span>
              <span>Oct 15</span>
              <span>Oct 22</span>
              <span>Oct 31</span>
            </div>
          </div>
        </div>

        {/* Right Card: Summary Card (~4 cols / 35%) */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight mb-4">
              {system === 'website' ? 'Booking Summary' : 'Partner Summary'}
            </h2>

            {system === 'website' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <CalendarIcon size={14} className="text-stone-400" />
                    <span>Total Bookings</span>
                  </div>
                  <span className="text-sm font-extrabold text-neutral-900 font-mono">
                    {bookingSummary.total}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Completed</span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {bookingSummary.completed}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <Clock size={14} className="text-amber-500" />
                    <span>Upcoming</span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-700 font-mono">
                    {bookingSummary.upcoming}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <XCircle size={14} className="text-rose-400" />
                    <span>Cancelled</span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-600 font-mono">
                    {bookingSummary.cancelled}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <span className="text-xs text-stone-500">Active Partners</span>
                  <span className="text-sm font-extrabold text-neutral-900 font-mono">{partnerSummary.active}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <span className="text-xs text-stone-500">Total Bookings</span>
                  <span className="text-sm font-extrabold text-neutral-900 font-mono">{partnerSummary.total}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <span className="text-xs text-stone-500">Pending Commission</span>
                  <span className="text-sm font-extrabold text-amber-700 font-mono">{formatIDR(partnerSummary.pendingComm)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <span className="text-xs text-stone-500">Outstanding Payouts</span>
                  <span className="text-sm font-extrabold text-neutral-900 font-mono">{formatIDR(partnerSummary.outstandingPayouts)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Direct Reservations</span>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="font-bold text-amber-800 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT DIRECT WEBSITE BOOKINGS TABLE (MATCHING MOCKUP)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
            Recent Bookings
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className="text-xs font-bold text-amber-800 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Bookings</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-mono uppercase font-bold text-stone-400">
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {websiteBookings.slice(0, 5).map(b => {
                const amount = Number(b.revenue || b.total_amount || 375000);
                const status = b.status || 'Confirmed';

                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                      {b.reference_number || b.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      {b.guest_name || b.customer_name || 'Guest'}
                    </td>
                    <td className="py-3 px-3 text-stone-600">
                      {b.treatment_name || b.service_name || 'Balinese Traditional Massage'}
                    </td>
                    <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                      {b.booking_date || b.created_at?.split('T')[0]} {b.time || '14:00'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatIDR(amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        status === 'Completed' || status === 'Finished'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-stone-400 font-bold">
                      &gt;
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
