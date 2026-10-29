'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, Clock, X, Copy, Check, Calendar, ExternalLink, DoorClosed, MapPin, RefreshCw } from 'lucide-react';
import { cleanPayoutRef } from '@/components/admin/affiliate/ui';

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPayouts = async () => {
    try {
      const res = await fetch('/api/affiliates/payouts');
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts || []);
      }
    } catch (e) {
      console.error('Error loading payouts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
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

  return (
    <div className="space-y-4 w-full font-sans pb-12">
      {/* CRM Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 bg-white text-[#171717] border border-[#ebebeb] px-3 py-1.5 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.071em] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
          <span>No Minimum Withdrawal</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            loadPayouts();
          }}
          disabled={loading}
          className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
          title="Refresh payouts"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Table / Cards */}
      <div className="border border-[#ebebeb] rounded-[6px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#666666]">Loading payout history...</div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet size={22} className="mx-auto text-[#8f8f8f]" />
            <p className="text-sm font-medium text-[#171717]">No payouts recorded yet.</p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Once your approved commission is withdrawn, official disbursement receipts will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#ebebeb]">
              {payouts.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                      #{cleanPayoutRef(item.payout_reference)}
                    </span>
                    <span className="font-mono text-[11px] text-[#8f8f8f]">
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
                      <span className="font-normal text-[#171717] capitalize">{item.payout_method.replace('_', ' ')}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.071em] block">Amount</span>
                      <span className="text-sm font-medium text-[#171717] font-mono tabular-nums">{formatIDR(item.amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between text-xs">
                    <span className="border border-[#ebebeb] bg-[#fafafa] text-[#297a3a] px-2 py-0.5 rounded-[4px] font-mono text-[10px] uppercase">
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPayout(item)}
                      className="px-3 py-1.5 bg-[#171717] text-white rounded-[6px] font-mono text-[11px] uppercase tracking-[0.071em] hover:bg-black transition-colors"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-normal uppercase tracking-[0.071em] text-[#666666]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {payouts.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#171717]">
                        {cleanPayoutRef(item.payout_reference)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#171717] tabular-nums text-sm">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-[#171717] font-normal">
                        {item.payout_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="border border-[#ebebeb] bg-[#fafafa] text-[#297a3a] px-2 py-0.5 rounded-[4px] font-mono text-[10px] uppercase">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#666666]">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayout(item)}
                          className="px-3 py-1.5 bg-[#171717] text-white hover:bg-black font-mono text-[11px] uppercase tracking-[0.071em] rounded-[6px] transition-colors"
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

      {/* FULLSCREEN POPUP: PAID OUT BOOKING DETAILS BREAKDOWN */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-[6px] w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col border border-[#ebebeb] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-[#ebebeb] text-[#171717] flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-normal text-[#171717] text-lg sm:text-xl tracking-[-0.03em]">
                    Disbursement Details
                  </h3>
                  <span className="font-mono text-xs text-[#171717] bg-[#fafafa] px-2.5 py-0.5 rounded-[4px] border border-[#ebebeb]">
                    {cleanPayoutRef(selectedPayout.payout_reference)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.071em] px-2.5 py-0.5 rounded-[4px] bg-[#fafafa] text-[#297a3a] border border-[#ebebeb]">
                    {selectedPayout.status || 'COMPLETED'}
                  </span>
                </div>
                <div className="text-xs text-[#666666] mt-1 flex items-center gap-2 flex-wrap">
                  <span>Disbursed on: <strong className="text-[#171717] font-mono">{new Date(selectedPayout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  <span>&bull;</span>
                  <span>Method: <strong className="capitalize text-[#171717]">{selectedPayout.payout_method?.replace('_', ' ')}</strong></span>
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
                  <span className="font-mono text-xl text-[#171717]">
                    {formatIDR(selectedPayout.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="w-8 h-8 rounded-[6px] bg-[#fafafa] hover:bg-[#ebebeb] text-[#171717] border border-[#ebebeb] flex items-center justify-center transition-colors"
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
                <span className="text-base text-[#171717] font-mono mt-0.5 block">
                  {formatIDR(selectedPayout.amount)}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Paid Bookings</span>
                <span className="text-base text-[#171717] mt-0.5 block font-mono">
                  {(selectedPayout.items || []).length} bookings
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Total Guest Treatments</span>
                <span className="text-base text-[#171717] font-mono mt-0.5 block">
                  {formatIDR((selectedPayout.items || []).reduce((sum: number, b: any) => sum + Number(b.eligible_treatment_amount || 0), 0))}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-[6px] border border-[#ebebeb]">
                <span className="font-mono text-[10px] uppercase tracking-[0.071em] text-[#666666] block">Transfer Method</span>
                <span className="text-sm text-[#171717] capitalize mt-0.5 block">
                  {selectedPayout.payout_method?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Itemized Bookings List (Scrollable, Fullscreen) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <h4 className="font-normal text-[#171717] text-sm tracking-tight flex items-center justify-between">
                  <span>Settled Referrals & Bookings</span>
                  <span className="font-mono text-xs text-[#666666]">
                    {(selectedPayout.items || []).length} items included in this disbursement
                  </span>
                </h4>
              </div>

              {(selectedPayout.items || []).length === 0 ? (
                <div className="bg-white p-8 rounded-[6px] border border-[#ebebeb] text-center text-[#666666] space-y-1">
                  <p className="font-medium text-[#171717]">No itemized booking records linked to this receipt.</p>
                  <p className="text-xs">This disbursement was processed as a direct commission settlement of {formatIDR(selectedPayout.amount)}.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[6px] border border-[#ebebeb] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-normal uppercase tracking-[0.071em] text-[#666666]">
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
                              <span>#{b.booking_id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(b.booking_id, `p-${b.id}`)}
                                className="text-[#8f8f8f] hover:text-[#171717]"
                              >
                                {copiedId === `p-${b.id}` ? <Check size={11} className="text-[#297a3a]" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                            {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            {b.booking_time ? ` ${b.booking_time}` : ''}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-normal text-[#171717]">{b.guest_name || 'Guest'}</div>
                            {b.location && (
                              <div className="text-[11px] text-[#666666] flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="text-[#8f8f8f] shrink-0" />
                                <span>{b.location}</span>
                              </div>
                            )}
                            {b.room_number && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#171717] bg-[#fafafa] border border-[#ebebeb] px-1.5 py-0.5 rounded-[4px]">
                                  <DoorClosed size={11} className="text-[#8f8f8f] shrink-0" />
                                  Room {b.room_number}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#171717]">{b.treatment_name || 'Spa Treatment'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#171717]">
                            {formatIDR(b.eligible_treatment_amount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#666666]">
                            {b.commission_rate_pct}%
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#297a3a]">
                            +{formatIDR(b.commission_amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] font-mono text-[10px] bg-[#fafafa] text-[#297a3a] border border-[#ebebeb] whitespace-nowrap">
                              <CheckCircle2 size={11} /> Paid Out
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
                className="px-5 py-2 bg-[#171717] text-white font-mono text-[11px] uppercase tracking-[0.071em] rounded-[6px] hover:bg-black transition-colors"
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

