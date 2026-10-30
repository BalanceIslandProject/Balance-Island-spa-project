'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Copy, 
  Check, 
  AlertCircle,
  RefreshCw,
  Clock,
  Share2,
  QrCode,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  CalendarDays,
  Wallet,
  CheckCircle2,
  ArrowUpRight,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal from '../ScheduleTrackingModal';
import { supabase } from '@/lib/supabase';

interface PartnerStats {
  totalClicks: number;
  totalBookings: number;
  conversionRate: string;
  totalRevenue: number;
  eligibleTreatmentRevenue: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
  availableForPayout: number;
}

interface PartnerProfile {
  id: string;
  partner_code: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  email: string;
  status: string;
  commission_rate_pct: number;
  payout_method: string;
  payout_details: any;
}

export default function PartnerDashboardPage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/affiliates/auth/me'),
        fetch('/api/affiliates/stats'),
      ]);

      const meData = await meRes.json();
      const statsData = await statsRes.json();

      if (meData.success) {
        setProfile(meData.partner);
      }
      if (statsData.success) {
        setStats(statsData.stats);
        setCalendarBookings(statsData.calendarBookings || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Supabase Realtime synchronization
    const realtimeChannel = supabase
      .channel('partner_dashboard_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData();
      })
      .subscribe();

    const pollInterval = setInterval(fetchData, 8000);

    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      supabase.removeChannel(realtimeChannel);
      clearInterval(pollInterval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, []);

  const partnerCode = profile?.partner_code || '';
  const referralLink = `https://www.booktherapick.com/?ref=${partnerCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}`;

  const approvedBalance = stats?.approvedCommission || 0;
  const hasApprovedBalance = approvedBalance > 0;
  const totalEarnings = (stats?.paidCommission || 0) + (stats?.approvedCommission || 0) + (stats?.pendingCommission || 0);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!partnerCode) return;
    navigator.clipboard.writeText(partnerCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Therapick-${partnerCode || 'partner'}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrCodeUrl, '_blank');
    }
  };

  const handleWithdrawWhatsApp = () => {
    if (!hasApprovedBalance) {
      alert('You currently have no approved commission balance ready for withdrawal.');
      return;
    }

    const partnerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Partner';
    const approvedAmt = formatIDR(approvedBalance);
    const payoutMethod = profile?.payout_method?.replace('_', ' ') || 'Bank Transfer';

    const message = `*BOOKTHERAPICK • PARTNER WITHDRAWAL REQUEST*
──────────────────────
Hello BookTherapick Finance, I would like to request disbursement for my approved affiliate commission:

👤 *Partner Name:* ${partnerName}
🏷️ *Partner Code:* ${partnerCode || '-'}
💰 *Approved Amount:* ${approvedAmt}
🏦 *Payout Method:* ${payoutMethod.toUpperCase()}

Please process payment to my registered account details. Thank you!`;

    const waUrl = `https://wa.me/6285174119423?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

  const safeFormatDate = (rawDate: string | undefined | null) => {
    if (!rawDate) return '-';
    try {
      const cleanStr = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
    return String(rawDate);
  };

  // Generate 6-month performance data for SVG Chart & Monthly Summary
  const monthlyChartData = useMemo(() => {
    const monthsMap: Record<string, { label: string; year: number; month: number; earnings: number; bookings: number; paid: number; approved: number; pending: number }> = {};
    
    // Last 6 months timeline
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      monthsMap[key] = {
        label,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        earnings: 0,
        bookings: 0,
        paid: 0,
        approved: 0,
        pending: 0,
      };
    }

    // Populate with real bookings data
    for (const b of calendarBookings) {
      if (!b.date) continue;
      const parts = b.date.split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`;
        const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
        const amt = Number(b.commission_amount || 0);

        if (monthsMap[key]) {
          monthsMap[key].bookings += 1;
          if (!isCancelled) {
            monthsMap[key].earnings += amt;
            if (b.commission_status === 'paid') monthsMap[key].paid += amt;
            else if (b.commission_status === 'approved') monthsMap[key].approved += amt;
            else monthsMap[key].pending += amt;
          }
        }
      }
    }

    return Object.entries(monthsMap).map(([key, data]) => ({ key, ...data }));
  }, [calendarBookings]);

  // Max value for chart scaling
  const maxMonthlyEarnings = useMemo(() => {
    const max = Math.max(...monthlyChartData.map((m) => m.earnings), 1000000);
    return max;
  }, [monthlyChartData]);

  // Recent 6 bookings
  const recentBookings = useMemo(() => {
    return calendarBookings.slice(0, 6);
  }, [calendarBookings]);

  // Recent 4 commission activities
  const recentActivities = useMemo(() => {
    return calendarBookings.slice(0, 5);
  }, [calendarBookings]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 font-sans">
        <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-[#666666] font-mono">Loading affiliate CRM...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans antialiased text-[#171717] pb-16">
      
      {/* ─── Top Header Toolbar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ebebeb]">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
            Affiliate Management CRM
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#171717] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Real-time financial performance, earnings, and attribution tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasApprovedBalance && (
            <button
              type="button"
              onClick={handleWithdrawWhatsApp}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[#171717] text-white hover:bg-black font-mono text-xs uppercase tracking-[0.071em] transition-all cursor-pointer shadow-2xs"
            >
              <Wallet size={12} />
              <span>Withdraw {formatIDR(approvedBalance)}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#ebebeb] bg-white text-xs font-mono text-[#171717] hover:bg-[#fafafa] transition-colors cursor-pointer shadow-2xs"
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Partner Application Notice (If Pending) ─── */}
      {profile?.status === 'pending' && (
        <div className="p-3.5 border border-[#ebebeb] rounded-[8px] bg-white text-xs text-[#171717] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium text-[#171717]">Application Pending Review:</span>
            <span className="text-[#666666]">Your referral links and QR codes are active. Commission attribution is fully recorded.</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-semibold text-[#b06000] bg-[#fef7e0] px-2 py-0.5 rounded-[4px] border border-[#feefc3] shrink-0">
            In Review
          </span>
        </div>
      )}

      {/* ─── 5-KPI Financial Executive Strip (Linear/Stripe-Inspired) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        
        {/* 1. Total Earnings */}
        <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#171717]/30 transition-all">
          <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block font-medium">
            Total Earnings
          </span>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums tracking-tight">
            {formatIDR(totalEarnings)}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            Lifetime commission generated
          </span>
        </div>

        {/* 2. Available Balance */}
        <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#297a3a]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#297a3a] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#297a3a] animate-pulse" />
                Available Balance
              </span>
              <span className="font-mono text-[9px] uppercase font-semibold text-[#137333] bg-[#e6f4ea] px-1.5 py-0.2 rounded border border-[#ceead6]">
                Ready
              </span>
            </div>
            <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums tracking-tight">
              {formatIDR(approvedBalance)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#f3f4f6] flex items-center justify-between text-[11px]">
            <span className="text-[#666666] truncate">Disbursement ready</span>
            <button
              type="button"
              onClick={handleWithdrawWhatsApp}
              disabled={!hasApprovedBalance}
              className={`font-mono text-[10px] font-semibold underline cursor-pointer shrink-0 ml-1 ${
                hasApprovedBalance ? 'text-[#171717] hover:text-black' : 'text-[#8f8f8f] cursor-not-allowed'
              }`}
            >
              Withdraw &rarr;
            </button>
          </div>
        </div>

        {/* 3. Pending Commission */}
        <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#b06000] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Pending
            </span>
            <span className="font-mono text-[9px] uppercase font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.2 rounded border border-[#feefc3]">
              Escrow
            </span>
          </div>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums tracking-tight">
            {formatIDR(stats?.pendingCommission || 0)}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            Awaiting ritual completion
          </span>
        </div>

        {/* 4. Total Paid Out */}
        <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#171717]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#171717] font-bold">
              PAID OUT
            </span>
            <span className="font-mono text-[9px] uppercase font-semibold text-white bg-[#171717] px-1.5 py-0.2 rounded shadow-2xs">
              Disbursed
            </span>
          </div>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums tracking-tight">
            {formatIDR(stats?.paidCommission || 0)}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            Disbursed to bank account
          </span>
        </div>

        {/* 5. Total Bookings */}
        <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#171717]/30 transition-all col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] font-medium">
              Total Bookings
            </span>
            <span className="font-mono text-[9px] font-semibold text-[#171717] bg-[#fafafa] px-1.5 py-0.2 rounded border border-[#ebebeb]">
              {stats?.conversionRate || '0.0'}% Conv
            </span>
          </div>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#171717] mt-1 block tabular-nums tracking-tight">
            {calendarBookings.length}
          </span>
          <span className="text-[11px] text-[#666666] mt-0.5 block truncate">
            {stats?.totalClicks || 0} unique link visitors
          </span>
        </div>

      </div>

      {/* ─── Financial Performance Chart (6-Month Trajectory) ─── */}
      <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#f3f4f6]">
          <div>
            <h2 className="text-sm font-semibold text-[#171717] tracking-tight">
              Monthly Earnings Performance
            </h2>
            <p className="text-[11px] text-[#666666]">
              Commission trajectory and booking distribution across the last 6 months
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#171717]" />
              <span className="text-[#666666]">Commission (IDR)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#297a3a]" />
              <span className="text-[#666666]">Paid Out</span>
            </div>
          </div>
        </div>

        {/* Clean Responsive Bar / Volume Visualizer */}
        <div className="pt-2">
          <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 sm:h-48 border-b border-[#ebebeb] pb-2">
            {monthlyChartData.map((item, idx) => {
              const heightPct = Math.max(Math.round((item.earnings / maxMonthlyEarnings) * 100), item.earnings > 0 ? 12 : 3);
              const isHovered = hoveredMonthIdx === idx;

              return (
                <div
                  key={item.key}
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                  className="flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-[#171717] text-white text-[10px] font-mono py-1 px-2.5 rounded-[4px] shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in duration-100">
                      <div>{item.label} {item.year}: <strong>{formatIDR(item.earnings)}</strong></div>
                      <div className="text-[#a8a8a8]">{item.bookings} booking(s)</div>
                    </div>
                  )}

                  {/* Visual Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[42px] rounded-t-[4px] transition-all duration-200 ${
                      item.earnings > 0
                        ? item.paid > 0
                          ? 'bg-[#171717] group-hover:bg-[#297a3a]'
                          : 'bg-[#525252] group-hover:bg-[#171717]'
                        : 'bg-[#f0f0f0]'
                    }`}
                  />
                  
                  {/* Month Label */}
                  <span className="font-mono text-[11px] text-[#666666] mt-2 group-hover:text-[#171717] font-medium transition-colors">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#8f8f8f] pt-2">
            <span>Volume base: IDR 0</span>
            <span>Peak capacity: {formatIDR(maxMonthlyEarnings)}</span>
          </div>
        </div>
      </div>

      {/* ─── Two-Column CRM Work Surface ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols): Recent Bookings & Monthly Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recent Bookings Activity Card */}
          <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f3f4f6]">
              <div>
                <h2 className="text-sm font-semibold text-[#171717] tracking-tight">
                  Recent Booking Activity
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Latest guest reservations attributed to your partner code
                </p>
              </div>

              <Link
                href="/partners/bookings"
                className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#171717] hover:underline"
              >
                <span>View All ({calendarBookings.length})</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#666666] font-mono">
                No bookings recorded yet. Share your referral link to begin earning.
              </div>
            ) : (
              <>
                {/* Desktop CRM Table (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Invoice</th>
                        <th className="py-2.5 px-3">Guest</th>
                        <th className="py-2.5 px-3">Treatment</th>
                        <th className="py-2.5 px-3 text-right">Earned</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebebeb]">
                      {recentBookings.map((b) => {
                        const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                        const isPaid = b.commission_status === 'paid';
                        const isApproved = b.commission_status === 'approved';

                        return (
                          <tr key={b.id || b.booking_id} className="hover:bg-[#fafafa] transition-colors">
                            <td className="py-3 px-3 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                              {safeFormatDate(b.date)}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs font-bold text-[#171717]">
                              #{b.booking_id}
                            </td>
                            <td className="py-3 px-3 font-medium text-[#171717] truncate max-w-[140px]">
                              {b.guest_name || 'Guest Booking'}
                            </td>
                            <td className="py-3 px-3 text-[#666666] truncate max-w-[140px]">
                              {b.treatment_name || 'Spa Ritual'}
                            </td>
                            <td className="py-3 px-3 font-mono text-right font-bold text-xs whitespace-nowrap">
                              <span className={isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}>
                                {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {isPaid ? (
                                <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-1.5 py-0.5 rounded uppercase">
                                  PAID OUT
                                </span>
                              ) : isApproved ? (
                                <span className="font-mono text-[9px] font-semibold text-[#137333] bg-[#e6f4ea] px-1.5 py-0.5 rounded uppercase border border-[#ceead6]">
                                  Approved
                                </span>
                              ) : isCancelled ? (
                                <span className="font-mono text-[9px] font-semibold text-[#c5221f] bg-[#fce8e6] px-1.5 py-0.5 rounded uppercase border border-[#fad2cf]">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5 rounded uppercase border border-[#feefc3]">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setTrackingBooking(b)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-[#171717] bg-[#fafafa] hover:bg-[#ebebeb] border border-[#ebebeb] rounded transition-colors cursor-pointer"
                              >
                                <Clock size={11} className="text-[#666666]" />
                                <span>Track</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards (< 768px) */}
                <div className="md:hidden divide-y divide-[#ebebeb]">
                  {recentBookings.map((b) => {
                    const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                    const isPaid = b.commission_status === 'paid';

                    return (
                      <div key={b.id || b.booking_id} className="py-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#171717]">
                            #{b.booking_id}
                          </span>
                          <span className="font-mono text-[11px] text-[#666666]">
                            {safeFormatDate(b.date)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#171717] truncate">{b.guest_name || 'Guest'}</span>
                          <span className={`font-mono font-bold ${isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}`}>
                            {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {isPaid ? (
                            <span className="font-mono text-[9px] font-semibold text-white bg-[#171717] px-1.5 py-0.2 rounded uppercase">
                              PAID OUT
                            </span>
                          ) : (
                            <span className="font-mono text-[9px] font-semibold text-[#666666] bg-[#fafafa] px-1.5 py-0.2 rounded uppercase border border-[#ebebeb]">
                              {b.commission_status || 'Pending'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setTrackingBooking(b)}
                            className="font-mono text-[11px] text-[#171717] underline cursor-pointer"
                          >
                            Track Schedule &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Monthly Earnings Breakdown Table */}
          <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f3f4f6]">
              <div>
                <h2 className="text-sm font-semibold text-[#171717] tracking-tight">
                  Monthly Earnings Ledger
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Consolidated financial totals grouped by appointment month
                </p>
              </div>

              <Link
                href="/partners/commissions"
                className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#171717] hover:underline"
              >
                <span>Full Ledger &rarr;</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666]">
                  <tr>
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3">Attributed Bookings</th>
                    <th className="py-2 px-3 text-right">Paid Out</th>
                    <th className="py-2 px-3 text-right">Approved</th>
                    <th className="py-2 px-3 text-right">Pending</th>
                    <th className="py-2 px-3 text-right">Total Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {monthlyChartData.map((item) => (
                    <tr key={item.key} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#171717]">
                        {item.label} {item.year}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#666666]">
                        {item.bookings} {item.bookings === 1 ? 'booking' : 'bookings'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#171717] tabular-nums">
                        {formatIDR(item.paid)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#297a3a] tabular-nums">
                        {formatIDR(item.approved)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#b06000] tabular-nums">
                        {formatIDR(item.pending)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-[#171717] tabular-nums">
                        {formatIDR(item.earnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Referral Link & QR Code Quick Hub */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Official Referral & QR Hub Card */}
          <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f3f4f6]">
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] flex items-center gap-1.5 font-medium">
                <Share2 size={12} />
                Referral & QR Tools
              </span>
              <span className="font-mono text-[10px] text-[#297a3a] bg-[#e6f4ea] px-1.5 py-0.2 rounded border border-[#ceead6]">
                Active Code
              </span>
            </div>

            {/* Partner Code Display */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">
                Partner Code
              </span>
              <div className="flex items-center justify-between mt-1 p-2 rounded-[6px] bg-[#fafafa] border border-[#ebebeb]">
                <span className="font-mono text-xs font-bold text-[#171717]">
                  {partnerCode || 'PENDING'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-mono text-[#666666] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
                  title="Copy partner code"
                >
                  {copiedCode ? <Check size={12} className="text-[#297a3a]" /> : <Copy size={12} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Referral URL with 1-Click Copy */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">
                Direct Booking URL
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full text-xs font-mono py-1.5 px-2.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-[#171717] select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-8 px-3 rounded-[6px] bg-[#171717] text-white hover:bg-black font-mono text-xs uppercase tracking-[0.071em] shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Copy full referral URL"
                >
                  {copiedLink ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="pt-2 border-t border-[#f3f4f6] text-center space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block text-left">
                Official Partner QR Code
              </span>
              
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-[8px] border border-[#ebebeb] shadow-xs flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt={`QR code for ${partnerCode}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-[11px] text-[#666666] leading-relaxed">
                Display at your villa, hotel reception, or desk. When guests scan to book, your commission is attributed automatically.
              </p>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full h-8 px-3 rounded-[6px] border border-[#ebebeb] bg-white hover:bg-[#fafafa] font-mono text-xs text-[#171717] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download size={12} />
                <span>Download QR Code (PNG)</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#f3f4f6]">
              <Link
                href="/partners/referrals"
                className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-mono text-[#171717] hover:underline"
              >
                <span>Open Full Referral & QR Hub</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          {/* Quick Support & Help Card */}
          <div className="bg-white border border-[#ebebeb] rounded-[8px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block font-medium">
              Affiliate Support
            </span>
            <p className="text-xs text-[#666666] leading-relaxed">
              Have questions about an attribution, custom hotel materials, or payout scheduling? Contact our concierge team directly.
            </p>
            <a
              href="https://wa.me/6285174119423"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#297a3a] hover:underline pt-1"
            >
              <span>Chat on WhatsApp (+62 851-7411-9423)</span>
              <ExternalLink size={11} />
            </a>
          </div>

        </div>

      </div>

      {/* ─── Schedule Tracking History Modal ─── */}
      <ScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

    </div>
  );
}
