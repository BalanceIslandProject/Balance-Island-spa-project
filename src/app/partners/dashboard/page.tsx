'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Copy, 
  Check, 
  AlertCircle,
  ChevronRight,
  Download
} from 'lucide-react';
import { CalendarBooking } from '../FloatingBookingCalendar';
import PartnerCommissionFilterCard from '../PartnerCommissionFilterCard';
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
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);

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

    // 1. Supabase Realtime Subscription
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

    // 2. Polling fallback every 8 seconds
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
          MOBILE VIEW (CLEAN SINGLE-COLUMN FLOW)
          Liquid Apple Glass design language
         ═══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-4 sm:space-y-5 w-full max-w-4xl mx-auto pb-8">
        {/* Application Status Banner (only if pending) */}
        {profile?.status === 'pending' && (
          <div className="p-3.5 border border-amber-200/80 rounded-2xl bg-amber-50/80 backdrop-blur-md text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Application under review. You can already share your referral link and QR code — all attributed bookings are recorded automatically.
            </div>
          </div>
        )}

        {/* 1. Approved Balance Card (Hero) */}
        <div className="p-5 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.04)] space-y-4 ring-1 ring-black/[0.03] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 block">
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
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md shadow-2xs">
                Ready
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWithdrawWhatsApp}
            disabled={!hasApprovedBalance}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center ${
              hasApprovedBalance
                ? 'bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
            }`}
          >
            {hasApprovedBalance ? 'Withdraw' : 'No Balance to Withdraw'}
          </button>
        </div>

        {/* 2. Responsive 2-Column Metrics (Paid Out: White + Green Dot, Pending: Black + Red Dot) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Paid Out: White Card with Green Dot */}
          <div className="bg-white border border-neutral-200/90 rounded-[26px] p-4 sm:p-5 shadow-2xs space-y-2 transition-all">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 block">
                Paid Out
              </span>
            </div>
            <div className="text-base sm:text-xl font-extrabold text-neutral-950 font-mono tabular-nums truncate">
              {formatIDR(stats?.paidCommission || 0)}
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              Approved earnings paid to bank
            </p>
          </div>

          {/* Pending: Black Card with Red Dot */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-[26px] p-4 sm:p-5 shadow-md space-y-2 transition-all text-white">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white block">
                Pending
              </span>
            </div>
            <div className="text-base sm:text-xl font-extrabold text-white font-mono tabular-nums truncate">
              {formatIDR(stats?.pendingCommission || 0)}
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              Awaiting treatment completion
            </p>
          </div>
        </div>

        {/* 3. Promote to Guests Card (Positioned directly below Paid Out & Pending!) */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[28px] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] space-y-4">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-100/80">
            <div>
              <h3 className="font-extrabold text-neutral-950 text-sm sm:text-base tracking-tight">Promote to Guests</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Scan QR code or share your link to record bookings</p>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 backdrop-blur-md shrink-0">
              Active Attribution
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/70">
            <div className="p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200/80 shadow-2xs shrink-0">
              <img
                src={qrCodeUrl}
                alt="Partner QR code"
                className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-3 w-full min-w-0">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
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
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700">Your Referral Link</span>
              <span className="text-[10px] font-semibold text-neutral-400">30-day tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-900/[0.03] backdrop-blur-md border border-neutral-200/70 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 select-all truncate">
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

        {/* 5. Recent Referrals Stream */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[28px] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-neutral-950 text-sm sm:text-base tracking-tight">Recent Referrals</h3>
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
            <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/50 space-y-1.5">
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

                      <p className="text-xs text-neutral-600 truncate font-medium">
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
          DESKTOP BALANCED 2-COLUMN VIEW (APPLE DESIGN ARCHITECTURE)
          - Left Column (7 cols):
            1. Approved Balance Hero Card
            2. Paid Out & Pending Cards (side-by-side)
            3. Promote to Guests Card (QR code, Download, Referral link)
            4. Recent Referrals Stream (Apple grouped list)
          - Right Column (5 cols):
            1. Calendar with Booking Details (replaces Promote to Guests & Concierge Tips)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-7 w-full max-w-[1440px] mx-auto pb-12 items-start">
        
        {/* ─────────────────────────────────────────────────────────────
            COLUMN 1 (LEFT COLUMN - 7 COLS): Financial Overview, Promote & Referrals
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Application Status Banner (if pending) */}
          {profile?.status === 'pending' && (
            <div className="p-4 border border-amber-200/80 rounded-2xl bg-amber-50/80 backdrop-blur-md text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
              <AlertCircle size={17} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                Application under review. All attributed bookings are recorded and tracked automatically.
              </div>
            </div>
          )}

          {/* 1. Approved Balance Card (Primary Apple Hero) */}
          <div className="p-7 rounded-[28px] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                  Approved Balance
                </span>
                <div className="text-4xl font-extrabold text-neutral-950 font-mono tracking-tight tabular-nums mt-1.5">
                  {formatIDR(approvedBalance)}
                </div>
                {(stats?.pendingCommission || 0) > 0 && (
                  <p className="text-xs text-neutral-500 mt-1.5 font-medium">
                    Pending: <span className="font-semibold text-neutral-800 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
                  </p>
                )}
              </div>

              {hasApprovedBalance && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md shadow-2xs">
                  Ready
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleWithdrawWhatsApp}
              disabled={!hasApprovedBalance}
              className={`w-full py-4 px-5 rounded-2xl font-bold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer ${
                hasApprovedBalance
                  ? 'bg-neutral-950 hover:bg-neutral-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
              }`}
            >
              {hasApprovedBalance ? 'Withdraw' : 'No Balance to Withdraw'}
            </button>
          </div>

          {/* 2. Paid Out & Pending Cards: Side-by-Side (White + Green Dot & Black + Red Dot) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Paid Out Card: White with Green Dot */}
            <div className="bg-white border border-neutral-200/90 rounded-[26px] p-5 shadow-2xs space-y-2 transition-all hover:border-neutral-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 block">
                  Paid Out
                </span>
              </div>
              <div className="text-2xl font-extrabold text-neutral-950 font-mono tabular-nums">
                {formatIDR(stats?.paidCommission || 0)}
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">
                Approved earnings paid to bank
              </p>
            </div>

            {/* Pending Card: Black with Red Dot */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-[26px] p-5 shadow-md space-y-2 transition-all hover:border-neutral-800 text-white">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white block">
                  Pending
                </span>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {formatIDR(stats?.pendingCommission || 0)}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                Awaiting treatment completion
              </p>
            </div>
          </div>

          {/* 3. Promote to Guests Card (Moved directly below Paid Out & Pending card!) */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[28px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] space-y-5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-100/80">
              <div>
                <h3 className="font-extrabold text-neutral-950 text-base tracking-tight">Promote to Guests</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Instant booking attribution & tracking</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md shrink-0">
                Active Attribution
              </span>
            </div>

            {/* Side-by-side QR presentation inside Column 1 */}
            <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/70 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200/80 shadow-2xs shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Partner QR code"
                  className="w-36 h-36 object-contain mx-auto"
                />
              </div>
              <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                    Instant Scan
                  </span>
                  <h4 className="text-sm font-bold text-neutral-950">
                    Official Partner QR Code
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">
                    Guests scan this code with their phone camera to book directly with your referral attribution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download QR Code</span>
                </button>
              </div>
            </div>

            {/* Apple Style Referral Link Box */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">Your Referral Link</span>
                <span className="text-[10px] font-semibold text-neutral-400">30-day tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-neutral-900/[0.03] backdrop-blur-md border border-neutral-200/70 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 select-all truncate">
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

          {/* 4. Recent Referrals Stream (Apple Grouped List) */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[28px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] space-y-4">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-100/80">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-950 text-base tracking-tight">Recent Referrals</h3>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-200/70">
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
              <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/50 space-y-1.5">
                <p className="text-xs font-semibold text-neutral-800">No referred bookings yet</p>
                <p className="text-[11px] text-neutral-500">
                  Share your link or QR code with guests to receive your first commission.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100/80">
                {recentReferrals.map((b) => {
                  const isApproved = b.commission_status === 'approved';
                  const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                  const isPaid = b.payment_status === 'paid' || b.payment_verified;

                  return (
                    <div key={b.id || b.booking_id} className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyBooking(b.booking_id)}
                            className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100/90 px-2 py-0.5 rounded border border-neutral-200/70 hover:bg-neutral-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Copy booking ID"
                          >
                            <span>#{b.booking_id}</span>
                            {copiedBookingId === b.booking_id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-neutral-400" />}
                          </button>

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

                          {isApproved && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                              Approved
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-600 truncate font-medium">
                          {b.guest_name} • {b.treatment_name || 'Spa Ritual'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold font-mono tabular-nums block ${isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">
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
            COLUMN 2 (RIGHT COLUMN - 5 COLS):
            Commission Section with Calendar Date Range Filter
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <PartnerCommissionFilterCard bookings={calendarBookings} />
        </div>

      </div>

    </div>
  );
}
