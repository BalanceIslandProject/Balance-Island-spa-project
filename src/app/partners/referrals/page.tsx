'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, User, ArrowLeft, Users, Clock } from 'lucide-react';
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
    <div className="space-y-5 w-full font-sans antialiased pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E5E5] rounded-xl p-4 sm:p-5">
        <div className="space-y-0.5">
          <Link 
            href="/partners/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-black transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Referred Bookings
          </h1>
          <p className="text-xs text-[#737373]">
            All guest appointments attributed to your unique referral code.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#F5F5F5] px-3 py-1.5 rounded-lg border border-[#E5E5E5] self-start sm:self-auto text-xs font-mono font-bold text-black">
          <Users size={14} className="text-[#737373]" />
          <span>{referrals.length} {referrals.length === 1 ? 'Booking' : 'Bookings'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border border-[#E5E5E5] rounded-xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-[#737373] font-medium">Loading referred bookings...</div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Calendar size={24} className="mx-auto text-[#737373]/40" />
            <p className="text-sm font-semibold text-black">No referred bookings recorded yet.</p>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Share your link or QR code to begin tracking customer visits and appointments.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#E5E5E5]">
              {referrals.map((item) => {
                const isPaid = item.payment_status === 'paid';
                const isCancelled = item.booking_status === 'Cancelled' || item.commission_status === 'cancelled';
                const isApproved = item.commission_status === 'approved';

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-black bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                          #{item.booking_id}
                        </span>

                        {/* Payment Label: Paid / Unpaid */}
                        {isPaid ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Unpaid
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-[#737373]">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-black font-semibold truncate">
                          <User size={13} className="text-[#737373] shrink-0" />
                          <span className="truncate">{item.customer_name || 'Guest'}</span>
                        </div>
                        <p className="text-[11px] text-[#737373] truncate mt-0.5">
                          {item.treatment_name || 'Spa Treatment'}
                        </p>
                      </div>

                      {/* Treatment Status Label */}
                      {isCancelled ? (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 whitespace-nowrap">
                          Cancelled
                        </span>
                      ) : item.booking_status === 'Ongoing' ? (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Ongoing
                        </span>
                      ) : item.booking_status === 'Completed' ? (
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 whitespace-nowrap">
                          Finish
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                          Confirmed
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
                      {/* Commission Status */}
                      {isCancelled ? (
                        <span className="text-[10px] font-semibold text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded-md border border-[#E5E5E5]">
                          Cancelled
                        </span>
                      ) : isApproved ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Pending
                        </span>
                      )}

                      <Link
                        href={`/invoice/${item.booking_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-black hover:underline"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={11} className="text-[#737373]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
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
                <tbody className="divide-y divide-[#E5E5E5]">
                  {referrals.map((item) => {
                    const isPaid = item.payment_status === 'paid';
                    const isCancelled = item.booking_status === 'Cancelled' || item.commission_status === 'cancelled';
                    const isApproved = item.commission_status === 'approved';

                    return (
                      <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3.5 px-4 text-[#737373]">
                          {new Date(item.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-black">
                          #{item.booking_id}
                        </td>
                        <td className="py-3.5 px-4 text-black font-medium">
                          {item.customer_name || 'Guest'}
                        </td>
                        <td className="py-3.5 px-4 text-[#737373] truncate max-w-[160px]">
                          {item.treatment_name || 'Spa Treatment'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                              Cancelled
                            </span>
                          ) : item.booking_status === 'Ongoing' ? (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Ongoing
                            </span>
                          ) : item.booking_status === 'Completed' ? (
                            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              Finish
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              Confirmed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="text-[10px] font-semibold text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded-md border border-[#E5E5E5]">
                              Cancelled
                            </span>
                          ) : isApproved ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/invoice/${item.booking_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-black font-semibold hover:underline"
                          >
                            <span>Invoice</span>
                            <ExternalLink size={10} className="text-[#737373]" />
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

