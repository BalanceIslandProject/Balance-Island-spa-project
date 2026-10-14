'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, User, ArrowLeft, ChevronRight, Check } from 'lucide-react';

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
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Link 
            href="/partners/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black tracking-tight">
            Referred Bookings
          </h1>
          <p className="text-xs text-black/60">
            Appointments originating from your custom partner link or QR code on www.booktherapick.com
          </p>
        </div>

        <div className="bg-black/[0.04] px-3.5 py-1.5 rounded-xl border border-black/5 self-start sm:self-auto text-xs font-mono font-bold text-black">
          {referrals.length} {referrals.length === 1 ? 'Booking' : 'Bookings'}
        </div>
      </div>

      <div className="border border-black/10 rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-black/50 font-medium">Loading referrals...</div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Calendar size={28} className="mx-auto text-black/30" />
            <p className="text-xs font-semibold text-black/80">No referred bookings recorded yet.</p>
            <p className="text-[11px] text-black/50 max-w-sm mx-auto">
              Share your link or QR code to begin tracking customer visits and appointments.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-black/5">
              {referrals.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-black bg-black/[0.04] px-2 py-0.5 rounded">
                      #{item.booking_id}
                    </span>
                    <span className="text-[11px] text-black/50">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-black font-semibold">
                      <User size={13} className="text-black/40" />
                      <span>{item.customer_name || 'Guest'}</span>
                    </div>

                    <Link
                      href={`/invoice/${item.booking_id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-bold text-[11px] text-black hover:underline"
                    >
                      <span>Invoice</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] border-b border-black/10 text-black/60 font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Booking Ref</th>
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-5">First Visited</th>
                    <th className="py-3.5 px-5">Partner Code</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {referrals.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3.5 px-5 text-black/60">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-black">
                        #{item.booking_id}
                      </td>
                      <td className="py-3.5 px-5 text-black font-medium">
                        {item.customer_name || 'Guest'}
                      </td>
                      <td className="py-3.5 px-5 text-black/60">
                        {item.first_touch_at
                          ? new Date(item.first_touch_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-semibold text-black">
                        {item.partner_code}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-black font-semibold hover:underline"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={11} />
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
