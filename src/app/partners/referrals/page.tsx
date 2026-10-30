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
  Sparkles
} from 'lucide-react';

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
  
  // Clean referral URL builder
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
      if (filterStatus !== 'all' && item.commission_status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guest = (item.customer_name || '').toLowerCase();
        const ref = (item.booking_id || '').toLowerCase();
        const treatment = (item.treatment_name || '').toLowerCase();
        if (!guest.includes(q) && !ref.includes(q) && !treatment.includes(q)) {
          return false;
        }
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
    <div className="space-y-4 w-full font-sans pb-12">
      
      {/* 4-KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Link Clicks */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Link Clicks
            </span>
            <MousePointerClick size={14} className="text-[#666666]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171717] font-mono tabular-nums">
            {stats?.totalClicks ?? 0}
          </div>
          <p className="text-[11px] text-[#666666]">Unique visits via your referral link</p>
        </div>

        {/* Attributed Bookings */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Attributed Bookings
            </span>
            <Users size={14} className="text-[#666666]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171717] font-mono tabular-nums">
            {stats?.totalBookings ?? referrals.length}
          </div>
          <p className="text-[11px] text-[#666666]">Guest rituals booked via referral</p>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Conversion Rate
            </span>
            <TrendingUp size={14} className="text-[#16a34a]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#16a34a] font-mono tabular-nums">
            {stats?.conversionRate ?? '0.0'}%
          </div>
          <p className="text-[11px] text-[#666666]">Visitors converted to verified bookings</p>
        </div>

        {/* Total Commission Generated */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#16a34a]">
              Commission Generated
            </span>
            <span className="font-mono text-[10px] text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px] border border-[#16a34a]/20">
              Active
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#16a34a] font-mono tabular-nums">
            {formatIDR(totalCommissionGenerated)}
          </div>
          <p className="text-[11px] text-[#666666]">Attributed earnings from link</p>
        </div>
      </div>

      {/* Main 2-Column CRM Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Official Tools, Link Generator & QR Code Hub (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Unique Referral Link Card */}
          <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 space-y-4 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-[#171717]" />
                <h3 className="font-semibold text-sm text-[#171717]">Unique Referral Link</h3>
              </div>
              <span className="font-mono text-[10px] text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20 font-medium uppercase tracking-[0.071em]">
                {partner?.commission_rate_pct || 10}% Commission
              </span>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Share this link directly with guests, on your villa WhatsApp concierge, or embed it on your website.
            </p>

            {/* Link Box */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb]">
                <input
                  type="text"
                  readOnly
                  value={referralLink || 'Loading link...'}
                  className="w-full text-xs font-mono text-[#171717] bg-transparent outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-[4px] bg-[#171717] hover:bg-black text-white transition-colors cursor-pointer shrink-0"
                  title="Copy Link"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666] font-mono text-[11px]">
                  Partner Code: <strong className="text-[#171717]">{partnerCode || '...'}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-medium text-[#171717] hover:underline cursor-pointer flex items-center gap-1"
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

            {/* Attribution Policy */}
            <div className="p-3 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-[11px] text-[#666666] space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-[#171717]">
                <ShieldCheck size={13} className="text-[#16a34a]" />
                <span>Automated Attribution Protection</span>
              </div>
              <p>
                When a guest opens your link, their session is tagged. When they complete their booking, commission is automatically credited to your portal.
              </p>
            </div>
          </div>

          {/* Official Partner QR Code Card */}
          <div className="bg-white border border-[#ebebeb] rounded-[6px] p-5 space-y-4 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] text-center">
            <div className="flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#171717]" />
                <h3 className="font-semibold text-sm text-[#171717]">Official Partner QR Code</h3>
              </div>
              <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                Print-Ready
              </span>
            </div>

            <p className="text-xs text-[#666666] text-left">
              Place in guest villas, reception desk stands, key card sleeves, or villa digital tablets.
            </p>

            {/* QR Code Container */}
            <div className="p-4 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] inline-block mx-auto">
              {loading || !qrCodeUrl ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img
                  src={qrCodeUrl}
                  alt={`Therapick Partner QR Code - ${partnerCode}`}
                  className="w-48 h-48 rounded-[4px] mx-auto object-contain bg-white p-2 border border-[#ebebeb]"
                />
              )}
              <div className="mt-2 text-center">
                <span className="font-mono text-[11px] font-medium text-[#171717] uppercase tracking-wider">
                  SCAN TO BOOK THERAPICK
                </span>
                <span className="block font-mono text-[10px] text-[#666666]">
                  Ref: {partnerCode}
                </span>
              </div>
            </div>

            {/* QR Download Trigger */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 rounded-[6px] bg-[#171717] hover:bg-black text-white font-mono font-medium text-xs tracking-[0.071em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download size={13} />
                <span>Download High-Res QR Code (PNG)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Attributed Referrals Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter & Search Toolbar */}
          <div className="bg-white border border-[#ebebeb] rounded-[6px] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8f8f8f] pointer-events-none" />
              <input
                type="text"
                placeholder="Search attributed guest or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#ebebeb] rounded-[6px] text-[#171717] placeholder:text-[#8f8f8f] focus:outline-none focus:border-[#171717] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8f8f8f] hover:text-[#171717]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs">
                {['all', 'approved', 'pending', 'paid'].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1 rounded-[4px] capitalize font-mono text-[10px] tracking-[0.05em] uppercase transition-all whitespace-nowrap cursor-pointer ${
                      filterStatus === s
                        ? 'bg-[#171717] text-white shadow-xs font-semibold'
                        : 'text-[#666666] hover:text-[#171717]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadData();
                }}
                disabled={loading}
                className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
                title="Refresh referrals"
                aria-label="Refresh"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Attributed Referrals Table Card */}
          <div className="bg-white border border-[#ebebeb] rounded-[6px] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="p-4 border-b border-[#ebebeb] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[#171717]">Attributed Guest Bookings</h3>
                <p className="text-xs text-[#666666]">Direct conversions attributed to your referral link</p>
              </div>
              <span className="font-mono text-xs text-[#666666]">
                {filteredReferrals.length} referrals
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-mono text-xs text-[#666666]">Loading referral attributions...</div>
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Receipt size={24} className="mx-auto text-[#a8a8a8]" />
                <p className="text-sm font-semibold text-[#171717]">No referrals attributed yet.</p>
                <p className="text-xs text-[#666666] max-w-sm mx-auto">
                  When guests scan your QR code or book through your link, their appointments and commissions will appear here automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="block sm:hidden divide-y divide-[#ebebeb]">
                  {filteredReferrals.map((item, idx) => (
                    <div key={item.id || idx} className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-xs text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          #{item.booking_id}
                        </span>
                        <span className="font-mono text-[11px] text-[#666666]">
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#171717] block">{item.customer_name || 'Guest'}</span>
                          <span className="text-[11px] text-[#666666]">{item.treatment_name || 'Spa Treatment'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-[#16a34a] uppercase block">Commission</span>
                          <span className="font-mono font-bold text-[#16a34a]">
                            +{formatIDR(item.commission_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between">
                        <span className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-[4px] ${
                          item.commission_status === 'paid'
                            ? 'bg-[#171717] text-white'
                            : item.commission_status === 'approved'
                            ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.commission_status}
                        </span>

                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="text-[#171717] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} className="text-[#666666]" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Treatment</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebebeb]">
                      {filteredReferrals.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#666666] whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#171717] whitespace-nowrap">
                            <Link
                              href={`/invoice/${item.booking_id}`}
                              target="_blank"
                              className="hover:underline inline-flex items-center gap-1 group"
                            >
                              <span>#{item.booking_id}</span>
                              <ExternalLink size={10} className="text-[#8f8f8f] group-hover:text-[#171717]" />
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#171717]">
                            {item.customer_name || 'Guest'}
                          </td>
                          <td className="py-3 px-4 text-[#666666] truncate max-w-[150px]">
                            {item.treatment_name || 'Spa Treatment'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#16a34a] whitespace-nowrap">
                            +{formatIDR(item.commission_amount)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-[4px] ${
                              item.commission_status === 'paid'
                                ? 'bg-[#171717] text-white'
                                : item.commission_status === 'approved'
                                ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.commission_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Link
                              href={`/invoice/${item.booking_id}`}
                              target="_blank"
                              className="text-[#171717] font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Invoice</span>
                              <ExternalLink size={10} className="text-[#666666]" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
