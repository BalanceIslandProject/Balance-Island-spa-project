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
  TrendingUp, 
  Share2, 
  ExternalLink, 
  AlertCircle,
  CalendarDays,
  Clock,
  Sparkles,
  HelpCircle,
  ShieldCheck,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('overview');

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

  // NO MINIMUM WITHDRAWAL:
  // Removed the 250,000 IDR limit so partners can request withdrawal anytime for any approved balance > 0
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
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-black/60 font-semibold tracking-wide">
          Loading partner portal...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7 py-1 max-w-5xl mx-auto">
      
      {/* App Header Banner / Welcome Card */}
      <div className="bg-white border border-black/10 rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/60 bg-black/[0.04] px-2.5 py-1 rounded-full border border-black/5">
                BookTherapick Partner Portal
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Partner
              </span>
              <span className="text-[10px] font-mono text-black/40 hidden sm:inline">
                www.booktherapick.com
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black tracking-tight pt-0.5">
              Welcome, {profile?.first_name || 'Partner'}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {profile?.business_name && (
                <span className="text-xs font-bold uppercase tracking-wider text-black bg-black/[0.03] px-2 py-0.5 rounded border border-black/5">
                  {profile.business_name}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-black/70">
                <span>CODE:</span>
                <span className="text-black bg-black/[0.05] px-2 py-0.5 rounded border border-black/10">
                  {partnerCode.toUpperCase()}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-black/50 hover:text-black transition-colors p-1"
                  title="Copy Partner Code"
                >
                  {copiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <button
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <CalendarDays size={15} className="text-emerald-700" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-bold text-black hover:bg-black/5 active:scale-95 transition-all shadow-xs"
            >
              <QrCode size={15} />
              <span>QR Code</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-95 transition-all shadow-sm"
            >
              {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {profile?.status === 'pending' && (
        <div className="p-4 border border-amber-200 rounded-2xl bg-amber-50/60 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Application Under Review:</span> You can already share your referral link and QR code. All bookings made through your link are actively attributed and recorded to your account.
          </div>
        </div>
      )}

      {/* App Stats & Actions Grid: Approved Commission & Bookings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Approved Commission & Withdraw Card (Span 2) - NO MINIMUM WITHDRAWAL */}
        <div className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-black/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-black/50">
                <Wallet size={14} className="text-black" />
                <span>Approved Commission</span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-black pt-0.5">
                {formatIDR(approvedBalance)}
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs text-black/50">
                  Pending verification: <span className="font-semibold text-black/80">{formatIDR(stats?.pendingCommission || 0)}</span>
                </span>
                <span 
                  className="cursor-pointer text-black/40 hover:text-black transition-colors"
                  title="Commissions become approved upon treatment completion & verification"
                >
                  <HelpCircle size={13} />
                </span>
              </div>
            </div>

            {/* No Min WD Badge */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200 shadow-xs flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-700" />
                No Min. WD • Instant
              </span>
              {hasApprovedBalance && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                  ✓ Ready for Payout
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-black/60 leading-relaxed max-w-sm">
              <span className="font-bold text-black">No minimum balance required.</span> Direct payout requests processed via WhatsApp to your registered bank account or e-wallet.
            </p>

            <button
              onClick={handleWithdrawWhatsApp}
              disabled={!hasApprovedBalance}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm shrink-0 ${
                hasApprovedBalance
                  ? 'bg-black hover:bg-neutral-800 text-white cursor-pointer shadow-md'
                  : 'bg-black/10 text-black/40 cursor-not-allowed'
              }`}
              title={hasApprovedBalance ? 'Request immediate payout via WhatsApp' : 'Approved balance is currently Rp0'}
            >
              <MessageCircle size={16} />
              <span>{hasApprovedBalance ? 'Withdraw via WhatsApp' : 'No Balance to Withdraw'}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Bookings Referred Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-black/50">
                <CalendarCheck size={14} className="text-black" />
                <span>Bookings Referred</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-black/40">TOTAL</span>
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-black pt-0.5">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-black/50 pt-0.5">
              Completed & tracked appointments
            </p>
          </div>

          <div className="pt-3 border-t border-black/10 space-y-2">
            <button
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center justify-between w-full text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 p-2.5 rounded-xl border border-emerald-200 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-emerald-700" />
                <span>Open Booking Calendar</span>
              </span>
              <ArrowUpRight size={14} />
            </button>

            <Link
              href="/partners/referrals"
              className="inline-flex items-center justify-between w-full text-xs font-bold text-black/70 hover:text-black p-1 transition-colors"
            >
              <span>View All Referrals</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

      </div>

      {/* Floating / Inline Calendar Section on Dashboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
              <CalendarDays size={15} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-black">Booking Calendar & Tracker</h2>
              <p className="text-xs text-black/60">Real-time schedule of guest appointments attributed to your code</p>
            </div>
          </div>

          <button
            onClick={() => setCalendarOpen(true)}
            className="text-xs font-bold text-black hover:text-black/70 flex items-center gap-1 border border-black/15 px-3 py-1.5 rounded-xl hover:bg-black/5 transition-all"
          >
            <span>Expand Calendar</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Inline Calendar Widget */}
        <FloatingBookingCalendar 
          bookings={calendarBookings} 
          showFloatingButton={false} 
          inline={true} 
        />
      </div>

      {/* Referral Link & QR Card */}
      <div className="p-5 sm:p-6 border border-black/10 rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-base font-bold text-black">Your Partner Referral Link</h2>
            <p className="text-xs text-black/60">
              Exclusively for <span className="font-mono font-bold text-black">www.booktherapick.com</span>. 30-day cookie window applies automatically.
            </p>
          </div>
          <span className="text-[10px] font-bold text-black/50 bg-black/[0.04] px-2.5 py-1 rounded-full border border-black/5 self-start sm:self-auto">
            15% Treatment Commission
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 bg-black/[0.03] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-black select-all truncate">
            {referralLink}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2.5 rounded-xl border border-black/20 text-xs font-bold text-black hover:bg-black/5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <QrCode size={14} />
              <span>QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Commissions Ledger */}
      <div className="border border-black/10 rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-black">Recent Commissions</h2>
            <p className="text-xs text-black/60">Verified treatment earnings attributed to code #{partnerCode}</p>
          </div>
          <Link
            href="/partners/commissions"
            className="text-xs font-bold text-black hover:underline flex items-center gap-1"
          >
            <span>View All Ledger</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentCommissions.length === 0 ? (
          <div className="p-10 text-center space-y-2 text-black/60">
            <CalendarCheck size={28} className="mx-auto text-black/30" />
            <p className="text-xs font-semibold">No referral commissions recorded yet.</p>
            <p className="text-[11px] text-black/40">Share your link or QR code with guests to start earning!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (screens < 640px) */}
            <div className="block sm:hidden divide-y divide-black/5">
              {recentCommissions.map((comm) => (
                <div key={comm.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black/50 font-medium">
                      {new Date(comm.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {comm.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/invoice/${comm.booking_id}`}
                      target="_blank"
                      className="font-mono font-bold text-xs text-black hover:underline inline-flex items-center gap-1"
                    >
                      <span>#{comm.booking_id}</span>
                      <ExternalLink size={11} className="opacity-50" />
                    </Link>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-800 block">
                        +{formatIDR(comm.commission_amount)}
                      </span>
                      <span className="text-[10px] text-black/50">
                        {comm.commission_rate_pct}% of {formatIDR(comm.eligible_treatment_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (screens >= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] border-b border-black/10 text-black/60 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Treatment Amount</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {recentCommissions.map((comm) => (
                    <tr key={comm.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3 px-4 text-black/60">
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
                          className="inline-flex items-center gap-1 font-mono font-bold text-black hover:text-black/70 hover:underline group"
                          title="View treatment & invoice details"
                        >
                          <span>#{comm.booking_id}</span>
                          <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-black font-medium">
                        {formatIDR(comm.eligible_treatment_amount)}
                      </td>
                      <td className="py-3 px-4 text-black/60">
                        {comm.commission_rate_pct}%
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-800">
                        +{formatIDR(comm.commission_amount)}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-black">
                        <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
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

      {/* Floating Booking Calendar Trigger & Modal */}
      <FloatingBookingCalendar
        bookings={calendarBookings}
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onOpen={() => setCalendarOpen(true)}
        showFloatingButton={true}
      />

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center border border-black/10 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 bg-black/[0.04] px-2.5 py-0.5 rounded-full border border-black/5">
                BookTherapick QR Code
              </span>
              <h3 className="font-serif text-xl font-bold text-black pt-1">Partner QR Code</h3>
              <p className="text-xs text-black/60">Scan to open www.booktherapick.com with code #{partnerCode}</p>
            </div>

            <div className="p-3 border border-black/10 rounded-2xl inline-block bg-white shadow-xs">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${partnerCode}`}
                className="w-52 h-52 mx-auto"
              />
            </div>

            <div className="text-[11px] font-mono text-black/70 bg-black/[0.03] py-2 px-3 rounded-xl border border-black/5 truncate select-all">
              {referralLink}
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={qrCodeUrl}
                download={`BookTherapick-${partnerCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all text-center shadow-xs"
              >
                Download QR
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 rounded-xl border border-black/20 text-xs font-bold text-black hover:bg-black/5 transition-all"
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
