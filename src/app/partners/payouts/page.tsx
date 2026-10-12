'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-1">
        <Link href="/partners/dashboard" className="text-xs text-black/50 hover:text-black">
          &larr; Back to Dashboard
        </Link>
        <h1 className="font-serif text-2xl font-bold text-black">
          Payout History
        </h1>
        <p className="text-xs text-black/60">
          Record of commission payouts transferred to your account
        </p>
      </div>

      <div className="border border-black/10 rounded-2xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-black/50">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-black/50">
            No payouts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] border-b border-black/10 text-black/60 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {payouts.map((item) => (
                  <tr key={item.id} className="hover:bg-black/[0.01]">
                    <td className="py-3 px-4 text-black/60">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-black">
                      {item.payout_reference}
                    </td>
                    <td className="py-3 px-4 font-bold text-black">
                      {formatIDR(item.amount)}
                    </td>
                    <td className="py-3 px-4 capitalize text-black">
                      {item.payout_method.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-black/60">
                      {item.notes || '-'}
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
