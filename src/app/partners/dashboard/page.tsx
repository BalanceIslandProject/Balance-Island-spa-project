'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  RefreshCw, 
  ShieldCheck, 
  ChevronDown,
  Zap,
  Activity,
  Calendar
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

      {/* 2. MAIN KPIS & EARNINGS PERFORMANCE CHART (FULL WIDTH) */}
      <div className="w-full space-y-5">
        
        {/* 3 Horizontal KPI Cards with Colorful Tints & Bold Typography */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Total Bookings */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/30 border border-blue-200/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-blue-900 font-bold">Total Bookings</span>
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/20">
                <CalendarDays size={15} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-mono tabular-nums tracking-tight">
              {stats?.totalBookings ?? calendarBookings.length}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-blue-100/70">
              <span className="inline-flex items-center font-mono text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                +71% vs last week
              </span>
              <Sparkline color="green" trend="up" />
            </div>
          </div>

          {/* Card 2: Total Commission */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 border border-indigo-200/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-indigo-900 font-bold">Total Commission</span>
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/20">
                <Zap size={15} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 font-mono tabular-nums tracking-tight">
              {formatIDR((stats?.approvedCommission || 0) + (stats?.paidCommission || 0) + (stats?.pendingCommission || 0))}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-indigo-100/70">
              <span className="inline-flex items-center font-mono text-xs font-bold text-indigo-800 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-md">
                +2% vs last week
              </span>
              <Sparkline color="teal" trend="up" />
            </div>
          </div>

          {/* Card 3: Approved Commission */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 border border-emerald-200/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-900 font-bold">Approved Commission</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20">
                <ShieldCheck size={15} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-mono tabular-nums tracking-tight">
              {formatIDR(stats?.availableForPayout || 0)}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-emerald-100/70">
              <span className="inline-flex items-center font-mono text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                92% Cleared
              </span>
              <Sparkline color="green" trend="up" />
            </div>
          </div>

        </div>

        {/* Volume Trend Chart (Full Width) with Vibrant Colors & Bold Styling */}
        <div className="bg-white border border-[#eaecf0] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Activity size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Earnings Performance</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar size={13} className="text-slate-500" />
              <span>Last 7 Days</span>
            </div>
          </div>

          {/* Big Chart Stat Metric */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
              {formatIDR((stats?.approvedCommission || 0) + (stats?.paidCommission || 0))}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
              +8% vs last week
            </span>
          </div>

          {/* Bar Chart Canvas with Baseline and Y-Axis */}
          <div className="relative pt-6 pb-2">
            {/* Dashed Horizontal Target Guideline */}
            <div className="absolute top-14 inset-x-0 border-b border-dashed border-slate-200 z-0" />

            {/* Y-Axis Reference Labels (Right) */}
            <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono font-semibold text-slate-400 pointer-events-none text-right">
              <span>800</span>
              <span>600</span>
              <span>400</span>
              <span>200</span>
              <span>0</span>
            </div>

            {/* Bars Grid */}
            <div className="grid grid-cols-7 gap-3 sm:gap-6 h-56 items-end pr-10 z-10 relative">
              {chartDays.map((d, index) => {
                const isHighlighted = activeBarIndex === index;
                return (
                  <div 
                    key={d.label} 
                    className="flex flex-col items-center h-full justify-end group cursor-pointer"
                    onClick={() => setActiveBarIndex(index)}
                  >
                    {/* Tooltip Pill above active bar */}
                    {isHighlighted && (
                      <div className="mb-2 bg-indigo-600 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap animate-in fade-in-50">
                        {d.label} : {d.value}
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[52px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: d.height }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isHighlighted 
                            ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-md' 
                            : 'bg-slate-200 group-hover:bg-indigo-300'
                        }`}
                      />
                    </div>

                    {/* Day Label */}
                    <span className={`text-xs font-bold mt-2.5 transition-colors ${
                      isHighlighted ? 'text-indigo-700 font-extrabold' : 'text-slate-500'
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

    </div>
  );
}
