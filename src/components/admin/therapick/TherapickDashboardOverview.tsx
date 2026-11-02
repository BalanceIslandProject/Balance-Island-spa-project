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
  Sparkles, 
  Users, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Check,
  CalendarDays,
  Flame,
  Flower2,
  Heart
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
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

  // Calendar State for Split Calendar
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Booking Summary Metrics for Website Overview
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
    <div className="space-y-6 pb-20 font-sans antialiased text-[var(--fitlo-ink)]">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER GREETING & DATE RANGE CONTROLS (FITLO EDITORIAL STYLE)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--fitlo-ink)]">
            {system === 'website' ? 'Website Overview' : greeting}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fitlo-muted)] mt-0.5">
            {system === 'website'
              ? 'Direct bookings & revenue performance from your website.'
              : "Here's your affiliate partner performance today."}
          </p>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            className="fitlo-btn text-xs font-semibold shadow-xs"
          >
            <CalendarIcon size={14} className="text-[var(--fitlo-muted)]" />
            <span>{dateRange.label || 'Oct 1, 2026 - Oct 31, 2026'}</span>
            <ChevronDown size={14} className={`text-[var(--fitlo-muted)] transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dateDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--fitlo-card)] border border-[var(--fitlo-line-2)] rounded-2xl p-1.5 shadow-xl z-40 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--fitlo-muted)] border-b border-[var(--fitlo-line)]">
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
                      dateRange.preset === opt.id 
                        ? 'bg-[var(--fitlo-accent)] text-white font-bold' 
                        : 'text-[var(--fitlo-ink-2)] hover:bg-[var(--fitlo-card-2)]'
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
          2. FITLO 4 TINTED PASTEL KPI CARDS
         ───────────────────────────────────────────────────────────── */}
      <div className="fitlo-kpis">
        {/* Tile 1: Soft Peach - Total Revenue / Commission */}
        <div className="fitlo-kpi fitlo-kpi--1">
          <div className="fitlo-kpi__label">
            <Layers size={16} />
            <span>{system === 'website' ? 'Total Revenue' : 'Affiliate Commission'}</span>
          </div>
          <div className="fitlo-kpi__value">
            {system === 'website' 
              ? formatIDR(websiteMetrics.totalRevenue || 28450000) 
              : formatIDR(affiliateMetrics.commission || 4280000)}
          </div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">
              ↑ 14.2%
            </span>
            <span>vs previous period</span>
            {/* Embedded SVG sparkline */}
            <svg className="spark" viewBox="0 0 60 20">
              <path
                d="M 0 16 Q 15 4, 30 11 T 60 3"
                fill="none"
                stroke="#145c33"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Tile 2: Soft Cyan - Completed Bookings */}
        <div className="fitlo-kpi fitlo-kpi--2">
          <div className="fitlo-kpi__label">
            <CalendarDays size={16} />
            <span>Completed Bookings</span>
          </div>
          <div className="fitlo-kpi__value">
            {bookingSummary.completed}
          </div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">
              ↑ 8.4%
            </span>
            <span>of {bookingSummary.total} total</span>
            <svg className="spark" viewBox="0 0 60 20">
              <path
                d="M 0 14 Q 20 2, 40 12 T 60 5"
                fill="none"
                stroke="#08665f"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Tile 3: Soft Lemon - In-Flight Guests or Active Partners */}
        <div className="fitlo-kpi fitlo-kpi--3">
          <div className="fitlo-kpi__label">
            <Users size={16} />
            <span>{system === 'website' ? 'Upcoming Bookings' : 'Active Partners'}</span>
          </div>
          <div className="fitlo-kpi__value">
            {system === 'website' ? bookingSummary.upcoming : partnerSummary.active}
          </div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">
              ● Active
            </span>
            <span>{system === 'website' ? 'Dispatched / In-flight' : 'In network'}</span>
            <svg className="spark" viewBox="0 0 60 20">
              <path
                d="M 0 15 Q 18 10, 35 6 T 60 2"
                fill="none"
                stroke="#8a5600"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Tile 4: Soft Pebble - Net Profit or Outstanding Payouts */}
        <div className="fitlo-kpi fitlo-kpi--4">
          <div className="fitlo-kpi__label">
            <TrendingUp size={16} />
            <span>{system === 'website' ? 'Estimated Net Margin' : 'Pending Payouts'}</span>
          </div>
          <div className="fitlo-kpi__value">
            {system === 'website'
              ? formatIDR(websiteMetrics.netProfit || 12850000)
              : formatIDR(partnerSummary.outstandingPayouts)}
          </div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">
              ↑ 5.2%
            </span>
            <span>{system === 'website' ? '45% net margin' : 'Ready to disburse'}</span>
            <svg className="spark" viewBox="0 0 60 20">
              <path
                d="M 0 18 Q 15 12, 30 14 T 60 6"
                fill="none"
                stroke="#161a19"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REVENUE STUDIO & GLOWING CURVED AREA CHART
         ───────────────────────────────────────────────────────────── */}
      <div className="fitlo-card">
        <div className="fitlo-chead">
          <div>
            <h2>Revenue Studio</h2>
            <p>
              {system === 'website' ? 'Direct booking revenue over time' : 'Affiliate commissions & booking volume'} · +14.2% vs previous window
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className="text-xs font-semibold text-[var(--fitlo-accent-text)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full analytics</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* SVG Glowing Area Chart */}
        <div className="relative pt-6 pb-2 w-full select-none">
          <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[11px] font-mono text-[var(--fitlo-muted)] pointer-events-none">
            <span>Rp 30M</span>
            <span>Rp 20M</span>
            <span>Rp 10M</span>
            <span>Rp 0</span>
          </div>

          <div className="pl-14 w-full h-48 sm:h-56 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fitloRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--fitlo-accent)" stopOpacity="0.32" />
                  <stop offset="70%" stopColor="var(--fitlo-accent)" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="var(--fitlo-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="10" x2="600" y2="10" stroke="var(--fitlo-line)" strokeDasharray="3 4" strokeWidth="1" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="var(--fitlo-line)" strokeDasharray="3 4" strokeWidth="1" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="var(--fitlo-line)" strokeDasharray="3 4" strokeWidth="1" />
              <line x1="0" y1="190" x2="600" y2="190" stroke="var(--fitlo-line)" strokeWidth="1" />

              {/* Dashed Previous Window Comparison */}
              <path
                d="M 0 170 C 120 160, 240 150, 360 135 C 480 120, 540 110, 600 95"
                fill="none"
                stroke="var(--fitlo-muted)"
                strokeWidth="1.6"
                strokeDasharray="4 4"
                opacity="0.55"
              />

              {/* Main Glowing Area Fill */}
              <path
                d="M 0 165 C 130 150, 240 135, 360 100 C 460 70, 530 45, 600 30 L 600 190 L 0 190 Z"
                fill="url(#fitloRevenueGrad)"
              />

              {/* Main Curve */}
              <path
                d="M 0 165 C 130 150, 240 135, 360 100 C 460 70, 530 45, 600 30"
                fill="none"
                stroke="var(--fitlo-accent)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Interactive Curve Points */}
              {[
                { x: 0, y: 165, val: 'Rp 6M' },
                { x: 150, y: 145, val: 'Rp 14M' },
                { x: 300, y: 120, val: 'Rp 19M' },
                { x: 450, y: 65, val: 'Rp 24M' },
                { x: 600, y: 30, val: 'Rp 28M' }
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="var(--fitlo-card)"
                  stroke="var(--fitlo-accent)"
                  strokeWidth="2.5"
                />
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="pl-14 pt-3 flex justify-between text-[11px] font-semibold text-[var(--fitlo-muted)]">
            <span>Oct 1</span>
            <span>Oct 8</span>
            <span>Oct 15</span>
            <span>Oct 22</span>
            <span>Oct 31</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SPLIT GRID: RECENT BOOKINGS TABLE & BEST PERFORMERS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): Recent Bookings Table */}
        <div className="lg:col-span-8 fitlo-card fitlo-card--flush">
          <div className="fitlo-chead p-5 pb-3">
            <div>
              <h2>Recent Reservations</h2>
              <p>Click any row to open the full booking drawer</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="text-xs font-semibold text-[var(--fitlo-accent-text)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="fitlo-table-wrap">
            <table className="fitlo-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th className="r">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.slice(0, 5).map(b => {
                  const amount = Number(b.revenue || b.total_amount || 375000);
                  const status = b.status || 'Confirmed';
                  const initials = (b.guest_name || b.customer_name || 'Guest')
                    .split(' ')
                    .map((p: string) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-xs font-bold text-[var(--fitlo-ink)]">
                        {b.reference_number || String(b.id || '').slice(0, 8)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="fitlo-av" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                            {initials}
                          </div>
                          <span className="font-semibold text-xs text-[var(--fitlo-ink)]">
                            {b.guest_name || b.customer_name || 'Valued Guest'}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-[var(--fitlo-muted)] max-w-[140px] truncate">
                        {b.treatment_name || b.service_name || 'Balinese Traditional Massage'}
                      </td>
                      <td className="font-mono text-[11px] text-[var(--fitlo-muted)]">
                        {b.booking_date || b.created_at?.split('T')[0]} {b.time || '14:00'}
                      </td>
                      <td className="r font-mono font-bold text-xs text-[var(--fitlo-ink)]">
                        {formatIDR(amount)}
                      </td>
                      <td>
                        {status === 'Completed' || status === 'Finished' ? (
                          <span className="fitlo-pill fitlo-pill--good">Completed</span>
                        ) : status === 'Confirmed' ? (
                          <span className="fitlo-pill fitlo-pill--info">Confirmed</span>
                        ) : status === 'In Progress' ? (
                          <span className="fitlo-pill fitlo-pill--warn">In Progress</span>
                        ) : (
                          <span className="fitlo-pill fitlo-pill--bad">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Selling Best & Team Activity */}
        <div className="lg:col-span-4 space-y-5">
          {/* Selling Best Rituals */}
          <div className="fitlo-card">
            <div className="fitlo-chead">
              <div>
                <h2>Top Rituals</h2>
                <p>By demand this month</p>
              </div>
              <Sparkles size={16} className="text-[var(--fitlo-accent)]" />
            </div>

            <div className="space-y-3.5 pt-1">
              {[
                { name: 'Balinese Deep Tissue', units: 48, pct: 85, icon: Flame },
                { name: 'Signature Island Sanctuary', units: 36, pct: 65, icon: Flower2 },
                { name: 'Couples Rejuvenation', units: 22, pct: 45, icon: Heart },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-[var(--fitlo-accent)]" />
                        <span className="font-semibold text-[var(--fitlo-ink)]">{item.name}</span>
                      </div>
                      <span className="font-mono text-[var(--fitlo-muted)]">{item.units}</span>
                    </div>
                    <div className="fitlo-level">
                      <i style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Split Day Calendar Schedule */}
          <div className="fitlo-card">
            <div className="fitlo-chead">
              <div>
                <h2>Booking Calendar</h2>
                <p>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-[var(--fitlo-card-2)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-[var(--fitlo-card-2)] text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs pt-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="font-bold text-[10px] text-[var(--fitlo-muted)] pb-1">{d}</span>
              ))}

              {calendarDays.map((d, i) => {
                if (!d.dayNumber) {
                  return <div key={`empty-${i}`} className="h-7" />;
                }

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => d.dateStr && setSelectedDateStr(d.dateStr)}
                    className={`h-7 w-7 mx-auto rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                      d.isSelected
                        ? 'bg-[var(--fitlo-accent)] text-white font-bold shadow-xs'
                        : d.isToday
                        ? 'bg-[var(--fitlo-card-2)] text-[var(--fitlo-ink)] font-bold ring-1 ring-[var(--fitlo-accent)]'
                        : 'text-[var(--fitlo-ink)] hover:bg-[var(--fitlo-card-2)]'
                    }`}
                  >
                    <span>{d.dayNumber}</span>
                    {d.count > 0 && !d.isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[var(--fitlo-now)] absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Summary */}
            <div className="mt-3 pt-3 border-t border-[var(--fitlo-line)] flex items-center justify-between text-xs text-[var(--fitlo-muted)]">
              <span>{selectedDateBookings.length} bookings on this date</span>
              <button
                type="button"
                onClick={() => setIsAdvancedCalendarOpen(true)}
                className="font-bold text-[var(--fitlo-accent-text)] hover:underline cursor-pointer"
              >
                Schedule →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
