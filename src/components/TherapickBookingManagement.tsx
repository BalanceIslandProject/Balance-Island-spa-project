'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  XCircle,
  PlayCircle,
  CheckCheck,
  CreditCard,
  Clock,
  RefreshCw,
  CheckSquare,
  Copy,
  Check,
  User,
  Lock,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';
import { cx, btn, inputCls, selectCls, CountPill, EmptyState } from '@/components/admin/affiliate/ui';

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
  payment_status?: string;
  commission?: any;
  location?: string;
  room_number?: string;
  guest_whatsapp?: string;
  guest_email?: string;
}

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Robust Couple Package Identifier: already priced for 2 persons
export const isCouplePackage = (title?: string) => {
  const t = (title || '').toLowerCase();
  return /couple|honeymoon|duo|2\s*person|for\s*2/i.test(t);
};

// Secret admin password to undo Ongoing Treatment or Finish Treatment
const SECRET_ADMIN_PASSWORD = '022320';

// Calculate therapist fee based on therapist_fees database table
// Exactly matching central admin logic with couple packages = 2 therapists
export const calculateBookingTherapistFee = (
  booking: Booking,
  treatmentsList: Treatment[],
  feesList: TherapistFee[]
): { totalFee: number; therapistsCount: number } => {
  let totalFee = 0;
  let therapistsCount = 0;

  const norm = (d: any) => String(d || '').replace(/[^0-9]/g, '');

  const findBaseFee = (treatmentTitle: string, durationStr: string, treatmentId?: string) => {
    const normDur = norm(durationStr);
    const matchingTreatments = treatmentsList.filter(
      t => t.title.trim().toLowerCase() === treatmentTitle.trim().toLowerCase()
    );
    const candidateIds = new Set<string>();
    if (treatmentId) candidateIds.add(treatmentId);
    matchingTreatments.forEach(t => candidateIds.add(t.id));

    let feeObj: TherapistFee | undefined;
    if (normDur) {
      feeObj = feesList.find(
        f => candidateIds.has(f.treatment_id) && norm(f.duration) === normDur
      );
    }
    if (!feeObj && candidateIds.size > 0) {
      feeObj = feesList.find(f => candidateIds.has(f.treatment_id));
    }
    if (!feeObj && normDur) {
      feeObj = feesList.find(f => norm(f.duration) === normDur);
    }
    if (!feeObj && feesList.length > 0) {
      feeObj = feesList[0];
    }

    if (feeObj) {
      const baseStr = String(feeObj.fee || '').replace(/[^0-9]/g, '');
      return parseInt(baseStr || '0', 10);
    }
    return 0;
  };

  if (booking.items && Array.isArray(booking.items) && booking.items.length > 0) {
    booking.items.forEach((item: any) => {
      const title = item.title || item.treatment || '';
      const dur = item.duration || '';
      const isCouple = isCouplePackage(title);
      const pax = isCouple ? 2 : (item.guests || 1);
      const therapistsForItem = isCouple 
        ? Math.max(2, Math.round((item.guests || 2) / 2) * 2) 
        : (item.therapists || pax);

      const baseFee = findBaseFee(title, dur, item.treatmentId || item.treatment_id);
      totalFee += baseFee * therapistsForItem;
      therapistsCount += therapistsForItem;
    });
  } else {
    let title = booking.treatment_name || '';
    let dur = '';
    const match = title.match(/(.*)\s*\((.*)\)$/);
    if (match) {
      title = match[1].trim();
      dur = match[2].trim();
    }
    const isCouple = isCouplePackage(title);
    const therapists = isCouple 
      ? Math.max(2, (booking.therapists_count || 2)) 
      : (booking.therapists_count || booking.pax || 1);

    const baseFee = findBaseFee(title, dur);
    totalFee = baseFee * therapists;
    therapistsCount = therapists;
  }

  return { totalFee, therapistsCount };
};

