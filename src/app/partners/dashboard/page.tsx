'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Copy, 
  Check, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Download,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import FloatingBookingCalendar, { CalendarBooking } from '../FloatingBookingCalendar';
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

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function PartnerDashboardPage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Desktop Calendar State
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => toLocalDateString(new Date()));

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();

    // 1. Supabase Realtime Subscription: auto-update when admin confirms, cancels, or changes booking/commission
    const realtimeChannel = supabase
      .channel('partner_dashboard_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'affiliate_commissions' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // 2. Polling fallback every 8 seconds for rock-solid reliability across mobile browsers
    const pollInterval = setInterval(() => {
      fetchData();
    }, 8000);

    // 3. Revalidate on window focus / tab visibility
    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    // Listen for custom open-calendar events from mobile bottom nav
    const handleOpenCal = () => setCalendarOpen(true);
    window.addEventListener('open-booking-calendar', handleOpenCal);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openCalendar') === 'true') {
        setCalendarOpen(true);
      }
    }

    return () => {
      supabase.removeChannel(realtimeChannel);
      clearInterval(pollInterval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('open-booking-calendar', handleOpenCal);
    };
  }, []);

  const partnerCode = profile?.partner_code || '';
  const referralLink = `https://www.booktherapick.com/?ref=${partnerCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}`;

  // NO MINIMUM WITHDRAWAL: partners can withdraw any approved balance > 0
  const approvedBalance = stats?.approvedCommission || 0;
  const hasApprovedBalance = approvedBalance > 0;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyBooking = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedBookingId(id);
    setTimeout(() => setCopiedBookingId(null), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `BookTherapick-${partnerCode || 'partner'}-QR.png`;
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
Hello BookTherapick Admin, I would like to request a withdrawal for my approved affiliate commission:

👤 *Partner Name:* ${partnerName}
🏷️ *Partner Code:* ${partnerCode || '-'}
💰 *Approved Commission:* ${approvedAmt}
🏦 *Payout Method:* ${payoutMethod.toUpperCase()}

Please verify and process the payout to my registered details. Thank you!`;

    const waUrl = `https://wa.me/6285174119423?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

  const safeFormatDate = (rawDate: string | undefined | null, options?: Intl.DateTimeFormatOptions) => {
    if (!rawDate) return '';
    try {
      const cleanStr = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const d = new Date(year, month, day);
          return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' });
        }
      }
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' });
      }
    } catch {
      // safe fallback
    }
    return String(rawDate);
  };

  // Calendar Computations
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();

  const handlePrevCalMonth = () => setCalendarMonth(new Date(calYear, calMonth - 1, 1));
  const handleNextCalMonth = () => setCalendarMonth(new Date(calYear, calMonth + 1, 1));
  const handleCalToday = () => {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(toLocalDateString(today));
  };

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    calendarBookings.forEach(b => {
      if (b.date) {
        const dStr = String(b.date).includes('T') ? b.date.split('T')[0] : b.date;
        const list = map.get(dStr) || [];
        list.push(b);
        map.set(dStr, list);
      }
    });
    return map;
  }, [calendarBookings]);

  const selectedDayBookings = useMemo(() => {
    return bookingsByDate.get(selectedCalendarDate) || [];
  }, [bookingsByDate, selectedCalendarDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-neutral-500 font-medium">
          Loading partner portal...
        </div>
      </div>
    );
  }

  const recentReferrals = calendarBookings.slice(0, 4);

  return (
    <div className="w-full font-sans antialiased text-neutral-900">

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE VIEW (UNTOUCHED: identical vertical structure)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-4 sm:space-y-5 w-full max-w-4xl mx-auto pb-8">
        {/* Application Status Banner (only if pending) */}
        {profile?.status === 'pending' && (
          <div className="p-3.5 border border-amber-200/80 rounded-2xl bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Application under review. You can already share your referral link and QR code — all attributed bookings are recorded automatically.
            </div>
          </div>
        )}

        {/* 1. Approved Balance Card (Hero) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 block">
                Approved Balance
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-neutral-950 font-mono tracking-tight tabular-nums mt-1">
                {formatIDR(approvedBalance)}
              </div>
              {(stats?.pendingCommission || 0) > 0 && (
                <p className="text-xs text-neutral-500 mt-1 font-medium">
                  Pending: <span className="font-semibold text-neutral-800 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
                </p>
              )}
            </div>

            {hasApprovedBalance && (
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                Ready
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWithdrawWhatsApp}
            disabled={!hasApprovedBalance}
            className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center ${
              hasApprovedBalance
                ? 'bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
            }`}
          >
            {hasApprovedBalance ? 'Withdraw' : 'No Balance to Withdraw'}
          </button>
        </div>

        {/* 2. Responsive 2-Column Metrics (Strong BG Colors, Neutral Titles) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Paid Out: Strong Green BG, Neutral Title */}
          <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-3xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 block">
                Paid Out
              </span>
              <span className="text-[10px] font-bold text-neutral-900 bg-white/90 border border-neutral-300 px-2 py-0.5 rounded-full">
                Transferred
              </span>
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-950 font-mono tabular-nums truncate">
              {formatIDR(stats?.paidCommission || 0)}
            </div>
            <p className="text-[11px] text-neutral-700 font-medium">
              Approved earnings paid to bank
            </p>
          </div>

          {/* Pending: Strong Red/Rose BG, Neutral Title */}
          <div className="bg-[#FFE4E6] border border-[#FDA4AF] rounded-3xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 block">
                Pending
              </span>
              <span className="text-[10px] font-bold text-neutral-900 bg-white/90 border border-neutral-300 px-2 py-0.5 rounded-full">
                Verification
              </span>
            </div>
            <div className="text-base sm:text-xl font-bold text-neutral-950 font-mono tabular-nums truncate">
              {formatIDR(stats?.pendingCommission || 0)}
            </div>
            <p className="text-[11px] text-neutral-700 font-medium">
              Awaiting treatment completion
            </p>
          </div>
        </div>

        {/* 3. Promote to Guests Card */}
        <div className="bg-white border border-neutral-200/70 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-neutral-950 text-sm sm:text-base tracking-tight">Promote to Guests</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Scan QR code or share your link to record bookings</p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
              Active Attribution
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/60">
            <div className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs shrink-0">
              <img
                src={qrCodeUrl}
                alt="Partner QR code"
                className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-3 w-full min-w-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Instant Scan
                </span>
                <h4 className="text-sm sm:text-base font-bold text-neutral-950">
                  Official Partner QR Code
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Guests can scan this code with their phone camera to book directly with your referral attribution.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Download size={14} />
                <span>Download QR Code</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-neutral-700">Your Referral Link</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#F2F2F7] border border-neutral-200/60 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 select-all truncate">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Recent Referrals Stream */}
        <div className="bg-white border border-neutral-200/70 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-neutral-950 text-sm sm:text-base tracking-tight">Recent Referrals</h3>
              <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                {recentReferrals.length}
              </span>
            </div>
            <Link
              href="/partners/referrals"
              className="text-xs font-semibold text-neutral-800 hover:text-neutral-950 hover:underline flex items-center gap-0.5"
            >
              <span>All Referrals</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {recentReferrals.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-neutral-200/80 bg-[#FBFBFD] space-y-1.5">
              <p className="text-xs font-semibold text-neutral-800">No referred bookings yet</p>
              <p className="text-[11px] text-neutral-500">
                Display your QR code or share your link with villa guests to receive your first commission.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentReferrals.map((b) => {
                const isApproved = b.commission_status === 'approved';
                const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                const isPaid = b.payment_status === 'paid' || b.payment_verified;

                return (
                  <div key={b.id || b.booking_id} className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/70">
                          #{b.booking_id}
                        </span>

                        {isPaid ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                            Unpaid
                          </span>
                        )}

                        {isCancelled ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80">
                            Cancelled
                          </span>
                        ) : b.booking_status === 'Ongoing' ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Ongoing Treatment
                          </span>
                        ) : b.booking_status === 'Completed' || b.service_completed ? (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                            Finish Treatment
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/80">
                            Pending
                          </span>
                        )}

                        {isCancelled ? (
                          <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                            Commission Cancelled
                          </span>
                        ) : isApproved ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                            Approved
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 truncate">
                        {b.guest_name} • {b.treatment_name || 'Spa Treatment'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className={`text-xs font-bold font-mono tabular-nums block ${isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}`}>
                        {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP 3-LAYOUT VIEW (APPLE DESIGN ARCHITECTURE)
          - Left Column: Unified Interactive Calendar & Integrated Agenda
          - Middle Column: Approved Balance Hero, Strong Metrics (NO Truncation!), Recent Referrals
          - Right Column: Promote to Guests, QR Code, Concierge & Villa Guidance
         ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 w-full max-w-[1560px] mx-auto pb-12 items-start">
        
        {/* ─────────────────────────────────────────────────────────────
            LAYOUT 1 (LEFT COLUMN): Unified Apple Calendar & Day Schedule
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 bg-white border border-neutral-200/70 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-6">
          {/* Calendar Header with Apple Pill Control */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                Booking Schedule
              </span>
              <h3 className="font-extrabold text-base text-neutral-950 tracking-tight mt-0.5">
                {monthNames[calMonth]} {calYear}
              </h3>
            </div>

            {/* Apple Segmented Pill Navigation */}
            <div className="inline-flex items-center bg-neutral-100 p-1 rounded-full border border-neutral-200/60 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevCalMonth}
                className="p-1 hover:bg-white rounded-full transition-all cursor-pointer text-neutral-600 hover:text-black"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleCalToday}
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                  selectedCalendarDate === toLocalDateString(new Date())
                    ? 'bg-neutral-950 text-white shadow-2xs'
                    : 'text-neutral-700 hover:bg-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextCalMonth}
                className="p-1 hover:bg-white rounded-full transition-all cursor-pointer text-neutral-600 hover:text-black"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 text-center">
            {daysOfWeek.map((d) => (
              <span key={d} className="text-[11px] font-bold text-neutral-400 uppercase py-1 tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {Array.from({ length: calFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}
            {Array.from({ length: calDaysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedCalendarDate === dateStr;
              const isToday = dateStr === toLocalDateString(new Date());
              const dayBookings = bookingsByDate.get(dateStr) || [];
              const hasBookings = dayBookings.length > 0;

              return (
                <div key={day} className="relative flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`w-9 h-9 rounded-full flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-neutral-950 text-white font-bold shadow-sm scale-105'
                        : isToday
                        ? 'bg-neutral-100 text-neutral-950 font-bold border border-neutral-300'
                        : hasBookings
                        ? 'bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100 border border-emerald-200/60'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{day}</span>
                    {hasBookings && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5" />
                    )}
                  </button>
                  {hasBookings && (
                    <span className="absolute -top-1 -right-0.5 bg-emerald-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-2xs pointer-events-none">
                      {dayBookings.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Seamless Integrated Day Schedule (Apple Grouped Agenda) */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Day Schedule
                </span>
                <h4 className="font-bold text-xs text-neutral-950">
                  {safeFormatDate(selectedCalendarDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-200/70">
                {selectedDayBookings.length} Bookings
              </span>
            </div>

            {selectedDayBookings.length === 0 ? (
              <div className="py-7 text-center rounded-2xl bg-[#FBFBFD] border border-dashed border-neutral-200/80 p-4 space-y-1">
                <CalendarIcon size={20} className="mx-auto text-neutral-300 mb-1" />
                <p className="text-xs font-semibold text-neutral-700">No bookings for this date</p>
                <p className="text-[11px] text-neutral-400">
                  Click highlighted dates with dots to inspect appointments.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {selectedDayBookings.map((b) => {
                  const isApproved = b.commission_status === 'approved';
                  const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                  const isPaid = b.payment_status === 'paid' || b.payment_verified;

                  return (
                    <div 
                      key={b.id || b.booking_id} 
                      className="p-3.5 bg-[#F9FAFB] border border-neutral-200/70 rounded-2xl space-y-2 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleCopyBooking(b.booking_id)}
                          className="font-mono text-xs font-bold text-neutral-950 bg-white px-2 py-0.5 rounded-md border border-neutral-200/80 hover:bg-neutral-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Copy Booking ID"
                        >
                          <span>#{b.booking_id}</span>
                          {copiedBookingId === b.booking_id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-neutral-400" />}
                        </button>
                        <span className={`text-xs font-bold font-mono tabular-nums ${isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPaid ? (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                            Unpaid
                          </span>
                        )}

                        {isCancelled ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                            Cancelled
                          </span>
                        ) : b.booking_status === 'Ongoing' ? (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Ongoing Treatment
                          </span>
                        ) : b.booking_status === 'Completed' || b.service_completed ? (
                          <span className="text-[9px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                            Finish Treatment
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-200/70 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}

                        {isApproved && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Approved
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-800 font-medium truncate">
                        {b.guest_name} • {b.treatment_name || 'Spa Ritual'}
                      </div>
                      {b.time && b.time !== '-' && (
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock size={11} /> {b.time}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            LAYOUT 2 (CENTER COLUMN): Financial Overview & Referrals
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Application Status Banner (if pending) */}
          {profile?.status === 'pending' && (
            <div className="p-3.5 border border-amber-200/80 rounded-2xl bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
              <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Application under review. All attributed bookings are recorded automatically.
              </div>
            </div>
          )}

          {/* 1. Approved Balance Card (Primary Apple Hero) */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/70 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 block">
                  Approved Balance
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-neutral-950 font-mono tracking-tight tabular-nums mt-1">
                  {formatIDR(approvedBalance)}
                </div>
                {(stats?.pendingCommission || 0) > 0 && (
                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    Pending: <span className="font-semibold text-neutral-800 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
                  </p>
                )}
              </div>

              {hasApprovedBalance && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  Ready
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleWithdrawWhatsApp}
              disabled={!hasApprovedBalance}
              className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer ${
                hasApprovedBalance
                  ? 'bg-neutral-950 hover:bg-neutral-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
              }`}
            >
              {hasApprovedBalance ? 'Withdraw' : 'No Balance to Withdraw'}
            </button>
          </div>

          {/* 2. Paid Out & Pending Cards: Stacked Full-Width to PREVENT Any Truncation! */}
          <div className="space-y-3">
            {/* Paid Out Card: Strong Green Background, Neutral Dark Title */}
            <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-1.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 block">
                  Paid Out
                </span>
                <span className="text-[10px] font-bold text-neutral-900 bg-white/90 border border-neutral-300 px-2 py-0.5 rounded-full shadow-2xs">
                  Transferred
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono tabular-nums">
                {formatIDR(stats?.paidCommission || 0)}
              </div>
              <p className="text-[11px] text-neutral-700 font-medium">
                Approved earnings paid to bank
              </p>
            </div>

            {/* Pending Card: Strong Red/Rose Background, Neutral Dark Title */}
            <div className="bg-[#FFE4E6] border border-[#FDA4AF] rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-1.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 block">
                  Pending
                </span>
                <span className="text-[10px] font-bold text-neutral-900 bg-white/90 border border-neutral-300 px-2 py-0.5 rounded-full shadow-2xs">
                  Verification
                </span>
              </div>
              {/* Un-truncated, full width currency */}
              <div className="text-xl sm:text-2xl font-extrabold text-neutral-950 font-mono tabular-nums">
                {formatIDR(stats?.pendingCommission || 0)}
              </div>
              <p className="text-[11px] text-neutral-700 font-medium">
                Awaiting treatment completion
              </p>
            </div>
          </div>

          {/* 3. Recent Referrals Stream (Apple Grouped List) */}
          <div className="bg-white border border-neutral-200/70 rounded-3xl p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-950 text-sm tracking-tight">Recent Referrals</h3>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                  {recentReferrals.length}
                </span>
              </div>
              <Link
                href="/partners/referrals"
                className="text-xs font-semibold text-neutral-800 hover:text-neutral-950 hover:underline flex items-center gap-0.5"
              >
                <span>All Referrals</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {recentReferrals.length === 0 ? (
              <div className="py-7 px-4 text-center rounded-2xl border border-dashed border-neutral-200/80 bg-[#FBFBFD] space-y-1">
                <p className="text-xs font-semibold text-neutral-800">No referred bookings yet</p>
                <p className="text-[11px] text-neutral-500">
                  Share your link or QR code with guests to receive your first commission.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto pr-1">
                {recentReferrals.map((b) => {
                  const isApproved = b.commission_status === 'approved';
                  const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                  const isPaid = b.payment_status === 'paid' || b.payment_verified;

                  return (
                    <div key={b.id || b.booking_id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2.5">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/70">
                            #{b.booking_id}
                          </span>

                          {isPaid ? (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                              Unpaid
                            </span>
                          )}

                          {isCancelled ? (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80">
                              Cancelled
                            </span>
                          ) : b.booking_status === 'Ongoing' ? (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Ongoing
                            </span>
                          ) : b.booking_status === 'Completed' || b.service_completed ? (
                            <span className="text-[9px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                              Finished
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/80">
                              Pending
                            </span>
                          )}

                          {isApproved && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                              Approved
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-600 truncate max-w-[190px]">
                          {b.guest_name} • {b.treatment_name || 'Spa Ritual'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold font-mono tabular-nums block ${isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {safeFormatDate(b.date, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            LAYOUT 3 (RIGHT COLUMN): Promote to Guests, QR & Concierge
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Promote to Guests Card */}
          <div className="bg-white border border-neutral-200/70 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div>
                <h3 className="font-extrabold text-neutral-950 text-base tracking-tight">Promote to Guests</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Instant booking attribution</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
                Active Attribution
              </span>
            </div>

            {/* Centered QR Presentation */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200/60 flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs">
                <img
                  src={qrCodeUrl}
                  alt="Partner QR code"
                  className="w-36 h-36 object-contain mx-auto"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Instant Scan
                </span>
                <h4 className="text-sm font-bold text-neutral-950">
                  Official Partner QR Code
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                  Guests scan this code with their phone camera to book directly with your referral attribution.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Download size={14} />
                <span>Download QR Code</span>
              </button>
            </div>

            {/* Apple Style Referral Link Box */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">Your Referral Link</span>
                <span className="text-[10px] font-semibold text-neutral-400">30-day tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#F2F2F7] border border-neutral-200/60 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 select-all truncate">
                  {referralLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Villa Concierge & Partner Support Guide */}
          <div className="bg-white border border-neutral-200/70 rounded-3xl p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
                <Sparkles size={15} />
              </span>
              <div>
                <h4 className="font-bold text-xs text-neutral-950">Partner Concierge Tips</h4>
                <span className="text-[10px] text-neutral-400">Maximize villa guest bookings</span>
              </div>
            </div>

            <ul className="text-xs text-neutral-600 space-y-2 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Place QR code cards on villa coffee tables, nightstands, or reception counters.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Share your custom link via WhatsApp when guests inquire about spa rituals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Automatic 30-day cookie window preserves attribution if guests book later.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-medium">Need immediate assistance?</span>
              <a
                href="https://wa.me/6285174119423"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 hover:text-black hover:underline"
              >
                <span>Concierge WA</span>
                <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Full-Screen Native App Calendar Modal for Mobile */}
      <FloatingBookingCalendar
        bookings={calendarBookings}
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onOpen={() => setCalendarOpen(true)}
        showFloatingButton={false}
      />
    </div>
  );
}
