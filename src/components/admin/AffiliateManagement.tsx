'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Copy, Plus, RefreshCw, ArrowUpRight, Info } from 'lucide-react';
import {
  cx,
  btn,
  inputCls,
  selectCls,
  thCls,
  tdCls,
  MONTH_NAMES,
  DAYS_OF_WEEK,
  formatIDR,
  safeFormatDate,
  toDateKey,
  localTodayKey,
  StatusBadge,
  CountPill,
  NewIndicator,
  Tabs,
  FilterChips,
  SearchInput,
  Pagination,
  EmptyState,
  ErrorState,
  SkeletonRows,
  SkeletonList,
  SectionCard,
  Field,
  KeyValue,
  FullScreenModal,
  Drawer,
  ConfirmDialog,
  Toast,
} from './affiliate/ui';

type SubTab = 'partners' | 'applications' | 'commissions' | 'payouts' | 'settings';
type PartnerTab = 'overview' | 'bookings' | 'commissions' | 'payouts' | 'history';

type ConfirmState =
  | { kind: 'partner-status'; id: string; name: string; next: 'active' | 'suspended' | 'rejected'; verb: 'approve' | 'reject' | 'suspend' | 'reactivate' }
  | { kind: 'decline-commission'; id: string; ref: string }
  | null;

const PAGE_SIZE = 10;
const EMPTY_PAYOUT_FORM = { partner_id: '', amount: '', payout_method: 'bank_transfer', notes: '' };

const fullName = (p: any) => `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Unnamed partner';
const commDateKey = (c: any) => toDateKey(c.booking_date || c.created_at);
const methodLabel = (m?: string) => (m ? m.replace(/_/g, ' ') : 'Bank transfer');

const CONFIRM_COPY = {
  approve: { title: 'Approve partner', confirm: 'Approve', body: (n: string) => `${n} will be activated and their referral code will start tracking bookings.` },
  reject: { title: 'Reject application', confirm: 'Reject', body: (n: string) => `${n}'s application will be marked as rejected.` },
  suspend: { title: 'Suspend partner', confirm: 'Suspend', body: (n: string) => `${n} will be suspended. You can reactivate the account at any time.` },
  reactivate: { title: 'Reactivate partner', confirm: 'Reactivate', body: (n: string) => `${n} will be set back to active.` },
};

