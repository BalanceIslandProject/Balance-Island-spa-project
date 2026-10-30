'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  Receipt, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  RefreshCw, 
  ArrowUpRight, 
  MessageCircle, 
  MapPin, 
  DoorClosed, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  MoreVertical,
  Zap,
  Activity,
  Calendar,
  Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Sparkline SVG Component (Exact replica of the green/teal sparklines in Kravio KPI cards)
function Sparkline({ color = 'green', trend = 'up' }: { color?: 'green' | 'teal' | 'red'; trend?: 'up' | 'down' }) {
  const strokeColor = color === 'green' ? '#16a34a' : color === 'teal' ? '#0d9488' : '#ef4444';
  const fillGradientId = `sparkline-grad-${color}-${trend}`;

  const pathD = trend === 'up'
    ? 'M 0 30 Q 15 28, 25 18 T 50 22 T 75 10 T 100 5'
    : 'M 0 10 Q 20 12, 35 22 T 60 18 T 80 28 T 100 32';

  const areaD = trend === 'up'
    ? `${pathD} L 100 38 L 0 38 Z`
    : `${pathD} L 100 38 L 0 38 Z`;

  return (
    <svg viewBox="0 0 100 38" className="w-20 h-9 shrink-0 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PartnerDashboardPage() {
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState('This Month');
  const [activityFilter, setActivityFilter] = useState<'today' | 'yesterday' | 'week'>('today');
  const [activitySearch, setActivitySearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [activeBarIndex, setActiveBarIndex] = useState<number>(3); // Default highlighted bar

  // Load live partner stats and session
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
      if (meRes.success) {
        setPartner(meRes.partner || null);
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Real-Time Sync
    const channel = supabase
      .channel('partner_dashboard_kravio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadData())
      .subscribe();

    const interval = setInterval(loadData, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Activity Feed Data (Adapted from Kravio Latest Updates)
  const activities = useMemo(() => {
    const list = [
      {
        id: 'act-1',
        title: 'Booking Confirmed',
        subtitle: 'Booking #BK-2491 • Royal Balinese Massage',
        time: '11:20 AM',
        period: 'today',
        iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
        dotColor: 'bg-blue-500',
      },
      {
        id: 'act-2',
        title: 'New Guest Attributed',
        subtitle: 'Sarah Jenkins registered via your referral link',
        time: '11:15 AM',
        period: 'today',
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        dotColor: 'bg-emerald-500',
      },
      {
        id: 'act-3',
        title: 'Treatment In Progress',
        subtitle: 'Therapist on-site at Villa Mandala • 2 Guests',
        time: '11:00 AM',
        period: 'today',
        iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
        dotColor: 'bg-purple-500',
      },
      {
        id: 'act-4',
        title: 'Commission Approved',
        subtitle: 'IDR 350,000 cleared for withdrawal',
        time: '10:45 AM',
        period: 'today',
        iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
        dotColor: 'bg-amber-500',
      },
      {
        id: 'act-5',
        title: 'Disbursement Settled',
        subtitle: 'Bank Transfer BCA verified & sent',
        time: 'Yesterday',
        period: 'yesterday',
        iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
        dotColor: 'bg-teal-500',
      },
      {
        id: 'act-6',
        title: '5-Star Guest Feedback',
        subtitle: '"Outstanding massage in Ubud! Will book again."',
        time: '3 days ago',
        period: 'week',
        iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        dotColor: 'bg-yellow-500',
      },
    ];

    return list.filter((act) => {
      if (activityFilter === 'today' && act.period !== 'today') return false;
      if (activityFilter === 'yesterday' && act.period !== 'yesterday') return false;
      if (activityFilter === 'week' && act.period === 'older') return false;
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        return act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activityFilter, activitySearch]);

  // Kravio Bar Chart Data (Daily / Monthly Volume Trend)
  const chartDays = [
    { label: 'Sun', value: 340, height: '42%' },
    { label: 'Mon', value: 490, height: '61%' },
    { label: 'Tue', value: 584, height: '73%' }, // Active bar in Kravio reference
    { label: 'Wed', value: 410, height: '51%' },
    { label: 'Thu', value: 650, height: '81%' },
    { label: 'Fri', value: 720, height: '90%' },
    { label: 'Sat', value: 460, height: '57%' },
  ];

  // Filtered Bookings for Bottom Table
  const filteredBookings = useMemo(() => {
    if (!tableSearch.trim()) return calendarBookings;
    const q = tableSearch.toLowerCase();
    return calendarBookings.filter((b) => {
      const id = String(b.booking_id || '').toLowerCase();
      const guest = String(b.guest_name || '').toLowerCase();
      const treatment = String(b.treatment_name || '').toLowerCase();
      const location = String(b.location || '').toLowerCase();
      return id.includes(q) || guest.includes(q) || treatment.includes(q) || location.includes(q);
    });
  }, [calendarBookings, tableSearch]);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      
      {/* 1. KRAVIO GREETING & TIMEFRAME HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <span>Hello, {partner?.first_name || 'Partner'}</span>
            <span className="text-lg">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Here are the latest insights from your customer interactions.
          </p>
        </div>

        {/* Timeframe Dropdown & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white border border-[#e5e7eb] text-xs font-medium text-[#374151] hover:bg-[#f9fafb] shadow-xs cursor-pointer"
            >
              <Calendar size={13} className="text-[#6b7280]" />
              <span>{activeTimeframe}</span>
              <ChevronDown size={13} className="text-[#9ca3af]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            disabled={loading}
            className="p-1.5 rounded-[8px] bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] shadow-xs cursor-pointer transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. KRAVIO MAIN GRID: TOP KPIS + CHARTS (LEFT) & LATEST UPDATES (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: 3 Top KPI Cards + Volume Trend Chart (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* 3 Horizontal KPI Cards (Exact replica of Kravio: Current Tickets, Daily Avg Resolution, SLA Compliance) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Total Bookings (Current Tickets) */}
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6b7280]">Total Bookings</span>
                <CalendarDays size={14} className="text-[#9ca3af]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827] font-mono tabular-nums tracking-tight">
                {stats?.totalBookings ?? calendarBookings.length}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
                  +71% vs last week
                </span>
                <Sparkline color="green" trend="up" />
              </div>
            </div>

            {/* Card 2: Total Commission (Daily Avg. Resolution) */}
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6b7280]">Total Commission</span>
                <Zap size={14} className="text-[#9ca3af]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827] font-mono tabular-nums tracking-tight">
                {formatIDR((stats?.approvedCommission || 0) + (stats?.paidCommission || 0) + (stats?.pendingCommission || 0))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
                  +2% vs last week
                </span>
                <Sparkline color="teal" trend="up" />
              </div>
            </div>

            {/* Card 3: Approved Commission (SLA Compliance Rate) */}
            <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6b7280]">Approved Commission</span>
                <ShieldCheck size={14} className="text-[#9ca3af]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#111827] font-mono tabular-nums tracking-tight">
                {formatIDR(stats?.availableForPayout || 0)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
                  92% Cleared
                </span>
                <Sparkline color="green" trend="up" />
              </div>
            </div>

          </div>

          {/* Ticket Volume Trend Chart (Exact replica of Kravio bar chart) */}
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#9ca3af]" />
                <h3 className="text-sm font-semibold text-[#111827]">Earnings Performance</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                <Calendar size={12} className="text-[#9ca3af]" />
                <span>Last 7 Days</span>
                <ChevronDown size={12} className="text-[#9ca3af]" />
              </div>
            </div>

            {/* Big Chart Stat Metric */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#111827] font-mono tabular-nums">
                {formatIDR((stats?.approvedCommission || 0) + (stats?.paidCommission || 0))}
              </span>
              <span className="font-mono text-xs font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
                +8% vs last week
              </span>
            </div>

            {/* Bar Chart Canvas with Baseline and Y-Axis */}
            <div className="relative pt-6 pb-2">
              {/* Dashed Horizontal Target Guideline */}
              <div className="absolute top-14 inset-x-0 border-b border-dashed border-[#d1d5db] z-0" />

              {/* Y-Axis Reference Labels (Right) */}
              <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono text-[#9ca3af] pointer-events-none text-right">
                <span>800</span>
                <span>600</span>
                <span>400</span>
                <span>200</span>
                <span>0</span>
              </div>

              {/* Bars Grid */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end pr-10 z-10 relative">
                {chartDays.map((d, index) => {
                  const isHighlighted = activeBarIndex === index;
                  return (
                    <div 
                      key={d.label} 
                      className="flex flex-col items-center h-full justify-end group cursor-pointer"
                      onClick={() => setActiveBarIndex(index)}
                    >
                      {/* Kravio Dark Tooltip Pill above active bar */}
                      {isHighlighted && (
                        <div className="mb-2 bg-[#111827] text-white text-[10px] font-mono px-2 py-0.5 rounded-[4px] shadow-md whitespace-nowrap animate-in fade-in-50">
                          {d.label} : {d.value}
                        </div>
                      )}

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[42px] bg-[#f3f4f6] rounded-t-[6px] h-full flex items-end overflow-hidden">
                        <div
                          style={{ height: d.height }}
                          className={`w-full rounded-t-[6px] transition-all duration-300 ${
                            isHighlighted 
                              ? 'bg-[#111827]' 
                              : 'bg-[#e5e7eb] group-hover:bg-[#d1d5db]'
                          }`}
                        />
                      </div>

                      {/* Day Label */}
                      <span className={`text-[11px] font-medium mt-2 transition-colors ${
                        isHighlighted ? 'text-[#111827] font-semibold' : 'text-[#6b7280]'
                      }`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Latest Updates / Activity Feed (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 space-y-4 shadow-xs h-full flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#111827]">Latest Updates</h3>
                <Activity size={15} className="text-[#9ca3af]" />
              </div>

              {/* Filter Tabs: Today, Yesterday, This week (Exact replica of Kravio) */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-[8px] bg-[#f3f4f6] text-xs">
                <button
                  type="button"
                  onClick={() => setActivityFilter('today')}
                  className={`py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    activityFilter === 'today'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('yesterday')}
                  className={`py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    activityFilter === 'yesterday'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('week')}
                  className={`py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    activityFilter === 'week'
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  This week
                </button>
              </div>

              {/* Search Activities Input */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search activities"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111827]"
                />
              </div>

              {/* Activity Counter Header */}
              <div className="text-xs font-semibold text-[#111827] pt-1">
                {activities.length} new activities {activityFilter}
              </div>

              {/* Activity Items List */}
              <div className="divide-y divide-[#f3f4f6] space-y-3 pt-1">
                {activities.map((act) => (
                  <div key={act.id} className="pt-3 first:pt-0 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 border ${act.iconBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${act.dotColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-[#111827] truncate">{act.title}</span>
                        <span className="text-[10px] text-[#9ca3af] font-mono shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-[#6b7280] truncate mt-0.5">{act.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Quick Link Card at Bottom of Activity Panel */}
            <div className="mt-4 pt-3 border-t border-[#e5e7eb]">
              <Link
                href="/partners/referrals"
                className="w-full flex items-center justify-between p-2.5 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] hover:bg-[#f3f4f6] text-xs font-medium text-[#111827] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <QrCode size={14} className="text-[#6b7280]" />
                  <span>Open Partner QR Hub</span>
                </div>
                <ArrowUpRight size={13} className="text-[#9ca3af]" />
              </Link>
            </div>

          </div>
        </div>

      </div>

      {/* 3. KRAVIO BOTTOM DATA TABLE: RECENT BOOKINGS (Exact replica of SLA Monitoring) */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] overflow-hidden shadow-xs">
        
        {/* Table Toolbar Header (Matches SLA Monitoring bar) */}
        <div className="p-4 sm:p-5 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#9ca3af]" />
            <h3 className="text-sm font-semibold text-[#111827]">Recent Bookings</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <input
                type="text"
                placeholder="Search booking ID or guest..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111827]"
              />
            </div>

            {/* Filter Button */}
            <Link
              href="/partners/bookings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border border-[#e5e7eb] text-xs font-medium text-[#374151] hover:bg-[#f9fafb] shadow-xs cursor-pointer"
            >
              <Filter size={12} className="text-[#6b7280]" />
              <span>Filter</span>
            </Link>

            <button
              type="button"
              className="p-1.5 text-[#9ca3af] hover:text-[#111827] rounded-[6px] border border-[#e5e7eb]"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-medium text-[#6b7280]">
              <tr>
                <th className="py-3 px-4 w-8">
                  <input type="checkbox" className="rounded-[4px] border-[#d1d5db]" readOnly />
                </th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Guest & Ritual</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#6b7280]">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.slice(0, 7).map((item, idx) => {
                  const isCompleted = item.booking_status === 'Completed' || item.service_completed;
                  const isOngoing = item.booking_status === 'Ongoing';
                  const isCancelled = item.booking_status === 'Cancelled';

                  return (
                    <tr key={item.id || idx} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-3.5 px-4">
                        <input type="checkbox" defaultChecked={idx === 0} className="rounded-[4px] border-[#d1d5db]" />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#111827] whitespace-nowrap">
                        <Link href={`/invoice/${item.booking_id}`} target="_blank" className="hover:underline">
                          #{item.booking_id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#111827]">{item.guest_name}</div>
                        <div className="text-[11px] text-[#6b7280] truncate max-w-[180px]">{item.treatment_name || 'Spa Ritual'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#6b7280] whitespace-nowrap">
                        {item.location || 'Villa Ubud'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="font-mono text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-[4px]">
                            Cancelled
                          </span>
                        ) : isCompleted ? (
                          <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Finish
                          </span>
                        ) : isOngoing ? (
                          <span className="font-mono text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Ongoing
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[4px]">
                            In Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#6b7280] whitespace-nowrap">
                        {item.date || new Date(item.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#16a34a] whitespace-nowrap">
                        +{formatIDR(item.commission_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="text-[#111827] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} className="text-[#9ca3af]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
