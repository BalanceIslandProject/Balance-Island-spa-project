'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowLeft, Receipt, DollarSign, CheckCircle2, Clock } from 'lucide-react';

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

  const totalFilteredCommission = filtered.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/partners/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/60 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black tracking-tight">
            Commission Ledger
          </h1>
          <p className="text-xs text-black/60">
            Financial breakdown of treatment revenue and payouts for www.booktherapick.com
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 border border-black/10 p-1 rounded-xl bg-black/[0.03] text-xs self-start sm:self-auto">
          {['all', 'pending', 'approved', 'paid'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg capitalize font-bold transition-all ${
                filterStatus === s
                  ? 'bg-black text-white shadow-xs'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-[0_2px_8px_rgb(0,0,0,0.02)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Total Records</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-black">{filtered.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-[0_2px_8px_rgb(0,0,0,0.02)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Filtered Earnings</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-800">{formatIDR(totalFilteredCommission)}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white border border-black/10 shadow-[0_2px_8px_rgb(0,0,0,0.02)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">Standard Rate</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-black">15%</div>
        </div>
      </div>

      <div className="border border-black/10 rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-black/50 font-medium">Loading ledger...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={28} className="mx-auto text-black/30" />
            <p className="text-xs font-semibold text-black/80">No commission records found.</p>
            <p className="text-[11px] text-black/50 max-w-sm mx-auto">
              Any commissions matching the selected filter will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-black/5">
              {filtered.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
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
                    <div>
                      <span className="text-[10px] text-black/50 uppercase block">Treatment Gross</span>
                      <span className="font-medium text-black">{formatIDR(item.eligible_treatment_amount)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold block">Commission ({item.commission_rate_pct}%)</span>
                      <span className="text-xs font-bold text-emerald-800">+{formatIDR(item.commission_amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                    <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {item.status}
                    </span>

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
                    <th className="py-3.5 px-5">Gross Total</th>
                    <th className="py-3.5 px-5">Treatment Net</th>
                    <th className="py-3.5 px-5">Rate</th>
                    <th className="py-3.5 px-5">Commission</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3.5 px-5 text-black/60">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono font-bold text-black hover:text-black/70 hover:underline group"
                          title="View treatment & invoice details"
                        >
                          <span>#{item.booking_id}</span>
                          <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-5 text-black/60">
                        {formatIDR(item.booking_amount_gross)}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-black">
                        {formatIDR(item.eligible_treatment_amount)}
                      </td>
                      <td className="py-3.5 px-5 text-black/60">
                        {item.commission_rate_pct}%
                      </td>
                      <td className="py-3.5 px-5 font-bold text-emerald-800">
                        +{formatIDR(item.commission_amount)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="border border-black/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="text-black font-semibold hover:underline"
                        >
                          View
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
