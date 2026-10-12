'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="space-y-6 py-2">
      <div className="space-y-1">
        <Link href="/partners/dashboard" className="text-xs text-black/50 hover:text-black">
          &larr; Back to Dashboard
        </Link>
        <h1 className="font-serif text-2xl font-bold text-black">
          Referred Bookings
        </h1>
        <p className="text-xs text-black/60">
          Guest appointments originated through your link or QR code
        </p>
      </div>

      <div className="border border-black/10 rounded-2xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-black/50">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-xs text-black/50">
            No referred bookings recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] border-b border-black/10 text-black/60 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">First Visited</th>
                  <th className="py-3 px-4">Partner Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {referrals.map((item) => (
                  <tr key={item.id} className="hover:bg-black/[0.01]">
                    <td className="py-3 px-4 text-black/60">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-black">
                      #{item.booking_id}
                    </td>
                    <td className="py-3 px-4 text-black">
                      {item.customer_name || 'Guest'}
                    </td>
                    <td className="py-3 px-4 text-black/60">
                      {item.first_touch_at
                        ? new Date(item.first_touch_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-black">
                      {item.partner_code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