export default function TherapickBookingManagement({ 
  treatments, 
  therapistFees 
}: { 
  treatments: Treatment[], 
  therapistFees: TherapistFee[] 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateString(new Date()));
  const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
  const [allTherapistFees, setAllTherapistFees] = useState<TherapistFee[]>(therapistFees || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const selectedBooking = useMemo(
    () => monthBookings.find(b => b.id === selectedBookingId) || null,
    [monthBookings, selectedBookingId]
  );

  useEffect(() => {
    if (therapistFees && therapistFees.length > 0) {
      setAllTherapistFees(therapistFees);
    }
  }, [therapistFees]);

  useEffect(() => {
    async function loadFreshFees() {
      const { data } = await supabase.from('therapist_fees').select('*');
      if (data && data.length > 0) {
        setAllTherapistFees(data);
      }
    }
    loadFreshFees();
  }, []);

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

      // STRICT DATA ISOLATION: Therapick has its own data exclusively for booktherapick.com
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, revenue, net_profit, brand')
        .eq('brand', 'therapick')
        .gte('booking_date', startOfYear)
        .lte('booking_date', endOfYear);

      if (data) {
        const stats = Array.from({ length: 12 }, (_, i) => ({
          month: monthNames[i].substring(0, 3),
          revenue: 0,
          profit: 0
        }));

        data.filter((b: any) => b.brand === 'therapick').forEach((b: any) => {
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

  // Fetch bookings for the ENTIRE month + Realtime sync with affiliate commissions
  useEffect(() => {
    fetchMonthBookings();

    const channel = supabase
      .channel('admin_bookings_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchMonthBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => {
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

      const [bookingsRes, commissionsRes, feesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('brand', 'therapick')
          .gte('booking_date', startOfMonth)
          .lte('booking_date', endOfMonth)
          .order('created_at', { ascending: true }),
        supabase
          .from('affiliate_commissions')
          .select('*'),
        supabase
          .from('therapist_fees')
          .select('*'),
      ]);

      const data = bookingsRes.data || [];
      const comms = commissionsRes.data || [];
      const currentFees = (feesRes.data && feesRes.data.length > 0) ? feesRes.data : allTherapistFees;
      if (feesRes.data && feesRes.data.length > 0) {
        setAllTherapistFees(feesRes.data);
      }

      // Map commissions by uppercase booking ID
      const commMap = new Map<string, any>();
      comms.forEach((c: any) => {
        if (c.booking_id) {
          commMap.set(String(c.booking_id).trim().toUpperCase(), c);
        }
      });

      const merged: Booking[] = data.map((b: any) => {
        const ref = String(b.reference_number || b.id || '').trim().toUpperCase();
        const c = commMap.get(ref);
        const isPaid = c?.payment_verified || b.payment_status === 'paid';

        // Calculate therapist fee base on therapist_fees database (couple = 2 therapists)
        const { totalFee, therapistsCount } = calculateBookingTherapistFee(b, treatments, currentFees);
        const effectiveTherapistFee = Number(b.therapist_fee_total || 0) > 0 ? Number(b.therapist_fee_total) : totalFee;
        const effectiveTherapistsCount = Number(b.therapists_count || 0) > 0 ? Number(b.therapists_count) : therapistsCount;

        // Smart profit detection:
        // Revenue minus therapist fees minus approved or paid affiliate commission
        let autoCalculatedProfit = Math.max(0, Number(b.revenue || 0) - effectiveTherapistFee);
        if (c && (c.status === 'approved' || c.status === 'paid') && Number(c.commission_amount || 0) > 0) {
          autoCalculatedProfit = Math.max(0, Number(b.revenue || 0) - effectiveTherapistFee - Number(c.commission_amount || 0));
        }

        return {
          ...b,
          therapist_fee_total: effectiveTherapistFee,
          therapists_count: effectiveTherapistsCount,
          net_profit: autoCalculatedProfit,
          commission: c,
          payment_status: isPaid ? 'paid' : (b.payment_status || 'unpaid'),
        };
      });

      // Filter: STRICT DATA ISOLATION - Exclusively BookTherapick data
      const therapickFiltered = merged.filter(b => b.brand === 'therapick');

      setMonthBookings(therapickFiltered);
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
      if (typeof value === 'string' && isCouplePackage(value)) {
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
          
          const isCouple = isCouplePackage(item.treatment);
          // CRITICAL: Couple package price is ALREADY FOR 2 PERSONS! Do NOT multiply it by 2.
          item.revenue = isCouple ? (price * Math.max(1, Math.round(item.pax / 2))) : (price * item.pax);
        }

        if (t && allTherapistFees.length > 0) {
          const normalizeDur = (d: string) => d.replace(/[^0-9]/g, '');
          const normFormDur = normalizeDur(item.duration);
          
          const matchingFee = allTherapistFees.find(f => 
             f.treatment_id === t.id && normalizeDur(f.duration) === normFormDur
          );
          
          const feeObj = matchingFee || allTherapistFees.find(f => normalizeDur(f.duration) === normFormDur) || allTherapistFees[0];
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
      brand: 'therapick'
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
    const booking = monthBookings.find(b => b.id === id);
    const currentStatus = (booking?.status || '').toLowerCase();
    if (currentStatus === 'ongoing' || currentStatus === 'completed') {
      const pin = prompt(`Booking #${booking?.reference_number || id} is marked as ${booking?.status}. Enter secret admin password to delete:`);
      if (pin !== (process.env.NEXT_PUBLIC_DELETE_PIN || SECRET_ADMIN_PASSWORD)) {
        alert('Incorrect password. Deletion cancelled.');
        return;
      }
    } else {
      if (!confirm("Are you sure you want to delete this booking?")) return;
    }

    await supabase.from('bookings').delete().eq('id', id);
    fetchMonthBookings();
  };

  // Change Treatment Status (Cancel / Reinstate)
  const handleStatusChange = async (id: string, newStatus: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    let updates: any = { status: newStatus };

    if (newStatus === 'Ongoing' || newStatus === 'Completed' || newStatus === 'Confirmed' || newStatus === 'CONFIRMED') {
      const { totalFee, therapistsCount } = calculateBookingTherapistFee(booking, treatments, allTherapistFees);
      if (totalFee > 0) {
        updates.therapist_fee_total = totalFee;
        updates.therapists_count = therapistsCount;
        const isCommApproved = booking?.commission?.status === 'approved' || booking?.commission?.status === 'paid';
        const commAmount = isCommApproved ? Number(booking.commission.commission_amount || 0) : 0;
        updates.net_profit = Math.max(0, (booking.revenue || 0) - totalFee - commAmount);
      }
    }

    await supabase.from('bookings').update(updates).eq('id', id);

    // Realtime Sync to affiliate_commissions
    const ref = booking?.reference_number || booking?.id;
    if (ref) {
      if (newStatus === 'Cancelled') {
        await supabase
          .from('affiliate_commissions')
          .update({
            status: 'cancelled',
            service_completed: false,
            updated_at: new Date().toISOString(),
          })
          .ilike('booking_id', ref);
      } else if (newStatus === 'Confirmed' || newStatus === 'Pending') {
        if (booking?.commission?.status === 'cancelled') {
          await supabase
            .from('affiliate_commissions')
            .update({
              status: 'pending',
              service_completed: false,
              updated_at: new Date().toISOString(),
            })
            .ilike('booking_id', ref);
        }
      }
    }

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

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const isoString = toLocalDateString(d);
    setSelectedDate(isoString);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const isoString = toLocalDateString(d);
    setSelectedDate(isoString);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleToday = () => {
    const today = new Date();
    const isoString = toLocalDateString(today);
    setSelectedDate(isoString);
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

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

  const totalDailyRevenue = useMemo(
    () => dailyBookings.filter(b => b.status?.toLowerCase() !== 'cancelled').reduce((sum, b) => sum + (b.revenue || 0), 0),
    [dailyBookings]
  );
  const totalDailyProfit = useMemo(
    () => dailyBookings.filter(b => b.status?.toLowerCase() !== 'cancelled').reduce((sum, b) => sum + (b.net_profit || 0), 0),
    [dailyBookings]
  );
  const totalDailyCommission = useMemo(
    () => dailyBookings
      .filter(b => b.status?.toLowerCase() !== 'cancelled')
      .reduce((sum, b) => {
        const c = b.commission;
        if (c && (c.status === 'approved' || c.status === 'paid')) {
          return sum + Number(c.commission_amount || 0);
        }
        return sum;
      }, 0),
    [dailyBookings]
  );

  const totalMonthlyRevenue = useMemo(
    () => monthBookings.filter(b => b.status?.toLowerCase() !== 'cancelled').reduce((sum, b) => sum + (b.revenue || 0), 0),
    [monthBookings]
  );
  const totalMonthlyProfit = useMemo(
    () => monthBookings.filter(b => b.status?.toLowerCase() !== 'cancelled').reduce((sum, b) => sum + (b.net_profit || 0), 0),
    [monthBookings]
  );
  const totalMonthlyCommission = useMemo(
    () => monthBookings
      .filter(b => b.status?.toLowerCase() !== 'cancelled')
      .reduce((sum, b) => {
        const c = b.commission;
        if (c && (c.status === 'approved' || c.status === 'paid')) {
          return sum + Number(c.commission_amount || 0);
        }
        return sum;
      }, 0),
    [monthBookings]
  );

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Title removed, keeping Refresh and Export CSV in clean position) */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={fetchMonthBookings}
          disabled={isLoading}
          className={cx(btn.base, btn.secondary, btn.icon)}
          title="Refresh bookings"
          aria-label="Refresh bookings"
        >
          <RefreshCw size={15} className={cx(isLoading && 'animate-spin')} />
        </button>
        <button
          type="button"
          onClick={downloadCSV}
          className={cx(btn.base, btn.primary, btn.sm)}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Financial Metrics Strip: Daily & Monthly (Revenue, Profit, Commission Paid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Daily Financials */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#F0F0F0]">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
              Daily Financials · <span className="text-black font-semibold">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div>
              <div className="text-xs text-[#737373] font-medium truncate">Daily revenue</div>
              <div className="text-xl sm:text-2xl font-semibold text-black mt-1 tabular-nums">{formatCurrency(totalDailyRevenue)}</div>
            </div>
            <div>
              <div className="text-xs text-[#737373] font-medium truncate">Daily profit</div>
              <div className="text-xl sm:text-2xl font-semibold text-emerald-600 mt-1 tabular-nums">{formatCurrency(totalDailyProfit)}</div>
            </div>
            <div>
              <div className="text-xs text-[#737373] font-medium truncate">Commission paid</div>
              <div className="text-xl sm:text-2xl font-semibold text-indigo-600 mt-1 tabular-nums">{formatCurrency(totalDailyCommission)}</div>
            </div>
          </div>
        </div>

        {/* Monthly Financials */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#F0F0F0]">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
              Monthly Financials · <span className="text-black font-semibold">{monthNames[month]} {year}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div>
              <div className="text-xs text-[#737373] font-medium truncate">Monthly revenue</div>
              <div className="text-xl sm:text-2xl font-semibold text-black mt-1 tabular-nums">{formatCurrency(totalMonthlyRevenue)}</div>
            </div>
            <div>
              <div className="text-xs text-[#737373] font-medium truncate">Monthly profit</div>
              <div className="text-xl sm:text-2xl font-semibold text-emerald-600 mt-1 tabular-nums">{formatCurrency(totalMonthlyProfit)}</div>
            </div>
            <div>
              <div className="text-xs text-[#737373] font-medium truncate">Commission paid</div>
              <div className="text-xl sm:text-2xl font-semibold text-indigo-600 mt-1 tabular-nums">{formatCurrency(totalMonthlyCommission)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Calendar & Financial Summaries */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
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

            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-[11px] font-medium text-[#737373] uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 w-full" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const isoString = toLocalDateString(d);
                const isSelected = isoString === selectedDate;
                const isToday = isoString === toLocalDateString(new Date());
                
                const bookingsForThisDay = monthBookings.filter((b) => b.booking_date === isoString && b.status?.toLowerCase() !== 'cancelled');
                const paxCount = bookingsForThisDay.reduce((sum, b) => sum + b.pax, 0);
                const dayRev = bookingsForThisDay.reduce((sum, b) => sum + (b.revenue || 0), 0);
                const dayProfit = bookingsForThisDay.reduce((sum, b) => sum + (b.net_profit || 0), 0);
                const dayComm = bookingsForThisDay.reduce((sum, b) => {
                  const c = b.commission;
                  return (c && (c.status === 'approved' || c.status === 'paid')) ? sum + Number(c.commission_amount || 0) : sum;
                }, 0);

                return (
                  <div key={day} className="relative flex justify-center">
                    <button
                      type="button"
                      onClick={() => selectDate(day)}
                      title={bookingsForThisDay.length > 0 
                        ? `${isoString} · ${bookingsForThisDay.length} bookings (${paxCount} pax)\nRevenue: ${formatCurrency(dayRev)}\nProfit: ${formatCurrency(dayProfit)}\nCommission: ${formatCurrency(dayComm)}`
                        : isoString}
                      className={cx(
                        'h-9 w-full rounded-lg flex items-center justify-center text-xs transition-all relative font-medium',
                        isSelected
                          ? 'bg-black text-white font-semibold shadow-sm'
                          : isToday
                          ? 'border border-black text-black font-semibold'
                          : 'hover:bg-[#FAFAFA] text-[#171717]'
                      )}
                    >
                      {day}
                      {paxCount > 0 && (
                        <span
                          className={cx(
                            'absolute top-1 right-1 w-1.5 h-1.5 rounded-full',
                            isSelected ? 'bg-emerald-400' : 'bg-emerald-600'
                          )}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Financial Summary under Calendar */}
            <div className="mt-4 pt-3.5 border-t border-[#F0F0F0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-black">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} Financials
                </span>
                <span className="text-[11px] text-[#737373]">
                  {dailyBookings.length} {dailyBookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center bg-[#FAFAFA] rounded-lg p-2.5 border border-[#E5E5E5]">
                <div>
                  <div className="text-[10px] text-[#737373] font-medium uppercase truncate">Revenue</div>
                  <div className="text-xs font-semibold text-black mt-0.5 tabular-nums truncate">{formatCurrency(totalDailyRevenue)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#737373] font-medium uppercase truncate">Profit</div>
                  <div className="text-xs font-semibold text-emerald-600 mt-0.5 tabular-nums truncate">{formatCurrency(totalDailyProfit)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#737373] font-medium uppercase truncate">Commission</div>
                  <div className="text-xs font-semibold text-indigo-600 mt-0.5 tabular-nums truncate">{formatCurrency(totalDailyCommission)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Bookings for Selected Date */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Quick Date Jumper: Prev, Today, Next */}
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={handlePrevDay} 
                  className={cx(btn.base, btn.secondary, btn.xs)}
                  title="Previous Day"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  type="button" 
                  onClick={handleToday} 
                  className={cx(
                    btn.base, 
                    selectedDate === toLocalDateString(new Date()) ? btn.primary : btn.secondary, 
                    btn.xs
                  )}
                  title="Jump to Today"
                >
                  Today
                </button>
                <button 
                  type="button" 
                  onClick={handleNextDay} 
                  className={cx(btn.base, btn.secondary, btn.xs)}
                  title="Next Day"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-black">
                  Bookings for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </h3>
                <CountPill>{dailyBookings.length}</CountPill>
              </div>
            </div>

            {!showForm && (
              <button 
                type="button"
                onClick={() => { resetForm(); setShowForm(true); }}
                className={cx(btn.base, btn.primary, btn.sm, 'shrink-0')}
              >
                <Plus size={14} /> Add booking
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 sm:p-6 relative space-y-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={cx(btn.base, btn.secondary, btn.icon, 'absolute top-4 right-4')}
                aria-label="Close form"
              >
                <X size={16} />
              </button>
              <h4 className="font-semibold text-base text-black">{isEditing ? 'Edit booking' : 'New booking'}</h4>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-4">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="relative bg-[#FAFAFA] border border-[#E5E5E5] p-4 rounded-xl space-y-4">
                      {formItems.length > 1 && !isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className={cx(btn.base, btn.secondary, btn.icon, 'h-7 w-7 absolute -top-2 -right-2 text-red-600 hover:border-red-300')}
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Select treatment {index + 1}</label>
                          <select required value={item.treatment} onChange={e => updateFormItem(index, 'treatment', e.target.value)} className={selectCls}>
                            <option value="">-- Choose Treatment --</option>
                            {treatments.map(t => (
                              <option key={t.id} value={t.title}>{t.title}</option>
                            ))}
                            <option value="Custom Treatment">Custom Treatment</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Duration</label>
                          <select required disabled={!item.treatment} value={item.duration} onChange={e => updateFormItem(index, 'duration', e.target.value)} className={cx(selectCls, 'disabled:opacity-50')}>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Number of pax</label>
                          <input type="number" min="1" required value={item.pax} onChange={e => updateFormItem(index, 'pax', parseInt(e.target.value) || 1)} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Number of therapists</label>
                          <input type="number" min="1" required value={item.therapists} onChange={e => updateFormItem(index, 'therapists', parseInt(e.target.value) || 1)} className={inputCls} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#E5E5E5]">
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Revenue (IDR)</label>
                          <input type="number" required value={item.revenue} onChange={e => updateFormItem(index, 'revenue', parseInt(e.target.value) || 0)} className={cx(inputCls, 'tabular-nums')} />
                        </div>
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Therapist fee (IDR)</label>
                          <input type="number" required value={item.fee} onChange={e => updateFormItem(index, 'fee', parseInt(e.target.value) || 0)} className={cx(inputCls, 'tabular-nums text-[#737373]')} />
                        </div>
                        <div>
                          <label className="text-xs text-[#737373] block mb-1.5 font-medium">Net profit (IDR)</label>
                          <div className="h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center tabular-nums">
                            {formatCurrency(item.revenue - item.fee)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!isEditing && (
                  <button type="button" onClick={addFormItem} className={cx(btn.base, btn.secondary, btn.sm, 'w-full')}>
                    <Plus size={14} /> Add another treatment
                  </button>
                )}

                <div className="pt-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row justify-between items-center gap-4">
                  {formItems.length > 1 && (
                    <div className="text-xs text-[#737373]">
                      Total profit:{' '}
                      <span className="font-semibold text-emerald-600 text-sm tabular-nums">
                        {formatCurrency(formItems.reduce((acc, item) => acc + (item.revenue - item.fee), 0))}
                      </span>
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button type="button" onClick={() => setShowForm(false)} className={cx(btn.base, btn.secondary, btn.sm, 'flex-1 sm:flex-none')}>
                      Cancel
                    </button>
                    <button type="submit" className={cx(btn.base, btn.primary, btn.sm, 'flex-1 sm:flex-none')}>
                      <Save size={14} /> Save booking
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>
          ) : dailyBookings.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] rounded-xl">
              <EmptyState 
                title="No bookings scheduled for this date" 
                description={`No appointments logged for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}.`}
                action={
                  !showForm && (
                    <button 
                      type="button" 
                      onClick={() => { resetForm(); setShowForm(true); }}
                      className={cx(btn.base, btn.primary, btn.sm)}
                    >
                      <Plus size={14} /> Add booking
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailyBookings.map(booking => {
                let title = booking.treatment_name;
                const match = title.match(/(.*) \((.*)\)$/);
                if (match) {
                  title = match[1];
                }

                const isPaid = booking.payment_status === 'paid' || booking.commission?.payment_verified;
                const bookingStatus = booking.status || 'Confirmed';
                const isCancelled = bookingStatus.toLowerCase() === 'cancelled';
                const isOngoing = bookingStatus.toLowerCase() === 'ongoing';
                const isCompleted = bookingStatus.toLowerCase() === 'completed';

                return (
                  <div 
                    key={booking.id} 
                    className={cx(
                      'bg-white border rounded-xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                      isCancelled ? 'border-red-200 bg-red-50/15' : 'border-[#E5E5E5] hover:border-black/40'
                    )}
                  >
                    {/* Left: Clickable Booking ID + Customer Name + Treatment Name */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Clickable Booking ID */}
                        <button
                          type="button"
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="font-mono text-xs font-semibold text-black bg-[#FAFAFA] hover:bg-black hover:text-white px-2 py-0.5 rounded border border-[#E5E5E5] transition-colors cursor-pointer inline-flex items-center gap-1 group"
                          title="Click to view all booking details"
                        >
                          <span>#{booking.reference_number || booking.id.substring(0, 8)}</span>
                          <ExternalLink size={10} className="text-[#A3A3A3] group-hover:text-white transition-colors" />
                        </button>

                        {/* Customer Name */}
                        <span className="font-semibold text-sm text-black truncate">
                          {booking.guest_name || 'Guest'}
                        </span>

                        {/* Status Badges */}
                        {isPaid ? (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Unpaid
                          </span>
                        )}

                        {isCancelled ? (
                          <span className="text-[10px] font-medium text-[#737373] bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                            Cancelled
                          </span>
                        ) : isOngoing ? (
                          <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Ongoing
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            Finished
                          </span>
                        ) : null}
                      </div>

                      {/* Treatment Name */}
                      <p className="text-xs text-[#737373] font-medium truncate">
                        {title}
                      </p>
                    </div>

                    {/* Right: Details CTA Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingId(booking.id)}
                        className={cx(btn.base, btn.secondary, btn.xs, 'gap-1')}
                        title="View complete booking details"
                      >
                        <span>Details</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Complete Booking Details Modal (Opened when clicking Booking ID) */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setSelectedBookingId(null)}
        >
          <div 
            className="bg-white border border-[#E5E5E5] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex items-center justify-between gap-3 bg-[#FAFAFA]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-black bg-white px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                  #{selectedBooking.reference_number || selectedBooking.id.substring(0, 8)}
                </span>
                {selectedBooking.reference_number && (
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedBooking.reference_number!)}
                    className={cx(btn.base, btn.secondary, btn.icon, 'h-7 w-7 text-[#737373]')}
                    title="Copy reference number"
                  >
                    {copiedId === selectedBooking.reference_number ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
                <span className="text-xs text-[#737373] bg-white px-2 py-1 rounded-md border border-[#E5E5E5]">
                  {selectedBooking.pax} Pax
                </span>
                {selectedBooking.time && selectedBooking.time !== '-' && (
                  <span className="text-xs text-[#737373] bg-white px-2 py-1 rounded-md border border-[#E5E5E5] flex items-center gap-1">
                    <Clock size={11} className="text-[#737373]" />
                    {selectedBooking.time}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingId(null)}
                className="h-8 w-8 rounded-lg text-[#737373] hover:text-black hover:bg-[#F0F0F0] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Customer & Location */}
              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-black">
                      <User size={15} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-black">
                        {selectedBooking.guest_name || 'Guest'}
                      </h4>
                      <p className="text-xs text-[#737373]">Customer Details</p>
                    </div>
                  </div>

                  {/* Payment & Status Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedBooking.payment_status === 'paid' || selectedBooking.commission?.payment_verified ? (
                      <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        Paid
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                        Unpaid
                      </span>
                    )}

                    {selectedBooking.status?.toLowerCase() === 'cancelled' ? (
                      <span className="text-xs font-medium text-[#737373] bg-[#F5F5F5] px-2.5 py-0.5 rounded-md border border-[#E5E5E5]">
                        Cancelled
                      </span>
                    ) : selectedBooking.status?.toLowerCase() === 'ongoing' ? (
                      <span className="text-xs font-medium text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Ongoing Treatment
                      </span>
                    ) : selectedBooking.status?.toLowerCase() === 'completed' ? (
                      <span className="text-xs font-medium text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-teal-700" />
                        Finished
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        Confirmed
                      </span>
                    )}
                  </div>
                </div>

                {selectedBooking.location && (
                  <div className="text-xs text-[#737373] flex items-center gap-1.5 pt-2 border-t border-[#F0F0F0]">
                    <MapPin size={13} className="text-[#737373] shrink-0" />
                    <span>{selectedBooking.location}{selectedBooking.room_number ? `, Room ${selectedBooking.room_number}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Treatments List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] block">
                  Treatments & Rituals
                </span>
                <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] space-y-3">
                  {selectedBooking.items && selectedBooking.items.length > 0 ? (
                    selectedBooking.items.map((it: any, idx: number) => {
                      const isCouple = isCouplePackage(it.title);
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E5E5E5] last:pb-0 last:border-b-0">
                          <div>
                            <p className="font-semibold text-sm text-black">
                              {it.title} {isCouple ? '(Couple Package)' : it.guests > 1 ? `(x${it.guests})` : ''}
                            </p>
                            <p className="text-xs text-[#737373] mt-0.5">
                              Duration: {it.duration} Mins • {isCouple ? '2 Therapists Assigned' : `${it.guests || 1} Therapist Assigned`}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div>
                      <p className="font-semibold text-sm text-black">{selectedBooking.treatment_name}</p>
                      <p className="text-xs text-[#737373] mt-0.5">
                        {selectedBooking.therapists_count} {selectedBooking.therapists_count > 1 ? 'Therapists Assigned' : 'Therapist Assigned'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown (3-column CRM Box) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] block">
                  Financial Breakdown
                </span>
                <div className="grid grid-cols-3 divide-x divide-[#E5E5E5] border border-[#E5E5E5] rounded-xl p-3 text-center bg-white">
                  <div className="flex flex-col justify-center px-2">
                    <span className="block text-[10px] text-[#737373] font-medium">Revenue</span>
                    <span className="font-semibold text-sm sm:text-base text-black tabular-nums mt-0.5">
                      {formatCurrency(selectedBooking.revenue)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center px-2">
                    <span className="block text-[10px] text-[#737373] font-medium">
                      Fees ({selectedBooking.therapists_count} {selectedBooking.therapists_count > 1 ? 'Therapists' : 'Therapist'})
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-[#737373] tabular-nums mt-0.5">
                      {formatCurrency(selectedBooking.therapist_fee_total)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center px-2">
                    <span className="block text-[10px] text-[#737373] font-medium">Net Profit</span>
                    <span className="font-semibold text-sm sm:text-base text-emerald-600 tabular-nums mt-0.5">
                      {formatCurrency(selectedBooking.net_profit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Partner Attribution Box (if referred by partner) */}
              {selectedBooking.commission && (
                <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-black bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                        Partner: #{selectedBooking.commission.partner_code}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 font-mono">
                        Commission: +{formatCurrency(selectedBooking.commission.commission_amount || 0)}
                      </span>
                      {selectedBooking.commission.status === 'approved' ? (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckSquare size={11} className="text-emerald-700" /> Approved
                        </span>
                      ) : selectedBooking.commission.status === 'cancelled' ? (
                        <span className="text-[11px] font-medium text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded">
                          Cancelled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock size={11} className="text-amber-700" /> Pending
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-4 sm:p-5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedBooking.reference_number && (
                  <button
                    type="button"
                    onClick={() => {
                      let domain = window.location.origin;
                      if (selectedBooking.brand === 'bali') {
                        domain = 'https://www.homespaubud.com';
                      } else if (selectedBooking.brand === 'therapick') {
                        domain = 'https://www.booktherapick.com';
                      } else if (selectedBooking.brand === 'elexoir') {
                        domain = 'https://www.elexoirhomespaubud.com';
                      }
                      window.open(`${domain}/invoice/${selectedBooking.reference_number}`, '_blank');
                    }}
                    className={cx(btn.base, btn.secondary, btn.sm, 'text-blue-600 flex-1 sm:flex-none')}
                  >
                    <FileText size={14} />
                    <span>View Invoice</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    let editTitle = selectedBooking.treatment_name;
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
                      pax: selectedBooking.pax,
                      therapists: selectedBooking.therapists_count,
                      revenue: selectedBooking.revenue,
                      fee: selectedBooking.therapist_fee_total
                    }]);
                    setIsEditing(selectedBooking.id);
                    setShowForm(true);
                    setSelectedBookingId(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cx(btn.base, btn.secondary, btn.sm)}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedBooking.id, selectedBooking.status?.toLowerCase() === 'cancelled' ? (selectedBooking.commission ? 'Pending' : 'Confirmed') : 'Cancelled')}
                  className={cx(
                    btn.base,
                    btn.secondary,
                    btn.sm,
                    selectedBooking.status?.toLowerCase() === 'cancelled'
                      ? 'text-emerald-700 hover:border-emerald-300'
                      : 'text-amber-700 hover:border-amber-300'
                  )}
                >
                  {selectedBooking.status?.toLowerCase() === 'cancelled' ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Reinstate</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      <span>Cancel</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDelete(selectedBooking.id);
                    setSelectedBookingId(null);
                  }}
                  className={cx(btn.base, btn.secondary, btn.sm, 'text-red-600 hover:border-red-300')}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBookingId(null)}
                  className={cx(btn.base, btn.primary, btn.sm)}
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
