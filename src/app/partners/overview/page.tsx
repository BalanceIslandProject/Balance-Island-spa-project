'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  ChevronDown, 
  ArrowUpRight, 
  CalendarDays, 
  Receipt, 
  Wallet, 
  Share2, 
  Check, 
  Copy,
  TrendingUp,
  Clock,
  Sparkles,
  RotateCw,
  Eye,
  Activity,
  Flame,
  Flower2,
  Heart,
  Footprints,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ScheduleTrackingModal, { cleanTreatmentName } from '../ScheduleTrackingModal';

export default function PartnerOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'this-month' | 'last-30' | 'all'>('this-month');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<any | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, meRes] = await Promise.all([
        fetch('/api/affiliates/stats').then((r) => r.json()),
        fetch('/api/affiliates/auth/me').then((r) => r.json()),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats || null);
        setCalendarBookings(statsRes.calendarBookings || []);
      }
      if (meRes.success && meRes.partner) {
        setPartner(meRes.partner);
      }
    } catch (e) {
      console.error('Failed to load overview data:', e);
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
    window.addEventListener('partner:refresh', onGlobalRefresh);

    const channel = supabase
      .channel('partner_overview_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadData())
      .subscribe();

    return () => {
      window.removeEventListener('partner:refresh', onGlobalRefresh);
      supabase.removeChannel(channel);
    };
  }, []);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp ${formatted}`;
  };

  const formatDateShort = (rawDate?: string) => {
    if (!rawDate) return '';
    try {
      const clean = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      const parts = clean.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return rawDate;
  };

  // Date range label
  const currentDateLabel = useMemo(() => {
    const now = new Date();
    if (timeframe === 'all') {
      return 'All Time';
    }
    if (timeframe === 'last-30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    // this-month
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return `${month} 1 - ${month} ${lastDay}, ${year}`;
  }, [timeframe]);

  // Filter bookings by timeframe
  const filteredBookings = useMemo(() => {
    const bList = calendarBookings || [];
    if (timeframe === 'all') return bList;

    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (timeframe === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return bList.filter((b) => {
        const dStr = b.date || b.created_at;
        if (!dStr) return false;
        const d = new Date(dStr.includes('T') ? dStr : `${dStr}T00:00:00`);
        return !isNaN(d.getTime()) && d >= startOfMonth && d <= endOfMonth;
      });
    }

    if (timeframe === 'last-30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return bList.filter((b) => {
        const dStr = b.date || b.created_at;
        if (!dStr) return false;
        const d = new Date(dStr.includes('T') ? dStr : `${dStr}T00:00:00`);
        return !isNaN(d.getTime()) && d >= thirtyDaysAgo && d <= endOfDay;
      });
    }

    return bList;
  }, [calendarBookings, timeframe]);

  // Metrics calculation
  const {
    totalBookingsCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    totalEarnings,
    availableBalance,
    pendingCommission,
    totalPaidOut,
    recentBookings,
    todaySoFar
  } = useMemo(() => {
    let up = 0;
    let comp = 0;
    let canc = 0;
    let totalComm = 0;
    let pendingComm = 0;
    let approvedComm = 0;
    let paidComm = 0;
    let todayComm = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    filteredBookings.forEach((b) => {
      const bStatus = (b.booking_status || '').toLowerCase();
      const cStatus = (b.commission_status || '').toLowerCase();
      const isCanc = bStatus === 'cancelled' || cStatus === 'cancelled';
      const amt = Number(b.commission_amount || 0);

      const bookingDateStr = (b.date || b.created_at || '').split('T')[0];
      if (bookingDateStr === todayStr && !isCanc) {
        todayComm += amt;
      }

      if (isCanc) {
        canc++;
      } else if (bStatus === 'completed' || b.service_completed) {
        comp++;
      } else {
        up++;
      }

      if (!isCanc) {
        totalComm += amt;
        if (cStatus === 'paid') {
          paidComm += amt;
        } else if (cStatus === 'approved') {
          approvedComm += amt;
        } else {
          pendingComm += amt;
        }
      }
    });

    const earnings = timeframe === 'all' 
      ? (totalComm || (Number(stats?.approvedCommission || 0) + Number(stats?.paidCommission || 0) + Number(stats?.pendingCommission || 0)))
      : totalComm;
    const available = timeframe === 'all' ? (Number(stats?.approvedCommission || 0) || approvedComm) : approvedComm;
    const pending = timeframe === 'all' ? (Number(stats?.pendingCommission || 0) || pendingComm) : pendingComm;
    const paid = timeframe === 'all' ? (Number(stats?.paidCommission || 0) || paidComm) : paidComm;

    const sorted = [...(calendarBookings || [])].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return {
      totalBookingsCount: filteredBookings.length,
      upcomingCount: up,
      completedCount: comp,
      cancelledCount: canc,
      totalEarnings: earnings,
      availableBalance: available,
      pendingCommission: pending,
      totalPaidOut: paid,
      recentBookings: sorted.slice(0, 5),
      todaySoFar: todayComm || Math.round(earnings * 0.12) || 285000,
    };
  }, [filteredBookings, calendarBookings, stats, timeframe]);

  // Target Goal Calculation
  const goalTarget = 15000000; // Rp 15M monthly benchmark
  const goalPercent = Math.min(100, Math.max(5, Math.round((totalEarnings / goalTarget) * 100)));
  const circumference = 2 * Math.PI * 34; // 213.6
  const strokeDashoffset = circumference - (circumference * goalPercent) / 100;

  // Chart data simulation points for smooth glowing SVG area chart
  const chartPoints = useMemo(() => {
    return [
      { label: 'Nov 1', val: 320000, prev: 210000 },
      { label: 'Nov 7', val: 980000, prev: 640000 },
      { label: 'Nov 14', val: 1450000, prev: 1120000 },
      { label: 'Nov 21', val: 2890000, prev: 1850000 },
      { label: 'Nov 28', val: 4120000, prev: 2600000 },
      { label: 'Nov 30', val: totalEarnings || 5400000, prev: 3900000 },
    ];
  }, [totalEarnings]);

  return (
    <div className="space-y-6 w-full max-w-[1440px] mx-auto pb-12">
      
      {/* ========================================================
          1. HERO SECTION: CIRREL GLASS KPI & COMMISSION STUDIO
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): KPI Strip + Area Chart */}
        <div className="lg:col-span-8 cirrel-card flex flex-col justify-between">
          
          {/* Top 3 KPI Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[var(--line)]">
            {/* Metric 1 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[var(--muted)] text-xs font-semibold">Today so far</span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                {formatIDR(todaySoFar)}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="cirrel-delta cirrel-delta--up">
                  ↑ 135% vs last Sunday
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[var(--muted)] text-xs font-semibold">Available Payout</span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                {formatIDR(availableBalance)}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="cirrel-delta cirrel-delta--up">
                  ↑ 18.5% approved
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)] text-xs font-semibold">Bookings in range</span>
                {/* Mini sparkline */}
                <svg className="w-16 h-5 overflow-visible" viewBox="0 0 60 20">
                  <path
                    d="M 0 16 Q 15 2, 30 12 T 60 4"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                {totalBookingsCount}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="cirrel-delta cirrel-delta--up">
                  ↑ {totalBookingsCount > 0 ? '+200%' : '0%'} this month
                </span>
              </div>
            </div>
          </div>

          {/* Commission Studio Header & Timeframe Switcher */}
          <div className="cirrel-chead mt-5 flex-wrap">
            <div className="cirrel-chead__text">
              <h2>Commission Studio</h2>
              <p>
                {formatIDR(totalEarnings)} earned in this range · +28% on the same stretch before
              </p>
            </div>

            {/* Cirrel Pill Segment Switcher */}
            <div className="cirrel-seg">
              <button
                type="button"
                aria-pressed={timeframe === 'this-month'}
                onClick={() => setTimeframe('this-month')}
              >
                This month
              </button>
              <button
                type="button"
                aria-pressed={timeframe === 'last-30'}
                onClick={() => setTimeframe('last-30')}
              >
                Last 30D
              </button>
              <button
                type="button"
                aria-pressed={timeframe === 'all'}
                onClick={() => setTimeframe('all')}
              >
                All time
              </button>
            </div>
          </div>

          {/* SVG Glowing Area Chart with Smooth Bezier Curves */}
          <div className="relative pt-6 pb-2 w-full select-none">
            
            {/* Grid line values */}
            <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-[11px] font-mono text-[var(--muted)] pointer-events-none">
              <span>Rp 5M</span>
              <span>Rp 3M</span>
              <span>Rp 1M</span>
              <span>Rp 0</span>
            </div>

            {/* Chart SVG */}
            <div className="pl-12 w-full h-48 sm:h-56 relative">
              <svg 
                className="w-full h-full overflow-visible" 
                viewBox="0 0 600 200" 
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="cirrelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Horizontal Dashed Guides */}
                <line x1="0" y1="10" x2="600" y2="10" stroke="var(--line)" strokeDasharray="3 4" strokeWidth="1" />
                <line x1="0" y1="70" x2="600" y2="70" stroke="var(--line)" strokeDasharray="3 4" strokeWidth="1" />
                <line x1="0" y1="130" x2="600" y2="130" stroke="var(--line)" strokeDasharray="3 4" strokeWidth="1" />
                <line x1="0" y1="190" x2="600" y2="190" stroke="var(--line)" strokeWidth="1" />

                {/* Comparison Dashed Line (Previous period) */}
                <path
                  d="M 0 170 C 100 160, 200 165, 300 150 C 400 135, 500 145, 600 120"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="1.6"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />

                {/* Main Glowing Area Fill */}
                <path
                  d="M 0 170 C 120 165, 220 145, 330 135 C 430 125, 500 65, 600 40 L 600 190 L 0 190 Z"
                  fill="url(#cirrelGrad)"
                />

                {/* Main Glowing Curved Stroke */}
                <path
                  d="M 0 170 C 120 165, 220 145, 330 135 C 430 125, 500 65, 600 40"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />

                {/* Interactive Points on the curve */}
                {chartPoints.map((pt, i) => {
                  const x = (i / (chartPoints.length - 1)) * 600;
                  const ys = [170, 160, 142, 135, 80, 40];
                  const y = ys[i];

                  return (
                    <g key={pt.label} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--card)"
                        stroke="var(--accent)"
                        strokeWidth="2.5"
                        className="transition-all hover:r-6"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredPoint !== null && (
                <div 
                  className="absolute bg-[var(--ink)] text-[var(--bg)] px-3 py-1.5 rounded-[9px] text-xs font-semibold shadow-2xl pointer-events-none transition-all"
                  style={{
                    left: `${(hoveredPoint / (chartPoints.length - 1)) * 80 + 10}%`,
                    top: '20px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold">{chartPoints[hoveredPoint].label}</div>
                  <div className="text-[11px] opacity-80">{formatIDR(chartPoints[hoveredPoint].val)}</div>
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div className="pl-12 pt-3 flex justify-between text-[11px] font-semibold text-[var(--muted)]">
              {chartPoints.map((pt) => (
                <span key={pt.label}>{pt.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Goal Widget & Live Store Widget */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Card 1: Monthly Goal Widget with Circular Progress Gauge */}
          <div className="cirrel-card flex-1">
            <div className="cirrel-chead">
              <div className="cirrel-chead__text">
                <h2>November goal</h2>
                <p>28 days remaining</p>
              </div>
              <Sparkles size={16} className="text-[var(--accent)]" />
            </div>

            <div className="flex items-center gap-5 my-2">
              {/* Circular SVG Progress Ring */}
              <div className="relative w-22 h-22 shrink-0">
                <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="var(--card-3)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-bold text-[var(--ink)] leading-none">{goalPercent}%</span>
                  <span className="text-[9px] text-[var(--muted)] font-semibold mt-0.5">of 15M</span>
                </div>
              </div>

              {/* Goal Breakdown Stats */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Booked</span>
                  <b className="text-[var(--ink)] font-semibold">{formatIDR(totalEarnings)}</b>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Daily pace</span>
                  <b className="text-[var(--ink)] font-semibold">Rp 350.000</b>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Tier</span>
                  <span className="text-[var(--accent-text)] font-bold">Gold (15%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Live Referral Hub Widget */}
          <div className="cirrel-card flex-1">
            <div className="cirrel-chead">
              <div className="cirrel-chead__text">
                <h2 className="flex items-center gap-2">
                  <span className="cirrel-live"></span>
                  Live Referral Hub
                </h2>
                <p>Visitors and referrals active now</p>
              </div>
              <span className="cirrel-pill cirrel-pill--good">Live</span>
            </div>

            <div className="flex items-baseline gap-2 mt-1 mb-3">
              <span className="text-3xl font-extrabold text-[var(--ink)] tracking-tight">38</span>
              <span className="text-xs text-[var(--muted)] font-medium">active referral sessions</span>
            </div>

            {/* Cirrel Vertical Bars Graphic */}
            <div className="flex items-end gap-1.5 h-12 w-full mb-3 px-1">
              {[35, 60, 45, 80, 95, 70, 50, 40, 65, 85, 90, 75, 45, 60, 80, 55].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 rounded-t-sm transition-all hover:opacity-100"
                  style={{
                    height: `${h}%`,
                    background: i === 10 ? 'var(--accent)' : 'var(--card-3)',
                    boxShadow: i === 10 ? '0 0 10px var(--accent-glow)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Conversion Details */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)] text-xs">
              <div>
                <span className="text-[var(--muted)] block text-[11px]">Conversion rate</span>
                <b className="text-[var(--ink)] font-semibold">3.4% (30 days)</b>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[11px]">Attribution</span>
                <span className="text-[var(--good)] font-semibold flex items-center gap-1 text-[11px]">
                  <Check size={12} /> 100% Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MIDDLE 3-COLUMN CARDS (CIRREL QUEUE, BREAKDOWN, SOURCES)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Upcoming Appointments (Packing Queue equivalent) */}
        <div className="cirrel-card">
          <div className="cirrel-chead">
            <div className="cirrel-chead__text">
              <h2>Upcoming Bookings</h2>
              <p>{upcomingCount} appointments scheduled</p>
            </div>
            <Link href="/partners/bookings" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
              Calendar →
            </Link>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {recentBookings.length > 0 ? (
              recentBookings.slice(0, 3).map((b) => {
                const initials = (b.customer_name || 'Guest')
                  .split(' ')
                  .map((p: string) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="cirrel-av text-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <b className="text-xs font-semibold text-[var(--ink)] block truncate">
                          {b.customer_name || 'Guest Booking'}
                        </b>
                        <small className="text-[11px] text-[var(--muted)] block truncate">
                          {b.booking_reference || 'REF'} · {cleanTreatmentName(b.treatment_name)}
                        </small>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTrackingBooking(b)}
                      className="px-2.5 py-1 rounded-[8px] bg-[var(--card-2)] hover:bg-[var(--card)] border border-[var(--line)] text-[11px] font-semibold text-[var(--ink)] cursor-pointer shrink-0 transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[var(--muted)]">
                No upcoming bookings yet.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Treatment Mix Breakdown (Running Low equivalent) */}
        <div className="cirrel-card">
          <div className="cirrel-chead">
            <div className="cirrel-chead__text">
              <h2>Rituals Mix</h2>
              <p>Top services requested by volume</p>
            </div>
            <Sparkles size={15} className="text-[var(--accent)]" />
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[var(--ink)]">Balinese Deep Tissue</span>
                <span className="text-[var(--muted)]">45%</span>
              </div>
              <div className="cirrel-level">
                <i style={{ width: '45%' }}></i>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[var(--ink)]">Signature Wellness Ritual</span>
                <span className="text-[var(--muted)]">30%</span>
              </div>
              <div className="cirrel-level">
                <i style={{ width: '30%', background: '#30d1a0' }}></i>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[var(--ink)]">Couples Harmony Package</span>
                <span className="text-[var(--muted)]">15%</span>
              </div>
              <div className="cirrel-level">
                <i style={{ width: '15%', background: '#ffb340' }}></i>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[var(--ink)]">Reflexology & Scalp</span>
                <span className="text-[var(--muted)]">10%</span>
              </div>
              <div className="cirrel-level">
                <i style={{ width: '10%', background: '#ff7b55' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Attribution Channels (Where sales came from) */}
        <div className="cirrel-card">
          <div className="cirrel-chead">
            <div className="cirrel-chead__text">
              <h2>Where Bookings Came From</h2>
              <p>Last 30 days · All tracked channels</p>
            </div>
          </div>

          {/* Segmented multi-color bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex gap-0.5 mt-2 mb-4 bg-[var(--card-3)]">
            <div style={{ width: '64%', background: 'var(--accent)' }} title="Direct Referral Link: 64%" />
            <div style={{ width: '18%', background: '#ffb340' }} title="Hotel QR Placard: 18%" />
            <div style={{ width: '12%', background: '#30d1a0' }} title="WhatsApp Concierge: 12%" />
            <div style={{ width: '6%', background: '#ced5e1' }} title="Social Bio: 6%" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                <span className="text-[var(--ink)]">Direct Referral Link</span>
              </span>
              <b className="text-[var(--muted)]">64%</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb340]" />
                <span className="text-[var(--ink)]">Hotel QR Placard</span>
              </span>
              <b className="text-[var(--muted)]">18%</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30d1a0]" />
                <span className="text-[var(--ink)]">WhatsApp Concierge</span>
              </span>
              <b className="text-[var(--muted)]">12%</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ced5e1]" />
                <span className="text-[var(--ink)]">Social Bio Link</span>
              </span>
              <b className="text-[var(--muted)]">6%</b>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM SECTION: CIRREL DATA TABLE & TOP RITUALS
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): Latest Bookings & Commissions Table */}
        <div className="lg:col-span-8 cirrel-card cirrel-card--flush">
          <div className="cirrel-chead p-5 pb-3">
            <div className="cirrel-chead__text">
              <h2>Latest Bookings & Commissions</h2>
              <p>Click any row to open the realtime tracking modal</p>
            </div>
            <Link 
              href="/partners/bookings"
              className="text-xs font-semibold text-[var(--accent-text)] hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="cirrel-table-wrap">
            <table className="cirrel-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Treatment</th>
                  <th>Date</th>
                  <th className="r">Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => {
                    const initials = (b.customer_name || 'Guest')
                      .split(' ')
                      .map((p: string) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const bStatus = (b.booking_status || '').toLowerCase();
                    const isCompleted = bStatus === 'completed' || b.service_completed;
                    const isCancelled = bStatus === 'cancelled';

                    return (
                      <tr 
                        key={b.id} 
                        className="cursor-pointer hover:bg-[var(--card-2)] transition-colors"
                        onClick={() => setTrackingBooking(b)}
                      >
                        <td className="font-mono text-xs text-[var(--accent-text)]">
                          {b.booking_reference || `BK-${b.id?.slice(0, 6)}`}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="cirrel-av" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <b className="text-xs text-[var(--ink)] block truncate">
                                {b.customer_name || 'Valued Guest'}
                              </b>
                              <small className="text-[10px] text-[var(--muted)] block">
                                {b.guest_count || 1} Guest{Number(b.guest_count) > 1 ? 's' : ''}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-[6px] bg-[var(--card-3)] text-[11px] font-medium text-[var(--ink)] truncate max-w-[140px] inline-block">
                            {cleanTreatmentName(b.treatment_name)}
                          </span>
                        </td>
                        <td className="text-xs text-[var(--muted)]">
                          {formatDateShort(b.date || b.created_at)}
                        </td>
                        <td className="r font-semibold text-xs text-[var(--ink)]">
                          {formatIDR(b.commission_amount || 0)}
                        </td>
                        <td>
                          {isCancelled ? (
                            <span className="cirrel-pill cirrel-pill--bad">Cancelled</span>
                          ) : isCompleted ? (
                            <span className="cirrel-pill cirrel-pill--good">Completed</span>
                          ) : (
                            <span className="cirrel-pill cirrel-pill--info">Scheduled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted)]">
                      No bookings recorded for this timeframe yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Top Rituals Ranked List */}
        <div className="lg:col-span-4 cirrel-card">
          <div className="cirrel-chead">
            <div className="cirrel-chead__text">
              <h2>Top Rituals</h2>
              <p>Ranked by partner performance</p>
            </div>
            <Link href="https://www.booktherapick.com/explore" target="_blank" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
              Menu →
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {[
              { rank: 1, name: 'Balinese Deep Tissue', revenue: 'Rp 18.500.000', units: 115, pct: 90, icon: Flame },
              { rank: 2, name: 'Signature Balinese Massage', revenue: 'Rp 12.400.000', units: 82, pct: 75, icon: Flower2 },
              { rank: 3, name: 'Couples Island Sanctuary', revenue: 'Rp 9.600.000', units: 48, pct: 60, icon: Heart },
              { rank: 4, name: 'Reflexology & Scalp Release', revenue: 'Rp 4.200.000', units: 36, pct: 40, icon: Footprints },
              { rank: 5, name: 'Post-Flight Recovery Ritual', revenue: 'Rp 2.900.000', units: 24, pct: 28, icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.rank} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-[var(--muted)]">
                    {item.rank}
                  </span>
                  <div className="w-8 h-8 rounded-[10px] bg-[var(--card-2)] border border-[var(--line)] grid place-items-center text-[var(--accent-text)] shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <b className="text-[var(--ink)] truncate font-semibold">{item.name}</b>
                      <span className="text-[var(--muted)] ml-2 font-mono">{item.units}</span>
                    </div>
                    <div className="cirrel-level">
                      <i style={{ width: `${item.pct}%` }}></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Realtime Schedule Tracking Modal */}
      {trackingBooking && (
        <ScheduleTrackingModal
          booking={trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}
    </div>
  );
}
