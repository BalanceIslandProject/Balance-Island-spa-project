'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Copy, 
  Check, 
  QrCode, 
  Coins, 
  Users, 
  MousePointerClick, 
  ExternalLink, 
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download
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

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#736B63]">Loading your partner dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              Welcome back, {profile?.first_name || 'Partner'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                profile?.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {profile?.status}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B645C]">
            {profile?.business_name ? `${profile.business_name} • ` : ''}Partner Code:{' '}
            <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
              {partnerCode}
            </span>{' '}
            • Commission Rate: <span className="font-semibold text-[#1A1A1A]">{profile?.commission_rate_pct || 15}%</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9D1C7] text-xs sm:text-sm font-semibold text-[#1A1A1A] hover:bg-[#F5F2EB] transition-colors shadow-sm"
          >
            <QrCode className="w-4 h-4 text-amber-900" />
            <span>Show QR Code</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-xs sm:text-sm font-semibold hover:bg-[#333] transition-all shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
          </button>
        </div>
      </div>

      {profile?.status === 'pending' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-950 space-y-1">
            <p className="font-semibold">Your partner account is pending admin verification.</p>
            <p className="text-amber-800">
              You can start sharing your referral link and QR code now. Any bookings made through your link will still be automatically tracked and held until verification is complete.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Clicks */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs font-semibold uppercase tracking-wider">Referral Clicks</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1A1A1A]">
            {stats?.totalClicks || 0}
          </p>
          <p className="text-[11px] text-[#736B63]">
            Unique visitors within 30-day cookie window
          </p>
        </div>

        {/* Referred Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs font-semibold uppercase tracking-wider">Bookings Reached</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1A1A1A]">
            {stats?.totalBookings || 0}
          </p>
          <p className="text-[11px] text-[#736B63]">
            Conversion Rate: <span className="font-semibold text-emerald-700">{stats?.conversionRate || 0}%</span>
          </p>
        </div>

        {/* Available Commission */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Commission</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-amber-900">
            {formatIDR(stats?.approvedCommission || 0)}
          </p>
          <p className="text-[11px] text-[#736B63]">
            Pending verification: <span className="font-medium text-[#1A1A1A]">{formatIDR(stats?.pendingCommission || 0)}</span>
          </p>
        </div>

        {/* Paid Earnings */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs font-semibold uppercase tracking-wider">Paid to Date</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1A1A1A]">
            {formatIDR(stats?.paidCommission || 0)}
          </p>
          <p className="text-[11px] text-[#736B63]">
            Transferred directly to your payout account
          </p>
        </div>

      </div>

      {/* Referral Link & Toolset Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">Your Personal Referral Link & QR Code</h2>
            <p className="text-xs sm:text-sm text-[#6B645C]">
              Share this link or print the QR code to track all treatment bookings from your guests and followers.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full flex-1 bg-[#FAF7F2] border border-[#D9D1C7] rounded-xl px-4 py-3 font-mono text-xs sm:text-sm text-[#1A1A1A] select-all truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#333] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shrink-0"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EBE4DA] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">For Villas & Hotel Rooms</h3>
            <p className="text-xs text-[#6B645C] leading-relaxed">
              Print your QR code and place it in the guest welcome directory, villa bedside table, or bathroom mirror. Guests scan with their phone and book in 60 seconds.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EBE4DA] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">For Drivers & Creators</h3>
            <p className="text-xs text-[#6B645C] leading-relaxed">
              Keep a laminated card in your car headrest pocket or add your referral link to your Instagram bio, TikTok bio, or WhatsApp business status.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Commissions Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E8E2D9] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">Recent Referral Commissions</h2>
            <p className="text-xs text-[#6B645C]">Real-time record of bookings attributed to your partner code</p>
          </div>
          <Link
            href="/partners/commissions"
            className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
          >
            View All Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCommissions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Clock className="w-8 h-8 text-[#A89E94] mx-auto" />
            <p className="text-sm font-semibold text-[#1A1A1A]">No commissions recorded yet</p>
            <p className="text-xs text-[#6B645C] max-w-sm mx-auto">
              Share your referral link or display your QR code to start tracking bookings today!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#736B63] font-semibold">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Booking Ref</th>
                  <th className="py-3 px-6">Treatment Net</th>
                  <th className="py-3 px-6">Rate</th>
                  <th className="py-3 px-6">Your Commission</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {recentCommissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {new Date(comm.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-medium text-[#1A1A1A]">
                      #{comm.booking_id}
                    </td>
                    <td className="py-3.5 px-6 text-[#1A1A1A]">
                      {formatIDR(comm.eligible_treatment_amount)}
                    </td>
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {comm.commission_rate_pct}%
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-amber-900">
                      {formatIDR(comm.commission_amount)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          comm.status === 'paid'
                            ? 'bg-purple-50 text-purple-700'
                            : comm.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-6 text-center border border-[#E8E2D9] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Your Custom QR Code</h3>
              <p className="text-xs text-[#6B645C]">Scan to open BookTherapick with your partner attribution</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-[#D9D1C7] inline-block mx-auto shadow-inner">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${partnerCode}`}
                className="w-56 h-56 mx-auto rounded-lg"
              />
            </div>

            <div className="text-xs font-mono text-[#736B63] bg-[#FAF7F2] py-2 px-3 rounded-lg truncate">
              {referralLink}
            </div>

            <div className="flex gap-3">
              <a
                href={qrCodeUrl}
                download={`BookTherapick-QR-${partnerCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download QR
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D9D1C7] text-xs font-semibold text-[#1A1A1A] hover:bg-[#F5F2EB]"
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
