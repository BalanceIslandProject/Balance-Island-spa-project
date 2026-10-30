'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  Receipt, 
  CalendarDays, 
  X, 
  RotateCcw, 
  Calendar as CalendarIcon,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
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

  // Global Financial KPI Calculations across all commissions
  const kpiTotals = useMemo(() => {
    let totalEarned = 0;
    let approved = 0;
    let pending = 0;
    let paid = 0;

    for (const c of commissions) {
      if (c.status === 'cancelled') continue;
      const amt = Number(c.commission_amount || 0);
      totalEarned += amt;

      if (c.status === 'approved') approved += amt;
      else if (c.status === 'pending') pending += amt;
      else if (c.status === 'paid') paid += amt;
    }

    return { totalEarned, approved, pending, paid };
  }, [commissions]);

  // Combined Status, Search, and Calendar Filtering
  const filtered = useMemo(() => {
    return commissions.filter((c) => {
      // 1. Status Filter
      if (filterStatus !== 'all' && c.status !== filterStatus) {
        return false;
      }

      // 2. Search Query (Guest, Booking Ref, Treatment)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guest = (c.guest_name || '').toLowerCase();
        const ref = (c.booking_id || '').toLowerCase();
        const treatment = (c.treatment_name || '').toLowerCase();
        if (!guest.includes(q) && !ref.includes(q) && !treatment.includes(q)) {
          return false;
        }
      }

      // 3. Calendar Date Filter
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
  }, [commissions, filterStatus, searchQuery, startDate, endDate]);

  const totalFilteredCommission = useMemo(() => {
    return filtered.reduce((sum, c) => {
      if (c.status === 'cancelled') return sum;
      return sum + Number(c.commission_amount || 0);
    }, 0);
  }, [filtered]);

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="space-y-4 w-full pb-12 font-sans">
      
      {/* 4-KPI Financial Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Earned */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666]">
              Total Earned
            </span>
            <span className="font-mono text-[10px] text-[#666666] bg-[#fafafa] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb]">
              Gross
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171717] font-mono tabular-nums">
            {formatIDR(kpiTotals.totalEarned)}
          </div>
          <p className="text-[11px] text-[#666666]">Cumulative affiliate commissions</p>
        </div>

        {/* Approved Commission */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#16a34a]">
              Approved
            </span>
            <span className="font-mono text-[10px] text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px] border border-[#16a34a]/20">
              Ready
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#16a34a] font-mono tabular-nums">
            {formatIDR(kpiTotals.approved)}
          </div>
          <p className="text-[11px] text-[#666666]">Completed & cleared for withdrawal</p>
        </div>

        {/* Pending Commission */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-amber-700">
              Pending
            </span>
            <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[4px] border border-amber-200">
              In Escrow
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {formatIDR(kpiTotals.pending)}
          </div>
          <p className="text-[11px] text-[#666666]">Awaiting treatment execution</p>
        </div>

        {/* Paid Commission */}
        <div className="p-4 sm:p-5 rounded-[6px] bg-white border border-[#ebebeb] space-y-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#171717]">
              Paid Out
            </span>
            <span className="font-mono text-[10px] text-white bg-[#171717] px-1.5 py-0.5 rounded-[4px]">
              Settled
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171717] font-mono tabular-nums">
            {formatIDR(kpiTotals.paid)}
          </div>
          <p className="text-[11px] text-[#666666]">Disbursed to your bank account</p>
        </div>
      </div>

      {/* Filter Controls Toolbar Card */}
      <div className="bg-white border border-[#ebebeb] rounded-[6px] p-3 sm:p-4 space-y-3 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
        
        {/* Top Controls: Status Tabs, Search, Date Toggle, Refresh */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] text-xs min-w-max">
              {[
                { key: 'all', label: 'All Commissions' },
                { key: 'approved', label: 'Approved' },
                { key: 'pending', label: 'Pending' },
                { key: 'paid', label: 'PAID OUT' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(({ key, label }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-[4px] font-mono text-[11px] uppercase tracking-[0.05em] transition-all whitespace-nowrap cursor-pointer ${
                    filterStatus === key
                      ? 'bg-[#171717] text-white shadow-xs font-semibold'
                      : 'text-[#666666] hover:text-[#171717]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Controls: Search, Date Filter, Refresh */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8f8f8f] pointer-events-none" />
              <input
                type="text"
                placeholder="Search guest or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#ebebeb] rounded-[6px] text-[#171717] placeholder:text-[#8f8f8f] focus:outline-none focus:border-[#171717] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8f8f8f] hover:text-[#171717]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Date Preset Toggle Button */}
            <button
              type="button"
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadCommissions();
              }}
              disabled={loading}
              className="p-1.5 text-[#171717] hover:bg-[#fafafa] rounded-[6px] transition-colors cursor-pointer border border-[#ebebeb]"
              title="Refresh ledger"
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
          <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-[#ebebeb] space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.071em] text-[#666666] flex items-center gap-1.5">
                <CalendarIcon size={13} className="text-[#666666]" />
                <span>Date Range Presets</span>
              </span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="font-mono text-[11px] uppercase tracking-[0.071em] text-[#666666] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} />
                  <span>Clear Filter</span>
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleResetDate}
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.05em] transition-all cursor-pointer border ${
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
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.05em] transition-all cursor-pointer border ${
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
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.05em] transition-all cursor-pointer border ${
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
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.05em] transition-all cursor-pointer border ${
                  activeDatePreset === 'last_30_days' && hasDateFilter
                    ? 'bg-[#171717] text-white border-[#171717]'
                    : 'bg-white text-[#666666] border-[#ebebeb] hover:text-[#171717] hover:border-[#171717]'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            {/* From & To Custom Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-1.5 rounded-[6px] border border-[#ebebeb] text-xs font-mono font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-medium text-[#666666] uppercase tracking-[0.071em] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('custom');
                  }}
                  className="w-full px-3 py-1.5 rounded-[6px] border border-[#ebebeb] text-xs font-mono font-medium text-[#171717] bg-white focus:outline-none focus:border-[#171717]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Ledger Metrics Bar */}
        <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between text-xs font-mono text-[#666666] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-[#171717]">{filtered.length}</strong> records</span>
            {hasDateFilter && (
              <span className="bg-[#fafafa] text-[#171717] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb] text-[10px]">
                Date filtered
              </span>
            )}
            {searchQuery && (
              <span className="bg-[#fafafa] text-[#171717] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb] text-[10px]">
                Matching &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <div>
            <span>Filtered Total: <strong className="text-[#16a34a] font-bold">{formatIDR(totalFilteredCommission)}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table / Cards */}
      <div className="border border-[#ebebeb] rounded-[6px] bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#666666]">Loading commission records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-[#a8a8a8]" />
            <p className="text-sm font-semibold text-[#171717]">No commission records found.</p>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Any commissions matching the selected status and date range will appear here.
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-xs text-[#171717] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          #{item.booking_id}
                        </span>

                        {isPaid ? (
                          <span className="font-mono text-[10px] font-medium text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20">
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

                    {/* Guest & Treatment */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <p className="text-[#171717] truncate font-medium">
                        {item.guest_name} • {item.treatment_name || 'Spa Treatment'}
                      </p>

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
                        <span className="font-mono text-[10px] font-medium text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20 whitespace-nowrap">
                          Finish
                        </span>
                      ) : item.booking_status === 'Confirmed' ? (
                        <span className="font-mono text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200 whitespace-nowrap">
                          Confirmed
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200 whitespace-nowrap">
                          Awaiting
                        </span>
                      )}
                    </div>

                    {/* Financial Figures */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#ebebeb]">
                      <div>
                        <span className="font-mono text-[10px] text-[#666666] uppercase tracking-[0.05em] block">Treatment Net</span>
                        <span className="font-semibold text-[#171717] font-mono tabular-nums">{formatIDR(item.eligible_treatment_amount)}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-[10px] text-[#16a34a] uppercase tracking-[0.05em] block">
                          Earned ({item.commission_rate_pct}%)
                        </span>
                        <span className={`text-xs font-bold font-mono tabular-nums ${isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#16a34a]'}`}>
                          {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    {/* Status & Invoice Link */}
                    <div className="pt-2 border-t border-[#ebebeb] flex items-center justify-between">
                      {isCancelled ? (
                        <span className="font-mono text-[10px] font-medium text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                          Cancelled
                        </span>
                      ) : item.status === 'paid' ? (
                        <span className="font-mono text-[10px] font-medium text-white bg-[#171717] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                          ✓ PAID OUT
                        </span>
                      ) : isApproved ? (
                        <span className="font-mono text-[10px] font-medium text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20">
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
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Guest & Treatment</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Treatment Status</th>
                    <th className="py-3 px-4">Treatment Net</th>
                    <th className="py-3 px-4">Rate</th>
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
                        <td className="py-3.5 px-4 font-mono text-[#666666] whitespace-nowrap">
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
                          <div className="text-[11px] text-[#666666] truncate max-w-[180px]">{item.treatment_name || 'Spa Treatment'}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <span className="font-mono text-[10px] font-medium text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20">
                              Paid
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                            <span className="font-mono text-[10px] font-medium text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20">
                              Finish
                            </span>
                          ) : item.booking_status === 'Confirmed' ? (
                            <span className="font-mono text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                              Confirmed
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              Awaiting
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#171717] font-mono tabular-nums whitespace-nowrap">
                          {formatIDR(item.eligible_treatment_amount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#666666] whitespace-nowrap">
                          {item.commission_rate_pct}%
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono tabular-nums whitespace-nowrap">
                          <span className={isCancelled ? 'line-through text-[#8f8f8f]' : 'text-[#16a34a]'}>
                            {isCancelled ? 'IDR 0' : `+${formatIDR(item.commission_amount)}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isCancelled ? (
                            <span className="font-mono text-[10px] font-medium text-[#666666] bg-[#fafafa] px-2 py-0.5 rounded-[4px] border border-[#ebebeb]">
                              Cancelled
                            </span>
                          ) : item.status === 'paid' ? (
                            <span className="font-mono text-[10px] font-medium text-white bg-[#171717] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                              ✓ PAID OUT
                            </span>
                          ) : isApproved ? (
                            <span className="font-mono text-[10px] font-medium text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-[4px] border border-[#16a34a]/20">
                              Approved
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/invoice/${item.booking_id}`}
                            target="_blank"
                            className="text-[#171717] font-semibold hover:underline inline-flex items-center gap-1"
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
