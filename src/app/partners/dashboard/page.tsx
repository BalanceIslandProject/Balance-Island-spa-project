'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
      <div className="py-20 text-center text-xs text-black/60">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black">
            Welcome, {profile?.first_name || 'Partner'}
          </h1>
          <p className="text-xs text-black/60">
            {profile?.business_name ? `${profile.business_name} &bull; ` : ''}
            Partner Code: <span className="font-mono font-bold text-black">{partnerCode}</span> &bull; Rate: <span className="font-bold text-black">{profile?.commission_rate_pct || 15}%</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-4 py-2 rounded-lg border border-black/20 text-xs font-semibold text-black hover:bg-black/5 transition-colors"
          >
            Show QR Code
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-black/80 transition-colors"
          >
            {copiedLink ? 'Copied Link' : 'Copy Referral Link'}
          </button>
        </div>
      </div>

      {profile?.status === 'pending' && (
        <div className="p-4 border border-black/20 rounded-xl bg-black/[0.02] text-xs text-black/80">
          <span className="font-bold">Application Pending Review:</span> You can already share your referral link and QR code. All bookings made through your link will be tracked and credited to your account upon review.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 border border-black/10 rounded-2xl bg-white space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-black/50 block">
            Clicks
          </span>
          <div className="text-2xl font-serif font-bold text-black">
            {stats?.totalClicks || 0}
          </div>
          <span className="text-[11px] text-black/50 block">Visitor clicks</span>
        </div>

        <div className="p-5 border border-black/10 rounded-2xl bg-white space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-black/50 block">
            Bookings
          </span>
          <div className="text-2xl font-serif font-bold text-black">
            {stats?.totalBookings || 0}
          </div>
          <span className="text-[11px] text-black/50 block">
            Conv. rate: {stats?.conversionRate || 0}%
          </span>
        </div>

        <div className="p-5 border border-black/10 rounded-2xl bg-white space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-black/50 block">
            Approved Commission
          </span>
          <div className="text-2xl font-serif font-bold text-black">
            {formatIDR(stats?.approvedCommission || 0)}
          </div>
          <span className="text-[11px] text-black/50 block">
            Pending: {formatIDR(stats?.pendingCommission || 0)}
          </span>
        </div>

        <div className="p-5 border border-black/10 rounded-2xl bg-white space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-black/50 block">
            Paid to Date
          </span>
          <div className="text-2xl font-serif font-bold text-black">
            {formatIDR(stats?.paidCommission || 0)}
          </div>
          <span className="text-[11px] text-black/50 block">Total settled</span>
        </div>

      </div>

      {/* Referral Link Box */}
      <div className="p-6 border border-black/10 rounded-2xl bg-white space-y-3">
        <div>
          <h2 className="font-serif text-base font-bold text-black">Your Referral Link</h2>
          <p className="text-xs text-black/60">Share this link with guests or followers. 30-day tracking window applies.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-black/[0.03] border border-black/10 rounded-lg px-3 py-2 text-xs font-mono text-black select-all truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-black/80 transition-colors"
          >
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Recent Commissions */}
      <div className="border border-black/10 rounded-2xl bg-white overflow-hidden space-y-0">
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
