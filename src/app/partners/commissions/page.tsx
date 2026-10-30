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
  Filter,
  Zap,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Sparkline SVG Component (Kravio style)
function Sparkline({ color = 'green', trend = 'up' }: { color?: 'green' | 'teal' | 'red'; trend?: 'up' | 'down' }) {
  const strokeColor = color === 'green' ? '#16a34a' : color === 'teal' ? '#0d9488' : '#ef4444';
  const fillGradientId = `comm-sparkline-grad-${color}-${trend}`;

  const pathD = trend === 'up'
    ? 'M 0 30 Q 15 28, 25 18 T 50 22 T 75 10 T 100 5'
    : 'M 0 10 Q 20 12, 35 22 T 60 18 T 80 28 T 100 32';

  const areaD = `${pathD} L 100 38 L 0 38 Z`;

  return (
    <svg viewBox="0 0 100 38" className="w-18 h-8 shrink-0 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

    const interval = setInterval(loadCommissions, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
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

  // Global Financial KPI Calculations
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

  // Combined Filtering
  const filtered = useMemo(() => {
    return commissions.filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guest = (c.guest_name || '').toLowerCase();
        const ref = (c.booking_id || '').toLowerCase();
        const treatment = (c.treatment_name || '').toLowerCase();
        if (!guest.includes(q) && !ref.includes(q) && !treatment.includes(q)) return false;
      }

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
    <div className="space-y-6 w-full pb-12 font-sans">
      
      {/* Title & Short Functional Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            Commissions
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Audit itemized affiliate commissions, net rates, and disbursement clearances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            loadCommissions();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#e5e7eb] text-xs font-medium text-[#374151] hover:bg-[#f9fafb] shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4-KPI Horizontal Strip (Kravio styled with SVG sparklines) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Total Commission</span>
            <Receipt size={14} className="text-[#9ca3af]" />
          </div>
          <div className="text-2xl font-bold text-[#111827] font-mono tabular-nums">
            {formatIDR(kpiTotals.totalEarned)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
              Gross Cumulative
            </span>
            <Sparkline color="green" trend="up" />
          </div>
        </div>

        {/* Approved Commission */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#16a34a]">Approved Commission</span>
            <ShieldCheck size={14} className="text-[#16a34a]" />
          </div>
          <div className="text-2xl font-bold text-[#16a34a] font-mono tabular-nums">
            {formatIDR(kpiTotals.approved)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded-[4px]">
              Cleared to Withdraw
            </span>
            <Sparkline color="teal" trend="up" />
          </div>
        </div>

        {/* Pending Commission */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Pending Commission</span>
            <Clock size={14} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {formatIDR(kpiTotals.pending)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[4px] border border-amber-200">
              In Escrow
            </span>
            <Sparkline color="green" trend="down" />
          </div>
        </div>

        {/* Paid Commission */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#111827]">Paid Out</span>
            <Wallet size={14} className="text-[#9ca3af]" />
          </div>
          <div className="text-2xl font-bold text-[#111827] font-mono tabular-nums">
            {formatIDR(kpiTotals.paid)}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-semibold text-white bg-[#111827] px-1.5 py-0.5 rounded-[4px]">
              Disbursed
            </span>
            <Sparkline color="teal" trend="up" />
          </div>
        </div>
      </div>

      {/* Kravio Filter Controls Toolbar Card */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 rounded-[8px] bg-[#f3f4f6] text-xs">
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
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === key
                      ? 'bg-[#111827] text-white shadow-xs font-semibold'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Date Controls */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <input
                type="text"
                placeholder="Search guest or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#111827]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                hasDateFilter || showCalendarFilter
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-[#374151] border-[#e5e7eb] hover:bg-[#f9fafb] shadow-xs'
              }`}
            >
              <CalendarDays size={13} />
              <span>
                {hasDateFilter ? `${startDate || 'Start'} → ${endDate || 'End'}` : 'Filter by Date'}
              </span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${showCalendarFilter ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Calendar Panel */}
        {showCalendarFilter && (
          <div className="p-3.5 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] space-y-3 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111827]">Select Date Range</span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="text-xs text-[#6b7280] hover:text-[#111827] flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} />
                  <span>Clear Filter</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleResetDate}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border ${
                  !hasDateFilter ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6b7280] border-[#e5e7eb]'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={handleSetThisMonth}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border ${
                  activeDatePreset === 'this_month' && hasDateFilter ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6b7280] border-[#e5e7eb]'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSetLastMonth}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border ${
                  activeDatePreset === 'last_month' && hasDateFilter ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6b7280] border-[#e5e7eb]'
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={handleSetLast30Days}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border ${
                  activeDatePreset === 'last_30_days' && hasDateFilter ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6b7280] border-[#e5e7eb]'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>
        )}

        {/* Ledger Summary Bar */}
        <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280] flex-wrap gap-2">
          <span>Showing <strong className="text-[#111827]">{filtered.length}</strong> records</span>
          <span>Filtered Total: <strong className="text-[#16a34a] font-bold font-mono">{formatIDR(totalFilteredCommission)}</strong></span>
        </div>
      </div>

      {/* Main Ledger Table (Kravio SLA Monitoring Table Style) */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#6b7280]">Loading commission records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-[#9ca3af]" />
            <p className="text-sm font-semibold text-[#111827]">No commission records found.</p>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              Any commissions matching the selected status will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-medium text-[#6b7280]">
                <tr>
                  <th className="py-3 px-4 w-8">
                    <input type="checkbox" className="rounded-[4px] border-[#d1d5db]" readOnly />
                  </th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Guest & Treatment</th>
                  <th className="py-3 px-4">Treatment Net</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((item, idx) => {
                  const isPaid = item.status === 'paid';
                  const isApproved = item.status === 'approved';
                  const isCancelled = item.status === 'cancelled';

                  return (
                    <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-3.5 px-4">
                        <input type="checkbox" defaultChecked={idx === 0} className="rounded-[4px] border-[#d1d5db]" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#6b7280] whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#111827] whitespace-nowrap">
                        <Link href={`/invoice/${item.booking_id}`} target="_blank" className="hover:underline">
                          #{item.booking_id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#111827]">{item.guest_name}</div>
                        <div className="text-[11px] text-[#6b7280] truncate max-w-[180px]">{item.treatment_name || 'Spa Treatment'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-[#111827] whitespace-nowrap">
                        {formatIDR(item.eligible_treatment_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#6b7280] whitespace-nowrap">
                        {item.commission_rate_pct}%
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#16a34a] whitespace-nowrap">
                        +{formatIDR(item.commission_amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="font-mono text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-[4px]">
                            Cancelled
                          </span>
                        ) : isPaid ? (
                          <span className="font-mono text-[10px] font-semibold text-white bg-[#111827] px-2 py-0.5 rounded-[4px]">
                            PAID OUT
                          </span>
                        ) : isApproved ? (
                          <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[4px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="text-[#111827] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Invoice</span>
                          <ExternalLink size={10} className="text-[#9ca3af]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
