'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, User, ArrowLeft, Users, Clock } from 'lucide-react';

export default function PartnerReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReferrals() {
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
    }
    loadReferrals();
  }, []);

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
            Referred Bookings
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200/70 self-start sm:self-auto text-xs font-mono font-bold text-neutral-900">
          <Users size={14} className="text-neutral-500" />
          <span>{referrals.length} {referrals.length === 1 ? 'Booking' : 'Bookings'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border border-neutral-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-neutral-500 font-medium">Loading referred bookings...</div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Calendar size={24} className="mx-auto text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-800">No referred bookings recorded yet.</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Share your link or QR code to begin tracking customer visits and appointments.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {referrals.map((item) => (
                <div key={item.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/70">
                      #{item.booking_id}
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
                    <div className="flex items-center gap-1.5 text-neutral-900 font-semibold">
                      <User size={13} className="text-neutral-400" />
                      <span>{item.customer_name || 'Guest'}</span>
                    </div>

                    <Link
                      href={`/invoice/${item.booking_id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-semibold text-[11px] text-neutral-700 hover:text-neutral-950 hover:underline"
                    >
                      <span>Invoice</span>
                      <ExternalLink size={10} className="text-neutral-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/60 border-b border-neutral-200/80 text-neutral-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">First Visited</th>
                    <th className="py-3 px-4">Partner Code</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {referrals.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 text-neutral-500">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                        #{item.booking_id}
                      </td>
                      <td className="py-3 px-4 text-neutral-800 font-medium">
                        {item.customer_name || 'Guest'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {item.first_touch_at
                          ? new Date(item.first_touch_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-800">
                        {item.partner_code}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-neutral-700 font-semibold hover:text-neutral-950 hover:underline"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} className="text-neutral-400" />
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
  );
}
