'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, Clock, X, Copy, Check, Calendar, ExternalLink } from 'lucide-react';

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayouts() {
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
    }
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
        <div className="inline-flex items-center gap-1.5 bg-white text-black border border-[#E5E5E5] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
          <span>No Minimum Withdrawal</span>
        </div>
      </div>

      {/* Main Table / Cards */}
      <div className="border border-[#E5E5E5] rounded-xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-[#737373] font-medium">Loading payout history...</div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet size={24} className="mx-auto text-[#737373]/40" />
            <p className="text-sm font-semibold text-black">No payouts recorded yet.</p>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Once your approved commission is withdrawn, official disbursement receipts will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#E5E5E5]">
              {payouts.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-black bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                      #{item.payout_reference}
                    </span>
                    <span className="text-xs text-[#737373]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#737373] uppercase block font-semibold">Method</span>
                      <span className="font-medium text-black capitalize">{item.payout_method.replace('_', ' ')}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#737373] uppercase block font-semibold">Amount</span>
                      <span className="text-sm font-bold text-black font-mono tabular-nums">{formatIDR(item.amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                    <span className="border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold">
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPayout(item)}
                      className="px-3 py-1.5 bg-black text-white rounded-lg font-semibold text-xs hover:bg-neutral-800 transition-colors"
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
                <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
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
                <tbody className="divide-y divide-[#E5E5E5]">
                  {payouts.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3.5 px-4 text-[#737373] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-black">
                        {item.payout_reference}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-black font-mono tabular-nums text-sm">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-black font-medium">
                        {item.payout_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#737373]">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayout(item)}
                          className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 font-semibold rounded-lg text-xs transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-xl w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col border border-[#E5E5E5] shadow-xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-[#E5E5E5] text-black flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-black text-lg sm:text-xl tracking-tight">
                    Disbursement Details
                  </h3>
                  <span className="font-mono font-bold text-black bg-[#F5F5F5] px-2.5 py-0.5 rounded-md text-xs border border-[#E5E5E5]">
                    {selectedPayout.payout_reference}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedPayout.status || 'COMPLETED'}
                  </span>
                </div>
                <div className="text-xs text-[#737373] mt-1 flex items-center gap-2 flex-wrap">
                  <span>Disbursed on: <strong className="text-black">{new Date(selectedPayout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  <span>&bull;</span>
                  <span>Method: <strong className="capitalize text-black">{selectedPayout.payout_method?.replace('_', ' ')}</strong></span>
                  {selectedPayout.notes && (
                    <>
                      <span>&bull;</span>
                      <span>Notes: <strong className="text-black">{selectedPayout.notes}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-[#737373] block font-semibold uppercase tracking-wider">Total Disbursed</span>
                  <span className="font-mono font-bold text-xl text-black">
                    {formatIDR(selectedPayout.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="w-8 h-8 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E5E5] text-black flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-[#FAFAFA] border-b border-[#E5E5E5] shrink-0 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-[#E5E5E5]">
                <span className="text-[10px] uppercase font-semibold text-[#737373] block">Payout Amount</span>
                <span className="text-base font-bold text-black font-mono mt-0.5 block">
                  {formatIDR(selectedPayout.amount)}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-[#E5E5E5]">
                <span className="text-[10px] uppercase font-semibold text-[#737373] block">Paid Bookings</span>
                <span className="text-base font-bold text-black mt-0.5 block">
                  {(selectedPayout.items || []).length} bookings
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-[#E5E5E5]">
                <span className="text-[10px] uppercase font-semibold text-[#737373] block">Total Guest Treatments</span>
                <span className="text-base font-bold text-black font-mono mt-0.5 block">
                  {formatIDR((selectedPayout.items || []).reduce((sum: number, b: any) => sum + Number(b.eligible_treatment_amount || 0), 0))}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-[#E5E5E5]">
                <span className="text-[10px] uppercase font-semibold text-[#737373] block">Transfer Method</span>
                <span className="text-sm font-bold text-black capitalize mt-0.5 block">
                  {selectedPayout.payout_method?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Itemized Bookings List (Scrollable, Fullscreen) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <h4 className="font-bold text-black text-sm tracking-tight flex items-center justify-between">
                  <span>Settled Referrals & Bookings</span>
                  <span className="text-xs text-[#737373] font-normal">
                    {(selectedPayout.items || []).length} items included in this disbursement
                  </span>
                </h4>
              </div>

              {(selectedPayout.items || []).length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-[#E5E5E5] text-center text-[#737373] space-y-1">
                  <p className="font-semibold text-black">No itemized booking records linked to this receipt.</p>
                  <p className="text-xs">This disbursement was processed as a direct commission settlement of {formatIDR(selectedPayout.amount)}.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
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
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {selectedPayout.items.map((b: any) => (
                        <tr key={b.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-black whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>#{b.booking_id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(b.booking_id, `p-${b.id}`)}
                                className="text-[#737373] hover:text-black"
                              >
                                {copiedId === `p-${b.id}` ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#737373] whitespace-nowrap">
                            {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            {b.booking_time ? ` ${b.booking_time}` : ''}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-black">{b.guest_name || 'Guest'}</div>
                            {b.location && (
                              <div className="text-[11px] text-[#737373]">
                                {b.location} {b.room_number ? `(${b.room_number})` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-black font-medium">
                            {b.treatment_name || 'Spa Treatment'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-black">
                            {formatIDR(b.eligible_treatment_amount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#737373]">
                            {b.commission_rate_pct}%
                          </td>
                          <td className="py-3.5 px-4 font-bold font-mono text-black">
                            +{formatIDR(b.commission_amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
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
            <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#737373] font-mono">
                Receipt #{selectedPayout.payout_reference}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
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

