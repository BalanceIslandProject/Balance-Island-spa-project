'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Search, 
  X, 
  ChevronDown,
  Calendar as CalendarIcon,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal, { cleanTreatmentName, extractDuration } from '../ScheduleTrackingModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

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

    const channel = supabase
      .channel('partner_commissions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => loadCommissions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadCommissions())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = clean.split('-').map(Number);
      if (y && m && d) {
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // 4 Financial Summary Metrics
  const { totalCommission, pendingCommission, approvedCommission, paidCommission, counts } = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let paid = 0;

    let pendingCount = 0;
    let approvedCount = 0;
    let paidCount = 0;
    let cancelledCount = 0;

    commissions.forEach((c) => {
      const isCancelled = c.status === 'cancelled' || c.status === 'declined' || c.booking_status?.toLowerCase() === 'cancelled';
      if (isCancelled) {
        cancelledCount++;
        return;
      }

      const amt = Number(c.commission_amount || 0);
      if (c.status === 'paid') {
        paid += amt;
        paidCount++;
      } else if (c.status === 'approved') {
        approved += amt;
        approvedCount++;
      } else {
        pending += amt;
        pendingCount++;
      }
    });

    const total = pending + approved + paid;

    return {
      totalCommission: total,
      pendingCommission: pending,
      approvedCommission: approved,
      paidCommission: paid,
      counts: {
        all: commissions.length,
        pending: pendingCount,
        approved: approvedCount,
        paid: paidCount,
        cancelled: cancelledCount,
      },
    };
  }, [commissions]);

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const status = (c.status || 'pending').toLowerCase();
      const isCancelled = status === 'cancelled' || status === 'declined' || c.booking_status?.toLowerCase() === 'cancelled';

      if (filterStatus === 'pending') {
        if (isCancelled || status !== 'pending') return false;
      } else if (filterStatus === 'approved') {
        if (isCancelled || status !== 'approved') return false;
      } else if (filterStatus === 'paid') {
        if (isCancelled || status !== 'paid') return false;
      } else if (filterStatus === 'cancelled') {
        if (!isCancelled) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bId = (c.booking_id || '').toLowerCase();
        const tName = (c.treatment_name || '').toLowerCase();
        if (!bId.includes(q) && !tName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [commissions, filterStatus, searchQuery]);

  const itemAsCalendarBooking = (item: any): CalendarBooking => ({
    id: String(item.id || item.booking_id),
    booking_id: item.booking_id,
    date: item.booking_date || (item.created_at ? item.created_at.split('T')[0] : ''),
    time: item.time || '',
    duration: extractDuration(item.treatment_name, item.duration),
    location: item.location || '',
    room_number: item.room_number || '',
    created_at: item.created_at,
    guest_name: item.guest_name || 'Guest',
    treatment_name: cleanTreatmentName(item.treatment_name),
    treatment_amount: Number(item.eligible_treatment_amount || item.gross_amount || 0),
    gross_amount: Number(item.eligible_treatment_amount || item.gross_amount || 0),
    commission_rate_pct: Number(item.commission_rate_pct || 15),
    commission_amount: Number(item.commission_amount || 0),
    commission_status: item.status || 'pending',
    payment_status: item.status === 'paid' ? 'paid' : 'unpaid',
    payment_verified: item.status === 'paid',
    booking_status: item.status === 'cancelled' ? 'Cancelled' : 'Confirmed',
  });

  return (
    <div className="space-y-6 w-full font-sans max-w-[1400px] mx-auto pb-8">
      
      {/* ========================================================
          1. PAGE HEADER (MATCHING MOCKUP SCREEN 4)
         ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#0F172A] tracking-tight leading-tight">
            Commissions
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Track your commission earnings.
          </p>
        </div>

        {/* Month Selector Button */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
          >
            <CalendarIcon size={14} className="text-[#64748B]" />
            <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
            <ChevronDown size={14} className="text-[#94A3B8]" />
          </button>

          {showMonthDropdown && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg py-1 z-30 max-h-60 overflow-y-auto text-xs">
              {MONTH_NAMES.map((mName, mIdx) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(mIdx);
                    setShowMonthDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-[#F8FAFC] transition-colors ${currentMonth === mIdx ? 'text-[#0E2319] font-semibold bg-[#F1F5F9]' : 'text-[#475569]'}`}
                >
                  {mName} {currentYear}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. FINANCIAL SUMMARY CARDS (4 METRICS)
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL COMMISSION */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Total Commission
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(totalCommission)}
          </div>
          <div className="text-[12px] text-[#94A3B8]">
            Lifetime attribution
          </div>
        </div>

        {/* PENDING */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Pending
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(pendingCommission)}
          </div>
          <div className="text-[12px] text-[#D97706] font-medium">
            {counts.pending} {counts.pending === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>

        {/* APPROVED */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Approved
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(approvedCommission)}
          </div>
          <div className="text-[12px] text-[#059669] font-medium">
            Ready for withdrawal
          </div>
        </div>

        {/* PAID */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-2xs space-y-2">
          <div className="text-[13px] font-medium text-[#64748B]">
            Paid
          </div>
          <div className="text-[22px] sm:text-[24px] font-semibold text-[#0F172A] tracking-tight tabular-nums">
            {formatIDR(paidCommission)}
          </div>
          <div className="text-[12px] text-[#64748B]">
            Disbursed to bank
          </div>
        </div>

      </div>

      {/* ========================================================
          3. TRANSACTION TABLE & FILTERS
         ======================================================== */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        
        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'pending', label: 'Pending', count: counts.pending },
              { key: 'approved', label: 'Approved', count: counts.approved },
              { key: 'paid', label: 'Paid', count: counts.paid },
              { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ].map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0E2319] text-white shadow-2xs font-semibold'
                      : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[11px] font-mono ${isActive ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference or treatment..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#E2E8F0] rounded-[6px] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0E2319] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 px-4">Treatment</th>
                <th className="pb-3 px-4">Booking Date</th>
                <th className="pb-3 px-4 text-right">Commission</th>
                <th className="pb-3 px-4 text-center">Status</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#94A3B8]">
                    Loading commission transactions...
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#94A3B8]">
                    No commission transactions found.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((c) => {
                  const ref = c.booking_id ? `#${c.booking_id}` : `#${c.id?.slice(0, 6)}`;
                  const title = cleanTreatmentName(c.treatment_name);
                  const isPaid = c.status === 'paid';
                  const isApproved = c.status === 'approved';
                  const isCancelled = c.status === 'cancelled' || c.status === 'declined' || c.booking_status?.toLowerCase() === 'cancelled';

                  return (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-semibold text-[#0F172A]">
                        {ref}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                        {title}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {formatDate(c.booking_date || c.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                        {isCancelled ? (
                          <span className="text-[#94A3B8] line-through font-normal">Rp0</span>
                        ) : (
                          <span className="text-[#0F172A]">{formatIDR(c.commission_amount)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium capitalize ${
                          isCancelled
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : isPaid
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : isApproved
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : 'bg-[#FFFBEB] text-[#D97706]'
                        }`}>
                          {isCancelled ? 'Cancelled' : c.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => setTrackingBooking(itemAsCalendarBooking(c))}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E2319] hover:underline cursor-pointer"
                        >
                          <span>Track</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Tracking Modal */}
      {trackingBooking && (
        <ScheduleTrackingModal
          booking={trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}

    </div>
  );
}
