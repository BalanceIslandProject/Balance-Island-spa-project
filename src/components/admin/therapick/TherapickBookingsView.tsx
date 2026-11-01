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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              {system === 'website' ? 'Website Bookings' : 'Affiliate Bookings'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <Users size={11} className="text-amber-700" />
              <span>Affiliate System</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Realtime partner attribution, referral verification, and automatic 15% commission disbursement tracking.
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

      {/* Modern Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-4">
        {/* Row 1: Multifunctional Search Bar & Dropdowns */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Multifunctional Search Bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
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
              className="w-full text-xs font-medium bg-stone-50/80 border border-stone-200/90 rounded-xl pl-9 pr-9 py-2.5 text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white focus:border-stone-300 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-stone-400 hover:text-neutral-900 hover:bg-stone-200 transition-colors cursor-pointer"
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
                className={`w-full sm:w-[150px] text-xs font-semibold px-3 py-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  statusFilter !== 'all' 
                    ? 'bg-amber-50/70 border-amber-300 text-neutral-900' 
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          
          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
              Quick:
            </span>

            {/* Quick ALL */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#facc15] text-neutral-950 font-bold shadow-2xs border border-amber-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-transparent'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === 'all' ? 'bg-neutral-950 text-white font-bold' : 'bg-stone-200 text-stone-600 font-semibold'
              }`}>
                {quickCounts.all}
              </span>
            </button>

            {/* Quick PENDING */}
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                statusFilter === 'pending'
                  ? 'bg-[#facc15] text-neutral-950 font-bold shadow-2xs border border-amber-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === 'pending' ? 'bg-neutral-950 text-white font-bold' : 'bg-stone-200 text-stone-600 font-semibold'
              }`}>
                {quickCounts.pending}
              </span>
            </button>

            {/* Quick CONFIRMED */}
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                statusFilter === 'confirmed'
                  ? 'bg-[#facc15] text-neutral-950 font-bold shadow-2xs border border-amber-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Confirmed</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === 'confirmed' ? 'bg-neutral-950 text-white font-bold' : 'bg-stone-200 text-stone-600 font-semibold'
              }`}>
                {quickCounts.confirmed}
              </span>
            </button>

            {/* Reset Filters Shortcut (Visible when any filter is active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Result Count Status Summary */}
          <div className="text-xs text-stone-500 shrink-0">
            Showing <strong className="text-neutral-900 font-mono">{filteredBookings.length}</strong> of {scopedBookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold font-mono uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Partner</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                        <Search size={22} />
                      </div>
                      <h4 className="font-bold text-neutral-900 text-sm">No matching bookings found</h4>
                      <p className="text-xs text-stone-400 leading-relaxed">
                        We couldn't find any bookings matching your current search query or active filter selections.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
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
                  const bookingCode = b.reference_number || (b.id?.startsWith('BK-') ? b.id : `#BK-${b.id.slice(0, 5).toUpperCase()}`);
                  const displayDate = b.booking_date || b.created_at?.split('T')[0] || 'Today';
                  const displayTime = b.booking_time || b.time || '14:00';
                  const partnerName = b.partner_name || b.partner_info?.name || b.partner_info?.business || 'Direct Affiliate';
                  const referralCode = b.affiliate_code || b.partner_info?.code || '';

                  const statusStr = (b.status || 'Pending').toLowerCase();

                  return (
                    <tr 
                      key={b.id} 
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      {/* 1. Booking ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-neutral-950 group-hover:text-amber-800 transition-colors">
                          {bookingCode}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {displayDate} · {displayTime}
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-950 text-sm">
                          {b.customer_name || b.guest_name || 'Guest'}
                        </div>
                        {b.customer_phone ? (
                          <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={10} className="text-stone-400" />
                            <span>{b.customer_phone}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-stone-400 italic">No phone recorded</div>
                        )}
                      </td>

                      {/* 3. Service & Duration */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">
                          {b.service_name || b.treatment_name || 'Balinese Traditional'}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                          {b.duration_minutes ? `${b.duration_minutes} min` : '90 min'}
                        </div>
                      </td>

                      {/* 4. Partner */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 text-xs">
                          {partnerName}
                        </div>
                        {referralCode ? (
                          <div className="inline-flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200/80 text-[10px] font-mono font-bold">
                              #{referralCode}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-stone-400">Direct referral</div>
                        )}
                      </td>

                      {/* 5. Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold font-mono text-neutral-950 text-sm">
                          Rp {(b.total_amount || b.revenue || 375000).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-medium mt-0.5">
                          {b.payment_status === 'Paid' ? (
                            <span className="text-emerald-700 font-bold">Paid ({b.payment_method || 'Online'})</span>
                          ) : (
                            <span className="text-stone-400">Unsettled</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize transition-all ${
                          statusStr === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : statusStr === 'completed'
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold'
                            : statusStr === 'in_progress'
                            ? 'bg-sky-50 text-sky-900 border border-sky-200'
                            : statusStr === 'cancelled'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusStr === 'confirmed' ? 'bg-emerald-500' :
                            statusStr === 'completed' ? 'bg-emerald-700' :
                            statusStr === 'in_progress' ? 'bg-sky-500' :
                            statusStr === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span>{b.status || 'Pending'}</span>
                        </span>
                      </td>

                      {/* 7. Action Arrow */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-stone-400 group-hover:text-neutral-900 group-hover:bg-amber-100 transition-all">
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
          <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-stone-500">
              Showing <strong className="text-neutral-900">{(currentPage - 1) * pageSize + 1}</strong> to <strong className="text-neutral-900">{Math.min(currentPage * pageSize, filteredBookings.length)}</strong> of <strong className="text-neutral-900">{filteredBookings.length}</strong> bookings
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-medium transition-colors shadow-2xs"
              >
                <ChevronLeft size={13} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => {
                  // Only display up to 5 page numbers gracefully
                  if (totalPages > 5 && Math.abs(pNum - currentPage) > 2 && pNum !== 1 && pNum !== totalPages) {
                    if (pNum === 2 || pNum === totalPages - 1) {
                      return <span key={pNum} className="px-1 text-stone-400 font-mono">...</span>;
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
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
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
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-medium transition-colors shadow-2xs"
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
