'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  ArrowLeft, 
  Receipt, 
  CalendarDays, 
  X, 
  RotateCcw, 
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCalendarFilter, setShowCalendarFilter] = useState<boolean>(false);
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadCommissions = async () => {
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
  };

  useEffect(() => {
    loadCommissions();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('partner_commissions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
        loadCommissions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadCommissions();
      })
      .subscribe();

    // Polling fallback
    const interval = setInterval(loadCommissions, 8000);

    // Revalidate on focus
    const onFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadCommissions();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const formatIDR = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `IDR ${formatted}`;
  };

  const formatDateYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Preset Date Handlers
  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateYMD(firstDay));
    setEndDate(formatDateYMD(lastDay));
    setActiveDatePreset('this_month');
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(formatDateYMD(firstDay));
    setEndDate(formatDateYMD(lastDay));
    setActiveDatePreset('last_month');
  };

  const handleSetLast30Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setStartDate(formatDateYMD(past));
    setEndDate(formatDateYMD(now));
    setActiveDatePreset('last_30_days');
  };

  const handleResetDate = () => {
    setStartDate('');
    setEndDate('');
    setActiveDatePreset('all');
  };

  // Combined Status and Calendar Filtering
  const filtered = commissions.filter((c) => {
    // 1. Status Filter
    if (filterStatus !== 'all' && c.status !== filterStatus) {
      return false;
    }

    // 2. Calendar Date Filter
    if (startDate || endDate) {
      const commissionDate = new Date(c.created_at);
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (commissionDate < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);
        if (commissionDate > end) return false;
      }
    }

    return true;
  });

  const totalFilteredCommission = filtered.reduce((sum, c) => {
    if (c.status === 'cancelled') return sum;
    return sum + Number(c.commission_amount || 0);
  }, 0);

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-12">
      {/* Header & Filter Controls Card */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-3.5">
        
        {/* Top Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Link 
              href="/partners/dashboard" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">
              Commission Ledger
            </h1>
          </div>

          {/* Calendar Toggle Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                hasDateFilter || showCalendarFilter
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              <CalendarDays size={13} />
              <span>
                {hasDateFilter 
                  ? `${startDate || 'Start'} → ${endDate || 'End'}`
                  : 'Calendar Filter'
                }
              </span>
              <ChevronDown 
                size={13} 
                className={`transition-transform duration-200 ${showCalendarFilter ? 'rotate-180' : ''}`} 
              />
            </button>

            {hasDateFilter && (
              <button
                type="button"
                onClick={handleResetDate}
                className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer"
                title="Reset Date Filter"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs - Strictly in ONE LINE on Mobile with Smooth Horizontal Scroll */}
        <div className="w-full overflow-x-auto no-scrollbar pt-1">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-neutral-100/90 border border-neutral-200/70 text-xs min-w-max">
            {['all', 'approved', 'pending', 'paid', 'cancelled'].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
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

        {/* Expandable Calendar Date Filter Panel */}
        {showCalendarFilter && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <CalendarIcon size={13} className="text-neutral-500" />
                <span>Track Commissions by Date</span>
              </span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="text-[10px] font-bold text-neutral-500 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
                >
                  <X size={11} />
                  <span>Clear Dates</span>
                </button>
              )}
            </div>

            {/* Quick Presets in One Line */}
            <div className="w-full overflow-x-auto no-scrollbar">
              <div className="inline-flex items-center gap-1.5 min-w-max">
                <button
                  type="button"
                  onClick={handleResetDate}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !hasDateFilter
                      ? 'bg-neutral-950 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeDatePreset === 'this_month' && hasDateFilter
                      ? 'bg-neutral-950 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLastMonth}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeDatePreset === 'last_month' && hasDateFilter
                      ? 'bg-neutral-950 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLast30Days}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeDatePreset === 'last_30_days' && hasDateFilter
                      ? 'bg-neutral-950 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* From & To Custom Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-950 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Filtered Records
            </span>
            {hasDateFilter && (
              <span className="text-[9px] font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                Calendar
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-950 font-mono tabular-nums">
            {filtered.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Filtered Earnings
            </span>
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Attributed
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatIDR(totalFilteredCommission)}
          </div>
        </div>
      </div>

      {/* Main Ledger Table / Cards */}
      <div className="border border-neutral-200/80 rounded-3xl bg-white shadow-xs overflow-hidden">
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
              Any commissions matching the selected status and calendar date filter will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {filtered.map((item) => {
                const isPaid = item.payment_status === 'paid' || item.payment_verified;
                const isApproved = item.status === 'approved';
                const isCancelled = item.status === 'cancelled' || item.booking_status === 'Cancelled';

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/70">
                          #{item.booking_id}
                        </span>

                        {/* Payment Label: Paid / Unpaid */}
                        {isPaid ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unpaid
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-neutral-500 font-medium">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Treatment Name & Status */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <p className="text-neutral-700 truncate font-medium">
                        {item.guest_name} • {item.treatment_name || 'Spa Treatment'}
                      </p>

                      {/* Treatment Status Label */}
                      {isCancelled ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                          Cancelled
                        </span>
                      ) : item.booking_status === 'Ongoing' ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Ongoing
                        </span>
                      ) : item.booking_status === 'Completed' || item.service_completed ? (
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 whitespace-nowrap">
                          Finish
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 whitespace-nowrap">
                          Confirmed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-medium block">Treatment Net</span>
                        <span className="font-medium text-neutral-900 font-mono tabular-nums">{formatIDR(item.eligible_treatment_amount)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">Commission ({item.commission_rate_pct}%)</span>
                        <span className={`text-xs font-bold font-mono tabular-nums ${isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      {/* Commission Status */}
                      {isCancelled ? (
                        <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          Commission Cancelled
                        </span>
                      ) : item.status === 'paid' ? (
                        <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded border border-black inline-flex items-center gap-1">
                          ✓ Paid Out
                        </span>
                      ) : isApproved ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                          Pending
                        </span>
                      )}

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
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/60 border-b border-neutral-200/80 text-neutral-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer & Treatment</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Treatment Status</th>
                    <th className="py-3 px-4">Treatment Net</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Commission Status</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((item) => {
                    const isPaid = item.payment_status === 'paid' || item.payment_verified;
                    const isApproved = item.status === 'approved';
                    const isCancelled = item.status === 'cancelled' || item.booking_status === 'Cancelled';

                    return (
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
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{item.guest_name}</div>
                          <div className="text-[11px] text-neutral-500 truncate max-w-[160px]">{item.treatment_name || 'Spa Treatment'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isCancelled ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Cancelled
                            </span>
                          ) : item.booking_status === 'Ongoing' ? (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Ongoing
                            </span>
                          ) : item.booking_status === 'Completed' || item.service_completed ? (
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              Finish Treatment
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              Confirmed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-900 font-mono tabular-nums">
                          {formatIDR(item.eligible_treatment_amount)}
                        </td>
                        <td className="py-3 px-4 font-bold font-mono tabular-nums">
                          <span className={isCancelled ? 'line-through text-neutral-400' : 'text-emerald-700'}>
                            {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isCancelled ? (
                            <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                              Cancelled
                            </span>
                          ) : item.status === 'paid' ? (
                            <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded border border-black inline-flex items-center gap-1">
                              ✓ Paid Out
                            </span>
                          ) : isApproved ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                              Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80">
                              Pending
                            </span>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
