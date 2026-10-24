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
  Square,
  XSquare,
  Copy,
  Check,
  User,
  Lock,
  MapPin
} from 'lucide-react';
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
        // Revenue minus therapist fees minus approved affiliate commission
        let autoCalculatedProfit = Math.max(0, Number(b.revenue || 0) - effectiveTherapistFee);
        if (c && c.status === 'approved' && Number(c.commission_amount || 0) > 0) {
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

      // Filter: Only include Therapick bookings or bookings from affiliate referrals
      const therapickFiltered = merged.filter(b => {
        if (b.brand === 'therapick' || Boolean(b.commission)) return true;
        if (b.brand !== 'elexoir' && b.brand !== 'bali') return true;
        return false;
      });

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

  // Dedicated Password-Protected Undo for Ongoing Treatment and Finish Treatment (Completed)
  const handleUndoStatus = async (booking: Booking, statusToUndo: 'Ongoing' | 'Completed') => {
    const label = statusToUndo === 'Ongoing' ? 'Ongoing Treatment' : 'Finish Treatment';
    const pin = prompt(`Enter secret admin password to undo ${label}:`);
    if (!pin) return;
    if (pin !== (process.env.NEXT_PUBLIC_DELETE_PIN || SECRET_ADMIN_PASSWORD)) {
      alert('Incorrect password. Action cannot be undone.');
      return;
    }

    let targetStatus = 'Pending';
    if (statusToUndo === 'Completed') {
      const wantOngoing = confirm('Click OK to revert to Ongoing Treatment, or Cancel to revert to Pending.');
      targetStatus = wantOngoing ? 'Ongoing' : 'Pending';
    }

    let updates: any = { status: targetStatus };
    await supabase.from('bookings').update(updates).eq('id', booking.id);

    const ref = booking.reference_number || booking.id;
    if (ref) {
      if (statusToUndo === 'Completed' && targetStatus !== 'Completed') {
        await supabase
          .from('affiliate_commissions')
          .update({
            service_completed: false,
            updated_at: new Date().toISOString(),
          })
          .ilike('booking_id', ref);
      }
    }

    fetchMonthBookings();
  };

  // Change Treatment Status (Confirmed, Ongoing, Completed / Finish Treatment, Cancelled)
  const handleStatusChange = async (id: string, newStatus: string) => {
    const booking = monthBookings.find(b => b.id === id);
    if (!booking) return;

    const currentStatus = (booking.status || 'Pending').toLowerCase();
    const isCurrentlyLocked = currentStatus === 'ongoing' || currentStatus === 'completed';

    // If currently Ongoing or Completed, ANY revert or cancel requires the secret admin password 022320!
    // Exception: Progressing forward from Ongoing -> Completed is normal forward progression
    if (isCurrentlyLocked) {
      const isProgressingOngoingToCompleted = (currentStatus === 'ongoing' && (newStatus === 'Completed' || newStatus === 'finish'));
      if (!isProgressingOngoingToCompleted) {
        const pin = prompt(`Booking #${booking.reference_number || booking.id} is marked as ${booking.status}. Enter secret admin password to change/undo status:`);
        if (pin !== (process.env.NEXT_PUBLIC_DELETE_PIN || SECRET_ADMIN_PASSWORD)) {
          alert('Incorrect password. Action cancelled.');
          return;
        }
      }
    }

    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    let updates: any = { status: newStatus };

    // Calculate and add therapist fee base on therapist_fees database (couple = 2 therapists)
    if (newStatus === 'Ongoing' || newStatus === 'Completed' || newStatus === 'Confirmed' || newStatus === 'CONFIRMED') {
      const { totalFee, therapistsCount } = calculateBookingTherapistFee(booking, treatments, allTherapistFees);
      if (totalFee > 0) {
        updates.therapist_fee_total = totalFee;
        updates.therapists_count = therapistsCount;
        const isCommApproved = booking?.commission?.status === 'approved';
        const commAmount = isCommApproved ? Number(booking.commission.commission_amount || 0) : 0;
        updates.net_profit = Math.max(0, (booking.revenue || 0) - totalFee - commAmount);
      }
    }

    await supabase.from('bookings').update(updates).eq('id', id);

    // Realtime Sync to affiliate_commissions
    const ref = booking?.reference_number || booking?.id;
    if (ref) {
      if (newStatus === 'Cancelled') {
        // If treatment cancel, partner sees cancel label and commission cancelled
        await supabase
          .from('affiliate_commissions')
          .update({
            status: 'cancelled',
            service_completed: false,
            updated_at: new Date().toISOString(),
          })
          .ilike('booking_id', ref);
      } else if (newStatus === 'Completed') {
        // Treatment finished
        await supabase
          .from('affiliate_commissions')
          .update({
            service_completed: true,
            updated_at: new Date().toISOString(),
          })
          .ilike('booking_id', ref);
      } else if (newStatus === 'Confirmed' || newStatus === 'Ongoing' || newStatus === 'Pending') {
        if (booking?.commission?.status === 'cancelled') {
          await supabase
            .from('affiliate_commissions')
            .update({
              status: 'pending',
              service_completed: false,
              updated_at: new Date().toISOString(),
            })
            .ilike('booking_id', ref);
        } else if (currentStatus === 'completed') {
          await supabase
            .from('affiliate_commissions')
            .update({
              service_completed: false,
              updated_at: new Date().toISOString(),
            })
            .ilike('booking_id', ref);
        }
      }
    }

    fetchMonthBookings();
  };

  // Toggle Payment: Paid <-> Unpaid
  const handleTogglePayment = async (booking: Booking) => {
    const isPaid = booking.payment_status === 'paid' || booking.commission?.payment_verified;
    const nextStatus = isPaid ? 'unpaid' : 'paid';

    await supabase.from('bookings').update({ payment_status: nextStatus }).eq('id', booking.id);

    const ref = booking.reference_number || booking.id;
    if (ref) {
      await supabase
        .from('affiliate_commissions')
        .update({
          payment_verified: nextStatus === 'paid',
          updated_at: new Date().toISOString(),
        })
        .ilike('booking_id', ref);
    }

    fetchMonthBookings();
  };

  // Manual Commission Approval: Admin executes the job when treatment is done
  // Add therapist fee base on therapist_fees database, couple package = 2 therapists
  const handleApproveCommission = async (booking: Booking) => {
    const ref = booking.reference_number || booking.id;
    if (!ref) return;

    if (!confirm(`Approve affiliate commission for #${ref}? The commission will immediately become approved and withdrawable for the partner, and therapist fee base on the database will automatically be recorded.`)) {
      return;
    }

    // Calculate therapist fee base on therapist_fees database (couple = 2 therapists)
    const { totalFee, therapistsCount } = calculateBookingTherapistFee(booking, treatments, allTherapistFees);
    const finalTherapistFee = totalFee > 0 ? totalFee : Number(booking.therapist_fee_total || 0);
    const finalTherapistsCount = therapistsCount > 0 ? therapistsCount : Number(booking.therapists_count || booking.pax || 1);
    const commAmount = Number(booking.commission?.commission_amount || 0);
    const rev = Number(booking.revenue || 0);
    const autoCalculatedProfit = Math.max(0, rev - finalTherapistFee - commAmount);

    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'approved',
        service_completed: true,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .ilike('booking_id', ref);

    // Smart logic: Automatically recalculate and store therapist fee and profit in bookings table
    await supabase
      .from('bookings')
      .update({
        therapist_fee_total: finalTherapistFee,
        therapists_count: finalTherapistsCount,
        net_profit: autoCalculatedProfit,
      })
      .eq('id', booking.id);

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

  const totalDailyRevenue = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [dailyBookings]);
  const totalDailyProfit = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [dailyBookings]);

  const totalMonthlyRevenue = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [monthBookings]);
  const totalMonthlyProfit = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [monthBookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-black">Therapick Bookings</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
              Therapick & Affiliates
            </span>
          </div>
          <p className="text-sm text-black/60 mt-0.5">Therapick daily bookings, partner commissions, and smart financial calculator</p>
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
          <div className="bg-white border border-black/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Quick Date Jumper: Prev, Today, Next */}
              <div className="flex items-center bg-black/5 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={handlePrevDay} 
                  className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer text-neutral-700 hover:text-black"
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  type="button" 
                  onClick={handleToday} 
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedDate === toLocalDateString(new Date()) 
                      ? 'bg-black text-white shadow-2xs' 
                      : 'text-neutral-700 hover:bg-white'
                  }`}
                  title="Jump to Today"
                >
                  Today
                </button>
                <button 
                  type="button" 
                  onClick={handleNextDay} 
                  className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer text-neutral-700 hover:text-black"
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-950 flex items-center gap-2 flex-wrap">
                  <span>Bookings for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-xs font-bold font-mono bg-black/5 text-neutral-700 px-2.5 py-0.5 rounded-full border border-black/10">
                    {dailyBookings.length} {dailyBookings.length === 1 ? 'Booking' : 'Bookings'}
                  </span>
                </h3>
              </div>
            </div>

            {!showForm && (
              <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-black/85 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
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

                const isPaid = booking.payment_status === 'paid' || booking.commission?.payment_verified;
                const bookingStatus = booking.status || 'Confirmed';
                const isCancelled = bookingStatus.toLowerCase() === 'cancelled';
                const isOngoing = bookingStatus.toLowerCase() === 'ongoing';
                const isCompleted = bookingStatus.toLowerCase() === 'completed';
                const isConfirmed = bookingStatus.toLowerCase() === 'confirmed';
                const hasCommission = Boolean(booking.commission);
                const isCommissionApproved = booking.commission?.status === 'approved';
                const isCommissionPending = booking.commission?.status === 'pending';
                const isCommissionCancelled = booking.commission?.status === 'cancelled';

                return (
                  <div key={booking.id} className={`bg-white border ${isCancelled ? 'border-red-200 bg-red-50/20' : 'border-neutral-200/90'} rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden space-y-4`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isCancelled ? 'bg-red-500' :
                      isOngoing ? 'bg-indigo-600' :
                      isCompleted ? 'bg-teal-600' :
                      isConfirmed ? 'bg-sky-500' : 'bg-orange-400'
                    }`}></div>

                    {/* Top Row: Reference, Pax, Payment Badge, Treatment Status Mark, Customer Name & Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pl-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {booking.reference_number && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
                              #{booking.reference_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(booking.reference_number!)}
                              className="text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded hover:bg-neutral-100 cursor-pointer"
                              title="Copy reference number"
                            >
                              {copiedId === booking.reference_number ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg border border-neutral-200 whitespace-nowrap">
                          {booking.pax} Pax
                        </span>

                        {/* Payment Status Label / Clickable Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(booking)}
                          className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Click to toggle Paid/Unpaid"
                        >
                          {isPaid ? <CheckSquare size={11} className="text-emerald-700" /> : <Square size={11} className="text-amber-600" />}
                          <span>{isPaid ? 'Paid' : 'Unpaid'}</span>
                        </button>

                        {/* Treatment Status Mark (Moved Above when Ongoing or Finish Treatment, locked with 022320 password) */}
                        {isCancelled ? (
                          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            Cancelled
                          </span>
                        ) : isOngoing ? (
                          <button
                            type="button"
                            onClick={() => handleUndoStatus(booking, 'Ongoing')}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs transition-all cursor-pointer group"
                            title="Ongoing Treatment active. Undo requires secret admin password (022320)"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            <span>Ongoing Treatment</span>
                            <Lock size={10} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                          </button>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleUndoStatus(booking, 'Completed')}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 shadow-2xs transition-all cursor-pointer group"
                            title="Finish Treatment marked. Undo requires secret admin password (022320)"
                          >
                            <CheckCircle2 size={11} className="text-teal-700" />
                            <span>Finish Treatment</span>
                            <Lock size={10} className="text-teal-600 group-hover:scale-110 transition-transform" />
                          </button>
                        ) : isConfirmed && !hasCommission ? (
                          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Customer Name, Location & Time */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                        {booking.guest_name && (
                          <span className="font-bold text-neutral-950 flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200/60">
                            <User size={12} className="text-neutral-500" />
                            {booking.guest_name}
                          </span>
                        )}
                        {booking.time && booking.time !== '-' && (
                          <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/80 flex items-center gap-1">
                            <Clock size={11} className="text-neutral-500" />
                            {booking.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Treatment Details & 3-Column Financial Breakdown */}
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pl-1.5 ${isCancelled ? 'opacity-60' : ''}`}>
                      {/* Left: Treatment Details */}
                      <div className="space-y-1 w-full md:w-1/2">
                        {booking.items && booking.items.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {booking.items.map((it: any, idx: number) => {
                              const isCouple = isCouplePackage(it.title);
                              return (
                                <div key={idx}>
                                  <p className="font-bold text-sm sm:text-base leading-snug text-neutral-900">
                                    {it.title} {isCouple ? '(Couple Package)' : it.guests > 1 ? `(x${it.guests})` : ''}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/60">
                                      Duration: {it.duration} Mins
                                    </span>
                                    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/60">
                                      {isCouple ? '2 Therapists Assigned' : `${it.guests || 1} Therapist Assigned`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-sm sm:text-base leading-snug text-neutral-900">{title}</p>
                            {dur && (
                              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mt-1 bg-neutral-100 inline-block px-2 py-0.5 rounded border border-neutral-200/60">
                                Duration: {dur}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Location / Hotel / Room Details if present */}
                        {booking.location && (
                          <div className="text-[11px] text-neutral-600 flex items-center gap-1 font-medium pt-1">
                            <MapPin size={11} className="text-neutral-400 shrink-0" />
                            <span>{booking.location}{booking.room_number ? `, Room ${booking.room_number}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: 3-Column Financial Breakdown Box */}
                      <div className="w-full md:w-auto md:min-w-[340px] lg:min-w-[380px] grid grid-cols-3 gap-2 text-center bg-neutral-50/90 border border-neutral-200/80 rounded-xl p-3 shadow-2xs">
                        <div className="flex flex-col justify-center">
                          <span className="block text-[9px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">Revenue</span>
                          <span className="font-bold text-xs sm:text-sm text-neutral-900 tracking-tight">{formatCurrency(booking.revenue)}</span>
                        </div>
                        <div className="flex flex-col justify-center border-x border-neutral-200/70 px-1">
                          <span className="block text-[9px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">
                            Fees ({booking.therapists_count} {booking.therapists_count > 1 ? 'Therapists' : 'Therapist'})
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-orange-600 tracking-tight">{formatCurrency(booking.therapist_fee_total)}</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="block text-[9px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">Profit</span>
                          <span className="font-bold text-xs sm:text-sm text-emerald-700 tracking-tight">{formatCurrency(booking.net_profit)}</span>
                          {isCommissionApproved && Number(booking.commission?.commission_amount || 0) > 0 && (
                            <span className="block text-[9px] text-neutral-400 font-mono mt-0.5 whitespace-nowrap">
                              (-{formatCurrency(booking.commission.commission_amount)} comm)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Partner Referral Attribution Box (if referred by partner) */}
                    {hasCommission && (
                      <div className="pl-1.5 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            Partner: #{booking.commission?.partner_code}
                          </span>
                          <span className="text-xs font-bold text-emerald-800 font-mono">
                            Commission: +{formatCurrency(booking.commission?.commission_amount || 0)}
                          </span>

                          {/* Commission Status */}
                          {isCommissionCancelled ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              Commission Cancelled
                            </span>
                          ) : isCommissionApproved ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckSquare size={12} className="text-emerald-700" /> Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock size={11} className="text-amber-700" /> Pending
                            </span>
                          )}
                        </div>

                        {/* Manual Admin Approval Button */}
                        {!isCommissionApproved && !isCommissionCancelled && (
                          <button
                            type="button"
                            onClick={() => handleApproveCommission(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="Approve Commission Manually"
                          >
                            <CheckSquare size={13} />
                            <span>Approve Commission</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Bar: Checklist Workflow & Utility Actions */}
                    <div className="pl-1.5 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
                      {/* Operational Checklist Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1. Paid / Unpaid Checklist Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(booking)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border ${
                            isPaid
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                          title={isPaid ? "Payment is Paid. Click to toggle to Unpaid" : "Payment is Unpaid. Click to mark as Paid"}
                        >
                          {isPaid ? (
                            <CheckSquare size={13} className="text-emerald-700 shrink-0" />
                          ) : (
                            <Square size={13} className="text-amber-600 shrink-0" />
                          )}
                          <span>{isPaid ? 'Paid' : 'Unpaid'}</span>
                        </button>

                        {/* 2. Confirmed Checklist Button: ONLY if NOT coming from an affiliate link! */}
                        {!hasCommission && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, isConfirmed ? 'Pending' : 'Confirmed')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border ${
                              isConfirmed
                                ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300 ring-1 ring-sky-300/50'
                                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                            }`}
                            title={isConfirmed ? "Booking Confirmed. Click to return to Pending" : "Click to mark Confirmed"}
                          >
                            {isConfirmed ? (
                              <CheckSquare size={13} className="text-sky-700 shrink-0" />
                            ) : (
                              <Square size={13} className="text-neutral-400 shrink-0" />
                            )}
                            <span>Confirmed</span>
                          </button>
                        )}

                        {/* 3. Ongoing Treatment Checklist Button (Locked when active, undo requires 022320 password) */}
                        {!isCancelled && (
                          isOngoing ? (
                            <button
                              type="button"
                              onClick={() => handleUndoStatus(booking, 'Ongoing')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-300/50 cursor-pointer"
                              title="Ongoing Treatment is active. Undo requires secret admin password (022320)"
                            >
                              <CheckSquare size={13} className="text-indigo-700 shrink-0" />
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                Ongoing Treatment
                              </span>
                              <Lock size={11} className="text-indigo-600 ml-0.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(booking.id, 'Ongoing')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300"
                              title="Click to mark Ongoing Treatment"
                            >
                              <Square size={13} className="text-neutral-400 shrink-0" />
                              <span>Ongoing Treatment</span>
                            </button>
                          )
                        )}

                        {/* 4. Finish Treatment Checklist Button (Locked when active, undo requires 022320 password) */}
                        {!isCancelled && (
                          isCompleted ? (
                            <button
                              type="button"
                              onClick={() => handleUndoStatus(booking, 'Completed')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-300 ring-1 ring-teal-300/50 cursor-pointer"
                              title="Finish Treatment is marked. Undo requires secret admin password (022320)"
                            >
                              <CheckSquare size={13} className="text-teal-700 shrink-0" />
                              <span>Finish Treatment</span>
                              <Lock size={11} className="text-teal-600 ml-0.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(booking.id, 'Completed')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300"
                              title="Click to mark Finish Treatment"
                            >
                              <Square size={13} className="text-neutral-400 shrink-0" />
                              <span>Finish Treatment</span>
                            </button>
                          )
                        )}

                        {/* 5. Cancel Checklist Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(booking.id, isCancelled ? (hasCommission ? 'Pending' : 'Confirmed') : 'Cancelled')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border ${
                            isCancelled
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                              : 'bg-neutral-50 hover:bg-rose-50 text-neutral-600 hover:text-rose-700 border-neutral-200 hover:border-rose-300'
                          }`}
                          title={isCancelled ? "Booking is Cancelled. Click to reinstate" : "Cancel this booking"}
                        >
                          {isCancelled ? (
                            <XSquare size={13} className="text-rose-700 shrink-0" />
                          ) : (
                            <XCircle size={13} className="text-rose-500 shrink-0" />
                          )}
                          <span>{isCancelled ? 'Cancelled' : 'Cancel'}</span>
                        </button>
                      </div>

                      {/* Utility Action Buttons: Invoice, Edit, Delete */}
                      <div className="flex items-center gap-1.5">
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
                            className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700 cursor-pointer"
                            title="View Invoice"
                          >
                            <FileText size={15} />
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
                          className="p-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors text-neutral-800 cursor-pointer"
                          title="Edit Booking"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(booking.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600 cursor-pointer"
                          title="Delete Booking"
                        >
                          <Trash2 size={15} />
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
