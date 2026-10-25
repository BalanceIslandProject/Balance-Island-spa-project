'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, CheckCircle2, Clock, X, Copy, Check, Calendar, ExternalLink } from 'lucide-react';

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
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="space-y-1">
          <Link 
            href="/partners/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-0.5"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">
            Payout History
          </h1>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-800 border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <span>No Minimum Withdrawal</span>
        </div>
      </div>

      {/* Main Table / Cards */}
      <div className="border border-neutral-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-neutral-500 font-medium">Loading payout history...</div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet size={24} className="mx-auto text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-800">No payouts recorded yet.</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Once your approved commission is withdrawn via WhatsApp, disbursement receipts will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {payouts.map((item) => (
                <div key={item.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/70">
                      #{item.payout_reference}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block font-medium">Method</span>
                      <span className="font-medium text-neutral-800 capitalize">{item.payout_method.replace('_', ' ')}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase block font-medium">Amount</span>
                      <span className="text-sm font-bold text-neutral-950 font-mono tabular-nums">{formatIDR(item.amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    <span className="border border-neutral-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-neutral-800 bg-neutral-50">
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPayout(item)}
                      className="px-2.5 py-1 bg-black text-white rounded-lg font-bold text-[11px] hover:bg-neutral-800"
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
                <thead className="bg-white border-b border-neutral-200/80 text-black font-bold">
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
                <tbody className="divide-y divide-neutral-100">
                  {payouts.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        {item.payout_reference}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-950 font-mono tabular-nums text-sm">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-neutral-800 font-medium">
                        {item.payout_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="border border-neutral-200 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold text-neutral-800 bg-neutral-50">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {item.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayout(item)}
                          className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 font-bold rounded-xl text-xs transition-all shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-2xl w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col border border-black/15 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-black/10 text-black flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-black text-lg sm:text-xl tracking-tight">
                    Disbursement Details
                  </h3>
                  <span className="font-mono font-bold text-black bg-black/5 px-2.5 py-0.5 rounded-lg text-xs border border-black/10">
                    {selectedPayout.payout_reference}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black text-white">
                    {selectedPayout.status || 'COMPLETED'}
                  </span>
                </div>
                <div className="text-xs text-black/60 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Disbursed on: <strong>{new Date(selectedPayout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  <span>&bull;</span>
                  <span>Method: <strong className="capitalize">{selectedPayout.payout_method?.replace('_', ' ')}</strong></span>
                  {selectedPayout.notes && (
                    <>
                      <span>&bull;</span>
                      <span>Notes: <strong>{selectedPayout.notes}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-black/50 block font-bold uppercase tracking-wider">Total Disbursed</span>
                  <span className="font-mono font-extrabold text-xl text-black">
                    {formatIDR(selectedPayout.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-black/[0.02] border-b border-black/10 shrink-0 text-xs">
              <div className="bg-white p-3 rounded-xl border border-black/10 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Payout Amount</span>
                <span className="text-base font-bold text-black font-mono mt-0.5 block">
                  {formatIDR(selectedPayout.amount)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-black/10 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Paid Bookings</span>
                <span className="text-base font-bold text-black mt-0.5 block">
                  {(selectedPayout.items || []).length} bookings
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-black/10 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Total Guest Treatments</span>
                <span className="text-base font-bold text-black font-mono mt-0.5 block">
                  {formatIDR((selectedPayout.items || []).reduce((sum: number, b: any) => sum + Number(b.eligible_treatment_amount || 0), 0))}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-black/10 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-black/50 block">Transfer Method</span>
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
                  <span className="text-xs text-black/60 font-normal">
                    {(selectedPayout.items || []).length} items included in this disbursement
                  </span>
                </h4>
              </div>

              {(selectedPayout.items || []).length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-black/10 text-center text-black/50 space-y-1">
                  <p className="font-semibold text-black">No itemized booking records linked to this receipt.</p>
                  <p className="text-xs">This disbursement was processed as a direct commission settlement of {formatIDR(selectedPayout.amount)}.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/10 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white border-b border-black/10 text-black font-bold">
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
                    <tbody className="divide-y divide-black/5">
                      {selectedPayout.items.map((b: any) => (
                        <tr key={b.id} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-black whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>#{b.booking_id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(b.booking_id, `p-${b.id}`)}
                                className="text-black/40 hover:text-black"
                              >
                                {copiedId === `p-${b.id}` ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-black/60 whitespace-nowrap">
                            {b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            {b.booking_time ? ` ${b.booking_time}` : ''}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-black">{b.guest_name || 'Guest'}</div>
                            {b.location && (
                              <div className="text-[10px] text-black/50">
                                {b.location} {b.room_number ? `(${b.room_number})` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-black font-medium">
                            {b.treatment_name || 'Spa Treatment'}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {formatIDR(b.eligible_treatment_amount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {b.commission_rate_pct}%
                          </td>
                          <td className="py-3.5 px-4 font-bold font-mono text-black">
                            +{formatIDR(b.commission_amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white whitespace-nowrap">
                              <CheckCircle2 size={10} /> Paid Out
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
            <div className="p-4 border-t border-black/10 bg-black/[0.02] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-black/50 font-mono">
                Receipt #{selectedPayout.payout_reference} &bull; {selectedPayout.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-5 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/80 shadow-sm"
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

