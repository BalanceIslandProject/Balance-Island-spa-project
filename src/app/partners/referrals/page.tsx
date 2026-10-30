'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  X, 
  ShieldCheck, 
  Users, 
  MousePointerClick, 
  TrendingUp, 
  Receipt,
  Calendar,
  Sparkles,
  MoreVertical
} from 'lucide-react';

// Sparkline SVG Component (Kravio style)
function Sparkline({ color = 'green', trend = 'up' }: { color?: 'green' | 'teal' | 'red'; trend?: 'up' | 'down' }) {
  const strokeColor = color === 'green' ? '#16a34a' : color === 'teal' ? '#0d9488' : '#ef4444';
  const fillGradientId = `ref-sparkline-grad-${color}-${trend}`;

  const pathD = trend === 'up'
    ? 'M 0 30 Q 15 28, 25 18 T 50 22 T 75 10 T 100 5'
    : 'M 0 10 Q 20 12, 35 22 T 60 18 T 80 28 T 100 32';

  const areaD = `${pathD} L 100 38 L 0 38 Z`;

  return (
    <svg viewBox="0 0 100 38" className="w-18 h-8 shrink-0 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PartnerReferralsPage() {
  const [partner, setPartner] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadData = async () => {
    try {
      const [meRes, refsRes, statsRes] = await Promise.all([
        fetch('/api/affiliates/auth/me').then((r) => r.json()),
        fetch('/api/affiliates/referrals').then((r) => r.json()),
        fetch('/api/affiliates/stats').then((r) => r.json()),
      ]);

      if (meRes.success) setPartner(meRes.partner || null);
      if (refsRes.success) setReferrals(refsRes.referrals || []);
      if (statsRes.success) setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Error loading referral hub data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const partnerCode = partner?.partner_code || '';
  
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.booktherapick.com';
  const mainOrigin = origin.includes('partners.') 
    ? origin.replace('partners.', 'www.') 
    : 'https://www.booktherapick.com';
  const referralLink = partnerCode ? `${mainOrigin}/?ref=${partnerCode}` : '';
  const qrCodeUrl = referralLink 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}` 
    : '';

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

  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `therapick-partner-qr-${partnerCode || 'code'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(qrCodeUrl, '_blank');
    }
  };

  const filteredReferrals = useMemo(() => {
    return referrals.filter((item) => {
      if (filterStatus !== 'all' && item.commission_status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guest = (item.customer_name || '').toLowerCase();
        const ref = (item.booking_id || '').toLowerCase();
        const treatment = (item.treatment_name || '').toLowerCase();
        if (!guest.includes(q) && !ref.includes(q) && !treatment.includes(q)) return false;
      }
      return true;
    });
  }, [referrals, filterStatus, searchQuery]);

  const totalCommissionGenerated = useMemo(() => {
    return referrals.reduce((sum, item) => {
      if (item.commission_status === 'cancelled') return sum;
      return sum + Number(item.commission_amount || 0);
    }, 0);
  }, [referrals]);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      
      {/* Title & Short Functional Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            Referral Tools & QR Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Share branded links, download high-res guest QR stands, and monitor attribution conversion rates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            loadData();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#e5e7eb] text-xs font-medium text-[#374151] hover:bg-[#f9fafb] shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4-KPI Overview Strip with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Link Clicks */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Link Clicks</span>
            <MousePointerClick size={14} className="text-[#9ca3af]" />
          </div>
          <div className="text-2xl font-bold text-[#111827] font-mono tabular-nums">
            {stats?.totalClicks ?? 0}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
              +14% vs last week
            </span>
            <Sparkline color="teal" trend="up" />
          </div>
        </div>

        {/* Attributed Bookings */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Attributed Bookings</span>
            <Users size={14} className="text-[#9ca3af]" />
          </div>
          <div className="text-2xl font-bold text-[#111827] font-mono tabular-nums">
            {stats?.totalBookings ?? referrals.length}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
              Confirmed Bookings
            </span>
            <Sparkline color="green" trend="up" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#16a34a]">Conversion Rate</span>
            <TrendingUp size={14} className="text-[#16a34a]" />
          </div>
          <div className="text-2xl font-bold text-[#16a34a] font-mono tabular-nums">
            {stats?.conversionRate ?? '0.0'}%
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
              Visitor to Booking
            </span>
            <Sparkline color="green" trend="up" />
          </div>
        </div>

        {/* Commission Generated */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#111827]">Commission Generated</span>
            <Receipt size={14} className="text-[#9ca3af]" />
          </div>
          <div className="text-2xl font-bold text-[#111827] font-mono tabular-nums">
            {formatIDR(totalCommissionGenerated)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-white bg-[#111827] px-1.5 py-0.5 rounded-[4px]">
              Link Revenue
            </span>
            <Sparkline color="teal" trend="up" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Link Tools & Official QR Code */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Unique Referral Link Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-[#111827]" />
                <h3 className="font-semibold text-sm text-[#111827]">Unique Referral Link</h3>
              </div>
              <span className="font-mono text-[10px] text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] font-semibold">
                {partner?.commission_rate_pct || 10}% Commission
              </span>
            </div>

            <p className="text-xs text-[#6b7280]">
              Share this link directly on villa tablets, customer WhatsApp messages, or hotel websites.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb]">
                <input
                  type="text"
                  readOnly
                  value={referralLink || 'Loading link...'}
                  className="w-full text-xs font-mono text-[#111827] bg-transparent outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-[6px] bg-[#111827] hover:bg-black text-white transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280] font-mono text-[11px]">
                  Partner Code: <strong className="text-[#111827]">{partnerCode || '...'}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-medium text-[#111827] hover:underline cursor-pointer"
                >
                  {copiedCode ? (
                    <span className="text-[#16a34a] flex items-center gap-1 font-mono text-[11px]">
                      <Check size={11} /> Copied Code
                    </span>
                  ) : (
                    <span>Copy Code Only</span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] text-[11px] text-[#6b7280] space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-[#111827]">
                <ShieldCheck size={13} className="text-[#16a34a]" />
                <span>30-Day Attribution Window</span>
              </div>
              <p>
                Guests booking within 30 days of opening your link are automatically attributed to your account.
              </p>
            </div>
          </div>

          {/* Official Partner QR Code Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-5 space-y-4 shadow-xs text-center">
            <div className="flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#111827]" />
                <h3 className="font-semibold text-sm text-[#111827]">Official Partner QR Code</h3>
              </div>
              <span className="font-mono text-[10px] text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-[4px]">
                High-Resolution
              </span>
            </div>

            <div className="p-4 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] inline-block mx-auto">
              {loading || !qrCodeUrl ? (
                <div className="w-44 h-44 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#111827] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img
                  src={qrCodeUrl}
                  alt={`Therapick Partner QR Code - ${partnerCode}`}
                  className="w-44 h-44 rounded-[6px] mx-auto object-contain bg-white p-2 border border-[#e5e7eb]"
                />
              )}
              <div className="mt-2 text-center">
                <span className="font-mono text-[11px] font-bold text-[#111827] uppercase tracking-wider">
                  SCAN TO BOOK THERAPICK
                </span>
                <span className="block font-mono text-[10px] text-[#6b7280]">
                  Ref: {partnerCode}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="w-full py-2.5 px-4 rounded-[8px] bg-[#111827] hover:bg-black text-white font-mono font-medium text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Download Official QR Stand (PNG)</span>
            </button>
          </div>

        </div>

        {/* Right Column: Attributed Referrals Table (Kravio SLA Monitoring Style) */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#e5e7eb] rounded-[10px] overflow-hidden shadow-xs h-full flex flex-col justify-between">
            
            <div>
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-[#111827]">Attributed Guest Bookings</h3>
                  <p className="text-xs text-[#6b7280]">Conversions attributed to your referral link & QR</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search guest..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                  <button type="button" className="p-1.5 rounded-[6px] border border-[#e5e7eb] text-[#9ca3af]">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-5 h-5 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="font-mono text-xs text-[#6b7280]">Loading referrals...</div>
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Receipt size={24} className="mx-auto text-[#9ca3af]" />
                  <p className="text-sm font-semibold text-[#111827]">No referrals attributed yet.</p>
                  <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
                    When guests scan your QR code or book through your link, their appointments will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-medium text-[#6b7280]">
                      <tr>
                        <th className="py-3 px-4 w-8">
                          <input type="checkbox" className="rounded-[4px] border-[#d1d5db]" readOnly />
                        </th>
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Treatment</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {filteredReferrals.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-[#f9fafb] transition-colors">
                          <td className="py-3 px-4">
                            <input type="checkbox" defaultChecked={idx === 0} className="rounded-[4px] border-[#d1d5db]" />
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#111827]">
                            <Link href={`/invoice/${item.booking_id}`} target="_blank" className="hover:underline">
                              #{item.booking_id}
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#111827]">
                            {item.customer_name || 'Guest'}
                          </td>
                          <td className="py-3 px-4 text-[#6b7280] truncate max-w-[140px]">
                            {item.treatment_name || 'Spa Treatment'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#16a34a] whitespace-nowrap">
                            +{formatIDR(item.commission_amount)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.commission_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Link href={`/invoice/${item.booking_id}`} target="_blank" className="hover:underline font-semibold text-[#111827]">
                              Invoice ↗
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#f9fafb] border-t border-[#e5e7eb] text-xs text-[#6b7280] flex items-center justify-between">
              <span>{filteredReferrals.length} active referrals</span>
              <span className="font-mono text-[#16a34a] font-bold">Total: {formatIDR(totalCommissionGenerated)}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
