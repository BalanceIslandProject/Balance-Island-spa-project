'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  XCircle, 
  Search, 
  X, 
  ChevronRight,
  Wallet,
  Clock,
  Timer,
  MapPin,
  DoorClosed,
  User,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CalendarBooking } from '../FloatingBookingCalendar';
import ScheduleTrackingModal, { cleanTreatmentName, extractDuration } from '../ScheduleTrackingModal';

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);

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

  const { totalPaidOut, paidBookingsCount, cancelledCount, totalCancelledAmount } = useMemo(() => {
    let paid = 0;
    let paidCount = 0;
    let cancelled = 0;
    let cancelledAmt = 0;

    commissions.forEach((c) => {
      const isCancelled = c.status === 'cancelled' || c.status === 'declined';
      const isPaid = c.status === 'paid' || Boolean(c.payment_verified);

      if (isCancelled) {
        cancelled += 1;
        cancelledAmt += Number(c.commission_amount || 0);
      } else if (isPaid) {
        paid += Number(c.commission_amount || 0);
        paidCount += 1;
      }
    });

    return {
      totalPaidOut: paid,
      paidBookingsCount: paidCount,
      cancelledCount: cancelled,
      totalCancelledAmount: cancelledAmt,
    };
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const isCancelled = c.status === 'cancelled' || c.status === 'declined';
      const isPaid = c.status === 'paid' || Boolean(c.payment_verified);

      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'cancelled' && !isCancelled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bId = (c.booking_id || '').toLowerCase();
        const tName = (c.treatment_name || '').toLowerCase();
        const inv = (c.invoice_id || '').toLowerCase();
        if (!bId.includes(q) && !tName.includes(q) && !inv.includes(q)) {
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
    treatment_amount: Number(item.eligible_treatment_amount || 0),
    gross_amount: Number(item.eligible_treatment_amount || 0),
    commission_rate_pct: Number(item.commission_rate_pct || 15),
    commission_amount: Number(item.commission_amount || 0),
    commission_status: item.status || 'pending',
    payment_status: item.status === 'paid' ? 'paid' : 'unpaid',
    payment_verified: item.status === 'paid',
    booking_status: item.status === 'cancelled' ? 'Cancelled' : 'Confirmed',
  });

  return (
    <div className="space-y-6 w-full font-sans">
      
      {/* 1. HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0f172a] tracking-tight">
          Commissions
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          View your commission records.
        </p>
      </div>

      {/* 2. TOP SUMMARY CARDS (Paid Out & Cancelled) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paid Out Card */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <span className="text-xs font-medium text-[#64748b]">Paid Out</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0f172a]">
              {formatIDR(totalPaidOut)}
            </div>
            <div className="text-xs text-[#64748b] mt-1">
              {paidBookingsCount} {paidBookingsCount === 1 ? 'booking' : 'bookings'}
            </div>
          </div>
        </div>

        {/* Cancelled Card */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#fef2f2] text-[#dc2626] flex items-center justify-center">
                <XCircle size={16} />
              </div>
              <span className="text-xs font-medium text-[#64748b]">Cancelled</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0f172a]">
              {cancelledCount}
            </div>
            <div className="text-xs text-[#64748b] mt-1">
              {formatIDR(totalCancelledAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#0f172a] hover:bg-[#f8fafc]'
            }`}
          >
            All {commissions.length > 0 && <span className="ml-1 opacity-80">{commissions.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#0f172a] hover:bg-[#f8fafc]'
            }`}
          >
            Paid Out {paidBookingsCount > 0 && <span className="ml-1 opacity-80">{paidBookingsCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('cancelled')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'cancelled'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#0f172a] hover:bg-[#f8fafc]'
            }`}
          >
            Cancelled {cancelledCount > 0 && <span className="ml-1 opacity-80">{cancelledCount}</span>}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking or invoice..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 4. COMMISSIONS LIST: DESKTOP TABLE & MOBILE CARDS */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-10 text-center text-xs text-[#94a3b8]">
          Loading commissions ledger...
        </div>
      ) : filteredCommissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-[#0f172a]">No commission records</p>
          <p className="text-xs text-[#64748b]">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search query or status filter.'
              : 'Referral commissions will be automatically tracked here as guests book.'}
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]/50 text-[#94a3b8] font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-4">Booking ID</th>
                    <th className="py-3.5 px-4">Treatment</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">Commission</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredCommissions.map((comm) => {
                    const isCancelled = comm.status === 'cancelled' || comm.status === 'declined';
                    const isPaid = comm.status === 'paid' || Boolean(comm.payment_verified);
                    const isApproved = comm.status === 'approved';
                    const cleanTreatment = cleanTreatmentName(comm.treatment_name);
                    const durationStr = extractDuration(comm.treatment_name, comm.duration);

                    return (
                      <tr key={comm.id || comm.booking_id} className="hover:bg-[#f8fafc] transition-colors">
                        {/* Date */}
                        <td className="py-3.5 px-5 text-[#64748b] whitespace-nowrap">
                          {formatDate(comm.created_at)}
                        </td>

                        {/* Booking ID */}
                        <td className="py-3.5 px-4 font-mono font-medium text-[#0f172a] whitespace-nowrap">
                          #{comm.booking_id}
                        </td>

                        {/* Treatment with Clean Name and Icons */}
                        <td className="py-3.5 px-4">
                          <div className="text-[#0f172a] font-medium max-w-[240px]">
                            {cleanTreatment}
                          </div>
                          {/* Icons for Time, Duration, Location, Room */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#94a3b8] mt-1">
                            {comm.time && (
                              <span className="inline-flex items-center gap-0.5">
                                <Clock size={11} className="text-[#94a3b8]" />
                                <span>{comm.time}</span>
                              </span>
                            )}
                            {durationStr && (
                              <span className="inline-flex items-center gap-0.5">
                                <Timer size={11} className="text-[#94a3b8]" />
                                <span>{durationStr}</span>
                              </span>
                            )}
                            {comm.location && (
                              <span className="inline-flex items-center gap-0.5 max-w-[130px] truncate">
                                <MapPin size={11} className="text-[#94a3b8]" />
                                <span className="truncate">{comm.location}</span>
                              </span>
                            )}
                            {comm.room_number && comm.room_number !== '-' && (
                              <span className="inline-flex items-center gap-0.5">
                                <DoorClosed size={11} className="text-[#94a3b8]" />
                                <span>Room {comm.room_number}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rate */}
                        <td className="py-3.5 px-4 font-mono text-[#64748b]">
                          {comm.commission_rate_pct || 15}%
                        </td>

                        {/* Commission Amount */}
                        <td className="py-3.5 px-4 font-semibold text-[#0f172a] whitespace-nowrap">
                          {formatIDR(comm.commission_amount)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Paid Out
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" /> Cancelled
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Action: Track Button with Icon */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setTrackingBooking(itemAsCalendarBooking(comm))}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-[6px] bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Activity size={12} className="text-white/80" />
                            <span>Track</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {filteredCommissions.map((comm) => {
              const isCancelled = comm.status === 'cancelled' || comm.status === 'declined';
              const isPaid = comm.status === 'paid' || Boolean(comm.payment_verified);
              const isApproved = comm.status === 'approved';
              const cleanTreatment = cleanTreatmentName(comm.treatment_name);
              const durationStr = extractDuration(comm.treatment_name, comm.duration);

              return (
                <div
                  key={comm.id || comm.booking_id}
                  className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-[#94a3b8] font-mono">
                        {formatDate(comm.created_at)}
                      </div>
                      <div className="text-sm font-semibold text-[#0f172a] mt-0.5 leading-snug">
                        <span className="font-mono text-xs">#{comm.booking_id}</span> · {cleanTreatment}
                      </div>

                      {/* Metadata Icons: Time, Duration, Location, Room */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#94a3b8] mt-1.5">
                        {comm.time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} className="text-[#94a3b8]" />
                            <span>{comm.time}</span>
                          </span>
                        )}
                        {durationStr && (
                          <span className="inline-flex items-center gap-1">
                            <Timer size={11} className="text-[#94a3b8]" />
                            <span>{durationStr}</span>
                          </span>
                        )}
                        {comm.location && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin size={11} className="text-[#94a3b8]" />
                            <span className="truncate">{comm.location}</span>
                          </span>
                        )}
                        {comm.room_number && comm.room_number !== '-' && (
                          <span className="inline-flex items-center gap-1">
                            <DoorClosed size={11} className="text-[#94a3b8]" />
                            <span>Room {comm.room_number}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTrackingBooking(itemAsCalendarBooking(comm))}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-[6px] bg-[#0f172a] text-white text-xs font-medium shrink-0"
                    >
                      <Activity size={12} className="text-white/80" />
                      <span>Track</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
                    <div>
                      <div className="text-[10px] text-[#94a3b8] uppercase font-mono">Commission</div>
                      <div className="text-sm font-bold text-[#0f172a]">
                        {formatIDR(comm.commission_amount)}
                      </div>
                    </div>

                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Paid Out
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" /> Cancelled
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-[11px] text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Schedule Tracking Modal */}
      {trackingBooking && (
        <ScheduleTrackingModal
          booking={trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}
    </div>
  );
}
