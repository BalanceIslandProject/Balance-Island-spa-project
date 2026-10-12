'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins, ArrowLeft, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/partners/dashboard" className="text-xs text-[#736B63] hover:text-[#1A1A1A] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Commission Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#6B645C]">
            Detailed financial breakdown of every treatment booking and payout status
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D9D1C7] text-xs font-medium">
          {['all', 'pending', 'approved', 'paid'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filterStatus === s
                  ? 'bg-[#1A1A1A] text-white font-semibold'
                  : 'text-[#6B645C] hover:text-[#1A1A1A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#736B63]">Loading commission records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Coins className="w-8 h-8 text-[#A89E94] mx-auto" />
            <p className="text-sm font-semibold text-[#1A1A1A]">No commission records found</p>
            <p className="text-xs text-[#6B645C]">
              {filterStatus !== 'all' ? `No records under "${filterStatus}" status.` : 'When bookings are completed, they appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#736B63] font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Booking Ref</th>
                  <th className="py-3.5 px-6">Gross Total</th>
                  <th className="py-3.5 px-6">Eligible Treatment</th>
                  <th className="py-3.5 px-6">Rate</th>
                  <th className="py-3.5 px-6">Commission</th>
                  <th className="py-3.5 px-6">Verification</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-[#1A1A1A]">
                      #{item.booking_id}
                    </td>
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {formatIDR(item.booking_amount_gross)}
                    </td>
                    <td className="py-3.5 px-6 text-[#1A1A1A] font-medium">
                      {formatIDR(item.eligible_treatment_amount)}
                    </td>
                    <td className="py-3.5 px-6 text-[#6B645C]">
                      {item.commission_rate_pct}%
                    </td>
                    <td className="py-3.5 px-6 font-bold text-amber-900">
                      {formatIDR(item.commission_amount)}
                    </td>
                    <td className="py-3.5 px-6 text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <span className={item.payment_verified ? 'text-emerald-700 font-medium' : 'text-[#8C847B]'}>
                          {item.payment_verified ? '✓ Payment Confirmed' : '○ Pending Payment'}
                        </span>
                        <span className={item.service_completed ? 'text-emerald-700 font-medium' : 'text-[#8C847B]'}>
                          {item.service_completed ? '✓ Service Completed' : '○ Service Scheduled'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          item.status === 'paid'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : item.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'declined'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
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
