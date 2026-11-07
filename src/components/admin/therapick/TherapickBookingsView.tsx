'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, X, Plus, Calendar, Clock, User, Phone, MapPin, 
  ChevronRight, ChevronDown, Check, Download, AlertCircle, RefreshCw, 
  Users, CheckCircle2, ChevronLeft, Building2, Sparkles, Filter
} from 'lucide-react';
import { useTherapickAdmin } from '@/context/TherapickAdminContext';

export default function TherapickBookingsView() {
  const { 
    system, 
    bookings, 
    partners,
    servicesList,
    setSelectedBooking, 
    setIsAddBookingOpen 
  } = useTherapickAdmin();

  // 1. Multifunctional Search State
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');

  // 3. Custom Dropdowns State
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

  // Dropdown search inputs
  const [partnerSearch, setPartnerSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Click outside listener for all custom dropdowns
  const statusRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const partnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusDropdownOpen(false);
      }
      if (serviceRef.current && !serviceRef.current.contains(target)) {
        setIsServiceDropdownOpen(false);
      }
      if (partnerRef.current && !partnerRef.current.contains(target)) {
        setIsPartnerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, serviceFilter, partnerFilter]);

  // System scoped bookings (Affiliate vs Website)
  const scopedBookings = useMemo(() => {
    return bookings.filter(b => {
      if (system === 'website') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        return !isAff;
      } else if (system === 'affiliate') {
        const isAff = !!b.affiliate_code || (b.source && b.source.toLowerCase().includes('affiliate'));
        return isAff;
      }
      return true;
    });
  }, [bookings, system]);

  // Calculate Quick Status Filter counts based on current scope & partner/service filters
  const quickCounts = useMemo(() => {
    let baseList = scopedBookings;

    // Apply service filter if active
    if (serviceFilter !== 'all') {
      baseList = baseList.filter(b => (b.service_name || b.treatment_name) === serviceFilter);
    }

    // Apply partner filter if active
    if (partnerFilter !== 'all') {
      baseList = baseList.filter(b => {
        const pInfo = b.partner_info;
        const affCode = (b.affiliate_code || '').toUpperCase();
        return pInfo?.id === partnerFilter || affCode === partnerFilter.toUpperCase();
      });
    }

    const allCount = baseList.length;
    const pendingCount = baseList.filter(b => (b.status || '').toLowerCase() === 'pending').length;
    const confirmedCount = baseList.filter(b => (b.status || '').toLowerCase() === 'confirmed').length;

    return { all: allCount, pending: pendingCount, confirmed: confirmedCount };
  }, [scopedBookings, serviceFilter, partnerFilter]);

  // Comprehensive Multifunctional Filtering
  const filteredBookings = useMemo(() => {
    return scopedBookings.filter(b => {
      // 1. Multifunctional Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = (b.customer_name || b.guest_name || '').toLowerCase().includes(q);
        const matchesPhone = (b.customer_phone || b.guest_whatsapp || b.phone || '').toLowerCase().includes(q);
        const refNo = String(b.reference_number || b.id || '').toLowerCase();
        const matchesId = refNo.includes(q) || refNo.replace(/^#/, '').includes(q.replace(/^#/, ''));
        const matchesService = (b.service_name || b.treatment_name || '').toLowerCase().includes(q);
        const matchesPartner = (b.partner_name || b.partner_info?.name || b.partner_info?.business || '').toLowerCase().includes(q);
        const matchesCode = (b.affiliate_code || b.partner_info?.code || '').toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesId && !matchesService && !matchesPartner && !matchesCode) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const bStatus = (b.status || '').toLowerCase();
        if (bStatus !== statusFilter.toLowerCase()) return false;
      }

      // 3. Service Filter
      if (serviceFilter !== 'all') {
        const sName = b.service_name || b.treatment_name;
        if (sName !== serviceFilter) return false;
      }

      // 4. Partner Filter (Replaces Therapist Filter for Affiliate System)
      if (partnerFilter !== 'all') {
        const pInfo = b.partner_info;
        const affCode = (b.affiliate_code || '').toUpperCase();
        const matchesPartnerId = pInfo?.id === partnerFilter;
        const matchesPartnerCode = affCode === partnerFilter.toUpperCase();
        if (!matchesPartnerId && !matchesPartnerCode) return false;
      }

      return true;
    });
  }, [scopedBookings, searchQuery, statusFilter, serviceFilter, partnerFilter]);

  // Paginated Results
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Clear all filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setServiceFilter('all');
    setPartnerFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || serviceFilter !== 'all' || partnerFilter !== 'all';

  // Partner selection label helper
  const selectedPartnerObj = useMemo(() => {
    if (partnerFilter === 'all') return null;
    return partners.find(p => p.id === partnerFilter || (p.referral_code && p.referral_code.toUpperCase() === partnerFilter.toUpperCase()));
  }, [partners, partnerFilter]);

  // Filtered partners list for dropdown search
  const filteredDropdownPartners = useMemo(() => {
    const q = partnerSearch.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(p => {
      const name = (p.name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
      const biz = (p.business_name || '').toLowerCase();
      const code = (p.referral_code || p.partner_code || '').toLowerCase();
      return name.includes(q) || biz.includes(q) || code.includes(q);
    });
  }, [partners, partnerSearch]);

  // Filtered services list for dropdown search
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    servicesList.forEach(s => { if (s.name) set.add(s.name); });
    scopedBookings.forEach(b => {
      const name = b.service_name || b.treatment_name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [servicesList, scopedBookings]);

  const filteredDropdownServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return uniqueServices;
    return uniqueServices.filter(s => s.toLowerCase().includes(q));
  }, [uniqueServices, serviceSearch]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Service', 'Duration', 'Partner', 'Referral Code', 'Amount (IDR)', 'Status', 'Date', 'Time'];
    const rows = filteredBookings.map(b => [
      `"${b.reference_number || b.id}"`,
      `"${b.customer_name || b.guest_name || 'Guest'}"`,
      `"${b.customer_phone || b.guest_whatsapp || ''}"`,
      `"${b.service_name || b.treatment_name || 'Massage'}"`,
      b.duration_minutes ? `${b.duration_minutes}m` : '90m',
      `"${b.partner_name || b.partner_info?.name || 'Direct'}"`,
      `"${b.affiliate_code || ''}"`,
      b.total_amount || b.revenue || 0,
      b.status || 'Pending',
      b.booking_date || '',
      b.booking_time || b.time || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `therapick_affiliate_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Fitlo Page Header */}
      <div className="fitlo-page-head">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="fitlo-page-title">
              {system === 'website' ? 'Website Bookings' : 'Affiliate Bookings'}
            </h1>
            <span className="fitlo-badge">
              <Users size={12} className="text-[#0b7a73]" />
              <span>{system === 'website' ? 'Direct Bookings' : 'Affiliate Network'}</span>
            </span>
          </div>
          <p className="fitlo-page-subtitle">
            Realtime partner attribution, referral verification, and automatic commission disbursement tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="fitlo-btn fitlo-btn--ghost"
          >
            <Download size={14} className="text-[var(--fitlo-muted)]" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>

          <button
            type="button"
            onClick={() => setIsAddBookingOpen(true)}
            className="fitlo-btn fitlo-btn--primary"
          >
            <Plus size={15} />
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* Fitlo Search & Filter Controls Card */}
      <div className="fitlo-card space-y-4">
        {/* Row 1: Multifunctional Search Bar & Dropdowns */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Multifunctional Search Bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fitlo-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search booking ID, customer, phone, service, or partner..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full text-xs font-medium bg-[var(--fitlo-card-2)] border border-[var(--fitlo-line)] rounded-xl pl-9 pr-9 py-2.5 text-[var(--fitlo-ink)] placeholder:text-[var(--fitlo-muted)] focus:outline-none focus:border-[var(--fitlo-accent)] focus:bg-[var(--fitlo-card)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[var(--fitlo-muted)] hover:text-[var(--fitlo-ink)] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters Row on mobile, inline on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:w-auto">
            
            {/* Status Dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => {
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  setIsServiceDropdownOpen(false);
                  setIsPartnerDropdownOpen(false);
                }}
                className={`w-full sm:w-[150px] text-xs font-semibold px-3 py-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                  statusFilter !== 'all' 
                    ? 'bg-[var(--fitlo-accent-soft)] border-[var(--fitlo-accent)] text-[var(--fitlo-accent-text)]' 
                    : 'bg-[var(--fitlo-card)] hover:bg-[var(--fitlo-card-2)] border-[var(--fitlo-line)] text-[var(--fitlo-ink-2)]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    statusFilter === 'confirmed' ? 'bg-emerald-500' :
                    statusFilter === 'pending' ? 'bg-amber-500' :
                    statusFilter === 'completed' ? 'bg-emerald-700' :
                    statusFilter === 'cancelled' ? 'bg-rose-500' :
                    statusFilter === 'in_progress' ? 'bg-sky-500' : 'bg-stone-400'
                  }`} />
                  <span className="truncate capitalize">
                    {statusFilter === 'all' ? 'All Statuses' : statusFilter.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-stone-400 shrink-0 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Status Popover */}
              {isStatusDropdownOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-48 bg-white border border-stone-200 rounded-xl shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                    Filter by Status
                  </div>
                  {[
                    { id: 'all', label: 'All Statuses', color: 'bg-stone-400' },
                    { id: 'pending', label: 'Pending', color: 'bg-amber-500' },
                    { id: 'confirmed', label: 'Confirmed', color: 'bg-emerald-500' },
                    { id: 'in_progress', label: 'In Progress', color: 'bg-sky-500' },
                    { id: 'completed', label: 'Completed', color: 'bg-emerald-700' },
                    { id: 'cancelled', label: 'Cancelled', color: 'bg-rose-500' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(item.id);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                        statusFilter === item.id ? 'font-bold text-neutral-900 bg-amber-50/40' : 'text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      {statusFilter === item.id && <Check size={13} className="text-amber-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Dropdown */}
            <div className="relative" ref={serviceRef}>
              <button
                type="button"
                onClick={() => {
                  setIsServiceDropdownOpen(!isServiceDropdownOpen);
                  setIsStatusDropdownOpen(false);
                  setIsPartnerDropdownOpen(false);
                }}
                className={`w-full sm:w-[160px] text-xs font-semibold px-3 py-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  serviceFilter !== 'all' 
                    ? 'bg-amber-50/70 border-amber-300 text-neutral-900' 
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <span className="truncate">
                  {serviceFilter === 'all' ? 'All Services' : serviceFilter}
                </span>
                <ChevronDown size={14} className={`text-stone-400 shrink-0 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Service Popover */}
              {isServiceDropdownOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 bg-white border border-stone-200 rounded-xl shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-stone-100">
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={e => setServiceSearch(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-stone-50">
                    <button
                      type="button"
                      onClick={() => {
                        setServiceFilter('all');
                        setIsServiceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                        serviceFilter === 'all' ? 'font-bold text-neutral-900 bg-amber-50/40' : 'text-stone-700'
                      }`}
                    >
                      <span>All Services</span>
                      {serviceFilter === 'all' && <Check size={13} className="text-amber-600" />}
                    </button>

                    {filteredDropdownServices.map(serviceName => (
                      <button
                        key={serviceName}
                        type="button"
                        onClick={() => {
                          setServiceFilter(serviceName);
                          setIsServiceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                          serviceFilter === serviceName ? 'font-bold text-neutral-900 bg-amber-50/40' : 'text-stone-700'
                        }`}
                      >
                        <span className="truncate pr-2">{serviceName}</span>
                        {serviceFilter === serviceName && <Check size={13} className="text-amber-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Partner Dropdown (Replaces Therapist Filter for Affiliate System) */}
            <div className="relative" ref={partnerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsPartnerDropdownOpen(!isPartnerDropdownOpen);
                  setIsStatusDropdownOpen(false);
                  setIsServiceDropdownOpen(false);
                }}
                className={`w-full sm:w-[170px] text-xs font-semibold px-3 py-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  partnerFilter !== 'all' 
                    ? 'bg-amber-50/70 border-amber-300 text-neutral-900' 
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Users size={13} className={partnerFilter !== 'all' ? 'text-amber-700 shrink-0' : 'text-stone-400 shrink-0'} />
                  <span className="truncate">
                    {selectedPartnerObj 
                      ? (selectedPartnerObj.name || selectedPartnerObj.business_name || 'Selected Partner') 
                      : 'All Partners'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-stone-400 shrink-0 transition-transform ${isPartnerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Partner Popover */}
              {isPartnerDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-stone-200 rounded-xl shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-stone-100">
                    <input
                      type="text"
                      placeholder="Search partners by name or code..."
                      value={partnerSearch}
                      onChange={e => setPartnerSearch(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-50">
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerFilter('all');
                        setIsPartnerDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                        partnerFilter === 'all' ? 'font-bold text-neutral-900 bg-amber-50/40' : 'text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">All Partners</div>
                        <div className="text-[10px] text-stone-400">View bookings from all affiliates</div>
                      </div>
                      {partnerFilter === 'all' && <Check size={13} className="text-amber-600" />}
                    </button>

                    {filteredDropdownPartners.map(p => {
                      const isSelected = partnerFilter === p.id || partnerFilter.toUpperCase() === (p.referral_code || '').toUpperCase();
                      const pName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.business_name;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPartnerFilter(p.id);
                            setIsPartnerDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                            isSelected ? 'font-bold text-neutral-900 bg-amber-50/40' : 'text-stone-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold text-neutral-900 truncate">{pName}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                              <span>{p.business_name || 'Affiliate Partner'}</span>
                              {p.referral_code && (
                                <span className="font-mono text-amber-700 font-bold">#{p.referral_code}</span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check size={13} className="text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Row 2: Quick Booking Status Filters & Summary Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--fitlo-line)]">
          
          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-[var(--fitlo-muted)] uppercase tracking-wider mr-1 shrink-0">
              Filter:
            </span>

            {/* Quick ALL */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#0b7a73] text-white font-bold shadow-xs'
                  : 'bg-[var(--fitlo-card-2)] hover:bg-[var(--fitlo-card-3)] text-[var(--fitlo-ink-2)]'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === 'all' ? 'bg-white text-[#0b7a73] font-bold' : 'bg-[var(--fitlo-card-3)] text-[var(--fitlo-muted)] font-semibold'
              }`}>
                {quickCounts.all}
              </span>
            </button>

            {/* Quick PENDING */}
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                statusFilter === 'pending'
                  ? 'bg-[#0b7a73] text-white font-bold shadow-xs'
                  : 'bg-[var(--fitlo-card-2)] hover:bg-[var(--fitlo-card-3)] text-[var(--fitlo-ink-2)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#f08a5d]" />
              <span>Pending</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === 'pending' ? 'bg-white text-[#0b7a73] font-bold' : 'bg-[var(--fitlo-card-3)] text-[var(--fitlo-muted)] font-semibold'
              }`}>
                {quickCounts.pending}
              </span>
            </button>

            {/* Quick CONFIRMED */}
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                statusFilter === 'confirmed'
                  ? 'bg-[#0b7a73] text-white font-bold shadow-xs'
                  : 'bg-[var(--fitlo-card-2)] hover:bg-[var(--fitlo-card-3)] text-[var(--fitlo-ink-2)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#1e7548]" />
              <span>Confirmed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === 'confirmed' ? 'bg-white text-[#0b7a73] font-bold' : 'bg-[var(--fitlo-card-3)] text-[var(--fitlo-muted)] font-semibold'
              }`}>
                {quickCounts.confirmed}
              </span>
            </button>

            {/* Reset Filters Shortcut */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-2 px-2.5 py-1.5 rounded-full text-xs text-[#b42318] hover:bg-[rgba(180,35,24,0.08)] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Result Count Status Summary */}
          <div className="text-xs text-[var(--fitlo-muted)] shrink-0">
            Showing <strong className="text-[var(--fitlo-ink)] fitlo-num font-bold">{filteredBookings.length}</strong> of {scopedBookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings Table Card (Fitlo Table) */}
      <div className="fitlo-card fitlo-card--flush">
        <div className="fitlo-table-wrap">
          <table className="fitlo-table min-w-[850px]">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Partner</th>
                <th className="r">Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[var(--fitlo-muted)]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--fitlo-card-2)] text-[var(--fitlo-muted)] flex items-center justify-center mx-auto mb-3">
                        <Search size={22} />
                      </div>
                      <h4 className="font-bold text-[var(--fitlo-ink)] text-sm">No matching bookings found</h4>
                      <p className="text-xs text-[var(--fitlo-muted)] leading-relaxed">
                        We couldn't find any bookings matching your current search query or active filter selections.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 fitlo-btn fitlo-btn--primary"
                        >
                          <RefreshCw size={12} />
                          <span>Clear All Filters &amp; Search</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map(b => {
                  const bIdStr = String(b.id || '');
                  const bookingCode = b.reference_number || (bIdStr.startsWith('BK-') ? bIdStr : bIdStr ? `#BK-${bIdStr.slice(0, 5).toUpperCase()}` : '#BK-001');
                  const displayDate = b.booking_date || (b.created_at ? b.created_at.split('T')[0] : 'Today');
                  const displayTime = b.booking_time || b.time || '14:00';
                  const partnerName = b.partner_name || b.partner_info?.name || b.partner_info?.business || 'Direct Affiliate';
                  const referralCode = b.affiliate_code || b.partner_info?.code || '';

                  const statusStr = (b.status || 'Pending').toLowerCase();

                  return (
                    <tr 
                      key={b.id} 
                      onClick={() => setSelectedBooking(b)}
                      className="cursor-pointer group"
                    >
                      {/* 1. Booking ID */}
                      <td>
                        <div className="font-mono font-bold text-[var(--fitlo-ink)] group-hover:text-[var(--fitlo-accent)] transition-colors">
                          {bookingCode}
                        </div>
                        <div className="text-[11px] text-[var(--fitlo-muted)] font-mono mt-0.5">
                          {displayDate} · {displayTime}
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td>
                        <div className="font-bold text-[var(--fitlo-ink)]">
                          {b.customer_name || b.guest_name || 'Guest'}
                        </div>
                        {b.customer_phone ? (
                          <div className="text-[11px] text-[var(--fitlo-muted)] font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={10} className="text-[var(--fitlo-muted)]" />
                            <span>{b.customer_phone}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[var(--fitlo-muted)] italic">No phone recorded</div>
                        )}
                      </td>

                      {/* 3. Service & Duration */}
                      <td>
                        <div className="font-semibold text-[var(--fitlo-ink)]">
                          {b.service_name || b.treatment_name || 'Balinese Traditional'}
                        </div>
                        <div className="text-[11px] text-[var(--fitlo-muted)] font-medium mt-0.5">
                          {b.duration_minutes ? `${b.duration_minutes} min` : '90 min'}
                        </div>
                      </td>

                      {/* 4. Partner */}
                      <td>
                        <div className="font-semibold text-[var(--fitlo-ink)] text-xs">
                          {partnerName}
                        </div>
                        {referralCode ? (
                          <div className="inline-flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-[var(--fitlo-card-2)] text-[var(--fitlo-accent-text)] border border-[var(--fitlo-line)] text-[10px] font-mono font-bold">
                              #{referralCode}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[var(--fitlo-muted)]">Direct referral</div>
                        )}
                      </td>

                      {/* 5. Amount */}
                      <td className="r">
                        <div className="font-bold fitlo-num text-[var(--fitlo-ink)]">
                          Rp {(Number(b.revenue || b.total_price || b.total_amount || 0)).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-medium mt-0.5">
                          {b.payment_status === 'Paid' ? (
                            <span className="text-[var(--fitlo-good)] font-bold">Paid ({b.payment_method || 'Online'})</span>
                          ) : (
                            <span className="text-[var(--fitlo-muted)]">Unsettled</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Status Badge */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`fitlo-pill ${
                          statusStr === 'confirmed' || statusStr === 'completed'
                            ? 'fitlo-pill--good'
                            : statusStr === 'in_progress'
                            ? 'fitlo-pill--info'
                            : statusStr === 'cancelled'
                            ? 'fitlo-pill--bad'
                            : 'fitlo-pill--warn'
                        }`}>
                          {b.status || 'Pending'}
                        </span>
                      </td>

                      {/* 7. Action Arrow */}
                      <td className="r">
                        <div className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[var(--fitlo-muted)] group-hover:text-[var(--fitlo-ink)] group-hover:bg-[var(--fitlo-card-3)] transition-all">
                          <ChevronRight size={15} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredBookings.length > 0 && (
          <div className="px-5 py-3.5 bg-[var(--fitlo-card-2)] border-t border-[var(--fitlo-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[var(--fitlo-muted)]">
              Showing <strong className="text-[var(--fitlo-ink)] fitlo-num">{(currentPage - 1) * pageSize + 1}</strong> to <strong className="text-[var(--fitlo-ink)] fitlo-num">{Math.min(currentPage * pageSize, filteredBookings.length)}</strong> of <strong className="text-[var(--fitlo-ink)] fitlo-num">{filteredBookings.length}</strong> bookings
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="fitlo-btn fitlo-btn--ghost !h-8 !px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={13} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => {
                  if (totalPages > 5 && Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) {
                    if (pNum === 2 || pNum === totalPages - 1) {
                      return <span key={pNum} className="px-1 text-[var(--fitlo-muted)] font-mono">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? 'bg-[#0b7a73] text-white shadow-xs'
                          : 'bg-[var(--fitlo-card)] hover:bg-[var(--fitlo-card-3)] text-[var(--fitlo-ink)] border border-[var(--fitlo-line)]'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="fitlo-btn fitlo-btn--ghost !h-8 !px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
