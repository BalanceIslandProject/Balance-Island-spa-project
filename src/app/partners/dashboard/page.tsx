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
  Share2
} from 'lucide-react';

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
  const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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
          setRecentCommissions(statsData.recentCommissions || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const partnerCode = profile?.partner_code || '';
  const referralLink = `https://www.booktherapick.com/?ref=${partnerCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWithdrawWhatsApp = () => {
    const partnerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Partner';
    const approvedAmt = formatIDR(stats?.approvedCommission || 0);

    const message = `*BOOKTHERAPICK • PARTNER WITHDRAWAL REQUEST*
──────────────────────
Hello BookTherapick Admin, I would like to request a withdrawal for my approved affiliate commission:

👤 *Partner Name:* ${partnerName}
🏷️ *Partner Code:* ${partnerCode || '-'}
💰 *Approved Commission:* ${approvedAmt}

Please verify and process the payout to my registered payment method. Thank you!`;

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
      <div className="py-20 text-center text-xs text-black/60 font-medium">
        Loading partner portal...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 py-1 max-w-5xl mx-auto">
      
      {/* App Header Banner */}
      <div className="bg-white border border-black/10 rounded-3xl p-5 sm:p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 bg-black/[0.04] px-2.5 py-0.5 rounded-full border border-black/5">
                Partner Portal
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Partner
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black tracking-tight pt-1">
              Welcome, {profile?.first_name || 'Partner'}
            </h1>
            <p className="text-xs text-black/60">
              {profile?.business_name ? `${profile.business_name} • ` : ''}
              Partner Code: <span className="font-mono font-bold text-black">{partnerCode}</span> • Rate: <span className="font-bold text-black">{profile?.commission_rate_pct || 15}%</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-black/20 text-xs font-bold text-black hover:bg-black/5 active:scale-95 transition-all"
            >
              <QrCode size={15} />
              <span>QR Code</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-black/85 active:scale-95 transition-all shadow-sm"
            >
              {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {profile?.status === 'pending' && (
        <div className="p-4 border border-black/20 rounded-2xl bg-black/[0.02] text-xs text-black/80">
          <span className="font-bold">Application Pending Review:</span> You can already share your referral link and QR code. All bookings made through your link will be tracked and credited to your account upon review.
        </div>
      )}

      {/* App Stats & Actions Grid: Approved Commission & Bookings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Approved Commission & Withdraw Card (Span 2) */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-black/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between gap-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-black/50">
                <Wallet size={14} className="text-black" />
                <span>Approved Commission</span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-black pt-1">
                {formatIDR(stats?.approvedCommission || 0)}
              </div>
              <p className="text-xs text-black/50 pt-0.5">
                Pending verification: <span className="font-semibold text-black/70">{formatIDR(stats?.pendingCommission || 0)}</span>
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              Ready for Payout
            </div>
          </div>

          <div className="pt-2 border-t border-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-black/60">
              Payouts processed directly to your registered bank / account details.
            </p>
            <button
              onClick={handleWithdrawWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-black/85 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm shrink-0"
            >
              <MessageCircle size={16} />
              <span>Withdraw via WhatsApp</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-black/50">
              <CalendarCheck size={14} className="text-black" />
              <span>Bookings Referred</span>
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-black pt-1">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-black/50 pt-0.5">
              Completed guest appointments
            </p>
          </div>

          <div className="pt-3 border-t border-black/10">
            <Link
              href="/partners/referrals"
              className="inline-flex items-center justify-between w-full text-xs font-bold text-black hover:opacity-75 transition-opacity"
            >
              <span>View Referrals</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

      </div>

      {/* Referral Link Box */}
      <div className="p-6 border border-black/10 rounded-3xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] space-y-3">
        <div>
          <h2 className="font-serif text-base font-bold text-black">Your Referral Link</h2>
          <p className="text-xs text-black/60">Share this link with guests or followers. 30-day tracking window applies.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 bg-black/[0.03] border border-black/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-black select-all truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-black/85 active:scale-95 transition-all shadow-sm"
          >
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Recent Commissions */}
      <div className="border border-black/10 rounded-3xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-black">Recent Commissions</h2>
            <p className="text-xs text-black/60">Appointments attributed to your partner code</p>
          </div>
          <Link
            href="/partners/commissions"
            className="text-xs font-semibold text-black hover:underline"
          >
            View All &rarr;
          </Link>
        </div>

        {recentCommissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-black/50">
            No referral commissions recorded yet. Share your link or QR code to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  <tr key={comm.id} className="hover:bg-black/[0.01]">
                    <td className="py-3 px-4 text-black/60">
                      {new Date(comm.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-black">
                      #{comm.booking_id}
                    </td>
                    <td className="py-3 px-4 text-black">
                      {formatIDR(comm.eligible_treatment_amount)}
                    </td>
                    <td className="py-3 px-4 text-black/60">
                      {comm.commission_rate_pct}%
                    </td>
                    <td className="py-3 px-4 font-bold text-black">
                      {formatIDR(comm.commission_amount)}
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-black">
                      <span className="border border-black/20 px-2 py-0.5 rounded text-[10px]">
                        {comm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center border border-black/10 shadow-lg">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-black">Partner QR Code</h3>
              <p className="text-xs text-black/60">Scan to open BookTherapick with your code attached</p>
            </div>

            <div className="p-3 border border-black/10 rounded-xl inline-block bg-white">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${partnerCode}`}
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs font-mono text-black/60 bg-black/[0.03] py-2 px-3 rounded truncate">
              {referralLink}
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={qrCodeUrl}
                download={`BookTherapick-${partnerCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-black/80 text-center"
              >
                Download Image
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-lg border border-black/20 text-xs font-semibold text-black hover:bg-black/5"
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
