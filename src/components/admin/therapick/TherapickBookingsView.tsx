'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, Calendar, Clock, User, Phone, MapPin, 
  ChevronRight, ArrowUpDown, Download, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useTherapickAdmin, TherapickBooking } from '@/context/TherapickAdminContext';

export default function TherapickBookingsView() {
  const { 
    system, 
    bookings, 
    setSelectedBooking, 
    setIsAddBookingOpen, 
    updateBookingStatus,
    therapistsList,
    servicesList
  } = useTherapickAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [therapistFilter, setTherapistFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>(system === 'affiliate' ? 'affiliate' : system === 'website' ? 'website' : 'all');

  // Filter bookings based on system and user filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // System scope check
      if (system === 'website') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        if (isAff) return false;
      } else if (system === 'affiliate') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        if (!isAff) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.customer_name?.toLowerCase().includes(q);
        const matchesId = b.id?.toLowerCase().includes(q);
        const matchesPhone = b.customer_phone?.toLowerCase().includes(q);
        const matchesPartner = b.partner_name?.toLowerCase().includes(q) || b.affiliate_code?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesPartner) return false;
      }

      // Status
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Service
      if (serviceFilter !== 'all' && b.service_name !== serviceFilter) return false;

      // Therapist
      if (therapistFilter !== 'all' && b.therapist_name !== therapistFilter) return false;

      // Channel
      if (sourceFilter !== 'all') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        if (sourceFilter === 'website' && isAff) return false;
        if (sourceFilter === 'affiliate' && !isAff) return false;
      }

      return true;
    });
  }, [bookings, system, searchQuery, statusFilter, serviceFilter, therapistFilter, sourceFilter]);

  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Date', 'Time', 'Customer', 'Phone', 'Service', 'Therapist', 'Channel', 'Partner', 'Amount', 'Status'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.booking_date,
      b.booking_time,
      `"${b.customer_name}"`,
      `"${b.customer_phone || ''}"`,
      `"${b.service_name}"`,
      `"${b.therapist_name || 'Unassigned'}"`,
      b.source,
      `"${b.partner_name || b.affiliate_code || 'Direct'}"`,
      b.total_amount,
      b.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `therapick_${system}_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {system === 'website' ? 'Website Bookings' : 'Affiliate Bookings'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {system === 'website' 
              ? 'Realtime direct reservations coming from booktherapick.com' 
              : 'Referral reservations and partner attribution with automatic 15% commission ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-stone-500" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>

          <button
            type="button"
            onClick={() => setIsAddBookingOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or booking ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-stone-50/70 border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white truncate"
            >
              <option value="all">All Services</option>
              {servicesList.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Therapist Filter */}
          <div>
            <select
              value={therapistFilter}
              onChange={e => setTherapistFilter(e.target.value)}
              className="w-full text-xs font-medium bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            >
              <option value="all">All Therapists</option>
              {therapistsList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Scope Indicators */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <span>Showing <strong className="text-neutral-900">{filteredBookings.length}</strong> matching bookings</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Confirmed: {filteredBookings.filter(b => b.status === 'confirmed').length}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending: {filteredBookings.filter(b => b.status === 'pending').length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Channel / Partner</th>
                <th className="py-3 px-4">Therapist</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <Calendar size={28} className="mx-auto mb-2 text-stone-300" />
                    <p className="font-semibold text-stone-600">No bookings match current filters</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Try clearing your filters or create a new booking.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const isAffiliate = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));

                  return (
                    <tr 
                      key={b.id} 
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900">{b.booking_time}</div>
                        <div className="text-[11px] text-stone-500">{b.booking_date}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                          <span>{b.customer_name}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <MapPin size={11} className="text-stone-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{b.location_address || 'Villa / Hotel'}</span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">{b.service_name}</div>
                        <div className="text-[11px] text-stone-400">{b.duration_minutes} mins</div>
                      </td>

                      {/* Channel / Partner */}
                      <td className="py-3.5 px-4">
                        {isAffiliate ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80">
                            <span>👥</span>
                            <span className="truncate max-w-[120px]">{b.partner_name || b.affiliate_code}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80">
                            <span>🌐</span>
                            <span>Direct Website</span>
                          </div>
                        )}
                      </td>

                      {/* Therapist */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">{b.therapist_name || '—'}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-neutral-900">
                          Rp {b.total_amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-medium text-stone-400">
                          {b.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : b.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            b.status === 'confirmed' ? 'bg-emerald-500' :
                            b.status === 'in_progress' ? 'bg-amber-500' :
                            b.status === 'completed' ? 'bg-blue-500' :
                            b.status === 'cancelled' ? 'bg-rose-500' : 'bg-stone-400'
                          }`} />
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(b.id, 'confirmed')}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Confirm Booking"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 text-stone-400 hover:text-neutral-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
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
