'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  Wallet, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { PartnerPayoutRow, PaymentRecord, CommissionCalendarDayEvent, PayoutWeeklyScheduleConfig } from '@/types/payouts';
import { formatIDR, formatWitaDate } from '@/lib/payoutScheduler';

interface CommissionCalendarTabProps {
  partnerRows: PartnerPayoutRow[];
  commissions: any[];
  payments: PaymentRecord[];
  config: PayoutWeeklyScheduleConfig;
  onOpenRecordPayment: (partner: PartnerPayoutRow) => void;
}

export default function CommissionCalendarTab({
  partnerRows,
  commissions,
  payments,
  config,
  onOpenRecordPayment
}: CommissionCalendarTabProps) {
  // Calendar month state: November 2026 default based on current app context
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed, 10 = November
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-11-05');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Month display title
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar'
  });

  // Synthesize Calendar Day Events
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CommissionCalendarDayEvent[]>();

    const addEvent = (dateStr: string, ev: CommissionCalendarDayEvent) => {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const existing = map.get(cleanDate) || [];
      existing.push(ev);
      map.set(cleanDate, existing);
    };

    // 1. Commission Earned (Green dot)
    commissions.forEach(c => {
      if (c.created_at) {
        addEvent(c.created_at, {
          id: `comm-${c.id}`,
          date: c.created_at.split('T')[0],
          type: 'commission_earned',
          partner_id: c.partner_id,
          partner_name: c.partner_name || 'Partner',
          booking_id: c.booking_id,
          booking_reference: c.booking_reference,
          treatment_name: c.service_name || 'Spa Ritual',
          amount: Number(c.commission_amount || 0),
          status: c.status
        });
      }
    });

    // 2. Scheduled Payout (Yellow dot / highlight) for each 7-day cycle
    partnerRows.forEach(p => {
      if (p.next_payout_date && p.unpaid > 0) {
        addEvent(p.next_payout_date, {
          id: `sched-${p.id}-${p.next_payout_date}`,
          date: p.next_payout_date,
          type: 'scheduled_payout',
          partner_id: p.id,
          partner_name: p.name,
          amount: p.unpaid,
          status: 'Scheduled'
        });
      }
    });

    // 3. Payment Recorded (Blue dot)
    payments.forEach(p => {
      if (p.date) {
        addEvent(p.date, {
          id: `pay-${p.id}`,
          date: p.date,
          type: 'payment_recorded',
          partner_id: p.partner_id,
          partner_name: p.partner_name,
          amount: p.amount,
          status: 'Recorded',
          notes: p.method
        });
      }
    });

    return map;
  }, [commissions, partnerRows, payments]);

  // Calendar Grid Builder (Monday-first)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Days in week: 0 is Sun, 1 is Mon... convert to Monday=0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Pad previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      days.push({
        dayNumber: prevDate.getDate(),
        dateStr,
        isCurrentMonth: false,
        events: eventsByDate.get(dateStr) || []
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        events: eventsByDate.get(dateStr) || []
      });
    }

    // Pad next month days to 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        events: eventsByDate.get(dateStr) || []
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Selected Date Events & Partners
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || [];
  }, [eventsByDate, selectedDateStr]);

  const scheduledPartnersOnSelectedDay = useMemo(() => {
    return partnerRows.filter(p => p.next_payout_date === selectedDateStr && p.unpaid > 0);
  }, [partnerRows, selectedDateStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Calendar & Detail Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Monthly Calendar (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-base font-extrabold text-neutral-900 tracking-tight font-sans">
                {monthName}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer shadow-2xs"
            >
              Today
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold font-mono uppercase text-stone-400 py-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const isSelected = selectedDateStr === cell.dateStr;
              const hasComm = cell.events.some(e => e.type === 'commission_earned');
              const hasSched = cell.events.some(e => e.type === 'scheduled_payout');
              const hasPay = cell.events.some(e => e.type === 'payment_recorded');

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[58px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/60 shadow-xs ring-2 ring-amber-300/40'
                      : cell.isCurrentMonth
                      ? 'border-stone-100 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                      : 'border-transparent bg-stone-50/30 opacity-40 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-amber-950 font-extrabold' : cell.isCurrentMonth ? 'text-neutral-800' : 'text-stone-400'
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {/* Scheduled Badge Highlight on Day if active */}
                    {hasSched && (
                      <span className="w-2 h-2 rounded-full bg-[#facc15] shadow-xs" title="Scheduled weekly payout" />
                    )}
                  </div>

                  {/* Indicator Dots */}
                  <div className="flex items-center gap-1 mt-1 justify-center">
                    {hasComm && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Commission Earned" />
                    )}
                    {hasSched && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Scheduled Payout" />
                    )}
                    {hasPay && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Payment Recorded" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Legend (matching mockup exactly) */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-center flex-wrap gap-4 text-xs font-semibold text-stone-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Commission earned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Scheduled payout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Payment recorded</span>
            </div>
          </div>

        </div>

        {/* Right Side: Selected Date Detail Panel (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          
          {/* Date Panel Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h4 className="text-base font-extrabold text-neutral-900 tracking-tight">
                {formatWitaDate(selectedDateStr)}
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">Disbursement &amp; commission schedule</p>
            </div>

            {scheduledPartnersOnSelectedDay.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                Scheduled Payout
              </span>
            )}
          </div>

          {/* Scheduled Partners List */}
          <div className="space-y-3">
            {scheduledPartnersOnSelectedDay.length > 0 ? (
              scheduledPartnersOnSelectedDay.map(partner => (
                <div 
                  key={partner.id}
                  className="p-3.5 rounded-xl border border-stone-200/90 bg-stone-50/40 hover:bg-white transition-all space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Users size={14} />
                      </div>
                      <div>
                        <h5 className="font-bold text-neutral-900 text-xs group-hover:text-amber-800 transition-colors">
                          {partner.name}
                        </h5>
                        <p className="text-[11px] text-stone-500">{partner.business_name || 'Affiliate Partner'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold font-mono text-emerald-700">
                        {formatIDR(partner.unpaid)}
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase font-mono">Unpaid Balance</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">
                      Cycle: <strong>Every 7 Days</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenRecordPayment(partner)}
                      className="px-3 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-500">
                No partners scheduled for weekly payout on this date.
              </div>
            )}
          </div>

          {/* Historical Payments or Commissions on this Date */}
          {selectedDayEvents.filter(e => e.type !== 'scheduled_payout').length > 0 && (
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase text-stone-400 block">
                Recorded Activity
              </span>
              <div className="space-y-2">
                {selectedDayEvents.filter(e => e.type !== 'scheduled_payout').map(ev => (
                  <div key={ev.id} className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/70 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-neutral-900">{ev.partner_name}</div>
                      <div className="text-[11px] text-stone-500">
                        {ev.type === 'payment_recorded' ? `Disbursement (${ev.notes || 'Bank'})` : `Commission (${ev.treatment_name || 'Treatment'})`}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-neutral-900">
                      {formatIDR(ev.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
