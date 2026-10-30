'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  CheckCircle2, 
  Clock, 
  X, 
  Copy, 
  Check, 
  Calendar, 
  ExternalLink, 
  DoorClosed, 
  MapPin, 
  RefreshCw,
  Search,
  Landmark,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  MoreVertical,
  Filter
} from 'lucide-react';
import { cleanPayoutRef } from '@/components/admin/affiliate/ui';

// Sparkline SVG Component (Kravio style)
function Sparkline({ color = 'green', trend = 'up' }: { color?: 'green' | 'teal' | 'red'; trend?: 'up' | 'down' }) {
  const strokeColor = color === 'green' ? '#16a34a' : color === 'teal' ? '#0d9488' : '#ef4444';
  const fillGradientId = `payout-sparkline-grad-${color}-${trend}`;

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

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    try {
      const [payoutsRes, meRes, statsRes] = await Promise.all([
        fetch('/api/affiliates/payouts').then((r) => r.json()),
        fetch('/api/affiliates/auth/me').then((r) => r.json()),
        fetch('/api/affiliates/stats').then((r) => r.json()),
      ]);

      if (payoutsRes.success) setPayouts(payoutsRes.payouts || []);
      if (meRes.success) setPartner(meRes.partner || null);
      if (statsRes.success) setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Error loading payout data:', e);
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalPaidOut = useMemo(() => {
    return payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payouts]);

  const availableBalance = stats?.availableForPayout ?? 0;

  const filteredPayouts = useMemo(() => {
    if (!searchQuery.trim()) return payouts;
    const q = searchQuery.toLowerCase();
    return payouts.filter((p) => {
      const ref = (p.payout_reference || '').toLowerCase();
      const method = (p.payout_method || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      return ref.includes(q) || method.includes(q) || notes.includes(q);
    });
  }, [payouts, searchQuery]);

  const whatsappWithdrawUrl = `https://wa.me/6285174119423?text=${encodeURIComponent(
    `Hello Therapick Finance, I would like to request a payout withdrawal for partner account (${partner?.business_name || partner?.first_name || 'Partner'} - Code: ${partner?.partner_code || ''}). Available balance: IDR ${new Intl.NumberFormat('id-ID').format(availableBalance)}`
  )}`;

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      
      {/* Title & Short Functional Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            Payouts & Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Manage your withdrawal balance, bank destinations, and historical transfer receipts.
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

      {/* 3 Horizontal Kravio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#16a34a]">Available Balance</span>
              <Wallet size={14} className="text-[#16a34a]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#16a34a] font-mono tabular-nums mt-1 tracking-tight">
              {formatIDR(availableBalance)}
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
              Ready to withdraw
            </span>
            <a
              href={whatsappWithdrawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                availableBalance > 0
                  ? 'bg-[#111827] text-white hover:bg-black shadow-xs'
                  : 'bg-[#f3f4f6] text-[#9ca3af] pointer-events-none'
              }`}
            >
              <span>Request Payout</span>
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Total Paid Out</span>
            <ShieldCheck size={14} className="text-[#9ca3af]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#111827] font-mono tabular-nums tracking-tight">
            {formatIDR(totalPaidOut)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-[#111827] bg-[#f3f4f6] px-1.5 py-0.5 rounded-[4px]">
              {payouts.length} Disbursements
            </span>
            <Sparkline color="teal" trend="up" />
          </div>
        </div>

        {/* Registered Bank Destination */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Bank Destination</span>
              <Landmark size={14} className="text-[#9ca3af]" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#111827] mt-1 flex items-center gap-1.5">
              <span>{partner?.payout_details?.bank_name || 'BCA'}</span>
              <span className="font-mono text-xs font-normal text-[#6b7280]">
                {partner?.payout_details?.account_number ? `••${String(partner.payout_details.account_number).slice(-4)}` : 'Not set'}
              </span>
            </div>
            <p className="text-[11px] text-[#6b7280] truncate mt-0.5">
              {partner?.payout_details?.account_holder || 'Registered account'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#6b7280]">Indonesian Bank Transfer</span>
            <Link href="/partners/profile" className="font-medium text-[#111827] hover:underline">
              Edit Bank ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Kravio Data Table Card (SLA Monitoring Style) */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] overflow-hidden shadow-xs">
        
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#9ca3af]" />
            <h3 className="text-sm font-semibold text-[#111827]">Disbursement History</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <input
                type="text"
                placeholder="Search reference or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111827]"
              />
            </div>

            <button
              type="button"
              className="p-1.5 text-[#9ca3af] hover:text-[#111827] rounded-[6px] border border-[#e5e7eb]"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#6b7280]">Loading payout records...</div>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet size={24} className="mx-auto text-[#9ca3af]" />
            <p className="text-sm font-semibold text-[#111827]">No payouts recorded yet.</p>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              Once your approved commission is disbursed, official receipts and transaction references will appear here.
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
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount Disbursed</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Related Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filteredPayouts.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3.5 px-4">
                      <input type="checkbox" defaultChecked={idx === 0} className="rounded-[4px] border-[#d1d5db]" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6b7280] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#111827] whitespace-nowrap">
                      #{cleanPayoutRef(item.payout_reference)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111827] tabular-nums whitespace-nowrap">
                      {formatIDR(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-[#111827] whitespace-nowrap">
                      {item.payout_method?.replace('_', ' ') || 'Bank Transfer'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-semibold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {item.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280] max-w-[200px] truncate">
                      {item.notes || 'Direct affiliate settlement'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPayout(item)}
                        className="px-3 py-1.5 bg-[#111827] text-white hover:bg-black font-mono text-[11px] uppercase tracking-wider rounded-[6px] transition-colors cursor-pointer"
                      >
                        Breakdown &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULLSCREEN BREAKDOWN MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-[10px] w-full max-w-5xl max-h-[92vh] flex flex-col border border-[#e5e7eb] shadow-xl overflow-hidden font-sans">
            <div className="p-4 sm:p-5 bg-white border-b border-[#e5e7eb] flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[#111827] text-lg">
                    Disbursement Breakdown
                  </h3>
                  <span className="font-mono text-xs font-semibold text-[#111827] bg-[#f3f4f6] px-2 py-0.5 rounded-[4px]">
                    #{cleanPayoutRef(selectedPayout.payout_reference)}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {selectedPayout.status || 'COMPLETED'}
                  </span>
                </div>
                <p className="text-xs text-[#6b7280] mt-1">
                  Disbursed on {new Date(selectedPayout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} via {selectedPayout.payout_method?.replace('_', ' ') || 'Bank Transfer'}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-8 h-8 rounded-[6px] hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick KPI Strip inside modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f9fafb] border-b border-[#e5e7eb] text-xs shrink-0">
              <div className="bg-white p-3 rounded-[8px] border border-[#e5e7eb]">
                <span className="text-[10px] text-[#6b7280] block font-medium">Disbursed Amount</span>
                <span className="text-base font-bold text-[#16a34a] font-mono mt-0.5 block">{formatIDR(selectedPayout.amount)}</span>
              </div>
              <div className="bg-white p-3 rounded-[8px] border border-[#e5e7eb]">
                <span className="text-[10px] text-[#6b7280] block font-medium">Settled Bookings</span>
                <span className="text-base font-bold text-[#111827] font-mono mt-0.5 block">{(selectedPayout.items || []).length} bookings</span>
              </div>
              <div className="bg-white p-3 rounded-[8px] border border-[#e5e7eb]">
                <span className="text-[10px] text-[#6b7280] block font-medium">Total Guest Volume</span>
                <span className="text-base font-bold text-[#111827] font-mono mt-0.5 block">
                  {formatIDR((selectedPayout.items || []).reduce((sum: number, b: any) => sum + Number(b.eligible_treatment_amount || 0), 0))}
                </span>
              </div>
              <div className="bg-white p-3 rounded-[8px] border border-[#e5e7eb]">
                <span className="text-[10px] text-[#6b7280] block font-medium">Transfer Method</span>
                <span className="text-sm font-semibold text-[#111827] capitalize mt-0.5 block">{selectedPayout.payout_method?.replace('_', ' ') || 'Bank Transfer'}</span>
              </div>
            </div>

            {/* Modal Body: Itemized Bookings Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <h4 className="font-semibold text-xs text-[#111827]">Settled Referrals</h4>
              {(selectedPayout.items || []).length === 0 ? (
                <div className="bg-[#f9fafb] p-8 rounded-[8px] border border-[#e5e7eb] text-center text-xs text-[#6b7280]">
                  Direct commission settlement of {formatIDR(selectedPayout.amount)}.
                </div>
              ) : (
                <div className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-medium text-[#6b7280]">
                      <tr>
                        <th className="py-2.5 px-3">Booking Ref</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Guest</th>
                        <th className="py-2.5 px-3">Treatment</th>
                        <th className="py-2.5 px-3">Net Value</th>
                        <th className="py-2.5 px-3">Rate</th>
                        <th className="py-2.5 px-3">Commission Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {selectedPayout.items.map((b: any) => (
                        <tr key={b.id} className="hover:bg-[#f9fafb]">
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#111827]">#{b.booking_id}</td>
                          <td className="py-2.5 px-3 font-mono text-[#6b7280]">{b.booking_date || '-'}</td>
                          <td className="py-2.5 px-3 font-medium text-[#111827]">{b.guest_name || 'Guest'}</td>
                          <td className="py-2.5 px-3 text-[#6b7280]">{b.treatment_name || 'Spa Treatment'}</td>
                          <td className="py-2.5 px-3 font-mono text-[#111827]">{formatIDR(b.eligible_treatment_amount)}</td>
                          <td className="py-2.5 px-3 font-mono text-[#6b7280]">{b.commission_rate_pct}%</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#16a34a]">+{formatIDR(b.commission_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-1.5 rounded-[6px] bg-[#111827] text-white text-xs font-semibold hover:bg-black transition-colors"
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
