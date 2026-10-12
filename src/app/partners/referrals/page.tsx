'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Clock, ArrowLeft } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/partners/dashboard" className="text-xs text-[#736B63] hover:text-[#1A1A1A] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Referred Bookings
          </h1>
          <p className="text-xs sm:text-sm text-[#6B645C]">
            All guest appointments originated via your affiliate link or QR code
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#736B63]">Loading referral records...</div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-[#A89E94] mx-auto" />
            <p className="text-sm font-semibold text-[#1A1A1A]">No referred bookings yet</p>
            <p className="text-xs text-[#6B645C]">
              When visitors book treatments after scanning your code or visiting your link, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#736B63] font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Booking Reference</th>
                  <th className="py-3.5 px-6">Customer Name</th>
                  <th className="py-3.5 px-6">First Visit</th>
                  <th className="py-3.5 px-6">Attributed Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {referrals.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-[#1A1A1A]">
                      #{item.booking_id}
                    </td>
                    <td className="py-3.5 px-6 text-[#1A1A1A]">
                      {item.customer_name || 'Guest Customer'}
                    </td>
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {item.first_touch_at
                        ? new Date(item.first_touch_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-medium text-amber-900">
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
