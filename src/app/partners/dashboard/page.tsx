'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Copy, 
  Check, 
  MessageCircle, 
  CalendarCheck, 
  Wallet, 
  ArrowUpRight, 
  Share2, 
  ExternalLink, 
  AlertCircle,
  CalendarDays,
  Clock,
  ChevronRight
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
  const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
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
          setRecentCommissions(statsData.recentCommissions || []);
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;

  // NO MINIMUM WITHDRAWAL: partners can withdraw any approved balance > 0
  const approvedBalance = stats?.approvedCommission || 0;
  const hasApprovedBalance = approvedBalance > 0;

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

  return (
    <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
      
      {/* 1. Simple Welcome Header (Clean, no redundant badges/titles) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">
                Welcome, {profile?.first_name || 'Partner'}
              </h1>
              {profile?.status === 'pending' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock size={10} />
                  Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </div>
            {profile?.business_name && (
              <p className="text-xs text-neutral-500 font-medium">
                {profile.business_name}
              </p>
            )}
          </div>

          {/* Referral Code Quick Copy */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-neutral-900 transition-colors active:scale-95"
            title="Copy referral code"
          >
            <span>#{partnerCode}</span>
            {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-neutral-400" />}
          </button>
        </div>
      </div>

      {/* Application Status Banner (only if pending) */}
      {profile?.status === 'pending' && (
        <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Application under review. You can already share your referral link and QR code — all attributed bookings are recorded automatically.
          </div>
        </div>
      )}

      {/* 2. Quick Actions Bar (Compact, uniform 4-button dock) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:bg-neutral-50 active:scale-95 transition-all text-neutral-800"
        >
          <CalendarDays size={18} className="text-neutral-800 mb-1" />
          <span className="text-[11px] font-semibold">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:bg-neutral-50 active:scale-95 transition-all text-neutral-800"
        >
          <QrCode size={18} className="text-neutral-800 mb-1" />
          <span className="text-[11px] font-semibold">QR Code</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs hover:bg-neutral-50 active:scale-95 transition-all text-neutral-800"
        >
          {copiedLink ? <Check size={18} className="text-emerald-600 mb-1" /> : <Share2 size={18} className="text-neutral-800 mb-1" />}
          <span className="text-[11px] font-semibold">{copiedLink ? 'Copied' : 'Share'}</span>
        </button>

        <button
          type="button"
          onClick={handleWithdrawWhatsApp}
          disabled={!hasApprovedBalance}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border shadow-2xs active:scale-95 transition-all ${
            hasApprovedBalance
              ? 'bg-neutral-950 text-white border-neutral-950 hover:bg-neutral-800 cursor-pointer'
              : 'bg-white text-neutral-400 border-neutral-200/80 opacity-60 cursor-not-allowed'
          }`}
        >
          <MessageCircle size={18} className={hasApprovedBalance ? 'text-white mb-1' : 'text-neutral-400 mb-1'} />
          <span className="text-[11px] font-semibold">Withdraw</span>
        </button>
      </div>

      {/* 3. Financial & Booking Metrics (Clean, simple, no clutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Approved Balance Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Approved Balance
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-neutral-950 font-mono tracking-tight tabular-nums mt-0.5">
                {formatIDR(approvedBalance)}
              </div>
              {(stats?.pendingCommission || 0) > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  Pending verification: <span className="font-semibold text-neutral-800 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
                </p>
              )}
            </div>

            {hasApprovedBalance && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ready
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWithdrawWhatsApp}
            disabled={!hasApprovedBalance}
            className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-98 flex items-center justify-center gap-2 ${
              hasApprovedBalance
                ? 'bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
            }`}
          >
            <MessageCircle size={14} />
            <span>{hasApprovedBalance ? 'Withdraw via WhatsApp' : 'No Balance to Withdraw'}</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Total Bookings Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs flex flex-col justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Total Bookings
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-neutral-950 font-mono tracking-tight tabular-nums mt-0.5">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Referred guest appointments
            </p>
          </div>

          <Link
            href="/partners/referrals"
            className="w-full py-2.5 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span>View All Referrals</span>
            <ChevronRight size={13} />
          </Link>
        </div>

      </div>

      {/* 4. Referral Link (Compact 1-line copy bar) */}
      <div className="p-3.5 sm:p-4 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-800">Your Referral Link</span>
          <span className="text-[11px] text-neutral-500">15% commission</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 select-all truncate">
            {referralLink}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 5. Booking Calendar & Tracker */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-neutral-700">Booking Calendar</span>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="text-xs text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1"
          >
            <span>Expand</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

        <FloatingBookingCalendar 
          bookings={calendarBookings} 
          showFloatingButton={false} 
          inline={true} 
        />
      </div>

      {/* Full Calendar Modal (opened via Calendar tab / buttons) */}
      <FloatingBookingCalendar
        bookings={calendarBookings}
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onOpen={() => setCalendarOpen(true)}
        showFloatingButton={false}
      />

      {/* QR Code Modal Dialog */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center border border-neutral-200/80 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-950">Partner QR Code</h3>
              <p className="text-xs text-neutral-500">Scan to book with code #{partnerCode}</p>
            </div>

            <div className="p-3 border border-neutral-200 rounded-xl inline-block bg-white shadow-2xs">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${partnerCode}`}
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-[11px] font-mono text-neutral-600 bg-neutral-50 py-2 px-3 rounded-lg border border-neutral-200/70 truncate select-all">
              {referralLink}
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href={qrCodeUrl}
                download={`BookTherapick-${partnerCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-all text-center shadow-xs"
              >
                Download QR
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
