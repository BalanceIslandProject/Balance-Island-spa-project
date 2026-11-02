'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  AlertTriangle, 
  Filter, 
  CheckCircle2, 
  Sparkles,
  Users,
  Globe
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';
import { Booking } from '@/components/TherapickBookingManagement';

const formatIDR = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return `Rp${num.toLocaleString('id-ID')}`;
};

export default function TherapickAdvancedCalendarModal() {
  const {
    system,
    isAdvancedCalendarOpen,
    setIsAdvancedCalendarOpen,
    websiteBookings,
    affiliateBookings,
    partners,
    therapists,
    setSelectedBooking,
    showOnAffiliateCalendars,
    setShowOnAffiliateCalendars
  } = useTherapickAdmin();

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const currentBookings = system === 'website' ? websiteBookings : affiliateBookings;

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!isAdvancedCalendarOpen) return [];
    return currentBookings.filter(b => {
      if (selectedStatus !== 'all' && (b.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      if (system === 'affiliate' && selectedPartnerId !== 'all') {
        const partner = partners.find(p => p.id === selectedPartnerId);
        const code = partner?.referral_code?.toUpperCase();
        if (code && (b.affiliate_code || '').toUpperCase() !== code) {
          return false;
        }
      }
      return true;
    });
  }, [isAdvancedCalendarOpen, currentBookings, selectedStatus, selectedPartnerId, system, partners]);

  // Detect schedule conflicts (same date, same time, or overlapping therapist)
  const conflicts = useMemo(() => {
    if (!isAdvancedCalendarOpen) return [];
    const list: Array<{ b1: Booking; b2: Booking; reason: string }> = [];
    for (let i = 0; i < filteredBookings.length; i++) {
      for (let j = i + 1; j < filteredBookings.length; j++) {
        const a = filteredBookings[i];
        const b = filteredBookings[j];
        if (a.booking_date === b.booking_date && a.time === b.time && (a.status || '').toLowerCase() !== 'cancelled' && (b.status || '').toLowerCase() !== 'cancelled') {
          list.push({
            b1: a,
            b2: b,
            reason: `Simultaneous start at ${a.time} on ${a.booking_date}`
          });
        }
      }
    }
    return list;
  }, [isAdvancedCalendarOpen, filteredBookings]);

  if (!isAdvancedCalendarOpen) return null;

  // Calendar days for month view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity" 
        onClick={() => setIsAdvancedCalendarOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 z-50 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FACC15] flex items-center justify-center text-neutral-950 shadow-xs">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-950 font-sans">
                  Advanced {system === 'affiliate' ? 'Affiliate' : 'Website'} Calendar
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white font-mono">
                  {filteredBookings.length} Bookings
                </span>
              </div>
              <p className="text-xs text-stone-500">Therapist availability, time slots & conflict detection</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="bg-stone-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'month' ? 'bg-white text-neutral-950 shadow-xs' : 'text-stone-600 hover:text-neutral-950'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'week' ? 'bg-white text-neutral-950 shadow-xs' : 'text-stone-600 hover:text-neutral-950'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'day' ? 'bg-white text-neutral-950 shadow-xs' : 'text-stone-600 hover:text-neutral-950'
                }`}
              >
                Day
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAdvancedCalendarOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-neutral-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter & Controls Bar */}
        <div className="px-6 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-neutral-900 px-2 font-mono text-sm">
              {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric', ...(viewMode === 'day' ? { day: 'numeric' } : {}) })}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by Partner (Affiliate) */}
            {system === 'affiliate' && (
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="all">All Partners ({partners.length})</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name || ''} ({p.referral_code})
                  </option>
                ))}
              </select>
            )}

            {/* Filter by Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Schedule Conflicts Alert Banner */}
        {conflicts.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-amber-900">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>{conflicts.length} simultaneous booking time slots detected on the calendar.</span>
          </div>
        )}

        {/* Calendar Body Viewport */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'month' && (
            <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200 text-center text-xs font-bold font-mono text-stone-600 py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 text-xs">
                {/* Empty offset days */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`offset-${i}`} className="min-h-[100px] bg-stone-50/40 p-2" />
                ))}

                {/* Actual Days */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayBookings = filteredBookings.filter(b => {
                    const raw = b.booking_date || (b.created_at ? b.created_at.split('T')[0] : '');
                    return String(raw).split('T')[0].trim() === dayStr;
                  });

                  return (
                    <div 
                      key={`day-${dayNum}`}
                      className="min-h-[100px] p-2 hover:bg-stone-50/50 transition-colors flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-neutral-800 text-xs">{dayNum}</span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-[#FACC15] text-neutral-950 border border-amber-400 shadow-2xs">
                            {dayBookings.length} {dayBookings.length === 1 ? 'bking' : 'bkings'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBooking(b);
                            }}
                            className={`w-full text-left p-1 rounded-md text-[10px] font-semibold truncate block cursor-pointer transition-colors ${
                              (b.status || '').toLowerCase() === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100'
                                : (b.status || '').toLowerCase() === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 line-through'
                                : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
                            }`}
                          >
                            {b.time} · {b.guest_name || 'Guest'}
                          </button>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-[9px] text-stone-400 font-semibold text-center">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-900 mb-2">
                Bookings for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>

              {filteredBookings.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-400">No bookings scheduled for this date.</div>
              ) : (
                <div className="space-y-2">
                  {filteredBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-4 bg-white border border-stone-200 rounded-2xl hover:border-neutral-900 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex flex-col items-center justify-center font-mono">
                          <span className="text-xs font-extrabold text-neutral-950">{b.time}</span>
                          <span className="text-[9px] text-stone-500">WITA</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-neutral-950">{b.treatment_name}</div>
                          <div className="text-xs text-stone-600">
                            {b.guest_name} · {b.location || 'Villa'} · {b.pax} pax
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-neutral-950">{formatIDR(b.revenue)}</div>
                        <div className="text-xs font-semibold text-emerald-700 capitalize">{b.status || 'Confirmed'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'week' && (
            <div className="py-12 text-center text-xs text-stone-500">
              Week view schedules available. Use Month view for island-wide overview or Day view for hourly time slots.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-stone-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Confirmed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Cancelled
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdvancedCalendarOpen(false)}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close Calendar
          </button>
        </div>

      </div>
    </div>
  );
}
