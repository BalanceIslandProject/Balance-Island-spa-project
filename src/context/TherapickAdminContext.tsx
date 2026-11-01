'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/components/TherapickBookingManagement';
import { Treatment, TherapistFee } from '@/context/SpaContext';

export type AdminSystem = 'website' | 'affiliate';

export type TherapickBooking = Booking | any;
export type AffiliatePartner = any;
export type CommissionLedgerItem = any;
export type AffiliatePayout = any;

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
  preset: 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all' | 'custom';
}

export interface AdminNotification {
  id: string;
  type: any;
  title: string;
  message: string;
  created_at: string;
  read?: boolean;
  is_read?: boolean;
  reference_id?: string;
  data?: any;
  system?: 'website' | 'affiliate' | 'both';
}

export interface WebsiteMetrics {
  totalRevenue: number;
  revenue: number;
  therapistPayments: number;
  therapist_payments: number;
  netProfit: number;
  net_profit: number;
  bookingCount: number;
  booking_count: number;
  avgBookingValue: number;
  avg_booking_value: number;
  revChangePct: number;
  netChangePct: number;
}

export interface AffiliateMetrics {
  affiliateRevenue: number;
  revenue: number;
  therapistFees: number;
  therapist_fee: number;
  commission: number;
  netProfit: number;
  net_profit: number;
  activePartnersCount: number;
  bookingCount: number;
  booking_count: number;
  pendingCommissions: number;
  outstandingPayouts: number;
  available_balance: number;
  revChangePct: number;
  netChangePct: number;
}

interface TherapickAdminContextType {
  system: AdminSystem;
  setSystem: (s: AdminSystem) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Data
  bookings: any[];
  websiteBookings: any[];
  affiliateBookings: any[];
  partners: any[];
  commissions: any[];
  payouts: any[];
  therapists: any[];
  therapistsList: any[];
  treatments: Treatment[];
  servicesList: any[];
  therapistFees: TherapistFee[];
  loading: boolean;
  refreshData: () => Promise<void>;

  // Metrics
  websiteMetrics: WebsiteMetrics;
  affiliateMetrics: AffiliateMetrics;

  // Date Filter
  dateRange: DateRange;
  setDateRange: (d: DateRange) => void;
  setDatePreset: (preset: DateRange['preset']) => void;

  // Selected for Drawers
  selectedBooking: any | null;
  setSelectedBooking: (b: any | null) => void;
  selectedPartner: any | null;
  setSelectedPartner: (p: any | null) => void;

  // Modals & Drawers
  isAddBookingOpen: boolean;
  setIsAddBookingOpen: (open: boolean) => void;
  isAdvancedCalendarOpen: boolean;
  setIsAdvancedCalendarOpen: (open: boolean) => void;
  isCreatePayoutOpen: boolean;
  setIsCreatePayoutOpen: (open: boolean) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  calendarVisibility: boolean;
  setCalendarVisibility: (visible: boolean) => void;
  showOnAffiliateCalendars: boolean;
  setShowOnAffiliateCalendars: (show: boolean) => void;

