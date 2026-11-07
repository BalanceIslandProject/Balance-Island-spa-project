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

const formatIDRCompact = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  if (num >= 1000000) {
    const m = (num / 1000000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${m}M`;
  }
  if (num >= 1000) {
    const k = Math.round(num / 1000);
    return `Rp ${k}K`;
  }
  return `Rp ${num}`;
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

  // Active bookings list based on current system
  const currentBookings = system === 'website' ? websiteBookings : affiliateBookings;

  // Real filtered bookings for current date range
  const currentFilteredBookings = useMemo(() => {
    return currentBookings.filter(b => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const bDate = b.booking_date || (b.created_at ? b.created_at.split('T')[0] : '');
      return bDate >= dateRange.startDate && bDate <= dateRange.endDate;
    });
  }, [currentBookings, dateRange]);

  // Booking Summary Metrics for Current System (Website or Affiliate)
  const bookingSummary = useMemo(() => {
    const list = currentFilteredBookings;
    const total = list.length;
    const completed = list.filter(b => {
      const s = (b.status || '').toLowerCase();
      const ts = (b.treatment_status || '').toLowerCase();
      return s === 'completed' || s === 'finished' || ts === 'finished' || ts === 'completed';
    }).length;
    const upcoming = list.filter(b => {
      const s = (b.status || '').toLowerCase();
      const ts = (b.treatment_status || '').toLowerCase();
      return s === 'confirmed' || s === 'in progress' || s === 'scheduled' || s === 'ongoing' || s === 'pending' || ts === 'scheduled' || ts === 'in progress';
    }).length;
    const cancelled = list.filter(b => (b.status || '').toLowerCase() === 'cancelled').length;

    return { total, completed, upcoming, cancelled };
  }, [currentFilteredBookings]);

  // Affiliate Partner Summary
  const partnerSummary = useMemo(() => {
    const active = partners.filter(p => p.status === 'active').length;
    const total = affiliateBookings.length;
    const pendingComm = affiliateMetrics.pendingCommissions || 0;
    const outstandingPayouts = affiliateMetrics.outstandingPayouts || 0;
    return { active, total, pendingComm, outstandingPayouts };
  }, [partners, affiliateBookings, affiliateMetrics]);

  // Top Rituals dynamically computed from currentFilteredBookings
  const topRituals = useMemo(() => {
    const counts: Record<string, number> = {};
    currentFilteredBookings.forEach(b => {
      if ((b.status || '').toLowerCase() === 'cancelled') return;
      const name = b.treatment_name || b.service_name || 'Massage';
      counts[name] = (counts[name] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxUnits = entries.length > 0 ? entries[0][1] : 1;
    const icons = [Flame, Flower2, Heart, Sparkles, Layers];

    return entries.slice(0, 4).map(([name, units], idx) => ({
      name,
      units,
      pct: Math.round((units / maxUnits) * 100),
      icon: icons[idx % icons.length]
    }));
  }, [currentFilteredBookings]);

  // Dynamic Timeline Points for Revenue Studio Chart
  const chartData = useMemo(() => {
    const validBookings = currentFilteredBookings
      .filter(b => (b.status || '').toLowerCase() !== 'cancelled')
      .sort((a, b) => {
        const da = a.booking_date || a.created_at || '';
        const db = b.booking_date || b.created_at || '';
        return da.localeCompare(db);
      });

    let startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date();
    let endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const intervalsCount = 5;
    const stepDays = Math.max(1, Math.floor(totalDays / (intervalsCount - 1)));

    const points: Array<{ label: string; dateStr: string; rev: number; cumRev: number; x: number; y: number }> = [];
    let runningTotal = 0;

    for (let i = 0; i < intervalsCount; i++) {
      const pDate = i === intervalsCount - 1 
        ? new Date(endDate) 
        : new Date(startDate.getTime() + i * stepDays * (1000 * 60 * 60 * 24));
      
      const yyyy = pDate.getFullYear();
      const mm = String(pDate.getMonth() + 1).padStart(2, '0');
      const dd = String(pDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const monthShort = pDate.toLocaleString('en-US', { month: 'short' });
      const label = `${monthShort} ${pDate.getDate()}`;

      const prevDate = i === 0 ? '1970-01-01' : points[i - 1].dateStr;
      const bucketBookings = validBookings.filter(b => {
        const bDate = b.booking_date || b.created_at?.split('T')[0] || '';
        return bDate > prevDate && bDate <= dateStr;
      });
      const intervalRev = bucketBookings.reduce((sum, b) => sum + (Number(b.revenue || b.total_price || 0)), 0);
      runningTotal += intervalRev;

      points.push({
        label,
        dateStr,
        rev: intervalRev,
        cumRev: runningTotal,
        x: (i / (intervalsCount - 1)) * 600,
        y: 190
      });
    }

    const maxVal = Math.max(runningTotal, 1000000);
    points.forEach(pt => {
      pt.y = Math.round(190 - (pt.cumRev / maxVal) * 160);
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
    const areaPath = `${linePath} L 600 190 L 0 190 Z`;

    return {
      points,
      linePath,
      areaPath,
      maxVal,
      totalRevenue: runningTotal
    };
  }, [currentFilteredBookings, dateRange]);

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
              ? formatIDR(websiteMetrics.totalRevenue) 
              : formatIDR(affiliateMetrics.commission)}
          </div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">
              ● {dateRange.label || 'Current'}
            </span>
            <span>{system === 'website' ? `${currentFilteredBookings.length} bookings` : `${partnerSummary.total} partner bookings`}</span>
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
              {bookingSummary.total > 0 ? Math.round((bookingSummary.completed / bookingSummary.total) * 100) : 0}%
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
            <span>{system === 'website' ? `${bookingSummary.cancelled} cancelled` : `${partners.length} total partners`}</span>
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
              ? formatIDR(websiteMetrics.netProfit)
              : formatIDR(partnerSummary.outstandingPayouts)}
          </div>
          <div className="fitlo-kpi__foot">
            <span className="fitlo-delta fitlo-delta--up">
              {system === 'website'
                ? `${websiteMetrics.totalRevenue > 0 ? Math.round((websiteMetrics.netProfit / websiteMetrics.totalRevenue) * 100) : 0}%`
                : (partnerSummary.outstandingPayouts > 0 ? 'Pending' : 'Settled')}
            </span>
            <span>{system === 'website' ? 'Net platform margin' : 'Ready to disburse'}</span>
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
              {system === 'website' ? 'Direct booking revenue over time' : 'Affiliate commissions & booking volume'} · {formatIDR(chartData.totalRevenue)} ({dateRange.label || 'All time'})
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
            <span>{formatIDRCompact(chartData.maxVal)}</span>
            <span>{formatIDRCompact(chartData.maxVal * 0.66)}</span>
            <span>{formatIDRCompact(chartData.maxVal * 0.33)}</span>
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

              {/* Main Glowing Area Fill */}
              <path
                d={chartData.areaPath}
                fill="url(#fitloRevenueGrad)"
              />

              {/* Main Curve */}
              <path
                d={chartData.linePath}
                fill="none"
                stroke="var(--fitlo-accent)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Interactive Curve Points */}
              {chartData.points.map((pt, i) => (
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
            {chartData.points.map((pt, i) => (
              <span key={i}>{pt.label}</span>
            ))}
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
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--fitlo-muted)]">
                      No reservations recorded for this period.
                    </td>
                  </tr>
                ) : (
                  currentBookings.slice(0, 5).map(b => {
                    const amount = Number(b.revenue || b.total_price || b.total_amount || 0);
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
                  })
                )}
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
              {topRituals.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--fitlo-muted)]">
                  No treatments recorded for this period.
                </div>
              ) : (
                topRituals.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-[var(--fitlo-accent)]" />
                          <span className="font-semibold text-[var(--fitlo-ink)] truncate max-w-[170px]">{item.name}</span>
                        </div>
                        <span className="font-mono text-[var(--fitlo-muted)]">{item.units}</span>
                      </div>
                      <div className="fitlo-level">
                        <i style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
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
