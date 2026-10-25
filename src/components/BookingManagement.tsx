'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Download, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight, Calculator, FileText, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';
import { cx, btn, inputCls, selectCls, thCls, tdCls, StatusBadge, CountPill, EmptyState } from '@/components/admin/affiliate/ui';

export interface Booking {
  id: string;
  reference_number?: string;
  guest_name?: string;
  brand?: string;
  created_at: string;
  booking_date: string; // YYYY-MM-DD
  time: string;
  treatment_name: string;
  pax: number;
  therapists_count: number;
  revenue: number;
  therapist_fee_total: number;
  net_profit: number;
  status?: string;
  items?: any[];
}

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function BookingManagement({ 
  treatments, 
  therapistFees 
}: { 
  treatments: Treatment[], 
  therapistFees: TherapistFee[] 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateString(new Date()));
  const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  type FormItem = { id: string; treatment: string; duration: string; pax: number; therapists: number; revenue: number; fee: number; };
  const createDefaultItem = (): FormItem => ({ id: Math.random().toString(36).substring(2, 9), treatment: '', duration: '', pax: 1, therapists: 1, revenue: 0, fee: 0 });
  const [formItems, setFormItems] = useState<FormItem[]>([createDefaultItem()]);
  const [domainFilter, setDomainFilter] = useState<'all' | 'elexoir' | 'bali'>('all');
  const [formBrand, setFormBrand] = useState<'elexoir' | 'bali'>('elexoir');

  // Yearly Stats for Chart
  const [yearlyStats, setYearlyStats] = useState<{ month: string, revenue: number, profit: number }[]>([]);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    async function fetchYearlyStats() {
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;

      const { data } = await supabase
        .from('bookings')
        .select('booking_date, revenue, net_profit, brand')
        .gte('booking_date', startOfYear)
        .lte('booking_date', endOfYear);

      if (data) {
        // STRICT DATA ISOLATION: Central Admin is solely for Elexoir and Home Spa (bali) domains.
        // Therapick bookings are strictly excluded.
        const centralData = data.filter((b: any) => {
          if (b.brand === 'therapick') return false;
          return b.brand === 'elexoir' || b.brand === 'bali' || !b.brand;
        });

        const stats = Array.from({ length: 12 }, (_, i) => ({
          month: monthNames[i].substring(0, 3),
          revenue: 0,
          profit: 0
        }));

        centralData.forEach((b: any) => {
          const m = parseInt(b.booking_date.split('-')[1], 10) - 1;
          if (m >= 0 && m < 12) {
            stats[m].revenue += (b.revenue || 0);
            stats[m].profit += (b.net_profit || 0);
          }
        });

        setYearlyStats(stats);
      }
    }
    fetchYearlyStats();
  }, []);

  // Fetch bookings for the ENTIRE month + Realtime sync
  useEffect(() => {
    fetchMonthBookings();

    const channel = supabase
      .channel('central_bookings_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchMonthBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const fetchMonthBookings = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = toLocalDateString(new Date(year, month, 1));
      const endOfMonth = toLocalDateString(new Date(year, month + 1, 0));

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', startOfMonth)
        .lte('booking_date', endOfMonth)
        .order('created_at', { ascending: true });
      
      if (error && error.code !== '42P01') {
        console.error("Error fetching bookings", error);
      }

      // STRICT DATA ISOLATION: Central Admin is solely for Elexoir and Home Spa (bali) domains.
      // Therapick bookings are strictly excluded.
      const centralData = (data || []).filter((b: any) => {
        if (b.brand === 'therapick') return false;
        return b.brand === 'elexoir' || b.brand === 'bali' || !b.brand;
      });

      setMonthBookings(centralData);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const filteredMonthBookings = useMemo(() => {
    return monthBookings.filter(b => {
      if (domainFilter === 'elexoir') return b.brand === 'elexoir' || (!b.brand && b.brand !== 'therapick');
      if (domainFilter === 'bali') return b.brand === 'bali';
      return true; // 'all' central domains
    });
  }, [monthBookings, domainFilter]);

  const dailyBookings = useMemo(() => {
    return filteredMonthBookings.filter(b => b.booking_date === selectedDate);
  }, [filteredMonthBookings, selectedDate]);

  const updateFormItem = (index: number, field: string, value: any) => {
    const newItems = [...formItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'treatment') {
      newItems[index].duration = '';
      if (typeof value === 'string' && value.toLowerCase().includes('couple')) {
        newItems[index].pax = 2;
        newItems[index].therapists = 2;
      }
    }

    if (['treatment', 'duration', 'pax', 'therapists'].includes(field)) {
      const item = newItems[index];
      if (item.treatment && item.duration) {
        const t = treatments.find(x => x.title === item.treatment);
        if (t && t.options && t.options.length > 0) {
          const opt = t.options.find(o => o.duration === item.duration) || t.options[0];
          const priceStr = opt.price.replace(/[^0-9]/g, '');
          const price = parseInt(priceStr || '0', 10);
          
          const isCouple = item.treatment.toLowerCase().includes('couple');
          item.revenue = isCouple ? (price * Math.max(1, Math.ceil(item.pax / 2))) : (price * item.pax);
        }

        if (t && therapistFees.length > 0) {
          const normalizeDur = (d: string) => d.replace(/[^0-9]/g, '');
          const normFormDur = normalizeDur(item.duration);
          
          const matchingFee = therapistFees.find(f => 
             f.treatment_id === t.id && normalizeDur(f.duration) === normFormDur
          );
          
          const feeObj = matchingFee || therapistFees.find(f => normalizeDur(f.duration) === normFormDur) || therapistFees[0];
          const baseFeeStr = feeObj.fee.replace(/[^0-9]/g, '');
          const baseFee = parseInt(baseFeeStr || '0', 10);
          item.fee = baseFee * item.therapists;
        }
      }
    }
    setFormItems(newItems);
  };

  const addFormItem = () => setFormItems([...formItems, createDefaultItem()]);
  const removeFormItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.some(i => !i.treatment)) return alert("Please fill required fields for all treatments.");

    const payloads = formItems.map(item => ({
      booking_date: selectedDate,
      time: "-", 
      treatment_name: item.duration ? `${item.treatment} (${item.duration})` : item.treatment,
      pax: item.pax,
      therapists_count: item.therapists,
      revenue: item.revenue,
      therapist_fee_total: item.fee,
      net_profit: item.revenue - item.fee,
      brand: formBrand || 'elexoir'
    }));

    if (isEditing) {
      const { error } = await supabase.from('bookings').update(payloads[0]).eq('id', isEditing);
      if (error) {
         if (error.code === '42P01') alert("Database table 'bookings' does not exist yet. Please run the SQL migration.");
         else alert("Error updating: " + error.message);
      }
    } else {
      const { error } = await supabase.from('bookings').insert(payloads);
      if (error) {
         if (error.code === '42P01') alert("Database table 'bookings' does not exist yet. Please run the SQL migration.");
         else alert("Error saving: " + error.message);
      }
    }

    setShowForm(false);
    setIsEditing(null);
    resetForm();
    fetchMonthBookings();
  };

  const resetForm = () => {
    setFormItems([createDefaultItem()]);
    setFormBrand('elexoir');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    await supabase.from('bookings').delete().eq('id', id);
    fetchMonthBookings();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    let updates: any = { status: newStatus };

    if (newStatus === 'Confirmed' || newStatus === 'CONFIRMED') {
      const booking = monthBookings.find(b => b.id === id);
      if (booking && booking.items && Array.isArray(booking.items) && booking.items.length > 0) {
        let totalFee = 0;
        booking.items.forEach((item: any) => {
            const normDur = item.duration ? item.duration.replace(/[^0-9]/g, '') : '';
            const t = treatments.find(tr => tr.title.toLowerCase() === item.title.toLowerCase());
            
            let feeObj;
            if (t && normDur) {
                feeObj = therapistFees.find(f => f.treatment_id === t.id && f.duration.replace(/[^0-9]/g, '') === normDur);
            }
            if (!feeObj && normDur) {
                feeObj = therapistFees.find(f => f.duration.replace(/[^0-9]/g, '') === normDur);
            }
            if (!feeObj && therapistFees.length > 0) {
                feeObj = therapistFees[0];
            }
            
            if (feeObj) {
                const baseFee = parseInt(feeObj.fee.replace(/[^0-9]/g, '') || '0', 10);
                totalFee += baseFee * (item.guests || 1);
            }
        });
        
        updates.therapist_fee_total = totalFee;
        updates.net_profit = booking.revenue - totalFee;
      }
    }

    await supabase.from('bookings').update(updates).eq('id', id);
    fetchMonthBookings();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectDate = (day: number) => {
    const d = new Date(year, month, day);
    // YYYY-MM-DD
    const isoString = toLocalDateString(new Date(year, month, day));
    setSelectedDate(isoString);
    setShowForm(false);
  };

  const downloadCSV = async () => {
    if (filteredMonthBookings.length === 0) return alert("No bookings this month to export.");

    const headers = [
      "Booking Reference", 
      "Brand / Domain",
      "Date", 
      "Customer Name", 
      "Treatment Details", 
      "Status", 
      "Pax", 
      "Therapists Used", 
      "Gross Revenue (IDR)", 
      "Therapist Fee (IDR)", 
      "Net Profit (IDR)"
    ];
    
    const domainLabel = domainFilter === 'elexoir' ? 'Elexoir Home Spa' : domainFilter === 'bali' ? 'Home Spa Ubud' : 'Central Admin (Elexoir & Home Spa Ubud)';
    const csvRows = [
      `"FINANCIAL REPORT - ${domainLabel.toUpperCase()}"`,
      `"Period: ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}"`,
      `""`,
      headers.join(',')
    ];

    let totalRev = 0;
    let totalFee = 0;
    let totalProfit = 0;

    filteredMonthBookings.forEach(b => {
      let treatmentDetails = b.treatment_name || '';
      if (b.items && b.items.length > 0) {
         treatmentDetails = b.items.map((i:any) => `${i.title} (${i.duration})`).join(' + ');
      }
      
      const bBrand = b.brand === 'bali' ? 'Home Spa Ubud' : 'Elexoir Home Spa';
      csvRows.push([
        `"${b.reference_number || `MANUAL-${b.id.substring(0,6).toUpperCase()}`}"`,
        `"${bBrand}"`,
        `"${b.booking_date}"`,
        `"${b.guest_name || 'Walk-in / Manual'}"`,
        `"${treatmentDetails}"`,
        `"${b.status || 'Confirmed'}"`,
        b.pax || 1,
        b.therapists_count || 1,
        b.revenue || 0,
        b.therapist_fee_total || 0,
        b.net_profit || 0
      ].join(','));
      
      totalRev += Number(b.revenue) || 0;
      totalFee += Number(b.therapist_fee_total) || 0;
      totalProfit += Number(b.net_profit) || 0;
    });

    csvRows.push(`,,,,,,,,,,`);
    csvRows.push(`"GRAND TOTAL",,,,,,,,${totalRev},${totalFee},${totalProfit}`);

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-bookings-${monthNames[month]}-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalDailyRevenue = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [dailyBookings]);
  const totalDailyProfit = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [dailyBookings]);

  const totalMonthlyRevenue = useMemo(() => filteredMonthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [filteredMonthBookings]);
  const totalMonthlyProfit = useMemo(() => filteredMonthBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [filteredMonthBookings]);


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black">Booking Management</h2>
            <span className="inline-flex items-center h-6 px-2 rounded-md border border-[#E5E5E5] text-[11px] font-mono text-[#737373]">
              Elexoir &amp; Home Spa Ubud
            </span>
          </div>
          <p className="text-[13px] text-[#737373] mt-0.5">Centralized daily bookings and financial calculator for Elexoir and Home Spa domains</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Domain Filter Pills */}
          <div className="flex items-center gap-1 border border-[#E5E5E5] rounded-lg p-0.5 bg-white">
            {[
              { id: 'all', label: 'All Central' },
              { id: 'elexoir', label: 'Elexoir' },
              { id: 'bali', label: 'Home Spa Ubud' },
            ].map((tab) => {
              const active = domainFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`central-filter-${tab.id}`}
                  onClick={() => setDomainFilter(tab.id as any)}
                  className={cx(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                    active ? 'bg-black text-white' : 'text-[#737373] hover:text-black hover:bg-[#F5F5F5]'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={downloadCSV}
            className={cx(btn.base, btn.primary, btn.sm)}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-[#E5E5E5] [&>*]:border-[#E5E5E5] overflow-hidden">
        <div className="p-4 bg-white">
          <div className="text-xs text-[#737373]">Daily revenue</div>
          <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums truncate">{formatCurrency(totalDailyRevenue)}</div>
          <div className="text-[11px] text-[#A3A3A3] mt-0.5">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
        </div>
        <div className="p-4 bg-white border-l">
          <div className="text-xs text-[#737373]">Daily profit</div>
          <div className="text-lg md:text-xl font-semibold text-emerald-600 mt-1 tabular-nums truncate">{formatCurrency(totalDailyProfit)}</div>
          <div className="text-[11px] text-[#A3A3A3] mt-0.5">Net after fees</div>
        </div>
        <div className="p-4 bg-white border-t lg:border-t-0 lg:border-l">
          <div className="text-xs text-[#737373]">Monthly revenue</div>
          <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums truncate">{formatCurrency(totalMonthlyRevenue)}</div>
          <div className="text-[11px] text-[#A3A3A3] mt-0.5">{monthNames[month]} {year}</div>
        </div>
        <div className="p-4 bg-white border-t lg:border-t-0 border-l">
          <div className="text-xs text-[#737373]">Monthly profit</div>
          <div className="text-lg md:text-xl font-semibold text-emerald-600 mt-1 tabular-nums truncate">{formatCurrency(totalMonthlyProfit)}</div>
          <div className="text-[11px] text-[#A3A3A3] mt-0.5">Net after fees</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Calendar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cx(btn.base, btn.secondary, btn.icon, 'h-8 w-8')}
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="font-semibold text-sm md:text-base text-black">
                {monthNames[month]} {year}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className={cx(btn.base, btn.secondary, btn.icon, 'h-8 w-8')}
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-[11px] font-medium text-[#737373]">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const isoString = toLocalDateString(d);
                const isSelected = isoString === selectedDate;
                const isToday = isoString === toLocalDateString(new Date());

                const bookingsForThisDay = filteredMonthBookings.filter((b) => b.booking_date === isoString);
                const paxCount = bookingsForThisDay.reduce((sum, b) => sum + b.pax, 0);

                return (
                  <div key={day} className="relative flex justify-center">
                    <button
                      type="button"
                      onClick={() => selectDate(day)}
                      className={cx(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors',
                        isSelected
                          ? 'bg-black text-white font-semibold'
                          : 'text-[#171717] hover:bg-[#F5F5F5]',
                        isToday && !isSelected && 'border border-black/40'
                      )}
                    >
                      {day}
                    </button>
                    {paxCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-semibold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                        {paxCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Bookings for Selected Date */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">
              Bookings for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </h3>
            {!showForm && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className={cx(btn.base, btn.primary, btn.sm)}
              >
                <Plus size={14} /> Add Booking
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 shadow-xs relative">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 p-1.5 text-[#737373] hover:text-black hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer"
                aria-label="Close form"
              >
                <X size={16} />
              </button>
              <h4 className="font-semibold text-base text-black mb-5">{isEditing ? 'Edit Booking' : 'New Booking'}</h4>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Domain Selector for Central Admin */}
                <div>
                  <label className="block text-xs font-medium text-[#171717] mb-1.5">Target Domain / Property</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value as 'elexoir' | 'bali')}
                    className={selectCls}
                  >
                    <option value="elexoir">Elexoir Home Spa (elexoirhomespaubud.com)</option>
                    <option value="bali">Home Spa Ubud (homespaubud.com)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="relative bg-[#FAFAFA] border border-[#E5E5E5] p-4 rounded-xl space-y-4">
                      {formItems.length > 1 && !isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className="absolute -top-2 -right-2 bg-white border border-red-200 text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors shadow-xs"
                          aria-label="Remove item"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Select Treatment {index + 1}</label>
                          <select
                            required
                            value={item.treatment}
                            onChange={(e) => updateFormItem(index, 'treatment', e.target.value)}
                            className={selectCls}
                          >
                            <option value="">-- Choose Treatment --</option>
                            {treatments.map((t) => (
                              <option key={t.id} value={t.title}>
                                {t.title}
                              </option>
                            ))}
                            <option value="Custom Treatment">Custom Treatment</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Duration</label>
                          <select
                            required
                            disabled={!item.treatment}
                            value={item.duration}
                            onChange={(e) => updateFormItem(index, 'duration', e.target.value)}
                            className={selectCls}
                          >
                            <option value="">-- Select Duration --</option>
                            {item.treatment === 'Custom Treatment' ? (
                              <option value="Custom">Custom Duration</option>
                            ) : (
                              treatments
                                .find((t) => t.title === item.treatment)
                                ?.options?.map((opt) => (
                                  <option key={opt.duration} value={opt.duration}>
                                    {opt.duration} - {opt.price}
                                  </option>
                                ))
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Number of Pax</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.pax}
                            onChange={(e) => updateFormItem(index, 'pax', parseInt(e.target.value) || 1)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Number of Therapists</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.therapists}
                            onChange={(e) => updateFormItem(index, 'therapists', parseInt(e.target.value) || 1)}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#E5E5E5]">
                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Revenue (IDR)</label>
                          <input
                            type="number"
                            required
                            value={item.revenue}
                            onChange={(e) => updateFormItem(index, 'revenue', parseInt(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Therapist Fee (IDR)</label>
                          <input
                            type="number"
                            required
                            value={item.fee}
                            onChange={(e) => updateFormItem(index, 'fee', parseInt(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#171717] mb-1.5">Net Profit (IDR)</label>
                          <div className="h-11 md:h-9 rounded-lg border border-[#E5E5E5] bg-white px-3 flex items-center text-xs font-semibold text-emerald-600 tabular-nums">
                            {formatCurrency(item.revenue - item.fee)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={addFormItem}
                    className="w-full py-2.5 border border-dashed border-[#D4D4D4] hover:border-black text-[#525252] hover:text-black rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Add Another Treatment
                  </button>
                )}

                <div className="pt-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row justify-between items-center gap-3">
                  {formItems.length > 1 && (
                    <div className="text-xs text-[#737373]">
                      Total Profit:{' '}
                      <span className="font-semibold text-emerald-600 text-sm tabular-nums">
                        {formatCurrency(formItems.reduce((acc, item) => acc + (item.revenue - item.fee), 0))}
                      </span>
                    </div>
                  )}
                  <div className="flex-1" />
                  <button type="submit" className={cx(btn.base, btn.primary, btn.md)}>
                    <Save size={14} /> Save Booking
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-[#737373]" />
            </div>
          ) : dailyBookings.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Calendar size={32} className="text-[#A3A3A3] mb-2" />
              <p className="text-xs font-medium text-black">No bookings scheduled</p>
              <p className="text-xs text-[#737373] mt-0.5">There are no bookings for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyBookings.map((booking) => {
                let title = booking.treatment_name;
                let dur = '';
                const match = title.match(/(.*) \((.*)\)$/);
                if (match) {
                  title = match[1];
                  dur = match[2];
                  if (dur.includes('mins')) dur = dur.replace('mins', 'Minutes');
                }

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-[#E5E5E5] rounded-xl p-4 hover:border-[#D4D4D4] transition-all relative group overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-mono text-[#737373]">
                            #{booking.reference_number || booking.id.substring(0, 8).toUpperCase()}
                          </span>
                          <CountPill>{booking.pax} Pax</CountPill>
                          <StatusBadge status={booking.status || 'confirmed'} />
                          <span className="inline-flex items-center h-5 px-1.5 rounded border border-[#E5E5E5] text-[10px] font-medium text-[#737373]">
                            {booking.brand === 'bali' ? 'Home Spa Ubud' : 'Elexoir Home Spa'}
                          </span>
                        </div>

                        {booking.items && booking.items.length > 0 ? (
                          <div className="space-y-1 mt-1">
                            {booking.items.map((it: any, idx: number) => (
                              <div key={idx}>
                                <p className="font-semibold text-xs text-black">
                                  {it.title} {it.guests > 1 ? `(x${it.guests})` : ''}
                                </p>
                                <p className="text-[11px] text-[#737373]">Duration: {it.duration}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1">
                            <p className="font-semibold text-xs text-black">{title}</p>
                            {dur && <p className="text-[11px] text-[#737373]">Duration: {dur}</p>}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-2.5 sm:w-72 shrink-0">
                        <div>
                          <span className="block text-[10px] text-[#737373]">Revenue</span>
                          <span className="font-semibold text-xs text-black tabular-nums">{formatCurrency(booking.revenue)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#737373]">Wage</span>
                          <span className="font-semibold text-xs text-black tabular-nums">{formatCurrency(booking.therapist_fee_total)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#737373]">Profit</span>
                          <span className="font-semibold text-xs text-emerald-600 tabular-nums">{formatCurrency(booking.net_profit)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 justify-end">
                        {booking.reference_number && (
                          <button
                            type="button"
                            onClick={() => {
                              let domain = window.location.origin;
                              if (booking.brand === 'bali') {
                                domain = 'https://www.homespaubud.com';
                              } else if (booking.brand === 'therapick') {
                                domain = 'https://www.booktherapick.com';
                              } else if (booking.brand === 'elexoir') {
                                domain = 'https://www.elexoirhomespaubud.com';
                              }
                              window.open(`${domain}/invoice/${booking.reference_number}`, '_blank');
                            }}
                            className={cx(btn.base, btn.secondary, btn.xs)}
                            title="View Invoice"
                          >
                            <FileText size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            let editTitle = booking.treatment_name;
                            let editDur = '';
                            const editMatch = editTitle.match(/(.*) \((.*)\)$/);
                            if (editMatch) {
                              editTitle = editMatch[1];
                              editDur = editMatch[2];
                            }

                            setFormItems([
                              {
                                id: Math.random().toString(36).substring(2, 9),
                                treatment: editTitle,
                                duration: editDur,
                                pax: booking.pax,
                                therapists: booking.therapists_count,
                                revenue: booking.revenue,
                                fee: booking.therapist_fee_total,
                              },
                            ]);
                            setFormBrand(booking.brand === 'bali' ? 'bali' : 'elexoir');
                            setIsEditing(booking.id);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={cx(btn.base, btn.secondary, btn.xs)}
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(booking.id)}
                          className={cx(btn.base, btn.danger, btn.xs)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
