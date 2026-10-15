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
  Sparkles,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Send
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

  const handleSupportWhatsApp = () => {
    const partnerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Partner';
    const message = `*BOOKTHERAPICK • PARTNER SUPPORT*
──────────────────────
Hello BookTherapick Team, I am partner ${partnerName} (${partnerCode}). I have a question regarding my bookings or account:`;
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
      <div className="py-28 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-neutral-500 font-medium">
          Loading partner workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Header & Welcome Section */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200/60">
                Partner Workspace
              </span>
              {profile?.status === 'pending' ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  <Clock size={11} className="text-amber-600" />
                  Reviewing Application
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Partner
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
                Welcome, {profile?.first_name || 'Partner'}
              </h1>
              {profile?.business_name && (
                <span className="text-xs font-semibold text-neutral-500">
                  ({profile.business_name})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5 text-xs text-neutral-600">
              <span className="text-neutral-500 text-[11px] uppercase font-semibold">Your Referral Code:</span>
              <div className="inline-flex items-center gap-1.5 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 font-mono font-bold text-neutral-900">
                <span>{partnerCode.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-neutral-400 hover:text-neutral-900 transition-colors p-0.5"
                  title="Copy partner code"
                >
                  {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Top Quick Action Toolbar */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 text-xs font-semibold transition-all active:scale-95 shadow-2xs"
            >
              <CalendarDays size={14} className="text-neutral-600" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all shadow-2xs"
            >
              <QrCode size={14} className="text-neutral-600" />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs"
            >
              {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile-Only Quick Action Grid (4-button dock) */}
      <div className="grid grid-cols-4 gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs active:scale-95 transition-transform"
        >
          <CalendarDays size={17} className="text-neutral-800 mb-1" />
          <span className="text-[10px] font-semibold text-neutral-900">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs active:scale-95 transition-transform"
        >
          <QrCode size={17} className="text-neutral-800 mb-1" />
          <span className="text-[10px] font-semibold text-neutral-900">QR Code</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-neutral-200/80 shadow-2xs active:scale-95 transition-transform"
        >
          {copiedLink ? <Check size={17} className="text-emerald-600 mb-1" /> : <Share2 size={17} className="text-neutral-800 mb-1" />}
          <span className="text-[10px] font-semibold text-neutral-900">{copiedLink ? 'Copied' : 'Share'}</span>
        </button>

        <button
          type="button"
          onClick={handleWithdrawWhatsApp}
          disabled={!hasApprovedBalance}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border shadow-2xs active:scale-95 transition-transform ${
            hasApprovedBalance
              ? 'bg-neutral-950 text-white border-neutral-950'
              : 'bg-white text-neutral-400 border-neutral-200/80 opacity-60'
          }`}
        >
          <MessageCircle size={17} className={hasApprovedBalance ? 'text-white mb-1' : 'text-neutral-400 mb-1'} />
          <span className="text-[10px] font-semibold">Withdraw</span>
        </button>
      </div>

      {profile?.status === 'pending' && (
        <div className="p-3.5 border border-amber-200 rounded-xl bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Application Under Review:</span> You can already share your referral link and QR code. All bookings made through your link are actively attributed and recorded to your account.
          </div>
        </div>
      )}

      {/* 2. Key Metrics & Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Approved Balance Card (Spans 2 columns on desktop) */}
        <div className="md:col-span-2 p-4 sm:p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                <Wallet size={13.5} className="text-neutral-700" />
                <span>Approved Commission Balance</span>
              </div>
              <div className="text-2xl sm:text-4xl font-bold text-neutral-950 font-mono tracking-tight tabular-nums pt-0.5">
                {formatIDR(approvedBalance)}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 pt-0.5">
                <span>
                  Pending verification: <span className="font-semibold text-neutral-800 font-mono tabular-nums">{formatIDR(stats?.pendingCommission || 0)}</span>
                </span>
                <span 
                  className="cursor-pointer text-neutral-400 hover:text-neutral-800 transition-colors"
                  title="Commissions become approved upon treatment completion & admin verification"
                >
                  <HelpCircle size={13} />
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                <Sparkles size={11} className="text-neutral-600" />
                <span>No Min. Withdrawal</span>
              </span>
              {hasApprovedBalance && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready for Payout
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
              <span className="font-semibold text-neutral-800">Direct WhatsApp payout.</span> Request disbursement anytime to your registered bank account or e-wallet without payout thresholds.
            </p>

            <button
              type="button"
              onClick={handleWithdrawWhatsApp}
              disabled={!hasApprovedBalance}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-95 shadow-2xs shrink-0 ${
                hasApprovedBalance
                  ? 'bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
              }`}
              title={hasApprovedBalance ? 'Request immediate payout via WhatsApp' : 'Approved balance is currently Rp0'}
            >
              <MessageCircle size={14} />
              <span>{hasApprovedBalance ? 'Withdraw via WhatsApp' : 'No Balance to Withdraw'}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Referred Bookings Count Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                <CalendarCheck size={13.5} className="text-neutral-700" />
                <span>Total Bookings</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">TRACKED</span>
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-neutral-950 font-mono tracking-tight tabular-nums pt-0.5">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-neutral-500 pt-0.5">
              Completed & verified appointments
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-100 space-y-1.5">
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center justify-between w-full text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 p-2 rounded-lg border border-neutral-200/80 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13.5} className="text-neutral-700" />
                <span>Open Calendar Tracker</span>
              </span>
              <ArrowUpRight size={13} />
            </button>

            <Link
              href="/partners/referrals"
              className="inline-flex items-center justify-between w-full text-xs font-medium text-neutral-600 hover:text-neutral-950 p-1 transition-colors"
            >
              <span>View All Referrals</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

      </div>

      {/* 3. Booking Calendar & Tracker (Inline Widget) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-950 text-white flex items-center justify-center font-bold text-xs">
              <CalendarDays size={13} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-950">Booking Calendar & Tracker</h2>
              <p className="text-xs text-neutral-500 hidden sm:block">Real-time schedule of appointments attributed to your code</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="text-xs font-semibold text-neutral-800 hover:text-neutral-950 flex items-center gap-1 border border-neutral-200 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-all bg-white shadow-2xs"
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

      {/* 4. Referral Link & QR Code Card */}
      <div className="p-4 sm:p-6 border border-neutral-200/80 rounded-2xl bg-white shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-950">Partner Referral Link</h2>
            <p className="text-xs text-neutral-500">
              Share with villa guests & clients for <span className="font-mono text-neutral-800">www.booktherapick.com</span>. 30-day cookie window applies automatically.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200/60 self-start sm:self-auto">
            15% Treatment Commission
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 select-all truncate">
            {referralLink}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 bg-white shadow-2xs"
            >
              <QrCode size={13} />
              <span>QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Commissions Ledger */}
      <div className="border border-neutral-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-950">Recent Commission Ledger</h2>
            <p className="text-xs text-neutral-500">Verified treatment earnings attributed to code #{partnerCode}</p>
          </div>
          <Link
            href="/partners/commissions"
            className="text-xs font-semibold text-neutral-800 hover:text-neutral-950 hover:underline flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {recentCommissions.length === 0 ? (
          <div className="p-10 text-center space-y-2 text-neutral-500">
            <CalendarCheck size={24} className="mx-auto text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-800">No referral commissions recorded yet.</p>
            <p className="text-[11px] text-neutral-500">Share your link or QR code with guests to start earning!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {recentCommissions.map((comm) => (
                <div key={comm.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {new Date(comm.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="border border-neutral-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-50">
                      {comm.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/invoice/${comm.booking_id}`}
                      target="_blank"
                      className="font-mono font-bold text-xs text-neutral-900 hover:underline inline-flex items-center gap-1"
                    >
                      <span>#{comm.booking_id}</span>
                      <ExternalLink size={10} className="text-neutral-400" />
                    </Link>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 block font-mono tabular-nums">
                        +{formatIDR(comm.commission_amount)}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {comm.commission_rate_pct}% of {formatIDR(comm.eligible_treatment_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/60 border-b border-neutral-200/80 text-neutral-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Treatment Amount</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentCommissions.map((comm) => (
                    <tr key={comm.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 text-neutral-500">
                        {new Date(comm.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoice/${comm.booking_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono font-bold text-neutral-900 hover:underline group"
                          title="View treatment & invoice details"
                        >
                          <span>#{comm.booking_id}</span>
                          <ExternalLink size={11} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-neutral-800 font-medium font-mono tabular-nums">
                        {formatIDR(comm.eligible_treatment_amount)}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 font-mono">
                        {comm.commission_rate_pct}%
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono tabular-nums">
                        +{formatIDR(comm.commission_amount)}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium">
                        <span className="border border-neutral-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-50">
                          {comm.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Floating Booking Calendar Trigger Modal */}
      <FloatingBookingCalendar
        bookings={calendarBookings}
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onOpen={() => setCalendarOpen(true)}
        showFloatingButton={true}
      />

      {/* QR Code Modal Dialog */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center border border-neutral-200/80 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                Partner QR
              </span>
              <h3 className="text-lg font-bold text-neutral-950 pt-0.5">Partner QR Code</h3>
              <p className="text-xs text-neutral-500">Scan to open www.booktherapick.com with code #{partnerCode}</p>
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
