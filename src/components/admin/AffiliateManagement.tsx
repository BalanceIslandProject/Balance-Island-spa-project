'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Copy, 
  X,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const safeFormatDate = (rawDate: string | undefined | null, options?: Intl.DateTimeFormatOptions) => {
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
        return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' });
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' });
    }
  } catch {}
  return String(rawDate);
};

// Reusable refined status badge component (color ONLY where meaningful)
const StatusBadge = ({ status }: { status: string }) => {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {s === 'active' ? 'Active' : 'Approved'}
      </span>
    );
  }
  if (s === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending
      </span>
    );
  }
  if (s === 'paid' || s === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-900 text-white shadow-2xs">
        <CheckCircle2 size={11} className="text-white" />
        {s === 'paid' ? 'Paid' : 'Completed'}
      </span>
    );
  }
  if (s === 'suspended' || s === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        {s === 'suspended' ? 'Suspended' : 'Inactive'}
      </span>
    );
  }
  if (s === 'rejected' || s === 'declined' || s === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {s === 'declined' ? 'Declined' : s === 'rejected' ? 'Rejected' : 'Failed'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 capitalize">
      {status}
    </span>
  );
};

// Reusable Pagination component
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = 'records',
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  label?: string;
}) => {
  if (totalItems <= pageSize) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-200 text-xs">
      <div className="text-neutral-500">
        Showing <span className="font-semibold text-neutral-900">{start}–{end}</span> of{' '}
        <span className="font-semibold text-neutral-900">{totalItems}</span> {label}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-7 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium transition-colors inline-flex items-center gap-1"
        >
          <ChevronLeft size={13} />
          <span>Prev</span>
        </button>
        <span className="px-2 text-neutral-500">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-7 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium transition-colors inline-flex items-center gap-1"
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default function AffiliateManagement() {
  const [subTab, setSubTab] = useState<'partners' | 'commissions' | 'payouts' | 'settings'>('partners');
  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    default_commission_rate_pct: 15.00,
    cookie_duration_days: 30,
    attribution_model: 'last_touch',
    auto_approve_partners: false,
    is_program_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');
  const [globalPartnerFilter, setGlobalPartnerFilter] = useState('all');
  const [globalPayoutPartnerFilter, setGlobalPayoutPartnerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsDirty, setSettingsDirty] = useState(false);

  // Pagination states (10 items per page)
  const PAGE_SIZE = 10;
  const [partnerPage, setPartnerPage] = useState(1);
  const [commPage, setCommPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Confirmation modal state for consequential actions
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'reactivate' | 'approve' | 'reject' | 'decline_comm';
    id: string;
    name?: string;
  } | null>(null);

  // Payout Modal State with Active Floating Calendar & Approved Selection
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState<{
    partner_id: string;
    amount: string;
    payout_method: string;
    notes: string;
  }>({
    partner_id: '',
    amount: '',
    payout_method: 'bank_transfer',
    notes: '',
  });
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [payoutCalendarYear, setPayoutCalendarYear] = useState(() => new Date().getFullYear());
  const [payoutCalendarMonth, setPayoutCalendarMonth] = useState(() => new Date().getMonth());
  const [payoutSelectedDate, setPayoutSelectedDate] = useState<string | null>(null);
  const [showPastPaidInPayoutModal, setShowPastPaidInPayoutModal] = useState(false);

  // Partner Details Modal State
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<any | null>(null);
  const [partnerActiveTab, setPartnerActiveTab] = useState<'overview' | 'calendar' | 'commissions' | 'payouts'>('overview');
  const [partnerCalendarYear, setPartnerCalendarYear] = useState(() => new Date().getFullYear());
  const [partnerCalendarMonth, setPartnerCalendarMonth] = useState(() => new Date().getMonth());
  const [partnerSelectedDate, setPartnerSelectedDate] = useState<string | null>(null);
  const [partnerCommFilter, setPartnerCommFilter] = useState('all');
  const [partnerNotesInput, setPartnerNotesInput] = useState('');

  // Payout Breakdown Fullscreen Details Modal State
  const [selectedPayoutDetails, setSelectedPayoutDetails] = useState<any | null>(null);

  // Commission rate edit state
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState<number>(15);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [partnersRes, commsRes, payoutsRes, settingsRes] = await Promise.all([
        fetch(`/api/affiliates/admin/partners?status=${partnerStatusFilter}`),
        fetch('/api/affiliates/admin/commissions?status=all'),
        fetch('/api/affiliates/admin/payouts'),
        fetch('/api/affiliates/admin/settings'),
      ]);

      const [pData, cData, pyData, sData] = await Promise.all([
        partnersRes.json(),
        commsRes.json(),
        payoutsRes.json(),
        settingsRes.json(),
      ]);

      if (pData.success) setPartners(pData.partners || []);
      if (cData.success) setCommissions(cData.commissions || []);
      if (pyData.success) setPayouts(pyData.payouts || []);
      if (sData.success && sData.settings) {
        setSettings(sData.settings);
        setSettingsDirty(false);
      }
    } catch (err) {
      console.error('Failed to load affiliate admin data:', err);
      showToast('Error loading affiliate data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [partnerStatusFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setPartnerPage(1);
  }, [searchQuery, partnerStatusFilter]);

  useEffect(() => {
    setCommPage(1);
  }, [commissionStatusFilter, globalPartnerFilter]);

  useEffect(() => {
    setPayoutPage(1);
  }, [globalPayoutPartnerFilter]);

  // Update Partner Status
  const handlePartnerStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
        if (selectedPartnerDetails && selectedPartnerDetails.id === id) {
          setSelectedPartnerDetails((prev: any) => ({ ...prev, status: newStatus }));
        }
        showToast(`Partner status changed to ${newStatus}`, 'success');
      } else {
        showToast(data.message || 'Failed to update partner status', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error updating status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Partner Commission Rate
  const handleSaveCommissionRate = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, commission_rate_pct: newRateValue }),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === id ? { ...p, commission_rate_pct: newRateValue } : p))
        );
        if (selectedPartnerDetails && selectedPartnerDetails.id === id) {
          setSelectedPartnerDetails((prev: any) => ({ ...prev, commission_rate_pct: newRateValue }));
        }
        setEditingRateId(null);
        showToast('Commission rate updated', 'success');
      } else {
        showToast(data.message || 'Failed to update commission rate', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error updating rate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Partner Notes
  const handleSaveNotes = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: partnerNotesInput }),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === id ? { ...p, notes: partnerNotesInput } : p))
        );
        if (selectedPartnerDetails && selectedPartnerDetails.id === id) {
          setSelectedPartnerDetails((prev: any) => ({ ...prev, notes: partnerNotesInput }));
        }
        showToast('Notes saved successfully', 'success');
      } else {
        showToast(data.message || 'Failed to save notes', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error saving notes', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Commission Status / Verifications
  const handleUpdateCommission = async (id: string, updates: any) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setCommissions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        showToast('Commission updated', 'success');
      } else {
        showToast(data.message || 'Failed to update commission', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error updating commission', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Record Payout
  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.partner_id || !payoutForm.amount) return;

    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payoutForm,
          commission_ids: selectedCommissionIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayoutModal(false);
        setPayoutForm({ partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' });
        setSelectedCommissionIds([]);
        setPayoutSelectedDate(null);
        await fetchAllData();
        showToast('Payout recorded successfully', 'success');
      } else {
        showToast(data.message || 'Failed to record payout', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error recording payout', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsDirty(false);
        showToast('Settings saved successfully', 'success');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error saving settings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper: compute independent partner metrics
  const getPartnerMetrics = (p: any) => {
    const pComms = commissions.filter(
      (c) => c.partner_id === p.id || c.partner_code === p.partner_code
    );
    const pPayouts = payouts.filter(
      (py) => py.partner_id === p.id || py.partner_code === p.partner_code
    );

    const totalEarned = pComms
      .filter((c) => c.status !== 'declined' && c.status !== 'cancelled')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const approvedUnpaid = pComms
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const pending = pComms
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const paidComms = pComms
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const totalPaidOut = pPayouts
      .filter((py) => py.status === 'completed' || py.status === 'processing')
      .reduce((sum, py) => sum + Number(py.amount || 0), 0);

    const bookingsCount = pComms.length;

    const sorted = [...pComms].sort((a, b) => {
      const dateA = a.booking_date || a.created_at || '';
      const dateB = b.booking_date || b.created_at || '';
      return dateB.localeCompare(dateA);
    });
    const latestBooking = sorted[0] || null;
    const pendingCount = pComms.filter((c) => c.status === 'pending').length;

    return {
      commissions: pComms,
      payouts: pPayouts,
      totalEarned,
      approvedUnpaid,
      pending,
      paidComms,
      totalPaidOut,
      bookingsCount,
      pendingCount,
      hasNewBooking: pendingCount > 0,
      latestBooking,
    };
  };

  // Open Details Modal on specific tab
  const openPartnerModal = (partner: any, tab: 'overview' | 'calendar' | 'commissions' | 'payouts' = 'overview') => {
    setSelectedPartnerDetails(partner);
    setPartnerActiveTab(tab);
    setPartnerSelectedDate(null);
    setPartnerNotesInput(partner.notes || '');
  };

  // Payout Modal Selected Partner & Commissions
  const payoutSelectedPartner = useMemo(() => {
    return partners.find((item) => item.id === payoutForm.partner_id) || null;
  }, [payoutForm.partner_id, partners]);

  const payoutPartnerCommissions = useMemo(() => {
    if (!payoutForm.partner_id) return [];
    const p = payoutSelectedPartner;
    return commissions.filter(
      (c) => c.partner_id === payoutForm.partner_id || c.partner_code === p?.partner_code
    );
  }, [payoutForm.partner_id, payoutSelectedPartner, commissions]);

  const payoutApprovedCommissions = useMemo(() => {
    return payoutPartnerCommissions.filter((c) => c.status === 'approved');
  }, [payoutPartnerCommissions]);

  const payoutPaidCommissions = useMemo(() => {
    return payoutPartnerCommissions.filter((c) => c.status === 'paid');
  }, [payoutPartnerCommissions]);

  // Group approved commissions by date (YYYY-MM-DD)
  const payoutApprovedByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of payoutApprovedCommissions) {
      const d = c.booking_date || (c.created_at ? c.created_at.split('T')[0] : '');
      if (!d) continue;
      const key = d.includes('T') ? d.split('T')[0] : d;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [payoutApprovedCommissions]);

  // Group all partner commissions by date for calendar indicator dots
  const payoutAllCommsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of payoutPartnerCommissions) {
      const d = c.booking_date || (c.created_at ? c.created_at.split('T')[0] : '');
      if (!d) continue;
      const key = d.includes('T') ? d.split('T')[0] : d;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [payoutPartnerCommissions]);

  const payoutCalendarDaysInMonth = new Date(payoutCalendarYear, payoutCalendarMonth + 1, 0).getDate();
  const payoutCalendarFirstDayOfWeek = new Date(payoutCalendarYear, payoutCalendarMonth, 1).getDay();

  const handleSelectPayoutPartner = (partnerId: string) => {
    const p = partners.find((item) => item.id === partnerId);
    const pComms = commissions.filter(
      (c) => c.partner_id === partnerId || c.partner_code === p?.partner_code
    );
    const approved = pComms.filter((c) => c.status === 'approved');
    const approvedIds = approved.map((c) => c.id);
    const total = approved.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    if (approved.length > 0) {
      const firstDate = approved[0].booking_date || approved[0].created_at;
      if (firstDate) {
        const d = new Date(firstDate);
        if (!isNaN(d.getTime())) {
          setPayoutCalendarYear(d.getFullYear());
          setPayoutCalendarMonth(d.getMonth());
        }
      }
    }

    setSelectedCommissionIds(approvedIds);
    setPayoutSelectedDate(null);
    setPayoutForm({
      partner_id: partnerId,
      amount: total > 0 ? String(total) : '',
      payout_method: p?.payout_method || 'bank_transfer',
      notes: p?.business_name ? `Payout for ${p.business_name}` : `Payout for ${p?.partner_code || ''}`,
    });
  };

  const toggleCommissionSelection = (commId: string) => {
    setSelectedCommissionIds((prev) => {
      const isSelected = prev.includes(commId);
      const next = isSelected ? prev.filter((id) => id !== commId) : [...prev, commId];
      const nextTotal = payoutApprovedCommissions
        .filter((c) => next.includes(c.id))
        .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
      setPayoutForm((f) => ({ ...f, amount: String(nextTotal) }));
      return next;
    });
  };

  const selectAllApproved = () => {
    const allIds = payoutApprovedCommissions.map((c) => c.id);
    setSelectedCommissionIds(allIds);
    const total = payoutApprovedCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
    setPayoutForm((f) => ({ ...f, amount: String(total) }));
  };

  const deselectAllApproved = () => {
    setSelectedCommissionIds([]);
    setPayoutForm((f) => ({ ...f, amount: '0' }));
  };

  // Quick Open Payout Modal pre-filled for partner
  const openQuickPayoutForPartner = (partner: any) => {
    handleSelectPayoutPartner(partner.id);
    setShowPayoutModal(true);
  };

  // Helper to get bookings for a payout
  const getPayoutBookings = (payout: any) => {
    if (!payout) return [];
    let items = commissions.filter((c) => c.payout_id === payout.id);
    if (items.length === 0) {
      items = commissions.filter(
        (c) => (c.partner_id === payout.partner_id || c.partner_code === payout.partner_code) && c.status === 'paid'
      );
    }
    return items;
  };

  // Smart Partner Ranking Algorithm: Partners who get bookings & new bookings are placed at the top!
  const filteredPartners = useMemo(() => {
    const list = partners.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.partner_code?.toLowerCase().includes(q) ||
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.business_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const mA = getPartnerMetrics(a);
      const mB = getPartnerMetrics(b);

      // 1. Partners with NEW/pending bookings come first
      const newA = mA.pendingCount || 0;
      const newB = mB.pendingCount || 0;
      if (newA > 0 || newB > 0) {
        if (newA !== newB) return newB - newA;
      }

      // 2. Partners with bookings come before partners with 0 bookings
      const hasBookingsA = mA.bookingsCount > 0 ? 1 : 0;
      const hasBookingsB = mB.bookingsCount > 0 ? 1 : 0;
      if (hasBookingsA !== hasBookingsB) return hasBookingsB - hasBookingsA;

      // 3. Most recent booking first
      const dateA = mA.latestBooking ? (mA.latestBooking.booking_date || mA.latestBooking.created_at || '') : '';
      const dateB = mB.latestBooking ? (mB.latestBooking.booking_date || mB.latestBooking.created_at || '') : '';
      if (dateA || dateB) {
        if (dateA && dateB) {
          const cmp = dateB.localeCompare(dateA);
          if (cmp !== 0) return cmp;
        } else if (dateA) return -1;
        else if (dateB) return 1;
      }

      // 4. Highest booking count
      if (mA.bookingsCount !== mB.bookingsCount) return mB.bookingsCount - mA.bookingsCount;

      // 5. Default created_at desc
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [partners, searchQuery, commissions, payouts]);

  // Paginated slices
  const paginatedPartners = useMemo(() => {
    const start = (partnerPage - 1) * PAGE_SIZE;
    return filteredPartners.slice(start, start + PAGE_SIZE);
  }, [filteredPartners, partnerPage]);

  const totalPartnerPages = Math.ceil(filteredPartners.length / PAGE_SIZE) || 1;

  // Global commissions filtered for tab 2
  const filteredGlobalCommissions = commissions.filter((c) => {
    if (commissionStatusFilter !== 'all' && c.status !== commissionStatusFilter) return false;
    if (globalPartnerFilter !== 'all' && c.partner_code !== globalPartnerFilter) return false;
    return true;
  });

  const paginatedCommissions = useMemo(() => {
    const start = (commPage - 1) * PAGE_SIZE;
    return filteredGlobalCommissions.slice(start, start + PAGE_SIZE);
  }, [filteredGlobalCommissions, commPage]);

  const totalCommPages = Math.ceil(filteredGlobalCommissions.length / PAGE_SIZE) || 1;

  // Global payouts filtered for tab 3
  const filteredGlobalPayouts = payouts.filter((py) => {
    if (globalPayoutPartnerFilter !== 'all' && py.partner_code !== globalPayoutPartnerFilter) return false;
    return true;
  });

  const paginatedPayouts = useMemo(() => {
    const start = (payoutPage - 1) * PAGE_SIZE;
    return filteredGlobalPayouts.slice(start, start + PAGE_SIZE);
  }, [filteredGlobalPayouts, payoutPage]);

  const totalPayoutPages = Math.ceil(filteredGlobalPayouts.length / PAGE_SIZE) || 1;

  // Platform Summary Metrics (for compact KPI strip)
  const platformSummary = useMemo(() => {
    const activePartners = partners.filter((p) => p.status === 'active').length;
    const pendingPartners = partners.filter((p) => p.status === 'pending').length;
    const totalBookings = commissions.length;
    const unpaidCommissions = commissions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
    const totalPaidOut = payouts
      .filter((py) => py.status === 'completed' || !py.status)
      .reduce((sum, py) => sum + Number(py.amount || 0), 0);

    return {
      activePartners,
      pendingPartners,
      totalBookings,
      unpaidCommissions,
      totalPaidOut,
    };
  }, [partners, commissions, payouts]);

  // Partner metrics for currently selected modal partner
  const activePartnerMetrics = selectedPartnerDetails ? getPartnerMetrics(selectedPartnerDetails) : null;

  // Calendar calculations for selected partner modal
  const partnerMonthBookings = useMemo(() => {
    if (!activePartnerMetrics) return [];
    const prefix = `${partnerCalendarYear}-${String(partnerCalendarMonth + 1).padStart(2, '0')}`;
    return activePartnerMetrics.commissions.filter((c) => {
      const d = c.booking_date || (c.created_at ? c.created_at.split('T')[0] : '');
      return d.startsWith(prefix);
    });
  }, [activePartnerMetrics, partnerCalendarYear, partnerCalendarMonth]);

  const partnerBookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (!activePartnerMetrics) return map;
    for (const c of activePartnerMetrics.commissions) {
      const d = c.booking_date || (c.created_at ? c.created_at.split('T')[0] : '');
      if (!d) continue;
      const key = d.includes('T') ? d.split('T')[0] : d;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [activePartnerMetrics]);

  const calendarDaysInMonth = new Date(partnerCalendarYear, partnerCalendarMonth + 1, 0).getDate();
  const calendarFirstDayOfWeek = new Date(partnerCalendarYear, partnerCalendarMonth, 1).getDay();

  return (
    <div className="space-y-6 text-neutral-900 bg-white min-h-[750px]">
      
      {/* 1. PAGE HEADER: Concise Title, Short Subtext & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Affiliates</h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
              Therapick
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage partners, commission reconciliations, and payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {subTab === 'payouts' ? (
            <button
              type="button"
              onClick={() => {
                setPayoutForm({ partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' });
                setShowPayoutModal(true);
              }}
              className="h-8 px-3.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={13} />
              <span>Record Payout</span>
            </button>
          ) : subTab === 'partners' ? (
            <button
              type="button"
              onClick={() => {
                setPayoutForm({ partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' });
                setShowPayoutModal(true);
              }}
              className="h-8 px-3 bg-white border border-neutral-200 text-neutral-800 rounded-lg text-xs font-medium hover:bg-neutral-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Plus size={13} />
              <span>Record Payout</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. SUMMARY METRICS (Compact SaaS KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Partners */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Partners</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {platformSummary.activePartners} active
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-1.5 font-mono">
            {partners.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {platformSummary.pendingPartners > 0
              ? `${platformSummary.pendingPartners} awaiting review`
              : 'All accounts verified'}
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Bookings</span>
            <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
              Referred
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-1.5 font-mono">
            {platformSummary.totalBookings}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Total bookings attributed
          </div>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Unpaid Balance</span>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              Approved
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-1.5 font-mono">
            {formatIDR(platformSummary.unpaidCommissions)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Ready for settlement
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Paid out</span>
            <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
              {payouts.length} transfers
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 mt-1.5 font-mono">
            {formatIDR(platformSummary.totalPaidOut)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Lifetime disbursements
          </div>
        </div>
      </div>

      {/* 3. UNIFIED TOOLBAR: TABS + SHORT SEARCH + STATUS FILTERS */}
      <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        
        {/* Navigation Subtabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg shrink-0 border border-neutral-200/70 overflow-x-auto">
          {[
            { id: 'partners', label: 'Partners', count: partners.length },
            { id: 'commissions', label: 'Commissions', count: commissions.length },
            { id: 'payouts', label: 'Payouts', count: payouts.length },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/70'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white text-black font-semibold' : 'bg-neutral-200/80 text-neutral-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Controls when on Partners Tab */}
        {subTab === 'partners' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Shorter Search Bar */}
            <div className="relative w-full sm:w-60 md:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner, code, villa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 text-xs overflow-x-auto shrink-0">
              {['all', 'pending', 'active', 'suspended', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPartnerStatusFilter(st)}
                  className={`h-8 px-2.5 rounded-lg capitalize font-medium text-xs transition-colors whitespace-nowrap ${
                    partnerStatusFilter === st
                      ? 'bg-black text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Controls when on Commissions Tab */}
        {subTab === 'commissions' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto text-xs">
            <div className="flex items-center gap-1 overflow-x-auto shrink-0">
              {['all', 'pending', 'approved', 'paid', 'declined'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCommissionStatusFilter(st)}
                  className={`h-8 px-2.5 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                    commissionStatusFilter === st
                      ? 'bg-black text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <select
              value={globalPartnerFilter}
              onChange={(e) => setGlobalPartnerFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:border-black shrink-0"
            >
              <option value="all">All Partners ({partners.length})</option>
              {partners.map((p) => (
                <option key={p.id} value={p.partner_code}>
                  {p.partner_code} - {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Controls when on Payouts Tab */}
        {subTab === 'payouts' && (
          <div className="flex items-center gap-2 w-full lg:w-auto text-xs justify-end">
            <select
              value={globalPayoutPartnerFilter}
              onChange={(e) => setGlobalPayoutPartnerFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:border-black shrink-0"
            >
              <option value="all">All Partners ({partners.length})</option>
              {partners.map((p) => (
                <option key={p.id} value={p.partner_code}>
                  {p.partner_code} - {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setPayoutForm({ partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' });
                setShowPayoutModal(true);
              }}
              className="h-8 px-3 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800 shadow-xs whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>Record Payout</span>
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: PARTNERS (DESKTOP TABLE + RESPONSIVE MOBILE CARDS) */}
      {subTab === 'partners' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Paid out</th>
                    <th className="py-3 px-4">Bookings</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        <div className="max-w-xs mx-auto space-y-1">
                          <p className="font-semibold text-neutral-900">No partners found</p>
                          <p className="text-xs text-neutral-400">
                            {searchQuery ? `No partner records matched "${searchQuery}".` : 'No partners registered in this status category.'}
                          </p>
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="text-xs font-semibold text-neutral-900 hover:underline pt-1 block mx-auto"
                            >
                              Clear search query
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPartners.map((p) => {
                      const metrics = getPartnerMetrics(p);

                      return (
                        <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* 1. Partner: Name and business or villa */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-neutral-900 text-sm">
                              {p.first_name} {p.last_name || ''}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {p.business_name || 'Individual Partner'}
                            </div>
                          </td>

                          {/* 2. Code: Referral code */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-mono font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                {p.partner_code}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {safeFormatDate(p.created_at)}
                              </span>
                            </div>
                          </td>

                          {/* 3. Commission: Commission amount and settlement summary */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-neutral-900 text-xs font-mono">
                                  {formatIDR(metrics.totalEarned)}
                                </span>
                                {metrics.approvedUnpaid > 0 ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                                    {formatIDR(metrics.approvedUnpaid)} unpaid
                                  </span>
                                ) : metrics.pending > 0 ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                    {formatIDR(metrics.pending)} pending
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-neutral-400">Settled</span>
                                )}
                              </div>

                              <div>
                                <button
                                  type="button"
                                  onClick={() => openPartnerModal(p, 'commissions')}
                                  className="h-7 px-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs group"
                                  title="View partner commissions"
                                >
                                  <span>Commissions</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                                    {metrics.commissions.length}
                                  </span>
                                  <span className="text-neutral-400 group-hover:text-neutral-700">&rarr;</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 4. Paid Out: Total paid */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="font-bold text-neutral-900 text-xs font-mono">
                                {formatIDR(metrics.totalPaidOut)}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openPartnerModal(p, 'payouts')}
                                  className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline"
                                >
                                  {metrics.payouts.length} {metrics.payouts.length === 1 ? 'payout' : 'payouts'}
                                </button>
                                {metrics.approvedUnpaid > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => openQuickPayoutForPartner(p)}
                                    className="h-6 px-2 bg-black text-white rounded text-[11px] font-medium hover:bg-neutral-800 transition-colors shadow-2xs"
                                    title="Record payout"
                                  >
                                    + Pay
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. Bookings: Booking count or calendar access */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => openPartnerModal(p, 'calendar')}
                                  className="h-8 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span>Calendar</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                                    {metrics.bookingsCount}
                                  </span>
                                  {metrics.pendingCount > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      {metrics.pendingCount} New
                                    </span>
                                  )}
                                </button>
                              </div>
                              {metrics.latestBooking ? (
                                <div className="text-[10px] text-neutral-400">
                                  Latest: {safeFormatDate(metrics.latestBooking.booking_date || metrics.latestBooking.created_at)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-neutral-400">No bookings yet</div>
                              )}
                            </div>
                          </td>

                          {/* 6. Status: Compact colored status badge */}
                          <td className="py-3.5 px-4 align-top">
                            <StatusBadge status={p.status} />
                          </td>

                          {/* 7. Actions: Details and relevant account action */}
                          <td className="py-3.5 px-4 align-top text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openPartnerModal(p, 'overview')}
                              className="h-8 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg text-xs transition-colors shadow-2xs"
                            >
                              Details
                            </button>
                            {p.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handlePartnerStatus(p.id, 'active')}
                                className="h-8 px-3 bg-black text-white font-medium rounded-lg text-xs hover:bg-neutral-800 shadow-xs"
                              >
                                Approve
                              </button>
                            )}
                            {p.status === 'active' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'suspend',
                                    id: p.id,
                                    name: `${p.first_name} ${p.last_name || ''}`,
                                  })
                                }
                                className="h-8 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg text-xs transition-colors shadow-2xs"
                              >
                                Suspend
                              </button>
                            )}
                            {p.status === 'suspended' && (
                              <button
                                type="button"
                                onClick={() => handlePartnerStatus(p.id, 'active')}
                                className="h-8 px-3 bg-black text-white hover:bg-neutral-800 font-medium rounded-lg text-xs shadow-xs"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (shown on screens < 768px) */}
            <div className="md:hidden divide-y divide-neutral-100">
              {paginatedPartners.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 p-4">
                  <p className="font-semibold text-neutral-900">No partners found</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {searchQuery ? `No partners matched "${searchQuery}".` : 'No partners registered.'}
                  </p>
                </div>
              ) : (
                paginatedPartners.map((p) => {
                  const metrics = getPartnerMetrics(p);
                  return (
                    <div key={p.id} className="p-4 space-y-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-neutral-900 text-sm">
                            {p.first_name} {p.last_name || ''}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {p.business_name || 'Individual Partner'}
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {p.partner_code}
                        </span>
                        <span className="text-neutral-400">
                          Joined {safeFormatDate(p.created_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200/60 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Commission</span>
                          <span className="font-mono font-semibold text-neutral-900">{formatIDR(metrics.totalEarned)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Paid out</span>
                          <span className="font-mono font-semibold text-neutral-900">{formatIDR(metrics.totalPaidOut)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Bookings</span>
                          <span className="font-mono font-semibold text-neutral-900">{metrics.bookingsCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPartnerModal(p, 'calendar')}
                            className="h-8 px-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-medium inline-flex items-center gap-1 shadow-2xs"
                          >
                            <CalendarIcon size={12} />
                            <span>Calendar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openPartnerModal(p, 'commissions')}
                            className="h-8 px-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-medium shadow-2xs"
                          >
                            Comms
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPartnerModal(p, 'overview')}
                            className="h-8 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-medium shadow-2xs"
                          >
                            Details
                          </button>
                          {p.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(p.id, 'active')}
                              className="h-8 px-3 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800"
                            >
                              Approve
                            </button>
                          )}
                          {p.status === 'active' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'suspend',
                                  id: p.id,
                                  name: `${p.first_name} ${p.last_name || ''}`,
                                })
                              }
                              className="h-8 px-3 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-50"
                            >
                              Suspend
                            </button>
                          )}
                          {p.status === 'suspended' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(p.id, 'active')}
                              className="h-8 px-3 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={partnerPage}
              totalPages={totalPartnerPages}
              totalItems={filteredPartners.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPartnerPage}
              label="partners"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: COMMISSIONS */}
      {subTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Gross</th>
                    <th className="py-3 px-4">Treatment Net</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Verifications</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-neutral-500">
                        No commission records found under this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedCommissions.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                          {safeFormatDate(c.booking_date || c.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                          #{c.booking_id}
                          {c.guest_name && (
                            <div className="text-[11px] text-neutral-500 font-sans font-normal">{c.guest_name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              const p = partners.find((item) => item.partner_code === c.partner_code || item.id === c.partner_id);
                              if (p) openPartnerModal(p, 'overview');
                            }}
                            className="font-mono font-medium text-neutral-900 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{c.partner_code}</span>
                            <ArrowUpRight size={11} className="text-neutral-400" />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-neutral-500 font-mono">
                          {formatIDR(c.booking_amount_gross)}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-900 font-mono">
                          {formatIDR(c.eligible_treatment_amount)}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 font-mono">{c.commission_rate_pct}%</td>
                        <td className="py-3 px-4 font-bold text-neutral-900 font-mono">
                          {formatIDR(c.commission_amount)}
                        </td>
                        <td className="py-3 px-4 text-[11px] space-y-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={c.payment_verified}
                              onChange={(e) =>
                                handleUpdateCommission(c.id, { payment_verified: e.target.checked })
                              }
                              className="rounded text-black cursor-pointer"
                            />
                            <span>Paid</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={c.service_completed}
                              onChange={(e) =>
                                handleUpdateCommission(c.id, { service_completed: e.target.checked })
                              }
                              className="rounded text-black cursor-pointer"
                            />
                            <span>Completed</span>
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {c.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
                                className="h-7 px-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-medium shadow-xs"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'decline_comm',
                                    id: c.id,
                                    name: `#${c.booking_id}`,
                                  })
                                }
                                className="h-7 px-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium shadow-2xs"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={commPage}
              totalPages={totalCommPages}
              totalItems={filteredGlobalCommissions.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCommPage}
              label="commissions"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PAYOUTS */}
      {subTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-500">
                        No payout settlements logged yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayouts.map((py) => (
                      <tr key={py.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                          {safeFormatDate(py.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900">{py.payout_reference}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              const p = partners.find((item) => item.partner_code === py.partner_code || item.id === py.partner_id);
                              if (p) openPartnerModal(p, 'overview');
                            }}
                            className="font-mono font-medium text-neutral-900 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{py.partner_code}</span>
                            <ArrowUpRight size={11} className="text-neutral-400" />
                          </button>
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900 font-mono">{formatIDR(py.amount)}</td>
                        <td className="py-3 px-4 capitalize text-neutral-700">{py.payout_method?.replace('_', ' ')}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={py.status || 'completed'} />
                        </td>
                        <td className="py-3 px-4 text-neutral-500">{py.notes || '—'}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedPayoutDetails(py)}
                            className="h-7 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg text-xs transition-colors shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>View Bookings</span>
                            <span className="text-neutral-400">&rarr;</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={payoutPage}
              totalPages={totalPayoutPages}
              totalItems={filteredGlobalPayouts.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPayoutPage}
              label="payouts"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SETTINGS (Clearly Grouped Minimal Form) */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
          
          {/* Group 1: Commission Rules */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Commission Rules</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Baseline revenue-share rules applied to referral earnings.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-800">
                Default Commission Rate (%)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min={1}
                  max={50}
                  step="0.5"
                  value={settings.default_commission_rate_pct}
                  onChange={(e) => {
                    setSettings({ ...settings, default_commission_rate_pct: Number(e.target.value) });
                    setSettingsDirty(true);
                  }}
                  className="w-full h-9 px-3 border border-neutral-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-black"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">%</span>
              </div>
              <p className="text-[11px] text-neutral-400 pt-0.5">
                Applied automatically to newly approved partners. Can be customized per partner in Partner Details.
              </p>
            </div>
          </div>

          {/* Group 2: Program Settings & Attribution */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Program Settings</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Referral cookie duration and attribution logic for visitor bookings.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-800">
                Attribution Window (Days)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={settings.cookie_duration_days}
                  onChange={(e) => {
                    setSettings({ ...settings, cookie_duration_days: Number(e.target.value) });
                    setSettingsDirty(true);
                  }}
                  className="w-full h-9 px-3 border border-neutral-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-black"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">Days</span>
              </div>
              <p className="text-[11px] text-neutral-400 pt-0.5">
                Number of days a referred guest remains linked to the partner after clicking their referral link.
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_program_active}
                  onChange={(e) => {
                    setSettings({ ...settings, is_program_active: e.target.checked });
                    setSettingsDirty(true);
                  }}
                  className="rounded text-black cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">
                    Program Active
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    When active, affiliate referral tracking and code attribution are active across the website.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Group 3: Partner Eligibility */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Partner Eligibility</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Registration approval and onboarding requirements.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_partners}
                  onChange={(e) => {
                    setSettings({ ...settings, auto_approve_partners: e.target.checked });
                    setSettingsDirty(true);
                  }}
                  className="rounded text-black cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">
                    Auto-approve Applications
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Automatically activate new partner accounts upon registration without requiring manual admin approval.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="h-9 px-5 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-xs"
            >
              {actionLoading ? 'Saving...' : 'Save Settings'}
            </button>
            {settingsDirty && (
              <span className="text-xs text-amber-700 font-medium">Unsaved changes</span>
            )}
          </div>
        </form>
      )}

      {/* RECORD PAYOUT MODAL WITH ACTIVE FLOATING CALENDAR & APPROVED REFERRALS SELECTOR */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <form
            onSubmit={handleRecordPayout}
            className="bg-white rounded-2xl w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col border border-neutral-200 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-neutral-200 text-neutral-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-neutral-900 text-base sm:text-lg">Record Payout</h3>
                {payoutSelectedPartner && (
                  <span className="font-mono font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded text-xs border border-neutral-200">
                    {payoutSelectedPartner.partner_code}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedCommissionIds([]);
                  setPayoutSelectedDate(null);
                }}
                className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* 1. Select Partner & Partner Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Select Partner *</label>
                  <select
                    required
                    value={payoutForm.partner_id}
                    onChange={(e) => handleSelectPayoutPartner(e.target.value)}
                    className="w-full h-9 px-3 border border-neutral-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:border-black"
                  >
                    <option value="">-- Choose Partner to Settle --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partner_code} - {p.first_name} {p.last_name} ({p.business_name || 'Individual'})
                      </option>
                    ))}
                  </select>
                </div>

                {payoutSelectedPartner ? (
                  <div className="bg-neutral-50/70 p-3 rounded-xl border border-neutral-200 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Method:</span>
                      <span className="font-medium text-neutral-900 capitalize">{payoutSelectedPartner.payout_method?.replace('_', ' ') || 'Bank Transfer'}</span>
                    </div>
                    {payoutSelectedPartner.payout_details?.bank_name ? (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Bank:</span>
                        <span className="font-mono font-medium text-neutral-900">
                          {payoutSelectedPartner.payout_details.bank_name} - {payoutSelectedPartner.payout_details.account_number} ({payoutSelectedPartner.payout_details.account_holder})
                        </span>
                      </div>
                    ) : (
                      <div className="text-neutral-400">Bank account details not specified</div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-neutral-200">
                      <span className="text-neutral-500">Approved Unpaid:</span>
                      <span className="font-bold text-neutral-900 font-mono">
                        {formatIDR(payoutApprovedCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50/70 p-3 rounded-xl border border-neutral-200 text-[11px] text-neutral-500 flex items-center justify-center">
                    Select a partner to view approved bookings and active calendar
                  </div>
                )}
              </div>

              {/* 2. ACTIVE FLOATING CALENDAR & APPROVED REFERRALS SELECTOR */}
              {payoutForm.partner_id && (
                <div className="space-y-3 pt-2 border-t border-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-2">
                        <span>Active Calendar & Approved Commissions</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                          {selectedCommissionIds.length} of {payoutApprovedCommissions.length} Selected
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Select a date to filter bookings, or check items to include in this payout settlement.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={selectAllApproved}
                        className="h-7 px-2.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllApproved}
                        className="h-7 px-2.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium border border-neutral-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Two-Column Grid: Left = Floating Calendar, Right = Approved Bookings Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white rounded-xl border border-neutral-200 p-3 sm:p-4 shadow-2xs">
                    
                    {/* Left: Active Floating Calendar (5 cols) */}
                    <div className="md:col-span-5 space-y-2.5 border-b md:border-b-0 md:border-r border-neutral-200 pb-3 md:pb-0 md:pr-4">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            if (payoutCalendarMonth === 0) {
                              setPayoutCalendarMonth(11);
                              setPayoutCalendarYear((y) => y - 1);
                            } else {
                              setPayoutCalendarMonth((m) => m - 1);
                            }
                            setPayoutSelectedDate(null);
                          }}
                          className="w-7 h-7 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <div className="font-bold text-neutral-900 text-xs">
                          {MONTH_NAMES[payoutCalendarMonth]} {payoutCalendarYear}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (payoutCalendarMonth === 11) {
                              setPayoutCalendarMonth(0);
                              setPayoutCalendarYear((y) => y + 1);
                            } else {
                              setPayoutCalendarMonth((m) => m + 1);
                            }
                            setPayoutSelectedDate(null);
                          }}
                          className="w-7 h-7 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Mini Month Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-neutral-400 text-[10px]">
                        {DAYS_OF_WEEK.map((d) => (
                          <div key={d} className="py-0.5">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: payoutCalendarFirstDayOfWeek }).map((_, i) => (
                          <div key={`payout-empty-${i}`} className="h-9 rounded-lg bg-neutral-50/50" />
                        ))}

                        {Array.from({ length: payoutCalendarDaysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${payoutCalendarYear}-${String(payoutCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const approvedOnDate = payoutApprovedByDate[dateStr] || [];
                          const isSelected = payoutSelectedDate === dateStr;
                          const hasApproved = approvedOnDate.length > 0;

                          return (
                            <button
                              type="button"
                              key={`payout-date-${dateStr}`}
                              onClick={() => setPayoutSelectedDate(isSelected ? null : dateStr)}
                              className={`h-9 rounded-lg border text-left p-1 flex flex-col justify-between transition-colors ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-xs'
                                  : hasApproved
                                  ? 'bg-emerald-50/60 border-emerald-200 text-neutral-900 hover:border-emerald-300'
                                  : 'bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-400'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : ''}`}>
                                  {dayNum}
                                </span>
                                {hasApproved && (
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                                )}
                              </div>
                              {hasApproved ? (
                                <span className={`text-[8px] font-semibold truncate ${isSelected ? 'text-white' : 'text-emerald-700'}`}>
                                  {approvedOnDate.length} app
                                </span>
                              ) : (
                                <div />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {payoutSelectedDate && (
                        <div className="flex items-center justify-between bg-neutral-50 p-2 rounded-lg text-[11px] border border-neutral-200">
                          <span>Filtered: <strong>{safeFormatDate(payoutSelectedDate)}</strong></span>
                          <button
                            type="button"
                            onClick={() => setPayoutSelectedDate(null)}
                            className="text-neutral-900 underline font-semibold hover:text-neutral-700"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Approved Bookings Checklist (7 cols) */}
                    <div className="md:col-span-7 space-y-2 max-h-72 overflow-y-auto pr-1">
                      {(() => {
                        const displayedApproved = payoutSelectedDate
                          ? payoutApprovedCommissions.filter((c) => {
                              const d = c.booking_date || (c.created_at ? c.created_at.split('T')[0] : '');
                              return d === payoutSelectedDate || d.startsWith(payoutSelectedDate);
                            })
                          : payoutApprovedCommissions;

                        if (displayedApproved.length === 0) {
                          return (
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center text-neutral-500 space-y-1">
                              <p className="font-semibold text-neutral-900">No approved referrals found{payoutSelectedDate ? ' for this date' : ''}.</p>
                              <p className="text-[11px] text-neutral-400">Only bookings with an Approved status can be disbursed.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {displayedApproved.map((c) => {
                              const isChecked = selectedCommissionIds.includes(c.id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => toggleCommissionSelection(c.id)}
                                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                    isChecked
                                      ? 'bg-neutral-50 border-black shadow-2xs'
                                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="rounded text-black cursor-pointer"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-bold text-neutral-900 text-xs">#{c.booking_id}</span>
                                        <span className="text-[10px] text-neutral-400">
                                          {safeFormatDate(c.booking_date || c.created_at)}
                                        </span>
                                        <StatusBadge status="approved" />
                                      </div>
                                      <div className="text-[11px] text-neutral-800 truncate mt-0.5 font-medium">
                                        {c.guest_name || 'Guest'} &bull; {c.treatment_name || 'Treatment'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-bold text-neutral-900 text-xs block">
                                      +{formatIDR(c.commission_amount)}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">
                                      {c.commission_rate_pct}% of {formatIDR(c.eligible_treatment_amount)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Past Paid Out Referrals (Collapsible) */}
                  {payoutPaidCommissions.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPastPaidInPayoutModal((v) => !v)}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5"
                      >
                        <span>{showPastPaidInPayoutModal ? '▼ Hide' : '▶ Show'} Previously Paid Out Referrals ({payoutPaidCommissions.length})</span>
                      </button>

                      {showPastPaidInPayoutModal && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200">
                          {payoutPaidCommissions.map((c) => (
                            <div key={`paid-${c.id}`} className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-lg border border-neutral-200">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-neutral-900">#{c.booking_id}</span>
                                <span className="text-neutral-400">{safeFormatDate(c.booking_date || c.created_at)}</span>
                                <StatusBadge status="paid" />
                              </div>
                              <span className="font-mono font-semibold text-neutral-900">{formatIDR(c.commission_amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Payout Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Payout Amount (IDR) * {selectedCommissionIds.length > 0 && `(Auto-calculated for ${selectedCommissionIds.length} bookings)`}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 750000"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className="w-full h-9 px-3 border border-neutral-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Payment Method</label>
                  <select
                    value={payoutForm.payout_method}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payout_method: e.target.value })}
                    className="w-full h-9 px-3 border border-neutral-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:border-black"
                  >
                    <option value="bank_transfer">Indonesian Bank Transfer</option>
                    <option value="wise">Wise</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash Settlement</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">Notes / Transfer Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. BCA Ref #88392102"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    className="w-full h-9 px-3 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* 4. Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={actionLoading || !payoutForm.partner_id || !payoutForm.amount || Number(payoutForm.amount) <= 0}
                  className="flex-1 h-9 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-xs"
                >
                  {actionLoading ? 'Processing...' : `Confirm Payout (${formatIDR(Number(payoutForm.amount) || 0)})`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setSelectedCommissionIds([]);
                    setPayoutSelectedDate(null);
                  }}
                  className="h-9 px-4 border border-neutral-200 text-xs font-medium rounded-lg hover:bg-neutral-50 text-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* INDEPENDENT PARTNER DETAILS & FULLSCREEN DESKTOP CALENDAR MODAL */}
      {selectedPartnerDetails && activePartnerMetrics && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-2xl w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col border border-neutral-200 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-neutral-200 text-neutral-900 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-neutral-900 text-lg sm:text-xl tracking-tight">
                    {selectedPartnerDetails.first_name} {selectedPartnerDetails.last_name || ''}
                  </h3>
                  <span className="font-mono font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded text-xs border border-neutral-200">
                    {selectedPartnerDetails.partner_code}
                  </span>
                  <StatusBadge status={selectedPartnerDetails.status} />
                </div>
                <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                  {selectedPartnerDetails.business_name && (
                    <span className="text-neutral-800 font-medium">{selectedPartnerDetails.business_name}</span>
                  )}
                  <span>&bull;</span>
                  <span>Rate: <strong className="text-neutral-900 font-mono">{selectedPartnerDetails.commission_rate_pct}%</strong></span>
                  <span>&bull;</span>
                  <span>Joined: {safeFormatDate(selectedPartnerDetails.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPartnerDetails(null)}
                className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-neutral-200 px-4 sm:px-6 pt-2 bg-neutral-50/50 shrink-0 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'calendar', label: 'Calendar', count: activePartnerMetrics.bookingsCount },
                { id: 'commissions', label: 'Commissions', count: activePartnerMetrics.commissions.length },
                { id: 'payouts', label: 'Payouts', count: activePartnerMetrics.payouts.length },
              ].map((tab) => {
                const isActive = partnerActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPartnerActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-black text-black bg-white rounded-t-lg shadow-2xs font-semibold'
                        : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black text-white' : 'bg-neutral-200/80 text-neutral-700'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Tab Content */}
            <div
              className={`flex-1 min-h-0 ${
                partnerActiveTab === 'calendar'
                  ? 'overflow-hidden p-3 sm:p-4 flex flex-col'
                  : 'overflow-y-auto p-4 sm:p-6 space-y-5'
              }`}
            >
              
              {/* TAB A: OVERVIEW & PROFILE */}
              {partnerActiveTab === 'overview' && (
                <div className="space-y-5 text-xs">
                  
                  {/* Financial KPI Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Commission</span>
                      <span className="text-base font-bold text-neutral-900 mt-1 block font-mono">
                        {formatIDR(activePartnerMetrics.totalEarned)}
                      </span>
                      <span className="text-[10px] text-neutral-400">{activePartnerMetrics.commissions.length} referrals</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Unpaid</span>
                      <span className="text-base font-bold text-neutral-900 mt-1 block font-mono">
                        {formatIDR(activePartnerMetrics.approvedUnpaid)}
                      </span>
                      <span className="text-[10px] text-neutral-400">Ready to settle</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Paid out</span>
                      <span className="text-base font-bold text-neutral-900 mt-1 block font-mono">
                        {formatIDR(activePartnerMetrics.totalPaidOut)}
                      </span>
                      <span className="text-[10px] text-neutral-400">{activePartnerMetrics.payouts.length} transfers</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Pending</span>
                      <span className="text-base font-bold text-neutral-900 mt-1 block font-mono">
                        {formatIDR(activePartnerMetrics.pending)}
                      </span>
                      <span className="text-[10px] text-neutral-400">Awaiting service</span>
                    </div>
                  </div>

                  {/* Contact Information & Category Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Contact Details Card */}
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
                      <h4 className="font-bold text-neutral-900 text-xs border-b border-neutral-200 pb-2">
                        Contact Details
                      </h4>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Email Address</span>
                            <a
                              href={`mailto:${selectedPartnerDetails.email}`}
                              className="font-medium text-neutral-900 hover:underline mt-0.5 block"
                            >
                              {selectedPartnerDetails.email}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedPartnerDetails.email, 'email')}
                            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500"
                            title="Copy email"
                          >
                            {copiedId === 'email' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">WhatsApp Direct Chat</span>
                            {selectedPartnerDetails.whatsapp ? (
                              <a
                                href={`https://wa.me/${selectedPartnerDetails.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-neutral-900 hover:underline mt-0.5 block"
                              >
                                {selectedPartnerDetails.whatsapp}
                              </a>
                            ) : (
                              <span className="text-neutral-400">Not provided</span>
                            )}
                          </div>
                          {selectedPartnerDetails.whatsapp && (
                            <a
                              href={`https://wa.me/${selectedPartnerDetails.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 px-2.5 bg-black text-white rounded-md text-xs font-medium hover:bg-neutral-800 inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>Open WA</span>
                              <ArrowUpRight size={11} />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Phone Number</span>
                            {selectedPartnerDetails.phone ? (
                              <a href={`tel:${selectedPartnerDetails.phone}`} className="font-medium text-neutral-900 hover:underline mt-0.5 block">
                                {selectedPartnerDetails.phone}
                              </a>
                            ) : (
                              <span className="text-neutral-400">Not provided</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category & Business Profile Card */}
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
                      <h4 className="font-bold text-neutral-900 text-xs border-b border-neutral-200 pb-2">
                        Business & Category
                      </h4>

                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block">Category</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200 capitalize mt-1">
                            {selectedPartnerDetails.partner_type?.replace('_', ' ') || 'Hotel Villa'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block">Business / Villa Name</span>
                          <span className="font-semibold text-neutral-900 text-xs block mt-0.5">
                            {selectedPartnerDetails.business_name || 'Individual Partner (No Villa)'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-neutral-50/70 border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block">Referral Link</span>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="font-mono text-[11px] text-neutral-800 truncate">
                              https://www.booktherapick.com/?ref={selectedPartnerDetails.partner_code}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(`https://www.booktherapick.com/?ref=${selectedPartnerDetails.partner_code}`, 'link')
                              }
                              className="p-1 rounded bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 shrink-0"
                              title="Copy link"
                            >
                              {copiedId === 'link' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Payout Method & Banking Details Card */}
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                      <h4 className="font-bold text-neutral-900 text-xs">
                        Payout Method & Banking
                      </h4>
                      <span className="font-medium capitalize text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                        {selectedPartnerDetails.payout_method?.replace('_', ' ') || 'Bank Transfer'}
                      </span>
                    </div>

                    {selectedPartnerDetails.payout_details?.bank_name ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-neutral-50/70 border border-neutral-200">
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Bank Name</span>
                          <span className="font-semibold text-neutral-900">{selectedPartnerDetails.payout_details.bank_name}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Account Number</span>
                          <span className="font-mono font-bold text-neutral-900 text-xs flex items-center gap-1.5 mt-0.5">
                            <span>{selectedPartnerDetails.payout_details.account_number}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnerDetails.payout_details.account_number, 'acc')}
                              className="text-neutral-400 hover:text-neutral-700"
                            >
                              {copiedId === 'acc' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px]">Account Holder</span>
                          <span className="font-semibold text-neutral-900">{selectedPartnerDetails.payout_details.account_holder}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-neutral-50/70 border border-neutral-200 text-neutral-400">
                        No specific bank account entered yet.
                      </div>
                    )}
                  </div>

                  {/* Internal Notes & Account Controls */}
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-neutral-900 text-xs">
                      Internal Notes
                    </h4>
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={partnerNotesInput}
                        onChange={(e) => setPartnerNotesInput(e.target.value)}
                        placeholder="Add internal notes about this partner..."
                        className="w-full p-2.5 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:border-black"
                      />
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(selectedPartnerDetails.id)}
                          className="h-8 px-3.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800 shadow-xs"
                        >
                          Save Notes
                        </button>
                        
                        <div className="flex gap-1.5">
                          {selectedPartnerDetails.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(selectedPartnerDetails.id, 'active')}
                              className="h-8 px-3.5 bg-black text-white font-medium rounded-lg text-xs hover:bg-neutral-800 shadow-xs"
                            >
                              Approve Partner
                            </button>
                          )}
                          {selectedPartnerDetails.status === 'active' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'suspend',
                                  id: selectedPartnerDetails.id,
                                  name: `${selectedPartnerDetails.first_name} ${selectedPartnerDetails.last_name || ''}`,
                                })
                              }
                              className="h-8 px-3.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium rounded-lg text-xs"
                            >
                              Suspend Partner
                            </button>
                          )}
                          {selectedPartnerDetails.status === 'suspended' && (
                            <button
                              type="button"
                              onClick={() => handlePartnerStatus(selectedPartnerDetails.id, 'active')}
                              className="h-8 px-3.5 bg-black text-white font-medium rounded-lg text-xs hover:bg-neutral-800 shadow-xs"
                            >
                              Reactivate Partner
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB B: INDEPENDENT PARTNER CALENDAR (Fixed Grid + Scrollable Appointments) */}
              {partnerActiveTab === 'calendar' && (
                <div className="flex-1 min-h-0 flex flex-col space-y-3 text-xs overflow-hidden">
                  
                  {/* Calendar Top Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-neutral-200 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (partnerCalendarMonth === 0) {
                            setPartnerCalendarMonth(11);
                            setPartnerCalendarYear((y) => y - 1);
                          } else {
                            setPartnerCalendarMonth((m) => m - 1);
                          }
                          setPartnerSelectedDate(null);
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-700"
                        title="Previous Month"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="font-bold text-neutral-900 text-sm px-2">
                        {MONTH_NAMES[partnerCalendarMonth]} {partnerCalendarYear}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (partnerCalendarMonth === 11) {
                            setPartnerCalendarMonth(0);
                            setPartnerCalendarYear((y) => y + 1);
                          } else {
                            setPartnerCalendarMonth((m) => m + 1);
                          }
                          setPartnerSelectedDate(null);
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-700"
                        title="Next Month"
                      >
                        <ChevronRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setPartnerCalendarYear(now.getFullYear());
                          setPartnerCalendarMonth(now.getMonth());
                          const mm = String(now.getMonth() + 1).padStart(2, '0');
                          const dd = String(now.getDate()).padStart(2, '0');
                          setPartnerSelectedDate(`${now.getFullYear()}-${mm}-${dd}`);
                        }}
                        className="h-8 px-2.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700"
                      >
                        Today
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                      {partnerMonthBookings.some((b) => b.status === 'pending') && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {partnerMonthBookings.filter((b) => b.status === 'pending').length} New Bookings
                        </span>
                      )}
                      <div>
                        Month: <strong className="text-neutral-900 font-semibold">{partnerMonthBookings.length}</strong> bookings (<strong className="text-neutral-900 font-mono font-semibold">{formatIDR(partnerMonthBookings.reduce((sum, b) => sum + Number(b.commission_amount || 0), 0))}</strong>)
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Responsive Layout: Left Calendar Grid (Fixed, NEVER Scrolls Down), Right Appointments List (Scrollable) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-stretch overflow-hidden">
                    
                    {/* Left Column: Fixed Month Grid (lg:col-span-7 xl:col-span-8) - Can NOT scroll down */}
                    <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl border border-neutral-200 p-3 sm:p-4 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden select-none">
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-neutral-400 text-[11px] mb-2 uppercase shrink-0">
                        {DAYS_OF_WEEK.map((d) => (
                          <div key={d} className="py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0 auto-rows-fr">
                        {Array.from({ length: calendarFirstDayOfWeek }).map((_, i) => (
                          <div key={`empty-${i}`} className="h-full bg-neutral-50/50 rounded-lg border border-transparent" />
                        ))}

                        {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${partnerCalendarYear}-${String(partnerCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const dayBookings = partnerBookingsByDate[dateStr] || [];
                          const isSelected = partnerSelectedDate === dateStr;
                          const todayStr = new Date().toISOString().split('T')[0];
                          const isToday = dateStr === todayStr;

                          const hasPaid = dayBookings.some((b) => b.status === 'paid');
                          const hasApproved = dayBookings.some((b) => b.status === 'approved');
                          const hasPending = dayBookings.some((b) => b.status === 'pending');
                          const dayCommSum = dayBookings.reduce((sum, b) => sum + Number(b.commission_amount || 0), 0);

                          return (
                            <div
                              key={dateStr}
                              onClick={() => setPartnerSelectedDate(isSelected ? null : dateStr)}
                              className={`h-full p-1 sm:p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-md'
                                  : dayBookings.length > 0
                                  ? 'bg-white border-neutral-300 hover:border-black shadow-2xs'
                                  : 'bg-white border-neutral-200/70 hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[11px] sm:text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                                    isToday && !isSelected
                                      ? 'bg-neutral-900 text-white'
                                      : isToday && isSelected
                                      ? 'bg-white text-black font-extrabold'
                                      : ''
                                  }`}
                                >
                                  {dayNum}
                                </span>
                                <div className="flex items-center gap-1">
                                  {hasPending && (
                                    <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                                      isSelected ? 'bg-white text-black' : 'bg-amber-500 text-white animate-pulse'
                                    }`}>
                                      NEW
                                    </span>
                                  )}
                                  {dayBookings.length > 0 && (
                                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                      isSelected ? 'bg-white text-black' : 'bg-neutral-100 text-neutral-800'
                                    }`}>
                                      {dayBookings.length}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {dayBookings.length > 0 ? (
                                <div className="space-y-0.5">
                                  <div className={`text-[9px] sm:text-[10px] font-mono font-bold truncate ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                                    {formatIDR(dayCommSum)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {hasPaid && (
                                      <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-neutral-900'}`}
                                        title="Paid Out"
                                      />
                                    )}
                                    {hasApproved && (
                                      <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}
                                        title="Approved"
                                      />
                                    )}
                                    {hasPending && (
                                      <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`}
                                        title="Pending"
                                      />
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Appointments List (lg:col-span-5 xl:col-span-4) - SCROLLABLE */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 space-y-2.5">
                      <div className="flex items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl border border-neutral-200 shrink-0">
                        <div>
                          <h4 className="font-bold text-neutral-900 text-xs">
                            {partnerSelectedDate
                              ? safeFormatDate(partnerSelectedDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                              : `All in ${MONTH_NAMES[partnerCalendarMonth]} ${partnerCalendarYear}`}
                          </h4>
                          <span className="text-[11px] text-neutral-500">
                            {(partnerSelectedDate ? (partnerBookingsByDate[partnerSelectedDate]?.length || 0) : partnerMonthBookings.length)} bookings
                          </span>
                        </div>
                        {partnerSelectedDate && (
                          <button
                            type="button"
                            onClick={() => setPartnerSelectedDate(null)}
                            className="text-[11px] font-semibold text-neutral-900 hover:underline"
                          >
                            Show month
                          </button>
                        )}
                      </div>

                      {(() => {
                        const displayedList = partnerSelectedDate
                          ? (partnerBookingsByDate[partnerSelectedDate] || [])
                          : partnerMonthBookings;

                        if (displayedList.length === 0) {
                          return (
                            <div className="bg-neutral-50/70 p-8 rounded-xl border border-neutral-200 text-center text-neutral-400">
                              No appointments found for this period.
                            </div>
                          );
                        }

                        return (
                          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                            {displayedList.map((b) => (
                              <div
                                key={b.id}
                                className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs space-y-2 hover:border-neutral-300 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-mono font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                                      <span>#{b.booking_id}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(b.booking_id, `bk-${b.id}`)}
                                        className="text-neutral-400 hover:text-neutral-700"
                                      >
                                        {copiedId === `bk-${b.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                    <div className="text-[11px] font-medium text-neutral-900 mt-0.5">
                                      {b.guest_name || 'Guest'}
                                    </div>
                                    {b.location && (
                                      <div className="text-[10px] text-neutral-400 mt-0.5">
                                        {b.location} {b.room_number ? `(${b.room_number})` : ''}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-right">
                                    <StatusBadge status={b.status} />
                                    <div className="text-[10px] text-neutral-400 mt-1">
                                      {safeFormatDate(b.booking_date || b.created_at)} {b.booking_time || ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-neutral-100 pt-2 flex items-center justify-between text-[11px]">
                                  <div>
                                    <span className="text-neutral-400 block text-[10px]">{b.treatment_name || 'Treatment'}</span>
                                    <span className="font-medium text-neutral-800 font-mono">Net: {formatIDR(b.eligible_treatment_amount)}</span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-neutral-400 block text-[10px]">Commission ({b.commission_rate_pct}%)</span>
                                    <span className="font-bold text-neutral-900 font-mono">{formatIDR(b.commission_amount)}</span>
                                  </div>
                                </div>

                                {/* Admin Verification Checkboxes & Approval */}
                                <div className="border-t border-neutral-100 pt-2 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={b.payment_verified}
                                        onChange={(e) =>
                                          handleUpdateCommission(b.id, { payment_verified: e.target.checked })
                                        }
                                        className="rounded text-black cursor-pointer"
                                      />
                                      <span>Payment Paid</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={b.service_completed}
                                        onChange={(e) =>
                                          handleUpdateCommission(b.id, { service_completed: e.target.checked })
                                        }
                                        className="rounded text-black cursor-pointer"
                                      />
                                      <span>Service Done</span>
                                    </label>
                                  </div>

                                  {b.status === 'pending' && (
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCommission(b.id, { status: 'approved' })}
                                        className="h-6 px-2.5 bg-black hover:bg-neutral-800 text-white rounded text-[10px] font-medium"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmAction({
                                            type: 'decline_comm',
                                            id: b.id,
                                            name: `#${b.booking_id}`,
                                          })
                                        }
                                        className="h-6 px-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded text-[10px] font-medium"
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB C: INDEPENDENT PARTNER COMMISSIONS */}
              {partnerActiveTab === 'commissions' && (
                <div className="space-y-4 text-xs">
                  {/* Partner Commission Rate Setting & Filter Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">
                        Commission Rate
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {editingRateId === selectedPartnerDetails.id ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                value={newRateValue}
                                onChange={(e) => setNewRateValue(Number(e.target.value))}
                                className="w-24 h-8 px-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:border-black font-mono"
                                autoFocus
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveCommissionRate(selectedPartnerDetails.id)}
                              disabled={actionLoading}
                              className="h-8 px-3 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRateId(null)}
                              className="h-8 px-2.5 border border-neutral-200 text-xs font-medium rounded-lg hover:bg-neutral-50 text-neutral-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl font-mono font-bold text-neutral-900">
                              {selectedPartnerDetails.commission_rate_pct}%
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRateId(selectedPartnerDetails.id);
                                setNewRateValue(selectedPartnerDetails.commission_rate_pct);
                              }}
                              className="h-7 px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-2xs"
                            >
                              Edit Rate
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 mt-1 block">
                        Commission percentage applied to new bookings referred by {selectedPartnerDetails.partner_code}.
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200/70 self-start sm:self-auto">
                      {['all', 'pending', 'approved', 'paid', 'declined'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setPartnerCommFilter(st)}
                          className={`h-7 px-2.5 rounded-md capitalize font-medium text-xs transition-colors ${
                            partnerCommFilter === st
                              ? 'bg-black text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Booking Ref</th>
                          <th className="py-2.5 px-3">Treatment Net</th>
                          <th className="py-2.5 px-3">Rate</th>
                          <th className="py-2.5 px-3">Commission</th>
                          <th className="py-2.5 px-3">Verification</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {activePartnerMetrics.commissions
                          .filter((c) => partnerCommFilter === 'all' || c.status === partnerCommFilter)
                          .length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-neutral-400">
                              No commissions found for this filter.
                            </td>
                          </tr>
                        ) : (
                          activePartnerMetrics.commissions
                            .filter((c) => partnerCommFilter === 'all' || c.status === partnerCommFilter)
                            .map((c) => (
                              <tr key={c.id} className="hover:bg-neutral-50/70">
                                <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                                  {safeFormatDate(c.booking_date || c.created_at)}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                                  #{c.booking_id}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{formatIDR(c.eligible_treatment_amount)}</td>
                                <td className="py-2.5 px-3 font-mono">{c.commission_rate_pct}%</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{formatIDR(c.commission_amount)}</td>
                                <td className="py-2.5 px-3 space-y-0.5 text-[10px]">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={c.payment_verified}
                                      onChange={(e) =>
                                        handleUpdateCommission(c.id, { payment_verified: e.target.checked })
                                      }
                                      className="rounded text-black cursor-pointer"
                                    />
                                    <span>Payment Paid</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={c.service_completed}
                                      onChange={(e) =>
                                        handleUpdateCommission(c.id, { service_completed: e.target.checked })
                                      }
                                      className="rounded text-black cursor-pointer"
                                    />
                                    <span>Service Done</span>
                                  </label>
                                </td>
                                <td className="py-2.5 px-3">
                                  <StatusBadge status={c.status} />
                                </td>
                                <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                                  {c.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
                                        className="h-6 px-2 bg-black hover:bg-neutral-800 text-white rounded text-[10px] font-medium"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmAction({
                                            type: 'decline_comm',
                                            id: c.id,
                                            name: `#${c.booking_id}`,
                                          })
                                        }
                                        className="h-6 px-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded text-[10px] font-medium"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB D: INDEPENDENT PARTNER PAYOUTS */}
              {partnerActiveTab === 'payouts' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Approved Balance Ready for Payout</span>
                      <span className="text-lg font-bold text-neutral-900 mt-0.5 block font-mono">
                        {formatIDR(activePartnerMetrics.approvedUnpaid)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openQuickPayoutForPartner(selectedPartnerDetails)}
                      className="h-8 px-3.5 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 shadow-xs inline-flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Record Payout for {selectedPartnerDetails.first_name}</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Notes</th>
                          <th className="py-2.5 px-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {activePartnerMetrics.payouts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-neutral-400">
                              No payouts logged for this partner yet.
                            </td>
                          </tr>
                        ) : (
                          activePartnerMetrics.payouts.map((py) => (
                            <tr key={py.id} className="hover:bg-neutral-50/70">
                              <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                                {safeFormatDate(py.created_at)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{py.payout_reference}</td>
                              <td className="py-2.5 px-3 font-bold text-neutral-900 font-mono">{formatIDR(py.amount)}</td>
                              <td className="py-2.5 px-3 capitalize text-neutral-700">{py.payout_method?.replace('_', ' ')}</td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={py.status || 'completed'} />
                              </td>
                              <td className="py-2.5 px-3 text-neutral-500">{py.notes || '—'}</td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayoutDetails(py)}
                                  className="h-7 px-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg text-xs transition-colors shadow-2xs inline-flex items-center gap-1"
                                >
                                  <span>View Bookings</span>
                                  <span className="text-neutral-400">&rarr;</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-400 font-mono">
                ID: {selectedPartnerDetails.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPartnerDetails(null)}
                className="h-8 px-4 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 shadow-xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN POPUP: PAID OUT BOOKING DETAILS BREAKDOWN FOR ADMIN */}
      {selectedPayoutDetails && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-2xl w-full h-full max-w-[98vw] max-h-[96vh] flex flex-col border border-neutral-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-neutral-200 text-neutral-900 flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-neutral-900 text-lg sm:text-xl tracking-tight">
                    Disbursement Details
                  </h3>
                  <span className="font-mono font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded text-xs border border-neutral-200">
                    {selectedPayoutDetails.payout_reference}
                  </span>
                  <StatusBadge status={selectedPayoutDetails.status || 'completed'} />
                </div>
                <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Date: <strong>{safeFormatDate(selectedPayoutDetails.created_at)}</strong></span>
                  <span>&bull;</span>
                  <span>Method: <strong className="capitalize">{selectedPayoutDetails.payout_method?.replace('_', ' ')}</strong></span>
                  {selectedPayoutDetails.partner_code && (
                    <>
                      <span>&bull;</span>
                      <span>Partner: <strong>{selectedPayoutDetails.partner_code}</strong></span>
                    </>
                  )}
                  {selectedPayoutDetails.notes && (
                    <>
                      <span>&bull;</span>
                      <span>Notes: <strong>{selectedPayoutDetails.notes}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-neutral-400 block font-semibold uppercase">Total Disbursed</span>
                  <span className="font-mono font-bold text-xl text-neutral-900">
                    {formatIDR(selectedPayoutDetails.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayoutDetails(null)}
                  className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Quick KPI Bar */}
            {(() => {
              const items = getPayoutBookings(selectedPayoutDetails);
              const totalTreatmentNet = items.reduce((sum, b) => sum + Number(b.eligible_treatment_amount || 0), 0);

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-neutral-50/50 border-b border-neutral-200 shrink-0 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Disbursed</span>
                      <span className="text-base font-bold text-neutral-900 font-mono mt-0.5 block">
                        {formatIDR(selectedPayoutDetails.amount)}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Settled Referrals</span>
                      <span className="text-base font-bold text-neutral-900 mt-0.5 block">
                        {items.length} bookings
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Treatment Volume</span>
                      <span className="text-base font-bold text-neutral-900 font-mono mt-0.5 block">
                        {formatIDR(totalTreatmentNet)}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-neutral-500 block uppercase">Payout Mode</span>
                      <span className="text-xs font-semibold text-neutral-900 capitalize mt-1 block">
                        {selectedPayoutDetails.payout_method?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Itemized Bookings List */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm tracking-tight flex items-center justify-between">
                        <span>Bookings Settled in this Disbursement</span>
                        <span className="text-xs text-neutral-500 font-normal">
                          {items.length} items linked
                        </span>
                      </h4>
                    </div>

                    {items.length === 0 ? (
                      <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center text-neutral-500 space-y-1">
                        <p className="font-semibold text-neutral-900">No itemized booking records linked.</p>
                        <p className="text-xs text-neutral-400">This disbursement was processed as a direct commission withdrawal of {formatIDR(selectedPayoutDetails.amount)}.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-600 font-semibold">
                            <tr>
                              <th className="py-3 px-4">Booking Ref</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Guest & Location</th>
                              <th className="py-3 px-4">Treatment</th>
                              <th className="py-3 px-4">Net Value</th>
                              <th className="py-3 px-4">Rate</th>
                              <th className="py-3 px-4">Commission Paid</th>
                              <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {items.map((b) => (
                              <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span>#{b.booking_id}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(b.booking_id, `payout-bk-${b.id}`)}
                                      className="text-neutral-400 hover:text-neutral-700"
                                    >
                                      {copiedId === `payout-bk-${b.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                                  {safeFormatDate(b.booking_date || b.created_at)} {b.booking_time || ''}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-neutral-900">{b.guest_name || 'Guest'}</div>
                                  {b.location && (
                                    <div className="text-[10px] text-neutral-400">
                                      {b.location} {b.room_number ? `(${b.room_number})` : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-neutral-800 font-medium">
                                  {b.treatment_name || 'Spa Treatment'}
                                </td>
                                <td className="py-3.5 px-4 font-mono">
                                  {formatIDR(b.eligible_treatment_amount)}
                                </td>
                                <td className="py-3.5 px-4 font-mono">
                                  {b.commission_rate_pct}%
                                </td>
                                <td className="py-3.5 px-4 font-bold font-mono text-neutral-900">
                                  +{formatIDR(b.commission_amount)}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <StatusBadge status="paid" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-400 font-mono">
                Receipt #{selectedPayoutDetails.payout_reference}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPayoutDetails(null)}
                className="h-8 px-4 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR CONSEQUENTIAL ACTIONS */}
      {confirmAction && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-neutral-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1.5">
              <h3 className="font-bold text-neutral-900 text-base">
                {confirmAction.type === 'suspend'
                  ? 'Suspend Partner Account'
                  : confirmAction.type === 'reject'
                  ? 'Reject Application'
                  : 'Decline Commission'}
              </h3>
              <p className="text-xs text-neutral-500">
                {confirmAction.type === 'suspend'
                  ? `Are you sure you want to suspend ${confirmAction.name}? Their referral link will temporarily stop earning commissions.`
                  : confirmAction.type === 'reject'
                  ? `Are you sure you want to reject the application for ${confirmAction.name}?`
                  : 'Are you sure you want to decline this commission record?'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="h-8 px-3.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction.type === 'suspend') {
                    handlePartnerStatus(confirmAction.id, 'suspended');
                  } else if (confirmAction.type === 'reject') {
                    handlePartnerStatus(confirmAction.id, 'rejected');
                  } else if (confirmAction.type === 'decline_comm') {
                    handleUpdateCommission(confirmAction.id, { status: 'declined' });
                  }
                  setConfirmAction(null);
                }}
                className="h-8 px-3.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL FLOATING TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 text-white rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toast.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-400" />
          ) : (
            <AlertCircle size={15} className="text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