export default function AffiliateManagement() {
  /* ---------------------------------------------------------------- */
  /* Data                                                              */
  /* ---------------------------------------------------------------- */
  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    default_commission_rate_pct: 15.0,
    cookie_duration_days: 30,
    attribution_model: 'last_touch',
    auto_approve_partners: false,
    is_program_active: true,
  });
  const [savedSettings, setSavedSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ---------------------------------------------------------------- */
  /* View state                                                        */
  /* ---------------------------------------------------------------- */
  const [subTab, setSubTab] = useState<SubTab>('partners');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('all');
  const [partnerSort, setPartnerSort] = useState('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');
  const [globalPartnerFilter, setGlobalPartnerFilter] = useState('all');
  const [commSearch, setCommSearch] = useState('');
  const [globalPayoutPartnerFilter, setGlobalPayoutPartnerFilter] = useState('all');
  const [payoutSearch, setPayoutSearch] = useState('');
  const [partnerPage, setPartnerPage] = useState(1);
  const [commPage, setCommPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Partner workspace
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerActiveTab, setPartnerActiveTab] = useState<PartnerTab>('overview');
  const [partnerCalendarYear, setPartnerCalendarYear] = useState(() => new Date().getFullYear());
  const [partnerCalendarMonth, setPartnerCalendarMonth] = useState(() => new Date().getMonth());
  const [partnerSelectedDate, setPartnerSelectedDate] = useState<string | null>(null);
  const [partnerCommFilter, setPartnerCommFilter] = useState('all');
  const [partnerNotesInput, setPartnerNotesInput] = useState('');
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState<number>(15);

  // Record payout
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState<typeof EMPTY_PAYOUT_FORM>(EMPTY_PAYOUT_FORM);
  const [payoutSubmitted, setPayoutSubmitted] = useState(false);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [payoutCalendarYear, setPayoutCalendarYear] = useState(() => new Date().getFullYear());
  const [payoutCalendarMonth, setPayoutCalendarMonth] = useState(() => new Date().getMonth());
  const [payoutSelectedDate, setPayoutSelectedDate] = useState<string | null>(null);
  const [showPastPaidInPayoutModal, setShowPastPaidInPayoutModal] = useState(false);

  // Detail overlays
  const [selectedPayoutDetails, setSelectedPayoutDetails] = useState<any | null>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  /* ---------------------------------------------------------------- */
  /* Loading — same endpoints; partners fetched once and filtered here */
  /* ---------------------------------------------------------------- */
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [partnersRes, commsRes, payoutsRes, settingsRes] = await Promise.all([
        fetch('/api/affiliates/admin/partners?status=all'),
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
        setSavedSettings(sData.settings);
      }

      const failed = [pData, cData, pyData, sData].find((d) => !d.success);
      if (failed) setLoadError(failed.message || 'Some affiliate data could not be loaded.');
    } catch (err: any) {
      console.error('Failed to load affiliate admin data:', err);
      setLoadError(err?.message || 'Network error while loading affiliate data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => setPartnerPage(1), [searchQuery, partnerStatusFilter, partnerSort]);
  useEffect(() => setCommPage(1), [commissionStatusFilter, globalPartnerFilter, commSearch]);
  useEffect(() => setPayoutPage(1), [globalPayoutPartnerFilter, payoutSearch]);

  /* ---------------------------------------------------------------- */
  /* Mutations — unchanged API contracts                               */
  /* ---------------------------------------------------------------- */
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
        setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
        showToast(`Partner set to ${newStatus}`);
      } else {
        showToast(data.message || 'Could not update partner status', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while updating status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCommissionRate = async (id: string) => {
    if (!(newRateValue >= 0 && newRateValue <= 100)) {
      showToast('Rate must be between 0 and 100', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, commission_rate_pct: newRateValue }),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, commission_rate_pct: newRateValue } : p)));
        setEditingRateId(null);
        showToast('Commission rate updated');
      } else {
        showToast(data.message || 'Could not update rate', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while updating rate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

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
        setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, notes: partnerNotesInput } : p)));
        showToast('Notes saved');
      } else {
        showToast(data.message || 'Could not save notes', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while saving notes', 'error');
    } finally {
      setActionLoading(false);
    }
  };

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
        setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        if (updates.status) showToast(`Commission ${updates.status}`);
      } else {
        showToast(data.message || 'Could not update commission', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while updating commission', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const closePayoutModal = useCallback(() => {
    setShowPayoutModal(false);
    setSelectedCommissionIds([]);
    setPayoutSelectedDate(null);
    setPayoutSubmitted(false);
  }, []);

  const payoutErrors = {
    partner: !payoutForm.partner_id ? 'Select a partner.' : null,
    amount: !(Number(payoutForm.amount) > 0) ? 'Enter an amount greater than 0.' : null,
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSubmitted(true);
    if (payoutErrors.partner || payoutErrors.amount) return;

    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payoutForm, commission_ids: selectedCommissionIds }),
      });
      const data = await res.json();
      if (data.success) {
        closePayoutModal();
        setPayoutForm(EMPTY_PAYOUT_FORM);
        await fetchAllData();
        showToast(`Payout ${data.payout?.payout_reference || ''} recorded`.replace('  ', ' '));
      } else {
        showToast(data.message || 'Could not record payout', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while recording payout', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const settingsErrors = {
    rate:
      !(Number(settings.default_commission_rate_pct) >= 1 && Number(settings.default_commission_rate_pct) <= 50)
        ? 'Enter a rate between 1 and 50.'
        : null,
    days:
      !(Number(settings.cookie_duration_days) >= 1 && Number(settings.cookie_duration_days) <= 180)
        ? 'Enter between 1 and 180 days.'
        : null,
  };

  const settingsDirty = useMemo(() => {
    if (!savedSettings) return false;
    return ['default_commission_rate_pct', 'cookie_duration_days', 'auto_approve_partners', 'is_program_active'].some(
      (k) => String(settings[k]) !== String(savedSettings[k])
    );
  }, [settings, savedSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsErrors.rate || settingsErrors.days) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/affiliates/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSettings(settings);
        showToast('Settings saved');
      } else {
        showToast(data.message || 'Could not save settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving settings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Derived metrics (same calculations as before)                     */
  /* ---------------------------------------------------------------- */
  const getPartnerMetrics = useCallback(
    (p: any) => {
      const pComms = commissions.filter((c) => c.partner_id === p.id || c.partner_code === p.partner_code);
      const pPayouts = payouts.filter((py) => py.partner_id === p.id || py.partner_code === p.partner_code);
      const sum = (list: any[], key: string) => list.reduce((s, x) => s + Number(x[key] || 0), 0);

      const totalEarned = sum(pComms.filter((c) => c.status !== 'declined' && c.status !== 'cancelled'), 'commission_amount');
      const approvedUnpaid = sum(pComms.filter((c) => c.status === 'approved'), 'commission_amount');
      const pending = sum(pComms.filter((c) => c.status === 'pending'), 'commission_amount');
      const paidComms = sum(pComms.filter((c) => c.status === 'paid'), 'commission_amount');
      const totalPaidOut = sum(pPayouts.filter((py) => py.status === 'completed' || py.status === 'processing'), 'amount');

      const sorted = [...pComms].sort((a, b) => (b.booking_date || b.created_at || '').localeCompare(a.booking_date || a.created_at || ''));
      const pendingCount = pComms.filter((c) => c.status === 'pending').length;

      return {
        commissions: pComms,
        payouts: pPayouts,
        totalEarned,
        approvedUnpaid,
        pending,
        paidComms,
        totalPaidOut,
        bookingsCount: pComms.length,
        pendingCount,
        latestBooking: sorted[0] || null,
      };
    },
    [commissions, payouts]
  );

  const metricsById = useMemo(() => {
    const map: Record<string, ReturnType<typeof getPartnerMetrics>> = {};
    for (const p of partners) map[p.id] = getPartnerMetrics(p);
    return map;
  }, [partners, getPartnerMetrics]);

  const partnerByCode = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of partners) {
      map[p.id] = p;
      if (p.partner_code) map[p.partner_code] = p;
    }
    return map;
  }, [partners]);

  const findPartner = (code?: string, id?: string) => (id && partnerByCode[id]) || (code && partnerByCode[code]) || null;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: partners.length, pending: 0, active: 0, suspended: 0, rejected: 0 };
    for (const p of partners) counts[p.status] = (counts[p.status] || 0) + 1;
    return counts;
  }, [partners]);

  const summary = useMemo(() => {
    const readyToPay = commissions.filter((c) => c.status === 'approved').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
    const paidOut = payouts
      .filter((py) => py.status === 'completed' || py.status === 'processing')
      .reduce((s, py) => s + Number(py.amount || 0), 0);
    const pendingReview = commissions.filter((c) => c.status === 'pending').length;
    return { readyToPay, paidOut, pendingReview };
  }, [commissions, payouts]);

  // Smart ranking preserved as the default "Recent activity" sort
  const filteredPartners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = partners.filter((p) => {
      if (partnerStatusFilter !== 'all' && p.status !== partnerStatusFilter) return false;
      if (!q) return true;
      return [p.partner_code, p.first_name, p.last_name, p.business_name, p.email].some((v) => v?.toLowerCase().includes(q));
    });

    return [...list].sort((a, b) => {
      const mA = metricsById[a.id];
      const mB = metricsById[b.id];
      if (partnerSort === 'name') return fullName(a).localeCompare(fullName(b));
      if (partnerSort === 'commission') return mB.totalEarned - mA.totalEarned;
      if (partnerSort === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

      if (mA.pendingCount !== mB.pendingCount && (mA.pendingCount > 0 || mB.pendingCount > 0)) return mB.pendingCount - mA.pendingCount;
      const hasA = mA.bookingsCount > 0 ? 1 : 0;
      const hasB = mB.bookingsCount > 0 ? 1 : 0;
      if (hasA !== hasB) return hasB - hasA;
      const dA = mA.latestBooking ? mA.latestBooking.booking_date || mA.latestBooking.created_at || '' : '';
      const dB = mB.latestBooking ? mB.latestBooking.booking_date || mB.latestBooking.created_at || '' : '';
      if (dA && dB) {
        const cmp = dB.localeCompare(dA);
        if (cmp !== 0) return cmp;
      } else if (dA) return -1;
      else if (dB) return 1;
      if (mA.bookingsCount !== mB.bookingsCount) return mB.bookingsCount - mA.bookingsCount;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [partners, searchQuery, partnerStatusFilter, partnerSort, metricsById]);

  const pagedPartners = filteredPartners.slice((partnerPage - 1) * PAGE_SIZE, partnerPage * PAGE_SIZE);

  const applications = useMemo(
    () => partners.filter((p) => p.status === 'pending').sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    [partners]
  );

  const commissionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: commissions.length, pending: 0, approved: 0, paid: 0, declined: 0 };
    for (const c of commissions) counts[c.status] = (counts[c.status] || 0) + 1;
    return counts;
  }, [commissions]);

  const filteredGlobalCommissions = useMemo(() => {
    const q = commSearch.trim().toLowerCase();
    return commissions.filter((c) => {
      if (commissionStatusFilter !== 'all' && c.status !== commissionStatusFilter) return false;
      if (globalPartnerFilter !== 'all' && c.partner_code !== globalPartnerFilter) return false;
      if (!q) return true;
      return [c.booking_id, c.guest_name, c.partner_code, c.treatment_name].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [commissions, commissionStatusFilter, globalPartnerFilter, commSearch]);

  const pagedCommissions = filteredGlobalCommissions.slice((commPage - 1) * PAGE_SIZE, commPage * PAGE_SIZE);

  const filteredGlobalPayouts = useMemo(() => {
    const q = payoutSearch.trim().toLowerCase();
    return payouts.filter((py) => {
      if (globalPayoutPartnerFilter !== 'all' && py.partner_code !== globalPayoutPartnerFilter) return false;
      if (!q) return true;
      return [py.payout_reference, py.partner_code, py.notes].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [payouts, globalPayoutPartnerFilter, payoutSearch]);

  const pagedPayouts = filteredGlobalPayouts.slice((payoutPage - 1) * PAGE_SIZE, payoutPage * PAGE_SIZE);

  const payoutById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const py of payouts) map[py.id] = py;
    return map;
  }, [payouts]);

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

  /* ---------------------------------------------------------------- */
  /* Partner workspace                                                 */
  /* ---------------------------------------------------------------- */
  const selectedPartner = selectedPartnerId ? partners.find((p) => p.id === selectedPartnerId) || null : null;
  const activePartnerMetrics = selectedPartner ? metricsById[selectedPartner.id] : null;

  const openPartnerModal = (partner: any, tab: PartnerTab = 'overview') => {
    setSelectedPartnerId(partner.id);
    setPartnerActiveTab(tab);
    setPartnerSelectedDate(null);
    setPartnerCommFilter('all');
    setEditingRateId(null);
    setPartnerNotesInput(partner.notes || '');
  };

  const partnerMonthBookings = useMemo(() => {
    if (!activePartnerMetrics) return [];
    const prefix = `${partnerCalendarYear}-${String(partnerCalendarMonth + 1).padStart(2, '0')}`;
    return activePartnerMetrics.commissions.filter((c) => commDateKey(c).startsWith(prefix));
  }, [activePartnerMetrics, partnerCalendarYear, partnerCalendarMonth]);

  const partnerBookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (!activePartnerMetrics) return map;
    for (const c of activePartnerMetrics.commissions) {
      const key = commDateKey(c);
      if (!key) continue;
      (map[key] ||= []).push(c);
    }
    return map;
  }, [activePartnerMetrics]);

  const partnerHistory = useMemo(() => {
    if (!selectedPartner || !activePartnerMetrics) return [];
    const events: { date: string; title: string; detail?: string; status?: string }[] = [
      { date: selectedPartner.created_at, title: 'Joined program', detail: `Referral code ${selectedPartner.partner_code}` },
    ];
    for (const c of activePartnerMetrics.commissions) {
      events.push({
        date: c.created_at || c.booking_date,
        title: `Booking #${c.booking_id} referred`,
        detail: `${c.guest_name || 'Guest'} · ${formatIDR(c.commission_amount)} commission`,
        status: c.status,
      });
      if (c.approved_at) events.push({ date: c.approved_at, title: `Commission approved`, detail: `Booking #${c.booking_id}` });
    }
    for (const py of activePartnerMetrics.payouts) {
      events.push({
        date: py.created_at,
        title: 'Payout recorded',
        detail: `${py.payout_reference} · ${formatIDR(py.amount)}`,
        status: py.status || 'completed',
      });
    }
    return events
      .filter((e) => e.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPartner, activePartnerMetrics]);

  const shiftMonth = (
    year: number,
    month: number,
    delta: number,
    setY: (fn: (y: number) => number) => void,
    setM: (m: number) => void
  ) => {
    const next = month + delta;
    if (next < 0) {
      setM(11);
      setY((y) => y - 1);
    } else if (next > 11) {
      setM(0);
      setY((y) => y + 1);
    } else setM(next);
  };

  /* ---------------------------------------------------------------- */
  /* Record payout helpers (unchanged selection logic)                 */
  /* ---------------------------------------------------------------- */
  const payoutSelectedPartner = useMemo(() => partners.find((p) => p.id === payoutForm.partner_id) || null, [payoutForm.partner_id, partners]);

  const payoutPartnerCommissions = useMemo(() => {
    if (!payoutForm.partner_id) return [];
    return commissions.filter((c) => c.partner_id === payoutForm.partner_id || c.partner_code === payoutSelectedPartner?.partner_code);
  }, [payoutForm.partner_id, payoutSelectedPartner, commissions]);

  const payoutApprovedCommissions = useMemo(() => payoutPartnerCommissions.filter((c) => c.status === 'approved'), [payoutPartnerCommissions]);
  const payoutPaidCommissions = useMemo(() => payoutPartnerCommissions.filter((c) => c.status === 'paid'), [payoutPartnerCommissions]);

  const payoutApprovedByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of payoutApprovedCommissions) {
      const key = commDateKey(c);
      if (key) (map[key] ||= []).push(c);
    }
    return map;
  }, [payoutApprovedCommissions]);

  const payoutPaidByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of payoutPaidCommissions) {
      const key = commDateKey(c);
      if (key) map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [payoutPaidCommissions]);

  const selectedPayoutSum = payoutApprovedCommissions
    .filter((c) => selectedCommissionIds.includes(c.id))
    .reduce((s, c) => s + Number(c.commission_amount || 0), 0);

  const handleSelectPayoutPartner = (partnerId: string) => {
    const p = partners.find((item) => item.id === partnerId);
    const approved = commissions.filter((c) => (c.partner_id === partnerId || c.partner_code === p?.partner_code) && c.status === 'approved');
    const total = approved.reduce((s, c) => s + Number(c.commission_amount || 0), 0);

    if (approved.length > 0) {
      const d = new Date(approved[0].booking_date || approved[0].created_at);
      if (!isNaN(d.getTime())) {
        setPayoutCalendarYear(d.getFullYear());
        setPayoutCalendarMonth(d.getMonth());
      }
    }

    setSelectedCommissionIds(approved.map((c) => c.id));
    setPayoutSelectedDate(null);
    setPayoutForm({
      partner_id: partnerId,
      amount: total > 0 ? String(total) : '',
      payout_method: p?.payout_method || 'bank_transfer',
      notes: p ? (p.business_name ? `Payout for ${p.business_name}` : `Payout for ${p.partner_code || ''}`) : '',
    });
  };

  const toggleCommissionSelection = (commId: string) => {
    setSelectedCommissionIds((prev) => {
      const next = prev.includes(commId) ? prev.filter((id) => id !== commId) : [...prev, commId];
      const nextTotal = payoutApprovedCommissions.filter((c) => next.includes(c.id)).reduce((s, c) => s + Number(c.commission_amount || 0), 0);
      setPayoutForm((f) => ({ ...f, amount: String(nextTotal) }));
      return next;
    });
  };

  const selectAllApproved = () => {
    setSelectedCommissionIds(payoutApprovedCommissions.map((c) => c.id));
    setPayoutForm((f) => ({ ...f, amount: String(payoutApprovedCommissions.reduce((s, c) => s + Number(c.commission_amount || 0), 0)) }));
  };

  const deselectAllApproved = () => {
    setSelectedCommissionIds([]);
    setPayoutForm((f) => ({ ...f, amount: '0' }));
  };

  const openNewPayout = () => {
    setPayoutForm(EMPTY_PAYOUT_FORM);
    setSelectedCommissionIds([]);
    setPayoutSubmitted(false);
    setShowPayoutModal(true);
  };

  const openQuickPayoutForPartner = (partner: any) => {
    setPayoutSubmitted(false);
    handleSelectPayoutPartner(partner.id);
    setShowPayoutModal(true);
  };

  const selectedCommission = selectedCommissionId ? commissions.find((c) => c.id === selectedCommissionId) || null : null;

  /* ---------------------------------------------------------------- */
  /* Small render helpers                                              */
  /* ---------------------------------------------------------------- */
  const askStatus = (p: any, verb: 'approve' | 'reject' | 'suspend' | 'reactivate') =>
    setConfirmState({
      kind: 'partner-status',
      id: p.id,
      name: fullName(p),
      verb,
      next: verb === 'suspend' ? 'suspended' : verb === 'reject' ? 'rejected' : 'active',
    });

  const renderStatusActions = (p: any, size: string = btn.sm) => (
    <>
      {p.status === 'pending' && (
        <>
          <button type="button" disabled={actionLoading} onClick={() => askStatus(p, 'reject')} className={cx(btn.base, btn.secondary, size)}>
            Reject
          </button>
          <button type="button" disabled={actionLoading} onClick={() => askStatus(p, 'approve')} className={cx(btn.base, btn.primary, size)}>
            Approve
          </button>
        </>
      )}
      {p.status === 'active' && (
        <button type="button" disabled={actionLoading} onClick={() => askStatus(p, 'suspend')} className={cx(btn.base, btn.secondary, size)}>
          Suspend
        </button>
      )}
      {(p.status === 'suspended' || p.status === 'rejected') && (
        <button type="button" disabled={actionLoading} onClick={() => askStatus(p, 'reactivate')} className={cx(btn.base, btn.primary, size)}>
          Reactivate
        </button>
      )}
    </>
  );

  const PartnerLink = ({ code, id }: { code?: string; id?: string }) => {
    const p = findPartner(code, id);
    if (!p) return <span className="font-mono text-xs text-[#171717]">{code || '—'}</span>;
    return (
      <button
        type="button"
        onClick={() => openPartnerModal(p)}
        className="group inline-flex flex-col items-start text-left min-w-0 max-w-[180px]"
        title={`${fullName(p)} · ${p.partner_code}`}
      >
        <span className="text-[13px] font-medium text-[#171717] group-hover:underline truncate max-w-full">{fullName(p)}</span>
        <span className="font-mono text-[11px] text-[#737373] truncate max-w-full">{p.partner_code}</span>
      </button>
    );
  };

  const CopyBtn = ({ text, id, label }: { text: string; id: string; label: string }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => handleCopyText(text, id)}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[#A3A3A3] hover:text-black shrink-0"
    >
      {copiedId === id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );

  const VerificationChecks = ({ c, compact }: { c: any; compact?: boolean }) => (
    <div className={cx('flex', compact ? 'flex-col gap-1' : 'flex-wrap gap-4')}>
      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#171717]">
        <input
          type="checkbox"
          checked={!!c.payment_verified}
          disabled={actionLoading}
          onChange={(e) => handleUpdateCommission(c.id, { payment_verified: e.target.checked })}
          className="w-4 h-4 rounded border-[#D4D4D4] accent-black cursor-pointer"
        />
        Payment received
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#171717]">
        <input
          type="checkbox"
          checked={!!c.service_completed}
          disabled={actionLoading}
          onChange={(e) => handleUpdateCommission(c.id, { service_completed: e.target.checked })}
          className="w-4 h-4 rounded border-[#D4D4D4] accent-black cursor-pointer"
        />
        Service done
      </label>
    </div>
  );

  const CommissionActions = ({ c, size = btn.xs }: { c: any; size?: string }) =>
    c.status === 'pending' ? (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => setConfirmState({ kind: 'decline-commission', id: c.id, ref: c.booking_id })}
          className={cx(btn.base, btn.secondary, size)}
        >
          Decline
        </button>
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
          className={cx(btn.base, btn.primary, size)}
        >
          Approve
        </button>
      </div>
    ) : null;

  const tableShell = (children: React.ReactNode) => (
    <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">{children}</div>
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  const subTabs = [
    { id: 'partners', label: 'Partners', count: partners.length },
    { id: 'applications', label: 'Applications', count: applications.length, alert: applications.length },
    { id: 'commissions', label: 'Commissions', count: commissions.length, alert: summary.pendingReview },
    { id: 'payouts', label: 'Payouts', count: payouts.length },
    { id: 'settings', label: 'Settings' },
  ];

  const calendarDaysInMonth = new Date(partnerCalendarYear, partnerCalendarMonth + 1, 0).getDate();
  const calendarFirstDayOfWeek = new Date(partnerCalendarYear, partnerCalendarMonth, 1).getDay();
  const payoutCalendarDaysInMonth = new Date(payoutCalendarYear, payoutCalendarMonth + 1, 0).getDate();
  const payoutCalendarFirstDayOfWeek = new Date(payoutCalendarYear, payoutCalendarMonth, 1).getDay();
  const todayKey = localTodayKey();

  return (
    <div className="bg-white text-[#171717] space-y-6">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">Affiliates</h1>
          <p className="text-[13px] text-[#737373] mt-0.5">Therapick partner program</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="aff-refresh"
            type="button"
            onClick={fetchAllData}
            disabled={loading}
            aria-label="Refresh data"
            className={cx(btn.base, btn.secondary, btn.icon)}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button id="aff-record-payout" type="button" onClick={openNewPayout} className={cx(btn.base, btn.primary, btn.md)}>
            <Plus size={15} />
            Record payout
          </button>
        </div>
      </header>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl divide-[#E5E5E5] [&>*]:border-[#E5E5E5] overflow-hidden">
        {[
          { label: 'Active partners', value: String(statusCounts.active || 0), hint: `${partners.length} total` },
          { label: 'Applications', value: String(applications.length), hint: applications.length ? 'Awaiting review' : 'Nothing to review' },
          { label: 'Ready to pay', value: formatIDR(summary.readyToPay), hint: 'Approved, unpaid' },
          { label: 'Paid out', value: formatIDR(summary.paidOut), hint: `${payouts.length} payouts` },
        ].map((m, i) => (
          <div
            key={m.label}
            className={cx('p-4 bg-white', i % 2 === 1 && 'border-l', i >= 2 && 'border-t lg:border-t-0', i === 2 && 'lg:border-l')}
          >
            <div className="text-xs text-[#737373]">{m.label}</div>
            <div className="text-lg md:text-xl font-semibold text-black mt-1 tabular-nums truncate">{loading ? '—' : m.value}</div>
            <div className="text-[11px] text-[#A3A3A3] mt-0.5">{m.hint}</div>
          </div>
        ))}
      </div>

      {/* Section navigation */}
      <Tabs idPrefix="aff-tab" items={subTabs} value={subTab} onChange={(id) => setSubTab(id as SubTab)} />

      {/* ============================ PARTNERS ============================ */}
      {subTab === 'partners' && (
        <section className="space-y-4" aria-labelledby="aff-partners-title">
          <h2 id="aff-partners-title" className="sr-only">Partners</h2>
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
            <FilterChips
              idPrefix="aff-partner-status"
              value={partnerStatusFilter}
              onChange={setPartnerStatusFilter}
              options={[
                { value: 'all', label: 'All', count: statusCounts.all },
                { value: 'active', label: 'Active', count: statusCounts.active || 0 },
                { value: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
                { value: 'suspended', label: 'Suspended', count: statusCounts.suspended || 0 },
                { value: 'rejected', label: 'Rejected', count: statusCounts.rejected || 0 },
              ]}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <SearchInput id="aff-partner-search" value={searchQuery} onChange={setSearchQuery} placeholder="Search name, code, villa…" className="sm:w-64" />
              <select
                id="aff-partner-sort"
                aria-label="Sort partners"
                value={partnerSort}
                onChange={(e) => setPartnerSort(e.target.value)}
                className={cx(selectCls, 'sm:w-44')}
              >
                <option value="activity">Recent activity</option>
                <option value="commission">Highest commission</option>
                <option value="newest">Newest</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {tableShell(
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-[#E5E5E5]">
                    <tr>
                      <th className={thCls}>Partner</th>
                      <th className={thCls}>Code</th>
                      <th className={cx(thCls, 'text-right')}>Commission</th>
                      <th className={cx(thCls, 'text-right')}>Paid out</th>
                      <th className={thCls}>Bookings</th>
                      <th className={thCls}>Status</th>
                      <th className={cx(thCls, 'text-right')}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows cols={7} />
                    ) : loadError && partners.length === 0 ? (
                      <tr><td colSpan={7}><ErrorState message={loadError} onRetry={fetchAllData} /></td></tr>
                    ) : pagedPartners.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            title="No partners found"
                            description={searchQuery ? `Nothing matches “${searchQuery}”.` : 'No partners in this status.'}
                            action={
                              (searchQuery || partnerStatusFilter !== 'all') && (
                                <button type="button" onClick={() => { setSearchQuery(''); setPartnerStatusFilter('all'); }} className={cx(btn.base, btn.secondary, btn.sm)}>
                                  Clear filters
                                </button>
                              )
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      pagedPartners.map((p) => {
                        const m = metricsById[p.id];
                        return (
                          <tr key={p.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                            <td className={tdCls}>
                              <button type="button" onClick={() => openPartnerModal(p)} className="text-left max-w-[240px] block group" title={`${fullName(p)} — ${p.business_name || 'Individual'}`}>
                                <span className="block font-medium text-[#171717] truncate group-hover:underline">{fullName(p)}</span>
                                <span className="block text-xs text-[#737373] truncate">{p.business_name || 'Individual'}</span>
                              </button>
                            </td>
                            <td className={tdCls}>
                              <div className="flex items-center gap-0.5">
                                <span className="font-mono text-xs text-[#171717] truncate max-w-[130px]" title={p.partner_code}>{p.partner_code}</span>
                                <CopyBtn text={p.partner_code} id={`code-${p.id}`} label="Copy referral code" />
                              </div>
                            </td>
                            <td className={cx(tdCls, 'text-right')}>
                              <div className="font-medium tabular-nums text-[#171717]">{formatIDR(m.totalEarned)}</div>
                              <div className="text-xs text-[#737373] tabular-nums">
                                {m.approvedUnpaid > 0 ? `${formatIDR(m.approvedUnpaid)} unpaid` : m.pending > 0 ? `${formatIDR(m.pending)} pending` : 'Settled'}
                              </div>
                            </td>
                            <td className={cx(tdCls, 'text-right')}>
                              <div className="font-medium tabular-nums text-[#171717]">{formatIDR(m.totalPaidOut)}</div>
                              <div className="text-xs text-[#737373]">
                                {m.approvedUnpaid > 0 ? (
                                  <button type="button" onClick={() => openQuickPayoutForPartner(p)} className="text-black font-medium hover:underline">
                                    Pay now
                                  </button>
                                ) : (
                                  <button type="button" onClick={() => openPartnerModal(p, 'payouts')} className="hover:text-black hover:underline">
                                    {m.payouts.length} {m.payouts.length === 1 ? 'payout' : 'payouts'}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className={tdCls}>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPartnerModal(p, 'bookings')}
                                  className={cx(btn.base, btn.secondary, btn.xs)}
                                  title={m.latestBooking ? `Latest: ${safeFormatDate(m.latestBooking.booking_date || m.latestBooking.created_at)}` : 'No bookings yet'}
                                >
                                  Calendar
                                  <CountPill>{m.bookingsCount}</CountPill>
                                </button>
                                <NewIndicator count={m.pendingCount} />
                              </div>
                            </td>
                            <td className={tdCls}><StatusBadge status={p.status} /></td>
                            <td className={cx(tdCls, 'text-right')}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => openPartnerModal(p)} className={cx(btn.base, btn.secondary, btn.xs)}>
                                  Details
                                </button>
                                {renderStatusActions(p, btn.xs)}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden">
                {loading ? (
                  <SkeletonList />
                ) : loadError && partners.length === 0 ? (
                  <ErrorState message={loadError} onRetry={fetchAllData} />
                ) : pagedPartners.length === 0 ? (
                  <EmptyState title="No partners found" description={searchQuery ? `Nothing matches “${searchQuery}”.` : 'No partners in this status.'} />
                ) : (
                  <ul className="divide-y divide-[#F0F0F0]">
                    {pagedPartners.map((p) => {
                      const m = metricsById[p.id];
                      return (
                        <li key={p.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <button type="button" onClick={() => openPartnerModal(p)} className="text-left min-w-0">
                              <span className="block font-medium text-[#171717] truncate">{fullName(p)}</span>
                              <span className="block text-xs text-[#737373] truncate">
                                {p.business_name || 'Individual'} · <span className="font-mono">{p.partner_code}</span>
                              </span>
                            </button>
                            <StatusBadge status={p.status} />
                          </div>
                          <dl className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <dt className="text-[#737373]">Commission</dt>
                              <dd className="font-medium tabular-nums text-[#171717] mt-0.5">{formatIDR(m.totalEarned)}</dd>
                            </div>
                            <div>
                              <dt className="text-[#737373]">Paid out</dt>
                              <dd className="font-medium tabular-nums text-[#171717] mt-0.5">{formatIDR(m.totalPaidOut)}</dd>
                            </div>
                            <div>
                              <dt className="text-[#737373]">Bookings</dt>
                              <dd className="font-medium tabular-nums text-[#171717] mt-0.5 flex items-center gap-1.5">
                                {m.bookingsCount}
                                <NewIndicator count={m.pendingCount} />
                              </dd>
                            </div>
                          </dl>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => openPartnerModal(p)} className={cx(btn.base, btn.secondary, btn.sm, 'flex-1')}>
                              Details
                            </button>
                            <button type="button" onClick={() => openPartnerModal(p, 'bookings')} className={cx(btn.base, btn.secondary, btn.sm, 'flex-1')}>
                              Calendar
                            </button>
                            {m.approvedUnpaid > 0 && (
                              <button type="button" onClick={() => openQuickPayoutForPartner(p)} className={cx(btn.base, btn.secondary, btn.sm, 'flex-1')}>
                                Pay
                              </button>
                            )}
                            {renderStatusActions(p)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Pagination page={partnerPage} total={filteredPartners.length} pageSize={PAGE_SIZE} onChange={setPartnerPage} label="partners" />
            </>
          )}
        </section>
      )}

      {/* ========================== APPLICATIONS ========================== */}
      {subTab === 'applications' && (
        <section className="space-y-4" aria-labelledby="aff-apps-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="aff-apps-title" className="text-[15px] font-semibold text-black">Pending applications</h2>
            {settings.auto_approve_partners && <span className="text-xs text-[#737373]">Auto-approve is on</span>}
          </div>
          {tableShell(
            loading ? (
              <SkeletonList />
            ) : applications.length === 0 ? (
              <EmptyState title="No pending applications" description="New partner registrations will appear here for review." />
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="border-b border-[#E5E5E5]">
                      <tr>
                        <th className={thCls}>Applicant</th>
                        <th className={thCls}>Category</th>
                        <th className={thCls}>Contact</th>
                        <th className={thCls}>Code</th>
                        <th className={thCls}>Applied</th>
                        <th className={cx(thCls, 'text-right')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((p) => (
                        <tr key={p.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                          <td className={tdCls}>
                            <span className="block font-medium text-[#171717] truncate max-w-[220px]">{fullName(p)}</span>
                            <span className="block text-xs text-[#737373] truncate max-w-[220px]">{p.business_name || 'Individual'}</span>
                          </td>
                          <td className={cx(tdCls, 'capitalize text-[#171717]')}>{p.partner_type?.replace(/_/g, ' ') || '—'}</td>
                          <td className={tdCls}>
                            <span className="block text-[#171717] truncate max-w-[200px]">{p.email}</span>
                            <span className="block text-xs text-[#737373]">{p.whatsapp || p.phone || '—'}</span>
                          </td>
                          <td className={cx(tdCls, 'font-mono text-xs')}>{p.partner_code}</td>
                          <td className={cx(tdCls, 'text-[#737373] whitespace-nowrap')}>{safeFormatDate(p.created_at)}</td>
                          <td className={cx(tdCls, 'text-right')}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => openPartnerModal(p)} className={cx(btn.base, btn.secondary, btn.xs)}>
                                Review
                              </button>
                              {renderStatusActions(p, btn.xs)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="md:hidden divide-y divide-[#F0F0F0]">
                  {applications.map((p) => (
                    <li key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block font-medium text-[#171717] truncate">{fullName(p)}</span>
                          <span className="block text-xs text-[#737373] truncate">{p.business_name || 'Individual'} · Applied {safeFormatDate(p.created_at)}</span>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="text-xs text-[#737373] truncate">{p.email} · {p.whatsapp || p.phone || '—'}</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openPartnerModal(p)} className={cx(btn.base, btn.secondary, btn.sm, 'flex-1')}>
                          Review
                        </button>
                        {renderStatusActions(p)}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}
        </section>
      )}

      {/* ========================== COMMISSIONS =========================== */}
      {subTab === 'commissions' && (
        <section className="space-y-4" aria-labelledby="aff-comm-title">
          <h2 id="aff-comm-title" className="sr-only">Commissions</h2>
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
            <FilterChips
              idPrefix="aff-comm-status"
              value={commissionStatusFilter}
              onChange={setCommissionStatusFilter}
              options={[
                { value: 'all', label: 'All', count: commissionCounts.all },
                { value: 'pending', label: 'Pending', count: commissionCounts.pending || 0 },
                { value: 'approved', label: 'Approved', count: commissionCounts.approved || 0 },
                { value: 'paid', label: 'Paid', count: commissionCounts.paid || 0 },
                { value: 'declined', label: 'Declined', count: commissionCounts.declined || 0 },
              ]}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <SearchInput id="aff-comm-search" value={commSearch} onChange={setCommSearch} placeholder="Search booking, guest…" className="sm:w-60" />
              <select
                id="aff-comm-partner"
                aria-label="Filter by partner"
                value={globalPartnerFilter}
                onChange={(e) => setGlobalPartnerFilter(e.target.value)}
                className={cx(selectCls, 'sm:w-52')}
              >
                <option value="all">All partners</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.partner_code}>{p.partner_code} — {fullName(p)}</option>
                ))}
              </select>
            </div>
          </div>

          {tableShell(
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-[#E5E5E5]">
                    <tr>
                      <th className={thCls}>Date</th>
                      <th className={thCls}>Booking</th>
                      <th className={thCls}>Partner</th>
                      <th className={cx(thCls, 'text-right')}>Booking amount</th>
                      <th className={cx(thCls, 'text-right')}>Eligible</th>
                      <th className={cx(thCls, 'text-right')}>Rate</th>
                      <th className={cx(thCls, 'text-right')}>Commission</th>
                      <th className={thCls}>Checks</th>
                      <th className={thCls}>Status</th>
                      <th className={cx(thCls, 'text-right')}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows cols={10} />
                    ) : pagedCommissions.length === 0 ? (
                      <tr><td colSpan={10}><EmptyState title="No commissions found" description="Try a different status, partner, or search." /></td></tr>
                    ) : (
                      pagedCommissions.map((c) => {
                        const settledPayout = c.payout_id ? payoutById[c.payout_id] : null;
                        return (
                          <tr key={c.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                            <td className={cx(tdCls, 'text-[#737373] whitespace-nowrap')}>{safeFormatDate(c.booking_date || c.created_at)}</td>
                            <td className={tdCls}>
                              <button type="button" onClick={() => setSelectedCommissionId(c.id)} className="text-left group max-w-[160px] block" title="View commission details">
                                <span className="block font-mono text-xs font-medium text-[#171717] group-hover:underline">#{c.booking_id}</span>
                                <span className="block text-xs text-[#737373] truncate">{c.guest_name || 'Guest'}</span>
                              </button>
                            </td>
                            <td className={tdCls}><PartnerLink code={c.partner_code} id={c.partner_id} /></td>
                            <td className={cx(tdCls, 'text-right tabular-nums text-[#737373]')}>{formatIDR(c.booking_amount_gross)}</td>
                            <td className={cx(tdCls, 'text-right tabular-nums')}>{formatIDR(c.eligible_treatment_amount)}</td>
                            <td className={cx(tdCls, 'text-right tabular-nums text-[#737373]')}>{c.commission_rate_pct}%</td>
                            <td className={cx(tdCls, 'text-right tabular-nums font-medium')}>{formatIDR(c.commission_amount)}</td>
                            <td className={tdCls}><VerificationChecks c={c} compact /></td>
                            <td className={tdCls}>
                              <StatusBadge status={c.status} />
                              {c.status === 'paid' && (
                                <span className="block text-[11px] text-[#737373] mt-1 font-mono truncate max-w-[150px]" title={settledPayout?.payout_reference}>
                                  {settledPayout?.payout_reference || (c.paid_at ? safeFormatDate(c.paid_at) : '')}
                                </span>
                              )}
                            </td>
                            <td className={cx(tdCls, 'text-right')}><CommissionActions c={c} /></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden">
                {loading ? (
                  <SkeletonList />
                ) : pagedCommissions.length === 0 ? (
                  <EmptyState title="No commissions found" description="Try a different status, partner, or search." />
                ) : (
                  <ul className="divide-y divide-[#F0F0F0]">
                    {pagedCommissions.map((c) => (
                      <li key={c.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <button type="button" onClick={() => setSelectedCommissionId(c.id)} className="text-left min-w-0">
                            <span className="block font-mono text-xs font-medium text-[#171717]">#{c.booking_id}</span>
                            <span className="block text-xs text-[#737373] truncate">
                              {c.guest_name || 'Guest'} · {c.partner_code} · {safeFormatDate(c.booking_date || c.created_at)}
                            </span>
                          </button>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="flex items-end justify-between gap-3">
                          <div className="text-xs text-[#737373] tabular-nums">
                            {c.commission_rate_pct}% of {formatIDR(c.eligible_treatment_amount)}
                          </div>
                          <div className="text-[15px] font-semibold tabular-nums text-black">{formatIDR(c.commission_amount)}</div>
                        </div>
                        <VerificationChecks c={c} />
                        <CommissionActions c={c} size={btn.sm} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Pagination page={commPage} total={filteredGlobalCommissions.length} pageSize={PAGE_SIZE} onChange={setCommPage} label="commissions" />
            </>
          )}
        </section>
      )}

      {/* ============================ PAYOUTS ============================= */}
      {subTab === 'payouts' && (
        <section className="space-y-4" aria-labelledby="aff-payout-title">
          <h2 id="aff-payout-title" className="sr-only">Payouts</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <SearchInput id="aff-payout-search" value={payoutSearch} onChange={setPayoutSearch} placeholder="Search reference, notes…" className="sm:w-64" />
            <select
              id="aff-payout-partner"
              aria-label="Filter by partner"
              value={globalPayoutPartnerFilter}
              onChange={(e) => setGlobalPayoutPartnerFilter(e.target.value)}
              className={cx(selectCls, 'sm:w-52')}
            >
              <option value="all">All partners</option>
              {partners.map((p) => (
                <option key={p.id} value={p.partner_code}>{p.partner_code} — {fullName(p)}</option>
              ))}
            </select>
          </div>

          {tableShell(
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-[#E5E5E5]">
                    <tr>
                      <th className={thCls}>Date</th>
                      <th className={thCls}>Reference</th>
                      <th className={thCls}>Partner</th>
                      <th className={cx(thCls, 'text-right')}>Amount</th>
                      <th className={thCls}>Method</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Notes</th>
                      <th className={cx(thCls, 'text-right')}>Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows cols={8} />
                    ) : pagedPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState
                            title="No payouts yet"
                            description="Recorded payouts will appear here."
                            action={<button type="button" onClick={openNewPayout} className={cx(btn.base, btn.primary, btn.sm)}><Plus size={14} />Record payout</button>}
                          />
                        </td>
                      </tr>
                    ) : (
                      pagedPayouts.map((py) => (
                        <tr key={py.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                          <td className={cx(tdCls, 'text-[#737373] whitespace-nowrap')}>{safeFormatDate(py.created_at)}</td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-0.5">
                              <span className="font-mono text-xs text-[#171717] truncate max-w-[190px]" title={py.payout_reference}>{py.payout_reference}</span>
                              <CopyBtn text={py.payout_reference} id={`ref-${py.id}`} label="Copy reference" />
                            </div>
                          </td>
                          <td className={tdCls}><PartnerLink code={py.partner_code} id={py.partner_id} /></td>
                          <td className={cx(tdCls, 'text-right tabular-nums font-medium')}>{formatIDR(py.amount)}</td>
                          <td className={cx(tdCls, 'capitalize text-[#171717] whitespace-nowrap')}>{methodLabel(py.payout_method)}</td>
                          <td className={tdCls}><StatusBadge status={py.status || 'completed'} /></td>
                          <td className={cx(tdCls, 'text-[#737373]')}>
                            <span className="block truncate max-w-[200px]" title={py.notes || ''}>{py.notes || '—'}</span>
                          </td>
                          <td className={cx(tdCls, 'text-right')}>
                            <button type="button" onClick={() => setSelectedPayoutDetails(py)} className={cx(btn.base, btn.secondary, btn.xs)}>
                              View
                              <CountPill>{getPayoutBookings(py).length}</CountPill>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden">
                {loading ? (
                  <SkeletonList />
                ) : pagedPayouts.length === 0 ? (
                  <EmptyState title="No payouts yet" description="Recorded payouts will appear here." />
                ) : (
                  <ul className="divide-y divide-[#F0F0F0]">
                    {pagedPayouts.map((py) => (
                      <li key={py.id}>
                        <button type="button" onClick={() => setSelectedPayoutDetails(py)} className="w-full text-left p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="block font-mono text-xs text-[#171717] truncate">{py.payout_reference}</span>
                              <span className="block text-xs text-[#737373]">{py.partner_code} · {safeFormatDate(py.created_at)}</span>
                            </div>
                            <StatusBadge status={py.status || 'completed'} />
                          </div>
                          <div className="flex items-end justify-between gap-3">
                            <span className="text-xs text-[#737373] capitalize">{methodLabel(py.payout_method)} · {getPayoutBookings(py).length} bookings</span>
                            <span className="text-[15px] font-semibold tabular-nums text-black">{formatIDR(py.amount)}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Pagination page={payoutPage} total={filteredGlobalPayouts.length} pageSize={PAGE_SIZE} onChange={setPayoutPage} label="payouts" />
            </>
          )}
        </section>
      )}

      {/* ============================ SETTINGS ============================ */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} noValidate className="max-w-3xl space-y-4" aria-labelledby="aff-settings-title">
          <h2 id="aff-settings-title" className="sr-only">Settings</h2>

          <SectionCard title="Commission rules" description="Applied when a partner is created. Each partner's rate can be changed in their profile.">
            <Field label="Default commission rate" htmlFor="set-rate" hint="Between 1% and 50%." error={settingsErrors.rate}>
              <div className="relative sm:max-w-[200px]">
                <input
                  id="set-rate"
                  type="number"
                  min={1}
                  max={50}
                  step="0.5"
                  value={settings.default_commission_rate_pct}
                  onChange={(e) => setSettings({ ...settings, default_commission_rate_pct: e.target.value === '' ? '' : Number(e.target.value) })}
                  className={cx(inputCls, 'pr-9 tabular-nums', settingsErrors.rate && 'border-red-400')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#737373]">%</span>
              </div>
            </Field>
          </SectionCard>

          <SectionCard title="Partner settings" description="How new partner registrations are handled.">
            <label htmlFor="set-auto" className="flex items-start gap-3 cursor-pointer">
              <input
                id="set-auto"
                type="checkbox"
                checked={!!settings.auto_approve_partners}
                onChange={(e) => setSettings({ ...settings, auto_approve_partners: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-[#D4D4D4] accent-black cursor-pointer"
              />
              <span>
                <span className="block text-[13px] font-medium text-[#171717]">Auto-approve applications</span>
                <span className="block text-xs text-[#737373] mt-0.5">New partners become active immediately without manual review.</span>
              </span>
            </label>
          </SectionCard>

          <SectionCard title="Program configuration" description="Referral tracking across the Therapick website.">
            <div className="space-y-5">
              <label htmlFor="set-active" className="flex items-start gap-3 cursor-pointer">
                <input
                  id="set-active"
                  type="checkbox"
                  checked={!!settings.is_program_active}
                  onChange={(e) => setSettings({ ...settings, is_program_active: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-[#D4D4D4] accent-black cursor-pointer"
                />
                <span>
                  <span className="block text-[13px] font-medium text-[#171717]">Program active</span>
                  <span className="block text-xs text-[#737373] mt-0.5">When off, referral links stop attributing new bookings.</span>
                </span>
              </label>
              <Field label="Attribution window" htmlFor="set-days" hint="Days a guest stays linked to a partner after using their link (1–180)." error={settingsErrors.days}>
                <div className="relative sm:max-w-[200px]">
                  <input
                    id="set-days"
                    type="number"
                    min={1}
                    max={180}
                    value={settings.cookie_duration_days}
                    onChange={(e) => setSettings({ ...settings, cookie_duration_days: e.target.value === '' ? '' : Number(e.target.value) })}
                    className={cx(inputCls, 'pr-12 tabular-nums', settingsErrors.days && 'border-red-400')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#737373]">days</span>
                </div>
              </Field>
            </div>
          </SectionCard>

          <div className="sticky bottom-24 md:bottom-4 z-10 flex items-center justify-between gap-3 bg-white border border-[#E5E5E5] rounded-xl px-4 py-3">
            <span className="text-xs text-[#737373]">
              {settingsDirty ? <span className="text-amber-700 font-medium">Unsaved changes</span> : 'All changes saved'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!settingsDirty || actionLoading}
                onClick={() => savedSettings && setSettings(savedSettings)}
                className={cx(btn.base, btn.secondary, btn.sm)}
              >
                Cancel
              </button>
              <button
                id="aff-settings-save"
                type="submit"
                disabled={!settingsDirty || actionLoading || !!settingsErrors.rate || !!settingsErrors.days}
                className={cx(btn.base, btn.primary, btn.sm)}
              >
                {actionLoading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================= PARTNER WORKSPACE ======================== */}
      <FullScreenModal
        open={!!(selectedPartner && activePartnerMetrics)}
        onClose={() => setSelectedPartnerId(null)}
        zIndex="z-[70]"
        title={selectedPartner ? fullName(selectedPartner) : ''}
        meta={
          selectedPartner && (
            <>
              <span className="inline-flex items-center h-6 px-2 rounded-md border border-[#E5E5E5] font-mono text-xs text-[#171717]">
                {selectedPartner.partner_code}
              </span>
              <StatusBadge status={selectedPartner.status} />
            </>
          )
        }
        subtitle={
          selectedPartner && (
            <span>
              {selectedPartner.business_name || 'Individual'} · {selectedPartner.commission_rate_pct}% rate · Joined {safeFormatDate(selectedPartner.created_at)}
            </span>
          )
        }
        actions={
          selectedPartner &&
          activePartnerMetrics && (
            <>
              {activePartnerMetrics.approvedUnpaid > 0 && (
                <button type="button" onClick={() => openQuickPayoutForPartner(selectedPartner)} className={cx(btn.base, btn.secondary, btn.sm)}>
                  <Plus size={14} />
                  Record payout
                </button>
              )}
              {renderStatusActions(selectedPartner)}
            </>
          )
        }
        tabs={
          activePartnerMetrics && (
            <Tabs
              idPrefix="aff-partner-tab"
              className="border-b-0"
              value={partnerActiveTab}
              onChange={(id) => setPartnerActiveTab(id as PartnerTab)}
              items={[
                { id: 'overview', label: 'Overview' },
                { id: 'bookings', label: 'Bookings', count: activePartnerMetrics.bookingsCount, alert: activePartnerMetrics.pendingCount },
                { id: 'commissions', label: 'Commissions', count: activePartnerMetrics.commissions.length },
                { id: 'payouts', label: 'Payouts', count: activePartnerMetrics.payouts.length },
                { id: 'history', label: 'History' },
              ]}
            />
          )
        }
        bodyClassName={partnerActiveTab === 'bookings' ? 'overflow-y-auto lg:overflow-hidden' : 'overflow-y-auto'}
      >
        {selectedPartner && activePartnerMetrics && (
          <>
            {/* Overview */}
            {partnerActiveTab === 'overview' && (
              <div className="px-4 md:px-8 py-6 space-y-6 max-w-6xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl overflow-hidden">
                  {[
                    { label: 'Commission', value: activePartnerMetrics.totalEarned, hint: `${activePartnerMetrics.commissions.length} bookings` },
                    { label: 'Ready to pay', value: activePartnerMetrics.approvedUnpaid, hint: 'Approved, unpaid' },
                    { label: 'Paid out', value: activePartnerMetrics.totalPaidOut, hint: `${activePartnerMetrics.payouts.length} payouts` },
                    { label: 'Pending', value: activePartnerMetrics.pending, hint: 'Awaiting approval' },
                  ].map((k, i) => (
                    <div key={k.label} className={cx('p-4', i % 2 === 1 && 'border-l border-[#E5E5E5]', i >= 2 && 'border-t lg:border-t-0 border-[#E5E5E5]', i === 2 && 'lg:border-l')}>
                      <div className="text-xs text-[#737373]">{k.label}</div>
                      <div className="text-lg font-semibold text-black tabular-nums mt-1">{formatIDR(k.value)}</div>
                      <div className="text-[11px] text-[#A3A3A3] mt-0.5">{k.hint}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Contact information" bodyClassName="px-4 md:px-5 pb-2 pt-2">
                    <dl>
                      <KeyValue label="Email">
                        <span className="inline-flex items-center gap-0.5">
                          <a href={`mailto:${selectedPartner.email}`} className="hover:underline break-all">{selectedPartner.email || '—'}</a>
                          {selectedPartner.email && <CopyBtn text={selectedPartner.email} id="email" label="Copy email" />}
                        </span>
                      </KeyValue>
                      <KeyValue label="WhatsApp">
                        {selectedPartner.whatsapp ? (
                          <a
                            href={`https://wa.me/${selectedPartner.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            {selectedPartner.whatsapp}
                            <ArrowUpRight size={12} className="text-[#737373]" />
                          </a>
                        ) : (
                          <span className="text-[#A3A3A3]">Not provided</span>
                        )}
                      </KeyValue>
                      <KeyValue label="Phone">
                        {selectedPartner.phone ? (
                          <a href={`tel:${selectedPartner.phone}`} className="hover:underline">{selectedPartner.phone}</a>
                        ) : (
                          <span className="text-[#A3A3A3]">Not provided</span>
                        )}
                      </KeyValue>
                    </dl>
                  </SectionCard>

                  <SectionCard title="Business details" bodyClassName="px-4 md:px-5 pb-2 pt-2">
                    <dl>
                      <KeyValue label="Business / villa">{selectedPartner.business_name || 'Individual'}</KeyValue>
                      <KeyValue label="Category"><span className="capitalize">{selectedPartner.partner_type?.replace(/_/g, ' ') || '—'}</span></KeyValue>
                      <KeyValue label="Referral link">
                        <span className="inline-flex items-center gap-0.5 min-w-0">
                          <span className="font-mono text-xs truncate max-w-[220px]" title={`https://www.booktherapick.com/?ref=${selectedPartner.partner_code}`}>
                            booktherapick.com/?ref={selectedPartner.partner_code}
                          </span>
                          <CopyBtn text={`https://www.booktherapick.com/?ref=${selectedPartner.partner_code}`} id="link" label="Copy referral link" />
                        </span>
                      </KeyValue>
                    </dl>
                  </SectionCard>

                  <SectionCard title="Payout details" bodyClassName="px-4 md:px-5 pb-2 pt-2">
                    <dl>
                      <KeyValue label="Method"><span className="capitalize">{methodLabel(selectedPartner.payout_method)}</span></KeyValue>
                      {selectedPartner.payout_details?.bank_name ? (
                        <>
                          <KeyValue label="Bank">{selectedPartner.payout_details.bank_name}</KeyValue>
                          <KeyValue label="Account number">
                            <span className="inline-flex items-center gap-0.5 font-mono">
                              {selectedPartner.payout_details.account_number}
                              <CopyBtn text={selectedPartner.payout_details.account_number} id="acc" label="Copy account number" />
                            </span>
                          </KeyValue>
                          <KeyValue label="Account holder">{selectedPartner.payout_details.account_holder}</KeyValue>
                        </>
                      ) : (
                        <KeyValue label="Bank account"><span className="text-[#A3A3A3]">Not provided</span></KeyValue>
                      )}
                    </dl>
                  </SectionCard>

                  <SectionCard title="Internal notes" description="Visible to admins only.">
                    <label htmlFor="partner-notes" className="sr-only">Internal notes</label>
                    <textarea
                      id="partner-notes"
                      rows={3}
                      value={partnerNotesInput}
                      onChange={(e) => setPartnerNotesInput(e.target.value)}
                      placeholder="Add a note about this partner…"
                      className="w-full rounded-lg border border-[#E5E5E5] bg-white p-3 text-[13px] text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-y"
                    />
                    <div className="flex items-center justify-end gap-2 mt-3">
                      {partnerNotesInput !== (selectedPartner.notes || '') && (
                        <button type="button" onClick={() => setPartnerNotesInput(selectedPartner.notes || '')} className={cx(btn.base, btn.secondary, btn.sm)}>
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionLoading || partnerNotesInput === (selectedPartner.notes || '')}
                        onClick={() => handleSaveNotes(selectedPartner.id)}
                        className={cx(btn.base, btn.primary, btn.sm)}
                      >
                        Save notes
                      </button>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* Bookings calendar — grid fixed, list scrolls */}
            {partnerActiveTab === 'bookings' && (
              <div className="px-4 md:px-8 py-4 lg:h-full flex flex-col gap-4 min-h-0">
                <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => { shiftMonth(partnerCalendarYear, partnerCalendarMonth, -1, setPartnerCalendarYear, setPartnerCalendarMonth); setPartnerSelectedDate(null); }}
                      className={cx(btn.base, btn.secondary, btn.icon)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <h3 className="text-[15px] font-semibold text-black min-w-[140px] text-center">
                      {MONTH_NAMES[partnerCalendarMonth]} {partnerCalendarYear}
                    </h3>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => { shiftMonth(partnerCalendarYear, partnerCalendarMonth, 1, setPartnerCalendarYear, setPartnerCalendarMonth); setPartnerSelectedDate(null); }}
                      className={cx(btn.base, btn.secondary, btn.icon)}
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const n = new Date();
                        setPartnerCalendarYear(n.getFullYear());
                        setPartnerCalendarMonth(n.getMonth());
                        setPartnerSelectedDate(localTodayKey());
                      }}
                      className={cx(btn.base, btn.secondary, btn.sm)}
                    >
                      Today
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[#737373]">
                    <NewIndicator count={partnerMonthBookings.filter((b) => b.status === 'pending').length} />
                    <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Approved</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Paid</span>
                    <span className="tabular-nums">
                      <span className="text-[#171717] font-medium">{partnerMonthBookings.length}</span> bookings ·{' '}
                      <span className="text-[#171717] font-medium">{formatIDR(partnerMonthBookings.reduce((s, b) => s + Number(b.commission_amount || 0), 0))}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:flex-1 lg:min-h-0">
                  <div className="lg:col-span-8 border border-[#E5E5E5] rounded-xl p-3 flex flex-col lg:min-h-0 select-none">
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#737373] mb-2 shrink-0">
                      {DAYS_OF_WEEK.map((d) => <div key={d} className="py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 lg:flex-1 lg:min-h-0 auto-rows-[64px] lg:auto-rows-fr">
                      {Array.from({ length: calendarFirstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                      {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const key = `${partnerCalendarYear}-${String(partnerCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const list = partnerBookingsByDate[key] || [];
                        const selected = partnerSelectedDate === key;
                        const isToday = key === todayKey;
                        const total = list.reduce((s, b) => s + Number(b.commission_amount || 0), 0);
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`${safeFormatDate(key)}, ${list.length} bookings`}
                            onClick={() => setPartnerSelectedDate(selected ? null : key)}
                            className={cx(
                              'h-full min-h-0 rounded-lg border p-1.5 flex flex-col justify-between text-left transition-colors',
                              selected ? 'border-black ring-1 ring-black' : list.length ? 'border-[#D4D4D4] hover:border-black' : 'border-[#F0F0F0] hover:border-[#D4D4D4]'
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={cx(
                                  'text-xs font-medium w-6 h-6 inline-flex items-center justify-center rounded-full',
                                  isToday ? 'bg-black text-white' : list.length ? 'text-[#171717]' : 'text-[#A3A3A3]'
                                )}
                              >
                                {day}
                              </span>
                              {list.length > 0 && <span className="text-[11px] tabular-nums text-[#737373]">{list.length}</span>}
                            </div>
                            {list.length > 0 && (
                              <div className="min-w-0">
                                <div className="hidden sm:block text-[11px] font-medium tabular-nums text-[#171717] truncate">{formatIDR(total)}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {list.some((b) => b.status === 'pending') && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                  {list.some((b) => b.status === 'approved') && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                  {list.some((b) => b.status === 'paid') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col lg:min-h-0 border border-[#E5E5E5] rounded-xl">
                    <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-[#E5E5E5]">
                      <div>
                        <h4 className="text-[13px] font-semibold text-black">
                          {partnerSelectedDate
                            ? safeFormatDate(partnerSelectedDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                            : `${MONTH_NAMES[partnerCalendarMonth]} ${partnerCalendarYear}`}
                        </h4>
                        <span className="text-xs text-[#737373]">
                          {(partnerSelectedDate ? partnerBookingsByDate[partnerSelectedDate]?.length || 0 : partnerMonthBookings.length)} bookings
                        </span>
                      </div>
                      {partnerSelectedDate && (
                        <button type="button" onClick={() => setPartnerSelectedDate(null)} className={cx(btn.base, btn.secondary, btn.xs)}>
                          Whole month
                        </button>
                      )}
                    </div>
                    {(() => {
                      const list = partnerSelectedDate ? partnerBookingsByDate[partnerSelectedDate] || [] : partnerMonthBookings;
                      if (list.length === 0) return <EmptyState title="No bookings" description="Nothing scheduled for this period." />;
                      return (
                        <ul className="lg:flex-1 lg:min-h-0 overflow-y-auto divide-y divide-[#F0F0F0]">
                          {list.map((b) => (
                            <li key={b.id} className="p-4 space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <button type="button" onClick={() => setSelectedCommissionId(b.id)} className="text-left min-w-0 group">
                                  <span className="block font-mono text-xs font-medium text-[#171717] group-hover:underline">#{b.booking_id}</span>
                                  <span className="block text-[13px] text-[#171717] truncate">{b.guest_name || 'Guest'}</span>
                                  <span className="block text-xs text-[#737373] truncate">
                                    {safeFormatDate(b.booking_date || b.created_at, { day: 'numeric', month: 'short' })} {b.booking_time || ''}
                                    {b.location ? ` · ${b.location}` : ''}
                                  </span>
                                </button>
                                <StatusBadge status={b.status} />
                              </div>
                              <div className="flex items-end justify-between text-xs">
                                <span className="text-[#737373] truncate pr-2">{b.treatment_name || 'Treatment'}</span>
                                <span className="font-medium tabular-nums text-[#171717] whitespace-nowrap">{formatIDR(b.commission_amount)}</span>
                              </div>
                              <VerificationChecks c={b} />
                              <CommissionActions c={b} />
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Commissions */}
            {partnerActiveTab === 'commissions' && (
              <div className="px-4 md:px-8 py-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#737373]">Commission rate</div>
                    {editingRateId === selectedPartner.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-28">
                          <label htmlFor="partner-rate" className="sr-only">Commission rate</label>
                          <input
                            id="partner-rate"
                            type="number"
                            step="0.5"
                            min={0}
                            max={100}
                            value={newRateValue}
                            onChange={(e) => setNewRateValue(Number(e.target.value))}
                            className={cx(inputCls, 'pr-8 tabular-nums')}
                            autoFocus
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#737373]">%</span>
                        </div>
                        <button type="button" onClick={() => setEditingRateId(null)} className={cx(btn.base, btn.secondary, btn.sm)}>Cancel</button>
                        <button type="button" disabled={actionLoading} onClick={() => handleSaveCommissionRate(selectedPartner.id)} className={cx(btn.base, btn.primary, btn.sm)}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xl font-semibold text-black tabular-nums">{selectedPartner.commission_rate_pct}%</span>
                        <button
                          type="button"
                          onClick={() => { setEditingRateId(selectedPartner.id); setNewRateValue(Number(selectedPartner.commission_rate_pct)); }}
                          className={cx(btn.base, btn.secondary, btn.xs)}
                        >
                          Edit rate
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-[#737373] mt-1">Applies to new bookings. Existing commissions keep their recorded rate.</p>
                  </div>
                  <FilterChips
                    idPrefix="aff-pcomm"
                    value={partnerCommFilter}
                    onChange={setPartnerCommFilter}
                    options={['all', 'pending', 'approved', 'paid', 'declined'].map((s) => ({
                      value: s,
                      label: s.charAt(0).toUpperCase() + s.slice(1),
                      count: s === 'all' ? activePartnerMetrics.commissions.length : activePartnerMetrics.commissions.filter((c) => c.status === s).length,
                    }))}
                  />
                </div>

                {(() => {
                  const list = activePartnerMetrics.commissions.filter((c) => partnerCommFilter === 'all' || c.status === partnerCommFilter);
                  return tableShell(
                    list.length === 0 ? (
                      <EmptyState title="No commissions" description="Nothing matches this filter." />
                    ) : (
                      <>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-[13px]">
                            <thead className="border-b border-[#E5E5E5]">
                              <tr>
                                <th className={thCls}>Date</th>
                                <th className={thCls}>Booking</th>
                                <th className={cx(thCls, 'text-right')}>Eligible</th>
                                <th className={cx(thCls, 'text-right')}>Rate</th>
                                <th className={cx(thCls, 'text-right')}>Commission</th>
                                <th className={thCls}>Checks</th>
                                <th className={thCls}>Status</th>
                                <th className={cx(thCls, 'text-right')}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((c) => (
                                <tr key={c.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                                  <td className={cx(tdCls, 'text-[#737373] whitespace-nowrap')}>{safeFormatDate(c.booking_date || c.created_at)}</td>
                                  <td className={tdCls}>
                                    <button type="button" onClick={() => setSelectedCommissionId(c.id)} className="text-left group">
                                      <span className="block font-mono text-xs font-medium group-hover:underline">#{c.booking_id}</span>
                                      <span className="block text-xs text-[#737373] truncate max-w-[160px]">{c.guest_name || 'Guest'}</span>
                                    </button>
                                  </td>
                                  <td className={cx(tdCls, 'text-right tabular-nums')}>{formatIDR(c.eligible_treatment_amount)}</td>
                                  <td className={cx(tdCls, 'text-right tabular-nums text-[#737373]')}>{c.commission_rate_pct}%</td>
                                  <td className={cx(tdCls, 'text-right tabular-nums font-medium')}>{formatIDR(c.commission_amount)}</td>
                                  <td className={tdCls}><VerificationChecks c={c} compact /></td>
                                  <td className={tdCls}><StatusBadge status={c.status} /></td>
                                  <td className={cx(tdCls, 'text-right')}><CommissionActions c={c} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <ul className="md:hidden divide-y divide-[#F0F0F0]">
                          {list.map((c) => (
                            <li key={c.id} className="p-4 space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <button type="button" onClick={() => setSelectedCommissionId(c.id)} className="text-left min-w-0">
                                  <span className="block font-mono text-xs font-medium">#{c.booking_id}</span>
                                  <span className="block text-xs text-[#737373]">{safeFormatDate(c.booking_date || c.created_at)} · {c.commission_rate_pct}%</span>
                                </button>
                                <StatusBadge status={c.status} />
                              </div>
                              <div className="text-right text-[15px] font-semibold tabular-nums text-black">{formatIDR(c.commission_amount)}</div>
                              <VerificationChecks c={c} />
                              <CommissionActions c={c} size={btn.sm} />
                            </li>
                          ))}
                        </ul>
                      </>
                    )
                  );
                })()}
              </div>
            )}

            {/* Payouts */}
            {partnerActiveTab === 'payouts' && (
              <div className="px-4 md:px-8 py-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border border-[#E5E5E5] rounded-xl p-4">
                  <div>
                    <div className="text-xs text-[#737373]">Ready to pay</div>
                    <div className="text-xl font-semibold text-black tabular-nums mt-1">{formatIDR(activePartnerMetrics.approvedUnpaid)}</div>
                  </div>
                  <button
                    type="button"
                    disabled={activePartnerMetrics.approvedUnpaid <= 0}
                    onClick={() => openQuickPayoutForPartner(selectedPartner)}
                    className={cx(btn.base, btn.primary, btn.md)}
                  >
                    <Plus size={15} />
                    Record payout
                  </button>
                </div>
                {tableShell(
                  activePartnerMetrics.payouts.length === 0 ? (
                    <EmptyState title="No payouts yet" description="Payouts recorded for this partner will appear here." />
                  ) : (
                    <ul className="divide-y divide-[#F0F0F0]">
                      {activePartnerMetrics.payouts.map((py) => (
                        <li key={py.id}>
                          <button type="button" onClick={() => setSelectedPayoutDetails(py)} className="w-full text-left px-4 py-3 hover:bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                            <div className="min-w-0 flex-1">
                              <span className="block font-mono text-xs text-[#171717] truncate">{py.payout_reference}</span>
                              <span className="block text-xs text-[#737373] truncate">
                                {safeFormatDate(py.created_at)} · <span className="capitalize">{methodLabel(py.payout_method)}</span>
                                {py.notes ? ` · ${py.notes}` : ''}
                              </span>
                            </div>
                            <span className="text-xs text-[#737373] whitespace-nowrap">{getPayoutBookings(py).length} bookings</span>
                            <StatusBadge status={py.status || 'completed'} />
                            <span className="text-[13px] font-semibold tabular-nums text-black sm:w-32 sm:text-right">{formatIDR(py.amount)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            )}

            {/* History */}
            {partnerActiveTab === 'history' && (
              <div className="px-4 md:px-8 py-6 max-w-3xl">
                {partnerHistory.length === 0 ? (
                  <EmptyState title="No activity yet" />
                ) : (
                  <ol className="relative border-l border-[#E5E5E5] ml-1.5 space-y-5">
                    {partnerHistory.map((ev, i) => (
                      <li key={i} className="pl-5 relative">
                        <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#A3A3A3]" aria-hidden="true" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-[#171717]">{ev.title}</span>
                          {ev.status && <StatusBadge status={ev.status} />}
                        </div>
                        {ev.detail && <div className="text-xs text-[#737373] mt-0.5">{ev.detail}</div>}
                        <div className="text-[11px] text-[#A3A3A3] mt-0.5">{safeFormatDate(ev.date)}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </>
        )}
      </FullScreenModal>

      {/* ========================== RECORD PAYOUT ========================== */}
      <FullScreenModal
        open={showPayoutModal}
        onClose={closePayoutModal}
        zIndex="z-[75]"
        onSubmit={handleRecordPayout}
        title="Record payout"
        meta={payoutSelectedPartner && (
          <span className="inline-flex items-center h-6 px-2 rounded-md border border-[#E5E5E5] font-mono text-xs text-[#171717]">{payoutSelectedPartner.partner_code}</span>
        )}
        subtitle="Select approved bookings to settle and log the transfer."
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#737373]">
              {payoutForm.partner_id ? (
                <>
                  <span className="text-[#171717] font-medium tabular-nums">{selectedCommissionIds.length}</span> of {payoutApprovedCommissions.length} bookings selected ·{' '}
                  <span className="text-[#171717] font-medium tabular-nums">{formatIDR(selectedPayoutSum)}</span>
                </>
              ) : (
                'Choose a partner to begin.'
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={closePayoutModal} className={cx(btn.base, btn.secondary, btn.md, 'flex-1 sm:flex-none')}>
                Cancel
              </button>
              <button id="aff-payout-submit" type="submit" disabled={actionLoading} className={cx(btn.base, btn.primary, btn.md, 'flex-1 sm:flex-none')}>
                {actionLoading ? 'Recording…' : `Record ${formatIDR(Number(payoutForm.amount) || 0)}`}
              </button>
            </div>
          </div>
        }
      >
        <div className="px-4 md:px-8 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-7xl">
          {/* Form */}
          <div className="xl:col-span-4 space-y-5">
            <SectionCard title="Payout">
              <div className="space-y-4">
                <Field label="Partner" htmlFor="payout-partner" error={payoutSubmitted ? payoutErrors.partner : null}>
                  <select
                    id="payout-partner"
                    value={payoutForm.partner_id}
                    onChange={(e) => (e.target.value ? handleSelectPayoutPartner(e.target.value) : setPayoutForm(EMPTY_PAYOUT_FORM))}
                    className={cx(selectCls, payoutSubmitted && payoutErrors.partner && 'border-red-400')}
                  >
                    <option value="">Select partner…</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partner_code} — {fullName(p)}
                        {metricsById[p.id]?.approvedUnpaid ? ` (${formatIDR(metricsById[p.id].approvedUnpaid)} ready)` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Amount"
                  htmlFor="payout-amount"
                  error={payoutSubmitted ? payoutErrors.amount : null}
                  hint={selectedCommissionIds.length > 0 ? `Calculated from ${selectedCommissionIds.length} selected bookings.` : undefined}
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#737373]">Rp</span>
                    <input
                      id="payout-amount"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="0"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                      className={cx(inputCls, 'pl-10 tabular-nums font-medium', payoutSubmitted && payoutErrors.amount && 'border-red-400')}
                    />
                  </div>
                </Field>

                <Field label="Method" htmlFor="payout-method">
                  <select
                    id="payout-method"
                    value={payoutForm.payout_method}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payout_method: e.target.value })}
                    className={selectCls}
                  >
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="wise">Wise</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash</option>
                  </select>
                </Field>

                <Field label="Notes / transfer reference" htmlFor="payout-notes">
                  <input
                    id="payout-notes"
                    type="text"
                    placeholder="e.g. BCA ref 88392102"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
            </SectionCard>

            {payoutSelectedPartner && (
              <SectionCard title="Recipient" bodyClassName="px-4 md:px-5 pb-2 pt-2">
                <dl>
                  <KeyValue label="Partner">{fullName(payoutSelectedPartner)}</KeyValue>
                  <KeyValue label="Method"><span className="capitalize">{methodLabel(payoutSelectedPartner.payout_method)}</span></KeyValue>
                  {payoutSelectedPartner.payout_details?.bank_name ? (
                    <>
                      <KeyValue label="Bank">{payoutSelectedPartner.payout_details.bank_name}</KeyValue>
                      <KeyValue label="Account" mono>{payoutSelectedPartner.payout_details.account_number}</KeyValue>
                      <KeyValue label="Holder">{payoutSelectedPartner.payout_details.account_holder}</KeyValue>
                    </>
                  ) : (
                    <KeyValue label="Bank account"><span className="text-[#A3A3A3]">Not provided</span></KeyValue>
                  )}
                </dl>
              </SectionCard>
            )}

            {payoutForm.partner_id && payoutApprovedCommissions.length > 0 && selectedCommissionIds.length === 0 && (
              <div className="flex gap-2.5 border border-[#E5E5E5] rounded-xl p-3 text-xs text-[#525252]">
                <Info size={15} className="shrink-0 text-[#737373] mt-0.5" />
                <span>No bookings selected. When recorded, all approved commissions for this partner will be marked as paid.</span>
              </div>
            )}
          </div>

          {/* Booking selection */}
          <div className="xl:col-span-8">
            {!payoutForm.partner_id ? (
              <div className="border border-[#E5E5E5] rounded-xl">
                <EmptyState title="Select a partner" description="Their approved bookings and calendar will appear here." />
              </div>
            ) : (
              <SectionCard
                title="Approved bookings"
                description="Pick a date to filter, then tick the bookings included in this payout."
                actions={
                  <>
                    <button type="button" onClick={deselectAllApproved} className={cx(btn.base, btn.secondary, btn.xs)}>Clear</button>
                    <button type="button" onClick={selectAllApproved} className={cx(btn.base, btn.secondary, btn.xs)}>Select all</button>
                  </>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Mini calendar */}
                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => { shiftMonth(payoutCalendarYear, payoutCalendarMonth, -1, setPayoutCalendarYear, setPayoutCalendarMonth); setPayoutSelectedDate(null); }}
                        className={cx(btn.base, btn.secondary, btn.xs, 'w-9 md:w-7 px-0')}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[13px] font-semibold text-black">{MONTH_NAMES[payoutCalendarMonth]} {payoutCalendarYear}</span>
                      <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => { shiftMonth(payoutCalendarYear, payoutCalendarMonth, 1, setPayoutCalendarYear, setPayoutCalendarMonth); setPayoutSelectedDate(null); }}
                        className={cx(btn.base, btn.secondary, btn.xs, 'w-9 md:w-7 px-0')}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#737373] mb-1">
                      {DAYS_OF_WEEK.map((d) => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: payoutCalendarFirstDayOfWeek }).map((_, i) => <div key={`pe-${i}`} />)}
                      {Array.from({ length: payoutCalendarDaysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const key = `${payoutCalendarYear}-${String(payoutCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const approved = payoutApprovedByDate[key]?.length || 0;
                        const paid = payoutPaidByDate[key] || 0;
                        const selected = payoutSelectedDate === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`${safeFormatDate(key)}: ${approved} approved, ${paid} paid`}
                            onClick={() => setPayoutSelectedDate(selected ? null : key)}
                            className={cx(
                              'h-10 rounded-md border text-xs flex flex-col items-center justify-center gap-0.5 transition-colors',
                              selected ? 'border-black ring-1 ring-black text-black font-semibold' : approved ? 'border-[#D4D4D4] text-[#171717] hover:border-black' : 'border-transparent text-[#A3A3A3] hover:border-[#E5E5E5]'
                            )}
                          >
                            {day}
                            <span className="flex gap-0.5 h-1.5">
                              {approved > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                              {paid > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-[#737373]">
                      <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Approved</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Already paid</span>
                      {payoutSelectedDate && (
                        <button type="button" onClick={() => setPayoutSelectedDate(null)} className="ml-auto text-black font-medium hover:underline">
                          Show all dates
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="md:col-span-7">
                    {(() => {
                      const list = payoutSelectedDate
                        ? payoutApprovedCommissions.filter((c) => commDateKey(c) === payoutSelectedDate)
                        : payoutApprovedCommissions;
                      if (list.length === 0) {
                        return (
                          <div className="border border-[#E5E5E5] rounded-lg">
                            <EmptyState
                              title={`No approved bookings${payoutSelectedDate ? ' on this date' : ''}`}
                              description="Only approved commissions can be paid. Approve pending bookings in the partner's calendar first."
                            />
                          </div>
                        );
                      }
                      return (
                        <ul className="border border-[#E5E5E5] rounded-lg divide-y divide-[#F0F0F0] max-h-[420px] overflow-y-auto">
                          {list.map((c) => {
                            const checked = selectedCommissionIds.includes(c.id);
                            return (
                              <li key={c.id}>
                                <label className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCommissionSelection(c.id)}
                                    className="w-4 h-4 rounded border-[#D4D4D4] accent-black cursor-pointer shrink-0"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-medium text-[#171717]">#{c.booking_id}</span>
                                      <span className="text-xs text-[#737373]">{safeFormatDate(c.booking_date || c.created_at, { day: 'numeric', month: 'short' })}</span>
                                    </span>
                                    <span className="block text-xs text-[#737373] truncate">{c.guest_name || 'Guest'} · {c.treatment_name || 'Treatment'}</span>
                                  </span>
                                  <span className="text-right shrink-0">
                                    <span className="block text-[13px] font-medium tabular-nums text-[#171717]">{formatIDR(c.commission_amount)}</span>
                                    <span className="block text-[11px] tabular-nums text-[#737373]">{c.commission_rate_pct}% of {formatIDR(c.eligible_treatment_amount)}</span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      );
                    })()}

                    {payoutPaidCommissions.length > 0 && (
                      <div className="mt-4">
                        <button
                          type="button"
                          aria-expanded={showPastPaidInPayoutModal}
                          onClick={() => setShowPastPaidInPayoutModal((v) => !v)}
                          className="text-xs font-medium text-[#737373] hover:text-black"
                        >
                          {showPastPaidInPayoutModal ? 'Hide' : 'Show'} previously paid ({payoutPaidCommissions.length})
                        </button>
                        {showPastPaidInPayoutModal && (
                          <ul className="mt-2 border border-[#E5E5E5] rounded-lg divide-y divide-[#F0F0F0] max-h-48 overflow-y-auto">
                            {payoutPaidCommissions.map((c) => (
                              <li key={`paid-${c.id}`} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono text-[#171717]">#{c.booking_id}</span>
                                  <span className="text-[#737373]">{safeFormatDate(c.booking_date || c.created_at, { day: 'numeric', month: 'short' })}</span>
                                  <StatusBadge status="paid" />
                                </span>
                                <span className="tabular-nums text-[#171717]">{formatIDR(c.commission_amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </FullScreenModal>

      {/* ======================== PAYOUT BREAKDOWN ========================= */}
      <FullScreenModal
        open={!!selectedPayoutDetails}
        onClose={() => setSelectedPayoutDetails(null)}
        zIndex="z-[80]"
        title="Payout details"
        meta={
          selectedPayoutDetails && (
            <>
              <span className="inline-flex items-center h-6 px-2 rounded-md border border-[#E5E5E5] font-mono text-xs text-[#171717] max-w-[240px] truncate">
                {selectedPayoutDetails.payout_reference}
              </span>
              <StatusBadge status={selectedPayoutDetails.status || 'completed'} />
            </>
          )
        }
        subtitle={
          selectedPayoutDetails && (
            <span>
              {selectedPayoutDetails.partner_code} · {safeFormatDate(selectedPayoutDetails.created_at)} ·{' '}
              <span className="capitalize">{methodLabel(selectedPayoutDetails.payout_method)}</span>
            </span>
          )
        }
        footer={
          <div className="flex items-center justify-end">
            <button type="button" onClick={() => setSelectedPayoutDetails(null)} className={cx(btn.base, btn.primary, btn.md)}>
              Done
            </button>
          </div>
        }
      >
        {selectedPayoutDetails &&
          (() => {
            const items = getPayoutBookings(selectedPayoutDetails);
            const volume = items.reduce((s, b) => s + Number(b.eligible_treatment_amount || 0), 0);
            return (
              <div className="px-4 md:px-8 py-6 space-y-6 max-w-6xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5E5] rounded-xl overflow-hidden">
                  {[
                    { label: 'Amount', value: formatIDR(selectedPayoutDetails.amount) },
                    { label: 'Bookings', value: String(items.length) },
                    { label: 'Treatment volume', value: formatIDR(volume) },
                    { label: 'Notes', value: selectedPayoutDetails.notes || '—' },
                  ].map((k, i) => (
                    <div key={k.label} className={cx('p-4 min-w-0', i % 2 === 1 && 'border-l border-[#E5E5E5]', i >= 2 && 'border-t lg:border-t-0 border-[#E5E5E5]', i === 2 && 'lg:border-l')}>
                      <div className="text-xs text-[#737373]">{k.label}</div>
                      <div className={cx('mt-1 text-black truncate', k.label === 'Notes' ? 'text-[13px]' : 'text-lg font-semibold tabular-nums')} title={k.value}>
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-[15px] font-semibold text-black mb-3">Settled bookings</h3>
                  {tableShell(
                    items.length === 0 ? (
                      <EmptyState title="No linked bookings" description={`This payout of ${formatIDR(selectedPayoutDetails.amount)} has no itemized bookings.`} />
                    ) : (
                      <>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-[13px]">
                            <thead className="border-b border-[#E5E5E5]">
                              <tr>
                                <th className={thCls}>Booking</th>
                                <th className={thCls}>Date</th>
                                <th className={thCls}>Guest</th>
                                <th className={thCls}>Treatment</th>
                                <th className={cx(thCls, 'text-right')}>Eligible</th>
                                <th className={cx(thCls, 'text-right')}>Rate</th>
                                <th className={cx(thCls, 'text-right')}>Commission</th>
                                <th className={thCls}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((b) => (
                                <tr key={b.id} className="border-b border-[#F0F0F0] last:border-0">
                                  <td className={tdCls}>
                                    <span className="inline-flex items-center gap-0.5 font-mono text-xs font-medium">
                                      #{b.booking_id}
                                      <CopyBtn text={b.booking_id} id={`pbk-${b.id}`} label="Copy booking reference" />
                                    </span>
                                  </td>
                                  <td className={cx(tdCls, 'text-[#737373] whitespace-nowrap')}>
                                    {safeFormatDate(b.booking_date || b.created_at)} {b.booking_time || ''}
                                  </td>
                                  <td className={tdCls}>
                                    <span className="block truncate max-w-[180px]">{b.guest_name || 'Guest'}</span>
                                    {b.location && <span className="block text-xs text-[#737373] truncate max-w-[180px]">{b.location}{b.room_number ? ` (${b.room_number})` : ''}</span>}
                                  </td>
                                  <td className={cx(tdCls, 'text-[#171717]')}><span className="block truncate max-w-[200px]">{b.treatment_name || 'Spa Treatment'}</span></td>
                                  <td className={cx(tdCls, 'text-right tabular-nums')}>{formatIDR(b.eligible_treatment_amount)}</td>
                                  <td className={cx(tdCls, 'text-right tabular-nums text-[#737373]')}>{b.commission_rate_pct}%</td>
                                  <td className={cx(tdCls, 'text-right tabular-nums font-medium')}>{formatIDR(b.commission_amount)}</td>
                                  <td className={tdCls}><StatusBadge status={b.status} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <ul className="md:hidden divide-y divide-[#F0F0F0]">
                          {items.map((b) => (
                            <li key={b.id} className="p-4 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="block font-mono text-xs font-medium">#{b.booking_id}</span>
                                <span className="block text-xs text-[#737373] truncate">{b.guest_name || 'Guest'} · {safeFormatDate(b.booking_date || b.created_at)}</span>
                                <span className="block text-xs text-[#737373] truncate">{b.treatment_name || 'Spa Treatment'}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-[13px] font-semibold tabular-nums">{formatIDR(b.commission_amount)}</span>
                                <StatusBadge status={b.status} className="mt-1" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    )
                  )}
                </div>
              </div>
            );
          })()}
      </FullScreenModal>

      {/* ======================= COMMISSION DRAWER ========================= */}
      <Drawer
        open={!!selectedCommission}
        onClose={() => setSelectedCommissionId(null)}
        zIndex="z-[85]"
        title={selectedCommission ? `#${selectedCommission.booking_id}` : ''}
        meta={selectedCommission && <StatusBadge status={selectedCommission.status} />}
        footer={
          selectedCommission && (
            <div className="flex items-center justify-between gap-2">
              {(() => {
                const p = findPartner(selectedCommission.partner_code, selectedCommission.partner_id);
                return p ? (
                  <button
                    type="button"
                    onClick={() => { setSelectedCommissionId(null); openPartnerModal(p, 'commissions'); }}
                    className={cx(btn.base, btn.secondary, btn.sm)}
                  >
                    Open partner
                  </button>
                ) : <span />;
              })()}
              <CommissionActions c={selectedCommission} size={btn.sm} />
            </div>
          )
        }
      >
        {selectedCommission && (
          <div className="space-y-6">
            <div>
              <div className="text-xs text-[#737373]">Commission</div>
              <div className="text-2xl font-semibold text-black tabular-nums mt-1">{formatIDR(selectedCommission.commission_amount)}</div>
              <div className="text-xs text-[#737373] mt-0.5 tabular-nums">
                {selectedCommission.commission_rate_pct}% of {formatIDR(selectedCommission.eligible_treatment_amount)}
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-black mb-1">Booking</h3>
              <dl>
                <KeyValue label="Guest">{selectedCommission.guest_name || 'Guest'}</KeyValue>
                <KeyValue label="Treatment">{selectedCommission.treatment_name || '—'}</KeyValue>
                <KeyValue label="Date">
                  {safeFormatDate(selectedCommission.booking_date || selectedCommission.created_at)} {selectedCommission.booking_time || ''}
                </KeyValue>
                <KeyValue label="Location">
                  {selectedCommission.location || '—'}
                  {selectedCommission.room_number ? ` (${selectedCommission.room_number})` : ''}
                </KeyValue>
                <KeyValue label="Booking status"><span className="capitalize">{selectedCommission.booking_status || '—'}</span></KeyValue>
              </dl>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-black mb-1">Amounts</h3>
              <dl>
                <KeyValue label="Booking amount">{formatIDR(selectedCommission.booking_amount_gross)}</KeyValue>
                <KeyValue label="Eligible treatment">{formatIDR(selectedCommission.eligible_treatment_amount)}</KeyValue>
                <KeyValue label="Rate">{selectedCommission.commission_rate_pct}%</KeyValue>
              </dl>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-black mb-1">Settlement</h3>
              <dl>
                <KeyValue label="Partner">{selectedCommission.partner_code}</KeyValue>
                <KeyValue label="Approved">{selectedCommission.approved_at ? safeFormatDate(selectedCommission.approved_at) : '—'}</KeyValue>
                <KeyValue label="Paid">{selectedCommission.paid_at ? safeFormatDate(selectedCommission.paid_at) : '—'}</KeyValue>
                <KeyValue label="Payout" mono>
                  {selectedCommission.payout_id && payoutById[selectedCommission.payout_id] ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPayoutDetails(payoutById[selectedCommission.payout_id])}
                      className="hover:underline text-xs"
                    >
                      {payoutById[selectedCommission.payout_id].payout_reference}
                    </button>
                  ) : (
                    '—'
                  )}
                </KeyValue>
              </dl>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-black mb-2">Verification</h3>
              <VerificationChecks c={selectedCommission} compact />
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================== CONFIRMATION ========================== */}
      <ConfirmDialog
        open={!!confirmState}
        loading={actionLoading}
        title={
          confirmState?.kind === 'partner-status'
            ? CONFIRM_COPY[confirmState.verb].title
            : 'Decline commission'
        }
        description={
          confirmState?.kind === 'partner-status'
            ? CONFIRM_COPY[confirmState.verb].body(confirmState.name)
            : confirmState?.kind === 'decline-commission'
            ? `Commission for booking #${confirmState.ref} will be declined and excluded from payouts.`
            : ''
        }
        confirmLabel={confirmState?.kind === 'partner-status' ? CONFIRM_COPY[confirmState.verb].confirm : 'Decline'}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const c = confirmState;
          if (!c) return;
          if (c.kind === 'partner-status') await handlePartnerStatus(c.id, c.next);
          else await handleUpdateCommission(c.id, { status: 'declined' });
          setConfirmState(null);
        }}
      />

      <Toast toast={toast} />
    </div>
  );
}
