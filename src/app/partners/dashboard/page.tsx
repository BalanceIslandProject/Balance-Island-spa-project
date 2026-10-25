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
  const recentReferrals = calendarBookings.slice(0, 5);

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

  return (
    <div className="w-full font-sans antialiased text-[#171717] space-y-6">
      {/* Application Status Alert Banner (only if pending) */}
      {profile?.status === 'pending' && (
        <div className="p-4 border border-amber-200 rounded-xl bg-amber-50 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Application under review. You can already share your referral link and QR code — all attributed bookings are recorded automatically.
          </div>
        </div>
      )}

      {/* 4-KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* 1. Approved Balance */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373] font-medium">Approved balance</span>
              {hasApprovedBalance && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Ready to withdraw" />
              )}
            </div>
            <div className="text-2xl font-semibold text-black mt-1 font-mono tabular-nums">
              {formatIDR(approvedBalance)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={handleWithdrawWhatsApp}
              disabled={!hasApprovedBalance}
              className={`w-full h-8 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
                hasApprovedBalance
                  ? 'bg-black text-white hover:bg-[#262626]'
                  : 'bg-white text-[#A3A3A3] border border-[#E5E5E5] cursor-not-allowed'
              }`}
            >
              {hasApprovedBalance ? 'Withdraw via WhatsApp' : 'No Balance to Withdraw'}
            </button>
          </div>
        </div>

        {/* 2. Paid Out */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs text-[#737373] font-medium">Paid out</span>
          </div>
          <div className="text-2xl font-semibold text-black mt-1 font-mono tabular-nums">
            {formatIDR(stats?.paidCommission || 0)}
          </div>
          <div className="text-xs text-[#737373] mt-1 truncate">
            Disbursed to registered bank account
          </div>
        </div>

        {/* 3. Pending */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs text-[#737373] font-medium">Pending commission</span>
          </div>
          <div className="text-2xl font-semibold text-black mt-1 font-mono tabular-nums">
            {formatIDR(stats?.pendingCommission || 0)}
          </div>
          <div className="text-xs text-[#737373] mt-1 truncate">
            Awaiting treatment completion
          </div>
        </div>

        {/* 4. Total Attributed Bookings */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="text-xs text-[#737373] font-medium">Total bookings</div>
          <div className="text-2xl font-semibold text-black mt-1 font-mono tabular-nums">
            {calendarBookings.length}
          </div>
          <div className="text-xs text-[#737373] mt-1 truncate">
            Commission rate: {profile?.commission_rate_pct || 10}%
          </div>
        </div>
      </div>

      {/* Main CRM Workspace (Desktop 12-Col Grid, Mobile 1-Col Stack) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Promote & Referrals */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Promote to Guests Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h3 className="font-semibold text-black text-[15px] tracking-tight">
                  Promote to Guests
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Instant booking attribution & tracking for villas, drivers, and travel hosts
                </p>
              </div>
              <span className="inline-flex items-center h-6 px-2 rounded-md border border-[#E5E5E5] text-[11px] font-mono text-[#737373]">
                Active Attribution
              </span>
            </div>

            {/* QR Code Presentation */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-[#E5E5E5] bg-white">
              <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Partner QR code"
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain mx-auto"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block">
                    Instant Scan
                  </span>
                  <h4 className="text-sm font-semibold text-black">
                    Official Partner QR Code
                  </h4>
                  <p className="text-xs text-[#737373] leading-relaxed mt-0.5">
                    Guests scan this code with their smartphone camera to browse treatments and book directly with your attribution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-[#262626] transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <Download size={14} />
                  <span>Download QR Code</span>
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#171717]">Your Referral Link</span>
                <span className="text-[11px] text-[#737373]">30-day cookie window</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs font-mono text-black select-all truncate">
                  {referralLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-9 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-[#262626] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Referrals Stream */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-black text-[15px] tracking-tight">
                  Recent Referrals
                </h3>
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-[#E5E5E5] text-[11px] font-mono text-[#737373]">
                  {recentReferrals.length}
                </span>
              </div>
              <Link
                href="/partners/referrals"
                className="text-xs font-medium text-[#737373] hover:text-black flex items-center gap-0.5 transition-colors"
              >
                <span>All Referrals</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {recentReferrals.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-white border border-dashed border-[#E5E5E5] p-4 space-y-1.5">
                <p className="text-xs font-medium text-black">No referred bookings yet</p>
                <p className="text-[11px] text-[#737373] max-w-sm mx-auto">
                  Display your QR code or share your link with villa guests to receive your first commission.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {recentReferrals.map((b) => {
                  const isApproved = b.commission_status === 'approved';
                  const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
                  const isPaid = b.payment_status === 'paid' || b.payment_verified;

                  return (
                    <div key={b.id || b.booking_id} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyBooking(b.booking_id)}
                            className="font-mono text-xs text-black bg-white px-2 py-0.5 rounded border border-[#E5E5E5] hover:border-black transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Copy booking ID"
                          >
                            <span>#{b.booking_id}</span>
                            {copiedBookingId === b.booking_id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-[#A3A3A3]" />}
                          </button>

                          {isPaid ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {b.payment_method === 'cash' ? 'Paid (Cash)' : b.payment_method === 'online' ? 'Paid (Online)' : 'Paid'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Unpaid
                            </span>
                          )}

                          {isCancelled ? (
                            <span className="text-[10px] font-medium text-[#737373] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                              Cancelled
                            </span>
                          ) : b.booking_status === 'Ongoing' ? (
                            <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Ongoing Treatment
                            </span>
                          ) : b.booking_status === 'Completed' || b.service_completed ? (
                            <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              Finish Treatment
                            </span>
                          ) : b.booking_status === 'Confirmed' ? (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Confirmed
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Awaiting Treatment
                            </span>
                          )}

                          {b.commission_status === 'paid' ? (
                            <span className="text-[10px] font-medium text-white bg-black px-2 py-0.5 rounded border border-black inline-flex items-center gap-1">
                              ✓ Paid Out
                            </span>
                          ) : isApproved ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Approved
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-[#737373] truncate font-medium">
                          {b.guest_name} • {b.treatment_name || 'Spa Ritual'}
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className={`text-xs font-mono font-medium tabular-nums block ${isCancelled ? 'line-through text-[#A3A3A3]' : 'text-emerald-600'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(b.commission_amount)}`}
                        </span>
                        <span className="text-[10px] text-[#737373]">
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

        {/* Right Column (5 cols): Commission Ledger with Date Range Filter */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <PartnerCommissionFilterCard bookings={calendarBookings} />
        </div>
      </div>

    </div>
  );
}
