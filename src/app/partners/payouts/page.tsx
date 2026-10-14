'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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
            Payout History
          </h1>
          <p className="text-xs text-black/60">
            Transfers and commission disbursements for your BookTherapick partner account
          </p>
        </div>

        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold self-start sm:self-auto">
          ⚡ No Minimum Withdrawal Limit
        </div>
      </div>

      <div className="border border-black/10 rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-black/50 font-medium">Loading payout history...</div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet size={28} className="mx-auto text-black/30" />
            <p className="text-xs font-semibold text-black/80">No payouts recorded yet.</p>
            <p className="text-[11px] text-black/50 max-w-sm mx-auto">
              Once your approved commission is withdrawn via WhatsApp, disbursement receipts will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-black/5">
              {payouts.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-black bg-black/[0.04] px-2 py-0.5 rounded">
                      #{item.payout_reference}
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
                    <div>
                      <span className="text-[10px] text-black/50 uppercase block">Method</span>
                      <span className="font-medium text-black capitalize">{item.payout_method.replace('_', ' ')}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-black/50 uppercase block">Amount</span>
                      <span className="text-sm font-bold text-black">{formatIDR(item.amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
                    <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                      {item.status}
                    </span>
                    <span className="text-black/50">{item.notes || 'Direct Transfer'}</span>
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
                    <th className="py-3.5 px-5">Reference</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Method</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {payouts.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3.5 px-5 text-black/60">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-black">
                        {item.payout_reference}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-black text-sm">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3.5 px-5 capitalize text-black">
                        {item.payout_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-black/60">
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
