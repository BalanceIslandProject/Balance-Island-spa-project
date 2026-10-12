'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommissions() {
      try {
        const res = await fetch('/api/affiliates/commissions');
        const data = await res.json();
        if (data.success) {
          setCommissions(data.commissions || []);
        }
      } catch (e) {
        console.error('Error loading commissions:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCommissions();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filtered = filterStatus === 'all' 
    ? commissions 
    : commissions.filter((c) => c.status === filterStatus);

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/partners/dashboard" className="text-xs text-black/50 hover:text-black">
            &larr; Back to Dashboard
          </Link>
          <h1 className="font-serif text-2xl font-bold text-black">
            Commission Ledger
          </h1>
          <p className="text-xs text-black/60">
            Financial breakdown of treatment revenue and payouts
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 border border-black/10 p-1 rounded-lg text-xs">
          {['all', 'pending', 'approved', 'paid'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-black text-white'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-black/10 rounded-2xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-black/50">Loading ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-black/50">
            No commission records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.02] border-b border-black/10 text-black/60 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Gross Total</th>
                  <th className="py-3 px-4">Treatment Net</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((item) => (
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
                    <td className="py-3 px-4 text-black/60">
                      {formatIDR(item.booking_amount_gross)}
                    </td>
                    <td className="py-3 px-4 font-medium text-black">
                      {formatIDR(item.eligible_treatment_amount)}
                    </td>
                    <td className="py-3 px-4 text-black/60">
                      {item.commission_rate_pct}%
                    </td>
                    <td className="py-3 px-4 font-bold text-black">
                      {formatIDR(item.commission_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                        {item.status}
                      </span>
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
