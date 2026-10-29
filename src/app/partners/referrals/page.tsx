'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, User, Users, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PartnerReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReferrals = async () => {
    try {
      const res = await fetch('/api/affiliates/referrals');
      const data = await res.json();
      if (data.success) {
        setReferrals(data.referrals || []);
      }
    } catch (e) {
      console.error('Error loading referrals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('partner_referrals_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        loadReferrals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadReferrals();
      })
      .subscribe();

    // Polling fallback
    const interval = setInterval(loadReferrals, 8000);

    // Revalidate on focus
    const onFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadReferrals();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return (
    <div className="space-y-4 w-full font-sans antialiased pb-12">
      {/* CRM Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-[6px] border border-[#ebebeb] text-xs font-mono text-[#171717] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
          <Users size={14} className="text-[#666666]" />
          <span>{referrals.length} {referrals.length === 1 ? 'Booking' : 'Bookings'}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            loadReferrals();
          }}
          disabled={loading}
          className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
          title="Refresh bookings"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="border border-[#ebebeb] rounded-[6px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#666666]">Loading referred bookings...</div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Calendar size={22} className="mx-auto text-[#8f8f8f]" />
            <p className="text-sm font-medium text-[#171717]">No referred bookings recorded yet.</p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Share your link or QR code to begin tracking customer visits and appointments.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#ebebeb]">
              {referrals.map((item) => {
                const isPaid = item.payment_status === 'paid';
                const isCancelled = item.booking_status === 'Cancelled' || item.commission_status === 'cancelled';
                const isApproved = item.commission_status === 'approved';

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          #{item.booking_id}
                        </span>

                        {/* Payment Label: Paid / Unpaid */}
                        {isPaid ? (
                          <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                            Paid
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                            Unpaid
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-[#8f8f8f]">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[#171717] font-medium truncate">
                          <User size={12} className="text-[#8f8f8f] shrink-0" />
                          <span className="truncate">{item.customer_name || 'Guest'}</span>
                        </div>
                        <p className="text-[11px] text-[#666666] truncate mt-0.5">
                          {item.treatment_name || 'Spa Treatment'}
                        </p>
                      </div>

                      {/* Treatment Status Label */}
                      {isCancelled ? (
                        <span className="font-mono text-[10px] text-[#8f8f8f] bg-white px-2 py-0.5 rounded-[4px] border border-[#ebebeb] whitespace-nowrap">
                          Cancelled
                        </span>
                      ) : item.booking_status === 'Ongoing' ? (
                        <span className="font-mono text-[10px] text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb] flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-pulse" />
                          Ongoing
                        </span>
                      ) : item.booking_status === 'Completed' ? (
                        <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb] whitespace-nowrap">
                          Finish
                        </span>
                      ) : item.booking_status === 'Confirmed' ? (
                        <span className="font-mono text-[10px] text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb] whitespace-nowrap">
                          Confirmed
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb] whitespace-nowrap">
                          Awaiting Treatment
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between">
                      {/* Commission Status */}
                      {isCancelled ? (
                        <span className="font-mono text-[10px] text-[#8f8f8f] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          Cancelled
                        </span>
                      ) : isApproved ? (
                        <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          Approved
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          Pending
                        </span>
                      )}

                      <Link
                        href={`/invoice/${item.booking_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-[#171717] hover:underline"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={10} className="text-[#666666]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-normal uppercase tracking-[0.071em] text-[#666666]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Treatment</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Treatment Status</th>
                    <th className="py-3 px-4">Commission Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {referrals.map((item) => {
                    const isPaid = item.payment_status === 'paid';
                    const isCancelled = item.booking_status === 'Cancelled' || item.commission_status === 'cancelled';
                    const isApproved = item.commission_status === 'approved';

                    return (
                      <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666]">
                          {new Date(item.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#171717]">
                          #{item.booking_id}
                        </td>
                        <td className="py-3.5 px-4 text-[#171717] font-normal">
                          {item.customer_name || 'Guest'}
                        </td>
                        <td className="py-3.5 px-4 text-[#666666] truncate max-w-[160px]">
                          {item.treatment_name || 'Spa Treatment'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Paid
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="font-mono text-[10px] text-[#8f8f8f] bg-white px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Cancelled
                            </span>
                          ) : item.booking_status === 'Ongoing' ? (
                            <span className="font-mono text-[10px] text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-pulse" />
                              Ongoing
                            </span>
                          ) : item.booking_status === 'Completed' ? (
                            <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Finish
                            </span>
                          ) : item.booking_status === 'Confirmed' ? (
                            <span className="font-mono text-[10px] text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Confirmed
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Awaiting Treatment
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="font-mono text-[10px] text-[#8f8f8f] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Cancelled
                            </span>
                          ) : isApproved ? (
                            <span className="font-mono text-[10px] text-[#297a3a] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Approved
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/invoice/${item.booking_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#171717] hover:underline"
                          >
                            <span>Invoice</span>
                            <ExternalLink size={10} className="text-[#666666]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

