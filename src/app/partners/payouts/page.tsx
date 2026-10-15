'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, CheckCircle2, Clock } from 'lucide-react';

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
                <div key={item.id} className="p-3.5 space-y-2">
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
                    <span className="text-neutral-500">{item.notes || 'Direct Transfer'}</span>
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
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payouts.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 text-neutral-500">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                        {item.payout_reference}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-950 font-mono tabular-nums text-sm">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3 px-4 capitalize text-neutral-800 font-medium">
                        {item.payout_method.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="border border-neutral-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-neutral-800 bg-neutral-50">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {item.notes || '-'}
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
