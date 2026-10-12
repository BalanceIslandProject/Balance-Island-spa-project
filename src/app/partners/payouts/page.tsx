'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/partners/dashboard" className="text-xs text-[#736B63] hover:text-[#1A1A1A] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
          Payout History
        </h1>
        <p className="text-xs sm:text-sm text-[#6B645C]">
          Summary of all commission payouts transferred to your account
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#736B63]">Loading payout records...</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-[#A89E94] mx-auto" />
            <p className="text-sm font-semibold text-[#1A1A1A]">No payouts recorded yet</p>
            <p className="text-xs text-[#6B645C] max-w-sm mx-auto">
              Once your commissions are approved and processed, payment receipts and references will be listed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#736B63] font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {payouts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-[#1A1A1A]">
                      {item.payout_reference}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-amber-900">
                      {formatIDR(item.amount)}
                    </td>
                    <td className="py-3.5 px-6 capitalize text-[#1A1A1A]">
                      {item.payout_method.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-[#736B63]">
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