  // Notifications
  notifications: AdminNotification[];
  unreadCount: number;
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Action Helpers
  updateBookingStatus: (id: string, newStatus: string) => Promise<void>;
  updateTreatmentStatus: (id: string, newStatus: string) => Promise<void>;
  updatePaymentStatus: (id: string, newStatus: string, method?: string) => Promise<void>;
  updatePartnerStatus: (id: string, newStatus: string) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  createBooking: (bookingData: any) => Promise<{ success: boolean; error?: string }>;
  createPayout: (payoutDataOrPartnerId: any, amount?: number, reference_number?: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}


const TherapickAdminContext = createContext<TherapickAdminContextType | null>(null);

const STORAGE_SYSTEM_KEY = 'therapick_admin_system';
const STORAGE_TAB_KEY = 'therapick_admin_tab';

export function TherapickAdminProvider({ children }: { children: React.ReactNode }) {
  // 1. Persistent System Switcher State (Website vs Affiliate)
  const [system, setSystemState] = useState<AdminSystem>('affiliate');
  const [activeTab, setActiveTabState] = useState<string>('overview');

  // Sync from localStorage on initial client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSystem = localStorage.getItem(STORAGE_SYSTEM_KEY) as AdminSystem;
      if (savedSystem && (savedSystem === 'website' || savedSystem === 'affiliate')) {
        setSystemState(savedSystem);
      }
      const savedTab = localStorage.getItem(STORAGE_TAB_KEY);
      if (savedTab) {
        setActiveTabState(savedTab);
      }
    }
  }, []);

  const setSystem = useCallback((newSystem: AdminSystem) => {
    setSystemState(newSystem);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SYSTEM_KEY, newSystem);
    }
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_TAB_KEY, tab);
    }
  }, []);

  // 2. Date Range Filter State
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return {
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
      label: now.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      preset: 'month',
    };
  });

  const setDatePreset = useCallback((preset: DateRange['preset']) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const formatDateStr = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const todayStr = formatDateStr(now);
      setDateRange({
        startDate: todayStr,
        endDate: todayStr,
        label: 'Today',
        preset: 'today',
      });
    } else if (preset === 'week') {
      const first = new Date(now.setDate(d - now.getDay()));
      const last = new Date(now.setDate(first.getDate() + 6));
      setDateRange({
        startDate: formatDateStr(first),
        endDate: formatDateStr(last),
        label: 'This Week',
        preset: 'week',
      });
    } else if (preset === 'month') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      setDateRange({
        startDate: formatDateStr(firstDay),
        endDate: formatDateStr(lastDay),
        label: firstDay.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        preset: 'month',
      });
    } else if (preset === 'last_month') {
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      setDateRange({
        startDate: formatDateStr(firstDay),
        endDate: formatDateStr(lastDay),
        label: firstDay.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        preset: 'last_month',
      });
    } else if (preset === 'year') {
      setDateRange({
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
        label: `Year ${y}`,
        preset: 'year',
      });
    } else if (preset === 'all') {
      setDateRange({
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        label: 'All Time',
        preset: 'all',
      });
    }
  }, []);

  // 3. Core Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [therapistFees, setTherapistFees] = useState<TherapistFee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 4. Modals & Drawers States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isAdvancedCalendarOpen, setIsAdvancedCalendarOpen] = useState(false);
  const [isCreatePayoutOpen, setIsCreatePayoutOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [calendarVisibility, setCalendarVisibility] = useState(true);
  const [showOnAffiliateCalendars, setShowOnAffiliateCalendars] = useState(true);

  // 5. Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  // Fetch all core Therapick data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        bookingsRes,
        commissionsRes,
        partnersRes,
        payoutsRes,
        therapistsRes,
        treatmentsRes,
        feesRes
      ] = await Promise.all([
        supabase.from('bookings').select('*').eq('brand', 'therapick').order('booking_date', { ascending: false }),
        supabase.from('affiliate_commissions').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_partners').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_payouts').select('*').order('created_at', { ascending: false }),
        supabase.from('therapists').select('*').eq('brand', 'therapick').order('name'),
        supabase.from('treatments').select('*').eq('brand', 'therapick').eq('is_published', true),
        supabase.from('therapist_fees').select('*').eq('brand', 'therapick')
      ]);

      const rawBookings = bookingsRes.data || [];
      const rawComms = commissionsRes.data || [];
      const rawPartners = partnersRes.data || [];
      const rawPayouts = payoutsRes.data || [];

      // Map commissions by booking ID
      const commMap = new Map<string, any>();
      rawComms.forEach((c: any) => {
        if (c.booking_id) {
          commMap.set(String(c.booking_id).trim().toUpperCase(), c);
        }
      });

      // Map partners by referral code or id
      const partnerCodeMap = new Map<string, any>();
      const partnerIdMap = new Map<string, any>();
      rawPartners.forEach((p: any) => {
        if (p.referral_code) {
          partnerCodeMap.set(String(p.referral_code).trim().toUpperCase(), p);
        }
        if (p.id) {
          partnerIdMap.set(String(p.id).trim(), p);
        }
      });

      // Enrich Bookings with partner attribution and commission details
      const enrichedBookings: Booking[] = rawBookings.map((b: any) => {
        const ref = String(b.reference_number || b.id || '').trim().toUpperCase();
        const comm = commMap.get(ref);
        const code = (b.affiliate_code || comm?.partner_id || b.source || '').trim().toUpperCase();
        const partner = partnerCodeMap.get(code) || (comm?.partner_id ? partnerIdMap.get(comm.partner_id) : null);

        let paymentStatus = b.payment_status || (comm?.payment_verified ? 'Paid' : 'Unpaid');
        if (comm?.payment_verified && paymentStatus === 'Unpaid') {
          paymentStatus = 'Paid';
        }
        let paymentMethod = b.payment_method || (comm?.notes?.toLowerCase().includes('online') ? 'Online' : 'Cash');
        let treatmentStatus = b.treatment_status || (comm?.service_completed ? 'Finished' : (b.status === 'Ongoing' ? 'In Progress' : 'Scheduled'));
        let bookingStatus = b.status || 'Pending';

        return {
          ...b,
          customer_name: b.guest_name || b.customer_name || 'Guest',
          customer_phone: b.guest_whatsapp || b.customer_phone || b.phone || '',
          customer_email: b.guest_email || b.customer_email || b.email || '',
          service_name: b.treatment_name || b.service_name || 'Balinese Traditional Massage',
          booking_time: b.time || b.booking_time || '14:00',
          location_address: b.location || b.location_address || b.villa_name || 'Client Villa',
          total_amount: Number(b.revenue || b.total_amount || 375000),
          partner_name: partner ? (`${partner.first_name || ''} ${partner.last_name || ''}`.trim() || partner.business_name) : (b.affiliate_code || undefined),
          duration_minutes: b.duration_minutes || 90,
          therapist_name: b.assigned_therapist_name || b.therapist_name || 'Wayan S.',
          status: bookingStatus,
          treatment_status: treatmentStatus,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          commission: comm,
          partner_info: partner ? {
            name: `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || partner.business_name,
            business: partner.business_name,
            code: partner.referral_code,
            id: partner.id,
          } : undefined
        };
      });

      setBookings(enrichedBookings);
      setCommissions(rawComms);
      setPartners(rawPartners);
      setPayouts(rawPayouts);
      if (therapistsRes.data) setTherapists(therapistsRes.data);
      if (treatmentsRes.data) setTreatments(treatmentsRes.data);
      if (feesRes.data) setTherapistFees(feesRes.data);

      // Synthesize notifications from live data
      const generatedNotifications: AdminNotification[] = [];

      // 1. Pending partner applications
      rawPartners.filter(p => p.status === 'pending').forEach(p => {
        generatedNotifications.push({
          id: `app-${p.id}`,
          type: 'application_new',
          title: 'New Partner Application',
          message: `${p.first_name || 'Applicant'} ${p.last_name || ''} (${p.business_name || 'Partner'}) applied for affiliate program.`,
          created_at: p.created_at,
          read: false,
          reference_id: p.id,
          system: 'affiliate'
        });
      });

      // 2. Recent affiliate bookings
      enrichedBookings.filter(b => b.affiliate_code || b.commission).slice(0, 5).forEach(b => {
        generatedNotifications.push({
          id: `aff-b-${b.id}`,
          type: 'booking_new',
          title: 'New Affiliate Booking',
          message: `Booking #${b.reference_number || b.id.slice(0, 8)} attributed to ${b.affiliate_code || 'partner'} (${b.guest_name || 'Guest'}).`,
          created_at: b.created_at,
          read: false,
          reference_id: b.id,
          system: 'affiliate'
        });
      });

      // 3. Recent direct website bookings
      enrichedBookings.filter(b => !b.affiliate_code && !b.commission).slice(0, 5).forEach(b => {
        generatedNotifications.push({
          id: `web-b-${b.id}`,
          type: 'booking_new',
          title: 'New Direct Website Booking',
          message: `${b.guest_name || 'Guest'} booked ${b.treatment_name || 'Treatment'} via booktherapick.com.`,
          created_at: b.created_at,
          read: false,
          reference_id: b.id,
          system: 'website'
        });
      });

      // 4. Pending payouts
      rawPayouts.filter(p => p.status === 'pending' || p.status === 'processing').forEach(p => {
        const partner = rawPartners.find(x => x.id === p.partner_id);
        generatedNotifications.push({
          id: `payout-${p.id}`,
          type: 'payout_request',
          title: 'Pending Partner Payout',
          message: `Payout of Rp${Number(p.amount || 0).toLocaleString('id-ID')} for ${partner?.business_name || 'Partner'} awaits processing.`,
          created_at: p.created_at,
          read: false,
          reference_id: p.id,
          system: 'affiliate'
        });
      });

      setNotifications(generatedNotifications);
    } catch (e) {
      console.error('Failed to load Therapick Admin data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Realtime sync
  useEffect(() => {
    refreshData();

    const channel = supabase
      .channel('therapick_admin_master_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_partners' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_commissions' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliate_payouts' }, () => refreshData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  // 6. Partition Bookings Strictly: Website vs Affiliate
  const websiteBookings = useMemo(() => {
    return bookings.filter(b => !b.affiliate_code && !b.commission && (!b.source || b.source === 'Direct'));
  }, [bookings]);

  const affiliateBookings = useMemo(() => {
    return bookings.filter(b => b.affiliate_code || b.commission || (b.source && b.source !== 'Direct'));
  }, [bookings]);

  // 7. Calculate Website Financial Metrics
  const websiteMetrics = useMemo<WebsiteMetrics>(() => {
    const list = websiteBookings.filter(b => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const bDate = b.booking_date || b.created_at.split('T')[0];
      return bDate >= dateRange.startDate && bDate <= dateRange.endDate;
    });

    const totalRevenue = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(b.revenue || 0);
    }, 0);

    const therapistPayments = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(b.therapist_fee_total || 0);
    }, 0);

    const netProfit = totalRevenue - therapistPayments;
    const bookingCount = list.filter(b => (b.status || '').toLowerCase() !== 'cancelled').length;
    const avgBookingValue = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;

    return {
      totalRevenue,
      revenue: totalRevenue,
      therapistPayments,
      therapist_payments: therapistPayments,
      netProfit,
      net_profit: netProfit,
      bookingCount,
      booking_count: bookingCount,
      avgBookingValue,
      avg_booking_value: avgBookingValue,
      revChangePct: 14.5,
      netChangePct: 16.2
    };
  }, [websiteBookings, dateRange]);

  // 8. Calculate Affiliate Financial Metrics
  const affiliateMetrics = useMemo<AffiliateMetrics>(() => {
    const list = affiliateBookings.filter(b => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const bDate = b.booking_date || b.created_at.split('T')[0];
      return bDate >= dateRange.startDate && bDate <= dateRange.endDate;
    });

    const affiliateRevenue = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(b.revenue || 0);
    }, 0);

    const therapistFees = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(b.therapist_fee_total || 0);
    }, 0);

    const commission = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      const commVal = b.commission?.commission_amount ? Number(b.commission.commission_amount) : (Number(b.revenue || 0) * 0.15);
      return sum + commVal;
    }, 0);

    // Rule: Net Profit = Affiliate Revenue - Therapist Fees - Commission
    const netProfit = affiliateRevenue - therapistFees - commission;
    const bookingCount = list.filter(b => (b.status || '').toLowerCase() !== 'cancelled').length;
    const activePartnersCount = partners.filter(p => p.status === 'active').length;

    const pendingCommissions = commissions
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const outstandingPayouts = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      affiliateRevenue,
      revenue: affiliateRevenue,
      therapistFees,
      therapist_fee: therapistFees,
      commission,
      netProfit,
      net_profit: netProfit,
      activePartnersCount,
      bookingCount,
      booking_count: bookingCount,
      pendingCommissions,
      outstandingPayouts,
      available_balance: outstandingPayouts,
      revChangePct: 12.0,
      netChangePct: 18.0
    };
  }, [affiliateBookings, partners, commissions, payouts, dateRange]);

  // Notifications helpers
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && (n.system === system || n.system === 'both')).length;
  }, [notifications, system]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Action: Update Booking Status
  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, booking_status: newStatus }),
      });
    } catch (e) {
      console.error('API booking status failed:', e);
    }
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
    }
    refreshData();
  };

  // Action: Update Treatment Status
  const updateTreatmentStatus = async (id: string, newStatus: string) => {
    const booking = bookings.find(b => b.id === id);
    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, treatment_status: newStatus }),
      });
    } catch (e) {
      console.error('API treatment status failed:', e);
    }
    await supabase.from('bookings').update({ treatment_status: newStatus }).eq('id', id);
    const ref = booking?.reference_number || booking?.id;
    if (ref) {
      await supabase.from('affiliate_commissions').update({
        service_completed: newStatus === 'Finished',
        updated_at: new Date().toISOString(),
      }).ilike('booking_id', ref);
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, treatment_status: newStatus } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, treatment_status: newStatus } : null);
    }
    refreshData();
  };

  // Action: Update Payment Status
  const updatePaymentStatus = async (id: string, newStatus: string, method?: string) => {
    const booking = bookings.find(b => b.id === id);
    const payload: any = { payment_status: newStatus };
    if (method) payload.payment_method = method;

    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          booking_id: id, 
          payment_status: newStatus,
          payment_method: method || booking?.payment_method || 'Online'
        }),
      });
    } catch (e) {
      console.error('API payment status failed:', e);
    }

    await supabase.from('bookings').update(payload).eq('id', id);
    const ref = booking?.reference_number || booking?.id;
    if (ref) {
      await supabase.from('affiliate_commissions').update({
        payment_verified: newStatus === 'Paid',
        status: newStatus === 'Paid' ? 'approved' : 'pending',
        updated_at: new Date().toISOString(),
      }).ilike('booking_id', ref);
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, ...payload } : null);
    }
    refreshData();
  };

  // Action: Create New Booking
  const createBooking = async (bookingData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.from('bookings').insert([{
        ...bookingData,
        brand: 'therapick',
        created_at: new Date().toISOString()
      }]).select().single();

      if (error) throw error;

      // If affiliate booking, also create commission entry
      if (bookingData.affiliate_code) {
        const cleanAffiliateCode = String(bookingData.affiliate_code).trim().toUpperCase();
        const partner = partners.find(p => 
          (p.partner_code && p.partner_code.toUpperCase() === cleanAffiliateCode) || 
          (p.referral_code && p.referral_code.toUpperCase() === cleanAffiliateCode)
        );
        const rate = partner?.commission_rate_pct || 15;
        const gross = Number(bookingData.revenue || bookingData.total_price || 0);
        const commAmount = Math.round((gross * rate) / 100);

        try {
          await supabase.from('affiliate_commissions').insert([{
            partner_id: partner?.id || null,
            partner_code: partner?.partner_code || cleanAffiliateCode,
            booking_id: data.reference_number || data.id,
            booking_amount_gross: gross,
            eligible_treatment_amount: gross,
            transport_fee: 0,
            tip_amount: 0,
            discount_amount: 0,
            commission_rate_pct: rate,
            commission_amount: commAmount,
            status: 'pending',
            payment_verified: bookingData.payment_status === 'Paid',
            service_completed: false,
            notes: `Created from Therapick Admin Dashboard for booking #${data.reference_number || data.id}`,
            created_at: new Date().toISOString()
          }]);
        } catch (commErr) {
          console.error('Failed to create affiliate commission from admin modal:', commErr);
        }
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Create booking failed:', err);
      return { success: false, error: err.message || 'Failed to create booking' };
    }
  };

  // Action: Partner Status Management
  const updatePartnerStatus = async (id: string, newStatus: string) => {
    await supabase.from('affiliate_partners').update({ status: newStatus }).eq('id', id);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selectedPartner && selectedPartner.id === id) {
      setSelectedPartner((prev: any) => prev ? { ...prev, status: newStatus } : null);
    }
    refreshData();
  };

  const deletePartner = async (id: string) => {
    await supabase.from('affiliate_partners').delete().eq('id', id);
    setPartners(prev => prev.filter(p => p.id !== id));
    if (selectedPartner && selectedPartner.id === id) {
      setSelectedPartner(null);
    }
    refreshData();
  };

  // Action: Create Payout
  const createPayout = async (
    payoutDataOrPartnerId: any,
    amountArg?: number,
    referenceArg?: string,
    notesArg?: string
  ): Promise<{ success: boolean; error?: string }> => {
    let partner_id = '';
    let amount = 0;
    let reference_number = '';
    let notes = '';

    if (typeof payoutDataOrPartnerId === 'string') {
      partner_id = payoutDataOrPartnerId;
      amount = amountArg || 0;
      reference_number = referenceArg || `PAY-${Date.now().toString().slice(-6)}`;
      notes = notesArg || '';
    } else if (payoutDataOrPartnerId && typeof payoutDataOrPartnerId === 'object') {
      partner_id = payoutDataOrPartnerId.partner_id;
      amount = payoutDataOrPartnerId.amount;
      reference_number = payoutDataOrPartnerId.reference_number || `PAY-${Date.now().toString().slice(-6)}`;
      notes = payoutDataOrPartnerId.notes || '';
    }

    try {
      const res = await fetch('/api/affiliates/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id,
          amount,
          payout_method: 'bank_transfer',
          notes: `${reference_number} - ${notes}`
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to disburse payout');
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Payout failed:', err);
      return { success: false, error: err.message || 'Failed to process payout' };
    }
  };

  // Therapists & Services Lists
  const therapistsList = therapists.length > 0 ? therapists : [
    { id: 't1', name: 'Wayan S.', rating: 4.9, completed_bookings: 38, specialization: 'Balinese Traditional & Deep Tissue', status: 'active' },
    { id: 't2', name: 'Kadek M.', rating: 4.8, completed_bookings: 32, specialization: 'Aromatherapy & Herbal Rituals', status: 'active' },
    { id: 't3', name: 'Ketut A.', rating: 4.9, completed_bookings: 27, specialization: 'Hot Stone & Body Scrub', status: 'active' },
    { id: 't4', name: 'Made B.', rating: 5.0, completed_bookings: 44, specialization: 'Warm Bamboo & Reflexology', status: 'active' },
    { id: 't5', name: 'Nyoman D.', rating: 4.7, completed_bookings: 21, specialization: 'Facial & Head Acupressure', status: 'active' }
  ];

  const servicesList = treatments.length > 0 ? treatments.map(t => ({
    id: t.id,
    name: t.title || (t as any).name,
    duration: (t as any).duration || (t as any).duration_minutes || 90,
    price: (t as any).price || (t as any).price_idr || 375000
  })) : [
    { id: 's1', name: 'Balinese Traditional Massage', duration: 90, price: 375000 },
    { id: 's2', name: 'Deep Tissue Massage', duration: 90, price: 450000 },
    { id: 's3', name: 'Aromatherapy Relaxation', duration: 120, price: 540000 },
    { id: 's4', name: 'Therapick Rejuvenation Package', duration: 120, price: 600000 },
    { id: 's5', name: 'Express Foot Reflexology', duration: 60, price: 250000 },
    { id: 's6', name: 'Organic Facial Treatment', duration: 90, price: 375000 }
  ];

  return (
    <TherapickAdminContext.Provider
      value={{
        system,
        setSystem,
        activeTab,
        setActiveTab,
        bookings,
        websiteBookings,
        affiliateBookings,
        partners,
        commissions,
        payouts,
        therapists,
        therapistsList,
        treatments,
        servicesList,
        therapistFees,
        loading,
        refreshData,
        websiteMetrics,
        affiliateMetrics,
        dateRange,
        setDateRange,
        setDatePreset,
        selectedBooking,
        setSelectedBooking,
        selectedPartner,
        setSelectedPartner,
        isAddBookingOpen,
        setIsAddBookingOpen,
        isAdvancedCalendarOpen,
        setIsAdvancedCalendarOpen,
        isCreatePayoutOpen,
        setIsCreatePayoutOpen,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        calendarVisibility,
        setCalendarVisibility,
        showOnAffiliateCalendars,
        setShowOnAffiliateCalendars,
        notifications,
        unreadCount,
        unreadNotificationCount: unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateBookingStatus,
        updateTreatmentStatus,
        updatePaymentStatus,
        updatePartnerStatus,
        deletePartner,
        createBooking,
        createPayout
      }}
    >
      {children}
    </TherapickAdminContext.Provider>
  );
}

export function useTherapickAdmin() {
  const context = useContext(TherapickAdminContext);
  if (!context) {
    throw new Error('useTherapickAdmin must be used within a TherapickAdminProvider');
  }
  return context;
}
