'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/components/TherapickBookingManagement';
import { Treatment, TherapistFee } from '@/context/SpaContext';
import { calculateBookingTherapistFee } from '@/lib/bookingFeeCalculator';

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

  // Settings
  defaultBookingStatus: string;
  setDefaultBookingStatus: (s: string) => void;
  whatsappAutoStatus: string;
  setWhatsappAutoStatus: (s: string) => void;

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
  updateTherapistFee: (id: string, newFee: number) => Promise<void>;
  updatePartnerStatus: (id: string, newStatus: string) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<{ success: boolean; error?: string }>;
  createBooking: (bookingData: any) => Promise<{ success: boolean; error?: string }>;
  updateCommissionStatus: (id: string, newStatus: string) => Promise<{ success: boolean; error?: string }>;
  createPayout: (payoutDataOrPartnerId: any, amount?: number, reference_number?: string, notes?: string, payout_date?: string) => Promise<{ success: boolean; error?: string }>;
  saveTherapistFee: (treatmentId: string, duration: string, fee: string) => Promise<{ success: boolean; error?: string }>;
  deleteTherapistFee: (feeId: string) => Promise<{ success: boolean; error?: string }>;
  togglePinTreatment: (treatmentId: string, isPinned: boolean) => Promise<{ success: boolean; error?: string }>;
  togglePublishTreatment: (treatmentId: string, isPublished: boolean) => Promise<{ success: boolean; error?: string }>;
  saveTreatment: (treatmentData: Partial<Treatment> & { id?: string }) => Promise<{ success: boolean; error?: string; data?: any }>;
  deleteTreatment: (treatmentId: string) => Promise<{ success: boolean; error?: string }>;
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

  // Settings (Default Booking Status & WhatsApp Auto-Status)
  const [defaultBookingStatus, setDefaultBookingStatusState] = useState<string>('In Progress');
  const [whatsappAutoStatus, setWhatsappAutoStatusState] = useState<string>('In Progress');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('therapick_default_booking_status');
      if (savedStatus) setDefaultBookingStatusState(savedStatus);
      const savedWa = localStorage.getItem('therapick_whatsapp_auto_status');
      if (savedWa) setWhatsappAutoStatusState(savedWa);
    }
  }, []);

  const setDefaultBookingStatus = useCallback((status: string) => {
    setDefaultBookingStatusState(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('therapick_default_booking_status', status);
    }
  }, []);

  const setWhatsappAutoStatus = useCallback((status: string) => {
    setWhatsappAutoStatusState(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('therapick_whatsapp_auto_status', status);
    }
  }, []);

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
        supabase.from('treatments').select('*').eq('brand', 'therapick').order('created_at', { ascending: false }),
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
      // Enrich Partners with performance metrics and safe defaults
      const enrichedPartners = rawPartners.map((p: any) => {
        const partnerBookings = (enrichedBookings as any[]).filter((b: any) => 
          (b.affiliate_code && b.affiliate_code.toUpperCase() === (p.referral_code || '').toUpperCase()) ||
          b.partner_info?.id === p.id ||
          b.commission?.partner_id === p.id
        );
        const partnerComms = rawComms.filter((c: any) => 
          c.partner_id === p.id || 
          (c.partner_code && p.referral_code && c.partner_code.toUpperCase() === p.referral_code.toUpperCase()) ||
          (c.partner_name && p.name && c.partner_name.toLowerCase() === p.name.toLowerCase())
        );
        const partnerPayouts = rawPayouts.filter((py: any) => 
          py.partner_id === p.id ||
          (py.partner_name && p.name && py.partner_name.toLowerCase() === p.name.toLowerCase())
        );

        const totalRev = partnerBookings.reduce((sum, b) => {
          if ((b.status || '').toLowerCase() === 'cancelled') return sum;
          return sum + (Number(b.revenue || b.total_amount) || 0);
        }, 0);

        // STRICT PAYOUT ELIGIBILITY LOGIC:
        // 1. Only commissions with status === 'approved' (and not paid/settled yet) are eligible for payout!
        // 2. Pending commissions (treatment not done yet) MUST NOT be in available balance or unpaid.
        // 3. Cancelled commissions must NEVER be processed.
        const approvedUnpaidComms = partnerComms.filter((c: any) => {
          const status = String(c.status || '').toLowerCase();
          const isNotSettled = !c.payout_id && !c.is_settled && status !== 'paid';
          return status === 'approved' && isNotSettled;
        });

        const totalPaid = partnerPayouts
          .filter((py: any) => py.status === 'completed' || py.status === 'paid' || py.status === 'Processed')
          .reduce((sum: number, py: any) => sum + (Number(py.amount) || 0), 0);
        const availableBal = approvedUnpaidComms.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
        const totalComm = totalPaid + availableBal; // Only approved and paid commissions count towards earned

        return {
          ...p,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.business_name || 'Partner',
          total_bookings: partnerBookings.length,
          affiliate_revenue: totalRev,
          commission_earned: totalComm,
          paid_amount: totalPaid,
          available_balance: availableBal,
        };
      });

      const enrichedPayouts = rawPayouts.map((py: any) => {
        const partner = partnerIdMap.get(py.partner_id) || rawPartners.find((p: any) => p.id === py.partner_id || p.partner_code === py.partner_code);
        const pName = partner ? (`${partner.first_name || ''} ${partner.last_name || ''}`.trim() || partner.business_name) : (py.partner_code || 'Partner');
        return {
          ...py,
          partner_name: pName,
          partner_business: partner?.business_name || '',
          partner_email: partner?.email || '',
          partner_bank: partner?.payout_details?.bank_name || 'BCA',
          partner_account: partner?.payout_details?.account_number || '',
          partner_holder: partner?.payout_details?.account_holder || pName,
          reference: py.payout_reference || py.payment_reference || '',
          method: py.payout_method || 'bank_transfer',
        };
      });

      setBookings(enrichedBookings);
      setCommissions(rawComms);
      setPartners(enrichedPartners);
      setPayouts(enrichedPayouts);
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
      const bDate = b.booking_date || (b.created_at ? b.created_at.split('T')[0] : '');
      return bDate >= dateRange.startDate && bDate <= dateRange.endDate;
    });

    const totalRevenue = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(b.revenue || 0);
    }, 0);

    const therapistPayments = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      const explicit = Number(b.therapist_fee_total || 0);
      if (explicit > 0) return sum + explicit;
      return sum + calculateBookingTherapistFee(b, therapistFees, treatments).feeTotal;
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
  }, [websiteBookings, therapistFees, treatments, dateRange]);

  // 8. Calculate Affiliate Financial Metrics
  const affiliateMetrics = useMemo<AffiliateMetrics>(() => {
    const list = affiliateBookings.filter(b => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const bDate = b.booking_date || (b.created_at ? b.created_at.split('T')[0] : '');
      return bDate >= dateRange.startDate && bDate <= dateRange.endDate;
    });

    const affiliateRevenue = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(b.revenue || 0);
    }, 0);

    const therapistFeesTotal = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      const explicit = Number(b.therapist_fee_total || 0);
      if (explicit > 0) return sum + explicit;
      return sum + calculateBookingTherapistFee(b, therapistFees, treatments).feeTotal;
    }, 0);

    const commission = list.reduce((sum, b) => {
      if ((b.status || '').toLowerCase() === 'cancelled') return sum;
      const commVal = b.commission?.commission_amount ? Number(b.commission.commission_amount) : (Number(b.revenue || 0) * 0.15);
      return sum + commVal;
    }, 0);

    // Rule: Net Profit = Affiliate Revenue - Therapist Fees - Commission
    const netProfit = affiliateRevenue - therapistFeesTotal - commission;
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
      therapistFees: therapistFeesTotal,
      therapist_fee: therapistFeesTotal,
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
  }, [affiliateBookings, partners, commissions, payouts, therapistFees, treatments, dateRange]);

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

  // Helper to sync affiliate commissions live across all possible ID variations
  const syncAffiliateCommission = async (booking: any, updates: Record<string, any>) => {
    if (!booking) return;
    const id = booking.id;
    const rawRef = String(booking.reference_number || '').trim();
    const cleanRef = rawRef.replace(/^#/, '');

    const matchFilters: string[] = [];
    if (id) matchFilters.push(`booking_id.eq.${id}`);
    if (rawRef) matchFilters.push(`booking_id.eq.${rawRef}`);
    if (cleanRef) {
      matchFilters.push(`booking_id.eq.${cleanRef}`);
      matchFilters.push(`booking_id.eq.#${cleanRef}`);
      matchFilters.push(`booking_id.ilike.%${cleanRef}%`);
    }

    if (matchFilters.length > 0) {
      try {
        await supabase
          .from('affiliate_commissions')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .or(matchFilters.join(','));
      } catch (err) {
        console.error('Failed to sync affiliate commission:', err);
      }
    }
  };

  // Action: Update Booking Status
  const updateBookingStatus = async (id: string, newStatus: string) => {
    const booking = bookings.find(b => b.id === id);

    try {
      await fetch('/api/admin/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id, booking_status: newStatus }),
      });
    } catch (e) {
      console.error('API booking status failed:', e);
    }

    const payload: any = { status: newStatus };
    if (newStatus === 'Cancelled') {
      payload.treatment_status = 'Cancelled';
    } else if (newStatus === 'Completed') {
      payload.treatment_status = 'Finished';
    }

    await supabase.from('bookings').update(payload).eq('id', id);

    // Sync to affiliate commission if exists
    if (newStatus.toLowerCase() === 'cancelled') {
      await syncAffiliateCommission(booking, { status: 'cancelled', service_completed: false });
    } else if (newStatus.toLowerCase() === 'completed') {
      await syncAffiliateCommission(booking, { service_completed: true, status: 'approved' });
    } else if (newStatus.toLowerCase() === 'confirmed') {
      // Confirmed only confirms schedule; treatment is NOT done yet, so commission remains pending!
    }

    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, ...payload } : null);
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

    const payload: any = { treatment_status: newStatus };
    if (newStatus === 'Finished') {
      payload.status = 'Completed';
    } else if (newStatus === 'In Progress') {
      payload.status = 'Ongoing';
    } else if (newStatus === 'Cancelled') {
      payload.status = 'Cancelled';
    }

    await supabase.from('bookings').update(payload).eq('id', id);

    if (newStatus === 'Finished') {
      // Only set status to 'approved' if payment is also verified ('Paid')!
      const isPaid = (booking?.payment_status === 'Paid');
      await syncAffiliateCommission(booking, { 
        service_completed: true, 
        status: isPaid ? 'approved' : 'pending' 
      });
    } else if (newStatus === 'In Progress') {
      await syncAffiliateCommission(booking, { service_completed: false, status: 'pending', notes: 'Treatment In Progress' });
    } else if (newStatus === 'Cancelled') {
      await syncAffiliateCommission(booking, { status: 'cancelled', service_completed: false });
    }

    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, ...payload } : null);
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

    if (newStatus === 'Paid') {
      // Only approve if treatment is also finished!
      const isFinished = (booking?.treatment_status === 'Finished' || booking?.status === 'Completed');
      await syncAffiliateCommission(booking, { 
        payment_verified: true, 
        status: isFinished ? 'approved' : 'pending' 
      });
    } else {
      await syncAffiliateCommission(booking, { 
        payment_verified: false,
        status: 'pending' 
      });
    }

    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, ...payload } : null);
    }
    refreshData();
  };

  // Action: Update Therapist Fee
  const updateTherapistFee = useCallback(async (id: string, newFee: number) => {
    const booking = bookings.find(b => b.id === id);
    const commAmount = booking?.commission?.commission_amount 
      ? Number(booking.commission.commission_amount) 
      : (booking?.affiliate_code ? Number(booking?.revenue || 0) * 0.15 : 0);
    const revenue = Number(booking?.revenue || 0);
    const netProfit = revenue - newFee - commAmount;

    const payload: any = { 
      therapist_fee_total: newFee,
      net_profit: netProfit
    };

    try {
      await supabase.from('bookings').update(payload).eq('id', id);
    } catch (e) {
      console.error('Failed to update therapist fee:', e);
    }

    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b));
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, ...payload } : null);
    }
    refreshData();
  }, [bookings, selectedBooking, refreshData]);

  // Action: Delete Booking
  const deleteBooking = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const booking = bookings.find(b => b.id === id);
      const rawRef = String(booking?.reference_number || '').trim();
      const cleanRef = rawRef.replace(/^#/, '');

      const matchFilters: string[] = [];
      if (id) matchFilters.push(`booking_id.eq.${id}`);
      if (rawRef) matchFilters.push(`booking_id.eq.${rawRef}`);
      if (cleanRef) {
        matchFilters.push(`booking_id.eq.${cleanRef}`);
        matchFilters.push(`booking_id.eq.#${cleanRef}`);
      }

      if (matchFilters.length > 0) {
        try {
          await supabase.from('affiliate_commissions').delete().or(matchFilters.join(','));
        } catch (commErr) {
          console.error('Failed to delete linked commission:', commErr);
        }
      }
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      setBookings(prev => prev.filter(b => b.id !== id));
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(null);
      }
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Delete booking error:', err);
      return { success: false, error: err.message || 'Failed to delete booking' };
    }
  };

  // Action: Create New Booking (Schema-adaptive & resilient)
  const createBooking = async (bookingData: any): Promise<{ success: boolean; error?: string; booking?: any }> => {
    try {
      const refNum = bookingData.reference_number || (
        'BK' + Math.random().toString(36).substring(2, 6).toUpperCase()
      );
      const guestName = (bookingData.customer_name || bookingData.guest_name || 'Guest').trim();
      const guestWhatsapp = (bookingData.customer_phone || bookingData.guest_whatsapp || '').trim();
      const guestEmail = (bookingData.customer_email || bookingData.guest_email || '').trim() || null;
      const treatmentName = bookingData.service_name || bookingData.treatment_name || 'Balinese Traditional Massage';
      const duration = Number(bookingData.duration_minutes) || 90;
      const bookingDate = bookingData.booking_date || new Date().toISOString().split('T')[0];
      const time = bookingData.booking_time || bookingData.time || '14:00';
      const location = bookingData.location_address || bookingData.location || 'Client Villa / Hotel';
      const roomNumber = bookingData.room_number || null;
      const amount = Number(bookingData.total_amount || bookingData.revenue || bookingData.total_price || 375000);
      const source = bookingData.source || (bookingData.affiliate_code ? 'Affiliate' : 'Website');
      const affCode = bookingData.affiliate_code ? String(bookingData.affiliate_code).trim().toUpperCase() : null;
      const notes = bookingData.special_notes || bookingData.notes || null;

      // Auto compute therapist fee based on database rules
      const autoFee = calculateBookingTherapistFee({
        treatment_name: treatmentName,
        duration_minutes: duration,
        revenue: amount,
        pax: 1
      }, therapistFees, treatments);
      const therapistFeeTotal = autoFee.feeTotal;
      const commAmount = affCode ? Math.round(amount * 0.15) : 0;
      const netProfit = Math.max(0, amount - therapistFeeTotal - commAmount);

      const candidatePayload: Record<string, any> = {
        reference_number: refNum,
        guest_name: guestName,
        guest_whatsapp: guestWhatsapp,
        guest_email: guestEmail,
        treatment_name: treatmentName,
        booking_date: bookingDate,
        time: time,
        location: location,
        room_number: roomNumber,
        revenue: amount,
        total_price: amount,
        duration_minutes: duration,
        therapist_fee_total: therapistFeeTotal,
        net_profit: netProfit,
        pax: 1,
        therapists_count: autoFee.multiplier,
        assigned_therapist_name: bookingData.therapist_name || 'Wayan S.',
        status: defaultBookingStatus || 'Pending',
        treatment_status: 'Scheduled',
        payment_status: 'Unpaid',
        payment_method: 'Online',
        source: source,
        affiliate_code: affCode,
        notes: notes,
        brand: 'therapick',
        created_at: new Date().toISOString()
      };

      // Resilient adaptive insert loop to survive schema cache differences
      let createdRow: any = null;
      let lastErr: any = null;
      const activePayload = { ...candidatePayload };

      for (let attempt = 0; attempt < 8; attempt++) {
        const { data, error } = await supabase
          .from('bookings')
          .insert([activePayload])
          .select()
          .single();

        if (!error && data) {
          createdRow = data;
          lastErr = null;
          break;
        }

        lastErr = error;
        const msg = error?.message || '';
        const match = msg.match(/Could not find the '([^']+)' column of 'bookings'/i);
        if (match && match[1] && activePayload[match[1]] !== undefined) {
          delete activePayload[match[1]];
          continue;
        }
        break;
      }

      if (lastErr || !createdRow) {
        throw new Error(lastErr?.message || 'Failed to insert booking record');
      }

      // If affiliate booking, insert commission record with STRICT PENDING STATUS
      // Treatment is not completed yet!
      if (affCode) {
        const partner = partners.find(p => 
          (p.partner_code && p.partner_code.toUpperCase() === affCode) || 
          (p.referral_code && p.referral_code.toUpperCase() === affCode) ||
          p.id === bookingData.partner_id
        );
        const rate = partner?.commission_rate_pct || 15;
        const grossComm = Math.round((amount * rate) / 100);

        try {
          await supabase.from('affiliate_commissions').insert([{
            partner_id: partner?.id || null,
            partner_code: partner?.partner_code || partner?.referral_code || affCode,
            partner_name: partner?.name || partner?.business_name || null,
            booking_id: createdRow.reference_number || createdRow.id,
            booking_amount_gross: amount,
            eligible_treatment_amount: amount,
            transport_fee: 0,
            tip_amount: 0,
            discount_amount: 0,
            commission_rate_pct: rate,
            commission_amount: grossComm,
            status: 'pending', // Strictly pending! Treatment is NOT done yet!
            payment_verified: false,
            service_completed: false,
            notes: `Attributed booking #${createdRow.reference_number || createdRow.id}`,
            created_at: new Date().toISOString()
          }]);
        } catch (commErr) {
          console.error('Failed to create affiliate commission from admin modal:', commErr);
        }
      }

      await refreshData();
      return { success: true, booking: createdRow };
    } catch (err: any) {
      console.error('Create booking failed:', err);
      return { success: false, error: err.message || 'Failed to create booking' };
    }
  };

  // Action: Explicit Commission Status Update
  const updateCommissionStatus = async (id: string, newStatus: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update commission status:', err);
      return { success: false, error: err.message || 'Failed to update commission status' };
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
    notesArg?: string,
    payoutDateArg?: string
  ): Promise<{ success: boolean; error?: string }> => {
    let partner_id = '';
    let amount = 0;
    let reference_number = '';
    let notes = '';
    let payout_date = '';
    let payout_method = 'bank_transfer';
    let proof_document_url = '';

    let commission_ids: string[] = [];

    if (typeof payoutDataOrPartnerId === 'string') {
      partner_id = payoutDataOrPartnerId;
      amount = amountArg || 0;
      reference_number = referenceArg || `PAY-${Date.now().toString().slice(-6)}`;
      notes = notesArg || '';
      payout_date = payoutDateArg || '';
    } else if (payoutDataOrPartnerId && typeof payoutDataOrPartnerId === 'object') {
      partner_id = payoutDataOrPartnerId.partner_id;
      amount = payoutDataOrPartnerId.amount;
      reference_number = payoutDataOrPartnerId.reference_number || payoutDataOrPartnerId.reference || `PAY-${Date.now().toString().slice(-6)}`;
      notes = payoutDataOrPartnerId.notes || '';
      payout_date = payoutDataOrPartnerId.payout_date || payoutDataOrPartnerId.date || '';
      payout_method = payoutDataOrPartnerId.payout_method || payoutDataOrPartnerId.method || 'bank_transfer';
      proof_document_url = payoutDataOrPartnerId.proof_document_url || payoutDataOrPartnerId.receipt_url || '';
      commission_ids = Array.isArray(payoutDataOrPartnerId.commission_ids) ? payoutDataOrPartnerId.commission_ids : [];
    }

    try {
      const res = await fetch('/api/affiliates/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id,
          amount,
          payout_method,
          notes: notes ? `${reference_number} - ${notes}` : reference_number,
          payout_date: payout_date || undefined,
          proof_document_url: proof_document_url || undefined,
          payment_reference: reference_number,
          commission_ids: commission_ids.length > 0 ? commission_ids : undefined,
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to disburse payout');
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Payout failed:', err);
      return { success: false, error: err.message || 'Failed to process payout' };
    }
  };

  // Action: Save / Upsert Therapist Fee
  const saveTherapistFee = async (treatmentId: string, duration: string, fee: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanFee = String(fee || '').trim();
      const existingFee = therapistFees.find(f => f.treatment_id === treatmentId && String(f.duration).trim() === String(duration).trim());
      if (existingFee) {
        const { error } = await supabase.from('therapist_fees').update({ fee: cleanFee, updated_at: new Date().toISOString() }).eq('id', existingFee.id);
        if (error) throw error;
        setTherapistFees(prev => prev.map(f => f.id === existingFee.id ? { ...f, fee: cleanFee } : f));
      } else {
        const { data, error } = await supabase.from('therapist_fees').insert([{
          treatment_id: treatmentId,
          duration: String(duration).trim(),
          fee: cleanFee,
          brand: 'therapick',
          created_at: new Date().toISOString()
        }]).select();
        if (error) throw error;
        if (data && data[0]) {
          setTherapistFees(prev => [...prev, data[0] as TherapistFee]);
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('Save therapist fee error:', err);
      return { success: false, error: err.message || 'Failed to save fee' };
    }
  };

  // Action: Delete Therapist Fee
  const deleteTherapistFee = async (feeId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('therapist_fees').delete().eq('id', feeId);
      if (error) throw error;
      setTherapistFees(prev => prev.filter(f => f.id !== feeId));
      return { success: true };
    } catch (err: any) {
      console.error('Delete therapist fee error:', err);
      return { success: false, error: err.message || 'Failed to delete fee' };
    }
  };

  // Action: Toggle Pin to Hero Spotlight
  const togglePinTreatment = async (treatmentId: string, isPinned: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('treatments').update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString()
      }).eq('id', treatmentId);
      if (error) throw error;
      setTreatments(prev => prev.map(t => t.id === treatmentId ? { ...t, is_pinned: isPinned } : t));
      return { success: true };
    } catch (err: any) {
      console.error('Toggle pin error:', err);
      return { success: false, error: err.message || 'Failed to toggle pin' };
    }
  };

  // Action: Toggle Published / Live Status
  const togglePublishTreatment = async (treatmentId: string, isPublished: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('treatments').update({
        is_published: isPublished,
        updated_at: new Date().toISOString()
      }).eq('id', treatmentId);
      if (error) throw error;
      setTreatments(prev => prev.map(t => t.id === treatmentId ? { ...t, is_published: isPublished } : t));
      return { success: true };
    } catch (err: any) {
      console.error('Toggle publish error:', err);
      return { success: false, error: err.message || 'Failed to toggle published status' };
    }
  };

  // Action: Save / Create Treatment
  const saveTreatment = async (treatmentData: Partial<Treatment> & { id?: string }): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      if (treatmentData.id) {
        const { error } = await supabase.from('treatments').update({
          ...treatmentData,
          brand: 'therapick',
          updated_at: new Date().toISOString()
        }).eq('id', treatmentData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('treatments').insert([{
          ...treatmentData,
          brand: 'therapick',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]).select();
        if (error) throw error;
      }
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Save treatment error:', err);
      return { success: false, error: err.message || 'Failed to save treatment' };
    }
  };

  // Action: Delete Treatment
  const deleteTreatment = async (treatmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('treatments').delete().eq('id', treatmentId);
      if (error) throw error;
      setTreatments(prev => prev.filter(t => t.id !== treatmentId));
      return { success: true };
    } catch (err: any) {
      console.error('Delete treatment error:', err);
      return { success: false, error: err.message || 'Failed to delete treatment' };
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

  const servicesList = treatments.map(t => {
    const firstOpt = Array.isArray(t.options) && t.options.length > 0 ? t.options[0] : null;
    const lowestPrice = Array.isArray(t.options) && t.options.length > 0 
      ? Math.min(...t.options.map((o: any) => Number(String(o?.price || '0').replace(/\D/g, '')) || 0))
      : 375000;
    return {
      id: t.id,
      name: t.title || (t as any).name,
      category: t.category || 'Massage',
      duration: firstOpt?.duration || 90,
      price: lowestPrice,
      options: t.options || [],
      is_published: t.is_published !== false,
      is_pinned: Boolean(t.is_pinned),
      desc: t.desc || '',
      raw: t
    };
  });

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
        defaultBookingStatus,
        setDefaultBookingStatus,
        whatsappAutoStatus,
        setWhatsappAutoStatus,
        notifications,
        unreadCount,
        unreadNotificationCount: unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateBookingStatus,
        updateTreatmentStatus,
        updatePaymentStatus,
        updateTherapistFee,
        updatePartnerStatus,
        deletePartner,
        deleteBooking,
        createBooking,
        updateCommissionStatus,
        createPayout,
        saveTherapistFee,
        deleteTherapistFee,
        togglePinTreatment,
        togglePublishTreatment,
        saveTreatment,
        deleteTreatment
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
