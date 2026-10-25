'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Check, 
  Copy, 
  X,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  CheckSquare,
  Square
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

export default function AffiliateManagement() {
  const [subTab, setSubTab] = useState<'partners' | 'commissions' | 'payouts' | 'settings'>('partners');
  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    default_commission_rate_pct: 15.00,
    cookie_duration_days: 30,
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

  // Commission rate edit state
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState<number>(15);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
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
      if (sData.success && sData.settings) setSettings(sData.settings);
    } catch (err) {
      console.error('Failed to load affiliate admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [partnerStatusFilter]);

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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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
        alert('Notes updated successfully');
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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
      } else {
        alert(data.message || 'Failed to record payout');
      }
    } catch (e) {
      console.error(e);
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
        alert('Settings updated successfully');
      }
    } catch (e) {
      console.error(e);
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

    return {
      commissions: pComms,
      payouts: pPayouts,
      totalEarned,
      approvedUnpaid,
      pending,
      paidComms,
      totalPaidOut,
      bookingsCount,
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

  const payoutPendingCommissions = useMemo(() => {
    return payoutPartnerCommissions.filter((c) => c.status === 'pending');
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

  // Filtered partners by search
  const filteredPartners = partners.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.partner_code?.toLowerCase().includes(q) ||
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.business_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  // Global commissions filtered for tab 2
  const filteredGlobalCommissions = commissions.filter((c) => {
    if (commissionStatusFilter !== 'all' && c.status !== commissionStatusFilter) return false;
    if (globalPartnerFilter !== 'all' && c.partner_code !== globalPartnerFilter) return false;
    return true;
  });

  // Global payouts filtered for tab 3
  const filteredGlobalPayouts = payouts.filter((py) => {
    if (globalPayoutPartnerFilter !== 'all' && py.partner_code !== globalPayoutPartnerFilter) return false;
    return true;
  });

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
    <div className="space-y-6">
      
      {/* UNIFIED COMPACT TOOLBAR: SECTION TABS + SHORT SEARCH + FILTERS */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-black/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Section Switcher Tabs */}
        <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl shrink-0 border border-black/10 overflow-x-auto">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white text-black' : 'bg-black/10 text-black'
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Shorter Search Bar on Desktop */}
            <div className="relative w-full sm:w-60 md:w-64 lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner, code, villa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/15 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-black/40"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 text-xs overflow-x-auto shrink-0">
              {['all', 'pending', 'active', 'suspended', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPartnerStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium text-xs transition-colors whitespace-nowrap ${
                    partnerStatusFilter === st
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:bg-black/5'
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto text-xs">
            <div className="flex items-center gap-1 overflow-x-auto shrink-0">
              {['all', 'pending', 'approved', 'paid', 'declined'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCommissionStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                    commissionStatusFilter === st
                      ? 'bg-black text-white'
                      : 'text-black/60 hover:bg-black/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <select
              value={globalPartnerFilter}
              onChange={(e) => setGlobalPartnerFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-black/15 bg-white text-xs font-medium focus:outline-none focus:border-black shrink-0"
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
          <div className="flex items-center gap-2.5 w-full lg:w-auto text-xs justify-end">
            <select
              value={globalPayoutPartnerFilter}
              onChange={(e) => setGlobalPayoutPartnerFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-black/15 bg-white text-xs font-medium focus:outline-none focus:border-black shrink-0"
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
              className="px-3.5 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-black/80 shadow-sm whitespace-nowrap"
            >
              + Record New Payout
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: PARTNERS (MAIN TABLE) */}
      {subTab === 'partners' && (
        <div className="space-y-4">

          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/80 font-bold">
                  <tr>
                    <th className="py-3 px-4">Partner Code</th>
                    <th className="py-3 px-4">Name / Villa</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Paid Out</th>
                    <th className="py-3 px-4">Calendar</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-black/50">
                        No affiliate partners match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((p) => {
                      const metrics = getPartnerMetrics(p);
                      return (
                        <tr key={p.id} className="hover:bg-black/[0.02] transition-colors">
                          {/* 1. Partner Code */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-mono font-bold text-black bg-black/5 px-2 py-0.5 rounded border border-black/10">
                                {p.partner_code}
                              </span>
                              <span className="text-[10px] text-black/40">
                                {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                              </span>
                            </div>
                          </td>

                          {/* 2. Name / Villa (Contact & Category hidden to Details page) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-bold text-black text-sm">{p.first_name} {p.last_name || ''}</div>
                            {p.business_name ? (
                              <div className="text-[11px] text-black/60 mt-0.5">
                                {p.business_name}
                              </div>
                            ) : (
                              <div className="text-[11px] text-black/40 mt-0.5">Individual Partner</div>
                            )}
                          </td>

                          {/* 3. Commission (Cleaned: rate setting inside modal, proper button) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-black text-xs font-mono">
                                  {formatIDR(metrics.totalEarned)}
                                </span>
                                {metrics.approvedUnpaid > 0 ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    {formatIDR(metrics.approvedUnpaid)} unpaid
                                  </span>
                                ) : metrics.pending > 0 ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-black/70 bg-black/5 border border-black/10">
                                    {formatIDR(metrics.pending)} pending
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-black/40">Settled</span>
                                )}
                              </div>

                              <div>
                                <button
                                  onClick={() => openPartnerModal(p, 'commissions')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black hover:text-white text-black font-semibold rounded-xl text-xs transition-all border border-black/10 group shadow-2xs"
                                  title="View partner commissions and adjust commission rate"
                                >
                                  <span>Commissions</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 group-hover:bg-white/20 font-mono font-bold">
                                    {metrics.commissions.length}
                                  </span>
                                  <span className="text-black/40 group-hover:text-white">&rarr;</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 4. Paid Out (Independent) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <div className="font-bold text-black text-xs">
                                {formatIDR(metrics.totalPaidOut)}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => openPartnerModal(p, 'payouts')}
                                  className="text-[11px] text-black/60 hover:text-black hover:underline"
                                >
                                  {metrics.payouts.length} {metrics.payouts.length === 1 ? 'payout' : 'payouts'}
                                </button>
                                {metrics.approvedUnpaid > 0 && (
                                  <button
                                    onClick={() => openQuickPayoutForPartner(p)}
                                    className="text-[10px] px-2 py-0.5 bg-black text-white rounded font-bold hover:bg-black/80"
                                    title="Record payout"
                                  >
                                    + Pay
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. Calendar (Independent) */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <button
                                onClick={() => openPartnerModal(p, 'calendar')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black font-bold rounded-xl text-xs transition-all border border-black/20 group"
                              >
                                <span>Calendar</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 group-hover:bg-white/20 font-mono">
                                  {metrics.bookingsCount}
                                </span>
                              </button>
                              {metrics.latestBooking ? (
                                <div className="text-[10px] text-black/50">
                                  Latest: {safeFormatDate(metrics.latestBooking.booking_date || metrics.latestBooking.created_at)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-black/40">No bookings yet</div>
                              )}
                            </div>
                          </td>

                          {/* 6. Status */}
                          <td className="py-3.5 px-4 align-top">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'active'
                                  ? 'bg-black text-white'
                                  : 'bg-black/5 text-black border border-black/15'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          {/* 7. Actions */}
                          <td className="py-3.5 px-4 align-top text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => openPartnerModal(p, 'overview')}
                              className="px-2.5 py-1 bg-black/5 hover:bg-black hover:text-white text-black font-semibold rounded-lg text-[11px] transition-colors"
                            >
                              Details
                            </button>
                            {p.status === 'pending' && (
                              <button
                                onClick={() => handlePartnerStatus(p.id, 'active')}
                                className="px-2.5 py-1 bg-black text-white font-bold rounded-lg text-[11px] hover:bg-black/80"
                              >
                                Approve
                              </button>
                            )}
                            {p.status === 'active' && (
                              <button
                                onClick={() => handlePartnerStatus(p.id, 'suspended')}
                                className="px-2.5 py-1 border border-black/20 hover:bg-black/5 text-black font-semibold rounded-lg text-[11px]"
                              >
                                Suspend
                              </button>
                            )}
                            {p.status === 'suspended' && (
                              <button
                                onClick={() => handlePartnerStatus(p.id, 'active')}
                                className="px-2.5 py-1 bg-black text-white hover:bg-black/80 font-semibold rounded-lg text-[11px]"
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
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GLOBAL COMMISSIONS */}
      {subTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/80 font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Gross Revenue</th>
                    <th className="py-3 px-4">Treatment Net</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Verifications</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredGlobalCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-black/50">
                        No commissions found under this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredGlobalCommissions.map((c) => (
                      <tr key={c.id} className="hover:bg-black/[0.02]">
                        <td className="py-3 px-4 text-black/60 whitespace-nowrap">
                          {safeFormatDate(c.booking_date || c.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-black">
                          #{c.booking_id}
                          {c.guest_name && (
                            <div className="text-[10px] text-black/50 font-sans font-normal">{c.guest_name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              const p = partners.find((item) => item.partner_code === c.partner_code || item.id === c.partner_id);
                              if (p) openPartnerModal(p, 'overview');
                            }}
                            className="font-mono font-bold text-black hover:underline"
                          >
                            {c.partner_code}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-black/60">
                          {formatIDR(c.booking_amount_gross)}
                        </td>
                        <td className="py-3 px-4 font-medium text-black">
                          {formatIDR(c.eligible_treatment_amount)}
                        </td>
                        <td className="py-3 px-4 text-black/60">{c.commission_rate_pct}%</td>
                        <td className="py-3 px-4 font-bold text-black">
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
                              className="rounded text-black"
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
                              className="rounded text-black"
                            />
                            <span>Completed</span>
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          {c.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                              ✓ Paid Out
                            </span>
                          ) : c.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/10 text-black border border-black/20">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                              {c.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {c.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
                                className="px-2 py-1 bg-black hover:bg-black/80 text-white rounded text-[11px] font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateCommission(c.id, { status: 'declined' })}
                                className="px-2 py-1 border border-black/20 hover:bg-black/5 text-black rounded text-[11px] font-semibold"
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
        </div>
      )}

      {/* SUB-TAB 3: GLOBAL PAYOUTS */}
      {subTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/80 font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredGlobalPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-black/50">
                        No payout records logged yet.
                      </td>
                    </tr>
                  ) : (
                    filteredGlobalPayouts.map((py) => (
                      <tr key={py.id} className="hover:bg-black/[0.02]">
                        <td className="py-3 px-4 text-black/60 whitespace-nowrap">
                          {safeFormatDate(py.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-black">{py.payout_reference}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              const p = partners.find((item) => item.partner_code === py.partner_code || item.id === py.partner_id);
                              if (p) openPartnerModal(p, 'overview');
                            }}
                            className="font-mono font-bold text-black hover:underline"
                          >
                            {py.partner_code}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-bold text-black">{formatIDR(py.amount)}</td>
                        <td className="py-3 px-4 capitalize">{py.payout_method?.replace('_', ' ')}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                            {py.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-black/60">{py.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SETTINGS */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm max-w-xl space-y-5">
          <h3 className="font-bold text-black text-sm border-b border-black/10 pb-2">
            Program Parameters & Rules
          </h3>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">
              Default Commission Rate (%)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.default_commission_rate_pct}
              onChange={(e) =>
                setSettings({ ...settings, default_commission_rate_pct: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs font-medium"
            />
            <p className="text-[11px] text-black/50 mt-1">
              Default commission applied to new partners (15% recommended).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">
              Cookie Attribution Window (Days)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={settings.cookie_duration_days}
              onChange={(e) =>
                setSettings({ ...settings, cookie_duration_days: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs font-medium"
            />
            <p className="text-[11px] text-black/50 mt-1">
              Duration for which a referred customer remains linked to the partner after clicking or scanning.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_approve_partners}
                onChange={(e) =>
                  setSettings({ ...settings, auto_approve_partners: e.target.checked })
                }
                className="rounded text-black"
              />
              <span className="text-xs font-medium text-black">
                Automatically approve new partner applications
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_program_active}
                onChange={(e) =>
                  setSettings({ ...settings, is_program_active: e.target.checked })
                }
                className="rounded text-black"
              />
              <span className="text-xs font-medium text-black">
                Partner program is active for BookTherapick
              </span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/80 transition-all shadow-sm"
            >
              Save Program Settings
            </button>
          </div>
        </form>
      )}

      {/* RECORD PAYOUT MODAL WITH ACTIVE FLOATING CALENDAR & APPROVED REFERRALS SELECTOR */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <form
            onSubmit={handleRecordPayout}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-black/15 shadow-2xl overflow-hidden"
          >
            {/* Modal Header: White Background */}
            <div className="p-4 sm:p-5 bg-white border-b border-black/10 text-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-black text-base sm:text-lg">Record Partner Payout</h3>
                {payoutSelectedPartner && (
                  <span className="font-mono font-bold text-black bg-black/5 px-2.5 py-0.5 rounded-lg text-xs border border-black/10">
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
                className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* 1. Select Partner & Partner Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Select Referral Partner *</label>
                  <select
                    required
                    value={payoutForm.partner_id}
                    onChange={(e) => handleSelectPayoutPartner(e.target.value)}
                    className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="">-- Choose Partner to Pay Out --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partner_code} - {p.first_name} {p.last_name} ({p.business_name || 'Individual'})
                      </option>
                    ))}
                  </select>
                </div>

                {payoutSelectedPartner ? (
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-black/10 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-black/60">Payout Method:</span>
                      <span className="font-semibold text-black capitalize">{payoutSelectedPartner.payout_method?.replace('_', ' ') || 'Bank Transfer'}</span>
                    </div>
                    {payoutSelectedPartner.payout_details?.bank_name ? (
                      <div className="flex justify-between">
                        <span className="text-black/60">Bank Account:</span>
                        <span className="font-mono font-semibold text-black">
                          {payoutSelectedPartner.payout_details.bank_name} - {payoutSelectedPartner.payout_details.account_number} ({payoutSelectedPartner.payout_details.account_holder})
                        </span>
                      </div>
                    ) : (
                      <div className="text-black/40">Bank account details not provided</div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-black/5">
                      <span className="text-black/60">Approved Unpaid Total:</span>
                      <span className="font-bold text-black font-mono">
                        {formatIDR(payoutApprovedCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/[0.02] p-3 rounded-xl border border-black/5 text-[11px] text-black/50 flex items-center justify-center">
                    Select a partner to view approved bookings and active calendar
                  </div>
                )}
              </div>

              {/* 2. ACTIVE FLOATING CALENDAR & APPROVED REFERRALS SELECTOR */}
              {payoutForm.partner_id && (
                <div className="space-y-3 pt-2 border-t border-black/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-2">
                        <span>Active Booking Calendar & Approved Commissions</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black font-mono">
                          {selectedCommissionIds.length} of {payoutApprovedCommissions.length} Selected
                        </span>
                      </h4>
                      <p className="text-[11px] text-black/60">
                        Click a date on the calendar to filter, or click checkboxes to include approved bookings in this payout.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={selectAllApproved}
                        className="px-2.5 py-1 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-black/80"
                      >
                        Select All Approved
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllApproved}
                        className="px-2.5 py-1 bg-black/5 hover:bg-black/10 text-black rounded-lg text-[10px] font-semibold border border-black/10"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Two-Column Grid: Left = Floating Calendar, Right = Approved Bookings Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white rounded-2xl border border-black/10 p-3 sm:p-4 shadow-2xs">
                    
                    {/* Left: Active Floating Calendar (5 cols) */}
                    <div className="md:col-span-5 space-y-2.5 border-b md:border-b-0 md:border-r border-black/10 pb-3 md:pb-0 md:pr-4">
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
                          className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-black"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <div className="font-bold text-black text-xs">
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
                          className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-black"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Mini Month Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-black/40 text-[10px]">
                        {DAYS_OF_WEEK.map((d) => (
                          <div key={d} className="py-0.5">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: payoutCalendarFirstDayOfWeek }).map((_, i) => (
                          <div key={`payout-empty-${i}`} className="h-9 rounded-lg bg-black/[0.01]" />
                        ))}

                        {Array.from({ length: payoutCalendarDaysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${payoutCalendarYear}-${String(payoutCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const approvedOnDate = payoutApprovedByDate[dateStr] || [];
                          const allOnDate = payoutAllCommsByDate[dateStr] || [];
                          const isSelected = payoutSelectedDate === dateStr;
                          const hasApproved = approvedOnDate.length > 0;
                          const hasPaid = allOnDate.some((c) => c.status === 'paid');

                          return (
                            <button
                              type="button"
                              key={`payout-date-${dateStr}`}
                              onClick={() => setPayoutSelectedDate(isSelected ? null : dateStr)}
                              className={`h-9 rounded-lg border text-left p-1 flex flex-col justify-between transition-all ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-xs'
                                  : hasApproved
                                  ? 'bg-emerald-50/60 border-emerald-400 hover:border-black text-black'
                                  : hasPaid
                                  ? 'bg-black/[0.02] border-black/10 hover:border-black/30 text-black'
                                  : 'bg-white border-black/5 hover:border-black/20 text-black/50'
                              }`}
                              title={
                                hasApproved
                                  ? `${approvedOnDate.length} approved referrals ready for payout`
                                  : `${allOnDate.length} referrals on ${dateStr}`
                              }
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : ''}`}>
                                  {dayNum}
                                </span>
                                {hasApproved && (
                                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600'}`} />
                                )}
                              </div>
                              {hasApproved ? (
                                <span className={`text-[8px] font-bold truncate ${isSelected ? 'text-white' : 'text-emerald-800'}`}>
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
                        <div className="flex items-center justify-between bg-black/5 p-2 rounded-xl text-[11px]">
                          <span>Filtered: <strong>{safeFormatDate(payoutSelectedDate)}</strong></span>
                          <button
                            type="button"
                            onClick={() => setPayoutSelectedDate(null)}
                            className="text-black underline font-semibold hover:text-black/70"
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
                            <div className="bg-[#FAF7F2] p-6 rounded-xl border border-black/5 text-center text-black/50 space-y-1">
                              <p className="font-semibold text-black">No approved referrals found{payoutSelectedDate ? ' for this date' : ''}.</p>
                              <p className="text-[11px]">Only bookings with an <strong className="text-black">Approved</strong> status can be paid out. Review pending bookings in the Partner Calendar to approve them first.</p>
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
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    isChecked
                                      ? 'bg-black/[0.03] border-black shadow-2xs'
                                      : 'bg-white border-black/10 hover:border-black/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // handled by parent div
                                      className="rounded text-black cursor-pointer"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-bold text-black text-xs">#{c.booking_id}</span>
                                        <span className="text-[10px] text-black/50">
                                          {safeFormatDate(c.booking_date || c.created_at)}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          Approved
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-black truncate mt-0.5 font-medium">
                                        {c.guest_name || 'Guest'} &bull; {c.treatment_name || 'Treatment'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-bold text-black text-xs block">
                                      +{formatIDR(c.commission_amount)}
                                    </span>
                                    <span className="text-[10px] text-black/50">
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
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPastPaidInPayoutModal((v) => !v)}
                        className="text-[11px] font-bold text-black/60 hover:text-black flex items-center gap-1.5"
                      >
                        <span>{showPastPaidInPayoutModal ? '▼ Hide' : '▶ Show'} Previously Paid Out Referrals ({payoutPaidCommissions.length})</span>
                      </button>

                      {showPastPaidInPayoutModal && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto bg-black/[0.02] p-2.5 rounded-xl border border-black/10">
                          {payoutPaidCommissions.map((c) => (
                            <div key={`paid-${c.id}`} className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-lg border border-black/5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-black">#{c.booking_id}</span>
                                <span className="text-black/50">{safeFormatDate(c.booking_date || c.created_at)}</span>
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white bg-black px-2 py-0.5 rounded-full">
                                  ✓ Paid Out
                                </span>
                              </div>
                              <span className="font-mono font-bold text-black">{formatIDR(c.commission_amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Payout Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-black/10">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Payout Amount (IDR) * {selectedCommissionIds.length > 0 && `(Auto-calculated for ${selectedCommissionIds.length} bookings)`}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 750000"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Payment Method</label>
                  <select
                    value={payoutForm.payout_method}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payout_method: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="bank_transfer">Indonesian Bank Transfer</option>
                    <option value="wise">Wise</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash Settlement</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">Notes / Transfer Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. BCA Ref #88392102"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* 4. Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-black/10">
                <button
                  type="submit"
                  disabled={actionLoading || !payoutForm.partner_id || !payoutForm.amount || Number(payoutForm.amount) <= 0}
                  className="flex-1 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/80 disabled:opacity-40 transition-all shadow-sm"
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
                  className="px-4 py-2.5 border border-black/20 text-xs font-semibold rounded-xl hover:bg-black/5 text-black"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div
            className={`bg-white rounded-2xl w-full flex flex-col border border-black/15 shadow-2xl overflow-hidden transition-all duration-200 ${
              partnerActiveTab === 'calendar'
                ? 'h-full max-w-[98vw] max-h-[96vh]'
                : 'max-w-4xl max-h-[92vh]'
            }`}
          >
            {/* Modal Header: Comfortable White Background */}
            <div className="p-4 sm:p-5 bg-white border-b border-black/10 text-black flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-black text-lg sm:text-xl tracking-tight">
                    {selectedPartnerDetails.first_name} {selectedPartnerDetails.last_name || ''}
                  </h3>
                  <span className="font-mono font-bold text-black bg-black/5 px-2.5 py-0.5 rounded-lg text-xs border border-black/10">
                    {selectedPartnerDetails.partner_code}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedPartnerDetails.status === 'active'
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black border border-black/10'
                  }`}>
                    {selectedPartnerDetails.status}
                  </span>
                </div>
                <div className="text-xs text-black/60 mt-1 flex items-center gap-2 flex-wrap">
                  {selectedPartnerDetails.business_name && (
                    <span className="text-black font-semibold">{selectedPartnerDetails.business_name}</span>
                  )}
                  <span>&bull;</span>
                  <span>Rate: <strong className="text-black font-mono">{selectedPartnerDetails.commission_rate_pct}%</strong></span>
                  <span>&bull;</span>
                  <span>Joined: {new Date(selectedPartnerDetails.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPartnerDetails(null)}
                className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black hover:text-white text-black flex items-center justify-center transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-black/10 px-4 sm:px-6 pt-2 bg-black/[0.02] shrink-0 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Contact' },
                { id: 'calendar', label: 'Calendar', count: activePartnerMetrics.bookingsCount },
                { id: 'commissions', label: 'Commissions', count: activePartnerMetrics.commissions.length },
                { id: 'payouts', label: 'Paid Out', count: activePartnerMetrics.payouts.length },
              ].map((tab) => {
                const isActive = partnerActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPartnerActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-black text-black bg-white rounded-t-xl shadow-xs'
                        : 'border-transparent text-black/60 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black text-white' : 'bg-black/10 text-black'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Tab Content (Scrollable, Clean Monochrome) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* TAB A: OVERVIEW & CONTACT (Contact and Category cleanly placed here) */}
              {partnerActiveTab === 'overview' && (
                <div className="space-y-6 text-xs">
                  
                  {/* Financial KPI Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/[0.03] p-3.5 rounded-2xl border border-black/10">
                      <span className="text-[10px] uppercase font-bold text-black/50 block">Total Commission</span>
                      <span className="text-base font-bold text-black mt-1 block">
                        {formatIDR(activePartnerMetrics.totalEarned)}
                      </span>
                      <span className="text-[10px] text-black/50">{activePartnerMetrics.commissions.length} referrals</span>
                    </div>

                    <div className="bg-black/[0.03] p-3.5 rounded-2xl border border-black/10">
                      <span className="text-[10px] uppercase font-bold text-black/50 block">Approved Unpaid</span>
                      <span className="text-base font-bold text-black mt-1 block">
                        {formatIDR(activePartnerMetrics.approvedUnpaid)}
                      </span>
                      <span className="text-[10px] text-black/50">Ready to transfer</span>
                    </div>

                    <div className="bg-black/[0.03] p-3.5 rounded-2xl border border-black/10">
                      <span className="text-[10px] uppercase font-bold text-black/50 block">Total Paid Out</span>
                      <span className="text-base font-bold text-black mt-1 block">
                        {formatIDR(activePartnerMetrics.totalPaidOut)}
                      </span>
                      <span className="text-[10px] text-black/50">{activePartnerMetrics.payouts.length} transfers</span>
                    </div>

                    <div className="bg-black/[0.03] p-3.5 rounded-2xl border border-black/10">
                      <span className="text-[10px] uppercase font-bold text-black/50 block">Pending Verification</span>
                      <span className="text-base font-bold text-black mt-1 block">
                        {formatIDR(activePartnerMetrics.pending)}
                      </span>
                      <span className="text-[10px] text-black/50">Awaiting service</span>
                    </div>
                  </div>

                  {/* Contact Information & Category Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Contact Details Card */}
                    <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
                      <h4 className="font-bold text-black text-xs uppercase tracking-wider border-b border-black/10 pb-2">
                        Partner Contact Information
                      </h4>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] border border-black/5">
                          <div>
                            <span className="text-[10px] text-black/50 block">Email Address</span>
                            <a
                              href={`mailto:${selectedPartnerDetails.email}`}
                              className="font-semibold text-black hover:underline mt-0.5 block"
                            >
                              {selectedPartnerDetails.email}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedPartnerDetails.email, 'email')}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-black/60"
                            title="Copy email"
                          >
                            {copiedId === 'email' ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] border border-black/5">
                          <div>
                            <span className="text-[10px] text-black/50 block">WhatsApp Direct Chat</span>
                            {selectedPartnerDetails.whatsapp ? (
                              <a
                                href={`https://wa.me/${selectedPartnerDetails.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-black hover:underline mt-0.5 block"
                              >
                                {selectedPartnerDetails.whatsapp}
                              </a>
                            ) : (
                              <span className="text-black/40">Not provided</span>
                            )}
                          </div>
                          {selectedPartnerDetails.whatsapp && (
                            <a
                              href={`https://wa.me/${selectedPartnerDetails.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-black/80"
                            >
                              Open WA
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] border border-black/5">
                          <div>
                            <span className="text-[10px] text-black/50 block">Phone Number</span>
                            {selectedPartnerDetails.phone ? (
                              <a href={`tel:${selectedPartnerDetails.phone}`} className="font-semibold text-black hover:underline mt-0.5 block">
                                {selectedPartnerDetails.phone}
                              </a>
                            ) : (
                              <span className="text-black/40">Not provided</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category & Business Profile Card */}
                    <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
                      <h4 className="font-bold text-black text-xs uppercase tracking-wider border-b border-black/10 pb-2">
                        Partner Category & Villa
                      </h4>

                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/5">
                          <span className="text-[10px] text-black/50 block">Category Classification</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-black text-white uppercase tracking-wider mt-1">
                            {selectedPartnerDetails.partner_type?.replace('_', ' ') || 'Hotel Villa'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/5">
                          <span className="text-[10px] text-black/50 block">Business / Villa Name</span>
                          <span className="font-semibold text-black text-xs block mt-0.5">
                            {selectedPartnerDetails.business_name || 'Individual Partner (No Villa)'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/5">
                          <span className="text-[10px] text-black/50 block">Unique Partner Referral Link</span>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="font-mono text-[10px] text-black truncate">
                              https://www.booktherapick.com/?ref={selectedPartnerDetails.partner_code}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(`https://www.booktherapick.com/?ref=${selectedPartnerDetails.partner_code}`, 'link')
                              }
                              className="p-1 rounded bg-black/5 hover:bg-black/10 text-black shrink-0"
                              title="Copy link"
                            >
                              {copiedId === 'link' ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Payout Method & Banking Details Card */}
                  <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-black/10 pb-2">
                      <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                        Payout Method & Banking Information
                      </h4>
                      <span className="font-bold uppercase tracking-wider text-[10px] text-black bg-black/5 px-2 py-0.5 rounded">
                        {selectedPartnerDetails.payout_method?.replace('_', ' ') || 'Bank Transfer'}
                      </span>
                    </div>

                    {selectedPartnerDetails.payout_details?.bank_name ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/5">
                        <div>
                          <span className="text-black/50 block text-[10px]">Bank Name</span>
                          <span className="font-bold text-black">{selectedPartnerDetails.payout_details.bank_name}</span>
                        </div>
                        <div>
                          <span className="text-black/50 block text-[10px]">Account Number</span>
                          <span className="font-mono font-bold text-black text-sm flex items-center gap-1.5">
                            <span>{selectedPartnerDetails.payout_details.account_number}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnerDetails.payout_details.account_number, 'acc')}
                              className="text-black/40 hover:text-black"
                            >
                              {copiedId === 'acc' ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </span>
                        </div>
                        <div>
                          <span className="text-black/50 block text-[10px]">Account Holder</span>
                          <span className="font-bold text-black">{selectedPartnerDetails.payout_details.account_holder}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/[0.02] border border-black/5 text-black/50">
                        No specific bank account entered yet.
                      </div>
                    )}
                  </div>

                  {/* Notes & Status Actions */}
                  <div className="bg-white p-4 rounded-2xl border border-black/10 shadow-xs space-y-3">
                    <h4 className="font-bold text-black text-xs uppercase tracking-wider">
                      Internal Partner Notes
                    </h4>
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={partnerNotesInput}
                        onChange={(e) => setPartnerNotesInput(e.target.value)}
                        placeholder="Add internal notes about this partner..."
                        className="w-full p-2.5 rounded-xl border border-black/15 text-xs focus:ring-1 focus:ring-black"
                      />
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(selectedPartnerDetails.id)}
                          className="px-3.5 py-1.5 bg-black text-white rounded-lg font-bold hover:bg-black/80"
                        >
                          Save Notes
                        </button>
                        
                        <div className="flex gap-1.5">
                          {selectedPartnerDetails.status === 'pending' && (
                            <button
                              onClick={() => handlePartnerStatus(selectedPartnerDetails.id, 'active')}
                              className="px-3 py-1.5 bg-black text-white font-bold rounded-lg hover:bg-black/80"
                            >
                              Approve Partner
                            </button>
                          )}
                          {selectedPartnerDetails.status === 'active' && (
                            <button
                              onClick={() => handlePartnerStatus(selectedPartnerDetails.id, 'suspended')}
                              className="px-3 py-1.5 border border-black/20 text-black hover:bg-black/5 font-semibold rounded-lg"
                            >
                              Suspend Partner
                            </button>
                          )}
                          {selectedPartnerDetails.status === 'suspended' && (
                            <button
                              onClick={() => handlePartnerStatus(selectedPartnerDetails.id, 'active')}
                              className="px-3 py-1.5 bg-black text-white font-semibold rounded-lg hover:bg-black/80"
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

              {/* TAB B: INDEPENDENT PARTNER CALENDAR (FULLSCREEN DESKTOP LAYOUT) */}
              {partnerActiveTab === 'calendar' && (
                <div className="space-y-4 text-xs">
                  
                  {/* Calendar Top Controls Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-3.5 rounded-2xl border border-black/10">
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
                        className="w-8 h-8 rounded-xl bg-white border border-black/15 flex items-center justify-center hover:bg-black/5 text-black"
                        title="Previous Month"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="font-bold text-black text-sm px-2">
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
                        className="w-8 h-8 rounded-xl bg-white border border-black/15 flex items-center justify-center hover:bg-black/5 text-black"
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
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/15 rounded-lg hover:bg-black/5 text-black"
                      >
                        Today
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-black/60 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-semibold text-black">
                          <span className="w-2 h-2 rounded-full bg-black inline-block" /> Paid Out
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Approved
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-amber-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Pending
                        </span>
                      </div>
                      <div className="hidden sm:block text-black/30">|</div>
                      <div>
                        Month: <strong className="text-black font-bold">{partnerMonthBookings.length}</strong> bookings (<strong className="text-black font-bold">{formatIDR(partnerMonthBookings.reduce((sum, b) => sum + Number(b.commission_amount || 0), 0))}</strong>)
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Responsive Layout: Left Calendar Grid, Right Appointments List */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* Left Column: Spacious Month Grid (lg:col-span-7 xl:col-span-8) */}
                    <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-black/10 p-3 sm:p-4 shadow-xs">
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-black/40 text-[11px] mb-2 uppercase tracking-wider">
                        {DAYS_OF_WEEK.map((d) => (
                          <div key={d} className="py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {Array.from({ length: calendarFirstDayOfWeek }).map((_, i) => (
                          <div key={`empty-${i}`} className="h-16 sm:h-20 xl:h-24 bg-black/[0.01] rounded-xl border border-transparent" />
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
                              className={`h-16 sm:h-20 xl:h-24 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-md'
                                  : dayBookings.length > 0
                                  ? 'bg-white border-black/30 hover:border-black hover:shadow-xs'
                                  : 'bg-white border-black/10 hover:border-black/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                                    isToday && !isSelected
                                      ? 'bg-black text-white'
                                      : isToday && isSelected
                                      ? 'bg-white text-black font-extrabold'
                                      : ''
                                  }`}
                                >
                                  {dayNum}
                                </span>
                                {dayBookings.length > 0 && (
                                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    isSelected ? 'bg-white text-black' : 'bg-black text-white'
                                  }`}>
                                    {dayBookings.length}
                                  </span>
                                )}
                              </div>

                              {dayBookings.length > 0 ? (
                                <div className="space-y-1">
                                  <div className={`text-[9px] sm:text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-black'}`}>
                                    {formatIDR(dayCommSum)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {hasPaid && (
                                      <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-black'}`}
                                        title="Paid Out"
                                      />
                                    )}
                                    {hasApproved && (
                                      <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`}
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

                    {/* Right Column: Appointments List for Selected Date or Month (lg:col-span-5 xl:col-span-4) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-3">
                      <div className="flex items-center justify-between bg-[#FAF7F2] p-3 rounded-xl border border-black/10">
                        <div>
                          <h4 className="font-bold text-black text-xs">
                            {partnerSelectedDate
                              ? safeFormatDate(partnerSelectedDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                              : `All in ${MONTH_NAMES[partnerCalendarMonth]} ${partnerCalendarYear}`}
                          </h4>
                          <span className="text-[11px] text-black/60">
                            {(partnerSelectedDate ? (partnerBookingsByDate[partnerSelectedDate]?.length || 0) : partnerMonthBookings.length)} bookings
                          </span>
                        </div>
                        {partnerSelectedDate && (
                          <button
                            type="button"
                            onClick={() => setPartnerSelectedDate(null)}
                            className="text-[11px] font-semibold text-black hover:underline"
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
                            <div className="bg-black/[0.02] p-8 rounded-2xl border border-black/5 text-center text-black/50">
                              No appointments found for this period.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5 max-h-[calc(96vh-240px)] overflow-y-auto pr-1">
                            {displayedList.map((b) => (
                              <div
                                key={b.id}
                                className="bg-white p-3.5 rounded-2xl border border-black/10 shadow-xs space-y-2.5 hover:border-black/30 transition-all"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-mono font-bold text-black text-xs flex items-center gap-1.5">
                                      <span>#{b.booking_id}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(b.booking_id, `bk-${b.id}`)}
                                        className="text-black/40 hover:text-black"
                                      >
                                        {copiedId === `bk-${b.id}` ? <Check size={11} /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                    <div className="text-[11px] font-semibold text-black mt-0.5">
                                      {b.guest_name || 'Guest'}
                                    </div>
                                    {b.location && (
                                      <div className="text-[10px] text-black/50 mt-0.5">
                                        {b.location} {b.room_number ? `(${b.room_number})` : ''}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-right">
                                    {b.status === 'paid' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white">
                                        <CheckCircle2 size={10} /> Paid Out
                                      </span>
                                    ) : b.status === 'approved' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                        <CheckCircle2 size={10} /> Approved
                                      </span>
                                    ) : b.status === 'declined' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-300">
                                        Declined
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                        <Clock size={10} /> Pending
                                      </span>
                                    )}
                                    <div className="text-[10px] text-black/50 mt-1">
                                      {safeFormatDate(b.booking_date || b.created_at)} {b.booking_time || ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-black/5 pt-2 flex items-center justify-between text-[11px]">
                                  <div>
                                    <span className="text-black/50 block text-[10px]">{b.treatment_name || 'Treatment'}</span>
                                    <span className="font-medium text-black">Net: {formatIDR(b.eligible_treatment_amount)}</span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-black/50 block text-[10px]">Commission ({b.commission_rate_pct}%)</span>
                                    <span className="font-bold text-black">{formatIDR(b.commission_amount)}</span>
                                  </div>
                                </div>

                                {/* Admin Verification Checkboxes & Approval */}
                                <div className="border-t border-black/5 pt-2 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={b.payment_verified}
                                        onChange={(e) =>
                                          handleUpdateCommission(b.id, { payment_verified: e.target.checked })
                                        }
                                        className="rounded text-black"
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
                                        className="rounded text-black"
                                      />
                                      <span>Service Done</span>
                                    </label>
                                  </div>

                                  {b.status === 'pending' && (
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCommission(b.id, { status: 'approved' })}
                                        className="px-2.5 py-1 bg-black hover:bg-black/80 text-white rounded text-[10px] font-bold"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCommission(b.id, { status: 'declined' })}
                                        className="px-2 py-1 border border-black/20 hover:bg-black/5 text-black rounded text-[10px] font-bold"
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-black/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50 block tracking-wider">
                        Partner Commission Rate
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
                                className="w-24 px-3 py-1.5 bg-white border border-black/30 rounded-lg text-sm font-bold text-black focus:outline-none focus:border-black"
                                autoFocus
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 font-bold text-xs">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveCommissionRate(selectedPartnerDetails.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-black/80 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRateId(null)}
                              className="px-2.5 py-1.5 border border-black/20 text-xs font-semibold rounded-lg hover:bg-black/5 text-black"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl font-mono font-extrabold text-black">
                              {selectedPartnerDetails.commission_rate_pct}%
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRateId(selectedPartnerDetails.id);
                                setNewRateValue(selectedPartnerDetails.commission_rate_pct);
                              }}
                              className="px-3 py-1 rounded-lg border border-black/15 bg-white hover:bg-black/5 text-black text-xs font-semibold shadow-xs"
                            >
                              Edit Rate
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-black/50 mt-1 block">
                        Commission percentage automatically applied to new bookings referred by {selectedPartnerDetails.partner_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-black/10 self-start sm:self-auto">
                      {['all', 'pending', 'approved', 'paid', 'declined'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setPartnerCommFilter(st)}
                          className={`px-2.5 py-1 rounded-lg capitalize font-medium text-xs transition-colors ${
                            partnerCommFilter === st
                              ? 'bg-black text-white'
                              : 'text-black/60 hover:bg-black/5'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/80 font-bold">
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
                      <tbody className="divide-y divide-black/5">
                        {activePartnerMetrics.commissions
                          .filter((c) => partnerCommFilter === 'all' || c.status === partnerCommFilter)
                          .length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-black/50">
                              No commissions found for this filter.
                            </td>
                          </tr>
                        ) : (
                          activePartnerMetrics.commissions
                            .filter((c) => partnerCommFilter === 'all' || c.status === partnerCommFilter)
                            .map((c) => (
                              <tr key={c.id} className="hover:bg-black/[0.02]">
                                <td className="py-2.5 px-3 text-black/60 whitespace-nowrap">
                                  {safeFormatDate(c.booking_date || c.created_at)}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-black">
                                  #{c.booking_id}
                                </td>
                                <td className="py-2.5 px-3">{formatIDR(c.eligible_treatment_amount)}</td>
                                <td className="py-2.5 px-3 font-mono">{c.commission_rate_pct}%</td>
                                <td className="py-2.5 px-3 font-bold text-black">{formatIDR(c.commission_amount)}</td>
                                <td className="py-2.5 px-3 space-y-0.5 text-[10px]">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={c.payment_verified}
                                      onChange={(e) =>
                                        handleUpdateCommission(c.id, { payment_verified: e.target.checked })
                                      }
                                      className="rounded text-black"
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
                                      className="rounded text-black"
                                    />
                                    <span>Service Done</span>
                                  </label>
                                </td>
                                <td className="py-2.5 px-3">
                                  {c.status === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white">
                                      <CheckCircle2 size={10} /> Paid Out
                                    </span>
                                  ) : c.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 size={10} /> Approved
                                    </span>
                                  ) : c.status === 'declined' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-300">
                                      Declined
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                      <Clock size={10} /> Pending
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                                  {c.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCommission(c.id, { status: 'approved' })}
                                        className="px-2.5 py-1 bg-black hover:bg-black/80 text-white rounded text-[10px] font-semibold"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCommission(c.id, { status: 'declined' })}
                                        className="px-2.5 py-1 border border-black/20 hover:bg-black/5 text-black rounded text-[10px] font-semibold"
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
                  <div className="flex items-center justify-between bg-[#FAF7F2] p-4 rounded-2xl border border-black/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-black/50 block">Approved Balance Ready for Payout</span>
                      <span className="text-lg font-bold text-black mt-0.5 block">
                        {formatIDR(activePartnerMetrics.approvedUnpaid)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openQuickPayoutForPartner(selectedPartnerDetails)}
                      className="px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-black/80 shadow-sm"
                    >
                      + Record Payout for {selectedPartnerDetails.first_name}
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] border-b border-black/10 text-black/80 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {activePartnerMetrics.payouts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-black/50">
                              No payouts logged for this partner yet.
                            </td>
                          </tr>
                        ) : (
                          activePartnerMetrics.payouts.map((py) => (
                            <tr key={py.id} className="hover:bg-black/[0.02]">
                              <td className="py-2.5 px-3 text-black/60 whitespace-nowrap">
                                {safeFormatDate(py.created_at)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-black">{py.payout_reference}</td>
                              <td className="py-2.5 px-3 font-bold text-black">{formatIDR(py.amount)}</td>
                              <td className="py-2.5 px-3 capitalize">{py.payout_method?.replace('_', ' ')}</td>
                              <td className="py-2.5 px-3">
                                {py.status === 'completed' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white">
                                    <CheckCircle2 size={10} /> Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/10">
                                    {py.status}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-black/60">{py.notes || '-'}</td>
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
            <div className="p-4 border-t border-black/10 bg-black/[0.02] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-black/50 font-mono">
                ID: {selectedPartnerDetails.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPartnerDetails(null)}
                className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-black/80"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
