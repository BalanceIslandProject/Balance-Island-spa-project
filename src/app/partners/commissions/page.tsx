'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
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
    <div className="space-y-5 w-full pb-12 font-sans">
      {/* Filter Controls Toolbar Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 sm:p-5 space-y-4">
        
        {/* CRM Filter Controls: Status Tabs on Left, Date Filter on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] text-xs min-w-max">
              {['all', 'approved', 'pending', 'paid', 'cancelled'].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-md capitalize font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                    filterStatus === s
                      ? 'bg-black text-white shadow-xs'
                      : 'text-[#737373] hover:text-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Toggle Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                hasDateFilter || showCalendarFilter
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-[#E5E5E5] hover:bg-[#F5F5F5]'
              }`}
            >
              <CalendarDays size={13} />
              <span>
                {hasDateFilter 
                  ? `${startDate || 'Start'} → ${endDate || 'End'}`
                  : 'Filter by Date'
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
                className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#737373] hover:text-black border border-[#E5E5E5] transition-colors cursor-pointer"
                title="Reset Date Filter"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Calendar Date Filter Panel */}
        {showCalendarFilter && (
          <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] flex items-center gap-1.5">
                <CalendarIcon size={13} className="text-[#737373]" />
                <span>Track Commissions by Date</span>
              </span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="text-xs font-semibold text-[#737373] hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} />
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    !hasDateFilter
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-[#737373] border-[#E5E5E5] hover:text-black hover:border-black'
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    activeDatePreset === 'this_month' && hasDateFilter
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-[#737373] border-[#E5E5E5] hover:text-black hover:border-black'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLastMonth}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    activeDatePreset === 'last_month' && hasDateFilter
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-[#737373] border-[#E5E5E5] hover:text-black hover:border-black'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLast30Days}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    activeDatePreset === 'last_30_days' && hasDateFilter
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-[#737373] border-[#E5E5E5] hover:text-black hover:border-black'
                  }`}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* From & To Custom Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-medium text-black bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-xs font-medium text-black bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
              Filtered Records
            </span>
            {hasDateFilter && (
              <span className="text-[10px] font-semibold bg-[#F5F5F5] text-black px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                Custom Date
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono tabular-nums">
            {filtered.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
              Filtered Earnings
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Attributed
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatIDR(totalFilteredCommission)}
          </div>
        </div>
      </div>

      {/* Main Ledger Table / Cards */}
      <div className="border border-[#E5E5E5] rounded-xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-[#737373] font-medium">Loading ledger records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-[#737373]/40" />
            <p className="text-sm font-semibold text-black">No commission records found.</p>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Any commissions matching the selected status and calendar date filter will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#E5E5E5]">
              {filtered.map((item) => {
                const isPaid = item.payment_status === 'paid' || item.payment_verified;
                const isApproved = item.status === 'approved';
                const isCancelled = item.status === 'cancelled' || item.booking_status === 'Cancelled';

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-black bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                          #{item.booking_id}
                        </span>

                        {/* Payment Label: Paid / Unpaid */}
                        {isPaid ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Unpaid
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-[#737373]">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Treatment Name & Status */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <p className="text-black truncate font-medium">
                        {item.guest_name} • {item.treatment_name || 'Spa Treatment'}
                      </p>

                      {/* Treatment Status Label */}
                      {isCancelled ? (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 whitespace-nowrap">
                          Cancelled
                        </span>
                      ) : item.booking_status === 'Ongoing' ? (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Ongoing
                        </span>
                      ) : item.booking_status === 'Completed' || item.service_completed ? (
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 whitespace-nowrap">
                          Finish
                        </span>
                      ) : item.booking_status === 'Confirmed' ? (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap">
                          Awaiting Treatment
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E5E5]">
                      <div>
                        <span className="text-[10px] text-[#737373] uppercase font-semibold block">Treatment Net</span>
                        <span className="font-semibold text-black font-mono tabular-nums">{formatIDR(item.eligible_treatment_amount)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Commission ({item.commission_rate_pct}%)</span>
                        <span className={`text-xs font-bold font-mono tabular-nums ${isCancelled ? 'line-through text-[#737373]' : 'text-emerald-700'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
                      {/* Commission Status */}
                      {isCancelled ? (
                        <span className="text-[10px] font-semibold text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded-md border border-[#E5E5E5]">
                          Cancelled
                        </span>
                      ) : item.status === 'paid' ? (
                        <span className="text-[10px] font-semibold text-white bg-black px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          ✓ Paid Out
                        </span>
                      ) : isApproved ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Pending
                        </span>
                      )}

                      <Link
                        href={`/invoice/${item.booking_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-black hover:underline"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={11} className="text-[#737373]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
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
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filtered.map((item) => {
                    const isPaid = item.payment_status === 'paid' || item.payment_verified;
                    const isApproved = item.status === 'approved';
                    const isCancelled = item.status === 'cancelled' || item.booking_status === 'Cancelled';

                    return (
                      <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3.5 px-4 text-[#737373]">
                          {new Date(item.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/invoice/${item.booking_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 font-mono font-bold text-black hover:underline group"
                            title="View treatment & invoice details"
                          >
                            <span>#{item.booking_id}</span>
                            <ExternalLink size={10} className="text-[#737373] group-hover:text-black transition-colors" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-black">{item.guest_name}</div>
                          <div className="text-[11px] text-[#737373] truncate max-w-[160px]">{item.treatment_name || 'Spa Treatment'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                              Cancelled
                            </span>
                          ) : item.booking_status === 'Ongoing' ? (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Ongoing
                            </span>
                          ) : item.booking_status === 'Completed' || item.service_completed ? (
                            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              Finish
                            </span>
                          ) : item.booking_status === 'Confirmed' ? (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              Confirmed
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Awaiting Treatment
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-black font-mono tabular-nums">
                          {formatIDR(item.eligible_treatment_amount)}
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono tabular-nums">
                          <span className={isCancelled ? 'line-through text-[#737373]' : 'text-emerald-700'}>
                            {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="text-[10px] font-semibold text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded-md border border-[#E5E5E5]">
                              Cancelled
                            </span>
                          ) : item.status === 'paid' ? (
                            <span className="text-[10px] font-semibold text-white bg-black px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              ✓ Paid Out
                            </span>
                          ) : isApproved ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/invoice/${item.booking_id}`}
                            target="_blank"
                            className="text-black font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Invoice</span>
                            <ExternalLink size={10} className="text-[#737373]" />
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
