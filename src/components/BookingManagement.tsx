'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Download, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight, Calculator, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';

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
        .select('booking_date, revenue, net_profit')
        .gte('booking_date', startOfYear)
        .lte('booking_date', endOfYear);

      if (data) {
        const stats = Array.from({ length: 12 }, (_, i) => ({
          month: monthNames[i].substring(0, 3),
          revenue: 0,
          profit: 0
        }));

        data.forEach((b: any) => {
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

  // Fetch bookings for the ENTIRE month
  useEffect(() => {
    fetchMonthBookings();
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
      setMonthBookings(data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const dailyBookings = useMemo(() => {
    return monthBookings.filter(b => b.booking_date === selectedDate);
  }, [monthBookings, selectedDate]);

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
      net_profit: item.revenue - item.fee
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
    if (monthBookings.length === 0) return alert("No bookings this month to export.");

    const headers = [
      "Booking Reference", 
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
    
    const csvRows = [
      `"FINANCIAL REPORT - EXLEXOIR SPA"`,
      `"Period: ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}"`,
      `""`,
      headers.join(',')
    ];

    let totalRev = 0;
    let totalFee = 0;
    let totalProfit = 0;

    monthBookings.forEach(b => {
      let treatmentDetails = b.treatment_name || '';
      if (b.items && b.items.length > 0) {
         treatmentDetails = b.items.map((i:any) => `${i.title} (${i.duration})`).join(' + ');
      }
      
      csvRows.push([
        `"${b.reference_number || `MANUAL-${b.id.substring(0,6).toUpperCase()}`}"`,
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

    csvRows.push(`,,,,,,,,,`);
    csvRows.push(`"GRAND TOTAL",,,,,,,${totalRev},${totalFee},${totalProfit}`);

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${monthNames[month]}-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalDailyRevenue = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [dailyBookings]);
  const totalDailyProfit = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [dailyBookings]);

  const totalMonthlyRevenue = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [monthBookings]);
  const totalMonthlyProfit = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [monthBookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black">Booking Management</h2>
          <p className="text-sm text-black/60">Centralized daily bookings and financial calculator</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black/80 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Calendar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors"><ChevronLeft size={20} /></button>
              <h3 className="font-bold text-base">{monthNames[month]} {year}</h3>
              <button onClick={handleNextMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-black/40 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const isoString = toLocalDateString(d);
                const isSelected = isoString === selectedDate;
                const isToday = isoString === toLocalDateString(new Date());
                
                const bookingsForThisDay = monthBookings.filter(b => b.booking_date === isoString);
                const paxCount = bookingsForThisDay.reduce((sum, b) => sum + b.pax, 0);

                return (
                  <div key={day} className="relative flex justify-center">
                    <button
                      onClick={() => selectDate(day)}
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${isSelected ? 'bg-black text-white font-bold shadow-md' : 'hover:bg-black/5 text-black/80'}
                        ${isToday && !isSelected ? 'ring-1 ring-black/20' : ''}
                      `}
                    >
                      {day}
                    </button>
                    {paxCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                        {paxCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-black/10">
              <h4 className="text-[10px] font-bold tracking-widest text-black/50 uppercase mb-3 text-center">Daily Summary</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-black/60 uppercase">Daily Revenue</span>
                <span className="font-bold text-black">{formatCurrency(totalDailyRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-green-700">
                <span className="text-xs font-bold uppercase">Net Profit</span>
                <span className="font-bold">{formatCurrency(totalDailyProfit)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-black text-white rounded-2xl p-6 shadow-md">
             <h4 className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-4 text-center">Monthly Summary</h4>
             
             <div className="grid grid-cols-2 gap-4 mb-4">
               <div className="bg-white/10 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-white/60 uppercase font-bold mb-1">Bookings</span>
                  <span className="text-lg font-bold">{monthBookings.length}</span>
               </div>
               <div className="bg-white/10 p-3 rounded-xl text-center">
                  <span className="block text-[10px] text-white/60 uppercase font-bold mb-1">Total Pax</span>
                  <span className="text-lg font-bold">{monthBookings.reduce((sum, b) => sum + b.pax, 0)}</span>
               </div>
             </div>

             <div className="space-y-3 pt-2">
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-white/60 uppercase">Revenue</span>
                 <span className="font-bold">{formatCurrency(totalMonthlyRevenue)}</span>
               </div>
               <div className="flex justify-between items-center text-green-400">
                 <span className="text-xs font-bold uppercase">Net Profit</span>
                 <span className="font-bold">{formatCurrency(totalMonthlyProfit)}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Col: Bookings for Selected Date */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">
              Bookings for {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {!showForm && (
              <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black/80 transition-colors"
              >
                <Plus size={16} /> Add Booking
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-md relative">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-2 text-black/50 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} />
              </button>
              <h4 className="font-bold text-lg mb-6">{isEditing ? 'Edit Booking' : 'New Booking'}</h4>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="relative bg-black/[0.02] border border-black/5 p-4 rounded-xl space-y-4">
                      {formItems.length > 1 && !isEditing && (
                        <button type="button" onClick={() => removeFormItem(index)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors shadow-sm">
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Select Treatment {index + 1}</label>
                          <select required value={item.treatment} onChange={e => updateFormItem(index, 'treatment', e.target.value)} className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black appearance-none cursor-pointer">
                            <option value="">-- Choose Treatment --</option>
                            {treatments.map(t => (
                              <option key={t.id} value={t.title}>{t.title}</option>
                            ))}
                            <option value="Custom Treatment">Custom Treatment</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Duration</label>
                          <select required disabled={!item.treatment} value={item.duration} onChange={e => updateFormItem(index, 'duration', e.target.value)} className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black appearance-none cursor-pointer disabled:opacity-50">
                            <option value="">-- Select Duration --</option>
                            {item.treatment === 'Custom Treatment' ? (
                              <option value="Custom">Custom Duration</option>
                            ) : (
                              treatments.find(t => t.title === item.treatment)?.options?.map(opt => (
                                <option key={opt.duration} value={opt.duration}>{opt.duration} - {opt.price}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Number of Pax</label>
                          <input type="number" min="1" required value={item.pax} onChange={e => updateFormItem(index, 'pax', parseInt(e.target.value) || 1)} className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Number of Therapists</label>
                          <input type="number" min="1" required value={item.therapists} onChange={e => updateFormItem(index, 'therapists', parseInt(e.target.value) || 1)} className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-black/5">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Revenue (IDR)</label>
                          <input type="number" required value={item.revenue} onChange={e => updateFormItem(index, 'revenue', parseInt(e.target.value) || 0)} className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-black" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Therapist Fee (IDR)</label>
                          <input type="number" required value={item.fee} onChange={e => updateFormItem(index, 'fee', parseInt(e.target.value) || 0)} className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-orange-600 focus:outline-none focus:border-black" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Net Profit (IDR)</label>
                          <div className="w-full bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-bold">
                            {formatCurrency(item.revenue - item.fee)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!isEditing && (
                  <button type="button" onClick={addFormItem} className="w-full py-3 border-2 border-dashed border-black/20 text-black/60 rounded-xl text-sm font-bold hover:border-black/40 hover:text-black hover:bg-black/5 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Another Treatment
                  </button>
                )}

                <div className="pt-4 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-4">
                  {formItems.length > 1 && (
                    <div className="text-sm">
                      <span className="font-bold text-black/50">Total Profit: </span>
                      <span className="font-bold text-green-700 text-lg">{formatCurrency(formItems.reduce((acc, item) => acc + (item.revenue - item.fee), 0))}</span>
                    </div>
                  )}
                  <div className="flex-1"></div>
                  <button type="submit" className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-black/80 transition-colors">
                    <Save size={16} /> Save Booking
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>
          ) : dailyBookings.length === 0 ? (
            <div className="bg-black/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-black/5">
              <Calendar size={48} className="text-black/20 mb-4" />
              <p className="text-black/50 font-medium">No bookings scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyBookings.map(booking => {
                let title = booking.treatment_name;
                let dur = '';
                const match = title.match(/(.*) \((.*)\)$/);
                if (match) {
                    title = match[1];
                    dur = match[2];
                    if (dur.includes("mins")) dur = dur.replace("mins", "Minutes");
                }

                return (
                  <div key={booking.id} className={`bg-white border ${booking.status?.toLowerCase() === 'cancelled' ? 'border-red-200' : 'border-black/10'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.status?.toLowerCase() === 'cancelled' ? 'bg-red-500' : (booking.status?.toLowerCase() === 'pending' ? 'bg-orange-400' : 'bg-emerald-500')}`}></div>
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ml-2 ${booking.status?.toLowerCase() === 'cancelled' ? 'opacity-50' : ''}`}>
                      <div className="space-y-2 w-full md:w-1/3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase bg-black/10 px-2 py-0.5 rounded-full whitespace-nowrap">{booking.pax} Pax</span>
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                              booking.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                              (booking.status?.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700')
                          }`}>
                              {booking.status || 'Confirmed'}
                          </span>
                        </div>
                        
                        {booking.items && booking.items.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {booking.items.map((it: any, idx: number) => (
                                    <div key={idx}>
                                        <p className="font-bold text-sm leading-snug">{it.title} {it.guests > 1 ? `(x${it.guests})` : ''}</p>
                                        <p className="text-[10px] text-black/50 font-bold uppercase tracking-wider mt-0.5">Duration: {it.duration}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold text-sm leading-snug">{title}</p>
                                {dur && <p className="text-[10px] text-black/50 font-bold uppercase tracking-wider mt-0.5">Duration: {dur}</p>}
                            </div>
                        )}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-3 gap-2 text-center bg-black/5 rounded-xl p-3">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-black/50 mb-1">Revenue</span>
                          <span className="font-bold text-xs">{formatCurrency(booking.revenue)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-black/50 mb-1">Fees ({booking.therapists_count} {booking.therapists_count > 1 ? 'Therapists' : 'Therapist'})</span>
                          <span className="font-bold text-xs text-orange-600">{formatCurrency(booking.therapist_fee_total)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-black/50 mb-1">Profit</span>
                          <span className="font-bold text-xs text-green-700">{formatCurrency(booking.net_profit)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap md:flex-col gap-2 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                            {booking.status?.toLowerCase() !== 'confirmed' && (
                                <button 
                                onClick={() => handleStatusChange(booking.id, 'Confirmed')}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                                title="Mark as Confirmed"
                                >
                                <CheckCircle2 size={16} />
                                </button>
                            )}
                            {booking.status?.toLowerCase() !== 'cancelled' && (
                                <button 
                                onClick={() => handleStatusChange(booking.id, 'Cancelled')}
                                className="p-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-orange-600"
                                title="Mark as Cancelled"
                                >
                                <XCircle size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {booking.reference_number && (
                                <button 
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
                                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                title="View Invoice"
                                >
                                <FileText size={16} />
                                </button>
                            )}
                            <button 
                            onClick={() => {
                                // Parse out the duration if it was saved like "Title (duration)"
                                let editTitle = booking.treatment_name;
                                let editDur = '';
                                const editMatch = editTitle.match(/(.*) \((.*)\)$/);
                                if (editMatch) {
                                    editTitle = editMatch[1];
                                    editDur = editMatch[2];
                                }
                                
                                setFormItems([{
                                id: Math.random().toString(36).substring(2, 9),
                                treatment: editTitle,
                                duration: editDur,
                                pax: booking.pax,
                                therapists: booking.therapists_count,
                                revenue: booking.revenue,
                                fee: booking.therapist_fee_total
                                }]);
                                setIsEditing(booking.id);
                                setShowForm(true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors text-black"
                            >
                            <Edit3 size={16} />
                            </button>
                            <button 
                            onClick={() => handleDelete(booking.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Yearly Financial Performance Chart */}
      {yearlyStats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Financial Performance (YTD)</h3>
              <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">Gross Revenue & Net Profit by Month</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-200"></div> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-black"></div> Net Profit</div>
            </div>
          </div>
          
          <div className="h-48 md:h-64 flex items-end justify-between gap-1 sm:gap-2">
            {(() => {
              const maxRev = Math.max(...yearlyStats.map(s => s.revenue), 1000000); // minimum scale
              return yearlyStats.map((stat, idx) => {
                const revHeight = Math.max((stat.revenue / maxRev) * 100, 2); // min height 2%
                const profHeight = Math.max((stat.profit / maxRev) * 100, 1);
                const hasData = stat.revenue > 0;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    {hasData && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1.5 px-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <div className="text-white/70 mb-0.5">{stat.month}</div>
                        <div>Rev: {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(stat.revenue)}</div>
                        <div className="text-green-400">Net: {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(stat.profit)}</div>
                      </div>
                    )}
                    
                    {/* Bars */}
                    <div className="w-full max-w-[40px] relative flex items-end justify-center h-full rounded-t-lg transition-all cursor-pointer">
                      {/* Revenue Bar */}
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-md transition-all duration-700 ${hasData ? 'bg-gray-200 group-hover:bg-gray-300' : 'bg-gray-50'}`} 
                        style={{ height: `${hasData ? revHeight : 0}%` }}
                      ></div>
                      {/* Profit Bar */}
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-700 z-10 ${hasData ? 'bg-black shadow-lg shadow-black/20' : 'bg-transparent'}`} 
                        style={{ height: `${hasData ? profHeight : 0}%`, width: '60%' }}
                      ></div>
                    </div>
                    
                    <span className={`text-[10px] sm:text-xs font-bold uppercase mt-3 tracking-wider ${hasData ? 'text-gray-900' : 'text-gray-300'}`}>
                      {stat.month}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
