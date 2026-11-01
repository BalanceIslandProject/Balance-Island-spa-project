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
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ScheduleTrackingModal, { cleanTreatmentName } from '../ScheduleTrackingModal';

export default function PartnerOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'this-month' | 'last-30' | 'all'>('this-month');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<any | null>(null);

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

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('partner_overview_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
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
    recentCommissions
  } = useMemo(() => {
    let up = 0;
    let comp = 0;
    let canc = 0;
    let totalComm = 0;
    let pendingComm = 0;
    let approvedComm = 0;
    let paidComm = 0;

    filteredBookings.forEach((b) => {
      const bStatus = (b.booking_status || '').toLowerCase();
      const cStatus = (b.commission_status || '').toLowerCase();
      const isCanc = bStatus === 'cancelled' || cStatus === 'cancelled';
      const amt = Number(b.commission_amount || 0);

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

    // Latest 4 bookings across the partner account
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
      recentBookings: sorted.slice(0, 4),
      recentCommissions: sorted.filter((b) => b.commission_amount > 0).slice(0, 4),
    };
  }, [filteredBookings, calendarBookings, stats, timeframe]);

  // Dynamic tick dates for performance chart
  const chartTicks = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const step = Math.max(1, Math.floor(lastDay / 4));
    return [
      `${month} 1`,
      `${month} ${Math.min(lastDay, 1 + step)}`,
      `${month} ${Math.min(lastDay, 1 + step * 2)}`,
      `${month} ${Math.min(lastDay, 1 + step * 3)}`,
      `${month} ${lastDay}`,
    ];
  }, []);

  const handleCopyLink = () => {
    if (!partner?.partner_code) return;
    const link = `https://www.booktherapick.com/?ref=${partner.partner_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 w-full font-sans max-w-[1400px] mx-auto pb-8">
      
      {/* ========================================================
          1. PAGE HEADER (MATCHING MOCKUP)
         ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#0F172A] tracking-tight leading-tight">
            Overview
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Your performance at a glance.
          </p>
        </div>

        {/* Date Selector Dropdown Button */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
          >
            <Calendar size={14} className="text-[#64748B]" />
            <span>{currentDateLabel}</span>
            <ChevronDown size={14} className="text-[#94A3B8]" />
          </button>

          {showTimeframeDropdown && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => { setTimeframe('this-month'); setShowTimeframeDropdown(false); }}
                className={`w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] transition-colors ${timeframe === 'this-month' ? 'text-[#0E2319] font-semibold bg-[#F1F5F9]' : 'text-[#475569]'}`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => { setTimeframe('last-30'); setShowTimeframeDropdown(false); }}
                className={`w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] transition-colors ${timeframe === 'last-30' ? 'text-[#0E2319] font-semibold bg-[#F1F5F9]' : 'text-[#475569]'}`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => { setTimeframe('all'); setShowTimeframeDropdown(false); }}
                className={`w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] transition-colors ${timeframe === 'all' ? 'text-[#0E2319] font-semibold bg-[#F1F5F9]' : 'text-[#475569]'}`}
              >
                All Time
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. FINANCIAL SUMMARY CARDS (4 COMPACT METRICS)
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL EARNINGS */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="text-[13px] font-medium text-[#64748B]">
            Total Earnings
          </div>
          <div className="flex items-baseline gap-2.5">
            <div className="text-[24px] sm:text-[26px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
              {formatIDR(totalEarnings)}
            </div>
            <span className="inline-flex items-center text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded-[4px]">
              +16%
            </span>
          </div>
          <div className="text-[12px] text-[#94A3B8]">
            {totalBookingsCount} referred bookings
          </div>
        </div>

        {/* CARD 2: AVAILABLE BALANCE */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="text-[13px] font-medium text-[#64748B]">
            Available Balance
          </div>
          <div className="text-[24px] sm:text-[26px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(availableBalance)}
          </div>
          <div className="text-[12px] text-[#059669] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Ready for withdrawal
          </div>
        </div>

        {/* CARD 3: PENDING */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="text-[13px] font-medium text-[#64748B]">
            Pending
          </div>
          <div className="text-[24px] sm:text-[26px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(pendingCommission)}
          </div>
          <div className="text-[12px] text-[#D97706] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Awaiting completion
          </div>
        </div>

        {/* CARD 4: PAID OUT */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="text-[13px] font-medium text-[#64748B]">
            Paid Out
          </div>
          <div className="text-[24px] sm:text-[26px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(totalPaidOut)}
          </div>
          <div className="text-[12px] text-[#64748B]">
            Disbursed to bank
          </div>
        </div>

      </div>

      {/* ========================================================
          3. BOOKING PERFORMANCE (ANALYTICS & LINE CHART)
         ======================================================== */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
        
        {/* Header & Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0F172A] tracking-tight">
              Booking Performance
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] text-xs font-medium text-[#475569]">
            <span>{timeframe === 'this-month' ? 'This Month' : timeframe === 'last-30' ? 'Last 30 Days' : 'All Time'}</span>
          </div>
        </div>

        {/* Big Metric + Chart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Metric: Total Bookings */}
          <div className="lg:col-span-3 space-y-1">
            <div className="text-[32px] sm:text-[38px] font-bold text-[#0F172A] tracking-tight tabular-nums leading-none">
              {totalBookingsCount}
            </div>
            <div className="text-[13px] text-[#64748B] font-medium">
              Total Bookings
            </div>
          </div>

          {/* Center Chart */}
          <div className="lg:col-span-6 h-32 w-full flex flex-col justify-end">
            <svg viewBox="0 0 400 100" className="w-full h-24 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill Area */}
              <path
                d="M 0 80 Q 50 65, 100 70 T 200 45 T 300 35 T 400 20 L 400 100 L 0 100 Z"
                fill="url(#chartGradient)"
              />
              {/* Curve Stroke */}
              <path
                d="M 0 80 Q 50 65, 100 70 T 200 45 T 300 35 T 400 20"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              <circle cx="0" cy="80" r="3" fill="#10B981" />
              <circle cx="100" cy="70" r="3" fill="#10B981" />
              <circle cx="200" cy="45" r="3" fill="#10B981" />
              <circle cx="300" cy="35" r="3" fill="#10B981" />
              <circle cx="400" cy="20" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* Date axis ticks */}
            <div className="flex justify-between text-[11px] text-[#94A3B8] font-mono pt-2 border-t border-[#F1F5F9]">
              {chartTicks.map((tick, idx) => (
                <span key={idx}>{tick}</span>
              ))}
            </div>
          </div>

          {/* Right Status Breakdown */}
          <div className="lg:col-span-3 grid grid-cols-3 sm:flex sm:justify-around lg:flex-col lg:justify-center gap-2 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#F1F5F9] lg:pl-6 text-xs">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-3 p-2 sm:p-0 rounded-[6px] bg-[#F8FAFC] sm:bg-transparent text-center sm:text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                <span className="text-[#64748B] text-[11px] sm:text-xs">Upcoming</span>
              </div>
              <span className="font-semibold text-[#0F172A] tabular-nums text-xs">{upcomingCount}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-3 p-2 sm:p-0 rounded-[6px] bg-[#F8FAFC] sm:bg-transparent text-center sm:text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#0E2319] shrink-0" />
                <span className="text-[#64748B] text-[11px] sm:text-xs">Completed</span>
              </div>
              <span className="font-semibold text-[#0F172A] tabular-nums text-xs">{completedCount}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-3 p-2 sm:p-0 rounded-[6px] bg-[#F8FAFC] sm:bg-transparent text-center sm:text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                <span className="text-[#64748B] text-[11px] sm:text-xs">Cancelled</span>
              </div>
              <span className="font-semibold text-[#0F172A] tabular-nums text-xs">{cancelledCount}</span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================
          4. RECENT ACTIVITY (TWO-COLUMN LIST)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT BOOKINGS */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">
              Recent Bookings
            </h3>
            <Link
              href="/partners/bookings"
              className="text-[12px] font-semibold text-[#0E2319] hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {recentBookings.length > 0 ? (
              recentBookings.map((b, idx) => {
                const dateStr = formatDateShort(b.date || b.created_at);
                const title = cleanTreatmentName(b.treatment_name);
                const isCompleted = b.booking_status === 'Completed' || b.service_completed;
                const isCancelled = b.booking_status === 'Cancelled' || b.commission_status === 'cancelled';

                return (
                  <div 
                    key={b.id || idx} 
                    onClick={() => setTrackingBooking(b)}
                    className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1 text-xs cursor-pointer hover:bg-[#F8FAFC] -mx-2 px-2 rounded-[6px] transition-colors"
                    title="Click to view booking tracking"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[#64748B] font-mono shrink-0 w-12 text-[11px]">
                        {dateStr}
                      </span>
                      <span className="font-medium text-[#0F172A] truncate">
                        {title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-semibold text-[#0F172A] tabular-nums">
                        {isCancelled ? (
                          <span className="text-[#94A3B8] line-through font-normal">Rp0</span>
                        ) : (
                          `+${formatIDR(b.commission_amount)}`
                        )}
                      </span>
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${
                        isCompleted
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : isCancelled
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : 'bg-[#EFF6FF] text-[#2563EB]'
                      }`}>
                        {b.booking_status || 'Upcoming'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                No recent bookings recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* RECENT COMMISSIONS */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">
              Recent Commissions
            </h3>
            <Link
              href="/partners/commissions"
              className="text-[12px] font-semibold text-[#0E2319] hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {recentCommissions.length > 0 ? (
              recentCommissions.map((c, idx) => {
                const ref = c.booking_id ? `#${c.booking_id}` : `#${c.id?.slice(0, 6)}`;
                const isPaid = c.commission_status === 'paid';
                const isApproved = c.commission_status === 'approved';
                const isCancelled = c.commission_status === 'cancelled' || c.booking_status === 'Cancelled';
                const title = cleanTreatmentName(c.treatment_name);

                return (
                  <div 
                    key={c.id || idx} 
                    onClick={() => setTrackingBooking(c)}
                    className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1 text-xs cursor-pointer hover:bg-[#F8FAFC] -mx-2 px-2 rounded-[6px] transition-colors"
                    title="Click to view commission tracking"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-semibold text-[#0F172A] shrink-0 text-xs">
                        {ref}
                      </span>
                      <span className="text-[#64748B] truncate text-xs">
                        {title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-semibold text-[#0F172A] tabular-nums">
                        {isCancelled ? (
                          <span className="text-[#94A3B8] line-through font-normal">Rp0</span>
                        ) : (
                          `+${formatIDR(c.commission_amount)}`
                        )}
                      </span>
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium capitalize ${
                        isCancelled
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : isPaid
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : isApproved
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : 'bg-[#FFFBEB] text-[#D97706]'
                      }`}>
                        {isCancelled ? 'Cancelled' : c.commission_status || 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                No recent commissions recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================
          5. QUICK ACTIONS FOOTER BAR
         ======================================================== */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0E2319]/10 text-[#0E2319] flex items-center justify-center shrink-0">
            <Share2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#0F172A] truncate">
              Referral Link: {partner?.partner_code ? `ref=${partner.partner_code}` : 'Live'}
            </div>
            <div className="text-[11px] text-[#64748B] truncate sm:whitespace-normal">
              Share your custom link with villa guests and hotel guests.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-[6px] text-xs font-medium text-[#0F172A] transition-colors cursor-pointer"
          >
            {copiedLink ? <Check size={13} className="text-[#059669]" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>

          <Link
            href="/partners/payouts"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0E2319] hover:bg-[#163625] text-white rounded-[6px] text-xs font-medium transition-colors"
          >
            <Wallet size={13} />
            <span>Request Payout</span>
          </Link>
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingBooking && (
        <ScheduleTrackingModal
          booking={trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}

    </div>
  );
}
