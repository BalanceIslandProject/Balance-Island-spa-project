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
  ExternalLink,
  Compass,
  LayoutGrid,
  Table
} from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';
import ScheduleTrackingModal from '@/app/partners/ScheduleTrackingModal';
import { CalendarBooking } from '@/app/partners/FloatingBookingCalendar';
import { 
  cx, 
  btn, 
  inputCls, 
  selectCls, 
  CountPill, 
  EmptyState, 
  CrmDistributionTrack, 
  StatusBadge, 
  SearchInput 
} from '@/components/admin/affiliate/ui';

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
  status?: string; // Booking status: 'Pending' | 'Approved' | 'Confirmed' | 'Cancelled'
  treatment_status?: string; // Treatment progress: 'Scheduled' | 'Therapist Assigned' | 'On the Way' | 'Arrived' | 'In Progress' | 'Finished' | 'No Show'
  payment_status?: string; // Payment status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Refunded' | 'Payment Failed'
  payment_method?: string; // 'Cash' | 'Online'
  source?: string; // 'Direct' or partner referral code
  affiliate_code?: string;
  items?: any[];
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

const safeFormatDate = (rawDate: string | undefined | null) => {
  if (!rawDate) return '';
  try {
    const cleanStr = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  } catch {
    // fallback
  }
  return String(rawDate);
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
  treatments = [], 
  therapistFees = [] 
}: { 
  treatments?: Treatment[], 
  therapistFees?: TherapistFee[] 
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

  const [viewMode, setViewMode] = useState<'agenda' | 'table'>('agenda');
  const [trackingBooking, setTrackingBooking] = useState<CalendarBooking | null>(null);

  const toCalendarBooking = (b: Booking): CalendarBooking => {
    const comm = b.commission;
    return {
      id: b.id,
      booking_id: b.reference_number || b.id.substring(0, 8).toUpperCase(),
      date: b.booking_date,
      time: b.time && b.time !== '-' ? b.time : undefined,
      created_at: b.created_at,
      guest_name: b.guest_name || 'Guest',
      location: b.location || 'Ubud',
      room_number: b.room_number,
      treatment_name: b.treatment_name,
      duration: b.items?.[0]?.duration,
      booking_status: b.status,
      treatment_status: b.treatment_status,
      payment_status: (b.payment_status || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid',
      payment_method: b.payment_method,
      payment_verified: (b.payment_status || '').toLowerCase() === 'paid',
      service_completed: (b.treatment_status || '').toLowerCase() === 'finished',
      gross_amount: b.revenue,
      treatment_amount: b.revenue,
      commission_rate_pct: comm?.commission_rate_pct || 10,
      commission_amount: comm?.commission_amount || 0,
      commission_status: comm?.status || 'pending',
    };
  };

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

        // 1. Independent Payment Status & Method
        let paymentStatus = b.payment_status || (c?.payment_verified ? 'Paid' : 'Unpaid');
        if (c?.payment_verified && paymentStatus === 'Unpaid') {
          paymentStatus = 'Paid';
        }
        let paymentMethod = b.payment_method || (c?.notes?.toLowerCase().includes('cash') ? 'Cash' : c?.notes?.toLowerCase().includes('online') ? 'Online' : 'Cash');

        // 2. Independent Treatment Status
        let treatmentStatus = b.treatment_status || (c?.service_completed ? 'Finished' : (b.status === 'Ongoing' ? 'In Progress' : 'Scheduled'));

        // 3. Independent Booking Status
        let bookingStatus = b.status || 'Pending';
        if (bookingStatus === 'Ongoing' || bookingStatus === 'Completed') {
          bookingStatus = 'Confirmed';
        }

        // 4. Attribution Source
        const affiliateCode = b.affiliate_code || c?.partner_code || null;
        const source = b.source || (affiliateCode ? affiliateCode : 'Direct');

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
          status: bookingStatus,
          treatment_status: treatmentStatus,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          source: source,
          affiliate_code: affiliateCode,
          therapist_fee_total: effectiveTherapistFee,
          therapists_count: effectiveTherapistsCount,
          net_profit: autoCalculatedProfit,
          commission: c,
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

  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'finished' | 'ongoing' | 'pending'>('all');

  const dailyBookings = useMemo(() => {
    return monthBookings.filter(b => b.booking_date === selectedDate);
  }, [monthBookings, selectedDate]);

  const bookingDistribution = useMemo(() => {
    const total = monthBookings.length || 1;
    const confirmed = monthBookings.filter(b => (b.status || '').toLowerCase() === 'confirmed').length;
    const inProgress = monthBookings.filter(b => (b.treatment_status || '').toLowerCase() === 'in progress').length;
    const finished = monthBookings.filter(b => (b.treatment_status || '').toLowerCase() === 'finished').length;
    const pending = monthBookings.filter(b => !b.status || (b.status || '').toLowerCase() === 'pending').length;

    return [
      { label: 'Confirmed', count: confirmed, percentage: Math.round((confirmed / total) * 100), color: 'dark' as const },
      { label: 'Finished', count: finished, percentage: Math.round((finished / total) * 100), color: 'yellow' as const },
      { label: 'In Ritual', count: inProgress, percentage: Math.round((inProgress / total) * 100), color: 'hatched' as const },
      { label: 'Pending', count: pending, percentage: Math.round((pending / total) * 100), color: 'light' as const },
    ];
  }, [monthBookings]);

  const filteredDailyBookings = useMemo(() => {
    return dailyBookings.filter(b => {
      if (statusFilter !== 'all') {
        const bStatus = (b.status || '').toLowerCase();
        const tStatus = (b.treatment_status || '').toLowerCase();
        if (statusFilter === 'confirmed' && bStatus !== 'confirmed') return false;
        if (statusFilter === 'pending' && bStatus !== 'pending' && b.status) return false;
        if (statusFilter === 'finished' && tStatus !== 'finished') return false;
        if (statusFilter === 'ongoing' && tStatus !== 'in progress' && tStatus !== 'ongoing') return false;
      }
      if (bookingSearch.trim()) {
        const q = bookingSearch.toLowerCase();
        return (
          (b.guest_name || '').toLowerCase().includes(q) ||
          (b.treatment_name || '').toLowerCase().includes(q) ||
          (b.reference_number || '').toLowerCase().includes(q) ||
          (b.id || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dailyBookings, statusFilter, bookingSearch]);

  const filteredMonthBookings = useMemo(() => {
    return monthBookings.filter(b => {
      if (statusFilter !== 'all') {
        const bStatus = (b.status || '').toLowerCase();
        const tStatus = (b.treatment_status || '').toLowerCase();
        if (statusFilter === 'confirmed' && bStatus !== 'confirmed') return false;
        if (statusFilter === 'pending' && bStatus !== 'pending' && b.status) return false;
        if (statusFilter === 'finished' && tStatus !== 'finished') return false;
        if (statusFilter === 'ongoing' && tStatus !== 'in progress' && tStatus !== 'ongoing') return false;
      }
      if (bookingSearch.trim()) {
        const q = bookingSearch.toLowerCase();
        return (
          (b.guest_name || '').toLowerCase().includes(q) ||
          (b.treatment_name || '').toLowerCase().includes(q) ||
          (b.reference_number || '').toLowerCase().includes(q) ||
          (b.id || '').toLowerCase().includes(q) ||
          (b.location || '').toLowerCase().includes(q) ||
          (b.affiliate_code || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [monthBookings, statusFilter, bookingSearch]);

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

  // 1. Independent Booking Status Update ('Pending' | 'Approved' | 'Confirmed' | 'Cancelled')
  const updateBookingStatus = async (id: string, newStatus: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, booking_status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        // Fallback to Supabase
        await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      }
    } catch (e) {
      console.error('Error updating booking status:', e);
      await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    }

    setMonthBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    fetchMonthBookings();
  };

  // 2. Independent Treatment Status Update ('Scheduled' | 'Therapist Assigned' | 'On the Way' | 'Arrived' | 'In Progress' | 'Finished' | 'No Show')
  const updateTreatmentStatus = async (id: string, newStatus: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, treatment_status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        const ref = booking?.reference_number || booking?.id;
        if (ref) {
          await supabase.from('affiliate_commissions').update({
            service_completed: newStatus === 'Finished',
            updated_at: new Date().toISOString(),
          }).ilike('booking_id', ref);
        }
      }
    } catch (e) {
      console.error('Error updating treatment status:', e);
    }

    setMonthBookings(prev => prev.map(b => b.id === id ? { ...b, treatment_status: newStatus } : b));
    fetchMonthBookings();
  };

  // 3. Independent Payment Status Update ('Unpaid' | 'Partially Paid' | 'Paid' | 'Refunded' | 'Payment Failed')
  const updatePaymentStatus = async (id: string, newStatus: string, method?: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    const chosenMethod = method || booking.payment_method || 'Cash';

    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          booking_id: id, 
          payment_status: newStatus, 
          payment_method: chosenMethod 
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const ref = booking?.reference_number || booking?.id;
        if (ref) {
          await supabase.from('affiliate_commissions').update({
            payment_verified: newStatus === 'Paid',
            notes: newStatus === 'Paid' ? `Paid via ${chosenMethod}` : newStatus,
            updated_at: new Date().toISOString(),
          }).ilike('booking_id', ref);
        }
      }
    } catch (e) {
      console.error('Error updating payment status:', e);
    }

    setMonthBookings(prev => prev.map(b => b.id === id ? { 
      ...b, 
      payment_status: newStatus, 
      payment_method: chosenMethod 
    } : b));
    fetchMonthBookings();
  };

  // Backward compatible status change helper
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    await updateBookingStatus(id, newStatus);
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
    <div className="space-y-5 pb-28 md:pb-6 font-sans antialiased w-full">
      {/* ─── Crextio CRM Section Header, View Switcher & Distribution ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-stone-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">Bookings</h1>
            <CountPill className="text-xs">{monthBookings.length} total</CountPill>
          </div>
          <p className="text-xs text-stone-500">
            Appointments, treatment execution, payment verification, and affiliate attribution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* CRM View Switcher */}
          <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-full border border-stone-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={cx(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'agenda'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-white/60'
              )}
            >
              <Calendar size={13} />
              <span>Day Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cx(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-neutral-900 hover:bg-white/60'
              )}
            >
              <Table size={13} />
              <span>Master CRM Table</span>
            </button>
          </div>

          <CrmDistributionTrack items={bookingDistribution} />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMonthBookings}
              disabled={isLoading}
              className={cx(btn.base, btn.secondary, btn.icon)}
              title="Refresh bookings"
              aria-label="Refresh bookings"
            >
              <RefreshCw size={14} className={cx(isLoading && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={downloadCSV}
              className={cx(btn.base, btn.secondary, btn.sm, 'gap-1.5')}
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(true); }}
              className={cx(btn.base, btn.amber, btn.sm, 'gap-1.5')}
            >
              <Plus size={13} /> Add booking
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4-Card Crextio CRM KPI Metric Ribbon ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Today's Appointments */}
        <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block truncate">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} Appointments
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1 tabular-nums">
            {dailyBookings.length} <span className="text-xs text-stone-500 font-normal">Bookings</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2 truncate">
            <span>{dailyBookings.reduce((sum, b) => sum + (b.pax || 1), 0)} Guests</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">{dailyBookings.filter(b => (b.status || '').toLowerCase() === 'confirmed').length} Confirmed</span>
          </div>
        </div>

        {/* Card 2: Daily Revenue & Profit */}
        <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block truncate">
            Daily Revenue & Profit
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1 tabular-nums truncate" title={formatCurrency(totalDailyRevenue)}>
            {formatCurrency(totalDailyRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5 tabular-nums truncate">
            <span>Profit: {formatCurrency(totalDailyProfit)}</span>
            {totalDailyRevenue > 0 && (
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                {Math.round((totalDailyProfit / totalDailyRevenue) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Monthly Financials */}
        <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block truncate">
            Monthly Revenue · {monthNames[month].toUpperCase()}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1 tabular-nums truncate" title={formatCurrency(totalMonthlyRevenue)}>
            {formatCurrency(totalMonthlyRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5 tabular-nums truncate">
            <span>Profit: {formatCurrency(totalMonthlyProfit)}</span>
            <span className="text-stone-400 font-normal">({monthBookings.length} total)</span>
          </div>
        </div>

        {/* Card 4: Partner Attribution & Commission */}
        <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block truncate">
            Commissions & Escrow
          </span>
          <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1 tabular-nums truncate" title={formatCurrency(totalMonthlyCommission)}>
            {formatCurrency(totalMonthlyCommission)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5 truncate">
            <span>{monthBookings.filter(b => b.commission).length} Attributed Bookings</span>
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filters Bar ─── */}
      <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All', count: monthBookings.length },
            { id: 'confirmed', label: 'Confirmed', count: monthBookings.filter(b => (b.status || '').toLowerCase() === 'confirmed').length },
            { id: 'ongoing', label: 'In Ritual', count: monthBookings.filter(b => (b.treatment_status || '').toLowerCase() === 'in progress').length, pulse: true },
            { id: 'finished', label: 'Finished', count: monthBookings.filter(b => (b.treatment_status || '').toLowerCase() === 'finished').length },
            { id: 'pending', label: 'Pending', count: monthBookings.filter(b => !b.status || (b.status || '').toLowerCase() === 'pending').length },
          ].map(f => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
                className={cx(
                  'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                  isActive
                    ? 'bg-amber-300 text-neutral-950 shadow-2xs font-bold'
                    : 'bg-stone-100 text-stone-600 hover:text-neutral-900 hover:bg-stone-200/70'
                )}
              >
                {f.pulse && f.count > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                )}
                <span>{f.label}</span>
                <span className={cx(
                  'font-mono text-[10px] px-1.5 py-0.2 rounded-full',
                  isActive ? 'bg-neutral-900 text-white' : 'bg-white text-stone-600'
                )}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-64 shrink-0">
          <SearchInput
            id="crm-booking-search"
            value={bookingSearch}
            onChange={setBookingSearch}
            placeholder="Search guest, ref, villa..."
          />
        </div>
      </div>

      {/* ─── Add / Edit Booking Form Modal / Drawer ─── */}
      {showForm && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 relative space-y-5 shadow-lg">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className={cx(btn.base, btn.secondary, btn.icon, 'absolute top-4 right-4')}
            aria-label="Close form"
          >
            <X size={16} />
          </button>
          <h4 className="font-bold text-base text-neutral-900">{isEditing ? 'Edit booking' : 'New booking'}</h4>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-4">
              {formItems.map((item, index) => (
                <div key={item.id} className="relative bg-stone-50/70 border border-stone-200 p-4 rounded-xl space-y-4">
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
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Select treatment {index + 1}</label>
                      <select required value={item.treatment} onChange={e => updateFormItem(index, 'treatment', e.target.value)} className={selectCls}>
                        <option value="">-- Choose Treatment --</option>
                        {treatments.map(t => (
                          <option key={t.id} value={t.title}>{t.title}</option>
                        ))}
                        <option value="Custom Treatment">Custom Treatment</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Duration</label>
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
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Number of pax</label>
                      <input type="number" min="1" required value={item.pax} onChange={e => updateFormItem(index, 'pax', parseInt(e.target.value) || 1)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Number of therapists</label>
                      <input type="number" min="1" required value={item.therapists} onChange={e => updateFormItem(index, 'therapists', parseInt(e.target.value) || 1)} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-stone-200">
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Revenue (IDR)</label>
                      <input type="number" required value={item.revenue} onChange={e => updateFormItem(index, 'revenue', parseInt(e.target.value) || 0)} className={cx(inputCls, 'tabular-nums')} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Therapist fee (IDR)</label>
                      <input type="number" required value={item.fee} onChange={e => updateFormItem(index, 'fee', parseInt(e.target.value) || 0)} className={cx(inputCls, 'tabular-nums text-stone-600')} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Net profit (IDR)</label>
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

            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              {formItems.length > 1 && (
                <div className="text-xs text-stone-600">
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

      {/* ─── CRM VIEW 1: DAY AGENDA (SPLIT CALENDAR + DAY STREAM) ─── */}
      {viewMode === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left Col: Calendar & Financial Summaries */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
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
                <h3 className="font-bold text-sm md:text-base text-neutral-900">
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
                  <div key={d} className="text-[11px] font-bold text-stone-400 uppercase py-1">
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
                          'h-9 w-full rounded-xl flex items-center justify-center text-xs transition-all relative font-medium cursor-pointer',
                          isSelected
                            ? 'bg-neutral-900 text-white font-bold shadow-xs'
                            : isToday
                            ? 'border-2 border-amber-400 text-neutral-900 font-bold bg-amber-50/40'
                            : 'hover:bg-stone-100 text-neutral-900'
                        )}
                      >
                        {day}
                        {paxCount > 0 && (
                          <span
                            className={cx(
                              'absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full',
                              isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                            )}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Financial Summary under Calendar */}
              <div className="mt-4 pt-3.5 border-t border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} Summary
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {dailyBookings.length} {dailyBookings.length === 1 ? 'booking' : 'bookings'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center bg-stone-50 rounded-xl p-2.5 border border-stone-200/80">
                  <div className="min-w-0">
                    <div className="text-[10px] text-stone-500 font-bold uppercase truncate">Revenue</div>
                    <div className="text-xs font-bold text-neutral-900 mt-0.5 tabular-nums truncate" title={formatCurrency(totalDailyRevenue)}>{formatCurrency(totalDailyRevenue)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-stone-500 font-bold uppercase truncate">Profit</div>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5 tabular-nums truncate" title={formatCurrency(totalDailyProfit)}>{formatCurrency(totalDailyProfit)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-stone-500 font-bold uppercase truncate">Commission</div>
                    <div className="text-xs font-bold text-indigo-600 mt-0.5 tabular-nums truncate" title={formatCurrency(totalDailyCommission)}>{formatCurrency(totalDailyCommission)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Bookings for Selected Date */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* Date Header Strip */}
            <div className="bg-white/90 border border-stone-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                {/* Quick Date Jumper: Prev, Today, Next */}
                <div className="inline-flex items-center gap-1 bg-stone-100 p-0.5 rounded-full border border-stone-200">
                  <button 
                    type="button" 
                    onClick={handlePrevDay} 
                    className="w-7 h-7 rounded-full bg-white text-stone-700 hover:text-neutral-900 flex items-center justify-center shadow-2xs cursor-pointer active:scale-95"
                    title="Previous Day"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleToday} 
                    className={cx(
                      'px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all',
                      selectedDate === toLocalDateString(new Date()) 
                        ? 'bg-neutral-900 text-white shadow-xs' 
                        : 'text-stone-600 hover:text-neutral-900 hover:bg-white/80'
                    )}
                    title="Jump to Today"
                  >
                    Today
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextDay} 
                    className="w-7 h-7 rounded-full bg-white text-stone-700 hover:text-neutral-900 flex items-center justify-center shadow-2xs cursor-pointer active:scale-95"
                    title="Next Day"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 ml-1">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </h3>
                <CountPill>{filteredDailyBookings.length}</CountPill>
              </div>

              <div className="text-xs text-stone-500 font-mono">
                {filteredDailyBookings.reduce((sum, b) => sum + (b.pax || 1), 0)} Guests Total
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredDailyBookings.length === 0 ? (
              <div className="bg-white border border-stone-200/90 rounded-2xl shadow-2xs">
                <EmptyState 
                  title="No bookings scheduled for this date" 
                  description={`No appointments logged for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}.`}
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
                {filteredDailyBookings.map(booking => {
                  let title = booking.treatment_name;
                  const match = title.match(/(.*) \((.*)\)$/);
                  if (match) {
                    title = match[1];
                  }

                  const bookingStatus = booking.status || 'Pending';
                  const isCancelled = bookingStatus.toLowerCase() === 'cancelled';
                  const paymentStatus = booking.payment_status || (booking.commission?.payment_verified ? 'Paid' : 'Unpaid');
                  const isPaid = paymentStatus.toLowerCase() === 'paid';
                  const treatmentStatus = booking.treatment_status || (booking.commission?.service_completed ? 'Finished' : 'Scheduled');
                  const isSelected = selectedBookingId === booking.id;

                  return (
                    <div 
                      key={booking.id} 
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={cx(
                        'rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer',
                        isSelected
                          ? 'bg-amber-300 text-neutral-950 font-medium border border-amber-400 shadow-sm'
                          : isCancelled
                          ? 'bg-rose-50/40 border border-rose-200'
                          : 'bg-white/95 border border-stone-200/90 hover:border-amber-300 hover:bg-stone-50/50 shadow-2xs'
                      )}
                    >
                      {/* Left: Booking ID + Guest + Badges + Treatment */}
                      <div className="min-w-0 space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Booking ID Pill */}
                          <span
                            className={cx(
                              'font-mono text-xs font-bold px-2 py-0.5 rounded-full border transition-colors inline-flex items-center gap-1',
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-stone-100 text-neutral-900 border-stone-200'
                            )}
                          >
                            <span>#{booking.reference_number || booking.id.substring(0, 8)}</span>
                          </span>

                          {/* Customer Name */}
                          <span className={cx(
                            'font-bold text-sm truncate',
                            isSelected ? 'text-neutral-950' : 'text-neutral-900'
                          )}>
                            {booking.guest_name || 'Guest'}
                          </span>

                          {/* 1. Booking Status Badge */}
                          <span className={cx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                            isSelected
                              ? 'bg-white/90 text-neutral-900 border-neutral-900/20'
                              : bookingStatus.toLowerCase() === 'cancelled'
                              ? 'text-rose-700 bg-rose-50 border-rose-200'
                              : bookingStatus.toLowerCase() === 'pending'
                              ? 'text-amber-800 bg-amber-50 border-amber-200'
                              : bookingStatus.toLowerCase() === 'approved'
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                              : 'text-sky-800 bg-sky-50 border-sky-200'
                          )}>
                            {bookingStatus}
                          </span>

                          {/* 2. Treatment Progress Badge */}
                          <span className={cx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1',
                            isSelected
                              ? 'bg-white/90 text-neutral-900 border-neutral-900/20'
                              : treatmentStatus.toLowerCase() === 'finished'
                              ? 'text-teal-800 bg-teal-50 border-teal-200'
                              : treatmentStatus.toLowerCase() === 'in progress'
                              ? 'text-indigo-800 bg-indigo-50 border-indigo-200'
                              : 'text-stone-600 bg-stone-100 border-stone-200'
                          )}>
                            {treatmentStatus.toLowerCase() === 'in progress' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                            {treatmentStatus}
                          </span>

                          {/* 3. Payment Status Badge */}
                          <span className={cx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                            isSelected
                              ? 'bg-white/90 text-neutral-900 border-neutral-900/20'
                              : isPaid
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                              : 'text-amber-800 bg-amber-50 border-amber-200'
                          )}>
                            {paymentStatus}
                          </span>

                          {/* 4. Attribution Badge */}
                          {booking.commission ? (
                            <div className="inline-flex items-center gap-1">
                              <span className={cx(
                                'text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border',
                                isSelected ? 'bg-white/90 text-neutral-900 border-neutral-900/20' : 'bg-white text-neutral-900 border-stone-200'
                              )}>
                                #{booking.commission.partner_code}
                              </span>
                              <span className={cx(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums',
                                isSelected ? 'bg-neutral-900 text-white' : 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                              )}>
                                +{formatCurrency(booking.commission.commission_amount || 0)}
                              </span>
                            </div>
                          ) : (
                            <span className={cx(
                              'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                              isSelected ? 'bg-white/90 text-neutral-900 border-neutral-900/20' : 'text-stone-600 bg-stone-100 border-stone-200'
                            )}>
                              Direct
                            </span>
                          )}
                        </div>

                        {/* Treatment Name & Location */}
                        <div className="flex items-center gap-2 text-xs truncate">
                          <span className={cx(
                            'font-semibold truncate',
                            isSelected ? 'text-neutral-900' : 'text-neutral-800'
                          )}>
                            {title}
                          </span>
                          <span className={isSelected ? 'text-neutral-700' : 'text-stone-400'}>·</span>
                          <span className={cx(
                            'font-mono text-[11px] truncate',
                            isSelected ? 'text-neutral-800' : 'text-stone-500'
                          )}>
                            {booking.location || 'Ubud'}{booking.room_number ? `, Room ${booking.room_number}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions CTA (Track + Details) */}
                      <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
                        {/* Eye-catching Track Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackingBooking(toCalendarBooking(booking));
                          }}
                          className={cx(
                            btn.base,
                            isSelected 
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400',
                            btn.xs,
                            'gap-1 rounded-full font-bold transition-all'
                          )}
                          title="Track appointment schedule and status history"
                        >
                          <Compass size={12} className={isSelected ? 'text-amber-300' : 'text-emerald-600'} />
                          <span>Track</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBookingId(booking.id);
                          }}
                          className={cx(
                            btn.base,
                            isSelected ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' : btn.secondary,
                            btn.xs,
                            'gap-1 rounded-full'
                          )}
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
      )}

      {/* ─── CRM VIEW 2: MASTER CRM TABLE (EXPANSIVE DATA GRID) ─── */}
      {viewMode === 'table' && (
        <div className="bg-white/95 border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-stone-50 border-b border-stone-200/80 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3 px-4 font-bold">Booking Ref</th>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Guest</th>
                  <th className="py-3 px-4 font-bold">Treatment</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Progress</th>
                  <th className="py-3 px-4 font-bold">Payment</th>
                  <th className="py-3 px-4 font-bold text-right">Revenue</th>
                  <th className="py-3 px-4 font-bold text-right">Profit</th>
                  <th className="py-3 px-4 font-bold">Attribution</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-stone-400">
                      <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading bookings...
                    </td>
                  </tr>
                ) : filteredMonthBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-stone-400">
                      No bookings matching current filter for this month.
                    </td>
                  </tr>
                ) : (
                  filteredMonthBookings.map((b) => {
                    const isSelected = selectedBookingId === b.id;
                    const bookingStatus = b.status || 'Pending';
                    const treatmentStatus = b.treatment_status || 'Scheduled';
                    const paymentStatus = b.payment_status || 'Unpaid';

                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBookingId(b.id)}
                        className={cx(
                          'transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-amber-100/80 font-medium'
                            : 'hover:bg-stone-50/80'
                        )}
                      >
                        {/* Ref # */}
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          #{b.reference_number || b.id.substring(0, 8)}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                          <div>{safeFormatDate(b.booking_date)}</div>
                          <div className="text-stone-400 text-[10px]">{b.time || '-'}</div>
                        </td>

                        {/* Guest */}
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-neutral-900">
                          {b.guest_name || 'Guest'}
                          {b.pax > 1 && <span className="ml-1 text-[10px] text-stone-400 font-normal">({b.pax}p)</span>}
                        </td>

                        {/* Treatment */}
                        <td className="py-3 px-4 max-w-[200px] truncate text-neutral-800">
                          <span className="font-medium truncate block">{b.treatment_name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">{b.location || 'Ubud'}</span>
                        </td>

                        {/* Booking Status Dropdown */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={bookingStatus}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                            className={cx(
                              'text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border cursor-pointer focus:outline-none',
                              bookingStatus.toLowerCase() === 'confirmed'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : bookingStatus.toLowerCase() === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            )}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Approved">Approved</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Progress Dropdown */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={treatmentStatus}
                            onChange={(e) => updateTreatmentStatus(b.id, e.target.value)}
                            className={cx(
                              'text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border cursor-pointer focus:outline-none',
                              treatmentStatus.toLowerCase() === 'finished'
                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                : treatmentStatus.toLowerCase() === 'in progress'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            )}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Finished">Finished</option>
                          </select>
                        </td>

                        {/* Payment Dropdown */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={paymentStatus}
                            onChange={(e) => updatePaymentStatus(b.id, e.target.value)}
                            className={cx(
                              'text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border cursor-pointer focus:outline-none',
                              paymentStatus.toLowerCase() === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            )}
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </td>

                        {/* Revenue */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-neutral-900 tabular-nums">
                          {formatCurrency(b.revenue)}
                        </td>

                        {/* Profit */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-emerald-600 tabular-nums">
                          {formatCurrency(b.net_profit)}
                        </td>

                        {/* Attribution */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {b.commission ? (
                            <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                              #{b.commission.partner_code}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-stone-400">
                              Direct
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTrackingBooking(toCalendarBooking(b))}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Track schedule"
                            >
                              <Compass size={11} className="text-emerald-600" />
                              <span>Track</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedBookingId(b.id)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                              title="View details"
                            >
                              Details
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
      )}

      {/* ─── Schedule Tracking History Modal ─── */}
      <ScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

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
              {/* Customer & Operational Status Controls */}
              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-black">
                      <User size={15} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-black">
                        {selectedBooking.guest_name || 'Guest'}
                      </h4>
                      <p className="text-xs text-[#737373]">
                        {selectedBooking.guest_whatsapp || selectedBooking.guest_email || 'Customer Details'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Status Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border text-black bg-[#FAFAFA] border-[#E5E5E5]">
                      {selectedBooking.status || 'Pending'}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border text-indigo-700 bg-indigo-50 border-indigo-200">
                      {selectedBooking.treatment_status || 'Scheduled'}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
                      {selectedBooking.payment_status || 'Unpaid'}
                    </span>
                  </div>
                </div>

                {/* Independent Status Control Panel */}
                <div className="pt-3 border-t border-[#E5E5E5] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Booking Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
                      Booking Status
                    </label>
                    <select
                      value={selectedBooking.status || 'Pending'}
                      onChange={(e) => updateBookingStatus(selectedBooking.id, e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs font-medium text-black focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* 2. Treatment Progress */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
                      Treatment Progress
                    </label>
                    <select
                      value={selectedBooking.treatment_status || 'Scheduled'}
                      onChange={(e) => updateTreatmentStatus(selectedBooking.id, e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs font-medium text-black focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Therapist Assigned">Therapist Assigned</option>
                      <option value="On the Way">On the Way</option>
                      <option value="Arrived">Arrived</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Finished">Finished</option>
                      <option value="No Show">No Show</option>
                    </select>
                  </div>

                  {/* 3. Payment Status & Method */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] block">
                      Payment Status & Method
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={selectedBooking.payment_status || 'Unpaid'}
                        onChange={(e) => updatePaymentStatus(selectedBooking.id, e.target.value, selectedBooking.payment_method)}
                        className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2 py-1.5 text-xs font-medium text-black focus:outline-none focus:border-black cursor-pointer"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Payment Failed">Payment Failed</option>
                      </select>
                      <select
                        value={selectedBooking.payment_method || 'Cash'}
                        onChange={(e) => updatePaymentStatus(selectedBooking.id, selectedBooking.payment_status || 'Unpaid', e.target.value)}
                        className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2 py-1.5 text-xs font-medium text-black focus:outline-none focus:border-black cursor-pointer"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
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

              {/* Partner Attribution Box (Affiliate Program or Direct Source) */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedBooking.commission ? (
                      <>
                        <span className="text-xs font-semibold text-black bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                          Partner: #{selectedBooking.commission.partner_code}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 font-mono">
                          Commission ({selectedBooking.commission.commission_rate_pct || 15}%): +{formatCurrency(selectedBooking.commission.commission_amount || 0)}
                        </span>
                        {selectedBooking.commission.status === 'approved' ? (
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckSquare size={11} className="text-emerald-700" /> Approved
                          </span>
                        ) : selectedBooking.commission.status === 'paid' ? (
                          <span className="text-[11px] font-semibold text-white bg-black px-2 py-0.5 rounded flex items-center gap-1">
                            ✓ Paid Out
                          </span>
                        ) : selectedBooking.commission.status === 'cancelled' ? (
                          <span className="text-[11px] font-medium text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded">
                            Cancelled
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock size={11} className="text-amber-700" /> Pending Review
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-medium text-[#737373] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                        Attribution Source: Direct Booking (Website)
                      </span>
                    )}
                  </div>

                  {selectedBooking.commission && (
                    <div className="text-[11px] font-mono text-[#737373]">
                      Eligibility: {selectedBooking.commission.payment_verified && selectedBooking.commission.service_completed ? 'Eligible for Approval' : 'Awaiting Payment & Finish'}
                    </div>
                  )}
                </div>
              </div>
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
