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
  const totalDailyFees = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.therapist_fee_total || 0), 0), [dailyBookings]);
  const totalDailyPax = useMemo(() => dailyBookings.reduce((sum, b) => sum + (b.pax || 0), 0), [dailyBookings]);

  const totalMonthlyRevenue = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.revenue || 0), 0), [monthBookings]);
  const totalMonthlyProfit = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.net_profit || 0), 0), [monthBookings]);
  const totalMonthlyFees = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.therapist_fee_total || 0), 0), [monthBookings]);
  const totalMonthlyPax = useMemo(() => monthBookings.reduce((sum, b) => sum + (b.pax || 0), 0), [monthBookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black">Therapick Bookings</h2>
            <span className="inline-flex items-center h-6 px-2 rounded-md border border-[#E5E5E5] text-[11px] font-mono text-[#737373]">
              Therapick & Affiliates
            </span>
          </div>
          <p className="text-[13px] text-[#737373] mt-0.5">Therapick daily bookings, partner commissions, and smart financial calculator</p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* 4-KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="text-xs text-[#737373] font-medium">Daily bookings</div>
          <div className="text-2xl font-semibold text-black mt-1 tabular-nums">{dailyBookings.length}</div>
          <div className="text-xs text-[#737373] mt-1 truncate">
            {totalDailyPax} pax · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="text-xs text-[#737373] font-medium">Daily revenue</div>
          <div className="text-2xl font-semibold text-black mt-1 tabular-nums">{formatCurrency(totalDailyRevenue)}</div>
          <div className="text-xs text-emerald-600 mt-1 truncate">
            Net profit: {formatCurrency(totalDailyProfit)}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="text-xs text-[#737373] font-medium">Monthly bookings</div>
          <div className="text-2xl font-semibold text-black mt-1 tabular-nums">{monthBookings.length}</div>
          <div className="text-xs text-[#737373] mt-1 truncate">
            {totalMonthlyPax} pax · {monthNames[month]} {year}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 md:p-5">
          <div className="text-xs text-[#737373] font-medium">Monthly revenue</div>
          <div className="text-2xl font-semibold text-black mt-1 tabular-nums">{formatCurrency(totalMonthlyRevenue)}</div>
          <div className="text-xs text-emerald-600 mt-1 truncate">
            Net profit: {formatCurrency(totalMonthlyProfit)}
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
                
                const bookingsForThisDay = monthBookings.filter((b) => b.booking_date === isoString);
                const paxCount = bookingsForThisDay.reduce((sum, b) => sum + b.pax, 0);

                return (
                  <div key={day} className="relative flex justify-center">
                    <button
                      type="button"
                      onClick={() => selectDate(day)}
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
                          title={`${bookingsForThisDay.length} bookings (${paxCount} pax)`}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Daily summary */}
            <div className="mt-5 pt-4 border-t border-[#E5E5E5] space-y-2">
              <div className="text-xs font-semibold text-black">
                Daily summary · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#737373]">Revenue</span>
                <span className="font-medium text-[#171717] tabular-nums">{formatCurrency(totalDailyRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#737373]">Therapist fees</span>
                <span className="font-medium text-[#737373] tabular-nums">{formatCurrency(totalDailyFees)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#F0F0F0]">
                <span className="font-medium text-[#171717]">Net profit</span>
                <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(totalDailyProfit)}</span>
              </div>
            </div>
          </div>

          {/* Monthly summary CRM card - Clean pure white, no dark gradient */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-black">Monthly summary</h4>
              <span className="text-[11px] text-[#737373]">{monthNames[month]} {year}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="border border-[#E5E5E5] rounded-lg p-2.5 bg-white">
                <span className="block text-[11px] text-[#737373]">Bookings</span>
                <span className="text-base font-semibold text-black tabular-nums mt-0.5 block">{monthBookings.length}</span>
              </div>
              <div className="border border-[#E5E5E5] rounded-lg p-2.5 bg-white">
                <span className="block text-[11px] text-[#737373]">Total pax</span>
                <span className="text-base font-semibold text-black tabular-nums mt-0.5 block">{totalMonthlyPax}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-[#F0F0F0] text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#737373]">Revenue</span>
                <span className="font-medium text-[#171717] tabular-nums">{formatCurrency(totalMonthlyRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#737373]">Therapist fees</span>
                <span className="font-medium text-[#737373] tabular-nums">{formatCurrency(totalMonthlyFees)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#F0F0F0]">
                <span className="font-medium text-[#171717]">Net profit</span>
                <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(totalMonthlyProfit)}</span>
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
            <div className="space-y-3">
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
                const isCommissionCancelled = booking.commission?.status === 'cancelled';

                return (
                  <div key={booking.id} className={cx('bg-white border rounded-xl p-4 sm:p-5 transition-colors space-y-4', isCancelled ? 'border-red-200 bg-red-50/10' : 'border-[#E5E5E5] hover:border-black/30')}>
                    {/* Top Row: Reference, Pax, Payment Badge, Treatment Status Mark, Customer Name & Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {booking.reference_number && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-[#171717] bg-[#FAFAFA] px-2 py-0.5 rounded-md border border-[#E5E5E5]">
                              #{booking.reference_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(booking.reference_number!)}
                              className={cx(btn.base, btn.secondary, btn.icon, 'h-6 w-6 text-[#737373]')}
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
                        <span className="text-xs text-[#737373] bg-[#FAFAFA] px-2 py-0.5 rounded-md border border-[#E5E5E5] whitespace-nowrap">
                          {booking.pax} Pax
                        </span>

                        {/* Payment Status Label / Clickable Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(booking)}
                          className={cx(
                            'text-xs font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1',
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          )}
                          title="Click to toggle Paid/Unpaid"
                        >
                          {isPaid ? <CheckSquare size={12} className="text-emerald-700" /> : <Square size={12} className="text-amber-700" />}
                          <span>{isPaid ? 'Paid' : 'Unpaid'}</span>
                        </button>

                        {/* Treatment Status Mark */}
                        {isCancelled ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#F5F5F5] text-[#737373] border border-[#E5E5E5]">
                            Cancelled
                          </span>
                        ) : isOngoing ? (
                          <button
                            type="button"
                            onClick={() => handleUndoStatus(booking, 'Ongoing')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-all cursor-pointer group"
                            title="Ongoing Treatment active. Undo requires secret admin password (022320)"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            <span>Ongoing</span>
                            <Lock size={10} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                          </button>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleUndoStatus(booking, 'Completed')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-all cursor-pointer group"
                            title="Finish Treatment marked. Undo requires secret admin password (022320)"
                          >
                            <CheckCircle2 size={11} className="text-teal-700" />
                            <span>Finished</span>
                            <Lock size={10} className="text-teal-600 group-hover:scale-110 transition-transform" />
                          </button>
                        ) : isConfirmed && !hasCommission ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Customer Name, Location & Time */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373]">
                        {booking.guest_name && (
                          <span className="font-medium text-[#171717] flex items-center gap-1 bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E5E5E5]">
                            <User size={12} className="text-[#737373]" />
                            {booking.guest_name}
                          </span>
                        )}
                        {booking.time && booking.time !== '-' && (
                          <span className="text-xs font-medium text-[#737373] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E5E5E5] flex items-center gap-1">
                            <Clock size={11} className="text-[#737373]" />
                            {booking.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Treatment Details & 3-Column Financial Breakdown */}
                    <div className={cx('flex flex-col md:flex-row md:items-center justify-between gap-4', isCancelled && 'opacity-60')}>
                      {/* Left: Treatment Details */}
                      <div className="space-y-1 w-full md:w-1/2">
                        {booking.items && booking.items.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {booking.items.map((it: any, idx: number) => {
                              const isCouple = isCouplePackage(it.title);
                              return (
                                <div key={idx}>
                                  <p className="font-medium text-sm text-[#171717]">
                                    {it.title} {isCouple ? '(Couple Package)' : it.guests > 1 ? `(x${it.guests})` : ''}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[11px] text-[#737373] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E5E5E5]">
                                      Duration: {it.duration} Mins
                                    </span>
                                    <span className="text-[11px] text-[#737373] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E5E5E5]">
                                      {isCouple ? '2 Therapists Assigned' : `${it.guests || 1} Therapist Assigned`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm text-[#171717]">{title}</p>
                            {dur && (
                              <p className="text-[11px] text-[#737373] mt-1 bg-[#FAFAFA] inline-block px-2 py-0.5 rounded border border-[#E5E5E5]">
                                Duration: {dur}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Location / Hotel / Room Details if present */}
                        {booking.location && (
                          <div className="text-xs text-[#737373] flex items-center gap-1 font-normal pt-1">
                            <MapPin size={11} className="text-[#737373] shrink-0" />
                            <span>{booking.location}{booking.room_number ? `, Room ${booking.room_number}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: 3-Column Financial Breakdown Box */}
                      <div className="w-full md:w-auto md:min-w-[340px] lg:min-w-[360px] grid grid-cols-3 divide-x divide-[#E5E5E5] border border-[#E5E5E5] rounded-lg p-2.5 text-center bg-[#FAFAFA]">
                        <div className="flex flex-col justify-center px-2">
                          <span className="block text-[10px] text-[#737373] font-medium">Revenue</span>
                          <span className="font-semibold text-xs sm:text-[13px] text-black tabular-nums mt-0.5">{formatCurrency(booking.revenue)}</span>
                        </div>
                        <div className="flex flex-col justify-center px-2">
                          <span className="block text-[10px] text-[#737373] font-medium">
                            Fees ({booking.therapists_count} {booking.therapists_count > 1 ? 'Therapists' : 'Therapist'})
                          </span>
                          <span className="font-semibold text-xs sm:text-[13px] text-[#737373] tabular-nums mt-0.5">{formatCurrency(booking.therapist_fee_total)}</span>
                        </div>
                        <div className="flex flex-col justify-center px-2">
                          <span className="block text-[10px] text-[#737373] font-medium">Profit</span>
                          <span className="font-semibold text-xs sm:text-[13px] text-emerald-600 tabular-nums mt-0.5">{formatCurrency(booking.net_profit)}</span>
                          {isCommissionApproved && Number(booking.commission?.commission_amount || 0) > 0 && (
                            <span className="block text-[9px] text-[#737373] font-mono mt-0.5 whitespace-nowrap">
                              (-{formatCurrency(booking.commission.commission_amount)} comm)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Partner Referral Attribution Box (if referred by partner) */}
                    {hasCommission && (
                      <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-[#171717] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                            Partner: #{booking.commission?.partner_code}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 font-mono">
                            Commission: +{formatCurrency(booking.commission?.commission_amount || 0)}
                          </span>

                          {/* Commission Status */}
                          {isCommissionCancelled ? (
                            <span className="text-xs font-medium text-[#737373] bg-[#F5F5F5] px-2 py-0.5 rounded">
                              Commission Cancelled
                            </span>
                          ) : isCommissionApproved ? (
                            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckSquare size={12} className="text-emerald-700" /> Approved
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock size={11} className="text-amber-700" /> Pending
                            </span>
                          )}
                        </div>

                        {/* Manual Admin Approval Button */}
                        {!isCommissionApproved && !isCommissionCancelled && (
                          <button
                            type="button"
                            onClick={() => handleApproveCommission(booking)}
                            className={cx(btn.base, btn.primary, btn.xs)}
                            title="Approve Commission Manually"
                          >
                            <CheckSquare size={12} />
                            <span>Approve commission</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Bar: Checklist Workflow & Utility Actions */}
                    <div className="pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between gap-2.5">
                      {/* Operational Checklist Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1. Paid / Unpaid Checklist Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(booking)}
                          className={cx(
                            btn.base,
                            btn.xs,
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          )}
                          title={isPaid ? "Payment is Paid. Click to toggle to Unpaid" : "Payment is Unpaid. Click to mark as Paid"}
                        >
                          {isPaid ? (
                            <CheckSquare size={12} className="text-emerald-700 shrink-0" />
                          ) : (
                            <Square size={12} className="text-amber-700 shrink-0" />
                          )}
                          <span>{isPaid ? 'Paid' : 'Unpaid'}</span>
                        </button>

                        {/* 2. Confirmed Checklist Button */}
                        {!hasCommission && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, isConfirmed ? 'Pending' : 'Confirmed')}
                            className={cx(
                              btn.base,
                              btn.xs,
                              isConfirmed
                                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                : btn.secondary
                            )}
                            title={isConfirmed ? "Booking Confirmed. Click to return to Pending" : "Click to mark Confirmed"}
                          >
                            {isConfirmed ? (
                              <CheckSquare size={12} className="text-blue-700 shrink-0" />
                            ) : (
                              <Square size={12} className="text-[#737373] shrink-0" />
                            )}
                            <span>Confirmed</span>
                          </button>
                        )}

                        {/* 3. Ongoing Treatment Checklist Button */}
                        {!isCancelled && (
                          isOngoing ? (
                            <button
                              type="button"
                              onClick={() => handleUndoStatus(booking, 'Ongoing')}
                              className={cx(btn.base, btn.xs, 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100')}
                              title="Ongoing Treatment is active. Undo requires secret admin password (022320)"
                            >
                              <CheckSquare size={12} className="text-indigo-700 shrink-0" />
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                Ongoing Treatment
                              </span>
                              <Lock size={10} className="text-indigo-600 ml-0.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(booking.id, 'Ongoing')}
                              className={cx(btn.base, btn.secondary, btn.xs)}
                              title="Click to mark Ongoing Treatment"
                            >
                              <Square size={12} className="text-[#737373] shrink-0" />
                              <span>Ongoing Treatment</span>
                            </button>
                          )
                        )}

                        {/* 4. Finish Treatment Checklist Button */}
                        {!isCancelled && (
                          isCompleted ? (
                            <button
                              type="button"
                              onClick={() => handleUndoStatus(booking, 'Completed')}
                              className={cx(btn.base, btn.xs, 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100')}
                              title="Finish Treatment is marked. Undo requires secret admin password (022320)"
                            >
                              <CheckSquare size={12} className="text-teal-700 shrink-0" />
                              <span>Finish Treatment</span>
                              <Lock size={10} className="text-teal-600 ml-0.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(booking.id, 'Completed')}
                              className={cx(btn.base, btn.secondary, btn.xs)}
                              title="Click to mark Finish Treatment"
                            >
                              <Square size={12} className="text-[#737373] shrink-0" />
                              <span>Finish Treatment</span>
                            </button>
                          )
                        )}

                        {/* 5. Cancel Checklist Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(booking.id, isCancelled ? (hasCommission ? 'Pending' : 'Confirmed') : 'Cancelled')}
                          className={cx(
                            btn.base,
                            btn.xs,
                            isCancelled
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'text-[#737373] hover:text-red-600 hover:bg-red-50/50'
                          )}
                          title={isCancelled ? "Booking is Cancelled. Click to reinstate" : "Cancel this booking"}
                        >
                          {isCancelled ? (
                            <XSquare size={12} className="text-red-700 shrink-0" />
                          ) : (
                            <XCircle size={12} className="text-[#737373] shrink-0" />
                          )}
                          <span>{isCancelled ? 'Cancelled' : 'Cancel'}</span>
                        </button>
                      </div>

                      {/* Utility Action Buttons: Invoice, Edit, Delete */}
                      <div className="flex items-center gap-1">
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
                            className={cx(btn.base, btn.secondary, btn.icon, 'h-7 w-7 text-blue-600 hover:border-blue-300')}
                            title="View Invoice"
                            aria-label="View invoice"
                          >
                            <FileText size={14} />
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
                          className={cx(btn.base, btn.secondary, btn.icon, 'h-7 w-7')}
                          title="Edit Booking"
                          aria-label="Edit booking"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(booking.id)}
                          className={cx(btn.base, btn.secondary, btn.icon, 'h-7 w-7 text-red-600 hover:border-red-300')}
                          title="Delete Booking"
                          aria-label="Delete booking"
                        >
                          <Trash2 size={14} />
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
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 md:p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <h3 className="text-base font-semibold text-black tracking-tight">Financial performance (YTD)</h3>
              <p className="text-xs text-[#737373] mt-0.5">Gross revenue & net profit by month</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#737373]">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#E5E5E5]"></div> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-black"></div> Net profit</div>
            </div>
          </div>
          
          <div className="h-44 md:h-56 flex items-end justify-between gap-1 sm:gap-2">
            {(() => {
              const maxRev = Math.max(...yearlyStats.map(s => s.revenue), 1000000);
              return yearlyStats.map((stat, idx) => {
                const revHeight = Math.max((stat.revenue / maxRev) * 100, 2);
                const profHeight = Math.max((stat.profit / maxRev) * 100, 1);
                const hasData = stat.revenue > 0;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    {hasData && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-medium py-1 px-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <div className="text-[#A3A3A3] text-[9px]">{stat.month}</div>
                        <div>Rev: {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(stat.revenue)}</div>
                        <div className="text-emerald-400">Net: {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(stat.profit)}</div>
                      </div>
                    )}
                    
                    {/* Bars */}
                    <div className="w-full max-w-[36px] relative flex items-end justify-center h-full rounded-t transition-all cursor-pointer">
                      {/* Revenue Bar */}
                      <div 
                        className={cx(
                          'absolute bottom-0 w-full rounded-t transition-all duration-500',
                          hasData ? 'bg-[#E5E5E5] group-hover:bg-[#D4D4D4]' : 'bg-[#F5F5F5]'
                        )} 
                        style={{ height: `${hasData ? revHeight : 0}%` }}
                      />
                      {/* Profit Bar */}
                      <div 
                        className={cx(
                          'absolute bottom-0 w-full rounded-t transition-all duration-500 z-10',
                          hasData ? 'bg-black' : 'bg-transparent'
                        )} 
                        style={{ height: `${hasData ? profHeight : 0}%`, width: '55%' }}
                      />
                    </div>
                    
                    <span className={cx('text-[11px] font-medium mt-2', hasData ? 'text-black' : 'text-[#A3A3A3]')}>
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
