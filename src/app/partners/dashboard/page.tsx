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
import FloatingBookingCalendar, { CalendarBooking } from '../FloatingBookingCalendar';

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
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
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

  const recentReferrals = calendarBookings.slice(0, 3);

  return (
    <div className="space-y-3.5 sm:space-y-5 w-full max-w-4xl mx-auto pb-6">
      
      {/* Application Status Banner (only if pending) */}
      {profile?.status === 'pending' && (
        <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Application under review. You can already share your referral link and QR code — all attributed bookings are recorded automatically.
          </div>
        </div>
      )}

      {/* 1. Approved Balance Card (Top of the Screen) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Approved Balance
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-neutral-950 font-mono tracking-tight tabular-nums mt-0.5">
              {formatIDR(approvedBalance)}
            </div>
            {(stats?.pendingCommission || 0) > 0 && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                Pending verification: <span className="font-bold text-rose-700 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
              </p>
            )}
          </div>

          {hasApprovedBalance && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Ready
            </span>
          )}
        </div>

        {/* Clean Withdraw Button (No icons, no whatsapp text) */}
        <button
          type="button"
          onClick={handleWithdrawWhatsApp}
          disabled={!hasApprovedBalance}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-98 flex items-center justify-center ${
            hasApprovedBalance
              ? 'bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
          }`}
        >
          {hasApprovedBalance ? 'Withdraw' : 'No Balance to Withdraw'}
        </button>
      </div>

      {/* 2. Responsive 2-Column Metrics (Approve: Green Card | Pending: Red Card) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Approved / Paid Out: Green Card */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Paid Out
            </span>
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded-full">
              Transferred
            </span>
          </div>
          <div className="text-sm sm:text-lg font-bold text-emerald-950 font-mono tabular-nums truncate">
            {formatIDR(stats?.paidCommission || 0)}
          </div>
          <p className="text-[10px] text-emerald-700 font-medium">
            Approved earnings paid to bank
          </p>
        </div>

        {/* Pending: Red Card */}
        <div className="bg-rose-50/50 border border-rose-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
              Pending
            </span>
            <span className="text-[9px] font-bold text-rose-700 bg-rose-100/80 border border-rose-200 px-1.5 py-0.2 rounded-full">
              Verification
            </span>
          </div>
          <div className="text-sm sm:text-lg font-bold text-rose-950 font-mono tabular-nums truncate">
            {formatIDR(stats?.pendingCommission || 0)}
          </div>
          <p className="text-[10px] text-rose-600 font-medium">
            Awaiting treatment completion
          </p>
        </div>
      </div>

      {/* 3. Promote to Guests (Displayed QR Code with Download + Share Link with Copy) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-neutral-950 text-sm">Promote to Guests</h3>
            <p className="text-[11px] text-neutral-500">Scan QR code or share your link to record bookings</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            Active Attribution
          </span>
        </div>

        {/* Displayed QR Code Section with Direct Download Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/70">
          <div className="p-2.5 bg-white rounded-xl border border-neutral-200 shadow-2xs shrink-0">
            <img
              src={qrCodeUrl}
              alt={`Partner QR code for ${partnerCode}`}
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2.5 w-full min-w-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Partner QR Code
              </span>
              <h4 className="text-sm font-bold text-neutral-950 font-mono">
                #{partnerCode}
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Guests can scan this code with their camera to book directly with your referral code attached.
              </p>
            </div>
            <a
              href={qrCodeUrl}
              download={`BookTherapick-${partnerCode}.png`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs"
            >
              <Download size={14} />
              <span>Download QR Code</span>
            </a>
          </div>
        </div>

        {/* Share Link with Copy Button */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-neutral-700">Your Referral Link</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-mono text-neutral-900 select-all truncate">
              {referralLink}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Recent Referrals Stream (Live Feed) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-neutral-950 text-sm">Recent Referrals</h3>
            <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">
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
          <div className="py-6 px-4 text-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 space-y-1">
            <p className="text-xs font-semibold text-neutral-800">No referred bookings yet</p>
            <p className="text-[11px] text-neutral-500">
              Display your QR code or share your link with villa guests to receive your first commission.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentReferrals.map((b) => {
              const isPending = b.commission_status === 'pending';
              const isApproved = b.commission_status === 'approved';

              return (
                <div key={b.id || b.booking_id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-neutral-900">
                        #{b.booking_id}
                      </span>
                      {isPending ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Pending
                        </span>
                      ) : isApproved ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {b.commission_status}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {b.guest_name} • {b.treatment_name || 'Spa Treatment'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums block">
                      +{formatIDR(b.commission_amount)}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(b.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Native App Calendar Modal */}
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
