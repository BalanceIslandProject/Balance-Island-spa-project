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
  ChevronDown,
  RefreshCw
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
    <div className="space-y-4 w-full pb-12 font-sans">
      {/* Filter Controls Toolbar Card */}
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-4 sm:p-5 space-y-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        
        {/* CRM Filter Controls: Status Tabs on Left, Date Filter on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs min-w-max">
              {['all', 'approved', 'pending', 'paid', 'cancelled'].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-[4px] capitalize font-medium transition-all whitespace-nowrap cursor-pointer text-xs ${
                    filterStatus === s
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'text-[#666666] hover:text-[#171717]'
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-medium transition-all cursor-pointer ${
                hasDateFilter || showCalendarFilter
                  ? 'bg-[#171717] text-white border-[#171717]'
                  : 'bg-white text-[#171717] border-[#ebebeb] hover:bg-[#fafafa]'
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

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadCommissions();
              }}
              disabled={loading}
              className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
              title="Refresh commissions"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {hasDateFilter && (
              <button
                type="button"
                onClick={handleResetDate}
                className="p-1.5 rounded-[6px] bg-[#fafafa] hover:bg-[#ebebeb] text-[#666666] hover:text-[#171717] border border-[#ebebeb] transition-colors cursor-pointer"
                title="Reset Date Filter"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Calendar Date Filter Panel */}
        {showCalendarFilter && (
          <div className="p-4 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666] flex items-center gap-1.5">
                <CalendarIcon size={13} className="text-[#666666]" />
                <span>Track Commissions by Date</span>
              </span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
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
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                    !hasDateFilter
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#666666] border-[#ebebeb] hover:text-[#171717] hover:border-[#171717]'
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                    activeDatePreset === 'this_month' && hasDateFilter
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#666666] border-[#ebebeb] hover:text-[#171717] hover:border-[#171717]'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLastMonth}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                    activeDatePreset === 'last_month' && hasDateFilter
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#666666] border-[#ebebeb] hover:text-[#171717] hover:border-[#171717]'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLast30Days}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                    activeDatePreset === 'last_30_days' && hasDateFilter
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#666666] border-[#ebebeb] hover:text-[#171717] hover:border-[#171717]'
                  }`}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* From & To Custom Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#ebebeb] text-xs font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-[6px] bg-white border border-[#ebebeb] space-y-1 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Filtered Records
            </span>
            {hasDateFilter && (
              <span className="font-mono text-[10px] font-medium bg-[#fafafa] text-[#171717] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb]">
                Custom Date
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171717] font-mono tabular-nums">
            {filtered.length}
          </div>
        </div>

        <div className="p-4 rounded-[6px] bg-white border border-[#ebebeb] space-y-1 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Filtered Earnings
            </span>
            <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
              Attributed
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#297a3a] font-mono tabular-nums">
            {formatIDR(totalFilteredCommission)}
          </div>
        </div>
      </div>

      {/* Main Ledger Table / Cards */}
      <div className="border border-[#ebebeb] rounded-[6px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#666666]">Loading ledger records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-[#a8a8a8]" />
            <p className="text-sm font-semibold text-[#171717]">No commission records found.</p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Any commissions matching the selected status and calendar date filter will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#ebebeb]">
              {filtered.map((item) => {
                const isPaid = item.payment_status === 'paid' || item.payment_verified;
                const isApproved = item.status === 'approved';
                const isCancelled = item.status === 'cancelled' || item.booking_status === 'Cancelled';

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-xs text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          #{item.booking_id}
                        </span>

                        {/* Payment Label: Paid / Unpaid */}
                        {isPaid ? (
                          <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                            Paid
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                            Unpaid
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-xs text-[#666666]">
                        {new Date(item.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Treatment Name & Status */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <p className="text-[#171717] truncate font-medium">
                        {item.guest_name} • {item.treatment_name || 'Spa Treatment'}
                      </p>

                      {/* Treatment Status Label */}
                      {isCancelled ? (
                        <span className="font-mono text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-[4px] border border-red-200 whitespace-nowrap">
                          Cancelled
                        </span>
                      ) : item.booking_status === 'Ongoing' || item.treatment_status === 'Ongoing' ? (
                        <span className="font-mono text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-[4px] border border-indigo-200 flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Ongoing
                        </span>
                      ) : item.booking_status === 'Completed' || item.treatment_status === 'Finish' || item.service_completed ? (
                        <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20 whitespace-nowrap">
                          Finish
                        </span>
                      ) : item.booking_status === 'Confirmed' ? (
                        <span className="font-mono text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200 whitespace-nowrap">
                          Confirmed
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200 whitespace-nowrap">
                          Awaiting Treatment
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#ebebeb]">
                      <div>
                        <span className="font-mono text-[10px] text-[#666666] uppercase block">Treatment Net</span>
                        <span className="font-semibold text-[#171717] font-mono tabular-nums">{formatIDR(item.eligible_treatment_amount)}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-[10px] text-[#297a3a] uppercase block">Commission ({item.commission_rate_pct}%)</span>
                        <span className={`text-xs font-bold font-mono tabular-nums ${isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between">
                      {/* Commission Status */}
                      {isCancelled ? (
                        <span className="font-mono text-[10px] font-medium text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          Cancelled
                        </span>
                      ) : item.status === 'paid' ? (
                        <span className="font-mono text-[10px] font-medium text-white bg-[#171717] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                          ✓ Paid Out
                        </span>
                      ) : isApproved ? (
                        <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                          Approved
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                          Pending
                        </span>
                      )}

                      <Link
                        href={`/invoice/${item.booking_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-[#171717] hover:underline"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={11} className="text-[#666666]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] border-b border-[#ebebeb] font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
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
                <tbody className="divide-y divide-[#ebebeb]">
                  {filtered.map((item) => {
                    const isPaid = item.payment_status === 'paid' || item.payment_verified;
                    const isApproved = item.status === 'approved';
                    const isCancelled = item.status === 'cancelled' || item.booking_status === 'Cancelled';

                    return (
                      <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[#666666]">
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
                            className="inline-flex items-center gap-1 font-mono font-bold text-[#171717] hover:underline group"
                            title="View treatment & invoice details"
                          >
                            <span>#{item.booking_id}</span>
                            <ExternalLink size={10} className="text-[#8f8f8f] group-hover:text-[#171717] transition-colors" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#171717]">{item.guest_name}</div>
                          <div className="text-[11px] text-[#666666] truncate max-w-[160px]">{item.treatment_name || 'Spa Treatment'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                              Paid
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="font-mono text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-[4px] border border-red-200">
                              Cancelled
                            </span>
                          ) : item.booking_status === 'Ongoing' || item.treatment_status === 'Ongoing' ? (
                            <span className="font-mono text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-[4px] border border-indigo-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              Ongoing
                            </span>
                          ) : item.booking_status === 'Completed' || item.treatment_status === 'Finish' || item.service_completed ? (
                            <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                              Finish
                            </span>
                          ) : item.booking_status === 'Confirmed' ? (
                            <span className="font-mono text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                              Confirmed
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              Awaiting Treatment
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#171717] font-mono tabular-nums">
                          {formatIDR(item.eligible_treatment_amount)}
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono tabular-nums">
                          <span className={isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#297a3a]'}>
                            {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isCancelled ? (
                            <span className="font-mono text-[10px] font-medium text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Cancelled
                            </span>
                          ) : item.status === 'paid' ? (
                            <span className="font-mono text-[10px] font-medium text-white bg-[#171717] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                              ✓ Paid Out
                            </span>
                          ) : isApproved ? (
                            <span className="font-mono text-[10px] font-medium text-[#297a3a] bg-[#297a3a]/10 px-2 py-0.5 rounded-[4px] border border-[#297a3a]/20">
                              Approved
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/invoice/${item.booking_id}`}
                            target="_blank"
                            className="text-[#171717] font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <span>Invoice</span>
                            <ExternalLink size={10} className="text-[#666666]" />
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
