'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  RefreshCw, 
  Copy, 
  Check, 
  User, 
  MapPin, 
  ExternalLink, 
  Compass, 
  Layers, 
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Treatment, TherapistFee } from '@/context/SpaContext';
import AdminScheduleTrackingModal from '@/components/admin/AdminScheduleTrackingModal';
import { cx, btn, inputCls, selectCls, CountPill } from '@/components/admin/affiliate/ui';

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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Matching partner portal reference: Mon, Tues, Wed, Thurs, Fri, Sat, Sun
const WEEKDAY_NAMES = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

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
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return String(rawDate);
};

const formatCurrency = (val: number | undefined | null) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

// Robust Couple Package Identifier: already priced for 2 persons
export const isCouplePackage = (title?: string) => {
  const t = (title || '').toLowerCase();
  return /couple|honeymoon|duo|2\s*person|for\s*2/i.test(t);
};

// Secret admin password to delete bookings
const SECRET_ADMIN_PASSWORD = '022320';

// Calculate therapist fee based on therapist_fees database table
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
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(toLocalDateString(new Date()));
  const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
  const [allTherapistFees, setAllTherapistFees] = useState<TherapistFee[]>(therapistFees || []);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'ongoing' | 'finished' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);

  // Form State for Add / Edit Booking
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  type FormItem = { id: string; treatment: string; duration: string; pax: number; therapists: number; revenue: number; fee: number; };
  const createDefaultItem = (): FormItem => ({ id: Math.random().toString(36).substring(2, 9), treatment: '', duration: '', pax: 1, therapists: 1, revenue: 0, fee: 0 });
  const [formItems, setFormItems] = useState<FormItem[]>([createDefaultItem()]);

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

  // Fetch bookings for the ENTIRE month + Realtime sync with affiliate commissions
  useEffect(() => {
    fetchMonthBookings();

    const channel = supabase
      .channel('admin_therapick_bookings_realtime')
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
  }, [currentYear, currentMonth]);

  const fetchMonthBookings = async () => {
    setIsLoading(true);
    try {
      const startOfMonth = toLocalDateString(new Date(currentYear, currentMonth, 1));
      const endOfMonth = toLocalDateString(new Date(currentYear, currentMonth + 1, 0));

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

        // 1. Payment Status & Method
        let paymentStatus = b.payment_status || (c?.payment_verified ? 'Paid' : 'Unpaid');
        if (c?.payment_verified && paymentStatus === 'Unpaid') {
          paymentStatus = 'Paid';
        }
        let paymentMethod = b.payment_method || (c?.notes?.toLowerCase().includes('online') ? 'Online' : 'Cash');

        // 2. Treatment Status
        let treatmentStatus = b.treatment_status || (c?.service_completed ? 'Finished' : (b.status === 'Ongoing' ? 'In Progress' : 'Scheduled'));

        // 3. Booking Status
        let bookingStatus = b.status || 'Pending';
        if (bookingStatus === 'Ongoing' || bookingStatus === 'Completed') {
          bookingStatus = 'Confirmed';
        }

        // 4. Attribution Source
        const affiliateCode = b.affiliate_code || c?.partner_code || null;
        const source = b.source || (affiliateCode ? affiliateCode : 'Direct');

        // Calculate therapist fee
        const { totalFee, therapistsCount } = calculateBookingTherapistFee(b, treatments, currentFees);
        const effectiveTherapistFee = Number(b.therapist_fee_total || 0) > 0 ? Number(b.therapist_fee_total) : totalFee;
        const effectiveTherapistsCount = Number(b.therapists_count || 0) > 0 ? Number(b.therapists_count) : therapistsCount;

        // Smart profit detection
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

      // Filter: STRICT DATA ISOLATION - Exclusively Therapick
      const therapickFiltered = merged.filter(b => b.brand === 'therapick');
      setMonthBookings(therapickFiltered);

      // If current tracking booking was open, update its reference in real time
      if (trackingBooking) {
        const updated = therapickFiltered.find(x => x.id === trackingBooking.id);
        if (updated) setTrackingBooking(updated);
      }
    } catch (e) {
      console.error('Error fetching Therapick month bookings:', e);
    }
    setIsLoading(false);
  };

  const handleCopy = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(toLocalDateString(today));
  };

  // 1. Independent Booking Status Update ('Pending' | 'Approved' | 'Confirmed' | 'Cancelled')
  const updateBookingStatus = async (id: string, newStatus: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, booking_status: newStatus }),
      });
    } catch (e) {
      console.error('API update failed, updating via Supabase directly:', e);
    }

    // Direct Supabase update fallback for resilience
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);

    setMonthBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    if (trackingBooking && trackingBooking.id === id) {
      setTrackingBooking(prev => prev ? { ...prev, status: newStatus } : null);
    }
    fetchMonthBookings();
  };

  // 2. Independent Treatment Status Update ('Scheduled' | 'In Progress' | 'Finished' | 'No Show')
  const updateTreatmentStatus = async (id: string, newStatus: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, treatment_status: newStatus }),
      });
    } catch (e) {
      console.error('API treatment update failed:', e);
    }

    // Direct Supabase updates
    await supabase.from('bookings').update({ treatment_status: newStatus }).eq('id', id);
    const ref = booking.reference_number || booking.id;
    if (ref) {
      await supabase.from('affiliate_commissions').update({
        service_completed: newStatus === 'Finished',
        updated_at: new Date().toISOString(),
      }).ilike('booking_id', ref);
    }

    setMonthBookings(prev => prev.map(b => b.id === id ? { ...b, treatment_status: newStatus } : b));
    if (trackingBooking && trackingBooking.id === id) {
      setTrackingBooking(prev => prev ? { ...prev, treatment_status: newStatus } : null);
    }
    fetchMonthBookings();
  };

  // 3. Independent Payment Status Update ('Unpaid' | 'Paid') + Method ('Cash' | 'Online')
  const updatePaymentStatus = async (id: string, newStatus: string, method?: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    const chosenMethod = method || booking.payment_method || 'Cash';

    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          booking_id: id, 
          payment_status: newStatus, 
          payment_method: chosenMethod 
        }),
      });
    } catch (e) {
      console.error('API payment update failed:', e);
    }

    // Direct Supabase updates
    await supabase.from('bookings').update({ 
      payment_status: newStatus, 
      payment_method: chosenMethod 
    }).eq('id', id);

    const ref = booking.reference_number || booking.id;
    if (ref) {
      await supabase.from('affiliate_commissions').update({
        payment_verified: newStatus === 'Paid',
        notes: newStatus === 'Paid' ? `Paid via ${chosenMethod}` : newStatus,
        updated_at: new Date().toISOString(),
      }).ilike('booking_id', ref);
    }

    setMonthBookings(prev => prev.map(b => b.id === id ? { 
      ...b, 
      payment_status: newStatus, 
      payment_method: chosenMethod 
    } : b));
    if (trackingBooking && trackingBooking.id === id) {
      setTrackingBooking(prev => prev ? { ...prev, payment_status: newStatus, payment_method: chosenMethod } : null);
    }
    fetchMonthBookings();
  };

  // Calendar Day Grid Computation (Week starts on Monday matching partner portal)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const bookingsByDate: Record<string, Booking[]> = {};
    for (const b of monthBookings) {
      if (!b.booking_date) continue;
      const dStr = b.booking_date.trim();
      if (!bookingsByDate[dStr]) {
        bookingsByDate[dStr] = [];
      }
      bookingsByDate[dStr].push(b);
    }

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      bookings: Booking[];
      statusStyle: 'paid' | 'confirmed' | 'ongoing' | 'cancelled' | null;
    }> = [];

    const now = new Date();
    const todayStr = toLocalDateString(now);

    // Previous month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        bookings: bookingsByDate[dStr] || [],
        statusStyle: null,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayBookings = bookingsByDate[dStr] || [];

      let statusStyle: 'paid' | 'confirmed' | 'ongoing' | 'cancelled' | null = null;
      if (dayBookings.length > 0) {
        if (dayBookings.some((b) => (b.payment_status || '').toLowerCase() === 'paid')) {
          statusStyle = 'paid';
        } else if (dayBookings.some((b) => (b.treatment_status || '').toLowerCase() === 'finished' || (b.status || '').toLowerCase() === 'confirmed')) {
          statusStyle = 'confirmed';
        } else if (dayBookings.some((b) => (b.treatment_status || '').toLowerCase() === 'in progress' || (b.status || '').toLowerCase() === 'pending')) {
          statusStyle = 'ongoing';
        } else if (dayBookings.every((b) => (b.status || '').toLowerCase() === 'cancelled')) {
          statusStyle = 'cancelled';
        }
      }

      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        bookings: dayBookings,
        statusStyle,
      });
    }

    // Next month padding to fill a 35 or 42 grid
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        bookings: bookingsByDate[dStr] || [],
        statusStyle: null,
      });
    }

    return cells;
  }, [currentYear, currentMonth, monthBookings]);

  // Aggregate monthly stats
  const monthlyMetrics = useMemo(() => {
    const total = monthBookings.length;
    let confirmedCount = 0;
    let inRitualCount = 0;
    let finishedCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCommission = 0;

    for (const b of monthBookings) {
      const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
      if (!isCancelled) {
        totalRevenue += (b.revenue || 0);
        totalProfit += (b.net_profit || 0);
        if (b.commission && (b.commission.status === 'approved' || b.commission.status === 'paid')) {
          totalCommission += Number(b.commission.commission_amount || 0);
        }
      }

      const bStat = (b.status || '').toLowerCase();
      const tStat = (b.treatment_status || '').toLowerCase();

      if (bStat === 'confirmed' || bStat === 'approved') confirmedCount++;
      if (tStat === 'in progress') inRitualCount++;
      if (tStat === 'finished') finishedCount++;
      if (!b.status || bStat === 'pending') pendingCount++;
    }

    return {
      total,
      confirmedCount,
      inRitualCount,
      finishedCount,
      pendingCount,
      totalRevenue,
      totalProfit,
      totalCommission,
    };
  }, [monthBookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return monthBookings.filter((b) => {
      // 1. Calendar date filter
      if (selectedDate) {
        if (!b.booking_date || b.booking_date.trim() !== selectedDate) {
          return false;
        }
      }

      // 2. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (b.guest_name || '').toLowerCase().includes(q);
        const matchesRef = (b.reference_number || '').toLowerCase().includes(q);
        const matchesId = (b.id || '').toLowerCase().includes(q);
        const matchesTreatment = (b.treatment_name || '').toLowerCase().includes(q);
        const matchesLocation = (b.location || '').toLowerCase().includes(q);
        if (!matchesName && !matchesRef && !matchesId && !matchesTreatment && !matchesLocation) {
          return false;
        }
      }

      // 3. Status filter
      if (statusFilter === 'all') return true;
      const bStatus = (b.status || '').toLowerCase();
      const tStatus = (b.treatment_status || '').toLowerCase();

      if (statusFilter === 'confirmed') return bStatus === 'confirmed' || bStatus === 'approved';
      if (statusFilter === 'ongoing') return tStatus === 'in progress';
      if (statusFilter === 'finished') return tStatus === 'finished';
      if (statusFilter === 'pending') return !b.status || bStatus === 'pending';

      return true;
    });
  }, [monthBookings, selectedDate, search, statusFilter]);

  // Form Management Handlers
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

    const targetDate = selectedDate || toLocalDateString(new Date());

    const payloads = formItems.map(item => ({
      booking_date: targetDate,
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
      if (error) alert("Error updating: " + error.message);
    } else {
      const { error } = await supabase.from('bookings').insert(payloads);
      if (error) alert("Error saving: " + error.message);
    }

    setShowForm(false);
    setIsEditing(null);
    setFormItems([createDefaultItem()]);
    fetchMonthBookings();
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
      "Gross Revenue (IDR)", 
      "Therapist Fee (IDR)", 
      "Net Profit (IDR)"
    ];
    
    const csvRows = [
      `"FINANCIAL REPORT - THERAPICK BALI"`,
      `"Period: ${MONTH_NAMES[currentMonth]} ${currentYear}"`,
      `""`,
      headers.join(',')
    ];

    monthBookings.forEach(b => {
      const row = [
        `"${b.reference_number || b.id}"`,
        `"${b.booking_date}"`,
        `"${(b.guest_name || 'Guest').replace(/"/g, '""')}"`,
        `"${(b.treatment_name || '').replace(/"/g, '""')}"`,
        `"${b.status || 'Pending'}"`,
        b.pax,
        b.revenue || 0,
        b.therapist_fee_total || 0,
        b.net_profit || 0
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Therapick_Bookings_${MONTH_NAMES[currentMonth]}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full font-sans antialiased pb-16">
      
      {/* ─── Top Header Toolbar (Clean, No Clutter, Removed View Switchers & Distribution Bar) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaecf0]">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748b] font-semibold block mb-0.5">
            Therapick CRM · Operations
          </span>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0f172a] tracking-tight">
              Bookings
            </h1>
            <CountPill className="text-xs">{monthBookings.length} total</CountPill>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Appointments, treatment execution, payment verification, and affiliate attribution
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-[#e2e8f0] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-medium text-[#64748b] transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Show all bookings"
            >
              <X size={13} />
              <span>Clear Date</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchMonthBookings}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Refresh bookings"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={downloadCSV}
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Export CSV Report"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormItems([createDefaultItem()]);
              setIsEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={14} />
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* ─── Add / Edit Booking Form Modal (Clean Overlay) ─── */}
      {showForm && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 relative space-y-5 shadow-lg animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="h-8 w-8 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors absolute top-4 right-4 cursor-pointer"
            aria-label="Close form"
          >
            <X size={16} />
          </button>
          <h4 className="font-bold text-base text-neutral-900">
            {isEditing ? 'Edit Booking' : 'New Appointment'} · {selectedDate ? safeFormatDate(selectedDate) : 'Today'}
          </h4>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-4">
              {formItems.map((item, index) => (
                <div key={item.id} className="relative bg-stone-50/70 border border-stone-200 p-4 rounded-xl space-y-4">
                  {formItems.length > 1 && !isEditing && (
                    <button
                      type="button"
                      onClick={() => removeFormItem(index)}
                      className="h-7 w-7 rounded-lg bg-white border border-stone-200 text-red-600 hover:bg-red-50 absolute -top-2 -right-2 flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Remove item"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Select Treatment {index + 1}</label>
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
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Number of Pax</label>
                      <input type="number" min="1" required value={item.pax} onChange={e => updateFormItem(index, 'pax', parseInt(e.target.value) || 1)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Number of Therapists</label>
                      <input type="number" min="1" required value={item.therapists} onChange={e => updateFormItem(index, 'therapists', parseInt(e.target.value) || 1)} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-stone-200">
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Revenue (IDR)</label>
                      <input type="number" required value={item.revenue} onChange={e => updateFormItem(index, 'revenue', parseInt(e.target.value) || 0)} className={cx(inputCls, 'tabular-nums')} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Therapist Fee (IDR)</label>
                      <input type="number" required value={item.fee} onChange={e => updateFormItem(index, 'fee', parseInt(e.target.value) || 0)} className={cx(inputCls, 'tabular-nums text-stone-600')} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-600 block mb-1.5 font-medium">Net Profit (IDR)</label>
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
                <Plus size={14} /> Add Another Treatment
              </button>
            )}

            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1" />
              <div className="flex gap-2 w-full sm:w-auto">
                <button type="button" onClick={() => setShowForm(false)} className={cx(btn.base, btn.secondary, btn.sm, 'flex-1 sm:flex-none')}>
                  Cancel
                </button>
                <button type="submit" className={cx(btn.base, btn.primary, btn.sm, 'flex-1 sm:flex-none')}>
                  <Save size={14} /> Save Booking
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ─── Main Content Split: Left Corner Calendar + Right Booking Cards ─── */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-6">

        {/* ─── Mobile App Calendar Header Bar (< lg) ─── */}
        <div className="lg:hidden w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#eaecf0] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#f8fafc] border border-[#eaecf0] flex items-center justify-center text-[#0f172a] shrink-0">
              <CalendarIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-[#0f172a] truncate">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>
              <div className="text-[11px] text-[#64748b] font-mono truncate">
                {monthBookings.length} bookings · {formatCurrency(monthlyMetrics.totalRevenue)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMobileCalendar(!showMobileCalendar)}
            className="px-3.5 py-1.5 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#e2e8f0] text-xs font-medium text-[#0f172a] shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            {showMobileCalendar ? 'Hide' : 'Calendar ▾'}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            LEFT CORNER: Modern Compact Calendar Widget (Exact Partner Portal Style)
           ═══════════════════════════════════════════════════════════════ */}
        <aside className={`w-full lg:w-[285px] xl:w-[300px] shrink-0 space-y-3.5 lg:sticky lg:top-4 self-start ${showMobileCalendar ? 'block' : 'hidden lg:block'}`}>
          
          {/* Calendar Card Box */}
          <div className="bg-white border border-[#eaecf0] rounded-2xl p-4.5 sm:p-5 shadow-xs">
            
            {/* Header: Prev chevron | Calendar Icon + Month Year | Next chevron */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-xl border border-[#eaecf0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1] flex items-center justify-center text-[#334155] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Previous month"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>

              <div className="flex items-center gap-2">
                <CalendarIcon size={17} className="text-[#0f172a]" strokeWidth={2} />
                <span className="font-bold text-base sm:text-[17px] text-[#0f172a] tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-xl border border-[#eaecf0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1] flex items-center justify-center text-[#334155] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Next month"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Weekdays Row: Mon, Tues, Wed, Thurs, Fri, Sat, Sun */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 border-b border-[#f1f5f9] mb-3">
              {WEEKDAY_NAMES.map((name) => (
                <span
                  key={name}
                  className="text-[11px] font-semibold text-[#94a3b8] select-none tracking-tight"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Calendar Day Grid (7 columns with Circular Date Pills) */}
            <div className="grid grid-cols-7 gap-y-2.5 gap-x-1 place-items-center">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDate === cell.dateStr;

                // Non-current month styling
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-xs text-[#cbd5e1] font-normal select-none"
                    >
                      {cell.dayNumber}
                    </div>
                  );
                }

                // Selected Date Style (Vibrant Blue with ring)
                if (isSelected) {
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      title={`${safeFormatDate(cell.dateStr)} (Selected - Click to clear)`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#2563eb] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center ring-4 ring-[#2563eb]/25 shadow-xs scale-105 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                // Status Circular Pills matching Partner Portal
                if (cell.statusStyle === 'paid') {
                  // Soft Blue (Paid Out / Disbursed)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Paid booking(s) on ${safeFormatDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#e0ecff] text-[#1d4ed8] font-bold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#2563eb]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                if (cell.statusStyle === 'confirmed') {
                  // Soft Green (Confirmed / Finished)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Confirmed booking(s) on ${safeFormatDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#dcfce7] text-[#15803d] font-bold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#16a34a]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                if (cell.statusStyle === 'ongoing') {
                  // Soft Orange/Amber (In Ritual / Pending)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Active booking(s) on ${safeFormatDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#fef3c7] text-[#b45309] font-bold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#d97706]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                if (cell.statusStyle === 'cancelled') {
                  // Soft Rose/Red (Cancelled)
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      title={`${cell.bookings.length} Cancelled booking(s) on ${safeFormatDate(cell.dateStr)}`}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#fee2e2] text-[#b91c1c] font-bold text-xs sm:text-[13px] flex items-center justify-center hover:ring-2 hover:ring-[#ef4444]/30 transition-all cursor-pointer"
                    >
                      {cell.dayNumber}
                    </button>
                  );
                }

                // Regular Day Number without bookings
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full text-xs sm:text-[13px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                      cell.isToday
                        ? 'border-2 border-[#0f172a] font-bold text-[#0f172a]'
                        : 'text-[#334155] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend: 4 Colored Statuses */}
            <div className="pt-3.5 mt-3.5 border-t border-[#f1f5f9] grid grid-cols-2 gap-2 text-[11px] text-[#64748b]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                <span className="font-medium text-[#334155]">Paid Out</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0" />
                <span className="font-medium text-[#334155]">Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] shrink-0" />
                <span className="font-medium text-[#334155]">In Ritual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0" />
                <span className="font-medium text-[#334155]">Cancelled</span>
              </div>
            </div>

            {/* Jump to Today Button */}
            <div className="mt-3.5 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#94a3b8] font-mono">
                Click date to filter
              </span>
              <button
                type="button"
                onClick={handleJumpToday}
                className="text-[11px] font-bold text-[#0f172a] hover:underline cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          {/* CRM Monthly Performance Summary */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-950 font-bold">
                {MONTH_NAMES[currentMonth]} Overview
              </span>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                {monthBookings.length} {monthBookings.length === 1 ? 'Booking' : 'Bookings'}
              </span>
            </div>

            <div className="space-y-1 pt-1 border-t border-emerald-100">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-emerald-900 font-medium">Month Revenue</span>
                <span className="font-mono font-bold text-xs text-neutral-900 tabular-nums">
                  {formatCurrency(monthlyMetrics.totalRevenue)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-emerald-950">Month Profit</span>
                <span className="font-mono font-extrabold text-sm text-emerald-700 tabular-nums">
                  +{formatCurrency(monthlyMetrics.totalProfit)}
                </span>
              </div>
            </div>

            {selectedDate && (
              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-xs text-emerald-900 truncate">
                  Filtered: <strong className="text-slate-900">{safeFormatDate(selectedDate)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-mono font-bold text-rose-600 hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT AREA: Colorful CRM Metrics + Segmented Filters + Clean Cards
           ═══════════════════════════════════════════════════════════════ */}
        <section className="flex-1 min-w-0 space-y-5">
          
          {/* ─── Colorful, Bold CRM Metric Strip (Matching Partner Portal Style) ─── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5">
            
            {/* 1. Total Bookings Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white border border-blue-200/90 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-blue-900 font-bold whitespace-nowrap">
                  TOTAL BOOKINGS
                </span>
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/25 shrink-0">
                  <Layers size={14} />
                </span>
              </div>
              <span className="font-sans font-extrabold text-2xl sm:text-[32px] text-blue-950 mt-2 block tabular-nums tracking-tight leading-none">
                {monthlyMetrics.total}
              </span>
              <div className="flex items-center justify-start text-xs mt-3 pt-2.5 border-t border-blue-100/80">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/90 border border-blue-200 px-2.5 py-1 rounded-md">
                  {monthlyMetrics.confirmedCount} Confirmed
                </span>
              </div>
            </div>

            {/* 2. Confirmed Revenue Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/90 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-emerald-900 font-bold whitespace-nowrap">
                    REVENUE
                  </span>
                </div>
              </div>
              <span className="font-mono font-extrabold text-lg sm:text-[22px] text-emerald-950 mt-2 block tabular-nums tracking-tight leading-none truncate" title={formatCurrency(monthlyMetrics.totalRevenue)}>
                {formatCurrency(monthlyMetrics.totalRevenue)}
              </span>
              <div className="flex items-center justify-start text-xs mt-3 pt-2.5 border-t border-emerald-100/80">
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {monthlyMetrics.confirmedCount} Orders
                </span>
              </div>
            </div>

            {/* 3. In Ritual / Pending Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border border-amber-200/90 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-amber-900 font-bold whitespace-nowrap">
                    IN RITUAL
                  </span>
                </div>
              </div>
              <span className="font-sans font-extrabold text-2xl sm:text-[32px] text-amber-950 mt-2 block tabular-nums tracking-tight leading-none">
                {monthlyMetrics.inRitualCount}
              </span>
              <div className="flex items-center justify-start text-xs mt-3 pt-2.5 border-t border-amber-100/80">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100/90 border border-amber-200 px-2.5 py-1 rounded-md">
                  {monthlyMetrics.pendingCount} Pending Bookings
                </span>
              </div>
            </div>

            {/* 4. Monthly Profit Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white border border-indigo-200/90 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider text-indigo-900 font-bold whitespace-nowrap">
                  NET PROFIT
                </span>
              </div>
              <span className="font-mono font-extrabold text-lg sm:text-[22px] text-indigo-950 mt-2 block tabular-nums tracking-tight leading-none truncate" title={formatCurrency(monthlyMetrics.totalProfit)}>
                {formatCurrency(monthlyMetrics.totalProfit)}
              </span>
              <div className="flex items-center justify-start text-xs mt-3 pt-2.5 border-t border-indigo-100/80">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/90 border border-indigo-200 px-2.5 py-1 rounded-md">
                  {monthlyMetrics.totalRevenue > 0 ? `${Math.round((monthlyMetrics.totalProfit / monthlyMetrics.totalRevenue) * 100)}% Margin` : 'Net Margin'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Search and Segmented Filter Tabs (Bold & Clean) ─── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'all', label: 'ALL' },
                { id: 'confirmed', label: 'CONFIRMED' },
                { id: 'ongoing', label: 'IN RITUAL' },
                { id: 'finished', label: 'FINISHED' },
                { id: 'pending', label: 'PENDING' },
              ].map((f) => {
                const isSelected = statusFilter === f.id;
                let activeClass = 'bg-slate-900 text-white shadow-xs';
                if (f.id === 'confirmed') activeClass = 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20';
                else if (f.id === 'ongoing') activeClass = 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20';
                else if (f.id === 'finished') activeClass = 'bg-teal-600 text-white shadow-xs shadow-teal-500/20';
                else if (f.id === 'pending') activeClass = 'bg-amber-500 text-white shadow-xs shadow-amber-500/20';

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? activeClass
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest, ref, villa..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* ─── Active Calendar Date Filter Ribbon ─── */}
          {selectedDate && (
            <div className="flex items-center justify-between bg-[#f0f7ff] border border-[#bfdbfe] px-4 py-2.5 rounded-xl text-xs shadow-2xs text-[#1e40af]">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarIcon size={14} className="text-[#2563eb] shrink-0" />
                <span className="text-[#475569]">Filtered by appointment date:</span>
                <span className="font-bold text-[#0f172a] font-mono">
                  {safeFormatDate(selectedDate)}
                </span>
                <span className="bg-[#2563eb] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-[#2563eb] hover:text-[#1d4ed8] font-mono text-xs flex items-center gap-1 hover:underline cursor-pointer font-medium shrink-0 ml-2"
              >
                <span>Show All Dates</span>
                <X size={13} />
              </button>
            </div>
          )}

          {/* ─── Bookings List: Clean Cards (NO Unnecessary Buttons) ─── */}
          {isLoading ? (
            <div className="p-16 text-center rounded-2xl bg-white border border-[#eaecf0] space-y-3 shadow-xs">
              <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-[#64748b]">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[#e2e8f0] p-6 space-y-2.5 shadow-xs">
              <CalendarIcon size={28} className="mx-auto text-[#94a3b8]" />
              <p className="text-sm font-bold text-[#0f172a]">No bookings found</p>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto leading-relaxed">
                {selectedDate 
                  ? `No bookings scheduled for ${safeFormatDate(selectedDate)}.`
                  : search.trim() 
                  ? 'No bookings match your search query.' 
                  : 'Appointments will appear here when guests book online or via partners.'}
              </p>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="mt-2 text-xs font-mono font-bold text-[#2563eb] underline hover:opacity-75 cursor-pointer"
                >
                  View all dates
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const ref = b.reference_number || b.id.substring(0, 8).toUpperCase();
                const bookingStatus = b.status || 'Pending';
                const isCancelled = bookingStatus.toLowerCase() === 'cancelled';
                const paymentStatus = b.payment_status || (b.commission?.payment_verified ? 'Paid' : 'Unpaid');
                const isPaid = paymentStatus.toLowerCase() === 'paid';
                const treatmentStatus = b.treatment_status || (b.commission?.service_completed ? 'Finished' : 'Scheduled');
                const isFinished = treatmentStatus.toLowerCase() === 'finished';
                const isOngoing = treatmentStatus.toLowerCase() === 'in progress';

                return (
                  <div
                    key={b.id}
                    className="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#eaecf0] space-y-3 hover:border-[#cbd5e1] hover:shadow-xs transition-all shadow-xs overflow-hidden"
                  >
                    {/* Top Row: Ref # + Guest Name + Badges + Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {/* Reference Pill with Copy */}
                        <div className="flex items-center gap-1 bg-[#f8fafc] border border-[#eaecf0] px-2.5 py-1 rounded-xl">
                          <Link
                            href={`/invoice/${ref}`}
                            target="_blank"
                            className="font-mono text-xs font-bold text-[#0f172a] hover:underline"
                          >
                            #{ref}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(ref)}
                            className="text-[#94a3b8] hover:text-[#0f172a] p-0.5 cursor-pointer transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === ref ? <Check size={11} className="text-[#16a34a]" /> : <Copy size={11} />}
                          </button>
                        </div>

                        {/* Guest Name & Pax */}
                        <span className="font-bold text-sm text-[#0f172a] truncate">
                          {b.guest_name || 'Guest'}
                        </span>
                        {b.pax > 1 && (
                          <span className="text-[11px] text-[#64748b] font-mono">
                            ({b.pax} pax)
                          </span>
                        )}

                        {/* Booking Status Badge */}
                        {isCancelled ? (
                          <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Cancelled
                          </span>
                        ) : bookingStatus.toLowerCase() === 'confirmed' || bookingStatus.toLowerCase() === 'approved' ? (
                          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Confirmed
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Pending
                          </span>
                        )}

                        {/* Treatment Progress Badge */}
                        {isFinished ? (
                          <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-100/90 border border-teal-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Finished
                          </span>
                        ) : isOngoing ? (
                          <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-100/90 border border-indigo-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            In Ritual
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Scheduled
                          </span>
                        )}

                        {/* Payment Status Badge */}
                        {isPaid ? (
                          <span className="font-mono text-[10px] font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs shadow-indigo-500/20">
                            Paid ({b.payment_method || 'Cash'})
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Unpaid
                          </span>
                        )}
                      </div>

                      {/* Date & Time on Right */}
                      <div className="font-mono text-xs text-[#64748b] flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                        <CalendarIcon size={12} className="text-[#94a3b8]" />
                        <span>{safeFormatDate(b.booking_date)}</span>
                        {b.time && b.time !== '-' && (
                          <>
                            <span className="text-[#cbd5e1]">·</span>
                            <span className="text-[#0f172a] font-semibold">{b.time}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Treatment + Location + Financial Breakdown */}
                    <div className="pt-2.5 border-t border-[#f1f5f9] flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
                      {/* Left: Treatment Details & Location */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-bold text-sm text-[#0f172a] truncate uppercase">
                          {b.treatment_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] truncate">
                          <MapPin size={11} className="text-[#94a3b8] shrink-0" />
                          <span className="truncate">{b.location || 'Ubud'}</span>
                          {b.room_number && (
                            <>
                              <span className="text-[#cbd5e1]">·</span>
                              <span className="font-mono">Room {b.room_number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Revenue, Profit & Attribution */}
                      <div className="flex items-center gap-3 font-mono text-xs shrink-0 flex-wrap">
                        <div>
                          <span className="text-[#94a3b8] text-[10px] uppercase block">Revenue</span>
                          <span className="font-bold text-[#0f172a] tabular-nums">
                            {formatCurrency(b.revenue)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#94a3b8] text-[10px] uppercase block">Profit</span>
                          <span className="font-bold text-emerald-600 tabular-nums">
                            {formatCurrency(b.net_profit)}
                          </span>
                        </div>

                        {b.commission && (
                          <div className="bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            <span className="text-indigo-900 text-[10px] uppercase font-bold block">
                              #{b.commission.partner_code}
                            </span>
                            <span className="font-bold text-indigo-700 tabular-nums text-[11px]">
                              +{formatCurrency(b.commission.commission_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Row: SINGLE PROMINENT TRACK BUTTON (No duplicate Details button!) */}
                    <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between gap-2">
                      <Link
                        href={`/invoice/${ref}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] hover:underline"
                        title="View invoice"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={11} />
                      </Link>

                      <div className="flex items-center gap-2">
                        {/* THE SINGLE PRIMARY ACTION: TRACK (with Admin Milestone Update inside!) */}
                        <button
                          type="button"
                          onClick={() => setTrackingBooking(b)}
                          className="h-8.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                          title="Track schedule, view details & update status"
                        >
                          <Compass size={13} className="text-amber-300" />
                          <span>Track</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ─── Admin Schedule Tracking & Status Milestone Update Modal ─── */}
      <AdminScheduleTrackingModal
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
        onUpdateBookingStatus={updateBookingStatus}
        onUpdateTreatmentStatus={updateTreatmentStatus}
        onUpdatePaymentStatus={updatePaymentStatus}
      />
    </div>
  );
}
