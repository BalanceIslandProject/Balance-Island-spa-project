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
  Receipt
} from 'lucide-react';
import { cleanPayoutRef } from '@/components/admin/affiliate/ui';

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
    <div className="space-y-4 w-full font-sans pb-12">
      
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Available Withdrawal Balance */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#16a34a]">
                Available Balance
              </span>
              <span className="font-mono text-[10px] text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px] border border-[#16a34a]/20">
                Cleared
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#16a34a] font-mono tabular-nums mt-1">
              {formatIDR(availableBalance)}
            </div>
            <p className="text-[11px] text-[#666666] mt-0.5">Approved & ready for disbursement</p>
          </div>

          <div className="pt-2">
            <a
              href={whatsappWithdrawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.05em] font-medium transition-colors cursor-pointer ${
                availableBalance > 0
                  ? 'bg-[#171717] hover:bg-black text-white'
                  : 'bg-[#fafafa] text-[#8f8f8f] border border-[#ebebeb] pointer-events-none'
              }`}
            >
              <span>Request Payout</span>
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Total Paid Out
            </span>
            <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb]">
              Settled
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171717] font-mono tabular-nums">
            {formatIDR(totalPaidOut)}
          </div>
          <p className="text-[11px] text-[#666666]">
            Across <strong className="text-[#171717] font-mono">{payouts.length}</strong> disbursements
          </p>
        </div>

        {/* Registered Bank Destination */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Bank Destination
            </span>
            <Link
              href="/partners/profile"
              className="font-mono text-[10px] text-[#171717] hover:underline"
            >
              Edit ↗
            </Link>
          </div>
          <div className="text-base sm:text-lg font-bold text-[#171717] truncate flex items-center gap-1.5">
            <Landmark size={15} className="text-[#666666] shrink-0" />
            <span>{partner?.payout_details?.bank_name || 'BCA'}</span>
            <span className="font-mono font-normal text-xs text-[#666666]">
              {partner?.payout_details?.account_number ? `••${String(partner.payout_details.account_number).slice(-4)}` : 'Not set'}
            </span>
          </div>
          <p className="text-[11px] text-[#666666] truncate">
            {partner?.payout_details?.account_holder || 'Registered partner account'}
          </p>
        </div>

        {/* Settlement Terms */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Settlement Policy
            </span>
            <ShieldCheck size={14} className="text-[#16a34a]" />
          </div>
          <div className="text-sm font-semibold text-[#171717]">
            Direct Bank Transfer
          </div>
          <p className="text-[11px] text-[#666666]">
            Weekly batching or on-demand disbursement with zero transaction fees.
          </p>
        </div>
      </div>

      {/* CRM Toolbar Card */}
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8f8f8f] pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference or payment method..."
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
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="font-mono text-[11px] text-[#666666] hidden sm:inline">
            {filteredPayouts.length} disbursements
          </span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            disabled={loading}
            className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
            title="Refresh payouts"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Table / Cards */}
      <div className="border border-[#ebebeb] rounded-[6px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#666666]">Loading payout history...</div>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet size={24} className="mx-auto text-[#a8a8a8]" />
            <p className="text-sm font-semibold text-[#171717]">No payouts recorded yet.</p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Once your approved commission is withdrawn, official disbursement receipts and transaction references will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#ebebeb]">
              {filteredPayouts.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                      #{cleanPayoutRef(item.payout_reference)}
                    </span>
                    <span className="font-mono text-[11px] text-[#666666]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.071em] block">Method</span>
                      <span className="font-medium text-[#171717] capitalize">{item.payout_method?.replace('_', ' ') || 'Bank Transfer'}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.071em] block">Disbursed</span>
                      <span className="text-sm font-bold text-[#171717] font-mono tabular-nums">{formatIDR(item.amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between text-xs">
                    <span className="border border-[#16a34a]/20 bg-[#16a34a]/10 text-[#16a34a] px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-semibold uppercase">
                      ✓ {item.status || 'COMPLETED'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPayout(item)}
                      className="px-3 py-1.5 bg-[#171717] text-white rounded-[6px] font-mono text-[11px] uppercase tracking-[0.071em] hover:bg-black transition-colors cursor-pointer"
                    >
                      Breakdown &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Amount Disbursed</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Related Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {filteredPayouts.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#171717] whitespace-nowrap">
                        #{cleanPayoutRef(item.payout_reference)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#171717] tabular-nums text-sm whitespace-nowrap">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-[#171717] whitespace-nowrap">
                        {item.payout_method?.replace('_', ' ') || 'Bank Transfer'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="border border-[#16a34a]/20 bg-[#16a34a]/10 text-[#16a34a] px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-semibold uppercase">
                          ✓ {item.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#666666] max-w-[200px] truncate">
                        {item.notes || 'Direct affiliate settlement'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPayout(item)}
                          className="px-3 py-1.5 bg-[#171717] text-white hover:bg-black font-mono text-[11px] uppercase tracking-[0.071em] rounded-[6px] transition-colors cursor-pointer"
                        >
                          View Bookings &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* FULLSCREEN BREAKDOWN DIALOG: SETTLED BOOKINGS & RECEIPT */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-[6px] w-full h-full max-w-5xl max-h-[92vh] flex flex-col border border-[#ebebeb] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-[#ebebeb] text-[#171717] flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-[#171717] text-lg sm:text-xl tracking-tight">
                    Disbursement Breakdown
                  </h3>
                  <span className="font-mono text-xs font-semibold text-[#171717] bg-[#fafafa] px-2.5 py-0.5 rounded-[4px] border border-[#ebebeb]">
                    #{cleanPayoutRef(selectedPayout.payout_reference)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.071em] px-2.5 py-0.5 rounded-[4px] bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20 font-semibold">
                    {selectedPayout.status || 'COMPLETED'}
                  </span>
                </div>
                <div className="text-xs text-[#666666] mt-1 flex items-center gap-2 flex-wrap">
                  <span>Disbursed on: <strong className="text-[#171717] font-mono">{new Date(selectedPayout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  <span>&bull;</span>
                  <span>Method: <strong className="capitalize text-[#171717]">{selectedPayout.payout_method?.replace('_', ' ') || 'Bank Transfer'}</strong></span>
                  {selectedPayout.notes && (
                    <>
                      <span>&bull;</span>
                      <span>Notes: <strong className="text-[#171717]">{selectedPayout.notes}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="font-mono text-[10px] text-[#666666] block uppercase tracking-[0.071em]">Total Disbursed</span>
                  <span className="font-mono text-xl font-bold text-[#16a34a]">
                    {formatIDR(selectedPayout.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="w-8 h-8 rounded-[6px] bg-[#fafafa] hover:bg-[#ebebeb] text-[#171717] border border-[#ebebeb] flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-[#fafafa] border-b border-[#ebebeb] shrink-0 text-xs">
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Payout Amount</span>
                <span className="text-base text-[#16a34a] font-mono font-bold mt-0.5 block">
                  {formatIDR(selectedPayout.amount)}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Settled Bookings</span>
                <span className="text-base text-[#171717] mt-0.5 block font-mono font-bold">
                  {(selectedPayout.items || []).length} bookings
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Total Guest Treatments</span>
                <span className="text-base text-[#171717] font-mono font-bold mt-0.5 block">
                  {formatIDR((selectedPayout.items || []).reduce((sum: number, b: any) => sum + Number(b.eligible_treatment_amount || 0), 0))}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Transfer Method</span>
                <span className="text-sm font-semibold text-[#171717] capitalize mt-0.5 block">
                  {selectedPayout.payout_method?.replace('_', ' ') || 'Bank Transfer'}
                </span>
              </div>
            </div>

            {/* Itemized Bookings List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#171717] text-sm tracking-tight">
                  Settled Referrals & Attributions
                </h4>
                <span className="font-mono text-xs text-[#666666]">
                  {(selectedPayout.items || []).length} bookings settled in this disbursement
                </span>
              </div>

              {(selectedPayout.items || []).length === 0 ? (
                <div className="bg-[#fafafa] p-8 rounded-[6px] border border-[#ebebeb] text-center text-[#666666] space-y-1">
                  <Receipt size={24} className="mx-auto text-[#8f8f8f]" />
                  <p className="font-semibold text-[#171717]">Direct Commission Settlement</p>
                  <p className="text-xs">This disbursement was processed as a direct consolidated transfer of {formatIDR(selectedPayout.amount)}.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[6px] border border-[#ebebeb] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
                      <tr>
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Guest & Location</th>
                        <th className="py-3 px-4">Treatment</th>
                        <th className="py-3 px-4">Net Value</th>
                        <th className="py-3 px-4">Rate</th>
                        <th className="py-3 px-4">Commission Paid</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebebeb]">
                      {selectedPayout.items.map((b: any) => (
                        <tr key={b.id} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-[#171717] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">#{b.booking_id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(b.booking_id, `p-${b.id}`)}
                                className="text-[#8f8f8f] hover:text-[#171717] cursor-pointer"
                                title="Copy booking ID"
                              >
                                {copiedId === `p-${b.id}` ? <Check size={11} className="text-[#16a34a]" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                            {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            {b.booking_time ? ` ${b.booking_time}` : ''}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#171717]">{b.guest_name || 'Guest'}</div>
                            {b.location && (
                              <div className="text-[11px] text-[#666666] flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="text-[#8f8f8f] shrink-0" />
                                <span className="truncate max-w-[140px]">{b.location}</span>
                              </div>
                            )}
                            {b.room_number && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#171717] bg-[#fafafa] border border-[#ebebeb] px-1.5 py-0.5 rounded-[4px]">
                                  <DoorClosed size={10} className="text-[#8f8f8f] shrink-0" />
                                  Room {b.room_number}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#171717] font-medium">{b.treatment_name || 'Spa Treatment'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#171717] whitespace-nowrap">
                            {formatIDR(b.eligible_treatment_amount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#666666] whitespace-nowrap">
                            {b.commission_rate_pct}%
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#16a34a] whitespace-nowrap">
                            +{formatIDR(b.commission_amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] font-mono text-[10px] bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20 font-semibold">
                              <CheckCircle2 size={11} /> Settled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#ebebeb] bg-[#fafafa] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#666666] font-mono">
                Receipt #{cleanPayoutRef(selectedPayout.payout_reference)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-5 py-2 bg-[#171717] text-white font-mono text-[11px] uppercase tracking-[0.071em] rounded-[6px] hover:bg-black transition-colors cursor-pointer"
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
