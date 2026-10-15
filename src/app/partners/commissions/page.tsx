'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowLeft, Receipt, DollarSign, CheckCircle2, Clock, Wallet } from 'lucide-react';

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
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="space-y-1">
          <Link 
            href="/partners/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-0.5"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">
            Commission Ledger
          </h1>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 border border-neutral-200/80 p-1 rounded-xl bg-neutral-100 text-xs self-start sm:self-auto">
          {['all', 'pending', 'approved', 'paid'].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                filterStatus === s
                  ? 'bg-neutral-950 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Filtered Records</span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-950 font-mono tabular-nums">{filtered.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Filtered Earnings</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums">{formatIDR(totalFilteredCommission)}</div>
        </div>
      </div>

      {/* Main Ledger Table / Cards */}
      <div className="border border-neutral-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-neutral-500 font-medium">Loading ledger records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-800">No commission records found.</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Any commissions matching the selected filter will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {filtered.map((item) => (
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
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-medium block">Treatment Net</span>
                      <span className="font-medium text-neutral-900 font-mono tabular-nums">{formatIDR(item.eligible_treatment_amount)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold block">Commission ({item.commission_rate_pct}%)</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">+{formatIDR(item.commission_amount)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="border border-neutral-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-50">
                      {item.status}
                    </span>

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
                    <th className="py-3 px-4">Gross Total</th>
                    <th className="py-3 px-4">Treatment Net</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 text-neutral-500">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono font-bold text-neutral-900 hover:underline group"
                          title="View treatment & invoice details"
                        >
                          <span>#{item.booking_id}</span>
                          <ExternalLink size={10} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 font-mono tabular-nums">
                        {formatIDR(item.booking_amount_gross)}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-900 font-mono tabular-nums">
                        {formatIDR(item.eligible_treatment_amount)}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 font-mono">
                        {item.commission_rate_pct}%
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono tabular-nums">
                        +{formatIDR(item.commission_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="border border-neutral-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-50">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="text-neutral-700 font-semibold hover:text-neutral-950 hover:underline"
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
