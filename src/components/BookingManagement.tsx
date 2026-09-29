'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Download, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight, Calculator, FileText } from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';

export interface Booking {
  id: string;
  created_at: string;
  booking_date: string; // YYYY-MM-DD
  time: string;
  treatment_name: string;
  pax: number;
  therapists_count: number;
  revenue: number;
  therapist_fee_total: number;
  net_profit: number;
}

export default function BookingManagement({ 
  treatments, 
  therapistFees 
}: { 
  treatments: Treatment[], 
  therapistFees: TherapistFee[] 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formTime, setFormTime] = useState('10:00');
  const [formTreatment, setFormTreatment] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formPax, setFormPax] = useState<number>(1);
  const [formTherapists, setFormTherapists] = useState<number>(1);
  const [formRevenue, setFormRevenue] = useState<number>(0);
  const [formFee, setFormFee] = useState<number>(0);

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', selectedDate)
        .order('time', { ascending: true });
      
      if (error && error.code !== '42P01') { // Ignore table not found error initially
        console.error("Error fetching bookings", error);
      }
      setBookings(data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  // Auto-calculate logic
  useEffect(() => {
    if (!formTreatment || !formDuration) return;
    
    // Find matching treatment
    const t = treatments.find(x => x.title === formTreatment);
    let rev = 0;
    if (t && t.options && t.options.length > 0) {
      const opt = t.options.find(o => o.duration === formDuration) || t.options[0];
      const priceStr = opt.price.replace(/[^0-9]/g, '');
      const price = parseInt(priceStr || '0', 10);
      rev = price * formPax;
    }

    // Find matching therapist fee
    let fee = 0;
    if (therapistFees.length > 0) {
      const matchingFee = therapistFees.find(f => f.duration === formDuration);
      const feeObj = matchingFee || therapistFees[0];
      const baseFeeStr = feeObj.fee.replace(/[^0-9]/g, '');
      const baseFee = parseInt(baseFeeStr || '0', 10);
      fee = baseFee * formTherapists;
    }

    // Only auto-update if not editing existing
    if (!isEditing) {
      setFormRevenue(rev);
      setFormFee(fee);
    }
  }, [formTreatment, formDuration, formPax, formTherapists]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTreatment) return alert("Please fill required fields.");

    const payload = {
      booking_date: selectedDate,
      time: "-", // Hardcoded since it was removed from UI but might be required in DB
      treatment_name: formDuration ? `${formTreatment} (${formDuration})` : formTreatment,
      pax: formPax,
      therapists_count: formTherapists,
      revenue: formRevenue,
      therapist_fee_total: formFee,
      net_profit: formRevenue - formFee
    };

    if (isEditing) {
      const { error } = await supabase.from('bookings').update(payload).eq('id', isEditing);
      if (error) {
         if (error.code === '42P01') alert("Database table 'bookings' does not exist yet. Please run the SQL migration.");
         else alert("Error updating: " + error.message);
      }
    } else {
      const { error } = await supabase.from('bookings').insert([payload]);
      if (error) {
         if (error.code === '42P01') alert("Database table 'bookings' does not exist yet. Please run the SQL migration.");
         else alert("Error saving: " + error.message);
      }
    }

    setShowForm(false);
    setIsEditing(null);
    resetForm();
    fetchBookings();
  };

  const resetForm = () => {
    setFormTime('10:00');
    setFormTreatment('');
    setFormDuration('');
    setFormPax(1);
    setFormTherapists(1);
    setFormRevenue(0);
    setFormFee(0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    await supabase.from('bookings').delete().eq('id', id);
    fetchBookings();
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
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectDate = (day: number) => {
    const d = new Date(year, month, day);
    // YYYY-MM-DD
    const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setSelectedDate(isoString);
    setShowForm(false);
  };

  const downloadCSV = async () => {
    // Fetch all for current month
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', startOfMonth)
      .lte('booking_date', endOfMonth)
      .order('booking_date', { ascending: true });
      
    if (!data || data.length === 0) return alert("No bookings this month to export.");

    const headers = ["Date", "Treatment", "Pax", "Therapists", "Revenue", "Therapist Fee", "Net Profit"];
    const csvRows = [headers.join(',')];

    data.forEach(b => {
      csvRows.push([
        b.booking_date,
        `"${b.treatment_name}"`,
        b.pax,
        b.therapists_count,
        b.revenue,
        b.therapist_fee_total,
        b.net_profit
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${monthNames[month]}-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalDailyRevenue = useMemo(() => bookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [bookings]);
  const totalDailyProfit = useMemo(() => bookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [bookings]);

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
        <div className="lg:col-span-1">
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
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const isSelected = isoString === selectedDate;
                const isToday = isoString === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`
                      aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${isSelected ? 'bg-black text-white font-bold shadow-md' : 'hover:bg-black/5 text-black/80'}
                      ${isToday && !isSelected ? 'ring-1 ring-black/20' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-black/10">
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
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Select Treatment</label>
                    <select required value={formTreatment} onChange={e => {
                        setFormTreatment(e.target.value);
                        setFormDuration(''); // Reset duration when treatment changes
                    }} className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black appearance-none cursor-pointer">
                      <option value="">-- Choose Treatment --</option>
                      {treatments.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                      ))}
                      <option value="Custom Treatment">Custom Treatment</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Duration</label>
                    <select required disabled={!formTreatment} value={formDuration} onChange={e => setFormDuration(e.target.value)} className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black appearance-none cursor-pointer disabled:opacity-50">
                      <option value="">-- Select Duration --</option>
                      {formTreatment === 'Custom Treatment' ? (
                        <option value="Custom">Custom Duration</option>
                      ) : (
                        treatments.find(t => t.title === formTreatment)?.options?.map(opt => (
                          <option key={opt.duration} value={opt.duration}>{opt.duration} - {opt.price}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Number of Pax</label>
                    <input type="number" min="1" required value={formPax} onChange={e => setFormPax(parseInt(e.target.value) || 1)} className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Number of Therapists</label>
                    <input type="number" min="1" required value={formTherapists} onChange={e => setFormTherapists(parseInt(e.target.value) || 1)} className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-black/10">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Revenue (IDR)</label>
                    <input type="number" required value={formRevenue} onChange={e => setFormRevenue(parseInt(e.target.value) || 0)} className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Therapist Fee (IDR)</label>
                    <input type="number" required value={formFee} onChange={e => setFormFee(parseInt(e.target.value) || 0)} className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-orange-600 focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/50 block mb-2">Net Profit (IDR)</label>
                    <div className="w-full bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-bold">
                      {formatCurrency(formRevenue - formFee)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black/80 transition-colors">
                    <Save size={16} /> Save Booking
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>
          ) : bookings.length === 0 ? (
            <div className="bg-black/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-black/5">
              <Calendar size={48} className="text-black/20 mb-4" />
              <p className="text-black/50 font-medium">No bookings scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white border border-black/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-2">
                    <div className="space-y-1 w-full md:w-1/3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-black/10 px-2 py-0.5 rounded-full">{booking.pax} Pax</span>
                      </div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{booking.treatment_name}</p>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center bg-black/5 rounded-xl p-3">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-black/50 mb-1">Revenue</span>
                        <span className="font-bold text-xs">{formatCurrency(booking.revenue)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-black/50 mb-1">Fees ({booking.therapists_count} Th)</span>
                        <span className="font-bold text-xs text-orange-600">{formatCurrency(booking.therapist_fee_total)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-black/50 mb-1">Profit</span>
                        <span className="font-bold text-xs text-green-700">{formatCurrency(booking.net_profit)}</span>
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col gap-2 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          // Parse out the duration if it was saved like "Title (duration)"
                          let title = booking.treatment_name;
                          let dur = '';
                          const match = title.match(/(.*) \((.*)\)$/);
                          if (match) {
                              title = match[1];
                              dur = match[2];
                          }
                          
                          setFormTreatment(title);
                          setFormDuration(dur);
                          setFormPax(booking.pax);
                          setFormTherapists(booking.therapists_count);
                          setFormRevenue(booking.revenue);
                          setFormFee(booking.therapist_fee_total);
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
