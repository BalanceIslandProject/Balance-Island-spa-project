'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Copy, 
  Check, 
  AlertCircle,
  Share2,
  MessageCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  Wallet,
  Sparkles,
  ExternalLink,
  User
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

  // Direct native device share (iOS / Android share sheet)
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'BookTherapick Bali Mobile Spa',
          text: `Book luxury mobile spa treatments directly to your Bali villa or hotel:`,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // 1-Tap WhatsApp recommendation message to villa guests
  const handleShareToGuestWhatsApp = () => {
    const text = `Hello! For our villa guests, here is our recommended mobile spa service in Bali with BookTherapick. Professional certified therapists arrive directly at our villa with premium oils and equipment:\n\n${referralLink}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
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

  const handleConciergeWhatsApp = () => {
    const partnerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Partner';
    const text = `Hello BookTherapick Partner Concierge! I am partner ${partnerName} (#${partnerCode}). I have a question regarding custom villa packages or guest bookings:`;
    const waUrl = `https://wa.me/6285174119423?text=${encodeURIComponent(text)}`;
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
    <div className="space-y-3.5 sm:space-y-5 w-full max-w-4xl mx-auto pb-4">
      
      {/* Application Status Banner (only if pending) */}
      {profile?.status === 'pending' && (
        <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Application under review. You can already share your referral link and QR code — all attributed bookings are recorded automatically.
          </div>
        </div>
      )}

      {/* 1. Partner Status Pill (Compact Native Mobile Bar) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-neutral-950 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-neutral-100">
            {profile?.first_name?.[0] || 'P'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-950 truncate">
                {profile?.first_name || 'Partner'} {profile?.last_name || ''}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 truncate">
              {profile?.business_name || 'Verified Villa Partner'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            Rate
          </span>
          <span className="text-xs font-bold text-neutral-950 font-mono">
            {profile?.commission_rate_pct || 15}% Per Booking
          </span>
        </div>
      </div>

      {/* 2. Approved Balance Card (Top Primary Hero) */}
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
              <p className="text-xs text-neutral-500 mt-1">
                Pending verification: <span className="font-semibold text-neutral-800 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
              </p>
            )}
          </div>

          {hasApprovedBalance && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Ready
            </span>
          )}
        </div>

        {/* Clean Withdraw Button (No whatsapp text, no icons) */}
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

      {/* 3. Performance Glance (3-Card Mobile Metric Strip) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Card 1: Paid Out */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block truncate">
            Paid Out
          </span>
          <div className="text-xs sm:text-sm font-bold text-neutral-950 font-mono tabular-nums truncate">
            {formatIDR(stats?.paidCommission || 0)}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block truncate">
            Transferred
          </span>
        </div>

        {/* Card 2: Pending */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block truncate">
            Pending
          </span>
          <div className="text-xs sm:text-sm font-bold text-neutral-950 font-mono tabular-nums truncate">
            {formatIDR(stats?.pendingCommission || 0)}
          </div>
          <span className="text-[10px] text-amber-700 font-medium block truncate">
            Verification
          </span>
        </div>

        {/* Card 3: Reach & Clicks */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block truncate">
            Guest Clicks
          </span>
          <div className="text-xs sm:text-sm font-bold text-neutral-950 font-mono tabular-nums truncate">
            {stats?.totalClicks || 0}
          </div>
          <span className="text-[10px] text-neutral-500 font-medium block truncate">
            {stats?.conversionRate || '0.0'}% Conv
          </span>
        </div>
      </div>

      {/* 4. Guest Promotion & Share Hub (Real Mobile App Action Tools) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-neutral-950 text-sm">Promote to Guests</h3>
            <p className="text-[11px] text-neutral-500">Recommend Bali home spa service & track bookings</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            Active Attribution
          </span>
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* WhatsApp Villa Message */}
          <button
            type="button"
            onClick={handleShareToGuestWhatsApp}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 transition-all text-center group"
          >
            <MessageCircle size={18} className="text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-neutral-900">WhatsApp</span>
            <span className="text-[9px] text-neutral-500">Villa Guest Text</span>
          </button>

          {/* Native OS Share Sheet */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 transition-all text-center group"
          >
            <Share2 size={18} className="text-neutral-900 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-neutral-900">Share</span>
            <span className="text-[9px] text-neutral-500">AirDrop / Links</span>
          </button>

          {/* QR Code Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 transition-all text-center group"
          >
            <QrCode size={18} className="text-neutral-900 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-neutral-900">QR Code</span>
            <span className="text-[9px] text-neutral-500">Scan to Book</span>
          </button>
        </div>

        {/* 1-Line Copy Bar */}
        <div className="flex items-center gap-2 pt-1">
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

      {/* 5. Recent Activity Stream (Live App Feed) */}
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
              Share your QR code or WhatsApp message with villa guests to receive your first commission.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentReferrals.map((b) => (
              <div key={b.id || b.booking_id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-neutral-900">
                      #{b.booking_id}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      b.commission_status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {b.commission_status}
                    </span>
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
            ))}
          </div>
        )}
      </div>

      {/* 6. Partner Concierge Helper */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 text-white shadow-xs flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400 shrink-0" />
            <span className="text-xs font-bold tracking-tight">Therapick Partner Concierge</span>
          </div>
          <p className="text-[11px] text-neutral-300 truncate">
            Need printed villa QR stands or custom treatments? Chat with our team.
          </p>
        </div>
        <button
          type="button"
          onClick={handleConciergeWhatsApp}
          className="px-3 py-1.5 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 active:scale-95 transition-all shrink-0"
        >
          Chat
        </button>
      </div>

      {/* Full-Screen Native App Calendar Modal */}
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
