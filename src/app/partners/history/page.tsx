'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  CalendarDays, 
  Receipt, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { cleanTreatmentName } from '../ScheduleTrackingModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface HistoryEvent {
  id: string;
  type: 'booking' | 'commission' | 'payout';
  title: string;
  details: string;
  dateStr: string;
  status: string;
  statusType: 'completed' | 'approved' | 'paid' | 'pending' | 'cancelled';
}

export default function PartnerHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'booking' | 'commission' | 'payout'>('all');
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const formatIDR = (val: number | undefined | null) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val || 0);
    return `Rp${formatted}`;
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return 'Oct 27';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = clean.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const loadData = async () => {
    try {
      const [statsRes, commsRes, payoutsRes] = await Promise.all([
        fetch('/api/affiliates/stats').then((r) => r.json()),
        fetch('/api/affiliates/commissions').then((r) => r.json()),
        fetch('/api/affiliates/payouts').then((r) => r.json()),
      ]);

      if (statsRes.success) {
        setCalendarBookings(statsRes.calendarBookings || []);
      }
      if (commsRes.success) {
        setCommissions(commsRes.commissions || []);
      }
      if (payoutsRes.success) {
        setPayouts(payoutsRes.payouts || []);
      }
    } catch (e) {
      console.error('Failed to load history data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => {
    loadData();

    const onGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('partner:refresh', onGlobalRefresh);
    return () => window.removeEventListener('partner:refresh', onGlobalRefresh);
  }, []);

  // Compile unified activity history
  const historyEvents = useMemo(() => {
    const events: HistoryEvent[] = [];

    // 1. Bookings
    calendarBookings.forEach((b) => {
      const isCancelled = b.commission_status === 'cancelled' || b.booking_status === 'Cancelled';
      const isCompleted = b.booking_status === 'Completed' || b.service_completed || b.commission_status === 'paid';
      
      events.push({
        id: `book-${b.id || b.booking_id}`,
        type: 'booking',
        title: 'Booking',
        details: `${cleanTreatmentName(b.treatment_name)} #${b.booking_id}`,
        dateStr: b.date || b.created_at,
        status: isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Upcoming',
        statusType: isCancelled ? 'cancelled' : isCompleted ? 'completed' : 'pending',
      });
    });

    // 2. Commissions
    commissions.forEach((c) => {
      const isCancelled = c.status === 'cancelled' || c.status === 'declined';
      const isApproved = c.status === 'approved';
      const isPaid = c.status === 'paid';
      
      events.push({
        id: `comm-${c.id}`,
        type: 'commission',
        title: 'Commission',
        details: `+${formatIDR(c.commission_amount)}`,
        dateStr: c.booking_date || c.created_at,
        status: isPaid ? 'Paid' : isApproved ? 'Approved' : isCancelled ? 'Cancelled' : 'Pending',
        statusType: isPaid ? 'paid' : isApproved ? 'approved' : isCancelled ? 'cancelled' : 'pending',
      });
    });

    // 3. Payouts
    payouts.forEach((p) => {
      events.push({
        id: `pay-${p.id}`,
        type: 'payout',
        title: 'Payout',
        details: `${p.payout_reference || 'WD-0045'} (${formatIDR(p.amount)})`,
        dateStr: p.created_at,
        status: 'Paid',
        statusType: 'paid',
      });
    });

    // Sort descending by date
    events.sort((a, b) => {
      const tA = new Date(a.dateStr || 0).getTime();
      const tB = new Date(b.dateStr || 0).getTime();
      return tB - tA;
    });

    return events;
  }, [calendarBookings, commissions, payouts]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return historyEvents;
    return historyEvents.filter((ev) => ev.type === filterType);
  }, [historyEvents, filterType]);

  return (
    <div className="space-y-6 w-full font-sans max-w-[1400px] mx-auto pb-8">
      
      {/* ========================================================
          1. APP CONTROLS BAR (CLEAN APP-STYLE ACTION BAR)
         ======================================================== */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium font-mono">
            {filteredEvents.length} Events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[12px] sm:text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh activity history"
            aria-label="Refresh activity history"
          >
            <RotateCw size={13} className={`text-[#64748B] ${refreshing ? 'animate-spin text-[#0E2319]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Month Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[12px] sm:text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
            >
              <CalendarIcon size={13} className="text-[#64748B]" />
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <ChevronDown size={13} className="text-[#94A3B8]" />
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
      </div>

      {/* ========================================================
          2. FILTER PILLS
         ======================================================== */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'booking', label: 'Bookings' },
          { key: 'commission', label: 'Commissions' },
          { key: 'payout', label: 'Payouts' },
        ].map((tab) => {
          const isActive = filterType === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterType(tab.key as any)}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0E2319] text-white shadow-2xs font-semibold'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================
          3. UNIFIED ACTIVITY TABLE
         ======================================================== */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 px-4">Activity</th>
                <th className="pb-3 px-4">Details</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#94A3B8]">
                    Loading activity history...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#94A3B8]">
                    No activity found for this filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  return (
                    <tr key={ev.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 pr-4 font-mono text-[#64748B] whitespace-nowrap">
                        {formatDateShort(ev.dateStr)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                        <div className="flex items-center gap-2">
                          {ev.type === 'booking' ? (
                            <CalendarDays size={14} className="text-[#2563EB]" />
                          ) : ev.type === 'commission' ? (
                            <Receipt size={14} className="text-[#059669]" />
                          ) : (
                            <Wallet size={14} className="text-[#7C3AED]" />
                          )}
                          <span>{ev.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#0F172A] font-medium">
                        {ev.details}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium capitalize ${
                          ev.statusType === 'completed' || ev.statusType === 'paid' || ev.statusType === 'approved'
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : ev.statusType === 'cancelled'
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-[#FFFBEB] text-[#D97706]'
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
