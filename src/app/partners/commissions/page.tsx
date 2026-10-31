'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  Receipt, 
  CalendarDays, 
  X, 
  Calendar as CalendarIcon,
  ChevronDown,
  RefreshCw,
  Search,
  Clock,
  Wallet,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal from '../ScheduleTrackingModal';

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  // Only two treatment statuses: 'all' (both Paid Out and Cancelled), 'paid', 'cancelled'
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCalendarFilter, setShowCalendarFilter] = useState<boolean>(false);
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);

  const itemAsCalendarBooking = (item: any): CalendarBooking => ({
    id: String(item.id || item.booking_id),
    booking_id: item.booking_id,
    date: item.created_at ? item.created_at.split('T')[0] : '',
    created_at: item.created_at,
    guest_name: item.guest_name || 'Guest',
    treatment_name: item.treatment_name || 'Spa Treatment',
    treatment_amount: Number(item.eligible_treatment_amount || 0),
    gross_amount: Number(item.eligible_treatment_amount || 0),
    commission_rate_pct: Number(item.commission_rate_pct || 10),
    commission_amount: Number(item.commission_amount || 0),
    commission_status: item.status || 'pending',
    payment_status: item.status === 'paid' ? 'paid' : 'unpaid',
    payment_verified: item.status === 'paid',
    booking_status: item.status === 'cancelled' ? 'Cancelled' : 'Confirmed',
  });

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

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
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

  // Strictly filter for the TWO relevant treatment statuses: 'paid' and 'cancelled'
  const relevantCommissions = useMemo(() => {
    return commissions.filter((c) => c.status === 'paid' || c.status === 'cancelled');
  }, [commissions]);

  // Two-status KPI summary: Paid Out & Cancelled
  const kpiTotals = useMemo(() => {
    let paidTotal = 0;
    let paidCount = 0;
    let cancelledCount = 0;

    for (const c of relevantCommissions) {
      if (c.status === 'paid') {
        paidTotal += Number(c.commission_amount || 0);
        paidCount++;
      } else if (c.status === 'cancelled') {
        cancelledCount++;
      }
    }

    return { paidTotal, paidCount, cancelledCount };
  }, [relevantCommissions]);

  // Combined Filtering (Status + Search + Date)
  const filtered = useMemo(() => {
    return relevantCommissions.filter((c) => {
      // 1. Status Filter
      if (filterStatus !== 'all' && c.status !== filterStatus) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guest = (c.guest_name || '').toLowerCase();
        const ref = (c.booking_id || '').toLowerCase();
        const treatment = (c.treatment_name || '').toLowerCase();
        if (!guest.includes(q) && !ref.includes(q) && !treatment.includes(q)) {
          return false;
        }
      }

      // 3. Date Range
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
  }, [relevantCommissions, filterStatus, searchQuery, startDate, endDate]);

  const totalFilteredCommission = useMemo(() => {
    return filtered.reduce((sum, c) => {
      if (c.status === 'cancelled') return sum;
      return sum + Number(c.commission_amount || 0);
    }, 0);
  }, [filtered]);

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="space-y-6 w-full pb-16 font-sans antialiased">
      

      {/* ─── Simplified 2-Status KPI Summary Strip (Paid Out & Cancelled Only) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Card 1: Paid Out */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white border border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-indigo-900 font-bold whitespace-nowrap">
              PAID OUT
            </span>
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/20 shrink-0">
              <Wallet size={14} />
            </span>
          </div>
          <div className="text-2xl sm:text-[30px] font-extrabold text-indigo-950 font-mono tabular-nums leading-none">
            {formatIDR(kpiTotals.paidTotal)}
          </div>
          <div className="flex items-center justify-start text-xs pt-2.5 border-t border-indigo-100/80">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/90 border border-indigo-200 px-2.5 py-0.5 rounded-md">
              {kpiTotals.paidCount} {kpiTotals.paidCount === 1 ? 'Settled Treatment' : 'Settled Treatments'}
            </span>
          </div>
        </div>

        {/* Card 2: Cancelled */}
        <div className="bg-gradient-to-br from-rose-50/90 via-orange-50/30 to-white border border-rose-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-rose-900 font-bold whitespace-nowrap">
              CANCELLED
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shadow-rose-500/20 shrink-0">
              <XCircle size={14} />
            </span>
          </div>
          <div className="text-2xl sm:text-[30px] font-extrabold text-rose-950 font-sans tabular-nums leading-none">
            {kpiTotals.cancelledCount}
          </div>
          <div className="flex items-center justify-start text-xs pt-2.5 border-t border-rose-100/80">
            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100/90 border border-rose-200 px-2.5 py-0.5 rounded-md">
              Rp0 Voided Commission
            </span>
          </div>
        </div>
      </div>

      {/* ─── CRM Filter Controls: 2-Status Tabs + Search & Date ─── */}
      <div className="bg-white border border-[#eaecf0] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Status Tabs: ONLY ALL, PAID OUT, CANCELLED */}
          <div className="overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
              {[
                { key: 'all' as const, label: 'All Records' },
                { key: 'paid' as const, label: 'Paid Out' },
                { key: 'cancelled' as const, label: 'Cancelled' }
              ].map(({ key, label }) => {
                const isSelected = filterStatus === key;
                let activeClass = 'bg-slate-900 text-white shadow-xs';
                if (key === 'paid') activeClass = 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20';
                else if (key === 'cancelled') activeClass = 'bg-rose-600 text-white shadow-xs shadow-rose-500/20';

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? activeClass
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Date Controls */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                placeholder="Search guest or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 shadow-2xs transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                hasDateFilter || showCalendarFilter
                  ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                  : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-2xs'
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
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#eaecf0] space-y-3 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a]">Select Date Range</span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetDate}
                  className="text-xs text-[#dc2626] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <X size={12} />
                  <span>Clear Filter</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResetDate}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  !hasDateFilter ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={handleSetThisMonth}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeDatePreset === 'this_month' && hasDateFilter ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSetLastMonth}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeDatePreset === 'last_month' && hasDateFilter ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={handleSetLast30Days}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeDatePreset === 'last_30_days' && hasDateFilter ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs font-bold' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>
        )}

        {/* Ledger Summary Bar */}
        <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b] flex-wrap gap-2">
          <span>Showing <strong className="text-[#0f172a]">{filtered.length}</strong> records</span>
          <span>Filtered Total: <strong className="text-[#16a34a] font-bold font-mono">{formatIDR(totalFilteredCommission)}</strong></span>
        </div>
      </div>

      {/* ─── Main Ledger Table ─── */}
      <div className="bg-white border border-[#eaecf0] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-mono text-xs text-[#64748b]">Loading commission records...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2.5">
            <Receipt size={28} className="mx-auto text-[#94a3b8]" />
            <p className="text-sm font-bold text-[#0f172a]">No commission records found.</p>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto leading-relaxed">
              Paid out and cancelled commissions will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] border-b border-[#eaecf0] font-mono text-[10px] uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Date</th>
                    <th className="py-3.5 px-4 font-bold">Invoice #</th>
                    <th className="py-3.5 px-4 font-bold text-right">Treatment Net</th>
                    <th className="py-3.5 px-4 font-bold text-center">Rate</th>
                    <th className="py-3.5 px-4 font-bold text-right">Commission</th>
                    <th className="py-3.5 px-4 font-bold text-center">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filtered.map((item) => {
                    const isPaid = item.status === 'paid';
                    const isCancelled = item.status === 'cancelled';

                    return (
                      <tr key={item.id} className="hover:bg-[#f8fafc]/70 transition-colors">
                        <td className="py-4 px-4 font-mono text-[11px] text-[#475569] whitespace-nowrap font-medium">
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs font-bold text-[#0f172a] whitespace-nowrap">
                          <Link href={`/invoice/${item.booking_id}`} target="_blank" className="hover:underline">
                            #{item.booking_id}
                          </Link>
                        </td>
                        <td className="py-4 px-4 font-mono text-right text-xs font-semibold text-[#0f172a] whitespace-nowrap tabular-nums">
                          {formatIDR(item.eligible_treatment_amount)}
                        </td>
                        <td className="py-4 px-4 font-mono text-center text-xs text-[#64748b] whitespace-nowrap tabular-nums">
                          {item.commission_rate_pct}%
                        </td>
                        <td className="py-4 px-4 font-mono text-right font-bold text-xs text-[#16a34a] whitespace-nowrap tabular-nums">
                          {isCancelled ? 'Rp0' : `+${formatIDR(item.commission_amount)}`}
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {isCancelled ? (
                            <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-3 py-1 rounded-full uppercase tracking-wider">
                              Cancelled
                            </span>
                          ) : isPaid ? (
                            <span className="font-mono text-[10px] font-bold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs shadow-indigo-500/20">
                              PAID OUT
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setTrackingBooking(itemAsCalendarBooking(item))}
                              className="h-7.5 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
                              title="Track schedule & booking details"
                            >
                              <Clock size={12} className="text-slate-300" />
                              <span>Track</span>
                            </button>
                            <Link
                              href={`/invoice/${item.booking_id}`}
                              target="_blank"
                              className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 hover:underline px-2 py-1"
                              title="View invoice"
                            >
                              <span>Invoice</span>
                              <ExternalLink size={11} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile App Commission Cards (< 768px) */}
            <div className="md:hidden space-y-3 p-3">
              {filtered.map((item) => {
                const isPaid = item.status === 'paid';
                const isCancelled = item.status === 'cancelled';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-[#eaecf0] space-y-3 shadow-xs hover:border-[#cbd5e1] transition-all overflow-hidden"
                  >
                    {/* Top Row: Invoice # + Date + Commission */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Link
                          href={`/invoice/${item.booking_id}`}
                          target="_blank"
                          className="font-mono text-xs font-bold text-[#0f172a] hover:underline"
                        >
                          #{item.booking_id}
                        </Link>
                        <span className="text-[#cbd5e1]">·</span>
                        <span className="font-mono text-[11px] text-[#64748b]">
                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${isCancelled ? 'line-through text-[#94a3b8]' : 'text-[#16a34a]'}`}>
                          {isCancelled ? 'Rp0' : `+${formatIDR(item.commission_amount)}`}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Net & Rate + Status Badge */}
                    <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                      <div className="font-mono text-[11px] text-[#64748b]">
                        Net {formatIDR(item.eligible_treatment_amount)} · {item.commission_rate_pct}%
                      </div>
                      <div className="shrink-0">
                        {isCancelled ? (
                          <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-3 py-1 rounded-full uppercase tracking-wider">
                            Cancelled
                          </span>
                        ) : isPaid ? (
                          <span className="font-mono text-[10px] font-bold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs shadow-indigo-500/20">
                            PAID OUT
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Native App Actions Bar: Full-width Track CTA + Invoice Button */}
                    <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTrackingBooking(itemAsCalendarBooking(item))}
                        className="flex-1 h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-transform shadow-xs"
                      >
                        <Clock size={13} className="text-slate-300" />
                        <span>Track</span>
                      </button>

                      <Link
                        href={`/invoice/${item.booking_id}`}
                        target="_blank"
                        className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1 active:scale-[0.98] transition-transform shadow-2xs"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={10} className="text-[#94a3b8]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Schedule Tracking Modal */}
      <ScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

    </div>
  );
}
